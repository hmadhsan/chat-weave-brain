import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export function useMessageReactions(messageIds: string[]) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    if (messageIds.length === 0) {
      setReactions({});
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (error) throw error;

      const grouped = (data || []).reduce((acc, reaction) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
        return acc;
      }, {} as Record<string, Reaction[]>);

      setReactions(grouped);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  }, [messageIds.join(',')]);

  useEffect(() => {
    fetchReactions();

    // Subscribe to reaction changes
    const channel = supabase
      .channel('message_reactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReactions]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  }, [user]);

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  }, [user]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    const messageReactions = reactions[messageId] || [];
    const hasReacted = messageReactions.some(r => r.user_id === user.id && r.emoji === emoji);

    if (hasReacted) {
      return removeReaction(messageId, emoji);
    } else {
      return addReaction(messageId, emoji);
    }
  }, [user, reactions, addReaction, removeReaction]);

  const getReactionGroups = useCallback((messageId: string): ReactionGroup[] => {
    const messageReactions = reactions[messageId] || [];
    const grouped = messageReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [], hasReacted: false };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user_id);
      if (user && reaction.user_id === user.id) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {} as Record<string, ReactionGroup>);

    return Object.values(grouped);
  }, [reactions, user]);

  return { reactions, loading, addReaction, removeReaction, toggleReaction, getReactionGroups };
}

export function useSideThreadMessageReactions(messageIds: string[]) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    if (messageIds.length === 0) {
      setReactions({});
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('side_thread_message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (error) throw error;

      const grouped = (data || []).reduce((acc, reaction) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
        return acc;
      }, {} as Record<string, Reaction[]>);

      setReactions(grouped);
    } catch (error) {
      console.error('Error fetching side thread reactions:', error);
    } finally {
      setLoading(false);
    }
  }, [messageIds.join(',')]);

  useEffect(() => {
    fetchReactions();

    const channel = supabase
      .channel('side_thread_message_reactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'side_thread_message_reactions',
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReactions]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    const messageReactions = reactions[messageId] || [];
    const hasReacted = messageReactions.some(r => r.user_id === user.id && r.emoji === emoji);

    try {
      if (hasReacted) {
        const { error } = await supabase
          .from('side_thread_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('side_thread_message_reactions')
          .insert({ message_id: messageId, user_id: user.id, emoji });
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  }, [user, reactions]);

  const getReactionGroups = useCallback((messageId: string): ReactionGroup[] => {
    const messageReactions = reactions[messageId] || [];
    const grouped = messageReactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [], hasReacted: false };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user_id);
      if (user && reaction.user_id === user.id) {
        acc[reaction.emoji].hasReacted = true;
      }
      return acc;
    }, {} as Record<string, ReactionGroup>);

    return Object.values(grouped);
  }, [reactions, user]);

  return { reactions, loading, toggleReaction, getReactionGroups };
}
