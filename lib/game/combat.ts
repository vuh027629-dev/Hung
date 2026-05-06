import { HEROES, HEROES_BY_ID } from "./heroes"
import { SYNERGIES } from "./factions"
import { ITEMS_BY_ID, generateEnemyEquipment } from "./items"
import { PASSIVES, SKILLS, SKILL_EVOLUTION_MAP } from "./skills"
import { RARITY_STAT_MULT, rarityRank } from "./rarity"
import { ALL_BY_ID } from "./blessings"
import type { BlessingPactContext } from "./blessings"
import type {
  BattleRow,
  BattleSide,
  BattleUnit,
  CombatLogEntry,
  CombatState,
  GameState,
  HeroTemplate,
  ItemPassive,
  Rarity,
  OwnedHero,
  Skill,
  SkillEffect,
  Stats,
  StatusEffect,
  Trait,
} from "./types"

// Energy system constants
const ENERGY_MAX = 100
const ENERGY_TURN_GAIN = 20 // per own turn
const ENERGY_ON_HIT = 8 // when taking damage
const ENERGY_ON_DEAL = 3 // when dealing damage
const ULTIMATE_ENERGY_COST = 100

// Keep log bounded to avoid memory + render cost in long fights
const LOG_MAX = 300
const LOG_TRIM_TO = 200

/** Trim log in-place if it exceeds LOG_MAX entries */
function trimLog(log: CombatLogEntry[]) {
  if (log.length > LOG_MAX) {
    log.splice(0, log.length - LOG_TRIM_TO)
  }
}

// ============================================================
// Helpers
// ============================================================

const uid = () => Math.random().toString(36).slice(2, 11)

// ============================================================
// Blessing/Pact hook dispatcher
// ============================================================
// ============================================================
// Blessing/Pact hook dispatcher (also exported for store use)
// ============================================================
export function _fireHook(
  hookName: keyof import("./blessings").BlessingPactHooks,
  state: CombatState,
  bearer: BattleUnit,
  extras: Partial<Omit<BlessingPactContext, "state"|"bearer"|"log">> = {}
) {
  fireHook(hookName, state, bearer, extras)
}

function fireHook(
  hookName: keyof import("./blessings").BlessingPactHooks,
  state: CombatState,
  bearer: BattleUnit,
  extras: Partial<Omit<BlessingPactContext, "state"|"bearer"|"log">> = {}
) {
  if (!bearer.blessingPactId) return
  const bp = ALL_BY_ID[bearer.blessingPactId]
  if (!bp) return
  const hook = bp.hooks[hookName] as ((ctx: BlessingPactContext) => void) | undefined
  if (!hook) return
  hook({
    state,
    bearer,
    log: state.log,
    allies: state.units.filter(u => u.side === bearer.side && u.hp > 0),
    enemies: state.units.filter(u => u.side !== bearer.side && u.hp > 0),
    ...extras,
  })
}

function emptyStats(): Stats {
  return {
    hp: 0, atk: 0, mag: 0, def: 0, res: 0,
    spd: 0, crit: 0, critDmg: 0, acc: 0, eva: 0, lifesteal: 0,
  }
}

function addStats(a: Stats, b: Partial<Stats>): Stats {
  const out = { ...a }
  for (const k in b) {
    const key = k as keyof Stats
    out[key] = (out[key] || 0) + (b[key] || 0)
  }
  return out
}

function multiplyStatsByPct(base: Stats, pct: Partial<Stats>): Stats {
  // Used for synergy modifiers where values are percentages (0.2 = +20%)
  const out = { ...base }
  for (const k in pct) {
    const key = k as keyof Stats
    const mult = pct[key] || 0
    if (key === "crit" || key === "critDmg" || key === "acc" || key === "eva" || key === "lifesteal") {
      // For percent-style stats, treat synergy value directly as additive points
      out[key] = (out[key] || 0) + mult
    } else {
      out[key] = Math.round((out[key] || 0) * (1 + mult))
    }
  }
  return out
}

// Compute final stats for an owned hero at its level + equipment
export function computeHeroStats(owned: OwnedHero, template?: HeroTemplate, inventory?: GameState["inventory"]): Stats {
  const tpl = template || HEROES_BY_ID[owned.templateId]
  if (!tpl) return emptyStats()

  const lvl = owned.level
  const mult = RARITY_STAT_MULT[tpl.rarity]
  // Base + growth*level
  let stats: Stats = { ...emptyStats() }
  for (const key in tpl.baseStats) {
    const k = key as keyof Stats
    const base = tpl.baseStats[k] || 0
    const grow = (tpl.growth as Stats)[k] || 0
    stats[k] = Math.round((base + grow * (lvl - 1)) * mult)
  }
  // Equipment
  for (const slot of ["weapon", "armor", "trinket"] as const) {
    const itemId = owned.equipment[slot]
    if (!itemId) continue
    const item = ITEMS_BY_ID[itemId]
    if (!item || !item.stats) continue
    stats = addStats(stats, item.stats)
    // Apply innate bonus from inventory if present
    if (inventory) {
      const invEntry = inventory.find(i => i.itemId === itemId && i.innate)
      if (invEntry?.innate) {
        const { stat, value } = invEntry.innate
        stats[stat] = (stats[stat] || 0) + value
      }
    }
  }
  // Skill levels — contribute to relevant stats
  // Each skill level gives +2% to primary stat (was 1%)
  // Max 15 total levels (3 skills × 5) → up to +30% at max investment
  const sLvlSum = owned.skillLevels.reduce((a, b) => a + b, 0)
  if (tpl.role === "mage" || tpl.role === "support") {
    stats.mag = Math.round(stats.mag * (1 + sLvlSum * 0.02))
    stats.res = Math.round(stats.res * (1 + sLvlSum * 0.01))
  } else if (tpl.role === "tank") {
    stats.def = Math.round(stats.def * (1 + sLvlSum * 0.02))
    stats.hp  = Math.round(stats.hp  * (1 + sLvlSum * 0.01))
  } else {
    stats.atk = Math.round(stats.atk * (1 + sLvlSum * 0.02))
    stats.spd = Math.round(stats.spd * (1 + sLvlSum * 0.005))
  }
  return stats
}

export function xpToNextLevel(level: number) {
  return Math.round(80 + level * 60 + level * level * 8)
}

export function playerXpToNextLevel(level: number) {
  return Math.round(120 + level * 100 + level * level * 12)
}

// ============================================================
// Synergy computation
// ============================================================

export type AppliedSynergy = {
  trait: Trait
  name: string
  count: number
  tier: { count: number; description: string; modifiers: Partial<Stats>; bonusId?: string }
}

export function computeSynergies(team: HeroTemplate[]): AppliedSynergy[] {
  const counts: Record<string, number> = {}
  for (const h of team) {
    counts[h.role] = (counts[h.role] || 0) + 1
    for (const o of h.origins) counts[o] = (counts[o] || 0) + 1
  }
  const applied: AppliedSynergy[] = []
  for (const syn of SYNERGIES) {
    const c = counts[syn.trait] || 0
    if (c < 2) continue
    // Pick highest tier whose count threshold is satisfied
    let best = syn.tiers[0]
    for (const t of syn.tiers) {
      if (c >= t.count) best = t
    }
    applied.push({ trait: syn.trait, name: syn.name, count: c, tier: best })
  }
  return applied
}

// ============================================================
// Build BattleUnit from owned hero
// ============================================================

function ownedToUnit(
  owned: OwnedHero,
  side: BattleSide,
  playerStatBonuses: Partial<Stats> = {},
): BattleUnit {
  const tpl = HEROES_BY_ID[owned.templateId]
  let stats = computeHeroStats(owned, tpl)
  // Player stat bonuses (account-wide) only apply to player side
  if (side === "player") {
    stats = addStats(stats, playerStatBonuses)
  }
  // Passive flat modifiers
  const passive = PASSIVES[tpl.passive]
  if (passive?.modifier) {
    stats = multiplyStatsByPct(stats, passive.modifier as Partial<Stats>)
  }
  // Aggregate item passives from equipment
  const itemPassives: ItemPassive[] = []
  for (const slot of ["weapon", "armor", "trinket"] as const) {
    const itemId = owned.equipment[slot]
    if (!itemId) continue
    const item = ITEMS_BY_ID[itemId]
    if (item?.passive) itemPassives.push(item.passive)
  }
  const hpMax = stats.hp
  return {
    uid: uid(),
    side,
    row: "front" as BattleRow, // default; overridden by buildCombatState
    templateId: tpl.id,
    name: tpl.name,
    rarity: tpl.rarity,
    range: tpl.range,
    role: tpl.role,
    origins: tpl.origins,
    level: owned.level,
    hp: hpMax,
    hpMax,
    energy: 0,
    energyMax: ENERGY_MAX,
    stats,
    skills: (owned.equippedSkillIds ?? tpl.skills).map((sid, i) => {
      const isBonus = !tpl.skills.includes(sid as any)
      const lvl = isBonus ? ((owned.bonusSkillLevels ?? {})[sid] ?? 1) : owned.skillLevels[i]
      const evoId = SKILL_EVOLUTION_MAP[sid]
      const useId = lvl >= 5 && evoId ? evoId : sid
      return SKILLS[useId] ?? SKILLS[sid]
    }),
    skillLevels: (owned.equippedSkillIds ?? tpl.skills).map((sid, i) => {
      const isBonus = !tpl.skills.includes(sid as any)
      return isBonus ? ((owned.bonusSkillLevels ?? {})[sid] ?? 1) : owned.skillLevels[i]
    }) as [number, number, number],
    passiveId: tpl.passive,
    cooldowns: [0, 0, 0],
    statuses: [],
    build: tpl.build,
    synergyText: [],
    itemPassives,
    equipment: { ...owned.equipment },
    blessingPactId: owned.blessingPactId,
    lowHpTriggered: false,
  }
}

