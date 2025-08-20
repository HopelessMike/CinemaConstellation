// app/lib/audio.ts
"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Buffers = {
  ambient?: AudioBuffer
  click?: AudioBuffer
  warp?: AudioBuffer
}

function dbToGain(db: number) {
  return Math.pow(10, db / 20)
}

export function useAudioEngine() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    const persisted = localStorage.getItem("cc_audio_enabled")
    return persisted === "true"
  })

  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const sfxGainRef = useRef<GainNode | null>(null)
  const ambientSrcRef = useRef<AudioBufferSourceNode | null>(null)
  const buffersRef = useRef<Buffers>({})

  // carica e decodifica un file audio in AudioBuffer (cache in-memory)
  const loadBuffer = useCallback(async (key: keyof Buffers, url: string) => {
    if (!ctxRef.current) return
    if (buffersRef.current[key]) return
    const res = await fetch(url)
    const arr = await res.arrayBuffer()
    const buf = await ctxRef.current.decodeAudioData(arr)
    buffersRef.current[key] = buf
  }, [])

  const ensureContext = useCallback(async () => {
    if (ctxRef.current) {
      if (ctxRef.current.state === "suspended") await ctxRef.current.resume()
      return ctxRef.current
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const master = ctx.createGain()
    const music = ctx.createGain()
    const sfx = ctx.createGain()

    // livelli iniziali (puoi regolarli)
    master.gain.value = dbToGain(-4) // volume generale
    music.gain.value = dbToGain(-10) // musica/ambiente più bassa
    sfx.gain.value = dbToGain(-2)    // effetti un filo più presenti

    music.connect(master)
    sfx.connect(master)
    master.connect(ctx.destination)

    ctxRef.current = ctx
    masterGainRef.current = master
    musicGainRef.current = music
    sfxGainRef.current = sfx
    return ctx
  }, [])

  const startAmbient = useCallback(async () => {
    if (!enabled) return
    const ctx = await ensureContext()
    await loadBuffer("ambient", "/audio/ambient-loop.mp3")
    const buf = buffersRef.current.ambient
    const musicGain = musicGainRef.current
    if (!ctx || !buf || !musicGain) return

    // ferma eventuale sorgente precedente
    if (ambientSrcRef.current) {
      try { ambientSrcRef.current.stop() } catch {}
      ambientSrcRef.current.disconnect()
    }

    // sorgente loop
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    src.connect(musicGain)

    // fade-in morbido
    const now = ctx.currentTime
    musicGain.gain.cancelScheduledValues(now)
    musicGain.gain.setTargetAtTime(musicGain.gain.value, now, 0.001)
    musicGain.gain.setValueAtTime(dbToGain(-14), now)
    musicGain.gain.linearRampToValueAtTime(dbToGain(-10), now + 1.2)

    src.start(0)
    ambientSrcRef.current = src
  }, [enabled, ensureContext, loadBuffer])

  const stopAmbient = useCallback(() => {
    const ctx = ctxRef.current
    const musicGain = musicGainRef.current
    if (!ctx || !musicGain) return
    const now = ctx.currentTime
    // fade-out
    musicGain.gain.cancelScheduledValues(now)
    musicGain.gain.setTargetAtTime(musicGain.gain.value, now, 0.001)
    musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.8)
    if (ambientSrcRef.current) {
      try { ambientSrcRef.current.stop(now + 0.85) } catch {}
      ambientSrcRef.current.disconnect()
      ambientSrcRef.current = null
    }
  }, [])

  const playClick = useCallback(async () => {
    if (!enabled) return
    const ctx = await ensureContext()
    await loadBuffer("click", "/audio/click-bip.wav")
    const buf = buffersRef.current.click
    const sfxGain = sfxGainRef.current
    if (!ctx || !buf || !sfxGain) return

    const src = ctx.createBufferSource()
    src.buffer = buf

    // variazione casuale di pitch (playbackRate 0.92–1.08)
    src.playbackRate.value = 0.92 + Math.random() * 0.16

    src.connect(sfxGain)
    src.start(0)
  }, [enabled, ensureContext, loadBuffer])

  const playWarp = useCallback(async () => {
    if (!enabled) return
    const ctx = await ensureContext()
    await loadBuffer("warp", "/audio/warp-whoosh.wav")
    const buf = buffersRef.current.warp
    const sfxGain = sfxGainRef.current
    if (!ctx || !buf || !sfxGain) return

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(sfxGain)
    src.start(0)
  }, [enabled, ensureContext, loadBuffer])

  // side-effects su toggle
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_audio_enabled", String(enabled))
    }
    if (enabled) {
      startAmbient()
    } else {
      stopAmbient()
    }
  }, [enabled, startAmbient, stopAmbient])

  // disconnessione pulita quando si naviga via
  useEffect(() => {
    return () => {
      try { stopAmbient() } catch {}
      if (ctxRef.current?.state === "running") ctxRef.current.close().catch(() => {})
    }
  }, [stopAmbient])

  return {
    enabled,
    setEnabled, // da collegare al toggle UI
    startAmbient,
    stopAmbient,
    playClick,
    playWarp,
  }
}
