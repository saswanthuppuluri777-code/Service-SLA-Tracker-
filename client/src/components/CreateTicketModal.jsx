import React, { useState, useMemo } from 'react';
import { X, Sparkles, Clock, ShieldAlert, Plus, Check } from 'lucide-react';

export default function CreateTicketModal({
  isOpen,
  onClose,
  onCreateTicket,
  users = [],
  policies = [],
  currentUser,
}) {
  if (!isOpen) return null;

  const [customerReference, setCustomerReference] = useState('');
  const [issueCategory, setIssueCategory] = useState('Technical');
  const [priority, setPriority] = useState('High');
  const [assignedTeam, setAssignedTeam] = useState('Technical Support');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Dynamically calculate matching SLA policy and deadline previews
  const matchedPolicy = useMemo(() => {
    // 1. Exact match (priority + category)
    let pol = policies.find((p) => p.priority === priority && p.category === issueCategory && p.isActive);
    if (pol) return pol;

    // 2. Priority match
    pol = policies.find((p) => p.priority === priority && p.isActive);
    if (pol) return pol;

    // 3. Fallback
    return {
      name: 'Standard SLA Tier',
      firstResponseTimeMinutes: priority === 'Urgent' ? 15 : priority === 'High' ? 30 : priority === 'Medium' ? 60 : 120,
      resolutionTimeMinutes: priority === 'Urgent' ? 120 : priority === 'High' ? 240 : priority === 'Medium' ? 720 : 1440,
    };
  }, [priority, issueCategory, policies]);

  const formatMins = (mins) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerReference || !subject || !description) {
      setError('Please fill in Customer Reference, Subject, and Description.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onCreateTicket({
        customerReference: customerReference.trim(),
        issueCategory,
        priority,
        assignedTeam,
        assignedAgent: assignedAgent || null,
        slaPolicyId: matchedPolicy?._id || null,
        subject: subject.trim(),
        description: description.trim(),
        createdBy: currentUser?.name || 'Support Staff',
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Create Customer Support Ticket</h2>
              <p className="text-xs text-slate-400">Calculates SLA deadlines dynamically on creation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Customer Reference */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Customer Reference / Organization *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corporation / CUST-9921"
              value={customerReference}
              onChange={(e) => setCustomerReference(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Issue Category *
              </label>
              <select
                value={issueCategory}
                onChange={(e) => {
                  setIssueCategory(e.target.value);
                  // Automatically adjust team if helpful
                  if (e.target.value === 'Billing') setAssignedTeam('Billing');
                  else if (e.target.value === 'Technical') setAssignedTeam('Technical Support');
                  else if (e.target.value === 'Account') setAssignedTeam('Account');
                }}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="Account">Account</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ticket Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Urgent">Urgent (Immediate Outage)</option>
                <option value="High">High (Major Degradation)</option>
                <option value="Medium">Medium (Normal Request)</option>
                <option value="Low">Low (General Inquiry)</option>
              </select>
            </div>
          </div>

          {/* Dynamic SLA Policy Preview Box */}
          <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Matched SLA Policy: {matchedPolicy?.name}</span>
              </span>
              <span className="text-[10px] font-mono uppercase bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                Auto-Computed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 border-t border-brand-500/15">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span>First Response Due:</span>
                <span className="font-bold text-white font-mono">
                  {formatMins(matchedPolicy?.firstResponseTimeMinutes)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Resolution Due:</span>
                <span className="font-bold text-white font-mono">
                  {formatMins(matchedPolicy?.resolutionTimeMinutes)}
                </span>
              </div>
            </div>
          </div>

          {/* Team & Agent Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Assigned Team *
              </label>
              <select
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Technical Support">Technical Support</option>
                <option value="Billing">Billing</option>
                <option value="Account">Account</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Assigned Agent (Optional)
              </label>
              <select
                value={assignedAgent}
                onChange={(e) => setAssignedAgent(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">Leave Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.team})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="Brief summary of the issue or inquiry"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Detailed Description *
            </label>
            <textarea
              rows="3"
              required
              placeholder="Provide context, error codes, affected users, or replication steps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Creating Ticket...' : 'Create Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
