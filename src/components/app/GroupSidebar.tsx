import { motion } from 'framer-motion';
import { Group } from '@/types/threadly';
import { cn } from '@/lib/utils';
import { Hash, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from './UserMenu';

interface GroupSidebarProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}

const GroupSidebar = ({ groups, activeGroupId, onSelectGroup, onCreateGroup }: GroupSidebarProps) => {
  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col">
      {/* Header with Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">Threadly</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground text-sm">Groups</h2>
          <Button variant="ghost" size="icon" onClick={onCreateGroup}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {groups.map((group) => (
          <motion.button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150",
              activeGroupId === group.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              activeGroupId === group.id ? "bg-primary/20" : "bg-secondary"
            )}>
              <Hash className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{group.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {group.members.length} members
              </p>
            </div>
          </motion.button>
        ))}
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