function applySynergyToUnit(unit: BattleUnit, syn: AppliedSynergy[]): BattleUnit {
  let stats = { ...unit.stats }
  const log: string[] = []
  for (const a of syn) {
    stats = multiplyStatsByPct(stats, a.tier.modifiers)
    log.push(`${a.name}(${a.count}): ${a.tier.description}`)
  }
  // Recompute hp & hpMax based on hp stat changes
  const hpMax = stats.hp
  return { ...unit, stats, hpMax, hp: hpMax, synergyText: log }
}

// ============================================================
// Enemy generation (procedural per stage)
// ============================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Pick a rarity for an enemy slot based on stage thresholds:
 *
 * Common:    always available
 * Rare:      stage 5–15, chance fades from 100%→0% linearly over that range
 * Epic:      stage 10–30
 * Legendary: stage 25–50
 * Mythic:    stage 50+
 *
 * Celestial: ultra-rare special case (handled separately, see below)
 */
function pickEnemyRarity(stage: number): Rarity {
  // Weight for each non-celestial rarity at this stage
  const weights: Record<Rarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
    celestial: 0, // celestial handled separately
  }

  // Common is always allowed
  weights.common = 1

  // Rare: stage 5 (100%) → stage 15 (0%), linear fade
  if (stage >= 5 && stage < 15) {
    weights.rare = 1 - (stage - 5) / 10
  }

  // Epic: stage 10 (0%) → stage 20 (100%) ramp up, then stays until stage 30
  if (stage >= 10 && stage <= 30) {
    if (stage < 20) {
      weights.epic = (stage - 10) / 10
    } else {
      weights.epic = 1
    }
  }

  // Legendary: stage 25 (0%) → stage 40 (100%) ramp up, then stays until stage 50
  if (stage >= 25 && stage <= 50) {
    if (stage < 40) {
      weights.legendary = (stage - 25) / 15
    } else {
      weights.legendary = 1
    }
  }

  // Mythic: stage 50+, ramps in from 50 (0%) → 65 (100%)
  if (stage >= 50) {
    weights.mythic = Math.min(1, (stage - 50) / 15)
  }

  // Normalize and roll
  const entries = (["common", "rare", "epic", "legendary", "mythic"] as Rarity[]).filter(
    (r) => weights[r] > 0
  )
  const total = entries.reduce((s, r) => s + weights[r], 0)
  const roll = Math.random() * total
  let acc = 0
  for (const r of entries) {
    acc += weights[r]
    if (roll < acc) return r
  }
  return entries[entries.length - 1]
}

/**
 * How many celestial enemies can appear in one battle, by stage:
 *   stage < 70   → max 1
 *   stage 70–99  → max 2
 *   stage 100+   → max 4
 */
function celestialMaxCount(stage: number): number {
  if (stage >= 100) return 4
  if (stage >= 70) return 2
  return 1
}

/**
 * Probability that a single slot gets replaced by a celestial enemy:
 *   stage < 5      → 0.005 (0.5%) — always present as a tiny surprise
 *   stage 5–69     → 0.005 linear approach toward 25% at stage 70
 *   stage 70–99    → 0.25 (25%) — jumps at 70, grows toward 50% at 100
 *   stage 100+     → 0.50 (50%)
 */
function celestialChance(stage: number): number {
  if (stage >= 100) return 0.50
  if (stage >= 70) {
    // 25% at stage 70 → 50% at stage 100
    return 0.25 + (stage - 70) / 30 * 0.25
  }
  // stage 0–69: 0.5% flat (ultra rare surprise at low floors)
  return 0.005
}

export function generateEnemyTeam(stage: number): OwnedHero[] {
  const count = Math.min(5, 2 + Math.floor(stage / 3))
  const enemyLevel = Math.max(1, Math.floor(stage * 1.3))

  const celestialHeroes = HEROES.filter((h) => h.rarity === "celestial")
  const maxCelestials = celestialMaxCount(stage)
  const celChance = celestialChance(stage)

  const team: OwnedHero[] = []
  let celestialSpawned = 0

  for (let i = 0; i < count; i++) {
    let tpl: HeroTemplate

    // Attempt to spawn a celestial for this slot
    if (celestialSpawned < maxCelestials && celestialHeroes.length > 0 && Math.random() < celChance) {
      tpl = pickRandom(celestialHeroes)
      celestialSpawned++
    } else {
      // Pick a rarity based on stage thresholds
      const rarity = pickEnemyRarity(stage)
      const pool = HEROES.filter((h) => h.rarity === rarity)
      // Fallback to common if pool empty (shouldn't happen but safe)
      tpl = pool.length > 0 ? pickRandom(pool) : pickRandom(HEROES.filter((h) => h.rarity === "common"))
    }

    team.push({
      uid: uid(),
      templateId: tpl.id,
      level: enemyLevel,
      xp: 0,
      skillLevels: [1, 1, 1],
      equipment: generateEnemyEquipment(stage),
    })
  }
  return team
}

// ============================================================
// Combat state setup
// ============================================================

export function buildCombatState(state: GameState): CombatState {
  const stage = state.currentStage
  // Player team
  const playerSlots = state.team
    .map((id, idx) => ({ id, idx }))
    .filter((s): s is { id: string; idx: number } => !!s.id)

  const playerOwned: OwnedHero[] = playerSlots
    .map(s => state.heroes.find(h => h.uid === s.id))
    .filter((h): h is OwnedHero => !!h)

  const playerRows = playerSlots.map((s, i) => {
    const rows = state.teamRows ?? []
    return (rows[s.idx] ?? (playerOwned[i] && HEROES_BY_ID[playerOwned[i].templateId]?.range === "melee" ? "front" : "back")) as BattleRow
  })

  const playerTpls = playerOwned.map((h) => HEROES_BY_ID[h.templateId])
  const playerSyn = computeSynergies(playerTpls)
  const enemyOwned = generateEnemyTeam(stage)
  const enemyTpls = enemyOwned.map((h) => HEROES_BY_ID[h.templateId])
  const enemySyn = computeSynergies(enemyTpls)

  const playerBonuses: Partial<Stats> = {
    atk: state.playerStats.attackBonus,
    mag: state.playerStats.magicBonus,
    def: state.playerStats.defenseBonus,
    hp: state.playerStats.hpBonus,
    spd: state.playerStats.speedBonus,
    crit: state.playerStats.critBonus,
  }

  const playerUnits = playerOwned
    .map((o, i) => ({ ...ownedToUnit(o, "player", playerBonuses), row: playerRows[i] }))
    .map((u) => applySynergyToUnit(u, playerSyn))

  const enemyUnits = enemyOwned
    .map((o) => {
      const tpl = HEROES_BY_ID[o.templateId]
      const autoRow: BattleRow = tpl?.range === "melee" ? "front" : "back"
      return { ...ownedToUnit(o, "enemy"), row: autoRow }
    })
    .map((u) => applySynergyToUnit(u, enemySyn))

  // Blood Moon event: enemy stats +25%
  const bloodMoonActive = (state.activeEvents ?? []).some(e => e.eventId === "blood_moon")
  if (bloodMoonActive) {
    for (const u of enemyUnits) {
      u.stats = {
        ...u.stats,
        def: Math.round(u.stats.def * 1.25),
        res: Math.round(u.stats.res * 1.25),
        atk: Math.round(u.stats.atk * 1.25),
        mag: Math.round(u.stats.mag * 1.25),
      }
      u.hpMax = Math.round(u.hpMax * 1.25)
      u.hp = u.hpMax
    }
  }

  // Apply origin-based start-of-battle effects
  for (const u of [...playerUnits, ...enemyUnits]) {
    applyStartOfBattleEffects(u)
  }

  // Apply outlaw (armor break) on opposite team
  applyCrossTeamStartEffects(playerUnits, enemyUnits, playerSyn, enemySyn)
  const all = [...playerUnits, ...enemyUnits]
  const order = computeTurnOrder(all)
  const log: CombatLogEntry[] = [
    { id: uid(), text: `⚔️ Tầng ${stage} bắt đầu! ${enemyUnits.length} kẻ địch xuất hiện.`, kind: "system" },
  ]

  // Apply ancient cdr effect
  for (const u of [...playerUnits, ...enemyUnits]) {
    if (PASSIVES[u.passiveId]?.signatureId === "ancient-cdr") {
      // not used directly — synergy handled below
    }
  }
  applyAncientCdr(playerUnits, playerSyn, log)
  applyAncientCdr(enemyUnits, enemySyn, log)

  // Storm synergy: add initial SPD boost (per-turn growth handled in onEndOfTurn)
  // Phantom synergy: EVA boost already applied via modifiers in applySynergyToUnit
  // Plague synergy: damage spread handled in onEndOfTurn tick

  // FIX: awaitingPlayerInput must check the FIRST unit in turn ORDER (sorted by
  // speed), NOT all[0] which is always a player unit. When an enemy has higher
  // speed they appear first in `order` and must act automatically — the old
  // code forced awaitingPlayerInput=true in that case, causing the AI to
  // never be triggered and the "Đang tính toán..." spinner to loop forever.
  const firstInOrder = all.find((u) => u.uid === order[0])
  const initialLog: CombatLogEntry[] = [
    { id: uid(), text: `⚔️ Tầng ${stage} bắt đầu! ${enemyUnits.length} kẻ địch xuất hiện.`, kind: "system" },
  ]
  const cs: CombatState = {
    stage,
    turn: 0,
    units: all,
    order,
    activeUnitIndex: 0,
    round: 1,
    log: initialLog,
    ended: null,
    awaitingPlayerInput: firstInOrder?.side === "player",
    watchMode: false,
  }
  // Fire onBattleStart for all player units with blessings/pacts
  for (const u of playerUnits) {
    fireHook("onBattleStart", cs, u)
  }
  return cs
}

