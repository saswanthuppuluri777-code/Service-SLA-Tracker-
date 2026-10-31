import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { SLAPolicy } from '../src/models/SLAPolicy.js';
import { Ticket } from '../src/models/Ticket.js';
import { recalculateTicketSLA, calculateDeadlines } from '../src/services/slaEngine.js';

describe('SLA Integration & Ticket Lifecycle Tests', () => {
  let user;
  let standardPolicy;
  let urgentPolicy;

  before(async () => {
    await connectDB();
    await Promise.all([User.deleteMany({}), SLAPolicy.deleteMany({}), Ticket.deleteMany({})]);

    user = await User.create({
      name: 'Agent Tester',
      email: 'agent.tester@example.com',
      role: 'agent',
      team: 'Technical Support',
    });

    standardPolicy = await SLAPolicy.create({
      name: 'Standard Tech Tier',
      priority: 'Medium',
      category: 'Technical',
      firstResponseTimeMinutes: 120, // 2 hours
      resolutionTimeMinutes: 720, // 12 hours
      isActive: true,
    });

    urgentPolicy = await SLAPolicy.create({
      name: 'Urgent Tech Outage',
      priority: 'Urgent',
      category: 'Technical',
      firstResponseTimeMinutes: 15,
      resolutionTimeMinutes: 120,
      isActive: true,
    });
  });

  after(async () => {
    await disconnectDB();
  });

  test('Ticket Creation: sets deadlines and initial history entry', async () => {
    const createdAt = new Date();
    const { firstResponseDue, resolutionDue } = calculateDeadlines(createdAt, standardPolicy);

    const ticket = await Ticket.create({
      ticketNumber: 'TICK-TEST-1',
      customerReference: 'Test Customer',
      issueCategory: 'Technical',
      priority: 'Medium',
      subject: 'Integration Test Ticket',
      description: 'Testing ticket creation lifecycle',
      status: 'Open',
      assignedTeam: 'Technical Support',
      assignedAgent: user._id,
      slaPolicyId: standardPolicy._id,
      createdAt,
      firstResponseDue,
      resolutionDue,
      slaStatus: 'On Track',
      history: [
        {
          changedBy: 'Test Runner',
          action: 'CREATED',
          previousValue: '',
          newValue: 'Created Medium ticket',
          timestamp: createdAt,
        },
      ],
    });

    assert.equal(ticket.ticketNumber, 'TICK-TEST-1');
    assert.equal(ticket.priority, 'Medium');
    assert.equal(ticket.status, 'Open');
    assert.equal(ticket.history.length, 1);
    assert.equal(ticket.history[0].action, 'CREATED');
  });

  test('Priority Escalation: recalculates SLA targets and appends immutable history log', async () => {
    const ticket = await Ticket.findOne({ ticketNumber: 'TICK-TEST-1' });
    const originalRespDue = ticket.firstResponseDue;
    const originalResDue = ticket.resolutionDue;

    // Escalate from Medium to Urgent
    await recalculateTicketSLA(ticket, 'Urgent', 'Technical', 'Escalation Supervisor');
    await ticket.save();

    const updated = await Ticket.findOne({ ticketNumber: 'TICK-TEST-1' });
    assert.equal(updated.priority, 'Urgent');
    assert.notEqual(updated.firstResponseDue.toISOString(), originalRespDue.toISOString());
    assert.notEqual(updated.resolutionDue.toISOString(), originalResDue.toISOString());

    // Deadline should be tighter (15 mins vs 120 mins)
    const expectedRespDue = new Date(ticket.createdAt.getTime() + 15 * 60 * 1000);
    assert.equal(updated.firstResponseDue.toISOString(), expectedRespDue.toISOString());

    // Check history entries
    const actions = updated.history.map((h) => h.action);
    assert.ok(actions.includes('PRIORITY_CHANGE'), 'Should have PRIORITY_CHANGE action');
    assert.ok(actions.includes('SLA_RECALCULATED'), 'Should have SLA_RECALCULATED action');
  });
});
