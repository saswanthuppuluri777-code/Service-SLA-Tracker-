import { SLAPolicy } from '../models/SLAPolicy.js';
import { Ticket } from '../models/Ticket.js';

/**
 * Finds the best matching active SLA policy for given priority and category.
 */
export async function findMatchingPolicy(priority, category) {
  // 1. Exact match (Priority + Category)
  let policy = await SLAPolicy.findOne({ priority, category, isActive: true });
  if (policy) return policy;

  // 2. Priority match
  policy = await SLAPolicy.findOne({ priority, isActive: true });
  if (policy) return policy;

  // 3. Fallback to any active policy
  policy = await SLAPolicy.findOne({ isActive: true });
  if (policy) return policy;

  // 4. Default in-memory object if no policies exist in DB
  return {
    _id: null,
    name: 'Default Fallback SLA',
    priority: priority || 'Medium',
    category: category || 'General',
    firstResponseTimeMinutes: priority === 'Urgent' ? 15 : priority === 'High' ? 60 : priority === 'Medium' ? 120 : 240,
    resolutionTimeMinutes: priority === 'Urgent' ? 240 : priority === 'High' ? 720 : priority === 'Medium' ? 1440 : 2880,
    isActive: true,
  };
}

/**
 * Calculates deadline dates based on createdAt and SLA policy minutes.
 */
export function calculateDeadlines(createdAt, policy) {
  const createdTime = new Date(createdAt).getTime();
  const firstResponseDue = new Date(createdTime + policy.firstResponseTimeMinutes * 60 * 1000);
  const resolutionDue = new Date(createdTime + policy.resolutionTimeMinutes * 60 * 1000);

  return { firstResponseDue, resolutionDue };
}

/**
 * Evaluates the SLA status for a given ticket at a specific point in time.
 * Returns { slaStatus: 'On Track' | 'At Risk' | 'Breached', thresholdCrossed: string | null }
 */
export function evaluateTicketSLA(ticket, now = new Date()) {
  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const isResolvedOrClosed = ['Resolved', 'Closed'].includes(ticket.status);

  // If already resolved/closed, evaluate historical compliance
  if (isResolvedOrClosed) {
    const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : currentTime;
    const resDueTime = new Date(ticket.resolutionDue).getTime();
    const firstRespDueTime = new Date(ticket.firstResponseDue).getTime();
    const firstRespTime = ticket.firstResponseAt ? new Date(ticket.firstResponseAt).getTime() : null;

    const breachedResolution = resolvedTime > resDueTime;
    const breachedResponse = firstRespTime ? firstRespTime > firstRespDueTime : (!ticket.firstResponseAt && resolvedTime > firstRespDueTime);

    if (breachedResolution || breachedResponse) {
      return { slaStatus: 'Breached', thresholdCrossed: null };
    }
    return { slaStatus: 'On Track', thresholdCrossed: null };
  }

  // Active tickets evaluation
  const firstRespDueTime = new Date(ticket.firstResponseDue).getTime();
  const resDueTime = new Date(ticket.resolutionDue).getTime();
  const createdTime = new Date(ticket.createdAt).getTime();

  // 1. Check Breaches
  if (!ticket.firstResponseAt && currentTime > firstRespDueTime) {
    return {
      slaStatus: 'Breached',
      thresholdCrossed: 'First Response Breached',
      details: `First response deadline exceeded by ${Math.round((currentTime - firstRespDueTime) / 60000)} minutes`,
    };
  }

  if (currentTime > resDueTime) {
    return {
      slaStatus: 'Breached',
      thresholdCrossed: 'Resolution Breached',
      details: `Resolution deadline exceeded by ${Math.round((currentTime - resDueTime) / 60000)} minutes`,
    };
  }

  // 2. Check At Risk (remaining time <= 20% of total SLA window, or minimum buffer)
  // First Response At Risk check
  if (!ticket.firstResponseAt) {
    const totalRespWindow = firstRespDueTime - createdTime;
    const remainingResp = firstRespDueTime - currentTime;
    const atRiskRespThreshold = Math.max(0.2 * totalRespWindow, 15 * 60 * 1000); // 20% or 15 mins

    if (remainingResp > 0 && remainingResp <= atRiskRespThreshold) {
      return {
        slaStatus: 'At Risk',
        thresholdCrossed: 'First Response At Risk',
        details: `First response due in ${Math.round(remainingResp / 60000)} minutes (< 20% remaining)`,
      };
    }
  }

  // Resolution At Risk check
  const totalResWindow = resDueTime - createdTime;
  const remainingRes = resDueTime - currentTime;
  const atRiskResThreshold = Math.max(0.2 * totalResWindow, 30 * 60 * 1000); // 20% or 30 mins

  if (remainingRes > 0 && remainingRes <= atRiskResThreshold) {
    return {
      slaStatus: 'At Risk',
      thresholdCrossed: 'Resolution At Risk',
      details: `Resolution due in ${Math.round(remainingRes / 60000)} minutes (< 20% remaining)`,
    };
  }

  return { slaStatus: 'On Track', thresholdCrossed: null };
}

