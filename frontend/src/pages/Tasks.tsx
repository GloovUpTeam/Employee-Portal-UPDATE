import React, { useEffect, useState, useRef } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchTasks, fetchAllTasks, createTask, updateTask, fetchProjects } from '../services/taskService';
import { Task } from '../types';
import TaskCard from '../components/TaskCard';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // New Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');

  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Data
      const fetchedTasks = isAdmin
        ? await fetchAllTasks()
        : await fetchTasks(); // Service handles strict "my tasks" logic

      if (isAdmin) {
        fetchProjects().then(setProjects).catch(console.error);
      }

      // 2. Set State Directly
      setTasks(fetchedTasks);
      setError(null);
    } catch (err: any) {
      console.error('[Tasks] Load Failed:', err);
      // Don't clear tasks on error if we want to show stale data, or do clear? 
      // User says "No tasks found" only if DB empty.
      // If error, maybe show error.
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newTaskProjectId) {
      alert("Please select a project.");
      return;
    }

    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDesc,
        status: 'Pending',
        priority: newTaskPriority,
        // created_by: user.id, // Handled safely in service
        // assigned_employee_id: user.id, // REMOVED: Tasks belong to projects, not users directly
        due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
        project_id: newTaskProjectId
      });

      setIsModalOpen(false);
      // Reset form
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskProjectId('');


      // Reload
      loadData();
    } catch (err) {
      console.error('Failed to create task', err);
      alert('Failed to create task');
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  // Simple client-side filter for tabs, but ensuring "All" returns everything
  const filteredTasks = selectedFilter === "all"
    ? tasks
    : tasks.filter(t => (t.status || 'Pending').toLowerCase().replace(/\s+/g, '_') === selectedFilter.toLowerCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DCD9C]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl inline-block">
          <AlertCircle className="mx-auto mb-2" />
          {error}
          <button onClick={loadData} className="block mx-auto mt-4 text-sm underline hover:text-white">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <p className="text-gray-400 text-sm">Manage your daily tasks and projects</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1DCD9C] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#1abe90] transition-colors"
          >
            <Plus size={20} /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedFilter === "all"
            ? 'bg-white text-black'
            : 'bg-[#222] text-gray-400 hover:text-white border border-gray-800'
            }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedFilter("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedFilter === "pending"
            ? 'bg-white text-black'
            : 'bg-[#222] text-gray-400 hover:text-white border border-gray-800'
            }`}
        >
          Pending
        </button>
        <button
          onClick={() => setSelectedFilter("in_progress")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedFilter === "in_progress"
            ? 'bg-white text-black'
            : 'bg-[#222] text-gray-400 hover:text-white border border-gray-800'
            }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setSelectedFilter("completed")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedFilter === "completed"
            ? 'bg-white text-black'
            : 'bg-[#222] text-gray-400 hover:text-white border border-gray-800'
            }`}
        >
          Completed
        </button>
      </div>

      {/* Task List */}
      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusUpdated={handleStatusChange}
            getPriorityColor={getPriorityColor}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-[#222] rounded-xl border border-gray-800 border-dashed">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
            <p>No tasks found.</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isAdmin && isModalOpen && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            aria-hidden={!isModalOpen}
            role="dialog"
            aria-modal="true"
          >
            {/* modal panel */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Create New Task</h3>
                <button
                  type="button"
                  aria-label="Close create task modal"
                  onClick={() => setIsModalOpen(false)}
                  className="ml-4 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* form - make sure handleCreateTask exists */}
              <form onSubmit={handleCreateTask} className="space-y-4">
                {/* Project Selector - Required */}
                <div>
                  <label htmlFor="task-project" className="block text-sm font-medium text-gray-400 mb-1">Project *</label>
                  <select
                    id="task-project"
                    required
                    value={newTaskProjectId}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className="w-full p-2 rounded bg-[#0f0f0f] text-white border border-gray-700 focus:border-[#1DCD9C] outline-none"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="task-title" className="sr-only">Title</label>
                  <input
                    id="task-title"
                    name="title"
                    required
                    className="w-full p-2 rounded bg-[#0f0f0f] text-white"
                    placeholder="Title"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="task-desc" className="sr-only">Description</label>
                  <textarea
                    id="task-desc"
                    name="description"
                    className="w-full p-2 rounded bg-[#0f0f0f] text-white"
                    placeholder="Description"
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded bg-gray-700 text-white">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-emerald-500 text-black">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Tasks;
