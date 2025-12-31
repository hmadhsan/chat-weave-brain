import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { User, Group, Message } from '@/types/sidechat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGroups, useMessages, useGroupMembers } from '@/hooks/useGroups';
import { useSideThreads, useSideThreadMessages, DbSideThread } from '@/hooks/useSideThreads';
import { useAllSideThreads } from '@/hooks/useAllSideThreads';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { useNotificationSound } from '@/hooks/useNotificationSound';
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
  const { groups: dbGroups, loading: groupsLoading, createGroup: dbCreateGroup, updateGroupName: dbUpdateGroupName, refetchGroups } = useGroups();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const { messages: dbMessages, sendMessage: dbSendMessage, editMessage: dbEditMessage, deleteMessage: dbDeleteMessage, togglePin: dbTogglePin } = useMessages(activeGroupId);
  const { members: dbMembers } = useGroupMembers(activeGroupId);

  // Pending invitations
  const { invitations: pendingInvitations, acceptInvitation, loading: invitationsLoading } = usePendingInvitations();

  // Side threads from database
  const { threads: dbThreads, createThread: dbCreateThread, deleteThread: dbDeleteThread, updateThreadName: dbUpdateThreadName } = useSideThreads(activeGroupId);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { messages: threadMessages, sendMessage: sendThreadMessage, editMessage: editThreadMessage, deleteMessage: deleteThreadMessage, togglePin: toggleThreadPin } = useSideThreadMessages(activeThreadId);
  
  // All threads for sidebar (across all groups)
  const groupIds = useMemo(() => dbGroups.map(g => g.id), [dbGroups]);
  const { threads: allThreads } = useAllSideThreads(groupIds);
  
  // Notification sound
  const { play: playNotificationSound } = useNotificationSound();
  const prevMessageCount = useRef<number>(0);

  // Create a User object from the authenticated user
  const currentUser: User = useMemo(() => ({
    id: user?.id || 'unknown',
    name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You',
    email: user?.email || profile?.email || '',
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || undefined,
    status: 'online' as const,
  }), [user, profile]);

  // Convert db members to User objects with proper fallbacks
  const groupUsers = useMemo((): User[] => {
    const memberUsers: User[] = dbMembers.map(m => {
      const email = m.profiles?.email || '';
      const emailName = email ? email.split('@')[0] : '';
      const displayName = m.profiles?.full_name || emailName || 'User';
      
      return {
        id: m.user_id,
        name: displayName,
        email: email,
        avatar: m.profiles?.avatar_url || undefined,
        status: 'online' as const,
      };
    });
    
    // Ensure current user is always included with their proper name
    const existingCurrentUser = memberUsers.find(u => u.id === currentUser.id);
    if (!existingCurrentUser) {
      memberUsers.push(currentUser);
    } else {
      // Update current user with fresh profile data
      const idx = memberUsers.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        memberUsers[idx] = {
          ...memberUsers[idx],
          name: currentUser.name || memberUsers[idx].name,
          avatar: currentUser.avatar || memberUsers[idx].avatar,
        };
      }
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

  // Convert db messages to Message format with replies
  const groupMessages = useMemo(() => {
    const messageMap = new Map(dbMessages.map(m => [m.id, m]));
    
    return dbMessages.map(m => {
      const replyTo = m.reply_to_id ? messageMap.get(m.reply_to_id) : null;
      return {
        id: m.id,
        groupId: m.group_id,
        userId: m.user_id,
        content: m.content,
        createdAt: new Date(m.created_at),
        isAI: m.is_ai,
        threadId: m.thread_id || undefined,
        is_pinned: m.is_pinned,
        replyToId: m.reply_to_id || undefined,
        replyTo: replyTo ? {
          id: replyTo.id,
          groupId: replyTo.group_id,
          userId: replyTo.user_id,
          content: replyTo.content,
          createdAt: new Date(replyTo.created_at),
        } : undefined,
        fileUrl: m.file_url || undefined,
        fileName: m.file_name || undefined,
        fileType: m.file_type || undefined,
        fileSize: m.file_size || undefined,
      };
    });
  }, [dbMessages]);

  // Get active thread object
  const activeThread: DbSideThread | null = useMemo(() => {
    return dbThreads.find(t => t.id === activeThreadId) || null;
  }, [dbThreads, activeThreadId]);

  // Convert thread messages to the format needed by PrivateThreadPanel with replies
  const currentThreadMessages = useMemo(() => {
    const messageMap = new Map(threadMessages.map(m => [m.id, m]));
    
    return threadMessages.map(m => {
      const replyTo = m.reply_to_id ? messageMap.get(m.reply_to_id) : null;
      return {
        id: m.id,
        threadId: m.side_thread_id,
        userId: m.user_id,
        content: m.content,
        createdAt: new Date(m.created_at),
        is_pinned: m.is_pinned,
        replyToId: m.reply_to_id || undefined,
        replyTo: replyTo ? {
          id: replyTo.id,
          threadId: replyTo.side_thread_id,
          userId: replyTo.user_id,
          content: replyTo.content,
          createdAt: new Date(replyTo.created_at),
        } : undefined,
        fileUrl: m.file_url || undefined,
        fileName: m.file_name || undefined,
        fileType: m.file_type || undefined,
        fileSize: m.file_size || undefined,
      };
    });
  }, [threadMessages]);

  // Set initial active group
  useEffect(() => {
    if (!activeGroupId && groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  // Play notification sound for new messages
  useEffect(() => {
    if (prevMessageCount.current > 0 && dbMessages.length > prevMessageCount.current) {
      // Check if the new message is from someone else
      const latestMessage = dbMessages[dbMessages.length - 1];
      if (latestMessage && latestMessage.user_id !== user?.id) {
        playNotificationSound();
      }
    }
    prevMessageCount.current = dbMessages.length;
  }, [dbMessages, user?.id, playNotificationSound]);

  // Check for pending invite after auth
  useEffect(() => {
    const pendingInvite = sessionStorage.getItem('pendingInvite');
    if (pendingInvite && user) {
      sessionStorage.removeItem('pendingInvite');
    }
  }, [user]);

  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSendingToAI, setIsSendingToAI] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveThreadId(null);
  };

  const handleAcceptInvitation = async (token: string) => {
    const result = await acceptInvitation(token);
    if (result.success) {
      toast({
        title: 'Invitation accepted!',
        description: `You've joined ${result.groupName || 'the group'}`,
      });
      // Refresh groups list to show new group
      await refetchGroups();
      if (result.groupId) {
        setActiveGroupId(result.groupId);
      }
    } else {
      toast({
        title: 'Failed to accept invitation',
        description: result.error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = useCallback(async (
    content: string, 
    replyToId?: string | null,
    file?: { url: string; name: string; type: string; size: number } | null
  ) => {
    if (!activeGroupId) return;
    await dbSendMessage(content, false, null, replyToId, file);
  }, [activeGroupId, dbSendMessage]);

  const handleCreateThread = async (name: string, members: User[]) => {
    if (!activeGroupId) return;

    const memberIds = members.map(m => m.id);
    const newThread = await dbCreateThread(name, memberIds);
    
    if (newThread) {
      setActiveThreadId(newThread.id);
    }
  };

  const handleCreateGroup = async (name: string) => {
    const newGroup = await dbCreateGroup(name);
    if (newGroup) {
      setActiveGroupId(newGroup.id);
    }
  };

  const handleSendThreadMessage = useCallback(async (
    content: string,
    replyToId?: string | null,
    file?: { url: string; name: string; type: string; size: number } | null
  ) => {
    if (!activeThreadId) return;
    await sendThreadMessage(content, replyToId, file);
  }, [activeThreadId, sendThreadMessage]);

  // Forward message handler
  const handleForwardMessage = useCallback(async (
    content: string,
    targetId: string,
    targetType: 'group' | 'thread'
  ) => {
    if (targetType === 'group') {
      await dbSendMessage(`📨 Forwarded message:\n\n${content}`, false, null, null, null);
    } else {
      await sendThreadMessage(`📨 Forwarded message:\n\n${content}`, null, null);
    }
    toast({
      title: 'Message forwarded',
      description: 'The message has been forwarded successfully.',
    });
  }, [dbSendMessage, sendThreadMessage, toast]);

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

      // Insert AI message to database - this will appear via realtime
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          group_id: activeGroupId,
          user_id: user!.id,
          content: `🤖 **AI Summary** from thread "${activeThread.name}":\n\n${aiContent}`,
          is_ai: true,
          thread_id: activeThread.id,
        });

      if (insertError) {
        console.error('Error inserting AI message:', insertError);
      }

      setActiveThreadId(null);

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
    setActiveThreadId(null);
  };

  const handleDeleteThread = async (threadId: string) => {
    const success = await dbDeleteThread(threadId);
    if (success && activeThreadId === threadId) {
      setActiveThreadId(null);
    }
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
          pendingInvitations={pendingInvitations}
          onAcceptInvitation={handleAcceptInvitation}
          invitationsLoading={invitationsLoading}
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

  // Convert activeThread to the format expected by PrivateThreadPanel
  const activeThreadForPanel = activeThread ? {
    id: activeThread.id,
    groupId: activeThread.group_id,
    name: activeThread.name,
    members: groupUsers,
    createdAt: new Date(activeThread.created_at),
    isActive: activeThread.is_active,
  } : null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <GroupSidebar
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={() => setIsGroupModalOpen(true)}
        pendingInvitations={pendingInvitations}
        onAcceptInvitation={handleAcceptInvitation}
        invitationsLoading={invitationsLoading}
        sideThreads={allThreads.map(t => ({ ...t, group_id: t.group_id }))}
        activeThreadId={activeThreadId}
        onSelectThread={(threadId) => {
          setActiveThreadId(threadId);
        }}
      />

      {/* Main Chat */}
      <GroupChat
        group={activeGroup}
        messages={groupMessages}
        users={groupUsers}
        currentUserId={currentUser.id}
        onSendMessage={handleSendMessage}
        onStartThread={() => setIsThreadModalOpen(true)}
        onEditMessage={dbEditMessage}
        onDeleteMessage={dbDeleteMessage}
        onTogglePin={dbTogglePin}
        activeThread={activeThreadForPanel}
        groupId={activeGroupId || undefined}
        sideThreads={dbThreads}
        onSelectThread={(threadId) => setActiveThreadId(threadId)}
        onDeleteThread={handleDeleteThread}
        onForwardMessage={handleForwardMessage}
        allGroups={groups.map(g => ({ id: g.id, name: g.name }))}
        onEditGroupName={async (newName) => {
          if (activeGroupId) {
            await dbUpdateGroupName(activeGroupId, newName);
          }
        }}
        onEditThreadName={dbUpdateThreadName}
        isGroupOwner={activeGroup?.id ? dbGroups.find(g => g.id === activeGroup.id)?.owner_id === currentUser.id : false}
      />

      {/* Private Thread Panel */}
      <AnimatePresence>
        {activeThreadForPanel && (
          <PrivateThreadPanel
            thread={activeThreadForPanel}
            messages={currentThreadMessages}
            users={groupUsers}
            currentUserId={currentUser.id}
            onClose={handleCloseThread}
            onSendMessage={handleSendThreadMessage}
            onSendToAI={handleSendToAI}
            onEditMessage={editThreadMessage}
            onDeleteMessage={deleteThreadMessage}
            onTogglePin={toggleThreadPin}
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
