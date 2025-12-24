import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Group, Message, User, PrivateThread } from '@/types/threadly';
import { Button } from '@/components/ui/button';
import { Users, MessageSquarePlus, Hash } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import UserAvatar from './UserAvatar';

interface GroupChatProps {
  group: Group;
  messages: Message[];
  users: User[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onStartThread: () => void;
  activeThread?: PrivateThread | null;
}

const GroupChat = ({
  group,
  messages,
  users,
  currentUserId,
  onSendMessage,
  onStartThread,
  activeThread,
}: GroupChatProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserById = (userId: string) => users.find((u) => u.id === userId);

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">{group.name}</h2>
            <p className="text-xs text-muted-foreground">{group.members.length} members</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-2">
            {group.members.slice(0, 4).map((member) => (
              <UserAvatar key={member.id} user={member} size="sm" />
            ))}
            {group.members.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                +{group.members.length - 4}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onStartThread}
            className="gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Start Private Thread
          </Button>

          <Button variant="ghost" size="icon">
            <Users className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Hash className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">
              Welcome to {group.name}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              This is the start of your conversation. Start chatting or create a private thread to brainstorm!
            </p>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                user={getUserById(message.userId)}
                isOwn={message.userId === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Active Thread Indicator */}
      {activeThread && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-primary font-medium">
            Private thread active: {activeThread.name}
          </span>
        </motion.div>
      )}

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        placeholder={`Message ${group.name}...`}
      />
    </div>
  );
};

export default GroupChat;