/**
 * Recalculates ticket deadlines when priority or category changes.
 */
export async function recalculateTicketSLA(ticket, newPriority, newCategory, changedBy = 'System') {
  const targetPriority = newPriority || ticket.priority;
  const targetCategory = newCategory || ticket.issueCategory;

  const policy = await findMatchingPolicy(targetPriority, targetCategory);

  const prevPriority = ticket.priority;
  const prevCategory = ticket.issueCategory;
  const prevRespDue = ticket.firstResponseDue;
  const prevResDue = ticket.resolutionDue;

  ticket.priority = targetPriority;
  ticket.issueCategory = targetCategory;
  if (policy._id) {
    ticket.slaPolicyId = policy._id;
  }

  // Calculate new deadlines
  const { firstResponseDue, resolutionDue } = calculateDeadlines(ticket.createdAt, policy);
  ticket.firstResponseDue = firstResponseDue;
  ticket.resolutionDue = resolutionDue;

  // Re-evaluate SLA status
  const evalResult = evaluateTicketSLA(ticket, new Date());
  const prevSlaStatus = ticket.slaStatus;
  ticket.slaStatus = evalResult.slaStatus;

  // Log priority change
  if (prevPriority !== targetPriority) {
    ticket.history.push({
      changedBy,
      action: 'PRIORITY_CHANGE',
      previousValue: prevPriority,
      newValue: targetPriority,
      timestamp: new Date(),
    });
  }

  // Log SLA recalculation
  ticket.history.push({
    changedBy,
    action: 'SLA_RECALCULATED',
    previousValue: `Policy: ${prevPriority}/${prevCategory} | Resp: ${new Date(prevRespDue).toLocaleTimeString()} | Res: ${new Date(prevResDue).toLocaleTimeString()}`,
    newValue: `Policy: ${policy.name} (${targetPriority}/${targetCategory}) | Resp: ${new Date(firstResponseDue).toLocaleTimeString()} | Res: ${new Date(resolutionDue).toLocaleTimeString()}`,
    timestamp: new Date(),
  });

  // If status changed or threshold crossed, record escalation
  if (evalResult.thresholdCrossed) {
    ticket.escalationLog.push({
      thresholdCrossed: evalResult.thresholdCrossed,
      simulatedNotificationSent: true,
      details: evalResult.details || `Priority updated to ${targetPriority}`,
      timestamp: new Date(),
    });
  }

  return ticket;
}

/**
 * Auto-generates the next sequential ticket number like TICK-1001
 */
export async function generateTicketNumber() {
  const latestTicket = await Ticket.findOne({}, {}, { sort: { createdAt: -1 } });
  if (!latestTicket || !latestTicket.ticketNumber) {
    return 'TICK-1001';
  }

  const match = latestTicket.ticketNumber.match(/TICK-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `TICK-${nextNum}`;
  }

  return `TICK-${Date.now().toString().slice(-4)}`;
}

/**
 * Scans all active tickets, checks SLA thresholds, updates status, and appends escalation logs.
 */
export async function scanAndEscalateAllTickets() {
  const now = new Date();
  const activeTickets = await Ticket.find({
    status: { $nin: ['Resolved', 'Closed'] },
  });

  let updatedCount = 0;

  for (const ticket of activeTickets) {
    const evalResult = evaluateTicketSLA(ticket, now);
    let changed = false;

    if (evalResult.slaStatus !== ticket.slaStatus) {
      ticket.history.push({
        changedBy: 'SLA Background Monitor',
        action: 'SLA_STATUS_CHANGE',
        previousValue: ticket.slaStatus,
        newValue: evalResult.slaStatus,
        timestamp: now,
      });
      ticket.slaStatus = evalResult.slaStatus;
      changed = true;
    }

    if (evalResult.thresholdCrossed) {
      // Check if this threshold was already logged recently to avoid duplicates
      const alreadyLogged = ticket.escalationLog.some(
        (log) => log.thresholdCrossed === evalResult.thresholdCrossed
      );

      if (!alreadyLogged) {
        ticket.escalationLog.push({
          thresholdCrossed: evalResult.thresholdCrossed,
          simulatedNotificationSent: true,
          details: evalResult.details,
          timestamp: now,
        });

        console.log(`[ESCALATION TRIGGERED] Ticket ${ticket.ticketNumber} crossed threshold: ${evalResult.thresholdCrossed} - Simulated alert sent.`);
        changed = true;
      }
    }

    if (changed) {
      await ticket.save();
      updatedCount++;
    }
  }

  return updatedCount;
}
