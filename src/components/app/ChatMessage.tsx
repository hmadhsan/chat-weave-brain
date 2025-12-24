import { motion } from 'framer-motion';
import { Message, User } from '@/types/threadly';
import UserAvatar from './UserAvatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  user?: User;
  isOwn?: boolean;
}

const ChatMessage = ({ message, user, isOwn }: ChatMessageProps) => {
  const isAI = message.isAI;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 px-4 py-2 group hover:bg-secondary/30 transition-colors",
        isAI && "bg-threadly-purple/5"
      )}
    >
      <UserAvatar user={user} isAI={isAI} showStatus />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "font-medium text-sm",
            isAI ? "text-threadly-purple" : "text-foreground"
          )}>
            {isAI ? 'AI Assistant' : user?.name || 'Unknown'}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(message.createdAt, 'h:mm a')}
          </span>
          {isAI && (
            <span className="text-xs bg-threadly-purple/20 text-threadly-purple px-2 py-0.5 rounded-full">
              AI Response
            </span>
          )}
        </div>
        <p className={cn(
          "text-sm mt-0.5 leading-relaxed",
          isAI ? "text-foreground" : "text-foreground/90"
        )}>
          {message.content}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
