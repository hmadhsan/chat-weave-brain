import { CheckCheck, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { User } from '@/types/sidechat';
import { ReadReceipt } from '@/hooks/useReadReceipts';

interface ReadReceiptsProps {
  readBy: ReadReceipt[];
  users: User[];
  isOwn: boolean;
  totalMembers: number;
}

const ReadReceipts = ({ readBy, users, isOwn, totalMembers }: ReadReceiptsProps) => {
  if (!isOwn) return null;

  const readByUsers = readBy
    .map((receipt) => users.find((u) => u.id === receipt.user_id))
    .filter(Boolean) as User[];

  // Don't count the sender
  const otherReaders = readByUsers.filter((u) => readBy.some(r => r.user_id === u.id));
  const readCount = otherReaders.length;
  const allRead = readCount >= totalMembers - 1; // -1 for sender

  if (readCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center ml-1">
              <Check className="w-3 h-3 text-muted-foreground" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Sent</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center ml-1">
            <CheckCheck className={`w-3 h-3 ${allRead ? 'text-primary' : 'text-muted-foreground'}`} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {allRead ? (
              'Seen by everyone'
            ) : (
              <>Seen by {otherReaders.map((u) => u.name).join(', ')}</>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReadReceipts;
