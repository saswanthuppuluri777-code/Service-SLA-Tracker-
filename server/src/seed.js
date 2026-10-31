import { connectDB, disconnectDB } from './config/db.js';
import { User } from './models/User.js';
import { SLAPolicy } from './models/SLAPolicy.js';
import { Ticket } from './models/Ticket.js';

export async function seedDatabase() {
  console.log('[SEED] Starting database seeding...');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    SLAPolicy.deleteMany({}),
    Ticket.deleteMany({}),
  ]);

  console.log('[SEED] Cleared existing data.');

  // 1. Seed Users / Agents
  const users = await User.insertMany([
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@acmecorp.com',
      role: 'manager',
      team: 'Technical Support',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      name: 'Alex Morgan',
      email: 'alex.morgan@acmecorp.com',
      role: 'admin',
      team: 'Operations',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      name: 'David Kim',
      email: 'david.kim@acmecorp.com',
      role: 'agent',
      team: 'Technical Support',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@acmecorp.com',
      role: 'agent',
      team: 'Billing',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      name: 'Marcus Thorne',
      email: 'marcus.thorne@acmecorp.com',
      role: 'agent',
      team: 'Account',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@acmecorp.com',
      role: 'agent',
      team: 'General',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
  ]);

  console.log(`[SEED] Created ${users.length} users/agents.`);

  // 2. Seed SLA Policies
  const policies = await SLAPolicy.insertMany([
    {
      name: 'Urgent Enterprise Incident SLA',
      priority: 'Urgent',
      category: 'Technical',
      firstResponseTimeMinutes: 15,
      resolutionTimeMinutes: 120, // 2 hours
      isActive: true,
    },
    {
      name: 'High Priority Technical Support',
      priority: 'High',
      category: 'Technical',
      firstResponseTimeMinutes: 30,
      resolutionTimeMinutes: 240, // 4 hours
      isActive: true,
    },
    {
      name: 'Critical Billing Disruption',
      priority: 'Urgent',
      category: 'Billing',
      firstResponseTimeMinutes: 20,
      resolutionTimeMinutes: 180, // 3 hours
      isActive: true,
    },
    {
      name: 'Standard Billing & Invoice SLA',
      priority: 'Medium',
      category: 'Billing',
      firstResponseTimeMinutes: 60,
      resolutionTimeMinutes: 720, // 12 hours
      isActive: true,
    },
    {
      name: 'Account & Security Governance SLA',
      priority: 'High',
      category: 'Account',
      firstResponseTimeMinutes: 45,
      resolutionTimeMinutes: 480, // 8 hours
      isActive: true,
    },
    {
      name: 'Standard General Inquiry Tier',
      priority: 'Low',
      category: 'General',
      firstResponseTimeMinutes: 120,
      resolutionTimeMinutes: 1440, // 24 hours
      isActive: true,
    },
    {
      name: 'Standard Technical Operations',
      priority: 'Medium',
      category: 'Technical',
      firstResponseTimeMinutes: 60,
      resolutionTimeMinutes: 480, // 8 hours
      isActive: true,
    },
  ]);

  console.log(`[SEED] Created ${policies.length} SLA policies.`);

  // Helper map for quick access
  const polMap = {};
  policies.forEach((p) => {
    polMap[`${p.priority}_${p.category}`] = p;
  });

  const now = new Date();

  // 3. Seed Realistic Sample Tickets across all SLA states
  const sampleTickets = [
    // 1. Breached First Response & Resolution (Urgent Technical)
    {
      ticketNumber: 'TICK-1001',
      customerReference: 'Stripe Payments Inc / CUST-9821',
      issueCategory: 'Technical',
      priority: 'Urgent',
      subject: 'Critical Production DB Connection Pool Exhaustion',
      description: 'Production API gateways are returning HTTP 504. Connection pool exhausted across cluster us-east-1.',
      status: 'Open',
      assignedTeam: 'Technical Support',
      assignedAgent: users[2]._id, // David Kim
      slaPolicyId: polMap['Urgent_Technical']._id,
      createdAt: new Date(now.getTime() - 150 * 60 * 1000), // created 2.5 hours ago
      firstResponseDue: new Date(now.getTime() - 135 * 60 * 1000), // was due 15m after
      firstResponseAt: null,
      resolutionDue: new Date(now.getTime() - 30 * 60 * 1000), // was due 120m after (30 mins ago)
      resolvedAt: null,
      slaStatus: 'Breached',
      history: [
        {
          changedBy: 'Automated Alert Monitor',
          action: 'CREATED',
          previousValue: '',
          newValue: 'Ticket created from PagerDuty webhook with Urgent priority',
          timestamp: new Date(now.getTime() - 150 * 60 * 1000),
        },
        {
          changedBy: 'System',
          action: 'ASSIGNED',
          previousValue: 'Unassigned',
          newValue: 'David Kim',
          timestamp: new Date(now.getTime() - 140 * 60 * 1000),
        },
      ],
      escalationLog: [
        {
          thresholdCrossed: 'First Response Breached',
          simulatedNotificationSent: true,
          details: 'First response breached by 135 minutes. Escalate to Manager Sarah Jenkins.',
          timestamp: new Date(now.getTime() - 135 * 60 * 1000),
        },
        {
          thresholdCrossed: 'Resolution Breached',
          simulatedNotificationSent: true,
          details: 'Resolution target exceeded. Critical SLA breach dispatch sent to Ops channel.',
          timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        },
      ],
      comments: [
        {
          author: users[0]._id,
          authorName: 'Sarah Jenkins',
          authorRole: 'manager',
          content: 'Escalating this ticket to Level 3 infrastructure on-call right now.',
          isInternal: true,
          createdAt: new Date(now.getTime() - 100 * 60 * 1000),
        },
      ],
    },

    // 2. At Risk - First Response window closing (High Technical)
    {
      ticketNumber: 'TICK-1002',
      customerReference: 'FinTech Global Ltd / CUST-4412',
      issueCategory: 'Technical',
      priority: 'High',
      subject: 'Webhook Delivery Latency Spiking Over 8000ms',
      description: 'Customers report that order status update webhooks are lagging by up to 10 minutes.',
      status: 'Open',
      assignedTeam: 'Technical Support',
      assignedAgent: users[2]._id, // David Kim
      slaPolicyId: polMap['High_Technical']._id,
      createdAt: new Date(now.getTime() - 25 * 60 * 1000), // created 25 mins ago (target 30 mins, 5 mins left)
      firstResponseDue: new Date(now.getTime() + 5 * 60 * 1000), // due in 5 mins
      firstResponseAt: null,
      resolutionDue: new Date(now.getTime() + 215 * 60 * 1000),
      resolvedAt: null,
      slaStatus: 'At Risk',
      history: [
        {
          changedBy: 'Customer Portal',
          action: 'CREATED',
          previousValue: '',
          newValue: 'Ticket submitted via API integration portal',
          timestamp: new Date(now.getTime() - 25 * 60 * 1000),
        },
        {
          changedBy: 'David Kim',
          action: 'ASSIGNED',
          previousValue: 'Unassigned',
          newValue: 'David Kim',
          timestamp: new Date(now.getTime() - 20 * 60 * 1000),
        },
      ],
      escalationLog: [
        {
          thresholdCrossed: 'First Response At Risk',
          simulatedNotificationSent: true,
          details: 'Less than 5 minutes remaining to meet first response SLA deadline.',
          timestamp: new Date(now.getTime() - 3 * 60 * 1000),
        },
      ],
      comments: [],
    },

    // 3. On Track - In Progress with First Response completed (Medium Billing)
    {
      ticketNumber: 'TICK-1003',
      customerReference: 'Acme Retailers / CUST-1049',
      issueCategory: 'Billing',
      priority: 'Medium',
      subject: 'Discrepancy in Monthly SaaS Subscription Invoice #INV-8891',
      description: 'The prorated charges for seat upgrades on October 15th appear double-counted.',
      status: 'In Progress',
      assignedTeam: 'Billing',
      assignedAgent: users[3]._id, // Elena Rostova
      slaPolicyId: polMap['Medium_Billing']._id,
      createdAt: new Date(now.getTime() - 40 * 60 * 1000),
      firstResponseDue: new Date(now.getTime() + 20 * 60 * 1000), // target was 60m
      firstResponseAt: new Date(now.getTime() - 25 * 60 * 1000), // responded in 15m!
      resolutionDue: new Date(now.getTime() + 680 * 60 * 1000), // resolution target 12h
      resolvedAt: null,
      slaStatus: 'On Track',
      history: [
        {
          changedBy: 'Customer Portal',
          action: 'CREATED',
          previousValue: '',
          newValue: 'Ticket created with Medium priority',
          timestamp: new Date(now.getTime() - 40 * 60 * 1000),
        },
        {
          changedBy: 'Elena Rostova',
          action: 'ASSIGNED',
          previousValue: 'Unassigned',
          newValue: 'Elena Rostova',
          timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        },
        {
          changedBy: 'Elena Rostova',
          action: 'FIRST_RESPONSE',
          previousValue: 'Pending First Response',
          newValue: 'First response recorded on time (15m elapsed)',
          timestamp: new Date(now.getTime() - 25 * 60 * 1000),
        },
        {
          changedBy: 'System Automation',
          action: 'STATUS_CHANGE',
          previousValue: 'Open',
          newValue: 'In Progress',
          timestamp: new Date(now.getTime() - 25 * 60 * 1000),
        },
      ],
      escalationLog: [],
      comments: [
        {
          author: users[3]._id,
          authorName: 'Elena Rostova',
          authorRole: 'agent',
          content: 'Hello Acme team! I am reviewing the billing calculations with our finance engine now and will issue an adjusted credit memo.',
          isInternal: false,
          createdAt: new Date(now.getTime() - 25 * 60 * 1000),
        },
      ],
    },

    // 4. Breached Resolution - High priority Technical
    {
      ticketNumber: 'TICK-1004',
      customerReference: 'CloudScale Logistics / CUST-7723',
      issueCategory: 'Technical',
      priority: 'High',
      subject: 'OAuth2 Token Renewal Intermittent Rejections',
      description: 'Third-party integration clients receiving invalid_grant errors unexpectedly during refresh.',
      status: 'In Progress',
      assignedTeam: 'Technical Support',
      assignedAgent: users[2]._id, // David Kim
      slaPolicyId: polMap['High_Technical']._id,
      createdAt: new Date(now.getTime() - 300 * 60 * 1000), // 5 hours ago
      firstResponseDue: new Date(now.getTime() - 270 * 60 * 1000),
      firstResponseAt: new Date(now.getTime() - 285 * 60 * 1000), // response was on time (15 mins)
      resolutionDue: new Date(now.getTime() - 60 * 60 * 1000), // resolution was 4h (breached 1h ago)
      resolvedAt: null,
      slaStatus: 'Breached',
      history: [
        {
          changedBy: 'David Kim',
          action: 'STATUS_CHANGE',
          previousValue: 'Open',
          newValue: 'In Progress',
          timestamp: new Date(now.getTime() - 285 * 60 * 1000),
        },
      ],
      escalationLog: [
        {
          thresholdCrossed: 'Resolution Breached',
          simulatedNotificationSent: true,
          details: 'Ticket resolution deadline of 240 minutes exceeded. Alert sent to Technical Team Lead.',
          timestamp: new Date(now.getTime() - 60 * 60 * 1000),
        },
      ],
      comments: [
        {
          author: users[2]._id,
          authorName: 'David Kim',
          authorRole: 'agent',
          content: 'Found a race condition in the Redis session cache key expiration. Patching in staging.',
          isInternal: true,
          createdAt: new Date(now.getTime() - 90 * 60 * 1000),
        },
      ],
    },

    // 5. At Risk - Resolution deadline approaching within 15 minutes (High Account)
    {
      ticketNumber: 'TICK-1005',
      customerReference: 'Nexus Enterprise / CUST-3390',
      issueCategory: 'Account',
      priority: 'High',
      subject: 'SAML SSO Metadata Certificate Expiring in 24 Hours',
      description: 'Urgent metadata cert rotation required for Okta identity provider integration.',
      status: 'In Progress',
      assignedTeam: 'Account',
      assignedAgent: users[4]._id, // Marcus Thorne
      slaPolicyId: polMap['High_Account']._id,
      createdAt: new Date(now.getTime() - 465 * 60 * 1000), // 7h 45m ago (target is 8 hours / 480 mins)
      firstResponseDue: new Date(now.getTime() - 420 * 60 * 1000),
      firstResponseAt: new Date(now.getTime() - 440 * 60 * 1000),
      resolutionDue: new Date(now.getTime() + 15 * 60 * 1000), // 15 mins remaining!
      resolvedAt: null,
      slaStatus: 'At Risk',
      history: [
        {
          changedBy: 'Marcus Thorne',
          action: 'FIRST_RESPONSE',
          previousValue: 'Pending First Response',
          newValue: 'First response acknowledged',
          timestamp: new Date(now.getTime() - 440 * 60 * 1000),
        },
      ],
      escalationLog: [
        {
          thresholdCrossed: 'Resolution At Risk',
          simulatedNotificationSent: true,
          details: 'Resolution target at risk: 15 minutes remaining before SLA breach threshold.',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000),
        },
      ],
      comments: [
        {
          author: users[4]._id,
          authorName: 'Marcus Thorne',
          authorRole: 'agent',
          content: 'Cert rotation files received from customer sysadmin. Applying config now.',
          isInternal: false,
          createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        },
      ],
    },

    // 6. Resolved - SLA Met Successfully (Technical Medium)
    {
      ticketNumber: 'TICK-1006',
      customerReference: 'Apex Logistics / CUST-1288',
      issueCategory: 'Technical',
      priority: 'Medium',
      subject: 'CSV Export Function Timeout on Reports Page',
      description: 'Exporting more than 5,000 records results in gateway 504 timeout.',
      status: 'Resolved',
      assignedTeam: 'Technical Support',
      assignedAgent: users[2]._id, // David Kim
      slaPolicyId: polMap['Medium_Technical']._id,
      createdAt: new Date(now.getTime() - 180 * 60 * 1000),
      firstResponseDue: new Date(now.getTime() - 120 * 60 * 1000),
      firstResponseAt: new Date(now.getTime() - 150 * 60 * 1000), // responded in 30 mins (target 60m)
      resolutionDue: new Date(now.getTime() + 300 * 60 * 1000),
      resolvedAt: new Date(now.getTime() - 40 * 60 * 1000), // resolved in 140 mins (target 480m)
      slaStatus: 'On Track',
      history: [
        {
          changedBy: 'David Kim',
          action: 'FIRST_RESPONSE',
          previousValue: '',
          newValue: 'David Kim replied with streaming export workaround',
          timestamp: new Date(now.getTime() - 150 * 60 * 1000),
        },
        {
          changedBy: 'David Kim',
          action: 'STATUS_CHANGE',
          previousValue: 'In Progress',
          newValue: 'Resolved',
          timestamp: new Date(now.getTime() - 40 * 60 * 1000),
        },
      ],
      escalationLog: [],
      comments: [
        {
          author: users[2]._id,
          authorName: 'David Kim',
          authorRole: 'agent',
          content: 'Fixed by switching from synchronous buffered CSV generation to asynchronous streaming chunk response. Tested with 50,000 records.',
          isInternal: false,
          createdAt: new Date(now.getTime() - 40 * 60 * 1000),
        },
      ],
    },

    // 7. Resolved - SLA Breached Historically (Billing Urgent)
    {
      ticketNumber: 'TICK-1007',
      customerReference: 'Prime Capital / CUST-5510',
      issueCategory: 'Billing',
      priority: 'Urgent',
      subject: 'Duplicate Credit Card Charge for Enterprise Add-on',
      description: 'Customer was billed twice ($12,000 each) on credit card ending in 4099.',
      status: 'Resolved',
      assignedTeam: 'Billing',
      assignedAgent: users[3]._id, // Elena Rostova
      slaPolicyId: polMap['Urgent_Billing']._id,
      createdAt: new Date(now.getTime() - 400 * 60 * 1000),
      firstResponseDue: new Date(now.getTime() - 380 * 60 * 1000),
      firstResponseAt: new Date(now.getTime() - 350 * 60 * 1000), // First response breached by 30 mins
      resolutionDue: new Date(now.getTime() - 220 * 60 * 1000),
      resolvedAt: new Date(now.getTime() - 180 * 60 * 1000), // Resolved after target (breached)
      slaStatus: 'Breached',
      history: [
        {
          changedBy: 'Elena Rostova',
          action: 'STATUS_CHANGE',
          previousValue: 'In Progress',
          newValue: 'Resolved',
          timestamp: new Date(now.getTime() - 180 * 60 * 1000),
        },
      ],
      escalationLog: [
        {
          thresholdCrossed: 'First Response Breached',
          simulatedNotificationSent: true,
          details: 'Urgent billing SLA response missed.',
          timestamp: new Date(now.getTime() - 380 * 60 * 1000),
        },
        {
          thresholdCrossed: 'Resolution Breached',
          simulatedNotificationSent: true,
          details: 'Urgent billing resolution SLA missed.',
          timestamp: new Date(now.getTime() - 220 * 60 * 1000),
        },
      ],
      comments: [
        {
          author: users[3]._id,
          authorName: 'Elena Rostova',
          authorRole: 'agent',
          content: 'Full refund initiated for duplicate transaction #TX-9901. Customer notified.',
          isInternal: false,
          createdAt: new Date(now.getTime() - 180 * 60 * 1000),
        },
      ],
    },

    // 8. Open - Fresh On Track (Low General)
    {
      ticketNumber: 'TICK-1008',
      customerReference: 'BioHealth Solutions / CUST-6114',
      issueCategory: 'General',
      priority: 'Low',
      subject: 'Inquiry Regarding ISO 27001 Compliance Documentation',
      description: 'Requesting updated SOC2 Type II and ISO 27001 audit report copies for annual vendor risk review.',
      status: 'Open',
      assignedTeam: 'General',
      assignedAgent: users[5]._id, // Priya Patel
      slaPolicyId: polMap['Low_General']._id,
      createdAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 mins ago
      firstResponseDue: new Date(now.getTime() + 110 * 60 * 1000), // 110 mins left (target 120m)
      firstResponseAt: null,
      resolutionDue: new Date(now.getTime() + 1430 * 60 * 1000), // 23+ hours left
      resolvedAt: null,
      slaStatus: 'On Track',
      history: [
        {
          changedBy: 'Customer Portal',
          action: 'CREATED',
          previousValue: '',
          newValue: 'Submitted via customer portal',
          timestamp: new Date(now.getTime() - 10 * 60 * 1000),
        },
      ],
      escalationLog: [],
      comments: [],
    },
  ];

  const createdTickets = await Ticket.insertMany(sampleTickets);
  console.log(`[SEED] Created ${createdTickets.length} sample tickets with On Track, At Risk, and Breached SLA states.`);

  return {
    usersCount: users.length,
    policiesCount: policies.length,
    ticketsCount: createdTickets.length,
  };
}

// Standalone execution if called via `node src/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      console.log('[SEED] Seeding completed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('[SEED] Seeding error:', err);
      process.exit(1);
    }
  })();
}
