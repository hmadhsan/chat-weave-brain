import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Lock, Users, Sparkles, Zap } from 'lucide-react';
import HeroMockUI from './HeroMockUI';
import SidechatLogo from '@/components/SidechatLogo';
import WaitlistModal from './WaitlistModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const LandingPage = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaLoading, setCtaLoading] = useState(false);
  const features = [
    {
      icon: Users,
      title: 'Group Collaboration',
      description: 'Chat with your team in real-time with beautiful, intuitive group conversations.',
    },
    {
      icon: Lock,
      title: 'Private Threads',
      description: 'Create human-only brainstorm spaces within your group. No AI listening in.',
    },
    {
      icon: Sparkles,
      title: 'AI on Demand',
      description: 'When you\'re ready, send your refined ideas to AI and get responses in the main chat.',
    },
  ];

  const steps = [
    { number: '01', title: 'Start chatting', description: 'Open a group conversation with your team' },
    { number: '02', title: 'Go private', description: 'Create a private thread with select members' },
    { number: '03', title: 'Brainstorm freely', description: 'Collaborate without AI interference' },
    { number: '04', title: 'Send to AI', description: 'Get AI insights back in the main chat' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <SidechatLogo size="sm" />
          <Button variant="hero" size="sm" onClick={() => setIsWaitlistOpen(true)}>
            Join Waitlist
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                <span>Private Brainstorm Threads for Group Chats</span>
              </div>
            </motion.div>

            <motion.h1
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Private Brainstorm{' '}
              <span className="text-gradient">Threads</span>
              <br />
              for Group AI Chats
            </motion.h1>

            <motion.p
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Collaborate with your team in private threads, then intentionally send your refined ideas to AI. 
              Get intelligent responses right back in your group chat.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button variant="hero" size="xl" onClick={() => setIsWaitlistOpen(true)}>
                Join Waitlist
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>

          {/* Animated Mock UI */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <HeroMockUI />
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why teams love Sidechat
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The perfect balance between human creativity and AI assistance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">
              Four simple steps to smarter collaboration.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-6xl font-display font-bold text-primary/10 mb-2">
                  {step.number}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 w-full h-px bg-gradient-to-r from-primary/20 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            className="bg-hero rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to collaborate smarter?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join teams who've discovered the power of intentional AI collaboration.
            </p>
            
            {/* Inline waitlist form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!ctaEmail.trim()) return;
                
                setCtaLoading(true);
                const { data, error } = await supabase
                  .from('waitlist')
                  .insert({ name: 'Waitlist Signup', email: ctaEmail.trim() })
                  .select('join_number')
                  .single();
                setCtaLoading(false);
                
                if (error) {
                  if (error.code === '23505') {
                    toast.error("This email is already on the waitlist!");
                  } else {
                    toast.error("Something went wrong. Please try again.");
                  }
                  return;
                }
                
                toast.success(`You're #${data.join_number} on the waitlist!`, {
                  description: "We'll notify you when Sidechat launches."
                });
                setCtaEmail('');
              }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                className="h-12 bg-card/90 border-card text-foreground placeholder:text-muted-foreground flex-1"
                required
              />
              <Button
                type="submit"
                size="lg"
                className="bg-card text-foreground hover:bg-card/90 h-12 px-6 whitespace-nowrap"
                disabled={ctaLoading}
              >
                {ctaLoading ? 'Joining...' : 'Join Waitlist'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sidechat-cyan/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex items-center justify-between">
          <SidechatLogo size="xs" />
          <p className="text-sm text-muted-foreground">
            © 2025 Sidechat. Private brainstorms, better outcomes.
          </p>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </div>
  );
};

export default LandingPage;
