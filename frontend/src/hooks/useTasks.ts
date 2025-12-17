import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { Task } from '../types';

interface UseTasksOptions {
  assignedTo?: string;
  status?: string;
}

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useTasks = ({ assignedTo, status }: UseTasksOptions = {}): UseTasksResult => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => {
    setTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!supabase || typeof supabase.from !== 'function') {
           throw new Error('Supabase client not initialized');
        }

        let query = supabase
          .from('tasks')
          .select(`
            *,
            assignee:profiles!assigned_to(id, full_name, email)
          `)
          .order('created_at', { ascending: false });

        if (assignedTo) {
          query = query.eq('assigned_to', assignedTo);
        }
        if (status && status !== 'All') {
          query = query.eq('status', status);
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;

        if (mounted) {
          setTasks(data as unknown as Task[]);
        }
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(err.message || 'Unknown error'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTasks();

    return () => {
      mounted = false;
    };
  }, [assignedTo, status, trigger]);

  return { tasks, loading, error, refetch };
};
