// ============================================================
// Core game type definitions
// ============================================================

export type Rarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "celestial"
  | "transcendent"
  | "divine"
  | "primordial"

export type StatKey =
  | "hp"
  | "atk" // physical attack
  | "mag" // magic power
  | "def" // physical defense
  | "res" // magic resistance
  | "spd" // speed (turn order + attack speed)
  | "crit" // crit chance %
  | "critDmg" // crit damage multiplier %
  | "acc" // accuracy %
  | "eva" // evasion %
  | "lifesteal" // %

export type Stats = Record<StatKey, number>

export type Range = "melee" | "ranged"

export type DamageType = "physical" | "magic" | "true"

export type Role =
  | "warrior"
  | "assassin"
  | "mage"
  | "marksman"
  | "tank"
  | "support"

export type Origin =
  | "human"
  | "beastkin"
  | "cyber"
  | "ancient"
  | "elemental"
  | "undead"
  | "dragon"
  | "demon"
  | "celestial"
  | "outlaw"
  | "phantom"
  | "plague"
  | "storm"

export type Trait = Role | Origin

export type SkillTargeting = "enemy" | "all-enemies" | "self" | "ally" | "all-allies"

export type StatusEffect = {
  id: string
  name: string
  kind:
    | "burn" // dmg over time (magic)
    | "poison" // dmg over time (true)
    | "bleed" // dmg over time (physical)
    | "stun" // skip turn
    | "shield" // absorbs dmg
    | "atkUp"
    | "atkDown"
    | "defUp"
    | "defDown"
    | "spdUp"
    | "spdDown"
    | "regen"
  value: number // amount/percent
  turns: number
}

export type SkillEffect = {
  // Damage component (optional)
  damage?: {
    scale: number // multiplier of stat
    stat: "atk" | "mag" | "hp"
    type: DamageType
    hits?: number
  }
  // Healing
  heal?: { scale: number; stat: "atk" | "mag" | "hp" }
  // Apply status to target (or self)
  status?: Omit<StatusEffect, "id"> & { target?: SkillTargeting }
  // Energy gain (for fun)
  cooldownReductionAll?: number
}

// Condition to unlock a bonus skill slot on a hero
export type SkillUnlockCondition =
  | { type: "twoSkillsMaxLevel" }                    // Any 2 skills at lv5
  | { type: "heroLevel"; level: number }              // Hero reaches level N
  | { type: "allSkillsLevel"; level: number }         // All 3 skills at level N
  | { type: "battlesWon"; count: number }             // X battles won (game-wide)
  | { type: "skillCombo"; skillIds: string[] }        // Specific skills at lv >= 3

export type Skill = {
  id: string
  name: string
  description: string
  cooldown: number // turns
  targeting: SkillTargeting
  effects: SkillEffect[]
  ultimate?: boolean
  // For combo: required skills (by id) that must be already learned to learn this
  comboRequires?: string[]
  // Tag used in skill tree dependencies
  tier?: 1 | 2 | 3
  // Evolution: skill evolves when reaching max level (5)
  evolvesTo?: string
  // Special skill marker
  special?: boolean
  // If set, this skill slot is locked until condition met
  unlockCondition?: SkillUnlockCondition
}

export type Passive = {
  id: string
  name: string
  description: string
  // Applied at start of battle
  modifier?: Partial<Stats>
  // Bonus described in text only (engine handles by id)
  signatureId?: string
}

export type HeroTemplate = {
  id: string
  name: string
  title: string
  rarity: Rarity
  range: Range
  role: Role
  origins: Origin[] // 0..2 origins (plus role gives 1..3 traits)
  baseStats: Stats
  growth: Partial<Stats> // per level
  skills: [string, string, string] // ids in skills DB; index 2 is ultimate
  bonusSkills?: { skillId: string; unlockCondition: SkillUnlockCondition }[] // Extra unlockable skills
  passive: string // id
  build: "tank" | "attack-speed" | "carry" | "burst" | "bruiser" | "support"
  flavor: string
}

export type OwnedHero = {
  uid: string
  templateId: string
  level: number
  xp: number
  // Skill levels (1-5 per skill)
  skillLevels: [number, number, number]
  // Unlocked extra skills (4th, 5th slot via conditions)
  unlockedSkills?: string[]
  // Equipped skill loadout: 3 skill IDs the hero uses in combat.
  // If undefined, falls back to tpl.skills (default). Index 2 = ultimate slot.
  equippedSkillIds?: [string, string, string]
  // Skill levels for bonus/extra skills (keyed by skillId)
  bonusSkillLevels?: Record<string, number>
  // Equipped item uids by slot
  equipment: Partial<Record<EquipSlot, string>>
  // Blessing or Pact innate (id from blessings.ts)
  blessingPactId?: string
}

// ============================================================
// Items
// ============================================================

export type EquipSlot = "weapon" | "armor" | "trinket"