function computeTurnOrder(units: BattleUnit[]): string[] {
  const alive = units.filter((u) => u.hp > 0)
  return alive
    .slice()
    .sort((a, b) => {
      const sa = effectiveSpd(a)
      const sb = effectiveSpd(b)
      if (sb === sa) return a.side === "player" ? -1 : 1
      return sb - sa
    })
    .map((u) => u.uid)
}

function effectiveSpd(u: BattleUnit): number {
  let spd = u.stats.spd
  for (const st of u.statuses) {
    if (st.kind === "spdUp") spd += spd * (st.value / 100)
    if (st.kind === "spdDown") spd -= spd * (st.value / 100)
  }
  return spd
}

// ============================================================
// Speed passive bonuses
// ============================================================

/**
 * How many cooldown turns to shave off when a skill resolves,
 * based on attacker's effective speed.
 *
 * Thresholds (effective spd → reduction applied to ALL own cooldowns after casting):
 *   spd >= 150  → -1 lượt
 *   spd >= 200  → -2 lượt
 *   spd >= 250  → -3 lượt  (cap)
 */
export function spdCooldownReduction(spd: number): number {
  if (spd >= 250) return 3
  if (spd >= 200) return 2
  if (spd >= 150) return 1
  return 0
}

/**
 * How many EXTRA basic-attack hits a unit gets, determined
 * probabilistically from speed.
 *
 * Each extra hit has an independent chance based on (spd - 100) / 50,
 * capped at 4 extra hits (5 total).  
 *   spd 100 → 0% per roll   (no extras)
 *   spd 150 → 100% first hit, then 0% second  → guaranteed 1 extra
 *   spd 200 → 200% → guaranteed 2 extras, 0% third
 *   spd 250 → 300% → guaranteed 3 extras, 0% fourth
 *   spd 300 → 400% → guaranteed 4 extras
 *
 * In practice fractional portions are kept as probabilistic:
 *   e.g. spd 170 → ratio = 1.4 → 1 guaranteed + 40% chance of 2nd
 */
export function spdExtraHits(spd: number): number {
  const MAX_EXTRA = 4
  const ratio = Math.max(0, (spd - 100) / 50) // 0 at spd=100, 1.0 at 150, 4.0 at 300
  const guaranteed = Math.min(MAX_EXTRA, Math.floor(ratio))
  const chance = ratio - guaranteed          // fractional remainder as probability
  const bonus = chance > 0 && Math.random() < chance ? 1 : 0
  return Math.min(MAX_EXTRA, guaranteed + bonus)
}

/** Cuồng Đao variant — uncapped extra hits (no chain cap), CD reduction cap still applies */
export function spdExtraHitsUncapped(spd: number): number {
  const ratio = Math.max(0, (spd - 100) / 50)
  const guaranteed = Math.floor(ratio)
  const chance = ratio - guaranteed
  const bonus = chance > 0 && Math.random() < chance ? 1 : 0
  return guaranteed + bonus
}

// ============================================================
// Start-of-battle effects (synergy/passive based)
// ============================================================

function applyStartOfBattleEffects(u: BattleUnit) {
  const passive = PASSIVES[u.passiveId]
  if (passive?.signatureId === "celestial-shield") {
    u.statuses.push({
      id: uid(),
      kind: "shield",
      value: 0.2,
      turns: 99,
      name: "Khiên Thiên Quang",
    })
  }
  // Item passive: battleStart effects
  for (const ip of u.itemPassives) {
    if (ip.kind === "battleStart") {
      if (ip.effect === "shield") {
        u.statuses.push({ id: uid(), kind: "shield", value: ip.value, turns: ip.turns, name: "Khiên Trang Bị" })
      } else if (ip.effect === "regen") {
        u.statuses.push({ id: uid(), kind: "regen", value: ip.value, turns: ip.turns, name: "Hồi Sinh" })
      } else if (ip.effect === "atkUp") {
        u.statuses.push({ id: uid(), kind: "atkUp", value: ip.value, turns: ip.turns, name: "Khích Lệ" })
      } else if (ip.effect === "defUp") {
        u.statuses.push({ id: uid(), kind: "defUp", value: ip.value, turns: ip.turns, name: "Vững Chãi" })
      }
    }
  }
}

function applyCrossTeamStartEffects(
  player: BattleUnit[],
  enemies: BattleUnit[],
  playerSyn: AppliedSynergy[],
  enemySyn: AppliedSynergy[],
) {
  // Outlaw: armor break opposite team
  const playerOutlaw = playerSyn.find((s) => s.trait === "outlaw")
  if (playerOutlaw?.tier.bonusId === "outlaw-armorbreak-1") {
    for (const e of enemies) e.stats.def = Math.round(e.stats.def * 0.8)
  } else if (playerOutlaw?.tier.bonusId === "outlaw-armorbreak-2") {
    for (const e of enemies) e.stats.def = Math.round(e.stats.def * 0.6)
  }
  const enemyOutlaw = enemySyn.find((s) => s.trait === "outlaw")
  if (enemyOutlaw?.tier.bonusId === "outlaw-armorbreak-1") {
    for (const p of player) p.stats.def = Math.round(p.stats.def * 0.8)
  } else if (enemyOutlaw?.tier.bonusId === "outlaw-armorbreak-2") {
    for (const p of player) p.stats.def = Math.round(p.stats.def * 0.6)
  }

  // Celestial team shield (synergy)
  const applyCelestialShield = (units: BattleUnit[], syn: AppliedSynergy[]) => {
    const cel = syn.find((s) => s.trait === "celestial")
    if (!cel) return
    const pct = cel.tier.bonusId === "celestial-shield-2" ? 0.3 : 0.15
    for (const u of units) {
      u.statuses.push({ id: uid(), kind: "shield", value: pct, turns: 99, name: "Khiên Thiên Đoàn" })
    }
  }
  applyCelestialShield(player, playerSyn)
  applyCelestialShield(enemies, enemySyn)
}

function applyAncientCdr(units: BattleUnit[], syn: AppliedSynergy[], log: CombatLogEntry[]) {
  const ancient = syn.find((s) => s.trait === "ancient")
  let amt = 0
  if (ancient?.tier.bonusId === "ancient-cdr-1") amt = 1
  if (ancient?.tier.bonusId === "ancient-cdr-2") amt = 2
  for (const u of units) {
    const passive = PASSIVES[u.passiveId]
    if (passive?.signatureId === "ancient-cdr") amt = Math.max(amt, 1)
  }
  if (amt > 0) {
    for (const u of units) {
      u.cooldowns = u.cooldowns.map((cd) => Math.max(0, cd - amt)) as [number, number, number]
    }
  }
}

// ============================================================
// Damage / heal application
// ============================================================

function alivesOf(state: CombatState, side: BattleSide): BattleUnit[] {
  return state.units.filter((u) => u.side === side && u.hp > 0)
}

