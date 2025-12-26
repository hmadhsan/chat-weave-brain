import { motion } from 'framer-motion';
import { Users, Lock, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Users,
    title: 'Start with your team',
    description: 'Begin in a normal group chat with your teammates.',
    visual: 'group',
  },
  {
    number: '02',
    icon: Lock,
    title: 'Branch into privacy',
    description: 'Create a private side conversation with selected members.',
    visual: 'branch',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Think freely',
    description: 'Brainstorm openly without AI watching or interrupting.',
    visual: 'brainstorm',
  },
  {
    number: '04',
    icon: Sparkles,
    title: 'Summarize & share',
    description: 'Send your discussion to AI and share insights with the group.',
    visual: 'ai',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 px-6 bg-secondary/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-sm font-medium text-primary mb-4 tracking-wide uppercase">
            How it works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Think better, together
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            A calm, intentional flow that helps teams refine ideas before bringing in AI.
          </p>
        </motion.div>

        {/* Visual Flow */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                {/* Card */}
                <div className="relative bg-card border border-border rounded-2xl p-6 h-full hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 left-6">
                    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                      Step {step.number}
                    </span>
                  </div>

                  {/* Visual Illustration */}
                  <div className="mt-4 mb-6 h-32 flex items-center justify-center">
                    <StepVisual step={step.visual} isActive={index === 3} />
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector (desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <motion.p
          className="text-center text-muted-foreground mt-16 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          AI joins the conversation only when you're ready.
        </motion.p>
      </div>
    </section>
  );
};

// Visual illustrations for each step
const StepVisual = ({ step, isActive }: { step: string; isActive: boolean }) => {
  const baseClasses = "transition-all duration-500";
  
  switch (step) {
    case 'group':
      return (
        <div className={`${baseClasses} relative`}>
          {/* Main chat bubble */}
          <motion.div
            className="w-32 h-20 rounded-xl bg-gradient-to-br from-muted to-secondary border border-border flex items-end justify-center pb-2"
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Avatar group */}
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary/60" />
                </motion.div>
              ))}
            </div>
          </motion.div>
          {/* Message dots */}
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            ))}
          </motion.div>
        </div>
      );

    case 'branch':
      return (
        <div className={`${baseClasses} relative`}>
          {/* Main chat (faded) */}
          <div className="w-24 h-14 rounded-lg bg-muted/50 border border-border/50 absolute left-0 top-0 opacity-50" />
          {/* Branch line */}
          <motion.svg
            className="absolute left-12 top-7 w-12 h-12"
            viewBox="0 0 48 48"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.path
              d="M0 0 Q24 0 24 24 T48 48"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </motion.svg>
          {/* Private thread */}
          <motion.div
            className="w-20 h-14 rounded-lg bg-primary/10 border-2 border-primary/40 absolute right-0 bottom-0 flex items-center justify-center"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Lock className="w-4 h-4 text-primary" />
          </motion.div>
        </div>
      );

    case 'brainstorm':
      return (
        <div className={`${baseClasses} relative flex items-center justify-center`}>
          {/* Chat bubbles floating */}
          <div className="relative w-32 h-24">
            {[
              { x: 0, y: 8, delay: 0.1, size: 'w-16 h-8' },
              { x: 20, y: 0, delay: 0.25, size: 'w-12 h-6' },
              { x: 8, y: 18, delay: 0.4, size: 'w-14 h-7' },
            ].map((bubble, i) => (
              <motion.div
                key={i}
                className={`absolute ${bubble.size} rounded-lg bg-primary/10 border border-primary/20`}
                style={{ left: bubble.x, top: bubble.y }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: bubble.delay }}
              >
                <div className="h-full w-full flex items-center justify-center gap-1 px-2">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="w-1 h-1 rounded-full bg-primary/40" />
                  ))}
                </div>
              </motion.div>
            ))}
            {/* No AI indicator */}
            <motion.div
              className="absolute -right-2 -bottom-2 px-2 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground border border-border"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              No AI
            </motion.div>
          </div>
        </div>
      );

    case 'ai':
      return (
        <div className={`${baseClasses} relative flex items-center justify-center`}>
          {/* AI Summary bubble */}
          <motion.div
            className="relative"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-28 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 p-3">
              {/* Summary lines */}
              <div className="space-y-1.5">
                <div className="w-full h-1.5 rounded-full bg-primary/30" />
                <div className="w-4/5 h-1.5 rounded-full bg-primary/20" />
                <div className="w-3/5 h-1.5 rounded-full bg-primary/20" />
              </div>
            </div>
            {/* AI badge */}
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </motion.div>
            {/* Share arrow */}
            <motion.div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: -5 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <ArrowRight className="w-4 h-4 text-accent rotate-90" />
            </motion.div>
          </motion.div>
        </div>
      );

    default:
      return null;
  }
};

export default HowItWorksSection;