export type ItemKind = "equip" | "potion" | "artifact" | "material"

export type ItemPassive =
  | {
      kind: "onHit"
      status: "burn" | "poison" | "bleed" | "stun" | "defDown" | "atkDown" | "spdDown"
      chance: number // 0..1
      value: number
      turns: number
      name: string
      description: string
    }
  | { kind: "thorns"; pct: number; description: string }
  | { kind: "regen"; pct: number; description: string }
  | { kind: "execute"; threshold: number; bonus: number; description: string }
  | { kind: "battleStart"; effect: "shield" | "regen" | "atkUp" | "defUp"; value: number; turns: number; description: string }
  | { kind: "manaRegen"; amount: number; description: string }
  | { kind: "potionRestore"; energy?: number; healPct?: number; description: string }
  | { kind: "armorBreak"; pct: number; chance: number; description: string }
  | { kind: "counterstrike"; pct: number; chance: number; description: string }
  | { kind: "scalingPerTurn"; stat: "atk" | "mag" | "def" | "spd" | "crit"; amountPerTurn: number; maxStacks: number; description: string }
  | { kind: "lifeLink"; pct: number; description: string }
  | { kind: "mirrorShield"; reflectMag: number; reflectPhys: number; description: string }  // reflects both dmg types %
  | { kind: "bounty"; goldPerKill: number; statBonus: "atk" | "mag" | "spd" | "crit"; bonusPerKill: number; description: string } // snowball: gold+stat per kill
  | { kind: "manaShield"; dmgToEnergy: number; maxPct: number; description: string } // converts % dmg to energy instead
  | { kind: "chainLightning"; targets: number; dmgPct: number; stunChance: number; description: string }
  // ── New unique passives ────────────────────────────────────────────────
  | { kind: "autoUlt"; energyPerTurn: number; description: string }
  | { kind: "frenzySword"; spdPerHit: number; description: string }
  | { kind: "soulDrain"; stealPct: number; description: string }
  | { kind: "deathMark"; threshold: number; dmgAmp: number; description: string }
  | { kind: "stormStrike"; chainChance: number; dmgDecay: number; description: string }
  | { kind: "bloodPact"; hpCostPct: number; dmgBonus: number; description: string }
  | { kind: "timeWarp"; cdFlatReduction: number; description: string }
  | { kind: "cursedBlade"; selfDmgPct: number; dmgMult: number; description: string }
  | { kind: "phoenixCore"; revivePct: number; description: string }

// Random innate bonus for purple+ gear
export type ItemInnate = {
  stat: StatKey
  value: number
  label: string
}

export type ItemTemplate = {
  id: string
  name: string
  kind: ItemKind
  rarity: Rarity
  slot?: EquipSlot
  stats?: Partial<Stats>
  // For potions
  potion?: {
    heal?: number // flat
    healPct?: number // % of max hp
    energy?: number // restore energy
    cleanse?: boolean
    buff?: Omit<StatusEffect, "id">
  }
  // Equipment passive ability
  passive?: ItemPassive
  // Random innate (rolled when stocked in shop)
  innate?: ItemInnate
  description: string
  basePrice: number
}

export type InventoryItem = {
  uid: string
  itemId: string
  quantity: number
  innate?: ItemInnate // preserved innate from shop
}

// ============================================================
// Combat
// ============================================================

export type BattleSide = "player" | "enemy"

/** Hàng trận: front = hàng trước, back = hàng sau */
export type BattleRow = "front" | "back"

export type BattleUnit = {
  uid: string
  side: BattleSide
  row: BattleRow
  templateId: string
  name: string
  rarity: Rarity
  range: Range
  role: Role
  origins: Origin[]
  level: number
  hpMax: number
  hp: number
  energy: number // 0..energyMax. Used to gate ultimate (skill index 2)
  energyMax: number
  stats: Stats
  skills: Skill[]
  skillLevels: [number, number, number]
  passiveId: string
  cooldowns: [number, number, number] // current cooldown (0 = ready)
  statuses: StatusEffect[]
  build: HeroTemplate["build"]
  // Synergy bonuses applied
  synergyText: string[]
  // Passives from equipped items
  itemPassives: ItemPassive[]
  // Equipped item ids (for display)
  equipment: Partial<Record<"weapon" | "armor" | "trinket", string>>
  // Blessing or Pact innate id
  blessingPactId?: string
  // Track one-shot triggers
  lowHpTriggered?: boolean
}

export type CombatActionKind = "skill" | "potion" | "flee" | "basic"

export type CombatLogEntry = {
  id: string
  text: string
  kind?: "info" | "damage" | "heal" | "status" | "system" | "victory" | "defeat"
}

