// app/components/LoadingScreen.tsx
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export default function LoadingScreen({ progress, isVisible, onLoadingComplete = () => {} }: { 
  progress: number
  isVisible: boolean
  onLoadingComplete?: () => void 
}) {
  const [shouldShow, setShouldShow] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return !sessionStorage.getItem("hasVisitedCinemaUniverse");
  });

  useEffect(() => {
    if (!isVisible && progress >= 100) {
      const timer = setTimeout(() => {
        setShouldShow(false);
        sessionStorage.setItem("hasVisitedCinemaUniverse", "true");
        onLoadingComplete();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, progress, onLoadingComplete]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.4,
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  }

  const progressVariants = {
    hidden: { width: "0%" },
    visible: {
      width: `${progress}%`,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  }

  const particleVariants = {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, -10, 0],
      opacity: [0.3, 1, 0.3],
      scale: [0.8, 1.2, 0.8],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  const getLoadingText = () => {
    if (progress < 20) return "Initializing Cinema Universe..."
    if (progress < 50) return "Loading Movie Constellations..."
    if (progress < 80) return "Mapping Cinematic Connections..."
    if (progress < 100) return "Preparing Your Journey..."
    return "Cinema Universe Ready!"
  }

  return (
    <AnimatePresence onExitComplete={onLoadingComplete}>
      {(isVisible || shouldShow) && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black pointer-events-none"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: Math.random() > 0.5 ? "#8b5cf6" : "#06b6d4",
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                variants={particleVariants}
                animate="animate"
                transition={{
                  delay: Math.random() * 2,
                  duration: 2 + Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="flex flex-col items-center justify-center z-10 relative">
            <motion.div className="mb-6" variants={itemVariants}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/50 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse" />
                <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center relative z-10">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Cinema Constellations
            </motion.h1>

            <motion.div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-4" variants={itemVariants}>
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                variants={progressVariants}
                animate="visible"
              />
            </motion.div>
            
            <motion.div
              className="text-sm text-gray-400 mb-2"
              variants={itemVariants}
            >
              {getLoadingText()}
            </motion.div>

            <motion.div
              className="text-xs text-gray-500"
              variants={itemVariants}
            >
              {progress.toFixed(0)}% Complete
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}