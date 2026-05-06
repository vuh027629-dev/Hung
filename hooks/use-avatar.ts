"use client"

import { useMemo } from "react"
import { getAvatar, svgToDataUrl, type AvatarRequest } from "@/lib/game/avatar-cache"

/**
 * Hook that returns an img src for a unit's avatar.
 * Now instant — no async polling needed since avatars are static SVGs.
 */
export function useAvatar(req: AvatarRequest | null): string | null {
  return useMemo(() => {
    if (!req) return null
    const svg = getAvatar(req)
    return svg ? svgToDataUrl(svg) : null
  }, [req?.templateId, req?.isEnemy]) // eslint-disable-line react-hooks/exhaustive-deps
}
