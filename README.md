# Customer Service SLA Tracker (Problem ID: HACK-P368)

A production-grade, end-to-end Customer Service SLA (Service Level Agreement) Tracker application built with **React**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB / Mongoose**, and **date-fns**.

---

## 🌟 Key Features

1. **Intelligent SLA Calculation Engine**:
   - Matches incoming support requests against active SLA policies based on **Priority** (`Urgent`, `High`, `Medium`, `Low`) and **Category** (`Technical`, `Billing`, `Account`, `General`).
   - Dynamically calculates:
     $$\text{FirstResponseDue} = \text{CreatedAt} + \text{firstResponseTimeMinutes}$$
     $$\text{ResolutionDue} = \text{CreatedAt} + \text{resolutionTimeMinutes}$$
   - Real-time tick-by-tick countdowns and elapsed percentage meters for response and resolution windows.

2. **Dynamic SLA Status Evaluation**:
   - Automatically transitions status across:
     - 🟢 **On Track**: Healthy buffer before response and resolution targets.
     - 🟡 **At Risk**: Within 20% remaining of the deadline window (or $\le 15$ minutes buffer).
     - 🔴 **Breached**: Target deadline missed prior to agent response or ticket resolution.
   - Background SLA monitoring interval continuously scans active tickets and triggers escalation events.

3. **Audit Trail Preservation & Priority Recalculation**:
   - Any modification to ticket priority recalculates deadlines according to the newly matched SLA tier.
   - Records an immutable history log entry (`action: 'PRIORITY_CHANGE'` and `action: 'SLA_RECALCULATED'`) tracking previous values, new values, timestamp, and author.

4. **Public Responses & First Response Tracking**:
   - When an agent submits a public reply on a pending ticket, the system automatically stamps `firstResponseAt = new Date()`, evaluates whether the first response SLA was achieved or breached, moves ticket status to `In Progress`, and logs the event.
   - Supports private **Internal Notes** for technical collaboration.

5. **Simulated Notification & Escalation System**:
   - Crossing At Risk or Breached thresholds generates an entry in the ticket's `escalationLog`.
   - Simulates outbound dispatch (Ops Slack webhook, PagerDuty alert, and manager escalation).

6. **Comprehensive Manager Dashboard & Analytics**:
   - Circular SLA Compliance Meter showing real-time compliance rate.
   - KPI Cards: Total Open Tickets, On Track, At Risk, Breaches (count & percentage), Average First Response Time, and Average Resolution Time.
   - **Workload Distribution by Team**: Multi-segment visual health bars for Technical Support, Billing, Account, and General.
   - **Workload Distribution by Agent**: Individual load meters, avatars, open tickets, and active breach exposure.
   - **Urgent Attention Radar**: Live ticker highlighting tickets closest to breach or currently overdue.

7. **Flexible Ticket Management**:
   - **Table View**: Sortable and filterable list with live countdowns and quick action triggers.
   - **Kanban Board View**: Visual columns for `Open`, `In Progress`, `Pending`, `Resolved`, and `Closed` with one-click transitions.
   - Quick Filter Tabs: *All*, *My Tickets*, *🔴 Breached*, *🟡 At Risk*, *🟢 On Track*, *Open*, *Resolved*.

8. **User Profile Switcher**:
   - Switch between **Sarah Jenkins** (Manager, Technical Support), **Alex Morgan** (Admin, Operations), and frontline agents (**David Kim**, **Elena Rostova**, **Marcus Thorne**, **Priya Patel**) to experience role-specific perspectives.

9. **SLA Policy Matrix Configuration**:
   - Interactive Priority × Category grid matrix.
   - CRUD management for SLA policies with live human-readable duration conversion (e.g., $60\text{ mins} = 1\text{ hour}$, $1440\text{ mins} = 24\text{ hours}$).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**:
  - React 19 + Vite
  - Tailwind CSS with custom glassmorphism design tokens
  - Lucide React icons
  - Axios API client
  - date-fns for time formatting
- **Backend**:
  - Node.js (v24+) with Express.js RESTful API architecture
  - Mongoose ODM with custom schema indexing
  - Zero-configuration MongoDB: Automatic fallback to local in-memory MongoDB (`mongodb-memory-server`) if external MongoDB URI is not supplied.
  - Periodic background interval scanning ticket thresholds
- **Testing**:
  - Node built-in test runner (`node:test`, `node:assert/strict`)
  - Unit tests for SLA calculations & status transitions
  - Integration tests for ticket lifecycle and priority recalculation

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 3. Run the Development Environment

You can start both servers simultaneously:

**Backend Server (Port 5000):**
```bash
cd server
npm start
# Or with auto-reload:
npm run dev
```

**Frontend React Client (Port 5173):**
```bash
cd client
npm run dev
```

Visit **`http://localhost:5173/`** in your browser.

---

## 🧪 Testing Suite

Run the automated unit and integration tests:

```bash
cd server
npm test
```

### Validated Test Cases:
1. `calculateDeadlines`: Correctly computes response and resolution deadlines from policy targets.
2. `evaluateTicketSLA`: Returns `On Track` when ample time remains.
3. `evaluateTicketSLA`: Transitions to `At Risk` when within $\le 20\%$ or threshold buffer.
4. `evaluateTicketSLA`: Transitions to `Breached` when first response deadline is missed.
5. `evaluateTicketSLA`: Stays `On Track` if first response was completed on time and resolution is healthy.
6. `evaluateTicketSLA`: Transitions to `Breached` if resolution deadline is exceeded.
7. `evaluateTicketSLA`: Correctly identifies historical compliance for Resolved tickets.
8. `Ticket Creation Lifecycle`: Sets deadlines and initial history log.
9. `Priority Escalation Integration`: Recalculates SLA targets, tightens deadlines, and appends immutable audit records.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/tickets` | Query tickets with filters (`status`, `priority`, `team`, `slaStatus`, `category`, `search`, `page`, `limit`) |
| `POST` | `/api/tickets` | Create ticket, auto-links SLA policy, computes deadlines |
| `GET` | `/api/tickets/:id` | Get ticket with audit history, escalation logs, and comments |
| `PATCH` | `/api/tickets/:id` | Update fields; recalculates SLA on priority change and appends history |
| `POST` | `/api/tickets/:id/comments` | Add comment; stamps `firstResponseAt` if first public reply |
| `POST` | `/api/tickets/scan-sla` | Trigger manual SLA threshold scan |
| `GET` | `/api/sla-policies` | List all SLA policy rules |
| `POST` | `/api/sla-policies` | Create new SLA rule |
| `PUT` | `/api/sla-policies/:id` | Update SLA rule targets |
| `DELETE` | `/api/sla-policies/:id` | Delete SLA rule |
| `GET` | `/api/dashboard/metrics` | Returns aggregated metrics, workload breakdown, and urgent tickets |
| `GET` | `/api/users` | List agents and team members |
| `POST` | `/api/seed` | Reset and reseed sample dataset across all SLA states |
