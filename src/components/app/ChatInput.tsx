import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Smile, Paperclip, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ReplyPreview from './ReplyPreview';
import MentionInput from './MentionInput';
import { User } from '@/types/sidechat';
import { useFileUpload } from '@/hooks/useFileUpload';

interface ReplyTo {
  id: string;
  content: string;
  userId: string;
}

interface ChatInputProps {
  onSend: (content: string, file?: { url: string; name: string; type: string; size: number } | null) => void;
  placeholder?: string;
  disabled?: boolean;
  onTyping?: () => void;
  onStopTyping?: () => void;
  replyTo?: ReplyTo | null;
  onCancelReply?: () => void;
  users?: User[];
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

const ChatInput = ({ 
  onSend, 
  placeholder = 'Type a message...', 
  disabled, 
  onTyping, 
  onStopTyping,
  replyTo,
  onCancelReply,
  users = [],
}: ChatInputProps) => {
  const [content, setContent] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useFileUpload();

  const handleChange = (value: string) => {
    setContent(value);
    if (value.length > 0 && onTyping) {
      onTyping();
    } else if (value.length === 0 && onStopTyping) {
      onStopTyping();
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && !selectedFile) || disabled || isUploading) return;

    let uploadedFile = null;

    if (selectedFile) {
      uploadedFile = await uploadFile(selectedFile);
      if (!uploadedFile && !content.trim()) return; // Upload failed and no text
    }

    onSend(content.trim() || (uploadedFile ? '' : ''), uploadedFile);
    setContent('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (onStopTyping) {
      onStopTyping();
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className="border-t border-border bg-card/50">
      {/* Reply Preview */}
      {replyTo && onCancelReply && (
        <ReplyPreview replyTo={replyTo} users={users} onCancel={onCancelReply} />
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg max-w-xs">
            {isImage && previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded" />
            ) : (
              <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleRemoveFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-end gap-2 bg-secondary/50 rounded-xl p-2">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </Button>

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
          
          <MentionInput
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={onStopTyping}
            placeholder={placeholder}
            disabled={disabled || isUploading}
            users={users}
          />
          
          <Button
            onClick={handleSend}
            disabled={(!content.trim() && !selectedFile) || disabled || isUploading}
            size="icon"
            className="shrink-0"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
