import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Message, PrivateThread, ThreadMessage, User, Group } from '@/types/sidechat';
import { mockGroups, mockMessages, mockUsers, currentUser } from '@/data/mockData';
import GroupSidebar from './GroupSidebar';
import GroupChat from './GroupChat';
import PrivateThreadPanel from './PrivateThreadPanel';
import CreateThreadModal from './CreateThreadModal';
import CreateGroupModal from './CreateGroupModal';
import { MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppShell = () => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>(mockGroups);
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
  }, [activeGroupId]);

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
  }, [activeThread]);

  const handleSendToAI = async () => {
    if (!activeThread || !activeGroupId || currentThreadMessages.length === 0) return;

    setIsSendingToAI(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create AI response based on thread messages
    const threadContext = currentThreadMessages.map((m) => {
      const user = mockUsers.find((u) => u.id === m.userId);
      return `${user?.name || 'Unknown'}: ${m.content}`;
    }).join('\n');

    const aiContent = generateAIResponse(threadContext);

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
    setIsSendingToAI(false);
    setActiveThread(null);

    toast({
      title: 'AI response posted',
      description: 'The AI has analyzed your discussion and shared insights in the main chat.',
    });
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
          availableMembers={mockUsers}
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
        users={mockUsers}
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
            users={mockUsers}
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
        availableMembers={mockUsers}
        currentUser={currentUser}
      />
    </div>
  );
};

// Simple AI response generator (mock)
function generateAIResponse(context: string): string {
  const responses = [
    `Based on your team discussion, I've identified several key themes:\n\n**Main Points:**\n• The team is focused on improving user experience\n• There's interest in streamlining the onboarding flow\n• Collaboration features are a priority\n\n**Recommendations:**\n1. Start with user research to validate assumptions\n2. Create a prototype for testing\n3. Iterate based on feedback\n\nWould you like me to elaborate on any of these points?`,
    
    `After analyzing your brainstorm session, here's a summary:\n\n**Key Insights:**\n• Multiple perspectives on the core problem\n• Strong alignment on user-centric approach\n• Need for data-driven decisions\n\n**Next Steps:**\n1. Define success metrics\n2. Assign ownership for each initiative\n3. Set up regular check-ins\n\nThis discussion shows great team alignment!`,
    
    `I've reviewed your private discussion and synthesized the key takeaways:\n\n**Themes Identified:**\n• Innovation in user engagement\n• Technical feasibility considerations\n• Timeline and resource planning\n\n**Suggested Actions:**\n1. Prioritize quick wins first\n2. Build a roadmap for larger initiatives\n3. Schedule a follow-up to track progress\n\nGreat brainstorming session!`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

export default AppShell;