function rollDamage(
  caster: BattleUnit,
  target: BattleUnit,
  ef: NonNullable<SkillEffect["damage"]>,
  log: CombatLogEntry[],
  state?: CombatState,
): { dmg: number; isCrit: boolean } {
  // Attack/dodge check — né tối đa 70% mỗi lần nhận damage (per-hit)
  if (ef.type !== "true") {
    const acc = caster.stats.acc
    const eva = Math.min(70, target.stats.eva) // cap 70% dodge rate
    const hitChance = Math.max(0.30, Math.min(1, (acc - eva + 100) / 100))
    if (Math.random() > hitChance) {
      log.push({
        id: uid(),
        text: `${caster.name} bị ${target.name} né tránh!`,
        kind: "info",
      })
      return { dmg: 0, isCrit: false }
    }
  }

  const sourceStat = caster.stats[ef.stat as keyof Stats] || 0
  let raw = sourceStat * ef.scale
  // Apply attack/atk-up status
  const atkUp = caster.statuses.filter((s) => s.kind === "atkUp").reduce((a, s) => a + s.value, 0)
  const atkDown = caster.statuses.filter((s) => s.kind === "atkDown").reduce((a, s) => a + s.value, 0)
  raw *= 1 + (atkUp - atkDown) / 100

  // Apply defense/resistance — tối đa giảm 85% damage (luôn nhận ít nhất 15%)
  if (ef.type === "physical") {
    const def = target.stats.def
    const defUp = target.statuses.filter((s) => s.kind === "defUp").reduce((a, s) => a + s.value, 0)
    const defDown = target.statuses.filter((s) => s.kind === "defDown").reduce((a, s) => a + s.value, 0)
    const finalDef = Math.max(0, def * (1 + (defUp - defDown) / 100))
    const defReduction = Math.min(0.85, 1 - 100 / (100 + finalDef)) // cap 85%
    raw = raw * (1 - defReduction)
  } else if (ef.type === "magic") {
    const res = Math.max(0, target.stats.res)
    const resReduction = Math.min(0.85, 1 - 100 / (100 + res)) // cap 85%
    raw = raw * (1 - resReduction)
  }

  // Crit
  let isCrit = false
  if (ef.type !== "true") {
    if (Math.random() * 100 < caster.stats.crit) {
      isCrit = true
      raw *= caster.stats.critDmg / 100
    }
  }

  // Item passive: execute (extra damage on low-HP targets)
  for (const ip of caster.itemPassives) {
    if (ip.kind === "execute") {
      if (target.hp / target.hpMax <= ip.threshold) {
        raw *= 1 + ip.bonus
      }
    }
  }

  let dmg = Math.max(1, Math.round(raw))

  // Shield absorb — chỉ chặn 1 lần/lượt mỗi unit (per turn, không per hit)
  const shieldBlocked = (target as any).__shieldUsedThisTurn ?? false
  if (!shieldBlocked) {
    for (const status of target.statuses.filter((s) => s.kind === "shield")) {
      if (dmg <= 0) break
      const shieldHp = Math.round(target.hpMax * Math.max(0, status.value))
      const absorb = Math.min(dmg, shieldHp)
      dmg -= absorb
      status.value = Math.max(0, status.value - absorb / target.hpMax)
      if (status.value <= 0) {
        status.turns = 0
        log.push({ id: uid(), text: `🛡 Khiên của ${target.name} bị phá vỡ!`, kind: "status" })
      }
    }
    if (dmg < Math.round(target.hpMax * 0.01)) { // effectively absorbed
      ;(target as any).__shieldUsedThisTurn = true
      log.push({ id: uid(), text: `🛡 ${target.name} chặn đòn bằng khiên! (1 lần/lượt)`, kind: "status" })
    }
  }

  target.hp = Math.max(0, target.hp - dmg)

  // phoenixCore: revive once when HP hits 0
  if (target.hp <= 0 && dmg > 0 && !(target as any).__phoenixUsed) {
    const phoenix = target.itemPassives.find(ip => ip.kind === "phoenixCore")
    if (phoenix) {
      ;(target as any).__phoenixUsed = true
      target.hp = Math.round(target.hpMax * phoenix.revivePct)
      target.energy = target.energyMax
      log.push({ id: uid(), text: `🔥 ${target.name} Lõi Phượng Hoàng! Hồi sống với ${Math.round(phoenix.revivePct * 100)}% HP và đầy năng lượng!`, kind: "heal" })
    }
  }

  // Bounty passive: when target dies from this hit, grant stat bonus to caster
  if (target.hp <= 0 && dmg > 0) {
    for (const ip of caster.itemPassives) {
      if (ip.kind === "bounty") {
        caster.stats[ip.statBonus] = (caster.stats[ip.statBonus] || 0) + ip.bonusPerKill
        log.push({ id: uid(), text: `💰 ${caster.name} nhận thưởng đầu! +${ip.bonusPerKill} ${ip.statBonus.toUpperCase()}`, kind: "status" })
      }
    }
  }

  // Lifesteal
  if (caster.stats.lifesteal > 0 && dmg > 0 && ef.type !== "true") {
    const heal = Math.round((dmg * caster.stats.lifesteal) / 100)
    caster.hp = Math.min(caster.hpMax, caster.hp + heal)
  }

  // Energy gain — caster gains for dealing, target gains for being hit
  caster.energy = Math.min(caster.energyMax, caster.energy + ENERGY_ON_DEAL)
  if (target.hp > 0) {
    target.energy = Math.min(target.energyMax, target.energy + ENERGY_ON_HIT)
  }

  // Item passive: thorns — reflect a portion of physical damage back to caster
  if (ef.type === "physical" && dmg > 0) {
    for (const ip of target.itemPassives) {
      if (ip.kind === "thorns") {
        const reflect = Math.max(1, Math.round(dmg * ip.pct))
        caster.hp = Math.max(0, caster.hp - reflect)
        log.push({
          id: uid(),
          text: `🛡️ ${target.name} phản đòn — ${caster.name} mất ${reflect}`,
          kind: "damage",
        })
      }
    }
  }

  log.push({
    id: uid(),
    text: `${caster.name} ${ef.type === "magic" ? "✦" : ef.type === "true" ? "✯" : "⚔"} ${target.name} -${dmg}${isCrit ? " (CRIT!)" : ""}`,
    kind: "damage",
  })

  // ── Blessing/Pact hooks ──
  if (dmg > 0 && state) {
    // onDealDamage for caster
    fireHook("onDealDamage", state, caster, { target, dmg })
    // onTakeDamage for target
    fireHook("onTakeDamage", state, target, { attacker: caster, dmg })
    // onLowHp for target (one-shot per battle)
    if (!target.lowHpTriggered && target.hp / target.hpMax < 0.3 && target.hp > 0) {
      target.lowHpTriggered = true
      fireHook("onLowHp", state, target, { attacker: caster, dmg })
    }
    // onKill
    if (target.hp <= 0) {
      fireHook("onKill", state, caster, { target, dmg })
    }
  }

  // NOTE: counterstrike is called by callers (performBasicAttack) to avoid double-proc on multi-hit
  return { dmg, isCrit }
}

function healUnit(
  caster: BattleUnit,
  target: BattleUnit,
  ef: NonNullable<SkillEffect["heal"]>,
  log: CombatLogEntry[],
) {
  const stat = caster.stats[ef.stat as keyof Stats] || 0
  let amt = Math.round(stat * ef.scale)
  // 🔥 Bỏng: giảm 40% lượng heal nhận được
  if (target.statuses.some(s => s.kind === "burn")) {
    amt = Math.round(amt * 0.6)
    log.push({ id: uid(), text: `🔥 ${target.name} đang bỏng — heal giảm 40%!`, kind: "status" })
  }
  target.hp = Math.min(target.hpMax, target.hp + amt)
  log.push({ id: uid(), text: `${caster.name} hồi ${amt} HP cho ${target.name}`, kind: "heal" })
}

function applyStatus(target: BattleUnit, status: Omit<StatusEffect, "id">, log: CombatLogEntry[]) {
  // ── 🔥 Burn: không stack, tối đa 2 lượt, refresh nếu đã có ──
  if (status.kind === "burn") {
    const ex = target.statuses.find(s => s.kind === "burn")
    if (ex) {
      ex.turns = Math.min(2, Math.max(ex.turns, status.turns))
      ex.value = Math.max(ex.value, status.value)
      log.push({ id: uid(), text: `🔥 ${target.name}: Bỏng làm mới (${ex.turns} lượt)`, kind: "status" })
      return
    }
    target.statuses.push({ ...status, id: uid(), turns: Math.min(2, status.turns) })
    log.push({ id: uid(), text: `🔥 ${target.name} bị Bỏng (${Math.min(2, status.turns)} lượt)`, kind: "status" })
    return
  }
  // ── 🩸 Bleed: không stack, refresh turns nếu đã có ──
  if (status.kind === "bleed") {
    const ex = target.statuses.find(s => s.kind === "bleed")
    if (ex) {
      ex.turns = Math.max(ex.turns, status.turns)
      log.push({ id: uid(), text: `🩸 ${target.name}: Chảy máu duy trì (${ex.turns} lượt)`, kind: "status" })
      return
    }
    target.statuses.push({ ...status, id: uid() })
    log.push({ id: uid(), text: `🩸 ${target.name} bắt đầu Chảy máu (${status.turns} lượt)`, kind: "status" })
    return
  }
  // ── ☠️ Poison: stack được, value mỗi stack = ½ gốc ──
  if (status.kind === "poison") {
    const half = Math.max(1, Math.round(status.value * 0.5))
    target.statuses.push({ ...status, id: uid(), value: half })
    const stacks = target.statuses.filter(s => s.kind === "poison").length
    log.push({ id: uid(), text: `☠️ ${target.name} bị Độc×${stacks} (${status.turns} lượt)`, kind: "status" })
    return
  }
  // ── Mọi loại khác: push bình thường ──
  target.statuses.push({ ...status, id: uid() })
  log.push({ id: uid(), text: `${target.name} bị áp ${status.name}`, kind: "status" })
}

