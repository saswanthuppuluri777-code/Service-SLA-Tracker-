import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  LayoutList,
  Columns3,
  Clock,
  UserCheck,
  ChevronRight,
  ArrowUpDown,
  Tag,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
} from 'lucide-react';
import SLABadge from './SLABadge';
import LiveCountdown from './LiveCountdown';

export default function TicketsView({
  tickets = [],
  loading,
  currentUser,
  onSelectTicket,
  onCreateTicket,
  onUpdateTicketStatus,
  filters,
  setFilters,
  onRefresh,
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my' | 'breached' | 'atrisk' | 'ontrack' | 'open' | 'resolved'

  // Filter handlers
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      setFilters((prev) => ({ ...prev, slaStatus: 'all', status: 'all', assignedAgent: 'all' }));
    } else if (tab === 'my') {
      setFilters((prev) => ({ ...prev, assignedAgent: currentUser?._id || 'all' }));
    } else if (tab === 'breached') {
      setFilters((prev) => ({ ...prev, slaStatus: 'Breached', status: 'all' }));
    } else if (tab === 'atrisk') {
      setFilters((prev) => ({ ...prev, slaStatus: 'At Risk', status: 'all' }));
    } else if (tab === 'ontrack') {
      setFilters((prev) => ({ ...prev, slaStatus: 'On Track', status: 'all' }));
    } else if (tab === 'open') {
      setFilters((prev) => ({ ...prev, status: 'Open', slaStatus: 'all' }));
    } else if (tab === 'resolved') {
      setFilters((prev) => ({ ...prev, status: 'Resolved', slaStatus: 'all' }));
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'Low':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'In Progress':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'Pending':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Resolved':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Closed':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      case 'Reopened':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const kanbanColumns = [
    { id: 'Open', title: 'Open', color: 'border-blue-500/30' },
    { id: 'In Progress', title: 'In Progress', color: 'border-indigo-500/30' },
    { id: 'Pending', title: 'Pending', color: 'border-purple-500/30' },
    { id: 'Resolved', title: 'Resolved', color: 'border-emerald-500/30' },
    { id: 'Closed', title: 'Closed', color: 'border-slate-500/30' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Support Tickets & SLA Matrix</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage incoming inquiries, assign agents, and monitor real-time deadline status
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Table / Kanban */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-brand-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-brand-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <Columns3 className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          {/* New Ticket Button */}
          <button
            onClick={onCreateTicket}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Tickets' },
          { id: 'my', label: 'My Tickets' },
          { id: 'breached', label: '🔴 Breached' },
          { id: 'atrisk', label: '🟡 At Risk' },
          { id: 'ontrack', label: '🟢 On Track' },
          { id: 'open', label: 'Open' },
          { id: 'resolved', label: 'Resolved' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tickets by #, subject, customer..."
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Priority Filter */}
          <select
            value={filters.priority || 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category || 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
            <option value="Account">Account</option>
            <option value="General">General</option>
          </select>

          {/* Team Filter */}
          <select
            value={filters.team || 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, team: e.target.value }))}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Teams</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Billing">Billing</option>
            <option value="Account">Account</option>
            <option value="General">General</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Content: Table View OR Kanban View */}
      {viewMode === 'table' ? (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Subject & Customer</th>
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4">SLA Compliance</th>
                  <th className="py-3.5 px-4">First Response</th>
                  <th className="py-3.5 px-4">Resolution</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-slate-400">
                      No tickets match the selected filters.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => onSelectTicket(t._id)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                    >
                      {/* Ticket Number */}
                      <td className="py-3 px-4 font-mono font-bold text-brand-400 whitespace-nowrap">
                        {t.ticketNumber}
                      </td>

                      {/* Subject & Customer */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-white truncate group-hover:text-brand-300 transition-colors">
                          {t.subject}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="truncate">{t.customerReference}</span>
                          <span>•</span>
                          <span className="text-slate-500">{t.issueCategory}</span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getPriorityBadgeClass(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadgeClass(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* SLA Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <SLABadge status={t.slaStatus} size="sm" />
                      </td>

                      {/* First Response Target */}
                      <td className="py-3 px-4 min-w-[130px]">
                        <LiveCountdown
                          dueDate={t.firstResponseDue}
                          completedAt={t.firstResponseAt}
                          createdDate={t.createdAt}
                          type="Response"
                          compact={true}
                        />
                      </td>

                      {/* Resolution Target */}
                      <td className="py-3 px-4 min-w-[130px]">
                        <LiveCountdown
                          dueDate={t.resolutionDue}
                          completedAt={t.resolvedAt}
                          createdDate={t.createdAt}
                          type="Resolution"
                          compact={true}
                        />
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {t.assignedAgent ? (
                          <div className="flex items-center gap-2">
                            {t.assignedAgent.avatar ? (
                              <img
                                src={t.assignedAgent.avatar}
                                alt={t.assignedAgent.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                                {t.assignedAgent.name[0]}
                              </div>
                            )}
                            <span className="text-slate-300 font-medium">{t.assignedAgent.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(t._id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kanbanColumns.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="glass-panel rounded-2xl p-3 border border-slate-800 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{col.title}</span>
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-center">
                      {colTickets.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                  {colTickets.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs">No tickets</div>
                  ) : (
                    colTickets.map((t) => (
                      <div
                        key={t._id}
                        onClick={() => onSelectTicket(t._id)}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 hover:shadow-lg transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-brand-400">{t.ticketNumber}</span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase border ${getPriorityBadgeClass(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <div className="font-medium text-xs text-white line-clamp-2 group-hover:text-brand-300 transition-colors">
                          {t.subject}
                        </div>

                        <div className="text-[10px] text-slate-400 truncate">{t.customerReference}</div>

                        <div className="pt-2 border-t border-slate-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <SLABadge status={t.slaStatus} size="sm" />
                            {t.assignedAgent ? (
                              <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                                {t.assignedAgent.name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600 italic">Unassigned</span>
                            )}
                          </div>

                          {/* Countdown */}
                          {!t.firstResponseAt && !['Resolved', 'Closed'].includes(t.status) ? (
                            <LiveCountdown
                              dueDate={t.firstResponseDue}
                              type="Response"
                              compact={true}
                            />
                          ) : (
                            <LiveCountdown
                              dueDate={t.resolutionDue}
                              completedAt={t.resolvedAt}
                              type="Resolution"
                              compact={true}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
