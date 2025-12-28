import { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PrivateThread, ThreadMessage, User } from '@/types/sidechat';
import { Button } from '@/components/ui/button';
import { X, Lock, Sparkles, Loader2, MoreVertical, Pencil, Trash2, Check, Pin, PinOff } from 'lucide-react';
import ChatInput from './ChatInput';
import UserAvatar from './UserAvatar';
import TypingIndicator from './TypingIndicator';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PrivateThreadPanelProps {
  thread: PrivateThread;
  messages: ThreadMessage[];
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onSendMessage: (content: string) => void;
  onSendToAI: () => void;
  onEditMessage?: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
  onTogglePin?: (messageId: string) => Promise<boolean>;
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
  onEditMessage,
  onDeleteMessage,
  onTogglePin,
  isSendingToAI,
}: PrivateThreadPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  // Typing indicator
  const currentUserName = profile?.full_name || 'You';
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    `thread:${thread.id}`,
    currentUserName
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserById = (userId: string) => users.find((u) => u.id === userId);

  const handleStartEdit = (message: ThreadMessage) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!onEditMessage || !editingMessageId || !editContent.trim()) {
      setEditingMessageId(null);
      return;
    }
    
    setIsLoading(true);
    const success = await onEditMessage(editingMessageId, editContent.trim());
    setIsLoading(false);
    if (success) {
      setEditingMessageId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDelete = async () => {
    if (!onDeleteMessage || !messageToDelete) return;
    
    setIsLoading(true);
    await onDeleteMessage(messageToDelete);
    setIsLoading(false);
    setMessageToDelete(null);
  };

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
            const isOwn = message.userId === currentUserId;
            const isEditing = editingMessageId === message.id;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 group"
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
                  
                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[40px] text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={isLoading || !editContent.trim()}
                          className="gap-1 h-7 text-xs"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                          className="gap-1 h-7 text-xs"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/90 mt-0.5">
                      {message.content}
                    </p>
                  )}
                </div>
                
                {/* Edit/Delete Menu */}
                {isOwn && !isEditing && (onEditMessage || onDeleteMessage) && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEditMessage && (
                          <DropdownMenuItem onClick={() => handleStartEdit(message)}>
                            <Pencil className="w-3 h-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDeleteMessage && (
                          <DropdownMenuItem 
                            onClick={() => setMessageToDelete(message.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

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
        onTyping={startTyping}
        onStopTyping={stopTyping}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default PrivateThreadPanel;
