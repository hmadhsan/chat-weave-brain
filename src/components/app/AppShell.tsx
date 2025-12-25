import { useState, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { PrivateThread, ThreadMessage, User, Group, Message } from '@/types/sidechat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGroups, useMessages, useGroupMembers } from '@/hooks/useGroups';
import GroupSidebar from './GroupSidebar';
import GroupChat from './GroupChat';
import PrivateThreadPanel from './PrivateThreadPanel';
import CreateThreadModal from './CreateThreadModal';
import CreateGroupModal from './CreateGroupModal';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppShell = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  // Real database hooks
  const { groups: dbGroups, loading: groupsLoading, createGroup: dbCreateGroup, refetchGroups } = useGroups();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const { messages: dbMessages, sendMessage: dbSendMessage } = useMessages(activeGroupId);
  const { members: dbMembers } = useGroupMembers(activeGroupId);

  // Create a User object from the authenticated user
  const currentUser: User = useMemo(() => ({
    id: user?.id || 'unknown',
    name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You',
    email: user?.email || profile?.email || '',
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || undefined,
    status: 'online' as const,
  }), [user, profile]);

  // Convert db members to User objects
  const groupUsers = useMemo((): User[] => {
    const memberUsers: User[] = dbMembers.map(m => ({
      id: m.user_id,
      name: m.profiles?.full_name || m.profiles?.email?.split('@')[0] || 'User',
      email: m.profiles?.email || '',
      avatar: m.profiles?.avatar_url || undefined,
      status: 'online' as const,
    }));
    
    // Ensure current user is always included
    if (!memberUsers.find(u => u.id === currentUser.id)) {
      memberUsers.push(currentUser);
    }
    
    return memberUsers;
  }, [dbMembers, currentUser]);

  // Convert db groups to Group format
  const groups: Group[] = useMemo(() => {
    return dbGroups.map(g => ({
      id: g.id,
      name: g.name,
      members: groupUsers,
      createdAt: new Date(g.created_at),
    }));
  }, [dbGroups, groupUsers]);

  // Convert db messages to Message format
  const groupMessages: Message[] = useMemo(() => {
    return dbMessages.map(m => ({
      id: m.id,
      groupId: m.group_id,
      userId: m.user_id,
      content: m.content,
      createdAt: new Date(m.created_at),
      isAI: m.is_ai,
      threadId: m.thread_id || undefined,
    }));
  }, [dbMessages]);

  // Set initial active group
  useEffect(() => {
    if (!activeGroupId && groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  // Check for pending invite after auth
  useEffect(() => {
    const pendingInvite = sessionStorage.getItem('pendingInvite');
    if (pendingInvite && user) {
      sessionStorage.removeItem('pendingInvite');
      // Navigate to invite page - this is handled by the AcceptInvite component
    }
  }, [user]);

  // Local state for threads (not persisted yet)
  const [threads, setThreads] = useState<PrivateThread[]>([]);
  const [activeThread, setActiveThread] = useState<PrivateThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSendingToAI, setIsSendingToAI] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const currentThreadMessages = threadMessages.filter((m) => m.threadId === activeThread?.id);

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveThread(null);
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeGroupId) return;
    await dbSendMessage(content);
  }, [activeGroupId, dbSendMessage]);

  const handleCreateThread = (name: string, members: User[]) => {
    if (!activeGroupId) return;

    const newThread: PrivateThread = {
      id: uuidv4(),
      groupId: activeGroupId,
      name,
      members,
      createdAt: new Date(),
      isActive: true,
    };

    setThreads((prev) => [...prev, newThread]);
    setActiveThread(newThread);
    
    toast({
      title: 'Private thread created',
      description: `"${name}" is now active. Start brainstorming!`,
    });
  };

  const handleCreateGroup = async (name: string) => {
    const newGroup = await dbCreateGroup(name);
    if (newGroup) {
      setActiveGroupId(newGroup.id);
    }
  };

  const handleSendThreadMessage = useCallback((content: string) => {
    if (!activeThread) return;

    const newMessage: ThreadMessage = {
      id: uuidv4(),
      threadId: activeThread.id,
      userId: currentUser.id,
      content,
      createdAt: new Date(),
    };

    setThreadMessages((prev) => [...prev, newMessage]);
  }, [activeThread, currentUser.id]);

  const handleSendToAI = async () => {
    if (!activeThread || !activeGroupId || currentThreadMessages.length === 0) return;

    setIsSendingToAI(true);

    try {
      // Build thread context with actual user names
      const threadContext = currentThreadMessages.map((m) => {
        const msgUser = groupUsers.find((u) => u.id === m.userId);
        return `${msgUser?.name || 'Unknown'}: ${m.content}`;
      }).join('\n');

      // Call the real AI edge function
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { 
          threadContext,
          threadName: activeThread.name
        }
      });

      if (error) {
        console.error('AI function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const aiContent = data?.content;
      if (!aiContent) {
        throw new Error('No response from AI');
      }

      // Insert AI message to database
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          group_id: activeGroupId,
          user_id: user!.id,
          content: aiContent,
          is_ai: true,
          thread_id: activeThread.id,
        });

      if (insertError) {
        console.error('Error inserting AI message:', insertError);
      }

      setActiveThread(null);

      toast({
        title: 'AI response posted',
        description: 'The AI has analyzed your discussion and shared insights in the main chat.',
      });
    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        title: 'AI request failed',
        description: error instanceof Error ? error.message : 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingToAI(false);
    }
  };

  const handleCloseThread = () => {
    setActiveThread(null);
  };

  // Loading state
  if (groupsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your groups...</p>
        </div>
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="h-screen flex bg-background overflow-hidden">
        {/* Sidebar */}
        <GroupSidebar
          groups={groups}
          activeGroupId={activeGroupId}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={() => setIsGroupModalOpen(true)}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              No groups yet
            </h2>
            <p className="text-muted-foreground">Click the + button to create a group</p>
          </div>
        </div>

        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          onCreate={(name) => handleCreateGroup(name)}
          availableMembers={[currentUser]}
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <GroupSidebar
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={() => setIsGroupModalOpen(true)}
      />

      {/* Main Chat */}
      <GroupChat
        group={activeGroup}
        messages={groupMessages}
        users={groupUsers}
        currentUserId={currentUser.id}
        onSendMessage={handleSendMessage}
        onStartThread={() => setIsThreadModalOpen(true)}
        activeThread={activeThread}
        groupId={activeGroupId || undefined}
      />

      {/* Private Thread Panel */}
      <AnimatePresence>
        {activeThread && (
          <PrivateThreadPanel
            thread={activeThread}
            messages={currentThreadMessages}
            users={groupUsers}
            currentUserId={currentUser.id}
            onClose={handleCloseThread}
            onSendMessage={handleSendThreadMessage}
            onSendToAI={handleSendToAI}
            isSendingToAI={isSendingToAI}
          />
        )}
      </AnimatePresence>

      {/* Create Thread Modal */}
      <CreateThreadModal
        isOpen={isThreadModalOpen}
        onClose={() => setIsThreadModalOpen(false)}
        onCreate={handleCreateThread}
        availableMembers={groupUsers}
        currentUser={currentUser}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreate={(name) => handleCreateGroup(name)}
        availableMembers={[currentUser]}
        currentUser={currentUser}
      />
    </div>
  );
};

export default AppShell;