// ============================================================
// Action resolution
// ============================================================

// Apply item-passive onHit procs from caster onto target
function applyOnHitProcs(caster: BattleUnit, target: BattleUnit, log: CombatLogEntry[]) {
  if (target.hp <= 0) return
  for (const ip of caster.itemPassives) {
    if (ip.kind === "onHit") {
      if (Math.random() < ip.chance) {
        applyStatus(
          target,
          { kind: ip.status as "defDown", value: ip.value, turns: ip.turns, name: ip.name },
          log,
        )
      }
    } else if (ip.kind === "armorBreak") {
      if (Math.random() < ip.chance) {
        const breakAmt = Math.round(target.stats.def * ip.pct)
        target.stats.def = Math.max(0, target.stats.def - breakAmt)
        target.stats.res = Math.max(0, target.stats.res - Math.round(target.stats.res * ip.pct * 0.5))
        log.push({ id: uid(), text: `🔨 ${caster.name} phá ${breakAmt} DEF của ${target.name}!`, kind: "status" })
      }
    }
  }
}

function applyCounterstrike(attacker: BattleUnit, victim: BattleUnit, dmgDealt: number, log: CombatLogEntry[]) {
  if (victim.hp <= 0) return
  for (const ip of victim.itemPassives) {
    if (ip.kind === "counterstrike" && Math.random() < ip.chance) {
      const reflect = Math.max(1, Math.round(dmgDealt * ip.pct))
      attacker.hp = Math.max(0, attacker.hp - reflect)
      log.push({ id: uid(), text: `⚡ ${victim.name} phản đòn! ${attacker.name} mất ${reflect}!`, kind: "damage" })
    }
  }
}

function applyMirrorShield(attacker: BattleUnit, victim: BattleUnit, dmgDealt: number, log: CombatLogEntry[]) {
  if (victim.hp <= 0) return
  for (const ip of victim.itemPassives) {
    if (ip.kind === "mirrorShield") {
      // Determine reflect amount based on damage type (simplified: use reflectPhys as base)
      const reflect = Math.max(1, Math.round(dmgDealt * ip.reflectPhys))
      attacker.hp = Math.max(0, attacker.hp - reflect)
      log.push({ id: uid(), text: `🪞 ${victim.name} phản gương! ${attacker.name} mất ${reflect} HP!`, kind: "damage" })
    }
  }
}

function applyManaShield(victim: BattleUnit, dmgDealt: number, log: CombatLogEntry[]) {
  for (const ip of victim.itemPassives) {
    if (ip.kind === "manaShield") {
      const energyGain = Math.round(dmgDealt * ip.dmgToEnergy)
      const prev = victim.energy
      victim.energy = Math.min(victim.energyMax, victim.energy + energyGain)
      if (victim.energy > prev) {
        log.push({ id: uid(), text: `⚡ ${victim.name} hấp thụ ${victim.energy - prev} năng lượng từ sát thương!`, kind: "status" })
      }
    }
  }
}

export function performBasicAttack(
  state: CombatState,
  attacker: BattleUnit,
  target: BattleUnit,
): void {
  const spd = effectiveSpd(attacker)

  // frenzySword: uncapped extra hits
  const frenzyPassive = attacker.itemPassives.find(ip => ip.kind === "frenzySword")
  const extraHits = frenzyPassive ? spdExtraHitsUncapped(spd) : spdExtraHits(spd)

  // cursedBlade: multiply damage, deal self-damage
  const cursedBlade = attacker.itemPassives.find(ip => ip.kind === "cursedBlade")
  // bloodPact: stacking damage bonus
  const bloodPactPassive = attacker.itemPassives.find(ip => ip.kind === "bloodPact")
  const bloodPactStacks = bloodPactPassive
    ? Math.min(3, attacker.statuses.find(s => s.name === "__bloodpact_stacks")?.value ?? 0)
    : 0
  const bloodPactBonus = bloodPactPassive ? 1 + bloodPactStacks * bloodPactPassive.dmgBonus : 1
  // deathMark: bonus dmg + energy refill vs low-HP target
  const deathMark = attacker.itemPassives.find(ip => ip.kind === "deathMark")
  const deathMarkActive = deathMark && target.hp / target.hpMax < deathMark.threshold

  const dmgScale = (cursedBlade ? cursedBlade.dmgMult : 1) * bloodPactBonus * (deathMarkActive && deathMark ? (1 + deathMark.dmgAmp) : 1)

  // First hit
  const { dmg } = rollDamage(
    attacker, target,
    { scale: 1.0 * dmgScale, stat: attacker.role === "mage" ? "mag" : "atk", type: attacker.role === "mage" ? "magic" : "physical" },
    state.log, state,
  )

  // deathMark proc: restore full energy
  if (deathMarkActive && deathMark && dmg > 0) {
    attacker.energy = attacker.energyMax
    state.log.push({ id: uid(), text: `💀 ${attacker.name} Tử Thần Ấn! +${Math.round(deathMark.dmgAmp * 100)}% sát thương & đầy năng lượng!`, kind: "info" })
  }
  // cursedBlade: self-damage
  if (cursedBlade && dmg > 0) {
    const selfDmg = Math.round(dmg * cursedBlade.selfDmgPct)
    attacker.hp = Math.max(1, attacker.hp - selfDmg)
    state.log.push({ id: uid(), text: `🗡️ ${attacker.name} Kiếm Nguyền — tự nhận ${selfDmg} sát thương!`, kind: "damage" })
  }
  // soulDrain: steal ATK from target
  const soulDrain = attacker.itemPassives.find(ip => ip.kind === "soulDrain")
  if (soulDrain && dmg > 0 && target.stats.atk > 0) {
    const steal = Math.max(1, Math.round(target.stats.atk * soulDrain.stealPct))
    target.stats.atk = Math.max(0, target.stats.atk - steal)
    attacker.stats.atk += steal
    state.log.push({ id: uid(), text: `👻 ${attacker.name} Hút Linh Hồn! +${steal} ATK từ ${target.name}!`, kind: "status" })
  }
  // frenzySword: gain SPD on hit
  if (frenzyPassive) {
    attacker.stats.spd += frenzyPassive.spdPerHit
    state.log.push({ id: uid(), text: `⚔️ ${attacker.name} Cuồng Đao! +${frenzyPassive.spdPerHit} SPD (→${Math.round(attacker.stats.spd)})`, kind: "info" })
  }

  // Elemental/Demon passive burns
  const passive = PASSIVES[attacker.passiveId]
  if (passive?.signatureId === "elem-passive-burn" || passive?.signatureId === "demon-passive-burn") {
    const flatBurn = Math.max(1, Math.round(attacker.stats.mag * 0.18))
    applyStatus(target, { kind: "burn", value: flatBurn, turns: 2, name: "Bỏng Nhỏ" }, state.log)
  }
  applyOnHitProcs(attacker, target, state.log)
  if (dmg > 0) applyCounterstrike(attacker, target, dmg, state.log)
  if (dmg > 0) applyMirrorShield(attacker, target, dmg, state.log)
  if (dmg > 0) applyManaShield(target, dmg, state.log)

  // stormStrike: chain lightning to random other enemy
  const stormStrike = attacker.itemPassives.find(ip => ip.kind === "stormStrike")
  if (stormStrike && dmg > 0 && Math.random() < stormStrike.chainChance) {
    const others = state.units.filter(u => u.side === target.side && u.hp > 0 && u.uid !== target.uid)
    if (others.length > 0) {
      const chainTarget = others[Math.floor(Math.random() * others.length)]
      const chainDmg = Math.round(dmg * stormStrike.dmgDecay)
      chainTarget.hp = Math.max(0, chainTarget.hp - chainDmg)
      state.log.push({ id: uid(), text: `⚡ Sét Liên Hoàn nhảy sang ${chainTarget.name} — ${chainDmg} sát thương!`, kind: "damage" })
    }
  }

  // Extra hits from speed
  if (extraHits > 0 && target.hp > 0) {
    state.log.push({
      id: uid(),
      text: frenzyPassive
        ? `🌪️ ${attacker.name} Cuồng Đao — thêm ${extraHits} đòn vô hạn! (SPD: ${Math.round(effectiveSpd(attacker))})`
        : `💨 ${attacker.name} tốc độ cao — đánh thêm ${extraHits} đòn! (Tốc độ: ${Math.round(spd)})`,
      kind: "info",
    })
    for (let i = 0; i < extraHits; i++) {
      if (target.hp <= 0) break
      rollDamage(
        attacker, target,
        { scale: 0.70 * dmgScale, stat: attacker.role === "mage" ? "mag" : "atk", type: attacker.role === "mage" ? "magic" : "physical" },
        state.log, state,
      )
      applyOnHitProcs(attacker, target, state.log)
      // stormStrike also procs on extra hits
      if (stormStrike && Math.random() < stormStrike.chainChance) {
        const others = state.units.filter(u => u.side === target.side && u.hp > 0 && u.uid !== target.uid)
        if (others.length > 0) {
          const ct = others[Math.floor(Math.random() * others.length)]
          const cd = Math.round(dmg * 0.70 * stormStrike.dmgDecay)
          ct.hp = Math.max(0, ct.hp - cd)
          state.log.push({ id: uid(), text: `⚡ Sét nhảy sang ${ct.name} — ${cd}!`, kind: "damage" })
        }
      }
      // frenzySword: SPD on extra hits (half rate)
      if (frenzyPassive) attacker.stats.spd += Math.round(frenzyPassive.spdPerHit * 0.5)
    }
  }
}

