import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

const InviteMemberModal = ({ isOpen, onClose, groupId, groupName }: InviteMemberModalProps) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleInvite = async () => {
    if (!email.trim()) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('send-invitation', {
        body: {
          email: email.trim(),
          groupId,
          groupName,
          inviterName: profile?.full_name || profile?.email || 'A teammate',
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'Invitation sent!',
        description: `An invitation has been sent to ${email}`,
      });
      
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Failed to send invitation',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Invite to {groupName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <p className="text-xs text-muted-foreground">
              They'll receive an email with a link to join this group.
            </p>
          </div>

          <Button
            onClick={handleInvite}
            disabled={!email.trim() || sending}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberModal;
