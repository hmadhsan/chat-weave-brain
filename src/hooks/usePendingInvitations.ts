import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PendingInvitation {
  id: string;
  token: string;
  group_id: string;
  group_name: string;
  invited_by_name: string;
  created_at: string;
  expires_at: string;
}

export const usePendingInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    if (!user?.email) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          id,
          token,
          group_id,
          created_at,
          expires_at,
          groups(name),
          profiles!invitations_invited_by_fkey(full_name, email)
        `)
        .eq('email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }

      const formatted: PendingInvitation[] = (data || []).map((inv: any) => ({
        id: inv.id,
        token: inv.token,
        group_id: inv.group_id,
        group_name: inv.groups?.name || 'Unknown Group',
        invited_by_name: inv.profiles?.full_name || inv.profiles?.email || 'Someone',
        created_at: inv.created_at,
        expires_at: inv.expires_at,
      }));

      setInvitations(formatted);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (token: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await supabase.functions.invoke('accept-invitation', {
        body: { inviteToken: token },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      // Refresh invitations list
      await fetchInvitations();

      return { 
        success: true, 
        groupId: response.data?.groupId,
        groupName: response.data?.groupName
      };
    } catch (err) {
      console.error('Error accepting invitation:', err);
      return { success: false, error: 'Failed to accept invitation' };
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user?.email]);

  return {
    invitations,
    loading,
    acceptInvitation,
    refetch: fetchInvitations,
  };
};
