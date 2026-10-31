import express from 'express';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { evaluateTicketSLA } from '../services/slaEngine.js';

const router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Returns aggregated dashboard metrics:
 * - Total Open Tickets
 * - SLA Breaches (Count & Percentage)
 * - At-Risk Tickets Count
 * - Average First Response Time (in minutes)
 * - Average Resolution Time (in minutes)
 * - Workload distribution per team/agent
 * - Status and priority distributions
 */
router.get('/metrics', async (req, res) => {
  try {
    const allTickets = await Ticket.find()
      .populate('assignedAgent', 'name email role team avatar')
      .populate('slaPolicyId', 'name priority category');

    const now = new Date();
    const totalTickets = allTickets.length;

    let totalOpen = 0;
    let onTrackCount = 0;
    let atRiskCount = 0;
    let breachedCount = 0;

    let totalFirstResponseMinutes = 0;
    let respondedTicketsCount = 0;

    let totalResolutionMinutes = 0;
    let resolvedTicketsCount = 0;

    const teamWorkload = {};
    const agentWorkload = {};
    const statusCounts = {
      Open: 0,
      'In Progress': 0,
      Pending: 0,
      Resolved: 0,
      Closed: 0,
      Reopened: 0,
    };
    const priorityCounts = {
      Urgent: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    const recentEscalations = [];
    const urgentTickets = [];

    allTickets.forEach((ticket) => {
      // Live SLA calculation
      let currentSlaStatus = ticket.slaStatus;
      if (!['Resolved', 'Closed'].includes(ticket.status)) {
        const liveEval = evaluateTicketSLA(ticket, now);
        currentSlaStatus = liveEval.slaStatus;
      }

      // Counts
      if (['Open', 'In Progress', 'Pending', 'Reopened'].includes(ticket.status)) {
        totalOpen++;
      }

      if (currentSlaStatus === 'Breached') breachedCount++;
      else if (currentSlaStatus === 'At Risk') atRiskCount++;
      else onTrackCount++;

      // Status
      if (statusCounts[ticket.status] !== undefined) {
        statusCounts[ticket.status]++;
      }

      // Priority
      if (priorityCounts[ticket.priority] !== undefined) {
        priorityCounts[ticket.priority]++;
      }

      // Response times (for tickets that received a response)
      if (ticket.firstResponseAt) {
        const diffMinutes = Math.max(
          0,
          Math.round((new Date(ticket.firstResponseAt).getTime() - new Date(ticket.createdAt).getTime()) / 60000)
        );
        totalFirstResponseMinutes += diffMinutes;
        respondedTicketsCount++;
      }

      // Resolution times (for resolved or closed tickets)
      if (ticket.resolvedAt) {
        const diffMinutes = Math.max(
          0,
          Math.round((new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) / 60000)
        );
        totalResolutionMinutes += diffMinutes;
        resolvedTicketsCount++;
      }

      // Team Workload
      const team = ticket.assignedTeam || 'Unassigned Team';
      if (!teamWorkload[team]) {
        teamWorkload[team] = { total: 0, open: 0, atRisk: 0, breached: 0, onTrack: 0 };
      }
      teamWorkload[team].total++;
      if (['Open', 'In Progress', 'Pending', 'Reopened'].includes(ticket.status)) {
        teamWorkload[team].open++;
      }
      if (currentSlaStatus === 'Breached') teamWorkload[team].breached++;
      else if (currentSlaStatus === 'At Risk') teamWorkload[team].atRisk++;
      else teamWorkload[team].onTrack++;

      // Agent Workload
      const agentKey = ticket.assignedAgent ? ticket.assignedAgent._id.toString() : 'unassigned';
      const agentName = ticket.assignedAgent ? ticket.assignedAgent.name : 'Unassigned';
      if (!agentWorkload[agentKey]) {
        agentWorkload[agentKey] = {
          agentId: ticket.assignedAgent ? ticket.assignedAgent._id : null,
          name: agentName,
          team: ticket.assignedAgent ? ticket.assignedAgent.team : 'N/A',
          avatar: ticket.assignedAgent ? ticket.assignedAgent.avatar : '',
          total: 0,
          open: 0,
          atRisk: 0,
          breached: 0,
        };
      }
      agentWorkload[agentKey].total++;
      if (['Open', 'In Progress', 'Pending', 'Reopened'].includes(ticket.status)) {
        agentWorkload[agentKey].open++;
      }
      if (currentSlaStatus === 'Breached') agentWorkload[agentKey].breached++;
      else if (currentSlaStatus === 'At Risk') agentWorkload[agentKey].atRisk++;

      // Collect escalation logs
      if (ticket.escalationLog && ticket.escalationLog.length > 0) {
        ticket.escalationLog.forEach((log) => {
          recentEscalations.push({
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            priority: ticket.priority,
            thresholdCrossed: log.thresholdCrossed,
            details: log.details,
            timestamp: log.timestamp,
          });
        });
      }

      // Urgent attention tickets (Breached or At Risk and not closed)
      if (['Breached', 'At Risk'].includes(currentSlaStatus) && !['Resolved', 'Closed'].includes(ticket.status)) {
        urgentTickets.push({
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          customerReference: ticket.customerReference,
          subject: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          slaStatus: currentSlaStatus,
          firstResponseDue: ticket.firstResponseDue,
          firstResponseAt: ticket.firstResponseAt,
          resolutionDue: ticket.resolutionDue,
          assignedAgent: ticket.assignedAgent,
          assignedTeam: ticket.assignedTeam,
        });
      }
    });

    // Calculate Averages
    const avgFirstResponseMinutes = respondedTicketsCount > 0
      ? Math.round((totalFirstResponseMinutes / respondedTicketsCount) * 10) / 10
      : 0;

    const avgResolutionMinutes = resolvedTicketsCount > 0
      ? Math.round((totalResolutionMinutes / resolvedTicketsCount) * 10) / 10
      : 0;

    const breachPercentage = totalTickets > 0
      ? Math.round((breachedCount / totalTickets) * 1000) / 10
      : 0;

    const complianceRate = totalTickets > 0
      ? Math.round(((totalTickets - breachedCount) / totalTickets) * 1000) / 10
      : 100;

    // Sort recent escalations newest first (limit 15)
    recentEscalations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Sort urgent tickets by priority and resolutionDue
    urgentTickets.sort((a, b) => new Date(a.resolutionDue) - new Date(b.resolutionDue));

    res.json({
      success: true,
      data: {
        totalTickets,
        totalOpenTickets: totalOpen,
        slaBreaches: {
          count: breachedCount,
          percentage: breachPercentage,
        },
        atRiskTicketsCount: atRiskCount,
        onTrackTicketsCount: onTrackCount,
        complianceRate,
        averageFirstResponseTimeMinutes: avgFirstResponseMinutes,
        averageResolutionTimeMinutes: avgResolutionMinutes,
        workloadByTeam: teamWorkload,
        workloadByAgent: Object.values(agentWorkload),
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts,
        slaStatusDistribution: {
          'On Track': onTrackCount,
          'At Risk': atRiskCount,
          Breached: breachedCount,
        },
        recentEscalations: recentEscalations.slice(0, 10),
        urgentTickets: urgentTickets.slice(0, 8),
      },
    });
  } catch (err) {
    console.error('Error computing dashboard metrics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
