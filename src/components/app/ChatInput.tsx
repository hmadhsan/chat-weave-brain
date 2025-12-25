import { useState, KeyboardEvent } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ChatInputProps {
  onSend: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎',
  '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣',
  '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '🤤',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💯',
  '🎉', '🎊', '🔥', '⭐', '✨', '💡', '💬', '👀',
  '✅', '❌', '⚡', '🚀', '💻', '📱', '🎯', '📈',
];

const ChatInput = ({ onSend, placeholder = 'Type a message...', disabled }: ChatInputProps) => {
  const [content, setContent] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);

  const handleSend = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setEmojiOpen(false);
  };

  return (
    <div className="p-4 border-t border-border bg-card/50">
      <div className="flex items-end gap-2 bg-secondary/50 rounded-xl p-2">
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Smile className="w-5 h-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-72 p-2" 
            align="start" 
            side="top"
            sideOffset={8}
          >
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-secondary rounded-md transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground",
            "min-h-[24px] max-h-32"
          )}
          style={{ height: 'auto' }}
        />
        
        <Button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          size="icon"
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
