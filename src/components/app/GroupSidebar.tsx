import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group } from '@/types/sidechat';
import { cn } from '@/lib/utils';
import { Hash, Plus, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserMenu from './UserMenu';
import SidechatLogo from '@/components/SidechatLogo';
import PendingInvitationsCard from './PendingInvitationsCard';
import { PendingInvitation } from '@/hooks/usePendingInvitations';

interface SideThread {
  id: string;
  name: string;
  is_active: boolean;
  created_by: string;
  group_id: string;
}

interface GroupSidebarProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
  pendingInvitations?: PendingInvitation[];
  onAcceptInvitation?: (token: string) => void;
  invitationsLoading?: boolean;
  sideThreads?: SideThread[];
  activeThreadId?: string | null;
  onSelectThread?: (threadId: string) => void;
  getUnreadCount?: (type: 'group' | 'thread', id: string) => number;
}

const GroupSidebar = ({ 
  groups, 
  activeGroupId, 
  onSelectGroup, 
  onCreateGroup,
  pendingInvitations = [],
  onAcceptInvitation,
  invitationsLoading = false,
  sideThreads = [],
  activeThreadId,
  onSelectThread,
  getUnreadCount,
}: GroupSidebarProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpand = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getThreadsForGroup = (groupId: string) => {
    return sideThreads.filter(t => t.group_id === groupId);
  };

  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col">
      {/* Header with Logo */}
      <div className="p-4 border-b border-border">
        <SidechatLogo size="sm" className="mb-4" />
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground text-sm">Groups</h2>
          <Button variant="ghost" size="icon" onClick={onCreateGroup}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && onAcceptInvitation && (
        <div className="border-b border-border">
          <PendingInvitationsCard
            invitations={pendingInvitations}
            onAccept={onAcceptInvitation}
            loading={invitationsLoading}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {groups.map((group) => {
          const groupThreads = getThreadsForGroup(group.id);
          const isExpanded = expandedGroups.has(group.id);
          const hasThreads = groupThreads.length > 0;
          const unreadCount = getUnreadCount?.('group', group.id) || 0;

          return (
            <div key={group.id}>
              <motion.button
                onClick={() => onSelectGroup(group.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150",
                  activeGroupId === group.id && !activeThreadId
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {hasThreads && (
                  <button
                    onClick={(e) => toggleGroupExpand(group.id, e)}
                    className="shrink-0 p-0.5 hover:bg-secondary/50 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  activeGroupId === group.id && !activeThreadId ? "bg-primary/20" : "bg-secondary"
                )}>
                  <Hash className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{group.name}</p>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {group.members.length} members
                    {hasThreads && ` • ${groupThreads.length} thread${groupThreads.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </motion.button>

              {/* Threads Dropdown */}
              <AnimatePresence>
                {isExpanded && hasThreads && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-8 mt-1 space-y-0.5"
                  >
                    {groupThreads.map((thread) => {
                      const threadUnread = getUnreadCount?.('thread', thread.id) || 0;
                      return (
                        <motion.button
                          key={thread.id}
                          onClick={() => {
                            onSelectGroup(group.id);
                            onSelectThread?.(thread.id);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors duration-150 text-xs",
                            activeThreadId === thread.id
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                          )}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Lock className="w-3 h-3 shrink-0" />
                          <span className="truncate flex-1">{thread.name}</span>
                          {threadUnread > 0 && (
                            <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                              {threadUnread > 99 ? '99+' : threadUnread}
                            </Badge>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer with User Menu */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <UserMenu />
        </div>
      </div>
    </div>
  );
};

export default GroupSidebar;