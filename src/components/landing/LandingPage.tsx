import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Lock, Users, Sparkles, Zap } from 'lucide-react';
import HeroMockUI from './HeroMockUI';
import HowItWorksSection from './HowItWorksSection';
import SidechatLogo from '@/components/SidechatLogo';
import WaitlistModal from './WaitlistModal';
import { ThemeToggle } from '@/components/ThemeToggle';
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <SidechatLogo size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="hero" size="sm" onClick={() => setIsWaitlistOpen(true)}>
              Join Waitlist
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
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
              Collaborate with your team in private threads, refine your thinking, then ask AI for clarity.
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

      {/* Product Hunt Badge */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <a 
              href="https://www.producthunt.com/products/sidechat-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-sidechat-2" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1054816&theme=light&t=1766784507312" 
                alt="Sidechat - Private Brainstorm Threads for Group AI Chats | Product Hunt" 
                width="250" 
                height="54" 
              />
            </a>
          </motion.div>
        </div>
      </section>

      {/* How It Works - New Premium Section */}
      <HowItWorksSection />

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
                const { data, error } = await supabase.rpc('join_waitlist', {
                  _name: 'Website Waitlist',
                  _email: ctaEmail.trim(),
                });
                setCtaLoading(false);

                if (error) {
                  toast.error(error.message || 'Something went wrong. Please try again.');
                  return;
                }

                const row = data?.[0];
                if (row?.already_joined) {
                  toast.info('This email is already on the waitlist!');
                } else {
                  const numberText = row?.join_number ? `You're #${row.join_number} on the waitlist!` : "You've joined the waitlist!";
                  toast.success(numberText, {
                    description: "We'll notify you when Sidechat launches.",
                  });
                }
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <SidechatLogo size="xs" />
          <div className="flex items-center gap-4">
            <a 
              href="https://twitter.com/sidechat2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <p className="text-sm text-muted-foreground">
              © 2025 Sidechat. Private brainstorms, better outcomes.
            </p>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </div>
  );
};

export default LandingPage;