export function canCastSkill(unit: BattleUnit, skillIndex: 0 | 1 | 2): { ok: boolean; reason?: string } {
  const skill = unit.skills[skillIndex]
  if (!skill) return { ok: false, reason: "Không có kỹ năng" }
  if (unit.cooldowns[skillIndex] > 0) return { ok: false, reason: `Còn ${unit.cooldowns[skillIndex]} lượt cooldown` }
  if (skill.ultimate && unit.energy < ULTIMATE_ENERGY_COST) {
    return { ok: false, reason: `Cần ${ULTIMATE_ENERGY_COST} năng lượng (${unit.energy})` }
  }
  return { ok: true }
}

export function performSkill(
  state: CombatState,
  caster: BattleUnit,
  skillIndex: 0 | 1 | 2,
  primaryTargetUid: string | null,
): void {
  const skill = caster.skills[skillIndex]
  if (!skill) return
  const can = canCastSkill(caster, skillIndex)
  if (!can.ok) return

  // Consume energy for ultimate
  if (skill.ultimate) {
    caster.energy = 0
    // Fire onUltimate blessing/pact hook
    fireHook("onUltimate", state, caster)
  }

  state.log.push({
    id: uid(),
    text: `★ ${caster.name} dùng [${skill.name}]`,
    kind: "info",
  })

  const enemies = alivesOf(state, caster.side === "player" ? "enemy" : "player")
  const allies = alivesOf(state, caster.side)
  let targets: BattleUnit[] = []
  switch (skill.targeting) {
    case "enemy":
      targets = primaryTargetUid
        ? state.units.filter((u) => u.uid === primaryTargetUid && u.hp > 0)
        : enemies.length ? [enemies[0]] : []
      break
    case "all-enemies":
      targets = enemies
      break
    case "self":
      targets = [caster]
      break
    case "ally":
      targets = primaryTargetUid
        ? state.units.filter((u) => u.uid === primaryTargetUid && u.hp > 0)
        : [caster]
      break
    case "all-allies":
      targets = allies
      break
  }

  // Skill level scales damage/heal by 1 + (lvl-1)*0.15
  // lv1=100%  lv2=115%  lv3=130%  lv4=145%  lv5=160%
  const sLvl = caster.skillLevels[skillIndex]
  const scaleMult = 1 + (sLvl - 1) * 0.15

  for (const ef of skill.effects) {
    if (ef.damage) {
      const hits = ef.damage.hits || 1
      for (let i = 0; i < hits; i++) {
        for (const t of targets) {
          if (t.hp <= 0) continue
          rollDamage(
            caster,
            t,
            { ...ef.damage, scale: ef.damage.scale * scaleMult },
            state.log,
            state,
          )
          // Item passive procs apply on skill hits too
          applyOnHitProcs(caster, t, state.log)
        }
      }
    }
    if (ef.heal) {
      // 🔧 FIX: Skills that target enemies (e.g. life-drain ultimates) should
      // always heal the CASTER, not the enemy targets.
      const healTargets =
        skill.targeting === "enemy" || skill.targeting === "all-enemies"
          ? [caster]
          : targets
      for (const t of healTargets) {
        healUnit(caster, t, { ...ef.heal, scale: ef.heal.scale * scaleMult }, state.log)
      }
    }
    if (ef.status) {
      const apply = ef.status.target || skill.targeting
      const statusTargets =
        apply === "self"
          ? [caster]
          : apply === "all-allies"
          ? allies
          : apply === "all-enemies"
          ? enemies
          : apply === "ally"
          ? targets
          : targets
      for (const t of statusTargets) {
        applyStatus(t, ef.status, state.log)
      }
    }
    if (ef.cooldownReductionAll) {
      for (const u of allies) {
        u.cooldowns = u.cooldowns.map((cd) => Math.max(0, cd - (ef.cooldownReductionAll || 0))) as [number, number, number]
      }
    }
  }

  caster.cooldowns[skillIndex] = skill.cooldown

  // Speed passive: reduce ALL own cooldowns after casting based on speed
  const cdReduction = spdCooldownReduction(effectiveSpd(caster))
  if (cdReduction > 0) {
    caster.cooldowns = caster.cooldowns.map((cd, i) =>
      i === skillIndex ? cd : Math.max(0, cd - cdReduction)
    ) as [number, number, number]
    state.log.push({
      id: uid(),
      text: `⚡ ${caster.name} tốc độ cao — giảm ${cdReduction} lượt cooldown kỹ năng!`,
      kind: "info",
    })
  }

  // timeWarp: reduce all teammates' cooldowns after any skill cast
  const timeWarp = caster.itemPassives.find(ip => ip.kind === "timeWarp")
  if (timeWarp) {
    const allies = state.units.filter(u => u.side === caster.side && u.hp > 0 && u.uid !== caster.uid)
    for (const ally of allies) {
      ally.cooldowns = ally.cooldowns.map(cd => Math.max(0, cd - timeWarp.cdFlatReduction)) as [number, number, number]
    }
    if (allies.length > 0) {
      state.log.push({ id: uid(), text: `⏳ ${caster.name} Bẻ Cong Thời Gian! Giảm ${timeWarp.cdFlatReduction} lượt CD cho đồng đội!`, kind: "info" })
    }
  }
}

export function consumePotionInCombat(
  state: CombatState,
  inventoryItemId: string,
  targetUid: string,
  inventory: GameState["inventory"],
): { ok: boolean; nextInventory: GameState["inventory"] } {
  const inv = inventory.find((i) => i.uid === inventoryItemId)
  if (!inv) return { ok: false, nextInventory: inventory }
  const item = ITEMS_BY_ID[inv.itemId]
  if (!item || item.kind !== "potion") return { ok: false, nextInventory: inventory }
  const target = state.units.find((u) => u.uid === targetUid)
  if (!target || target.hp <= 0) return { ok: false, nextInventory: inventory }
  const p = item.potion
  if (!p) return { ok: false, nextInventory: inventory }
  if (p.healPct) {
    const heal = Math.round(target.hpMax * p.healPct)
    target.hp = Math.min(target.hpMax, target.hp + heal)
    state.log.push({ id: uid(), text: `${target.name} dùng ${item.name}, hồi ${heal} HP`, kind: "heal" })
  }
  if (p.heal) {
    target.hp = Math.min(target.hpMax, target.hp + p.heal)
    state.log.push({ id: uid(), text: `${target.name} dùng ${item.name}, hồi ${p.heal} HP`, kind: "heal" })
  }
  if (p.energy) {
    target.energy = Math.min(target.energyMax, target.energy + p.energy)
    state.log.push({ id: uid(), text: `${target.name} hồi ${p.energy} năng lượng`, kind: "heal" })
  }
  if (p.cleanse) {
    target.statuses = target.statuses.filter(
      (s) => !["burn", "poison", "bleed", "stun", "atkDown", "defDown", "spdDown"].includes(s.kind),
    )
    state.log.push({ id: uid(), text: `${target.name} được thanh tẩy hiệu ứng xấu`, kind: "status" })
  }
  if (p.buff) {
    applyStatus(target, p.buff, state.log)
  }
  // Decrement
  const nextInv = inventory.map((i) =>
    i.uid === inv.uid ? { ...i, quantity: i.quantity - 1 } : i,
  ).filter((i) => i.quantity > 0)
  return { ok: true, nextInventory: nextInv }
}

// ============================================================
// Status processing per turn
// ============================================================

