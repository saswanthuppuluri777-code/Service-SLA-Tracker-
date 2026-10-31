import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  Check,
  Sparkles,
} from 'lucide-react';

export default function SLAPoliciesView({
  policies = [],
  loading,
  onCreatePolicy,
  onUpdatePolicy,
  onDeletePolicy,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('High');
  const [category, setCategory] = useState('Technical');
  const [firstResponseTimeMinutes, setFirstResponseTimeMinutes] = useState(30);
  const [resolutionTimeMinutes, setResolutionTimeMinutes] = useState(240);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const formatDuration = (mins) => {
    if (!mins) return '0m';
    const d = Math.floor(mins / 1440);
    const remainingMins = mins % 1440;
    const h = Math.floor(remainingMins / 60);
    const m = remainingMins % 60;

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || parts.length === 0) parts.push(`${m}m`);
    return parts.join(' ');
  };

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setName('');
    setPriority('High');
    setCategory('Technical');
    setFirstResponseTimeMinutes(30);
    setResolutionTimeMinutes(240);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (policy) => {
    setEditingPolicy(policy);
    setName(policy.name);
    setPriority(policy.priority);
    setCategory(policy.category);
    setFirstResponseTimeMinutes(policy.firstResponseTimeMinutes);
    setResolutionTimeMinutes(policy.resolutionTimeMinutes);
    setIsActive(policy.isActive);
    setModalOpen(true);
  };

  const handleToggleActive = async (policy) => {
    await onUpdatePolicy(policy._id, { isActive: !policy.isActive });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPolicy) {
        await onUpdatePolicy(editingPolicy._id, {
          name: name.trim(),
          priority,
          category,
          firstResponseTimeMinutes: Number(firstResponseTimeMinutes),
          resolutionTimeMinutes: Number(resolutionTimeMinutes),
          isActive,
        });
      } else {
        await onCreatePolicy({
          name: name.trim(),
          priority,
          category,
          firstResponseTimeMinutes: Number(firstResponseTimeMinutes),
          resolutionTimeMinutes: Number(resolutionTimeMinutes),
          isActive,
        });
      }
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const priorities = ['Urgent', 'High', 'Medium', 'Low'];
  const categories = ['Technical', 'Billing', 'Account', 'General'];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SLA Policies & Deadline Configuration</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure response and resolution target rules mapped to ticket priority tiers and issue categories
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New SLA Rule</span>
        </button>
      </div>

      {/* SLA Policy Grid Matrix preview */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>SLA Target Matrix (Priority × Category)</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Priority</th>
                {categories.map((cat) => (
                  <th key={cat} className="py-2.5 px-3">{cat}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {priorities.map((prio) => (
                <tr key={prio} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-semibold text-white">{prio}</td>
                  {categories.map((cat) => {
                    const matched = policies.find(
                      (p) => p.priority === prio && p.category === cat && p.isActive
                    );
                    return (
                      <td key={cat} className="py-2.5 px-3">
                        {matched ? (
                          <div className="space-y-0.5">
                            <div className="text-emerald-400 text-[11px]">
                              Resp: {formatDuration(matched.firstResponseTimeMinutes)}
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              Res: {formatDuration(matched.resolutionTimeMinutes)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px] italic">Default rule</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policies Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Rules ({policies.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Policy Name</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">First Response Target</th>
                <th className="py-3 px-4">Resolution Target</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {policies.map((p) => (
                <tr key={p._id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{p.name}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        p.priority === 'Urgent'
                          ? 'bg-rose-500/20 text-rose-400'
                          : p.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-400'
                          : p.priority === 'Medium'
                          ? 'bg-sky-500/20 text-sky-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {p.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">{p.category}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                    {formatDuration(p.firstResponseTimeMinutes)}
                    <span className="text-slate-500 text-[11px] ml-1">({p.firstResponseTimeMinutes}m)</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                    {formatDuration(p.resolutionTimeMinutes)}
                    <span className="text-slate-500 text-[11px] ml-1">({p.resolutionTimeMinutes}m)</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        p.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {p.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePolicy(p._id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Policy Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingPolicy ? 'Edit SLA Policy' : 'Create New SLA Policy'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Policy Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Enterprise Support SLA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Priority Tier *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="Account">Account</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Time Targets */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    First Response (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={firstResponseTimeMinutes}
                    onChange={(e) => setFirstResponseTimeMinutes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                    = {formatDuration(Number(firstResponseTimeMinutes))}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Resolution (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={resolutionTimeMinutes}
                    onChange={(e) => setResolutionTimeMinutes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                    = {formatDuration(Number(resolutionTimeMinutes))}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-brand-500"
                />
                <label htmlFor="activeCheck" className="text-xs text-slate-300 font-medium">
                  Enable policy immediately for new incoming tickets
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-all"
                >
                  {editingPolicy ? 'Save Changes' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
