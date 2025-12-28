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
      // First get invitations
      const { data: invData, error: invError } = await supabase
        .from('invitations')
        .select(`
          id,
          token,
          group_id,
          created_at,
          expires_at,
          invited_by,
          groups(name)
        `)
        .eq('email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (invError) {
        console.error('Error fetching invitations:', invError);
        return;
      }

      if (!invData || invData.length === 0) {
        setInvitations([]);
        setLoading(false);
        return;
      }

      // Get inviter profiles
      const inviterIds = [...new Set(invData.map((inv: any) => inv.invited_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', inviterIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const formatted: PendingInvitation[] = invData.map((inv: any) => {
        const inviterProfile = profileMap.get(inv.invited_by);
        return {
          id: inv.id,
          token: inv.token,
          group_id: inv.group_id,
          group_name: inv.groups?.name || 'Unknown Group',
          invited_by_name: inviterProfile?.full_name || inviterProfile?.email || 'Someone',
          created_at: inv.created_at,
          expires_at: inv.expires_at,
        };
      });

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
