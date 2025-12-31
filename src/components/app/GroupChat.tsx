import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { isSameDay } from 'date-fns';
import { Group, Message, User, PrivateThread } from '@/types/sidechat';
import { Button } from '@/components/ui/button';
import { Users, MessageSquarePlus, Hash, UserPlus, Lock, Trash2, User as UserIcon, Pin, Search, Pencil } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import UserAvatar from './UserAvatar';
import InviteMemberModal from './InviteMemberModal';
import TypingIndicator from './TypingIndicator';
import MessageSearch from './MessageSearch';
import ForwardMessageModal from './ForwardMessageModal';
import DateSeparator from './DateSeparator';
import EditNameModal from './EditNameModal';
import SystemMessage from './SystemMessage';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMessageReactions } from '@/hooks/useReactions';
import { useMessageReadReceipts } from '@/hooks/useReadReceipts';
import { usePresence } from '@/hooks/usePresence';
import { useLastSeen } from '@/hooks/useLastSeen';
import { useSystemEvents } from '@/hooks/useSystemEvents';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SideThreadItem {
  id: string;
  name: string;
  is_active: boolean;
  created_by: string;
}

interface GroupChatProps {
  group: Group;
  messages: (Message & { is_pinned?: boolean })[];
  users: User[];
  currentUserId: string;
  onSendMessage: (content: string, replyToId?: string | null, file?: { url: string; name: string; type: string; size: number } | null) => void;
  onStartThread: () => void;
  onEditMessage?: (messageId: string, newContent: string) => Promise<boolean>;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
  onTogglePin?: (messageId: string) => Promise<boolean>;
  activeThread?: PrivateThread | null;
  groupId?: string;
  sideThreads?: SideThreadItem[];
  onSelectThread?: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  onForwardMessage?: (content: string, targetId: string, targetType: 'group' | 'thread') => Promise<void>;
  allGroups?: { id: string; name: string }[];
  onEditGroupName?: (newName: string) => Promise<void>;
  onEditThreadName?: (threadId: string, newName: string) => Promise<boolean>;
  isGroupOwner?: boolean;
  onAskAI?: (content: string) => Promise<void>;
  isAILoading?: boolean;
}

