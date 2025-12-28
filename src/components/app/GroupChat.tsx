import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Group, Message, User, PrivateThread } from '@/types/sidechat';
import { Button } from '@/components/ui/button';
import { Users, MessageSquarePlus, Hash, UserPlus, Lock, Trash2, User as UserIcon } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import UserAvatar from './UserAvatar';
import InviteMemberModal from './InviteMemberModal';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SideThreadItem {
  id: string;
  name: string;
  is_active: boolean;
  created_by: string;
}

interface GroupChatProps {
  group: Group;
  messages: Message[];
  users: User[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onStartThread: () => void;
  activeThread?: PrivateThread | null;
  groupId?: string;
  sideThreads?: SideThreadItem[];
  onSelectThread?: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
}

const GroupChat = ({
  group,
  messages,
  users,
  currentUserId,
  onSendMessage,
  onStartThread,
  activeThread,
  groupId,
  sideThreads = [],
  onSelectThread,
  onDeleteThread,
}: GroupChatProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserById = (userId: string) => users.find((u) => u.id === userId);
  const getCreatorName = (createdBy: string) => {
    const creator = getUserById(createdBy);
    return creator?.name || 'Unknown';
  };

  const handleDeleteClick = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    setThreadToDelete(threadId);
  };

  const confirmDelete = () => {
    if (threadToDelete && onDeleteThread) {
      onDeleteThread(threadToDelete);
    }
    setThreadToDelete(null);
  };

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
            onClick={() => setIsInviteModalOpen(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onStartThread}
            className="gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Private Thread
          </Button>

          <Button variant="ghost" size="icon">
            <Users className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Side Threads Bar - Moved to left with vertical layout */}
      {sideThreads.length > 0 && (
        <div className="px-4 py-3 border-b border-border bg-card/30">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Private Threads</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              {sideThreads.map((thread) => {
                const isOwner = thread.created_by === currentUserId;
                const creatorName = getCreatorName(thread.created_by);
                
                return (
                  <Tooltip key={thread.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeThread?.id === thread.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground hover:bg-secondary'
                        }`}
                        onClick={() => onSelectThread?.(thread.id)}
                      >
                        <Lock className="w-3 h-3 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate max-w-[120px]">{thread.name}</span>
                          <span className={`text-[10px] flex items-center gap-1 ${
                            activeThread?.id === thread.id 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            <UserIcon className="w-2.5 h-2.5" />
                            {isOwner ? 'You' : creatorName}
                          </span>
                        </div>
                        {isOwner && onDeleteThread && (
                          <button
                            onClick={(e) => handleDeleteClick(e, thread.id)}
                            className={`ml-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                              activeThread?.id === thread.id
                                ? 'hover:bg-primary-foreground/20'
                                : 'hover:bg-destructive/20'
                            }`}
                          >
                            <Trash2 className={`w-3 h-3 ${
                              activeThread?.id === thread.id
                                ? 'text-primary-foreground'
                                : 'text-destructive'
                            }`} />
                          </button>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Created by {isOwner ? 'you' : creatorName}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      )}

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

      {/* Invite Modal */}
      {groupId && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupId={groupId}
          groupName={group.name}
        />
      )}

      {/* Delete Thread Confirmation */}
      <AlertDialog open={!!threadToDelete} onOpenChange={() => setThreadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this private thread and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupChat;
