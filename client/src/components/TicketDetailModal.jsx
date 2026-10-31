import React, { useState } from 'react';
import {
  X,
  Clock,
  Send,
  MessageSquare,
  Lock,
  User,
  ShieldAlert,
  AlertTriangle,
  History,
  CheckCircle2,
  BellRing,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import SLABadge from './SLABadge';
import LiveCountdown from './LiveCountdown';

export default function TicketDetailModal({
  ticket,
  users = [],
  currentUser,
  onClose,
  onUpdateTicket,
  onAddComment,
}) {
  if (!ticket) return null;

  const [commentContent, setCommentContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState(ticket.status);
  const [selectedPriority, setSelectedPriority] = useState(ticket.priority);
  const [selectedTeam, setSelectedTeam] = useState(ticket.assignedTeam);
  const [selectedAgent, setSelectedAgent] = useState(ticket.assignedAgent?._id || '');

  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'history' | 'escalations'

  // Handle status update
  const handleStatusChange = async (newStatus) => {
    setSelectedStatus(newStatus);
    await onUpdateTicket(ticket._id, {
      status: newStatus,
      changedBy: currentUser?.name || 'Agent',
    });
  };

  // Handle priority update (triggers SLA recalculation!)
  const handlePriorityChange = async (newPriority) => {
    setSelectedPriority(newPriority);
    await onUpdateTicket(ticket._id, {
      priority: newPriority,
      changedBy: currentUser?.name || 'Agent',
    });
  };

  // Handle agent assignment
  const handleAgentChange = async (newAgentId) => {
    setSelectedAgent(newAgentId);
    await onUpdateTicket(ticket._id, {
      assignedAgent: newAgentId || null,
      changedBy: currentUser?.name || 'Agent',
    });
  };

  // Handle team assignment
  const handleTeamChange = async (newTeam) => {
    setSelectedTeam(newTeam);
    await onUpdateTicket(ticket._id, {
      assignedTeam: newTeam,
      changedBy: currentUser?.name || 'Agent',
    });
  };

  // Handle comment submit
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      await onAddComment(ticket._id, {
        content: commentContent.trim(),
        authorId: currentUser?._id || null,
        authorName: currentUser?.name || 'Agent',
        authorRole: currentUser?.role || 'agent',
        isInternal,
      });
      setCommentContent('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const isResolvedOrClosed = ['Resolved', 'Closed'].includes(ticket.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90 sticky top-0 z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                {ticket.ticketNumber}
              </span>
              <SLABadge status={ticket.slaStatus} size="md" />
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                {ticket.issueCategory}
              </span>
              <span className="text-xs text-slate-400">
                Created: {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
              {ticket.subject}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Simulated Escalation Alert Banner (if At Risk or Breached) */}
          {['At Risk', 'Breached'].includes(ticket.slaStatus) && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                ticket.slaStatus === 'Breached'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <BellRing
                  className={`w-5 h-5 ${
                    ticket.slaStatus === 'Breached' ? 'text-rose-400 animate-bounce' : 'text-amber-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {ticket.slaStatus === 'Breached'
                      ? 'Critical SLA Threshold Exceeded'
                      : 'Deadline Approaching - At Risk'}
                  </div>
                  <div className="text-xs opacity-90">
                    {ticket.slaStatus === 'Breached'
                      ? 'Automated escalation notification simulated to Technical Lead & Ops Slack channel.'
                      : 'Urgent resolution required before target breach threshold.'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/30 border border-white/10 whitespace-nowrap">
                Alert Dispatched
              </span>
            </div>
          )}

          {/* Real-time SLA Countdowns Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiveCountdown
              dueDate={ticket.firstResponseDue}
              completedAt={ticket.firstResponseAt}
              createdDate={ticket.createdAt}
              type="First Response"
            />
            <LiveCountdown
              dueDate={ticket.resolutionDue}
              completedAt={ticket.resolvedAt}
              createdDate={ticket.createdAt}
              type="Ticket Resolution"
            />
          </div>

          {/* Quick Management Toolbar: Status, Priority, Team, Agent */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Status Dropdown */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-brand-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>

            {/* Priority Dropdown (Recalculates SLA) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-brand-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Team Dropdown */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-brand-500"
              >
                <option value="Technical Support">Technical Support</option>
                <option value="Billing">Billing</option>
                <option value="Account">Account</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Assigned Agent Dropdown */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-brand-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.team})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Reference & Description */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Customer Reference:</span>
              <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">
                {ticket.customerReference}
              </span>
            </div>
            <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed pt-2 border-t border-slate-800/60">
              {ticket.description}
            </div>
          </div>

          {/* Tab Navigation: Comments & Responses | Full Audit History | Escalation Log */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'comments'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Responses & Notes ({ticket.comments?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Trail ({ticket.history?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('escalations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'escalations'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Escalation Log ({ticket.escalationLog?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: Comments & Responses */}
            {activeTab === 'comments' && (
              <div className="pt-4 space-y-4">
                {/* Comments List */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {(!ticket.comments || ticket.comments.length === 0) ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No public replies or internal notes yet.
                    </div>
                  ) : (
                    ticket.comments.map((comment, idx) => (
                      <div
                        key={comment._id || idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                          comment.isInternal
                            ? 'bg-amber-500/10 border-amber-500/20 text-slate-200'
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{comment.authorName}</span>
                            {comment.isInternal ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Internal Note
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400">
                                Public Response
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(comment.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleCommentSubmit} className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInternal(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          !isInternal
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Public Response
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInternal(true)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          isInternal
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Internal Note</span>
                      </button>
                    </div>

                    {!ticket.firstResponseAt && !isInternal && (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Will fulfill First Response SLA
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      rows="3"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder={
                        isInternal
                          ? 'Add private technical notes visible only to internal staff...'
                          : 'Write response to customer (will mark First Response on time if pending)...'
                      }
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentContent.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingComment ? 'Sending...' : isInternal ? 'Save Internal Note' : 'Send Response'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Full Audit History */}
            {activeTab === 'history' && (
              <div className="pt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                {ticket.history?.map((h, idx) => (
                  <div
                    key={h._id || idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-semibold text-slate-300">
                        {h.changedBy || 'System'}
                      </span>
                      <span>{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="font-mono text-brand-400 font-bold text-[11px]">{h.action}</div>
                    {h.previousValue && (
                      <div className="text-slate-400 text-[11px]">
                        <span className="line-through text-slate-500">{h.previousValue}</span>
                        <span className="mx-1.5 text-slate-500">→</span>
                        <span className="text-emerald-400 font-medium">{h.newValue}</span>
                      </div>
                    )}
                    {!h.previousValue && h.newValue && (
                      <div className="text-slate-300 text-[11px]">{h.newValue}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Escalation Log */}
            {activeTab === 'escalations' && (
              <div className="pt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                {(!ticket.escalationLog || ticket.escalationLog.length === 0) ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No SLA breach thresholds or escalations triggered yet.
                  </div>
                ) : (
                  ticket.escalationLog.map((esc, idx) => (
                    <div
                      key={esc._id || idx}
                      className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-400 flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4" />
                          <span>{esc.thresholdCrossed}</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(esc.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px]">{esc.details}</div>
                      <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Simulated Webhook / Pager Alert Delivered</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
