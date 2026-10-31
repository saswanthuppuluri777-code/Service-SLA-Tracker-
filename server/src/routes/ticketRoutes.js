import express from 'express';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { SLAPolicy } from '../models/SLAPolicy.js';
import {
  findMatchingPolicy,
  calculateDeadlines,
  evaluateTicketSLA,
  recalculateTicketSLA,
  generateTicketNumber,
  scanAndEscalateAllTickets,
} from '../services/slaEngine.js';

const router = express.Router();

/**
 * GET /api/tickets
 * Supports query filters: status, priority, team, assignedAgent, slaStatus, category, search, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      team,
      assignedAgent,
      slaStatus,
      category,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (team && team !== 'all') {
      filter.assignedTeam = team;
    }

    if (category && category !== 'all') {
      filter.issueCategory = category;
    }

    if (slaStatus && slaStatus !== 'all') {
      filter.slaStatus = slaStatus;
    }

    if (assignedAgent) {
      if (assignedAgent === 'unassigned') {
        filter.assignedAgent = null;
      } else if (assignedAgent !== 'all') {
        filter.assignedAgent = assignedAgent;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { ticketNumber: searchRegex },
        { customerReference: searchRegex },
        { subject: searchRegex },
        { description: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * pageSize;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [tickets, totalCount] = await Promise.all([
      Ticket.find(filter)
        .populate('assignedAgent', 'name email role team avatar')
        .populate('slaPolicyId', 'name firstResponseTimeMinutes resolutionTimeMinutes')
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize),
      Ticket.countDocuments(filter),
    ]);

    // Dynamically evaluate SLA status for active tickets so client gets real-time SLA state
    const now = new Date();
    const evaluatedTickets = tickets.map((t) => {
      const ticketObj = t.toObject();
      if (!['Resolved', 'Closed'].includes(ticketObj.status)) {
        const liveEval = evaluateTicketSLA(t, now);
        ticketObj.slaStatus = liveEval.slaStatus;
      }
      return ticketObj;
    });

    res.json({
      success: true,
      data: evaluatedTickets,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tickets
 * Create a new support ticket. Automatically links matching SLA policy,
 * computes firstResponseDue and resolutionDue timestamps, and creates initial audit log entry.
 */
