import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DbGroup {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface DbGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface DbMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  is_ai: boolean;
  thread_id: string | null;
  created_at: string;
  is_pinned: boolean;
  reply_to_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
}

export function useGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createGroup = useCallback(async (name: string, description?: string) => {
    if (!user) return null;

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          owner_id: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as owner member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      setGroups(prev => [group, ...prev]);
      
      toast({
        title: 'Group created',
        description: `"${name}" has been created successfully.`,
      });

      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Failed to create group',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  const updateGroupName = useCallback(async (groupId: string, newName: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: newName })
        .eq('id', groupId)
        .eq('owner_id', user.id);

      if (error) throw error;

      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, name: newName } : g
      ));

      toast({
        title: 'Group renamed',
        description: `Group has been renamed to "${newName}".`,
      });

      return true;
    } catch (error) {
      console.error('Error updating group name:', error);
      toast({
        title: 'Failed to rename group',
        description: 'You can only rename groups you own.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, loading, createGroup, updateGroupName, refetchGroups: fetchGroups };
}

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<DbGroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const fetchMembers = async () => {
      try {
        // First get group members
        const { data: memberData, error } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', groupId);

        if (error) throw error;
        
        if (!memberData || memberData.length === 0) {
          setMembers([]);
          setLoading(false);
          return;
        }

        // Then fetch profiles for these members
        const userIds = memberData.map(m => m.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        console.log('Fetched profiles:', profilesData);

        // Combine the data - ensure we always have profile data with fallbacks
        const membersWithProfiles = memberData.map(member => {
          const profile = profilesData?.find(p => p.id === member.user_id);
          return {
            ...member,
            profiles: profile ? {
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              avatar_url: profile.avatar_url,
            } : undefined,
          };
        });

        setMembers(membersWithProfiles as DbGroupMember[]);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();

    // Subscribe to member changes
    const channel = supabase
      .channel(`group_members:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return { members, loading };
}

export function useMessages(groupId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to message changes
    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as DbMessage;
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as DbMessage;
            setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
          } else if (payload.eventType === 'DELETE') {
            const deletedMessage = payload.old as { id: string };
            setMessages(prev => prev.filter(m => m.id !== deletedMessage.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const sendMessage = useCallback(async (
    content: string, 
    isAi = false, 
    threadId?: string | null,
    replyToId?: string | null,
    file?: { url: string; name: string; type: string; size: number } | null
  ) => {
    if (!groupId || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
          is_ai: isAi,
          thread_id: threadId,
          reply_to_id: replyToId || null,
          file_url: file?.url || null,
          file_name: file?.name || null,
          file_type: file?.type || null,
          file_size: file?.size || null,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [groupId, user]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent } : m));
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  }, [user]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
    return false;
    }
  }, [user]);

  const togglePin = useCallback(async (messageId: string) => {
    if (!user) return false;

    try {
      // Get current pin status
      const message = messages.find(m => m.id === messageId);
      if (!message) return false;

      const { error } = await supabase
        .from('messages')
        .update({ is_pinned: !message.is_pinned })
        .eq('id', messageId);

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_pinned: !m.is_pinned } : m));
      return true;
    } catch (error) {
      console.error('Error toggling pin:', error);
      return false;
    }
  }, [user, messages]);

  return { messages, loading, sendMessage, editMessage, deleteMessage, togglePin };
}
