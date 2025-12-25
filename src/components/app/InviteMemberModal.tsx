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
import { Link2, Copy, Check, Loader2 } from 'lucide-react';
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
  const [inviteLink, setInviteLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateInviteLink = async () => {
    if (!email.trim()) return;

    setGenerating(true);
    try {
      // Create invitation directly in the database
      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert({
          group_id: groupId,
          email: email.trim().toLowerCase(),
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Generate the invite link
      const appUrl = window.location.origin;
      const link = `${appUrl}/invite/${invitation.token}`;
      setInviteLink(link);

      toast({
        title: 'Invite link generated!',
        description: 'Copy the link and share it with your teammate.',
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Failed to create invitation',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Invite link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setEmail('');
    setInviteLink('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Invite to {groupName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!inviteLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Invitee's email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateInviteLink()}
                />
                <p className="text-xs text-muted-foreground">
                  We'll generate a unique invite link for this email.
                </p>
              </div>

              <Button
                onClick={generateInviteLink}
                disabled={!email.trim() || generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Generate Invite Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Invite link for {email}</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteLink}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link via WhatsApp, Telegram, or any messaging app. The link expires in 7 days.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEmail('');
                    setInviteLink('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Invite Another
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberModal;