export type CombatState = {
  stage: number
  turn: number
  units: BattleUnit[]
  order: string[] // unit uids sorted by speed for current round
  activeUnitIndex: number
  round: number
  log: CombatLogEntry[]
  ended: "victory" | "defeat" | "fled" | null
  rewards?: {
    gold: number
    gems: number
    xp: number
    items: { itemId: string; quantity: number }[]
  }
  awaitingPlayerInput: boolean
  watchMode: boolean // true = AI controls player side too (spectate mode)
}

// ============================================================
// Player + Save
// ============================================================

export type PlayerStats = {
  attackBonus: number
  defenseBonus: number
  hpBonus: number
  magicBonus: number
  speedBonus: number
  critBonus: number
}

export type PlayerSkillTree = {
  // Skill node ids -> levels
  nodes: Record<string, number>
}

export type GameState = {
  // Currencies
  gold: number
  gems: number
  blessingShards: number
  pactShards: number
  // Account
  level: number
  xp: number
  statPoints: number
  skillPoints: number
  playerStats: PlayerStats
  skillTree: PlayerSkillTree
  // Heroes & Items
  heroes: OwnedHero[]
  inventory: InventoryItem[]
  team: (string | null)[] // length 6; uids of OwnedHero; slot 6 mở khóa khi clearedStage >= 15
  /** Hàng trận cho từng slot: "front" | "back". Tướng melee bắt buộc hàng trước. */
  teamRows: BattleRow[]
  // Progress
  highestStage: number   // highest stage ever reached (currentStage + 1 after win)
  currentStage: number
  clearedStage: number   // highest stage manually cleared (watch mode unlocks up to this)
  // Logs
  notifications: string[]
  // Combat
  combat: CombatState | null
  // Stats
  totalRolls: number
  totalDigs: number
  battlesWon: number
  // Raid boss daily limit (5 raids per "day" = 5 combat battles)
  raidBattlesUsed: number   // how many raid attempts used in current day
  raidResetAtBattle: number // battlesWon value when next raid day resets
  // Infinite Tower
  towerState: TowerRunState | null  // null = not in a run
  towerRecord: number               // highest floor ever reached
  towerClaimedMilestones: number[]  // floors that have already been claimed (10, 20, 30...)
  // Quests
  questState: import("./quests").QuestState
  // Shop restock
  shopStock: ShopStock
  // Premium shop (unlocks at level 50)
  premiumShopStock?: PremiumShopStock
  // Daily Events
  activeEvents: ActiveEvent[]
  currentDay: number  // day counter (1-indexed, increases every 5 battles)
  // Luck buff from potions
  luckBuff: {
    tier: 1 | 2 | 3   // 1=small(+25%), 2=medium(+50%), 3=large(+75%)
    rollsLeft: number  // decrements on each roll (hero gacha + blessing/pact); expires at 0
  } | null
  // Auto-sell: rarities to instantly sell when a new hero is rolled
  autoSellRarities: Rarity[]
}

// ============================================================
// Daily Events
// ============================================================

export type GameEventId =
  | "blood_moon"      // Đêm Trăng Máu: kẻ địch +25% def, hp, damage
  | "war_economy"     // Chiến tranh Mỹ-Iran: giá cả +25%, tiền phạt thua +25%
  | "black_market"    // Chợ Đen: chưa có hàng, cập nhật sau

export type GameEvent = {
  id: GameEventId
  name: string
  description: string
  icon: string
  rarity: "uncommon" | "rare" | "epic"
}

export type ActiveEvent = {
  eventId: GameEventId
  dayRolled: number   // ngày nào roll được
}

export type ShopKind = "weapon" | "armor" | "trinket" | "potion"

export type ShopStockItem = {
  itemId: string
  stock: number
  innate?: ItemInnate // rolled innate for purple+ items
}

export type ShopStock = Record<
  ShopKind,
  {
    items: ShopStockItem[]
    refreshedAt: number // ms timestamp
    dayNumber: number // which shop day (1 day = 5 battles)
  }
>

export type PremiumShopStock = {
  items: ShopStockItem[]
  refreshedAt: number
  dayNumber: number
}


export type SynergyTier = {
  count: number
  description: string
  modifiers: Partial<Stats>
  // Optional: signature bonus id processed by engine (e.g., "thorns", "execute")
  bonusId?: string
}

export type SynergyDefinition = {
  trait: Trait
  name: string
  description: string
  tiers: SynergyTier[]
}

// ============================================================
// Infinite Tower
// ============================================================

export type TowerPostVictoryChoice = "choose_hero" | "confirm_continue" | null

export type TowerRunState = {
  floor: number             // current floor being fought (1-indexed)
  // Snapshot of team HP % after each battle (used to apply 30% heal)
  pendingHeal: boolean      // true = waiting for post-victory heal+swap UI
  // Which hero uid from bench the player wants to swap in (optional)
  pendingSwapHeroUid: string | null
  // Which slot in team they're swapping into
  pendingSwapSlot: number | null
  // Post-victory step: "choose_hero" | "confirm_continue" | null
  postVictoryStep: TowerPostVictoryChoice
}
