import { motion } from 'framer-motion';
import { Message, User } from '@/types/sidechat';
import UserAvatar from './UserAvatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  user?: User;
  isOwn?: boolean;
}

const ChatMessage = ({ message, user, isOwn }: ChatMessageProps) => {
  const isAI = message.isAI;

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
        {renderContent(message.content)}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
