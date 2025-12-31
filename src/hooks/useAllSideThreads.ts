import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AllSideThread {
  id: string;
  group_id: string;
  name: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export function useAllSideThreads(groupIds: string[]) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<AllSideThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllThreads = useCallback(async () => {
    if (!user || groupIds.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all threads the user is a participant in
      const { data: participantData } = await supabase
        .from('side_thread_participants')
        .select('side_thread_id')
        .eq('user_id', user.id);

      const participantThreadIds = participantData?.map((p) => p.side_thread_id) || [];
      const orFilter = participantThreadIds.length
        ? `id.in.(${participantThreadIds.join(',')}),created_by.eq.${user.id}`
        : `created_by.eq.${user.id}`;

      // Fetch all threads
      const { data, error } = await supabase
        .from('side_threads')
        .select('*')
        .in('group_id', groupIds)
        .or(orFilter)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching all threads:', error);
    } finally {
      setLoading(false);
    }
  }, [user, groupIds]);

  useEffect(() => {
    fetchAllThreads();
  }, [fetchAllThreads]);

  return { threads, loading, refetch: fetchAllThreads };
}