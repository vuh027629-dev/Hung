import type { Rarity } from "./types"

export const RARITY_ORDER: Rarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "celestial",
  "transcendent",
  "divine",
  "primordial",
]

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Phổ Thông",
  rare: "Hiếm",
  epic: "Sử Thi",
  legendary: "Huyền Thoại",
  mythic: "Thần Thoại",
  celestial: "Thiên Giới",
  transcendent: "Siêu Việt",
  divine: "Thần Thánh",
  primordial: "Nguyên Thủy",
}

// ----------------------------------------------------------------
// Gacha rates
// ----------------------------------------------------------------

// Standard gem banner — Legendary 1%, Mythic 0.1%, Celestial 0.01%
export const HERO_GACHA_RATES: Record<Rarity, number> = {
  common: 0.5544,
  rare: 0.32,
  epic: 0.12,
  legendary: 0.005,
  mythic: 0.0005,
  celestial: 0.00005,
  transcendent: 0,
  divine: 0,
  primordial: 0,
}

// Premium gem banner — costs more gems, but greatly improved odds
export const HERO_GACHA_RATES_PREMIUM: Record<Rarity, number> = {
  common: 0.3998,
  rare: 0.349,
  epic: 0.2,
  legendary: 0.04,
  mythic: 0.01,
  celestial: 0.001,
  transcendent: 0.0001,
  divine: 0.00009,
  primordial: 0.000001,
}

// Cheap gold banner — only Common / Rare obtainable
export const HERO_GACHA_RATES_GOLD: Record<Rarity, number> = {
  common: 0.68,
  rare: 0.25,
  epic: 0.07,
  legendary: 0,
  mythic: 0,
  celestial: 0,
  transcendent: 0,
  divine: 0,
  primordial: 0,
}

// ----------------------------------------------------------------
// Dig rates
// ----------------------------------------------------------------

// Basic dig (cheap) — mostly junk, very low chance of high rarity
export const DIG_RATES: Record<Rarity | "nothing", number> = {
  nothing: 0.62,
  common: 0.27,
  rare: 0.09,
  epic: 0.018,
  legendary: 0.001,
  mythic: 0.0009,
  celestial: 0.0001,
  transcendent: 0.00005,
  divine: 0.000049,
  primordial: 0.000001,
}

// Deep dig (expensive) — much better odds
export const DIG_RATES_DEEP: Record<Rarity | "nothing", number> = {
  nothing: 0.4,
  common: 0.3,
  rare: 0.18,
  epic: 0.085,
  legendary: 0.025,
  mythic: 0.009,
  celestial: 0.001,
  transcendent: 0.0001,
  divine: 0.00009,
  primordial: 0.000001,
}

// Restock weights for shop items by rarity (used when refreshing shop)
export const SHOP_RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  rare: 28,
  epic: 14,
  legendary: 6,
  mythic: 0.8,        // Very rare in shop
  celestial: 0.1,     // Extremely rare
  transcendent: 0.02, // Near impossible in shop
  divine: 0.005,
  primordial: 0.001,
}

export const RARITY_TEXT_CLASS: Record<Rarity, string> = {
  common: "text-rarity-common",
  rare: "text-rarity-rare",
  epic: "text-rarity-epic",
  legendary: "text-rarity-legendary",
  mythic: "text-rarity-mythic",
  celestial: "text-rarity-celestial",
  transcendent: "text-rarity-transcendent",
  divine: "text-rarity-divine",
  primordial: "text-rarity-primordial",
}

export const RARITY_BG_CLASS: Record<Rarity, string> = {
  common: "bg-rarity-common/20 border-rarity-common/60",
  rare: "bg-rarity-rare/20 border-rarity-rare/60",
  epic: "bg-rarity-epic/20 border-rarity-epic/60",
  legendary: "bg-rarity-legendary/15 border-rarity-legendary/70",
  mythic: "bg-rarity-mythic/20 border-rarity-mythic/70",
  celestial: "bg-rarity-celestial/20 border-rarity-celestial/70",
  transcendent: "bg-rarity-transcendent/20 border-rarity-transcendent/70",
  divine: "bg-rarity-divine/20 border-rarity-divine/70",
  primordial: "bg-rarity-primordial/20 border-rarity-primordial/70",
}

export const RARITY_GLOW: Record<Rarity, string> = {
  common: "",
  rare: "",
  epic: "glow-violet",
  legendary: "glow-gold",
  mythic: "glow-crimson",
  celestial: "glow-cyan pulse-rarity",
  transcendent: "glow-cyan pulse-rarity",
  divine: "glow-gold pulse-rarity",
  primordial: "glow-crimson pulse-rarity",
}

// Multipliers applied to base stats by rarity
export const RARITY_STAT_MULT: Record<Rarity, number> = {
  common:       1.00,
  rare:         1.20,
  epic:         1.56,
  legendary:    2.18,
  mythic:       3.27,
  celestial:    5.24,
  transcendent: 7.86,   // +50% vs celestial
  divine:       11.79,  // +50% vs transcendent
  primordial:   17.69,  // +50% vs divine
}

// Innate multipliers for new tiers
export const INNATE_RARITY_MULT_EXT: Record<string, number> = {
  transcendent: 6.0,
  divine: 9.0,
  primordial: 13.5,
}

export function rollRarity(rates: Record<string, number>): string {
  const r = Math.random()
  let acc = 0
  const entries = Object.entries(rates)
  for (const [key, p] of entries) {
    acc += p
    if (r < acc) return key
  }
  return entries[entries.length - 1][0]
}

export function rarityRank(r: Rarity): number {
  return RARITY_ORDER.indexOf(r)
}

// ----------------------------------------------------------------
// Luck buff: dịch chuyển xác suất từ common/rare sang các bậc trên
// luckPct: 0.25 | 0.50 | 0.75
// ----------------------------------------------------------------
export function applyLuckToRates<T extends string>(
  rates: Record<T, number>,
  luckPct: number,
): Record<T, number> {
  const result = { ...rates }
  const entries = Object.entries(rates) as [T, number][]

  // Xác định bậc thấp (common, rare) và bậc cao (epic+)
  const LOW_TIERS = new Set(["common", "rare", "nothing"])
  const HIGH_TIERS = entries.filter(([k]) => !LOW_TIERS.has(k) && (result as Record<string, number>)[k] > 0)

  if (HIGH_TIERS.length === 0) return result

  // Tổng xác suất từ bậc thấp * luckPct là lượng cần chuyển sang bậc cao
  const lowTotal = entries.reduce((sum, [k, v]) => LOW_TIERS.has(k) ? sum + v : sum, 0)
  const transfer = lowTotal * luckPct

  // Chia đều lượng transfer theo tỉ lệ hiện có của bậc cao
  const highTotal = HIGH_TIERS.reduce((sum, [, v]) => sum + v, 0)
  for (const [key, val] of HIGH_TIERS) {
    const share = highTotal > 0 ? val / highTotal : 1 / HIGH_TIERS.length
    ;(result as Record<string, number>)[key] = val + transfer * share
  }

  // Giảm bậc thấp tương ứng (theo tỉ lệ)
  for (const [key, val] of entries) {
    if (!LOW_TIERS.has(key)) continue
    ;(result as Record<string, number>)[key] = Math.max(0, val - transfer * (val / lowTotal))
  }

  return result
}
