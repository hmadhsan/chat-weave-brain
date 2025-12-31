import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X } from 'lucide-react';

interface ThreadCreationNotificationProps {
  creatorName: string;
  threadName: string;
  onDismiss: () => void;
}

const ThreadCreationNotification = ({
  creatorName,
  threadName,
  onDismiss,
}: ThreadCreationNotificationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="mx-4 mb-2"
    >
      <div className="flex items-center justify-between gap-3 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <MessageSquarePlus className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm">
            <span className="font-medium text-foreground">{creatorName}</span>
            <span className="text-muted-foreground"> created a new thread: </span>
            <span className="font-medium text-primary">"{threadName}"</span>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-primary/20 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
};

export default ThreadCreationNotification;
