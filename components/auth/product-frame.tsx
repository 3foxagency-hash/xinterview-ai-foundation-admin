'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Sparkles, TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';

const EVAL_ITEMS = [
  { label: 'Communication', score: 92 },
  { label: 'Problem Solving', score: 87 },
  { label: 'Culture Fit', score: 94 },
  { label: 'Technical Depth', score: 85 },
];

function AnimatedScore({ target }: { target: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(count, target, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [count, rounded, target]);

  return <>{display}</>;
}

const stats = [
  { icon: Users, label: 'Active candidates', value: '1,247', color: 'text-indigo-200' },
  { icon: CheckCircle2, label: 'Interviews this week', value: '89', color: 'text-emerald-200' },
  { icon: Clock, label: 'Avg. time to hire', value: '11 days', color: 'text-blue-200' },
];

export function ProductFrame() {
  return (
    <div className="relative w-full max-w-lg space-y-6">
      {/* Floating stat cards row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 + idx * 0.08 }}
            className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
          >
            <stat.icon size={20} strokeWidth={1.5} className={stat.color} />
            <p className="mt-3 text-h3 font-bold text-white">{stat.value}</p>
            <p className="mt-0.5 text-[13px] leading-tight text-indigo-100/60">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* AI Evaluation card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/30">
              <Sparkles size={18} strokeWidth={1.5} className="text-white" />
            </div>
            <div>
              <span className="block text-body font-semibold text-white">AI Evaluation Engine</span>
              <span className="text-[13px] text-indigo-100/60">Real-time candidate analysis</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-emerald-300"
            />
            <span className="text-[13px] font-medium text-emerald-100">Live</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {EVAL_ITEMS.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + idx * 0.1 }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[14px] text-indigo-100/80">{item.label}</span>
                <span className="text-[14px] font-semibold text-white">
                  <AnimatedScore target={item.score} />
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1.5, delay: 0.6 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-300"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="mt-6 flex items-center justify-between border-t border-white/10 pt-5"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} strokeWidth={1.5} className="text-indigo-200" />
            <span className="text-[14px] text-indigo-100/80">Overall Match Score</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-h2 font-bold text-white">
              <AnimatedScore target={90} />
            </span>
            <span className="text-[14px] text-indigo-100/50">/ 100</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
