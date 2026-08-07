'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const VIDEOS = [
  'https://xinterview.ai/media/promo/1.mp4',
  'https://xinterview.ai/media/promo/2.mp4',
  'https://xinterview.ai/media/promo/3.mp4',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function VideoPanel() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [src, setSrc] = React.useState(() => pickRandom(VIDEOS));
  const [ready, setReady] = React.useState(false);

  const handleEnded = () => {
    setReady(false);
    setSrc(pickRandom(VIDEOS));
  };

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.load();
    el.play().catch(() => {});
  }, [src]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0A0A14]">
      {/* Video */}
      <AnimatePresence>
        <motion.video
          key={src}
          ref={videoRef}
          src={src}
          autoPlay
          muted
          playsInline
          onCanPlay={() => setReady(true)}
          onEnded={handleEnded}
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* Gradient scrim — strong at bottom, light at top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.1) 65%, transparent 100%)',
        }}
        aria-hidden
      />

      {/* Bottom copy block — mirrors Willo layout */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-12 xl:px-14 xl:pb-14"
      >
        {/* Progress dots */}
        <div className="mb-7 flex items-center gap-2">
          {VIDEOS.map((v, i) => (
            <span
              key={v}
              className={cn(
                'h-[3px] rounded-full transition-all duration-500',
                v === src ? 'w-8 bg-white' : 'w-3 bg-white/30'
              )}
            />
          ))}
        </div>

        {/* Headline */}
        <h2 className="text-[26px] xl:text-[30px] font-bold text-white leading-[1.2] tracking-tight max-w-sm">
          Hire faster. Smarter.{' '}
          <span className="text-white/70">With real insight.</span>
        </h2>

        {/* Sub-copy */}
        <p className="mt-3 text-[15px] text-white/60 max-w-xs leading-relaxed">
          Save hours on screening — meet top talent faster.
        </p>

        {/* Divider */}
        <div className="mt-7 mb-5 h-px w-full bg-white/10" />

        {/* CTA copy — matches Willo */}
        <p className="text-[14px] font-semibold text-white/90">
          Don&apos;t just take our word for it
        </p>
        <p className="mt-1 text-[13px] text-white/50">
          Get started with a free 7 day trial.{' '}
          <a
            href="#"
            className="text-white/70 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 rounded"
          >
            View all paid plans here.
          </a>
        </p>
      </motion.div>
    </div>
  );
}
