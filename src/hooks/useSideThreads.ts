import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DbSideThread {
  id: string;
  group_id: string;
  name: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSideThreadParticipant {
  id: string;
  side_thread_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface DbSideThreadMessage {
  id: string;
  side_thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export function useSideThreads(groupId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<DbSideThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    if (!groupId || !user) {
      setThreads([]);
      setLoading(false);
      return;
    }

    try {
      // First get all threads where user is a participant
      const { data: participations, error: participationError } = await supabase
        .from('side_thread_participants')
        .select('side_thread_id')
        .eq('user_id', user.id);

      if (participationError) throw participationError;

      const threadIds = participations?.map(p => p.side_thread_id) || [];

      if (threadIds.length === 0) {
        // Also check for threads the user created (they might not be added as participant yet)
        const { data: ownThreads, error: ownError } = await supabase
          .from('side_threads')
          .select('*')
          .eq('group_id', groupId)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (ownError) throw ownError;
        setThreads(ownThreads || []);
        setLoading(false);
        return;
      }

      // Fetch threads that belong to this group and user is participant or creator
      const { data, error } = await supabase
        .from('side_threads')
        .select('*')
        .eq('group_id', groupId)
        .or(`id.in.(${threadIds.join(',')}),created_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching side threads:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = useCallback(async (name: string, participantIds: string[]) => {
    if (!groupId || !user) return null;

    try {
      // Create the thread
      const { data: thread, error: threadError } = await supabase
        .from('side_threads')
        .insert({
          group_id: groupId,
          name,
          created_by: user.id,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add creator as participant
      const participants = [user.id, ...participantIds.filter(id => id !== user.id)];
      
      const { error: participantsError } = await supabase
        .from('side_thread_participants')
        .insert(participants.map(userId => ({
          side_thread_id: thread.id,
          user_id: userId,
        })));

      if (participantsError) throw participantsError;

      setThreads(prev => [thread, ...prev]);

      toast({
        title: 'Private thread created',
        description: `"${name}" is now active. Start brainstorming!`,
      });

      return thread;
    } catch (error) {
      console.error('Error creating side thread:', error);
      toast({
        title: 'Failed to create thread',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [groupId, user, toast]);

  return { threads, loading, createThread, refetchThreads: fetchThreads };
}

export function useSideThreadParticipants(threadId: string | null) {
  const [participants, setParticipants] = useState<DbSideThreadParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    const fetchParticipants = async () => {
      try {
        const { data: participantData, error } = await supabase
          .from('side_thread_participants')
          .select('*')
          .eq('side_thread_id', threadId);

        if (error) throw error;

        if (!participantData || participantData.length === 0) {
          setParticipants([]);
          setLoading(false);
          return;
        }

        // Fetch profiles
        const userIds = participantData.map(p => p.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds);

        const participantsWithProfiles = participantData.map(p => ({
          ...p,
          profiles: profilesData?.find(profile => profile.id === p.user_id),
        }));

        setParticipants(participantsWithProfiles as DbSideThreadParticipant[]);
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [threadId]);

  return { participants, loading };
}

export function useSideThreadMessages(threadId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DbSideThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('side_thread_messages')
          .select('*')
          .eq('side_thread_id', threadId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching side thread messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages with realtime
    const channel = supabase
      .channel(`side_thread_messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'side_thread_messages',
          filter: `side_thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMessage = payload.new as DbSideThreadMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!threadId || !user) return;

    try {
      const { error } = await supabase
        .from('side_thread_messages')
        .insert({
          side_thread_id: threadId,
          user_id: user.id,
          content,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending side thread message:', error);
    }
  }, [threadId, user]);

  return { messages, loading, sendMessage };
}