export function processEndOfTurn(state: CombatState, unit: BattleUnit) {
  // ══ DoT — 3 cơ chế khác nhau ══
  const poisonStacks = unit.statuses.filter(s => s.kind === "poison").length
  for (const st of unit.statuses) {

    // 🔥 BỎNG — pháp thuật, giảm bởi RES 50%, mạnh hơn khi HP cao
    //   Không stack · Tối đa 2 lượt · Giảm heal nhận -40% (xử lý ở healUnit)
    if (st.kind === "burn") {
      const res = Math.max(0, unit.stats.res)
      const resReduction = 100 / (100 + res * 0.5)
      const hpBonus = 1 + Math.min(0.20, (unit.hp / unit.hpMax) * 0.20)
      const dmg = Math.max(1, Math.round(st.value * resReduction * hpBonus))
      unit.hp = Math.max(0, unit.hp - dmg)
      state.log.push({ id: uid(), text: `🔥 ${unit.name} mất ${dmg} (Bỏng — pháp${hpBonus > 1.05 ? ", HP cao→mạnh hơn" : ""})`, kind: "damage" })
    }

    // 🩸 CHẢY MÁU — vật lý thuần, xuyên giáp, leo thang +25%/lượt
    //   Không stack · Đánh lại → refresh turns (duy trì vết thương)
    else if (st.kind === "bleed") {
      const ticks = (st as any).__ticks ?? 0
      ;(st as any).__ticks = ticks + 1
      const escalation = 1 + ticks * 0.25
      const dmg = Math.max(1, Math.round(st.value * escalation))
      unit.hp = Math.max(0, unit.hp - dmg)
      state.log.push({ id: uid(), text: `🩸 ${unit.name} mất ${dmg} (Chảy máu +${Math.round(ticks * 25)}% — xuyên giáp)`, kind: "damage" })
    }

    // ☠️ ĐỘC — true dmg, cộng dồn stack (×10 tối đa), value mỗi stack = ½ gốc
    else if (st.kind === "poison") {
      const stackMult = Math.min(10, 1 + (poisonStacks - 1) * 0.30)
      const dmg = Math.max(1, Math.round(st.value * stackMult))
      unit.hp = Math.max(0, unit.hp - dmg)
      state.log.push({ id: uid(), text: `☠️ ${unit.name} mất ${dmg} (Độc×${poisonStacks}${poisonStacks > 1 ? ` ×${stackMult.toFixed(1)}` : ""} — thật)`, kind: "damage" })
    }

    if (st.kind === "regen") {
      const heal = Math.round(unit.hpMax * st.value)
      unit.hp = Math.min(unit.hpMax, unit.hp + heal)
      state.log.push({ id: uid(), text: `💚 ${unit.name} hồi ${heal} HP (${st.name})`, kind: "heal" })
    }
  }

  // Storm / Wind-Rider passive: per-turn SPD growth
  if (unit.hp > 0) {
    const passive = PASSIVES[unit.passiveId]
    if (passive?.signatureId === "wind-rider" || passive?.signatureId === "storm-chaser") {
      const stackKey = "__storm_spd"
      const existingStack = unit.statuses.find((s) => s.name === stackKey)
      const maxStacks = passive.signatureId === "storm-chaser" ? 15 : 10
      const growthPct = passive.signatureId === "storm-chaser" ? 0.05 : 0.03
      const currentStacks = existingStack ? existingStack.value : 0
      if (currentStacks < maxStacks) {
        const gain = Math.round(unit.stats.spd * growthPct)
        unit.stats.spd += gain
        if (existingStack) {
          existingStack.value = currentStacks + 1
        } else {
          unit.statuses.push({ id: uid(), kind: "spdUp" as const, value: 1, turns: 9999, name: stackKey })
        }
      }
    }

    // Mirror-Soul passive: track EVA stacks for energy on dodge (handled in rollDamage via eva check)
    // Plague synergy: spread poison/burn to random enemy each turn
    const plagueUnits = state.units.filter((u) => u.side === unit.side && u.hp > 0 && (u.origins as string[]).includes("plague"))
    if (plagueUnits.length >= 2) {
      const enemies = state.units.filter((u) => u.side !== unit.side && u.hp > 0)
      if (enemies.length > 0 && plagueUnits[0]?.uid === unit.uid) {
        const dotsToSpread = ["poison" as const, "burn" as const]
        for (const dotKind of dotsToSpread) {
          const sourceStatus = plagueUnits.flatMap(u => u.statuses).find(s => s.kind === dotKind)
          if (sourceStatus) {
            const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)]
            if (!randomEnemy.statuses.some(s => s.kind === dotKind)) {
              randomEnemy.statuses.push({ ...sourceStatus, id: uid(), turns: Math.max(1, sourceStatus.turns) })
              state.log.push({ id: uid(), text: `🦠 Dịch lan! ${randomEnemy.name} bị nhiễm ${sourceStatus.name}`, kind: "status" })
            }
          }
        }
      }
    }
  }

  // Item passive regen + scalingPerTurn
  if (unit.hp > 0) {
    for (const ip of unit.itemPassives) {
      if (ip.kind === "regen") {
        const heal = Math.round(unit.hpMax * ip.pct)
        unit.hp = Math.min(unit.hpMax, unit.hp + heal)
      }
      if (ip.kind === "scalingPerTurn") {
        // Apply per-turn stat growth (tracked via a pseudo-status with value as stacks)
        const existingStack = unit.statuses.find((s) => s.kind === "atkUp" && s.name === "__scaling_" + ip.stat)
        const currentStacks = existingStack ? existingStack.value : 0
        if (currentStacks < ip.maxStacks) {
          unit.stats[ip.stat] = (unit.stats[ip.stat] || 0) + ip.amountPerTurn
          // Track stacks via a hidden status
          if (existingStack) {
            existingStack.value = currentStacks + 1
          } else {
            unit.statuses.push({ id: uid(), kind: "atkUp" as const, value: 1, turns: 9999, name: "__scaling_" + ip.stat })
          }
        }
      }
    }
  }
  // ── New unique passive: bloodPact HP drain + stack accumulation ──────
  if (unit.hp > 0) {
    const bloodPact = unit.itemPassives.find(ip => ip.kind === "bloodPact")
    if (bloodPact) {
      const drain = Math.max(1, Math.round(unit.hpMax * bloodPact.hpCostPct))
      unit.hp = Math.max(1, unit.hp - drain)
      const stackSt = unit.statuses.find(s => s.name === "__bloodpact_stacks")
      if (stackSt) {
        if (stackSt.value < 3) {
          stackSt.value += 1
          state.log.push({ id: uid(), text: `🩸 ${unit.name} Giao Ước Máu! -${drain} HP, ×${(1 + stackSt.value * bloodPact.dmgBonus).toFixed(2)} sát thương (${stackSt.value}/3)`, kind: "status" })
        } else {
          state.log.push({ id: uid(), text: `🩸 ${unit.name} Giao Ước Máu! -${drain} HP (tối đa ×${(1 + 3 * bloodPact.dmgBonus).toFixed(2)})`, kind: "status" })
        }
      } else {
        unit.statuses.push({ id: uid(), kind: "atkUp" as const, value: 1, turns: 9999, name: "__bloodpact_stacks" })
        state.log.push({ id: uid(), text: `🩸 ${unit.name} Giao Ước Máu! -${drain} HP, ×${(1 + bloodPact.dmgBonus).toFixed(2)} sát thương (1/3)`, kind: "status" })
      }
    }

    // ── autoUlt: fire ult automatically when energy is full ──────────
    const autoUltPassive = unit.itemPassives.find(ip => ip.kind === "autoUlt")
    if (autoUltPassive && unit.energy >= ULTIMATE_ENERGY_COST) {
      const ultSkill = unit.skills[2]
      if (ultSkill?.ultimate && unit.cooldowns[2] === 0) {
        const enemies = state.units.filter(u => u.side !== unit.side && u.hp > 0)
        const allies = state.units.filter(u => u.side === unit.side && u.hp > 0)
        if (enemies.length > 0) {
          state.log.push({ id: uid(), text: `✨ ${unit.name} Tự Động Ulti! (${ultSkill.name})`, kind: "system" })
          unit.energy = 0
          unit.cooldowns[2] = ultSkill.cooldown
          const sLvl = (unit as any).skillLevels?.[2] ?? 1
          const scaleMult = 1 + (sLvl - 1) * 0.15
          const randEnemy = enemies[Math.floor(Math.random() * enemies.length)]
          for (const ef of ultSkill.effects) {
            const targets = ef.apply === "all-enemies" ? enemies
              : ef.apply === "all-allies" ? allies
              : [randEnemy]
            for (const t of targets) {
              if (t.hp <= 0) continue
              if (ef.damage) rollDamage(unit, t, { ...ef.damage, scale: ef.damage.scale * scaleMult }, state.log, state)
              if (ef.heal) healUnit(unit, t, { ...ef.heal, scale: ef.heal.scale * scaleMult }, state.log)
              if (ef.status?.kind) applyStatus(t, ef.status, state.log)
            }
          }
        }
      }
    }
  }

  // Tick down statuses (skip already-zero turns set by exhausted shields)
  unit.statuses = unit.statuses
    .map((s) => ({ ...s, turns: s.turns - 1 }))
    .filter((s) => s.turns > 0 && (s.kind !== "shield" || s.value > 0))
  // Cooldowns
  unit.cooldowns = unit.cooldowns.map((cd) => Math.max(0, cd - 1)) as [number, number, number]
  // Fire onTurnEnd blessing/pact hook
  fireHook("onTurnEnd", state, unit)
  // Keep log bounded
  trimLog(state.log)
}

