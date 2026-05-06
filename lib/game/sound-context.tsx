"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface SoundContextValue {
  muted: boolean
  toggleMute: () => void
}

const SoundContext = createContext<SoundContextValue>({
  muted: false,
  toggleMute: () => {},
})

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false)

  const toggleMute = useCallback(() => {
    setMuted(v => !v)
  }, [])

  return (
    <SoundContext.Provider value={{ muted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSoundContext() {
  return useContext(SoundContext)
}