router.post('/', async (req, res) => {
  try {
    const {
      customerReference,
      issueCategory,
      priority,
      subject,
      description,
      assignedTeam,
      assignedAgent,
      slaPolicyId,
      createdBy = 'Agent / Customer Portal',
    } = req.body;

    if (!customerReference || !issueCategory || !priority || !subject || !description || !assignedTeam) {
      return res.status(400).json({
        success: false,
        error: 'Missing required ticket fields: customerReference, issueCategory, priority, subject, description, assignedTeam',
      });
    }

    // Resolve SLA policy
    let policy;
    if (slaPolicyId) {
      policy = await SLAPolicy.findById(slaPolicyId);
    }
    if (!policy) {
      policy = await findMatchingPolicy(priority, issueCategory);
    }

    const createdAt = new Date();
    const { firstResponseDue, resolutionDue } = calculateDeadlines(createdAt, policy);
    const ticketNumber = await generateTicketNumber();

    const newTicket = new Ticket({
      ticketNumber,
      customerReference,
      issueCategory,
      priority,
      subject,
      description,
      status: 'Open',
      assignedTeam,
      assignedAgent: assignedAgent || null,
      slaPolicyId: policy._id || null,
      createdAt,
      firstResponseDue,
      firstResponseAt: null,
      resolutionDue,
      resolvedAt: null,
      slaStatus: 'On Track',
      history: [
        {
          changedBy: createdBy,
          action: 'CREATED',
          previousValue: '',
          newValue: `Ticket created with ${priority} priority under ${policy.name || 'Standard SLA'}`,
          timestamp: createdAt,
        },
      ],
      escalationLog: [],
      comments: [],
    });

    // Initial evaluation
    const initialEval = evaluateTicketSLA(newTicket, createdAt);
    newTicket.slaStatus = initialEval.slaStatus;

    await newTicket.save();

    const populatedTicket = await Ticket.findById(newTicket._id)
      .populate('assignedAgent', 'name email role team avatar')
      .populate('slaPolicyId', 'name firstResponseTimeMinutes resolutionTimeMinutes');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: populatedTicket,
    });
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/tickets/:id
 * Retrieve single ticket details, full audit history, and escalation logs.
 */
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedAgent', 'name email role team avatar')
      .populate('slaPolicyId', 'name priority category firstResponseTimeMinutes resolutionTimeMinutes isActive');

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Dynamic SLA evaluation for real-time accuracy
    const now = new Date();
    const evalResult = evaluateTicketSLA(ticket, now);
    const ticketObj = ticket.toObject();
    if (!['Resolved', 'Closed'].includes(ticket.status)) {
      ticketObj.slaStatus = evalResult.slaStatus;
    }

    res.json({
      success: true,
      data: ticketObj,
    });
  } catch (err) {
    console.error('Error fetching ticket details:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/tickets/:id
 * Update ticket fields (status, priority, description, assignedAgent, assignedTeam).
 * Recalculates SLA targets if priority changes and logs changes in ticket history.
 */
router.patch('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const {
      status,
      priority,
      issueCategory,
      description,
      subject,
      assignedAgent,
      assignedTeam,
      changedBy = 'Support Staff',
    } = req.body;

    const now = new Date();

    // 1. Priority or Category change -> Recalculate SLA targets
    if ((priority && priority !== ticket.priority) || (issueCategory && issueCategory !== ticket.issueCategory)) {
      await recalculateTicketSLA(ticket, priority, issueCategory, changedBy);
    }

    // 2. Status change
    if (status && status !== ticket.status) {
      const prevStatus = ticket.status;
      ticket.status = status;

      if (['Resolved', 'Closed'].includes(status) && !ticket.resolvedAt) {
        ticket.resolvedAt = now;
      } else if (['Open', 'In Progress', 'Pending', 'Reopened'].includes(status) && prevStatus === 'Resolved') {
        // Reopening
        ticket.resolvedAt = null;
      }

      ticket.history.push({
        changedBy,
        action: 'STATUS_CHANGE',
        previousValue: prevStatus,
        newValue: status,
        timestamp: now,
      });
    }

    // 3. Agent assignment change
    if (assignedAgent !== undefined && String(assignedAgent) !== String(ticket.assignedAgent)) {
      const prevAgentId = ticket.assignedAgent;
      let prevAgentName = 'Unassigned';
      if (prevAgentId) {
        const prevAgent = await User.findById(prevAgentId);
        if (prevAgent) prevAgentName = prevAgent.name;
      }

      let newAgentName = 'Unassigned';
      if (assignedAgent) {
        const newAgent = await User.findById(assignedAgent);
        if (newAgent) newAgentName = newAgent.name;
      }

      ticket.assignedAgent = assignedAgent || null;

      ticket.history.push({
        changedBy,
        action: 'ASSIGNED',
        previousValue: prevAgentName,
        newValue: newAgentName,
        timestamp: now,
      });
    }

    // 4. Team assignment change
    if (assignedTeam && assignedTeam !== ticket.assignedTeam) {
      ticket.history.push({
        changedBy,
        action: 'TEAM_CHANGE',
        previousValue: ticket.assignedTeam,
        newValue: assignedTeam,
        timestamp: now,
      });
      ticket.assignedTeam = assignedTeam;
    }

    // 5. Subject / Description change
    if (subject && subject !== ticket.subject) {
      ticket.history.push({
        changedBy,
        action: 'SUBJECT_UPDATE',
        previousValue: ticket.subject,
        newValue: subject,
        timestamp: now,
      });
      ticket.subject = subject;
    }

    if (description && description !== ticket.description) {
      ticket.description = description;
    }

    // Re-evaluate SLA status
    const evalResult = evaluateTicketSLA(ticket, now);
    ticket.slaStatus = evalResult.slaStatus;

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate('assignedAgent', 'name email role team avatar')
      .populate('slaPolicyId', 'name priority category firstResponseTimeMinutes resolutionTimeMinutes isActive');

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tickets/:id/comments
 * Add an internal note or public response.
 * If it's the first agent response, updates firstResponseAt and evaluates SLA compliance.
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { content, authorId, authorName, authorRole = 'agent', isInternal = false } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Comment content cannot be empty' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const now = new Date();

    // Add comment to ticket
    const newComment = {
      author: authorId || null,
      authorName: authorName || 'Support Agent',
      authorRole,
      content: content.trim(),
      isInternal: Boolean(isInternal),
      createdAt: now,
    };
    ticket.comments.push(newComment);

    // If it's a public reply and first response hasn't occurred yet, mark first response
    let firstResponseTriggered = false;
    if (!isInternal && !ticket.firstResponseAt) {
      ticket.firstResponseAt = now;
      firstResponseTriggered = true;

      const metDeadline = now.getTime() <= new Date(ticket.firstResponseDue).getTime();
      const delayMinutes = Math.round((now.getTime() - new Date(ticket.firstResponseDue).getTime()) / 60000);

      ticket.history.push({
        changedBy: authorName || 'Support Agent',
        action: 'FIRST_RESPONSE',
        previousValue: 'Pending First Response',
        newValue: metDeadline
          ? `First response recorded on time (${new Date(now).toLocaleTimeString()})`
          : `First response recorded BREACHED by ${delayMinutes} minutes`,
        timestamp: now,
      });

      // If status is Open, move it to In Progress automatically
      if (ticket.status === 'Open') {
        ticket.status = 'In Progress';
        ticket.history.push({
          changedBy: 'System Automation',
          action: 'STATUS_CHANGE',
          previousValue: 'Open',
          newValue: 'In Progress',
          timestamp: now,
        });
      }
    } else {
      ticket.history.push({
        changedBy: authorName || 'Support Agent',
        action: isInternal ? 'INTERNAL_NOTE_ADDED' : 'PUBLIC_REPLY_ADDED',
        previousValue: '',
        newValue: content.trim().length > 60 ? content.trim().slice(0, 57) + '...' : content.trim(),
        timestamp: now,
      });
    }

    // Re-evaluate SLA status
    const evalResult = evaluateTicketSLA(ticket, now);
    ticket.slaStatus = evalResult.slaStatus;

    await ticket.save();

    const updated = await Ticket.findById(ticket._id)
      .populate('assignedAgent', 'name email role team avatar')
      .populate('slaPolicyId', 'name priority category firstResponseTimeMinutes resolutionTimeMinutes isActive');

    res.status(201).json({
      success: true,
      message: firstResponseTriggered
        ? 'Response sent and first response SLA timestamp recorded!'
        : isInternal
        ? 'Internal note saved'
        : 'Public response sent',
      firstResponseTriggered,
      data: updated,
    });
  } catch (err) {
    console.error('Error adding comment to ticket:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tickets/scan-sla
 * Background or manual trigger to evaluate all active tickets and record escalations
 */
router.post('/scan-sla', async (req, res) => {
  try {
    const updatedCount = await scanAndEscalateAllTickets();
    res.json({
      success: true,
      message: `SLA scan completed. ${updatedCount} ticket(s) updated with new SLA statuses or escalations.`,
      updatedCount,
    });
  } catch (err) {
    console.error('Error scanning SLAs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