// Called at the start of a unit's own turn — gives them energy
export function onUnitTurnStart(unit: BattleUnit, state?: CombatState) {
  // Reset shield-block flag mỗi lượt
  ;(unit as any).__shieldUsedThisTurn = false
  let gain = ENERGY_TURN_GAIN
  for (const ip of unit.itemPassives) {
    if (ip.kind === "manaRegen") gain += ip.amount
    if (ip.kind === "autoUlt") gain += ip.energyPerTurn
  }
  unit.energy = Math.min(unit.energyMax, unit.energy + gain)
  // Fire blessing/pact onTurnStart hook
  if (state) fireHook("onTurnStart", state, unit)
}

// ============================================================
// Win check
// ============================================================

export function checkEnded(state: CombatState): "victory" | "defeat" | null {
  // Single pass — avoid two separate filter calls
  let hasEnemy = false; let hasPlayer = false
  for (const u of state.units) {
    if (u.hp <= 0) continue
    if (u.side === "enemy") hasEnemy = true
    else hasPlayer = true
    if (hasEnemy && hasPlayer) return null // both sides alive, early exit
  }
  // FIX: Must check both conditions before returning null
  if (!hasEnemy && !hasPlayer) return "defeat" // edge case
  if (!hasEnemy) return "victory"
  if (!hasPlayer) return "defeat"
  return null
}

// ============================================================
// Rewards
// ============================================================

export function computeRewards(stage: number) {
  const gold = 80 + stage * 35 + Math.floor(Math.random() * (stage * 12 + 30))
  const gems = stage % 3 === 0 ? 5 + Math.floor(stage / 3) : Math.random() < 0.4 ? 2 : 0
  const xp = 40 + stage * 18
  // Item drop chance 35%
  const items: { itemId: string; quantity: number }[] = []
  if (Math.random() < 0.35) {
    // Pick a random rarity-weighted potion or material item
    const pool = ["p_minor", "p_minor", "p_medium", "p_haste", "p_rage"]
    if (stage > 5) pool.push("p_major")
    if (stage > 10) pool.push("p_elixir")
    items.push({ itemId: pickRandom(pool), quantity: 1 })
  }
  return { gold, gems, xp, items }
}

// ============================================================
// AI controller — picks an action for an enemy/AI unit
// ============================================================

export type AIAction =
  | { kind: "skill"; skillIndex: 0 | 1 | 2; targetUid: string | null }
  | { kind: "basic"; targetUid: string }

// ============================================================
// Row-based targeting helpers
// ============================================================

/** Lấy tất cả unit sống còn của 1 bên theo hàng */
function aliveByRow(units: BattleUnit[], side: BattleSide, row: BattleRow): BattleUnit[] {
  return units.filter(u => u.hp > 0 && u.side === side && u.row === row)
}

/**
 * AI chọn mục tiêu dựa trên hàng trận và role:
 * - tank/defender: chỉ đánh hàng trước
 * - assassin (physical/magic): ưu tiên hàng sau 70%
 * - support: 50/50
 * - còn lại (marksman, mage, fighter...): ưu tiên hàng trước 70%
 */
export function pickRowTarget(
  units: BattleUnit[],
  attacker: BattleUnit,
  oppSide: BattleSide,
  preferredUid?: string | null,
): BattleUnit | null {
  const front = aliveByRow(units, oppSide, "front")
  const back  = aliveByRow(units, oppSide, "back")
  const all   = [...front, ...back]
  if (all.length === 0) return null

  const role = attacker.role

  // Tank/defender: chỉ đánh hàng trước, nếu không có thì đánh hàng sau
  if (role === "tank" || role === "defender") {
    return pickBestTarget(front.length > 0 ? front : back)
  }

  // Support: 50/50
  if (role === "support") {
    const row = Math.random() < 0.5 ? front : back
    return pickBestTarget(row.length > 0 ? row : all)
  }

  // Assassin: 70% hàng sau, 30% hàng trước
  if (role === "assassin") {
    const rollBack = Math.random() < 0.7
    if (rollBack && back.length > 0) return pickBestTarget(back)
    return pickBestTarget(front.length > 0 ? front : back)
  }

  // Default (marksman, mage, fighter): 70% hàng trước, 30% hàng sau
  const rollFront = Math.random() < 0.7
  if (rollFront && front.length > 0) return pickBestTarget(front)
  return pickBestTarget(back.length > 0 ? back : front)
}

/** Chọn target tốt nhất trong pool: ưu tiên HP thấp nhất */
function pickBestTarget(pool: BattleUnit[]): BattleUnit | null {
  if (pool.length === 0) return null
  return pool.reduce((best, u) => (u.hp / u.hpMax < best.hp / best.hpMax ? u : best))
}

/**
 * Kiểm tra intercept khi người chơi tấn công hàng sau kẻ địch:
 * 15% xác suất 1 unit hàng trước kẻ địch đỡ đòn thay.
 * Trả về uid thực sự nhận damage.
 */
export function resolvePlayerTarget(
  targetUid: string,
  attackerRole: BattleUnit["role"],
  units: BattleUnit[],
): string {
  // Assassin và support: đánh chính xác 100%
  if (attackerRole === "assassin" || attackerRole === "support") return targetUid

  const target = units.find(u => u.uid === targetUid)
  if (!target) return targetUid

  // Nếu đánh hàng trước: không bao giờ bị intercept
  if (target.row === "front") return targetUid

  // Đánh hàng sau: 15% hàng trước đỡ đòn
  if (Math.random() < 0.15) {
    const frontUnits = units.filter(u => u.hp > 0 && u.side === target.side && u.row === "front")
    if (frontUnits.length > 0) {
      const interceptor = frontUnits[Math.floor(Math.random() * frontUnits.length)]
      return interceptor.uid
    }
  }
  return targetUid
}

export function aiChooseAction(state: CombatState, unit: BattleUnit): AIAction {
  // ── Fast path: pre-filter alive units once ───────────────────────────────
  const oppSide: BattleSide = unit.side === "player" ? "enemy" : "player"
  let lowestAlly: BattleUnit | null = null
  let lowestAllyPct = 1
  let anyAllyLow = false; let anyAllyHurt = false
  let enemyCount = 0

  for (const u of state.units) {
    if (u.hp <= 0) continue
    if (u.side === oppSide) {
      enemyCount++
    } else {
      const pct = u.hp / u.hpMax
      if (pct < lowestAllyPct) { lowestAlly = u; lowestAllyPct = pct }
      if (pct < 0.4) anyAllyLow = true
      if (pct < 0.7) anyAllyHurt = true
    }
  }

  // Row-based target selection (AI side)
  const targetEnemy = pickRowTarget(state.units, unit, oppSide)
  if (!targetEnemy) return { kind: "basic", targetUid: "" }

  // ── Skill priority: ult (2) > skill1 (1) > skill0 (0) ───────────────────
  for (let i = 2; i >= 0; i--) {
    const skill = unit.skills[i]
    if (!skill || unit.cooldowns[i] > 0) continue
    if (skill.ultimate && unit.energy < ULTIMATE_ENERGY_COST) continue

    let hasHeal = false; let hasDmg = false
    for (const e of skill.effects) {
      if (e.heal) hasHeal = true
      if (e.damage) hasDmg = true
    }

    if (hasHeal && !hasDmg) {
      if (!(skill.targeting === "all-allies" ? anyAllyHurt : anyAllyLow)) continue
    }
    if (hasDmg && enemyCount === 0) continue

    // Don't waste AoE on single target if single-target skill is available
    if (skill.targeting === "all-enemies" && enemyCount < 2 && i < 2) {
      let hasSingle = false
      for (let j = 0; j < unit.skills.length; j++) {
        const sk = unit.skills[j]
        if (sk && j !== i && unit.cooldowns[j] === 0 && sk.targeting === "enemy") { hasSingle = true; break }
      }
      if (hasSingle) continue
    }

    const targetUid =
      skill.targeting === "ally" ? (lowestAlly?.uid ?? null) :
      skill.targeting === "enemy" ? targetEnemy.uid :
      null

    return { kind: "skill", skillIndex: i as 0 | 1 | 2, targetUid }
  }

  return { kind: "basic", targetUid: targetEnemy.uid }
}

// ============================================================
// Combo check (skill tree)
// ============================================================

export function canCombineSkills(
  skillId: string,
  knownSkills: Set<string>,
): boolean {
  const skill = SKILLS[skillId]
  if (!skill) return false
  if (!skill.comboRequires?.length) return true
  return skill.comboRequires.every((r) => knownSkills.has(r))
}

export { uid as _uid }
