// app/components/LoadingScreen.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

// Animazioni particelle
const particleVariants = {
  animate: (i: number) => ({
    y: [0, -80, 0],
    x: [0, 40 * (i % 2 === 0 ? 1 : -1), -40 * (i % 2 === 0 ? 1 : -1), 0],
    opacity: [0, 0.8, 0.8, 0],
    scale: [0.8, 1.2, 0.8],
    transition: {
      duration: 8 + i * 0.5,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
      delay: Math.random() * 1.5,
    },
  }),
};

interface LoadingScreenProps {
  progress: number
  isVisible: boolean
  onLoadingComplete?: () => void
}

export default function LoadingScreen({
  progress,
  isVisible,
  onLoadingComplete = () => {},
}: LoadingScreenProps) {
  const [showScreen, setShowScreen] = useState(true)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isTouch, setIsTouch] = useState(false)

  const loadingTexts = [
    "Inizializzazione Cinema Universe...",
    "Caricamento Costellazioni Cinematografiche...",
    "Mappatura Connessioni Cinematiche...",
    "Sincronizzazione Database Stellare...",
    "Preparazione del Tuo Viaggio..."
  ]

  // Rileva touch per UX mobile
  useEffect(() => {
    const touch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    setIsTouch(!!touch)
  }, [])

  // Effetto mouse (solo desktop)
  useEffect(() => {
    if (isTouch) return
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isTouch])

  useEffect(() => {
    if (isVisible) {
      setShowScreen(true)
      setDisplayProgress(0)
      setCurrentTextIndex(0)

      const duration = 3500
      const interval = 50
      const increment = 100 / (duration / interval)

      const progressTimer = setInterval(() => {
        setDisplayProgress((prev) => {
          const next = Math.min(prev + increment, 100)
          if (next >= 100) {
            clearInterval(progressTimer)
            setTimeout(() => {
              setShowScreen(false)
              onLoadingComplete()
            }, 300)
          }
          return next
        })
      }, interval)

      const textInterval = duration / loadingTexts.length
      const textTimer = setInterval(() => {
        setCurrentTextIndex((prev) => {
          if (prev >= loadingTexts.length - 1) {
            clearInterval(textTimer)
            return prev
          }
          return prev + 1
        })
      }, textInterval)

      return () => {
        clearInterval(progressTimer)
        clearInterval(textTimer)
      }
    }
  }, [isVisible, onLoadingComplete, loadingTexts.length])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  const glowVariants = {
    animate: {
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.15, 1],
      transition: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
    },
  }

  const memoizedParticles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: Math.random() * 9 + 6 + "px",
          height: Math.random() * 9 + 6 + "px",
          background: `radial-gradient(circle, ${
            Math.random() > 0.5 ? "#8b5cf6" : "#06b6d4"
          } 0%, transparent 70%)`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          filter: "blur(0.5px)",
        }}
        custom={i}
        variants={particleVariants}
        animate="animate"
      />
    ));
  }, []);

  return (
    <AnimatePresence mode="wait">
      {showScreen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Mouse glow effect — solo desktop */}
          {!isTouch && (
            <div
              className="fixed pointer-events-none z-50"
              style={{
                left: mousePosition.x - 100,
                top: mousePosition.y - 100,
                width: 200,
                height: 200,
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`,
                  filter: "blur(20px)",
                }}
              />
            </div>
          )}

          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">{memoizedParticles}</div>

          <div className="flex flex-col items-center justify-center z-10 relative px-8">
            {/* Logo Container */}
            <motion.div className="mb-6 relative" variants={itemVariants}>
              <motion.div
                className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 blur-xl"
                variants={glowVariants}
                animate="animate"
              />
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-cyan-500/50 bg-gradient-to-r from-cyan-500 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                  <Image
                    src="/Cinema-Avatar.png"
                    alt="Cinema Constellations"
                    width={130}
                    height={130}
                    className="w-full h-full object-cover"
                    priority
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.style.display = "none"
                      const fallback = document.getElementById("loading-fallback-icon")
                      if (fallback) {
                        fallback.style.display = "flex"
                      }
                    }}
                  />
                  <div id="loading-fallback-icon" className="absolute inset-0 items-center justify-center hidden">
                    <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1 className="text-5xl md:text-7xl font-bold mb-2 text-center" variants={itemVariants}>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Cinema
              </span>
            </motion.h1>

            <motion.h2
              className="text-3xl md:text-5xl font-light mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Constellations
            </motion.h2>

            {/* Progress bar and loading text container */}
            <motion.div className="w-80 max-w-full space-y-2 mb-4" variants={itemVariants}>
              <div className="h-2 bg-gray-800/50 backdrop-blur rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)" }}
                />
              </div>

              <motion.div
                className="text-sm text-gray-300 text-center"
                key={currentTextIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {loadingTexts[currentTextIndex]}
              </motion.div>
            </motion.div>

            <div className="h-20" />

            {/* Tips */}
            <motion.div
              className="absolute bottom-12 left-0 right-0 text-xs text-gray-500 text-center px-8"
              variants={itemVariants}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 3.5,
                times: [0, 0.2, 0.7, 1],
              }}
            >
              {isTouch
                ? "💡 Suggerimento: Usa lo scorrimento delle dita per esplorare e il pinch per lo zoom"
                : "💡 Suggerimento: Usa lo scroll del mouse per navigare attraverso l'universo cinematografico"}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
