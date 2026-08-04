'use client';

import * as React from 'react';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/providers/theme-toggle';
import { LanguageSelector } from '@/components/auth/language-selector';
import { VideoPanel } from '@/components/auth/video-panel';

const authContentVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const authTransition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen bg-background">
        {/* Left panel — video (hidden on mobile) */}
        <div className="hidden lg:block flex-1 relative">
          <VideoPanel />
        </div>

        {/* Right panel — form */}
        <div className="flex w-full flex-col bg-background lg:w-[480px] xl:w-[520px] shrink-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-5 lg:px-10 lg:py-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-[15px] font-bold text-primary-foreground leading-none">X</span>
              </div>
              <span className="text-h3 font-semibold text-heading tracking-tight">XInterview</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          {/* Auth content — vertically centered */}
          <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                variants={authContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={authTransition}
                className="flex w-full max-w-[380px] flex-col"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 lg:px-10 lg:pb-8">
            <p className="text-caption text-muted">
              © {new Date().getFullYear()} XInterview, Inc.
            </p>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
