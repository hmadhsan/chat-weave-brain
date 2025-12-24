import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrivateThread, ThreadMessage, User } from '@/types/threadly';
import { Button } from '@/components/ui/button';
import { X, Lock, Sparkles, Loader2 } from 'lucide-react';
import ChatInput from './ChatInput';
import UserAvatar from './UserAvatar';
import { format } from 'date-fns';

interface PrivateThreadPanelProps {
  thread: PrivateThread;
  messages: ThreadMessage[];
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onSendMessage: (content: string) => void;
  onSendToAI: () => void;
  isSendingToAI?: boolean;
}

const PrivateThreadPanel = ({
  thread,
  messages,
  users,
  currentUserId,
  onClose,
  onSendMessage,
  onSendToAI,
  isSendingToAI,
}: PrivateThreadPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserById = (userId: string) => users.find((u) => u.id === userId);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full border-l border-border bg-card flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="font-display font-semibold text-foreground">
              {thread.name}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>Human-only brainstorm</span>
          <span className="text-border">•</span>
          <span>{thread.members.length} members</span>
        </div>
        
        <div className="flex -space-x-1.5 mt-2">
          {thread.members.map((member) => (
            <UserAvatar key={member.id} user={member} size="sm" />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Start brainstorming with your team.<br />
              No AI here—just humans.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const user = getUserById(message.userId);
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2"
              >
                <UserAvatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {user?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(message.createdAt, 'h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-0.5">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send to AI Button */}
      {messages.length > 0 && (
        <div className="px-4 pb-2">
          <Button
            variant="ai"
            className="w-full gap-2"
            onClick={onSendToAI}
            disabled={isSendingToAI}
          >
            {isSendingToAI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending to AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Send to AI
              </>
            )}
          </Button>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        placeholder="Brainstorm ideas..."
        disabled={isSendingToAI}
      />
    </motion.div>
  );
};

export default PrivateThreadPanel;
