"use client"

import { useCallback, useRef, useEffect } from "react"

// ── Web Audio API Sound Engine ───────────────────────────────────────────────
// Generates all sounds procedurally — no external audio files needed.

type SoundName =
  | "attack"
  | "crit"
  | "skill"
  | "heal"
  | "miss"
  | "death"
  | "victory"
  | "defeat"
  | "buy"
  | "levelup"
  | "ui_click"
  | "dot"

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)()
  } catch {
    return null
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  duration: number,
  volume: number,
  freqEnd?: number,
  delay = 0
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + delay + duration)
  }

  gain.gain.setValueAtTime(0, ctx.currentTime + delay)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + duration)
}

function playNoise(
  ctx: AudioContext,
  duration: number,
  volume: number,
  freqLow: number,
  freqHigh: number,
  delay = 0
) {
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.setValueAtTime(freqLow, ctx.currentTime + delay)
  filter.frequency.exponentialRampToValueAtTime(freqHigh, ctx.currentTime + delay + duration)
  filter.Q.value = 0.5

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(ctx.currentTime + delay)
  source.stop(ctx.currentTime + delay + duration)
}

// ── Sound Definitions ────────────────────────────────────────────────────────
const SOUNDS: Record<SoundName, (ctx: AudioContext) => void> = {
  attack: (ctx) => {
    // Metallic sword swing
    playNoise(ctx, 0.08, 0.3, 800, 200)
    playTone(ctx, 180, "sawtooth", 0.1, 0.15, 120)
  },

  crit: (ctx) => {
    // Sharp impact + dramatic rise
    playNoise(ctx, 0.06, 0.5, 1200, 300)
    playTone(ctx, 300, "square", 0.05, 0.25, 600, 0)
    playTone(ctx, 600, "square", 0.08, 0.2, 400, 0.05)
    playTone(ctx, 900, "sine", 0.15, 0.18, 0, 0.08)
  },

  skill: (ctx) => {
    // Magical whoosh + sparkle
    playTone(ctx, 200, "sine", 0.3, 0.2, 800)
    playTone(ctx, 400, "sine", 0.15, 0.15, 1200, 0.05)
    playTone(ctx, 800, "sine", 0.1, 0.12, 1600, 0.1)
    playNoise(ctx, 0.2, 0.1, 400, 1200, 0)
  },

  heal: (ctx) => {
    // Gentle ascending chime
    playTone(ctx, 523, "sine", 0.2, 0.18)       // C5
    playTone(ctx, 659, "sine", 0.2, 0.18, undefined, 0.1)  // E5
    playTone(ctx, 784, "sine", 0.25, 0.18, undefined, 0.2) // G5
    playTone(ctx, 1047, "sine", 0.2, 0.3, undefined, 0.3)  // C6
  },

  miss: (ctx) => {
    // Quick whoosh - attack glancing off
    playNoise(ctx, 0.06, 0.12, 600, 150)
    playTone(ctx, 300, "sine", 0.08, 0.08, 200)
  },

  death: (ctx) => {
    // Descending dramatic drop
    playTone(ctx, 220, "sawtooth", 0.5, 0.25, 55)
    playNoise(ctx, 0.3, 0.2, 300, 100, 0.1)
    playTone(ctx, 110, "sine", 0.4, 0.15, 60, 0.2)
  },

  victory: (ctx) => {
    // Triumphant fanfare — ascending arpeggio
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((freq, i) => {
      playTone(ctx, freq, "sine", 0.25, 0.3, undefined, i * 0.12)
    })
    // Final chord swell
    playTone(ctx, 523, "sine", 0.8, 0.4, undefined, 0.65)
    playTone(ctx, 659, "sine", 0.8, 0.4, undefined, 0.65)
    playTone(ctx, 784, "sine", 0.8, 0.35, undefined, 0.65)
  },

  defeat: (ctx) => {
    // Somber descending tones
    const notes = [392, 330, 294, 220]
    notes.forEach((freq, i) => {
      playTone(ctx, freq, "sine", 0.4, 0.2, undefined, i * 0.2)
    })
    playNoise(ctx, 0.8, 0.08, 200, 80, 0.4)
  },

  buy: (ctx) => {
    // Coin jingle
    playTone(ctx, 1047, "sine", 0.1, 0.2)
    playTone(ctx, 1319, "sine", 0.12, 0.2, undefined, 0.07)
    playTone(ctx, 1568, "sine", 0.15, 0.25, undefined, 0.14)
  },

  levelup: (ctx) => {
    // Power-up ascending sweep
    playTone(ctx, 330, "square", 0.12, 0.12, 660)
    playTone(ctx, 440, "square", 0.1, 0.12, 880, 0.1)
    playTone(ctx, 523, "sine", 0.12, 0.15, 1047, 0.2)
    playTone(ctx, 880, "sine", 0.2, 0.4, undefined, 0.32)
    playTone(ctx, 1047, "sine", 0.18, 0.35, undefined, 0.38)
    playTone(ctx, 1319, "sine", 0.22, 0.5, undefined, 0.44)
  },

  ui_click: (ctx) => {
    // Soft tick
    playTone(ctx, 800, "sine", 0.05, 0.08, 600)
  },

  dot: (ctx) => {
    // Subtle burn/poison tick
    playNoise(ctx, 0.06, 0.1, 400, 200)
    playTone(ctx, 160, "sine", 0.06, 0.08, 120)
  },
}

// ── Global mute state (module-level, shared across all hook instances) ────────
let _globalMuted = false
export function getSoundMuted() { return _globalMuted }
export function setSoundMuted(v: boolean) { _globalMuted = v }
export function toggleSoundMuted() { _globalMuted = !_globalMuted; return _globalMuted }

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const enabledRef = useRef(true)

  // Lazy-init AudioContext on first user interaction
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext()
    }
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const play = useCallback((name: SoundName) => {
    if (!enabledRef.current || _globalMuted) return
    try {
      const ctx = ensureCtx()
      if (!ctx) return
      SOUNDS[name]?.(ctx)
    } catch (e) {
      // Silently ignore audio errors — game still works without sound
    }
  }, [ensureCtx])

  const setEnabled = useCallback((v: boolean) => {
    enabledRef.current = v
  }, [])

  const isEnabled = useCallback(() => enabledRef.current, [])

  useEffect(() => {
    return () => {
      ctxRef.current?.close()
    }
  }, [])

  return { play, setEnabled, isEnabled }
}
