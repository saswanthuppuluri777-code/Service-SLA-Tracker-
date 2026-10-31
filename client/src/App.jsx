import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import TicketsView from './components/TicketsView';
import SLAPoliciesView from './components/SLAPoliciesView';
import EscalationLogsView from './components/EscalationLogsView';
import TicketDetailModal from './components/TicketDetailModal';
import CreateTicketModal from './components/CreateTicketModal';
import NotificationToast from './components/NotificationToast';
import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'tickets' | 'policies' | 'escalations'

  // Data states
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [metrics, setMetrics] = useState(null);

  // Modals & Selection
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Loading & Toast states
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters for Tickets view
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    category: 'all',
    team: 'all',
    status: 'all',
    slaStatus: 'all',
    assignedAgent: 'all',
  });

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
  };

  // 1. Load Initial Users & Policies
  const loadInitialData = useCallback(async () => {
    try {
      const [usersRes, policiesRes] = await Promise.all([
        api.getUsers(),
        api.getSLAPolicies(),
      ]);

      if (usersRes?.data?.length > 0) {
        setUsers(usersRes.data);
        // Default to first user (e.g. Sarah Jenkins or Alex Morgan) if none selected
        setCurrentUser((prev) => prev || usersRes.data[0]);
      }

      if (policiesRes?.data) {
        setPolicies(policiesRes.data);
      }
    } catch (err) {
      console.error('Error loading initial metadata:', err);
    }
  }, []);

  // 2. Fetch Dashboard Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await api.getDashboardMetrics();
      if (res?.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // 3. Fetch Tickets with current filters
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await api.getTickets(filters);
      if (res?.success) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadInitialData();
    fetchMetrics();
    fetchTickets();
  }, [loadInitialData, fetchMetrics, fetchTickets]);

  // Periodic background refresh for live SLA engine metrics (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetrics();
      fetchTickets();
      // If modal is open, refresh detailed ticket too
      if (selectedTicketId) {
        api.getTicketById(selectedTicketId).then((res) => {
          if (res?.success) setSelectedTicket(res.data);
        }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics, fetchTickets, selectedTicketId]);

  // Fetch ticket details when selectedTicketId changes
  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }
    api.getTicketById(selectedTicketId)
      .then((res) => {
        if (res?.success) setSelectedTicket(res.data);
      })
      .catch((err) => {
        console.error('Error fetching ticket details:', err);
        showToast('Error', 'Failed to load ticket details', 'error');
      });
  }, [selectedTicketId]);

  // Action: Select Ticket
  const handleSelectTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
  };

  // Action: Navigate to Tickets with filter preset (e.g. from Dashboard)
  const handleNavigateToTickets = (filterPreset = {}) => {
    setFilters((prev) => ({ ...prev, ...filterPreset }));
    setCurrentView('tickets');
  };

  // Action: Create Ticket
  const handleCreateTicket = async (ticketData) => {
    try {
      const res = await api.createTicket(ticketData);
      if (res?.success) {
        showToast('Ticket Created', `Created ticket ${res.data.ticketNumber} with ${res.data.priority} SLA targets.`, 'success');
        fetchTickets();
        fetchMetrics();
      }
    } catch (err) {
      showToast('Error', err.response?.data?.error || err.message, 'error');
      throw err;
    }
  };

  // Action: Update Ticket fields
  const handleUpdateTicket = async (ticketId, updateData) => {
    try {
      const res = await api.updateTicket(ticketId, updateData);
      if (res?.success) {
        setSelectedTicket(res.data);
        fetchTickets();
        fetchMetrics();

        if (updateData.priority) {
          showToast('SLA Recalculated', `Priority updated to ${updateData.priority}. SLA deadlines adjusted and audit trail logged.`, 'warning');
        } else if (updateData.status) {
          showToast('Status Updated', `Ticket status transitioned to ${updateData.status}.`, 'success');
        } else if (updateData.assignedAgent !== undefined) {
          showToast('Assignment Updated', 'Agent assignment changed successfully.', 'success');
        }
      }
    } catch (err) {
      showToast('Error', err.response?.data?.error || err.message, 'error');
    }
  };

  // Action: Add Comment
  const handleAddComment = async (ticketId, commentData) => {
    try {
      const res = await api.addComment(ticketId, commentData);
      if (res?.success) {
        setSelectedTicket(res.data);
        fetchTickets();
        fetchMetrics();

        if (res.firstResponseTriggered) {
          showToast('First Response Recorded', 'First response SLA target achieved and timestamp recorded!', 'success');
        } else {
          showToast('Note Added', commentData.isInternal ? 'Internal note added.' : 'Response sent.', 'success');
        }
      }
    } catch (err) {
      showToast('Error', err.response?.data?.error || err.message, 'error');
    }
  };

  // Action: Create SLA Policy
  const handleCreatePolicy = async (policyData) => {
    try {
      const res = await api.createSLAPolicy(policyData);
      if (res?.success) {
        showToast('Policy Created', `Created ${res.data.name} SLA rule.`, 'success');
        const policiesRes = await api.getSLAPolicies();
        if (policiesRes?.data) setPolicies(policiesRes.data);
      }
    } catch (err) {
      showToast('Error', err.response?.data?.error || err.message, 'error');
    }
  };

  // Action: Update SLA Policy
  const handleUpdatePolicy = async (id, policyData) => {
    try {
      const res = await api.updateSLAPolicy(id, policyData);
      if (res?.success) {
        showToast('Policy Updated', 'SLA policy updated successfully.', 'success');
        const policiesRes = await api.getSLAPolicies();
        if (policiesRes?.data) setPolicies(policiesRes.data);
      }
    } catch (err) {
      showToast('Error', err.response?.data?.error || err.message, 'error');
    }
  };

  // Action: Delete SLA Policy
  const handleDeletePolicy = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SLA policy?')) return;
    try {
      const res = await api.deleteSLAPolicy(id);
      if (res?.success) {
        showToast('Policy Deleted', 'SLA rule removed.', 'info');
        const policiesRes = await api.getSLAPolicies();
        if (policiesRes?.data) setPolicies(policiesRes.data);
      }
    } catch (err) {
      showToast('Error', err.response?.data?.error || err.message, 'error');
    }
  };

  // Action: Reseed Database with fresh sample data
  const handleReseedDatabase = async () => {
    setIsReseeding(true);
    try {
      const res = await api.seedDatabase();
      if (res?.success) {
        showToast('Demo Data Reset', 'Seeded sample tickets across On Track, At Risk, and Breached states.', 'success');
        await Promise.all([loadInitialData(), fetchMetrics(), fetchTickets()]);
      }
    } catch (err) {
      showToast('Error Reseeding', err.message, 'error');
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={users}
        onReseed={handleReseedDatabase}
        isReseeding={isReseeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            loading={loadingMetrics}
            onSelectTicket={handleSelectTicket}
            onNavigateToTickets={handleNavigateToTickets}
          />
        )}

        {currentView === 'tickets' && (
          <TicketsView
            tickets={tickets}
            loading={loadingTickets}
            currentUser={currentUser}
            onSelectTicket={handleSelectTicket}
            onCreateTicket={() => setIsCreateModalOpen(true)}
            filters={filters}
            setFilters={setFilters}
            onRefresh={fetchTickets}
          />
        )}

        {currentView === 'policies' && (
          <SLAPoliciesView
            policies={policies}
            loading={false}
            onCreatePolicy={handleCreatePolicy}
            onUpdatePolicy={handleUpdatePolicy}
            onDeletePolicy={handleDeletePolicy}
          />
        )}

        {currentView === 'escalations' && (
          <EscalationLogsView
            metrics={metrics}
            tickets={tickets}
            onSelectTicket={handleSelectTicket}
          />
        )}
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedTicketId(null)}
          onUpdateTicket={handleUpdateTicket}
          onAddComment={handleAddComment}
        />
      )}

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTicket={handleCreateTicket}
        users={users}
        policies={policies}
        currentUser={currentUser}
      />

      {/* Notification Toast */}
      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
