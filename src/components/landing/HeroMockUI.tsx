import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MessageSquare, Users, Sparkles, Send } from 'lucide-react';

const HeroMockUI = () => {
  const [step, setStep] = useState(0);
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev >= 4) {
          setShowThread(false);
          return 0;
        }
        if (prev === 1) {
          setShowThread(true);
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const messages = [
    { user: 'Sarah', content: 'What about the new feature?', isAI: false },
    { user: 'Alex', content: 'Let me brainstorm privately first...', isAI: false },
  ];

  const threadMessages = [
    { user: 'Alex', content: 'Here are my rough ideas...' },
    { user: 'Sarah', content: 'I like option 2!' },
    { user: 'Alex', content: 'Sending to AI for polish...' },
  ];

  const aiResponse = {
    user: 'AI',
    content: 'Based on your discussion, I suggest focusing on user experience improvements...',
    isAI: true,
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <motion.div
        className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Mock Window Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground font-medium">Sidechat — Product Team</span>
          </div>
        </div>

        <div className="flex h-[300px]">
          {/* Sidebar */}
          <div className="w-16 bg-sidechat-navy flex flex-col items-center py-4 gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-muted/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Main Chat */}
          <div className="flex-1 flex flex-col bg-background relative">
            <div className="flex-1 p-4 space-y-3 overflow-hidden">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: step >= i ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.3, duration: 0.4 }}
                  className="flex gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {msg.user[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{msg.user}</p>
                    <p className="text-sm text-muted-foreground">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {/* AI Response */}
              <AnimatePresence>
                {step >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-sidechat-purple flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 bg-sidechat-purple/10 rounded-lg p-2 border border-sidechat-purple/20">
                      <p className="text-xs font-medium text-sidechat-purple">AI Response</p>
                      <p className="text-sm text-foreground">{aiResponse.content}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2 items-center bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-sm text-muted-foreground flex-1">Type a message...</span>
                <Send className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Private Thread Panel */}
          <AnimatePresence>
            {showThread && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-l border-border bg-secondary/30 overflow-hidden"
              >
                <div className="p-3 border-b border-border bg-primary/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-medium text-foreground">Private Thread</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Human-only brainstorm</p>
                </div>

                <div className="p-2 space-y-2">
                  {threadMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: step >= i + 2 ? 1 : 0.3, x: 0 }}
                      transition={{ delay: (i + 2) * 0.3, duration: 0.3 }}
                      className="text-xs"
                    >
                      <span className="font-medium text-foreground">{msg.user}: </span>
                      <span className="text-muted-foreground">{msg.content}</span>
                    </motion.div>
                  ))}

                  {step >= 3 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full mt-2 px-2 py-1.5 bg-sidechat-purple text-primary-foreground text-xs rounded-md flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Send to AI
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
    </div>
  );
};

export default HeroMockUI;
