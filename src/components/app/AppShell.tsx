import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Message, PrivateThread, ThreadMessage, User, Group } from '@/types/sidechat';
import { mockGroups, mockMessages, mockUsers } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import GroupSidebar from './GroupSidebar';
import GroupChat from './GroupChat';
import PrivateThreadPanel from './PrivateThreadPanel';
import CreateThreadModal from './CreateThreadModal';
import CreateGroupModal from './CreateGroupModal';
import { MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppShell = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  // Create a User object from the authenticated user
  const currentUser: User = useMemo(() => ({
    id: user?.id || 'unknown',
    name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You',
    email: user?.email || profile?.email || '',
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || undefined,
    status: 'online' as const,
  }), [user, profile]);

  // Merge current user with mock users for display purposes
  const allUsers = useMemo(() => {
    const filtered = mockUsers.filter(u => u.id !== currentUser.id);
    return [currentUser, ...filtered];
  }, [currentUser]);

  const [groups, setGroups] = useState<Group[]>(() => 
    mockGroups.map(g => ({
      ...g,
      members: g.members.map(m => m.id === 'user-1' ? currentUser : m)
    }))
  );
  const [activeGroupId, setActiveGroupId] = useState<string | null>(mockGroups[0]?.id || null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [threads, setThreads] = useState<PrivateThread[]>([]);
  const [activeThread, setActiveThread] = useState<PrivateThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSendingToAI, setIsSendingToAI] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const groupMessages = messages.filter((m) => m.groupId === activeGroupId);
  const currentThreadMessages = threadMessages.filter((m) => m.threadId === activeThread?.id);

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveThread(null);
  };

  const handleSendMessage = useCallback((content: string) => {
    if (!activeGroupId) return;

    const newMessage: Message = {
      id: uuidv4(),
      groupId: activeGroupId,
      userId: currentUser.id,
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
  }, [activeGroupId, currentUser.id]);

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

  const handleCreateGroup = (name: string, members: User[]) => {
    const newGroup: Group = {
      id: uuidv4(),
      name,
      members,
      createdAt: new Date(),
    };

    setGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
    
    toast({
      title: 'Group created',
      description: `"${name}" has been created with ${members.length} member${members.length > 1 ? 's' : ''}.`,
    });
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
        const msgUser = allUsers.find((u) => u.id === m.userId);
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

      const aiMessage: Message = {
        id: uuidv4(),
        groupId: activeGroupId,
        userId: 'ai',
        content: aiContent,
        createdAt: new Date(),
        isAI: true,
        threadId: activeThread.id,
      };

      setMessages((prev) => [...prev, aiMessage]);
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
          onCreate={handleCreateGroup}
          availableMembers={allUsers}
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
        users={allUsers}
        currentUserId={currentUser.id}
        onSendMessage={handleSendMessage}
        onStartThread={() => setIsThreadModalOpen(true)}
        activeThread={activeThread}
      />

      {/* Private Thread Panel */}
      <AnimatePresence>
        {activeThread && (
          <PrivateThreadPanel
            thread={activeThread}
            messages={currentThreadMessages}
            users={allUsers}
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
        availableMembers={activeGroup.members}
        currentUser={currentUser}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreate={handleCreateGroup}
        availableMembers={allUsers}
        currentUser={currentUser}
      />
    </div>
  );
};

export default AppShell;
