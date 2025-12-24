import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types/threadly';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check, Lock } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { cn } from '@/lib/utils';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, members: User[]) => void;
  availableMembers: User[];
  currentUser: User;
}

const CreateThreadModal = ({
  isOpen,
  onClose,
  onCreate,
  availableMembers,
  currentUser,
}: CreateThreadModalProps) => {
  const [threadName, setThreadName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([currentUser]);

  const toggleMember = (member: User) => {
    if (member.id === currentUser.id) return; // Can't remove self
    
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === member.id)
        ? prev.filter((m) => m.id !== member.id)
        : [...prev, member]
    );
  };

  const handleCreate = () => {
    if (threadName.trim() && selectedMembers.length >= 2) {
      onCreate(threadName.trim(), selectedMembers);
      setThreadName('');
      setSelectedMembers([currentUser]);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground">
                    Start Private Thread
                  </h2>
                  <p className="text-xs text-muted-foreground">Human-only brainstorm</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Thread Name */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Thread Name
                </label>
                <Input
                  value={threadName}
                  onChange={(e) => setThreadName(e.target.value)}
                  placeholder="e.g., Feature Brainstorm"
                  className="w-full"
                />
              </div>

              {/* Members */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Select Members ({selectedMembers.length} selected)
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {availableMembers.map((member) => {
                    const isSelected = selectedMembers.some((m) => m.id === member.id);
                    const isSelf = member.id === currentUser.id;

                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleMember(member)}
                        disabled={isSelf}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isSelected
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-secondary/50 hover:bg-secondary border border-transparent",
                          isSelf && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <UserAvatar user={member} size="sm" showStatus />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground">
                            {member.name}
                            {isSelf && <span className="text-muted-foreground"> (you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-secondary/30">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!threadName.trim() || selectedMembers.length < 2}
              >
                Create Thread
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateThreadModal;
