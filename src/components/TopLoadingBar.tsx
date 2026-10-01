import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActionFeedback, LoadingState } from '../services/actionFeedbackService';

export const TopLoadingBar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return ActionFeedback.subscribeLoading((state: LoadingState) => {
      setLoading(state.isLoading);
      if (state.isLoading) {
        setProgress(30);
        const t1 = setTimeout(() => setProgress(75), 100);
        const t2 = setTimeout(() => setProgress(95), 250);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      } else {
        setProgress(100);
        const t = setTimeout(() => setProgress(0), 200);
        return () => clearTimeout(t);
      }
    });
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[3px]">
      <motion.div
        className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 shadow-[0_0_12px_rgba(14,165,233,0.8)]"
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: 'easeOut', duration: 0.2 }}
      />
    </div>
  );
};
