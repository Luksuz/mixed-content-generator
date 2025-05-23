"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, CheckCircle2 } from 'lucide-react';

interface RocketLoadingIndicatorProps {
  isLoading: boolean;
  isComplete: boolean;
  loadingText?: string;
  completeText?: string;
}

const RocketLoadingIndicator: React.FC<RocketLoadingIndicatorProps> = ({
  isLoading,
  isComplete,
  loadingText = "Processing...",
  completeText = "Complete!"
}) => {
  if (!isLoading && !isComplete) {
    return null; // Don't render if not loading or complete
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-slate-800/80 border border-red-700/50 shadow-2xl shadow-red-500/30 rounded-2xl p-8 text-center"
      >
        {isLoading && !isComplete && (
          <>
            <div className="relative w-48 h-48 mx-auto mb-6">
              {/* Outer ring */}
              <motion.div
                className="absolute inset-0 border-4 border-red-500/30 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              {/* Rocket path (inner dashed ring) */}
              <motion.div
                className="absolute inset-2 border-2 border-dashed border-red-400/50 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              {/* Rocket */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  rotate: [0, 360],
                  x: [0, 2, -2, 2, -2, 0], // Slight wobble
                  y: [0, -2, 2, -2, 2, 0],
                }}
                transition={{
                  rotate: { duration: 2.5, repeat: Infinity, ease: "linear" },
                  x: { duration: 0.7, repeat: Infinity, ease: "easeInOut", yoyo: Infinity },
                  y: { duration: 0.6, repeat: Infinity, ease: "easeInOut", yoyo: Infinity },
                }}
              >
                <Rocket className="w-16 h-16 text-red-500" style={{ transform: 'rotate(45deg) translateY(-50px)' }} />
              </motion.div>
            </div>
            <p className="text-xl font-semibold text-red-300 glow-text-red animate-pulse">
              {loadingText}
            </p>
          </>
        )}

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.2 }}
            className="flex flex-col items-center justify-center"
          >
            <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
            <p className="text-2xl font-bold text-green-400 glow-text-green">
              {completeText}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default RocketLoadingIndicator; 