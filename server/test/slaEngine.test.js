import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDeadlines, evaluateTicketSLA } from '../src/services/slaEngine.js';

describe('SLA Engine Unit Tests', () => {
  const mockPolicy = {
    _id: 'mock-policy-1',
    name: 'High Priority Tech Support',
    priority: 'High',
    category: 'Technical',
    firstResponseTimeMinutes: 30,
    resolutionTimeMinutes: 240, // 4 hours
    isActive: true,
  };

  test('calculateDeadlines: correctly computes response and resolution deadlines from policy targets', () => {
    const createdAt = new Date('2026-10-31T10:00:00.000Z');
    const { firstResponseDue, resolutionDue } = calculateDeadlines(createdAt, mockPolicy);

    // First response should be 30 minutes later: 10:30:00.000Z
    const expectedFirstResponse = new Date('2026-10-31T10:30:00.000Z');
    assert.equal(firstResponseDue.toISOString(), expectedFirstResponse.toISOString());

    // Resolution should be 240 minutes (4 hours) later: 14:00:00.000Z
    const expectedResolution = new Date('2026-10-31T14:00:00.000Z');
    assert.equal(resolutionDue.toISOString(), expectedResolution.toISOString());
  });

  test('evaluateTicketSLA: returns "On Track" when ample time remains', () => {
    const createdAt = new Date('2026-10-31T10:00:00.000Z');
    const ticket = {
      createdAt,
      firstResponseDue: new Date('2026-10-31T10:30:00.000Z'),
      firstResponseAt: null,
      resolutionDue: new Date('2026-10-31T14:00:00.000Z'),
      resolvedAt: null,
      status: 'Open',
    };

    // Evaluated 5 minutes after creation (25 mins left out of 30)
    const now = new Date('2026-10-31T10:05:00.000Z');
    const result = evaluateTicketSLA(ticket, now);

    assert.equal(result.slaStatus, 'On Track');
    assert.equal(result.thresholdCrossed, null);
  });

  test('evaluateTicketSLA: transitions to "At Risk" when first response enters <= 20% / buffer threshold', () => {
    const createdAt = new Date('2026-10-31T10:00:00.000Z');
    const ticket = {
      createdAt,
      firstResponseDue: new Date('2026-10-31T10:30:00.000Z'), // 30 min window
      firstResponseAt: null,
      resolutionDue: new Date('2026-10-31T14:00:00.000Z'),
      resolvedAt: null,
      status: 'Open',
    };

    // 25 minutes after creation (only 5 minutes remaining <= 15 min buffer / 20%)
    const now = new Date('2026-10-31T10:25:00.000Z');
    const result = evaluateTicketSLA(ticket, now);

    assert.equal(result.slaStatus, 'At Risk');
    assert.equal(result.thresholdCrossed, 'First Response At Risk');
  });

  test('evaluateTicketSLA: transitions to "Breached" when first response deadline is missed', () => {
    const createdAt = new Date('2026-10-31T10:00:00.000Z');
    const ticket = {
      createdAt,
      firstResponseDue: new Date('2026-10-31T10:30:00.000Z'),
      firstResponseAt: null,
      resolutionDue: new Date('2026-10-31T14:00:00.000Z'),
      resolvedAt: null,
      status: 'Open',
    };

    // Evaluated at 10:31:00 (1 minute past due)
    const now = new Date('2026-10-31T10:31:00.000Z');
    const result = evaluateTicketSLA(ticket, now);

    assert.equal(result.slaStatus, 'Breached');
    assert.equal(result.thresholdCrossed, 'First Response Breached');
  });

  test('evaluateTicketSLA: stays "On Track" if first response was completed on time and resolution is healthy', () => {
    const createdAt = new Date('2026-10-31T10:00:00.000Z');
    const ticket = {
      createdAt,
      firstResponseDue: new Date('2026-10-31T10:30:00.000Z'),
      firstResponseAt: new Date('2026-10-31T10:15:00.000Z'), // Responded in 15 mins
      resolutionDue: new Date('2026-10-31T14:00:00.000Z'),
      resolvedAt: null,
      status: 'In Progress',
    };

    // Evaluated at 11:00:00 (3 hours left on resolution)
    const now = new Date('2026-10-31T11:00:00.000Z');
    const result = evaluateTicketSLA(ticket, now);

    assert.equal(result.slaStatus, 'On Track');
  });

  test('evaluateTicketSLA: transitions to "Breached" if resolution due is exceeded', () => {
    const createdAt = new Date('2026-10-31T10:00:00.000Z');
    const ticket = {
      createdAt,
      firstResponseDue: new Date('2026-10-31T10:30:00.000Z'),
      firstResponseAt: new Date('2026-10-31T10:15:00.000Z'), // Responded on time
      resolutionDue: new Date('2026-10-31T14:00:00.000Z'),
      resolvedAt: null,
      status: 'In Progress',
    };

    // Evaluated at 14:05:00 (5 minutes past resolution deadline)
    const now = new Date('2026-10-31T14:05:00.000Z');
    const result = evaluateTicketSLA(ticket, now);

    assert.equal(result.slaStatus, 'Breached');
    assert.equal(result.thresholdCrossed, 'Resolution Breached');
  });

  test('evaluateTicketSLA: correctly identifies historical compliance for Resolved tickets', () => {
    const createdAt = new Date('2026-10-31T10:00:00.000Z');

    // Case A: Met both
    const ticketMet = {
      createdAt,
      firstResponseDue: new Date('2026-10-31T10:30:00.000Z'),
      firstResponseAt: new Date('2026-10-31T10:20:00.000Z'),
      resolutionDue: new Date('2026-10-31T14:00:00.000Z'),
      resolvedAt: new Date('2026-10-31T12:00:00.000Z'),
      status: 'Resolved',
    };
    assert.equal(evaluateTicketSLA(ticketMet).slaStatus, 'On Track');

    // Case B: Breached resolution
    const ticketBreached = {
      createdAt,
      firstResponseDue: new Date('2026-10-31T10:30:00.000Z'),
      firstResponseAt: new Date('2026-10-31T10:20:00.000Z'),
      resolutionDue: new Date('2026-10-31T14:00:00.000Z'),
      resolvedAt: new Date('2026-10-31T15:30:00.000Z'),
      status: 'Resolved',
    };
    assert.equal(evaluateTicketSLA(ticketBreached).slaStatus, 'Breached');
  });
});