const GroupChat = ({
  group,
  messages,
  users,
  currentUserId,
  onSendMessage,
  onStartThread,
  onEditMessage,
  onDeleteMessage,
  onTogglePin,
  activeThread,
  groupId,
  sideThreads = [],
  onSelectThread,
  onDeleteThread,
  onForwardMessage,
  allGroups = [],
  onEditGroupName,
  onEditThreadName,
  isGroupOwner = false,
  onAskAI,
  isAILoading = false,
}: GroupChatProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<{ id: string; name: string } | null>(null);
  const { profile } = useAuth();

  // Typing indicator
  const currentUserName = profile?.full_name || 'You';
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    groupId ? `group:${groupId}` : '',
    currentUserName
  );

  // Reactions
  const messageIds = useMemo(() => messages.map(m => m.id), [messages]);
  const { toggleReaction, getReactionGroups } = useMessageReactions(messageIds);

  // Read receipts
  const { markAsRead, getReadBy } = useMessageReadReceipts(messageIds);

  // Presence tracking
  const { isOnline } = usePresence(groupId ? `group:${groupId}` : '');
  const { getLastSeen } = useLastSeen(groupId ? `group:${groupId}` : '');

  // System events (thread creation, member join/leave)
  const { events: systemEvents } = useSystemEvents(groupId, currentUserId);

  // Pinned messages
  const pinnedMessages = useMemo(() => messages.filter(m => m.is_pinned), [messages]);

  // Message lookup for replies
  const messageMap = useMemo(() => {
    const map = new Map<string, Message>();
    messages.forEach(m => map.set(m.id, m));
    return map;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = useCallback((messageId: string) => {
    const element = messagesContainerRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      element.classList.add('bg-primary/20');
      setTimeout(() => {
        element.classList.remove('bg-primary/20');
      }, 2000);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when visible
  useEffect(() => {
    if (!messages.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              markAsRead(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const container = messagesContainerRef.current;
    if (container) {
      container.querySelectorAll('[data-message-id]').forEach((el) => {
        observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, [messages, markAsRead]);

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

  const handleToggleReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  const handleForward = (message: Message) => {
    setMessageToForward(message);
  };

  const handleForwardSubmit = async (targetId: string, targetType: 'group' | 'thread') => {
    if (messageToForward && onForwardMessage) {
      await onForwardMessage(messageToForward.content, targetId, targetType);
    }
  };

  const handleSendMessage = (content: string, file?: { url: string; name: string; type: string; size: number } | null) => {
    onSendMessage(content, replyTo?.id || null, file);
    setReplyTo(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-display font-semibold text-foreground">{group.name}</h2>
              <p className="text-xs text-muted-foreground">{group.members.length} members</p>
            </div>
            {isGroupOwner && onEditGroupName && (
              <button
                onClick={() => setIsEditGroupModalOpen(true)}
                className="p-1.5 rounded-md hover:bg-accent transition-colors"
                title="Edit group name"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <div className="flex -space-x-2 mr-2">
              {group.members.slice(0, 4).map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <div>
                      <UserAvatar user={member} size="sm" showStatus isOnline={isOnline(member.id)} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{member.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {group.members.length > 4 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground cursor-pointer">
                      +{group.members.length - 4}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{group.members.slice(4).map(m => m.name).join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>

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

          <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
            <Search className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Users className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">Group Members</p>
                <p className="text-xs text-muted-foreground">{group.members.length} members</p>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {group.members.map((member) => {
                  const memberOnline = isOnline(member.id);
                  const lastSeenText = getLastSeen(member.id, memberOnline);
                  
                  return (
                    <div key={member.id} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50">
                      <UserAvatar user={member} size="sm" showStatus isOnline={memberOnline} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">{member.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {memberOnline ? (
                            <span className="text-green-500">Online</span>
                          ) : (
                            lastSeenText || member.email
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-amber-500/5">
          <div className="flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {pinnedMessages.length} pinned message{pinnedMessages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Side Threads Bar */}
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
                        {isOwner && (
                          <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEditThreadName && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingThread({ id: thread.id, name: thread.name });
                                }}
                                className={`p-1 rounded ${
                                  activeThread?.id === thread.id
                                    ? 'hover:bg-primary-foreground/20'
                                    : 'hover:bg-accent'
                                }`}
                              >
                                <Pencil className={`w-3 h-3 ${
                                  activeThread?.id === thread.id
                                    ? 'text-primary-foreground'
                                    : 'text-muted-foreground'
                                }`} />
                              </button>
                            )}
                            {onDeleteThread && (
                              <button
                                onClick={(e) => handleDeleteClick(e, thread.id)}
                                className={`p-1 rounded ${
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
      <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
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
            {messages.map((message, index) => {
              const replyToMessage = message.replyToId ? messageMap.get(message.replyToId) : null;
              const messageDate = new Date(message.createdAt);
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const previousDate = previousMessage ? new Date(previousMessage.createdAt) : null;
              const showDateSeparator = !previousDate || !isSameDay(messageDate, previousDate);
              
              return (
                <div key={message.id}>
                  {showDateSeparator && <DateSeparator date={messageDate} />}
                  <div data-message-id={message.id}>
                    <ChatMessage
                      message={message}
                      user={getUserById(message.userId)}
                      isOwn={message.userId === currentUserId}
                      isUserOnline={isOnline(message.userId)}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                      onTogglePin={onTogglePin}
                      onReply={handleReply}
                      onForward={onForwardMessage ? handleForward : undefined}
                      reactions={getReactionGroups(message.id)}
                      onToggleReaction={handleToggleReaction}
                      readBy={getReadBy(message.id)}
                      users={users}
                      totalMembers={group.members.length}
                      replyToMessage={replyToMessage}
                    />
                  </div>
                </div>
              );
            })}
            
            {/* System Events (inline) */}
            {systemEvents.map((event) => (
              <SystemMessage key={event.id} message={event.message} />
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

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
        onSend={handleSendMessage}
        onAskAI={onAskAI}
        isAILoading={isAILoading}
        placeholder={`Message ${group.name}...`}
        onTyping={startTyping}
        onStopTyping={stopTyping}
        replyTo={replyTo ? { id: replyTo.id, content: replyTo.content, userId: replyTo.userId } : null}
        onCancelReply={() => setReplyTo(null)}
        users={users}
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

      {/* Message Search */}
      {showSearch && (
        <MessageSearch
          messages={messages}
          users={users}
          onClose={() => setShowSearch(false)}
          groupName={group.name}
          scrollToMessage={scrollToMessage}
        />
      )}

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={!!messageToForward}
        onClose={() => setMessageToForward(null)}
        messageContent={messageToForward?.content || ''}
        groups={allGroups}
        threads={sideThreads.map(t => ({ id: t.id, name: t.name, group_id: groupId || '' }))}
        onForward={handleForwardSubmit}
      />

      {/* Edit Group Name Modal */}
      <EditNameModal
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
        onSave={async (newName) => {
          if (onEditGroupName) {
            await onEditGroupName(newName);
          }
        }}
        currentName={group.name}
        title="Edit Group Name"
        label="Group Name"
      />

      {/* Edit Thread Name Modal */}
      <EditNameModal
        isOpen={!!editingThread}
        onClose={() => setEditingThread(null)}
        onSave={async (newName) => {
          if (editingThread && onEditThreadName) {
            await onEditThreadName(editingThread.id, newName);
          }
        }}
        currentName={editingThread?.name || ''}
        title="Edit Thread Name"
        label="Thread Name"
      />
    </div>
  );
};

export default GroupChat;
