import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTickets, createTicket, fetchEmployees } from '../services/ticketService';
import { Ticket } from '../types';
import { Ticket as TicketIcon, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Tickets: React.FC = () => {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Ticket State
  const [showCreate, setShowCreate] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'normal', assigneeId: '' });
  const [employees, setEmployees] = useState<{ id: string, full_name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate(); // Add this import if needed, or use useLocation/window

  const isAdmin = profile?.role === 'admin';
  const canCreateTicket = isAdmin; // Alias for UI consistency

  useEffect(() => {
    if (canCreateTicket) {
      fetchEmployees().then(setEmployees).catch(console.error);
    }
  }, [canCreateTicket]);

  const loadTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Service now strictly filters by assigned_to for employees
      const data = await fetchTickets(user.id, profile?.role);
      setTickets(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load tickets. Please check your connection or permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      loadTickets();
    }
  }, [user, profile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canCreateTicket) return;

    setCreating(true);
    try {
      await createTicket({
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        authUserId: user.id,
        assigneeId: newTicket.assigneeId || undefined
      });
      setNewTicket({ title: '', description: '', priority: 'normal', assigneeId: '' });
      setShowCreate(false);
      loadTickets(); // Refresh list
      toast.success('Ticket created successfully');
    } catch (err: any) {
      toast.error('Failed to create ticket: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Tickets</h2>
        {canCreateTicket && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showCreate ? <X size={18} /> : <Plus size={18} />}
            {showCreate ? 'Cancel' : 'New Ticket'}
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">{error}</div>}

      {showCreate && canCreateTicket && (
        <form onSubmit={handleCreate} className="bg-[#222] p-6 rounded-xl border border-gray-800 space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Ticket</h3>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              required
              value={newTicket.title}
              onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
              className="w-full bg-[#333] border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
              placeholder="e.g. Fix login bug"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={newTicket.description}
              onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
              className="w-full bg-[#333] border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none h-24"
              placeholder="Describe the issue..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Priority</label>
            <select
              value={newTicket.priority}
              onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
              className="w-full bg-[#333] border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Assign To (Optional)</label>
            <select
              value={newTicket.assigneeId}
              onChange={e => setNewTicket({ ...newTicket, assigneeId: e.target.value })}
              className="w-full bg-[#333] border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <div className="text-center py-12 bg-[#222] rounded-xl border border-gray-800">
            <TicketIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No tickets found.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} className="bg-[#222] p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">{ticket.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{ticket.description}</p>

                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      Created by: <span className="text-gray-300">{ticket.created_by?.full_name || 'Unknown'}</span>
                    </span>
                    {ticket.assignee && (
                      <span className="flex items-center gap-1">
                        Assigned to: <span className="text-gray-300">{ticket.assignee.full_name}</span>
                      </span>
                    )}
                    <span>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '-'}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${ticket.status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-gray-700 text-gray-400'
                    }`}>
                    {ticket.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs border ${ticket.priority === 'high' || ticket.priority === 'urgent'
                    ? 'border-red-500/30 text-red-400'
                    : 'border-gray-700 text-gray-400'
                    }`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tickets;
