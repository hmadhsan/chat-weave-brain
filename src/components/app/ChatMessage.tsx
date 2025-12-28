import { useState } from 'react';
import { motion } from 'framer-motion';
import { Message, User } from '@/types/sidechat';
import UserAvatar from './UserAvatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Sparkles, MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
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

interface ChatMessageProps {
  message: Message;
  user?: User;
  isOwn?: boolean;
  onEdit?: (messageId: string, newContent: string) => Promise<boolean>;
  onDelete?: (messageId: string) => Promise<boolean>;
}

const ChatMessage = ({ message, user, isOwn, onEdit, onDelete }: ChatMessageProps) => {
  const isAI = message.isAI;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    if (!onEdit || editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    const success = await onEdit(message.id, editContent.trim());
    setIsLoading(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsLoading(true);
    await onDelete(message.id);
    setIsLoading(false);
    setShowDeleteDialog(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  // Simple markdown-like rendering for AI messages
  const renderContent = (content: string) => {
    if (!isAI) {
      return <p className="text-sm mt-0.5 leading-relaxed text-foreground/90">{content}</p>;
    }

    // Parse markdown-like syntax for AI responses
    const lines = content.split('\n');
    return (
      <div className="text-sm mt-2 leading-relaxed space-y-2">
        {lines.map((line, i) => {
          // Bold headers with emoji
          if (line.match(/^[📋🎯✅⚡💡]?\s?\*\*.+\*\*/)) {
            const text = line.replace(/\*\*/g, '');
            return (
              <p key={i} className="font-semibold text-foreground mt-3 first:mt-0">
                {text}
              </p>
            );
          }
          // Bullet points
          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <p key={i} className="text-foreground/90 pl-4">
                {line}
              </p>
            );
          }
          // Numbered items
          if (line.match(/^\d+\.\s/)) {
            return (
              <p key={i} className="text-foreground/90 pl-4">
                {line}
              </p>
            );
          }
          // Empty lines
          if (!line.trim()) {
            return <div key={i} className="h-1" />;
          }
          // Regular text
          return (
            <p key={i} className="text-foreground/90">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex gap-3 px-4 py-2 group hover:bg-secondary/30 transition-colors",
          isAI && "bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border-l-2 border-violet-500/30"
        )}
      >
        <UserAvatar user={user} isAI={isAI} showStatus />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "font-medium text-sm",
              isAI ? "text-violet-600 dark:text-violet-400" : "text-foreground"
            )}>
              {isAI ? 'Sidechat AI' : user?.name || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(message.createdAt, 'h:mm a')}
            </span>
            {isAI && (
              <span className="text-xs bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Summary
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isLoading || !editContent.trim()}
                  className="gap-1"
                >
                  <Check className="w-3 h-3" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="gap-1"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            renderContent(message.content)
          )}
        </div>

        {/* Edit/Delete Menu - Only show for own messages that aren't AI */}
        {isOwn && !isAI && !isEditing && (onEdit || onDelete) && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
    </>
  );
};

export default ChatMessage;
