import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gsap } from 'gsap';
import {
  MessageSquare, Plus, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, AlertCircle, Tag, Send, X
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';
import { GET_CUSTOMER_SUPPORT_TICKETS } from '../../api/queries';
import { CREATE_SUPPORT_TICKET, CREATE_SUPPORT_TICKET_RESPONSE } from '../../api/mutations';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: 'Open',        color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20' },
  RESOLVED:    { label: 'Resolved',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  CLOSED:      { label: 'Closed',      color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20' },
};
const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:      { label: 'Low',      color: 'text-blue-400' },
  MEDIUM:   { label: 'Medium',   color: 'text-yellow-400' },
  HIGH:     { label: 'High',     color: 'text-orange-400' },
  CRITICAL: { label: 'Critical', color: 'text-red-400' },
};
const CATEGORIES = ['Shipment Issue', 'Payment Problem', 'Quote Request', 'Driver Complaint', 'Damage Report', 'Delay Notification', 'Lost Cargo', 'Other'];

const PAGE_SIZE = 5;

const CustomerSupport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [formData, setFormData] = useState({ subject: '', description: '', category: CATEGORIES[0], priority: 'MEDIUM' });

  const { data, loading, refetch } = useQuery(GET_CUSTOMER_SUPPORT_TICKETS, {
    variables: { page, pageSize: PAGE_SIZE },
    fetchPolicy: 'network-only'
  });

  const tickets = data?.supportTickets?.items || [];
  const totalCount = data?.supportTickets?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginated = tickets; // API handles pagination on backend side

  const activeTicket = selectedTicket
    ? tickets.find((t: any) => t.id === selectedTicket.id) || selectedTicket
    : null;

  const [createTicket] = useMutation(CREATE_SUPPORT_TICKET, {
    onCompleted: () => {
      toast.success('Support ticket created successfully!');
      setShowCreate(false);
      setFormData({ subject: '', description: '', category: CATEGORIES[0], priority: 'MEDIUM' });
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create ticket');
    }
  });

  const [replyTicket] = useMutation(CREATE_SUPPORT_TICKET_RESPONSE, {
    onCompleted: () => {
      toast.success('Reply sent!');
      setNewMessage('');
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send reply');
    }
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    createTicket({
      variables: {
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority
      }
    });
  };

  const handleSendReply = () => {
    if (!newMessage.trim() || !activeTicket) return;
    replyTicket({
      variables: {
        ticketId: activeTicket.id,
        message: newMessage
      }
    });
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
              <MessageSquare size={20} className="text-yellow-400" />
            </div>
            Support Center
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 ml-[52px]">Raise issues, complaints, or questions</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors">
          <Plus size={14} />New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['OPEN','IN_PROGRESS','RESOLVED','CLOSED'] as const).map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = tickets.filter((t: any) => t.status === s).length;
          return (
            <div key={s} className={`glass border rounded-2xl p-4 ${cfg.bg}`}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{cfg.label}</p>
              <p className={`text-2xl font-black mt-1 ${cfg.color}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {paginated.map((ticket: any) => {
          const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG['OPEN'];
          const priCfg = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG['MEDIUM'];
          return (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
              className="glass border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-500/30 cursor-pointer transition-all hover:bg-[var(--color-surface-2)]/20 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-[var(--color-text-muted)]">#{ticket.id.toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
                    <span className={`text-[9px] font-bold uppercase ${priCfg.color}`}>{priCfg.label} Priority</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[9px] text-[var(--color-text-muted)]">
                      <Tag size={8} className="inline mr-1" />{ticket.category}
                    </span>
                  </div>
                  <p className="font-bold text-[var(--color-text)] mt-2 group-hover:text-orange-400 transition-colors">{ticket.subject}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1 line-clamp-2">{ticket.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-[var(--color-text-muted)]">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  <p className="text-[9px] text-orange-400 mt-1">{ticket.responses.length} response{ticket.responses.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2"><MessageSquare size={16} className="text-orange-500" />New Support Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Subject *</label>
                <input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} maxLength={150}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:border-orange-500/50" placeholder="Brief description of the issue" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none">
                    {Object.keys(PRIORITY_CONFIG).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-[var(--color-text-muted)] uppercase font-bold mb-1">Description *</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} maxLength={1000} rows={4}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:border-orange-500/50 resize-none" placeholder="Describe the issue in detail..." />
                <p className="text-[9px] text-[var(--color-text-muted)] mt-1 text-right">{formData.description.length}/1000</p>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors">Submit Ticket</button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass border border-[var(--color-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] text-[var(--color-text-muted)]">#{activeTicket.id.toUpperCase()}</p>
                <h3 className="font-bold text-[var(--color-text)]">{activeTicket.subject}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text)]">{activeTicket.description}</p>
              </div>
              {activeTicket.responses.map((r: any) => (
                <div key={r.id} className={`p-4 rounded-xl border text-xs ${r.isStaff ? 'bg-orange-500/5 border-orange-500/20 ml-4' : 'bg-[var(--color-surface-2)] border-[var(--color-border)] mr-4'}`}>
                  <p className={`font-bold mb-1 ${r.isStaff ? 'text-orange-400' : 'text-[var(--color-text)]'}`}>{r.isStaff ? '🎧 Support Team' : '👤 You'}</p>
                  <p className="text-[var(--color-text)]">{r.message}</p>
                  <p className="text-[9px] text-[var(--color-text-muted)] mt-2">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {activeTicket.status !== 'CLOSED' && activeTicket.status !== 'RESOLVED' && (
                <div className="flex gap-3">
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:outline-none focus:border-orange-500/50" />
                  <button onClick={handleSendReply} className="px-4 py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSupport;
