import React, { useState } from "react";
import { updateTaskStatus } from "../services/taskService";
import { Task } from "../types";
import { Clock, Briefcase } from 'lucide-react';
import toast from "react-hot-toast";

interface TaskCardProps {
  task: Task;
  onStatusUpdated?: (id: string, newStatus: string) => void;
  getPriorityColor: (priority: string) => string;
}

export default function TaskCard({ task, onStatusUpdated, getPriorityColor }: TaskCardProps) {
  const [localStatus, setLocalStatus] = useState<string>(task.status);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === localStatus) return;

    // 1. Optimistic Update
    const previousStatus = localStatus;
    setLocalStatus(newStatus);
    setLoading(true);

    try {
      // 2. Call Service
      await updateTaskStatus(task.id, newStatus);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      if (onStatusUpdated) onStatusUpdated(task.id, newStatus);
    } catch (err: any) {
      // 4. Error Handling & Rollback
      console.error(`[UI] Update failed for ${task.id}:`, err);
      setLocalStatus(previousStatus);
      const errorMessage = err.message || "Failed to update status";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#222] border border-gray-800 rounded-xl p-5 hover:border-[#1DCD9C]/30 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {task.project?.name && (
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-purple-500/30 text-purple-400 bg-purple-500/10">
                {task.project.name}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            {task.due_date && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#1DCD9C] transition-colors">{task.title}</h3>
          <p className="text-gray-400 text-sm line-clamp-2 mb-4">{task.description || 'No description'}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            {/* STRICT: Removed "Assigned to [Name]" since it's redundant (always self) or confusing if admin views it.
                 Instead, emphasize the Project context. */}
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-gray-400" />
              <span className="text-gray-400">Project Task</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`status-${task.id}`} className="sr-only">Change status</label>
          <select
            id={`status-${task.id}`}
            aria-label={`Change status for ${task.title}`}
            value={localStatus}
            onChange={handleStatusChange}
            disabled={loading}
            className="bg-[#111] border border-gray-700 text-gray-300 text-xs rounded px-2 py-1 outline-none focus:border-[#1DCD9C] disabled:opacity-50 cursor-pointer"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>
    </div>
  );
}
