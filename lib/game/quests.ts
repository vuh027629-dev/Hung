// ============================================================
// Quest System — Fully Random Generation
// ============================================================

import type { GameState, Rarity, Role, Origin } from "./types"
import { RARITY_LABEL, RARITY_ORDER, rarityRank } from "./rarity"
import { HEROES_BY_ID } from "./heroes"

// ============================================================
// Types
// ============================================================

export type QuestDifficulty = "easy" | "normal" | "hard" | "extreme" | "legendary"

export type QuestReward = {
  gold?: number
  gems?: number
  items?: { itemId: string; quantity: number }[]
  heroRarity?: Rarity // guaranteed hero pull of this rarity+
}

export type QuestObjective =
  | { type: "kill_total"; count: number; current: number }
  | { type: "kill_streak"; count: number; current: number } // N battles without flee
  | { type: "kill_monster_rarity"; rarity: Rarity; count: number; current: number }
  | { type: "reach_stage"; stage: number; current: number }
  | { type: "win_no_deaths"; count: number; current: number } // win N battles with no hero dead
  | { type: "own_hero_rarity"; rarity: Rarity; count: number }
  | { type: "own_hero_role"; role: Role; count: number }
  | { type: "own_hero_origin"; origin: Origin; count: number }
  | { type: "collect_gold"; amount: number; current: number }
  | { type: "level_hero"; level: number; heroId?: string } // level any hero to X
  | { type: "win_consecutive"; count: number; current: number }
  | { type: "recruit_total"; count: number; current: number }
  | { type: "spend_gems"; amount: number; current: number }
  | { type: "tower_reach_floor"; floor: number; current: number }
  | { type: "tower_clear_floors"; count: number; current: number }
  | { type: "raid_participate"; count: number; current: number }

export type Quest = {
  id: string
  title: string
  description: string
  difficulty: QuestDifficulty
  objective: QuestObjective
  reward: QuestReward
  expiresAt?: number // ms timestamp, undefined = permanent
  completed: boolean
  claimedAt?: number
}

export type QuestState = {
  active: Quest[]
  completed: Quest[]
  lastRefreshed: number
  // Tracking
  killStreak: number      // current kill streak (resets on flee)
  noDeathStreak: number   // current no-death win streak
  consecutiveWins: number // consecutive wins
}

// ============================================================
// Difficulty config
// ============================================================

const DIFFICULTY_LABEL: Record<QuestDifficulty, string> = {
  easy: "Dễ",
  normal: "Thường",
  hard: "Khó",
  extreme: "Cực Khó",
  legendary: "Huyền Thoại",
}

const DIFFICULTY_COLOR: Record<QuestDifficulty, string> = {
  easy: "text-green-400",
  normal: "text-blue-400",
  hard: "text-orange-400",
  extreme: "text-red-500",
  legendary: "text-rarity-legendary",
}

const DIFFICULTY_BADGE: Record<QuestDifficulty, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/40",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  hard: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  extreme: "bg-red-500/20 text-red-400 border-red-500/40",
  legendary: "bg-rarity-legendary/20 text-rarity-legendary border-rarity-legendary/50",
}

export { DIFFICULTY_LABEL, DIFFICULTY_COLOR, DIFFICULTY_BADGE }

// ============================================================
// Random quest generator
// ============================================================

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const ORIGINS: Origin[] = [
  "human", "beastkin", "cyber", "ancient", "elemental",
  "undead", "dragon", "demon", "celestial", "outlaw", "phantom", "plague", "storm",
]

const ROLES: Role[] = ["warrior", "assassin", "mage", "marksman", "tank", "support"]

const ORIGIN_LABEL: Record<Origin, string> = {
  human: "Nhân Loại", beastkin: "Thú Nhân", cyber: "Cơ Khí", ancient: "Cổ Đại",
  elemental: "Nguyên Tố", undead: "Bất Tử", dragon: "Rồng", demon: "Quỷ",
  celestial: "Thiên Giới", outlaw: "Cướp", phantom: "Bóng Ma", plague: "Dịch Hạch", storm: "Bão",
}

const ROLE_LABEL: Record<Role, string> = {
  warrior: "Chiến Binh", assassin: "Thích Khách", mage: "Pháp Sư",
  marksman: "Xạ Thủ", tank: "Trâu Bò", support: "Hỗ Trợ",
}

export { ORIGIN_LABEL, ROLE_LABEL }

// ============================================================
// Build quest from objective + difficulty
// ============================================================

function buildReward(difficulty: QuestDifficulty, objective: QuestObjective): QuestReward {
  const base: QuestReward = {}
  switch (difficulty) {
    case "easy":
      base.gold = randInt(400, 900)
      if (Math.random() < 0.5) base.gems = randInt(8, 18)
      break
    case "normal":
      base.gold = randInt(900, 2000)
      base.gems = randInt(15, 35)
      break
    case "hard":
      base.gold = randInt(2000, 4500)
      base.gems = randInt(30, 70)
      if (Math.random() < 0.5) base.items = [{ itemId: "p_large", quantity: 2 }]
      break
    case "extreme":
      base.gold = randInt(4000, 9000)
      base.gems = randInt(60, 140)
      if (Math.random() < 0.6) base.heroRarity = "rare"
      else base.items = [{ itemId: "p_large", quantity: 3 }]
      break
    case "legendary":
      base.gold = randInt(8000, 20000)
      base.gems = randInt(120, 300)
      // Guaranteed hero pull — higher chance at epic
      const rarityPool: Rarity[] = Math.random() < 0.4 ? ["epic"] : ["rare", "epic"]
      base.heroRarity = pick(rarityPool)
      break
  }
  return base
}

function generateKillQuest(diff: QuestDifficulty): Quest {
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [5, 15], normal: [20, 40], hard: [50, 100], extreme: [120, 200], legendary: [250, 500],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "kill_total", count, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Tiêu Diệt Quái Vật",
    description: `Tiêu diệt tổng cộng ${count} quái vật trong các trận chiến.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateKillRarityQuest(diff: QuestDifficulty): Quest {
  const rarityByDiff: Record<QuestDifficulty, Rarity[]> = {
    easy: ["common"], normal: ["common", "rare"], hard: ["rare", "epic"],
    extreme: ["epic", "legendary"], legendary: ["legendary", "mythic"],
  }
  const rarity = pick(rarityByDiff[diff])
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [3, 8], normal: [10, 20], hard: [20, 40], extreme: [40, 80], legendary: [80, 150],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "kill_monster_rarity", rarity, count, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: `Săn Quái ${RARITY_LABEL[rarity]}`,
    description: `Tiêu diệt ${count} quái vật độ hiếm **${RARITY_LABEL[rarity]}** trở lên.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateKillStreakQuest(diff: QuestDifficulty): Quest {
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [3, 5], normal: [8, 15], hard: [20, 35], extreme: [40, 60], legendary: [80, 120],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "kill_streak", count, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Chuỗi Chiến Thắng",
    description: `Chiến thắng ${count} trận liên tiếp mà không bỏ trốn.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateReachStageQuest(diff: QuestDifficulty, currentStage: number): Quest {
  const bonus: Record<QuestDifficulty, [number, number]> = {
    easy: [3, 8], normal: [10, 20], hard: [25, 40], extreme: [50, 80], legendary: [100, 150],
  }
  const [bMin, bMax] = bonus[diff]
  const stage = currentStage + randInt(bMin, bMax)
  const obj: QuestObjective = { type: "reach_stage", stage, current: currentStage }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Chinh Phục Tháp",
    description: `Vượt qua tầng **${stage}** của Tháp Aetheria.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateNoDeatheQuest(diff: QuestDifficulty): Quest {
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [2, 4], normal: [5, 10], hard: [15, 25], extreme: [30, 50], legendary: [60, 100],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "win_no_deaths", count, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Vô Thương Hoàn Hảo",
    description: `Chiến thắng ${count} trận mà không có anh hùng nào tử trận.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateOwnHeroRarityQuest(diff: QuestDifficulty): Quest {
  const rarityByDiff: Record<QuestDifficulty, Rarity> = {
    easy: "common", normal: "rare", hard: "epic", extreme: "legendary", legendary: "mythic",
  }
  const rarity = rarityByDiff[diff]
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [2, 4], normal: [2, 5], hard: [2, 4], extreme: [2, 3], legendary: [1, 2],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "own_hero_rarity", rarity, count }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: `Sưu Tầm ${RARITY_LABEL[rarity]}`,
    description: `Sở hữu ít nhất ${count} tướng có độ hiếm **${RARITY_LABEL[rarity]}** trở lên.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateOwnHeroRoleQuest(diff: QuestDifficulty): Quest {
  const role = pick(ROLES)
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [1, 2], normal: [2, 3], hard: [3, 4], extreme: [4, 5], legendary: [5, 6],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "own_hero_role", role, count }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: `Đội Hình ${ROLE_LABEL[role]}`,
    description: `Sở hữu ít nhất ${count} tướng có vai trò **${ROLE_LABEL[role]}**.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateOwnHeroOriginQuest(diff: QuestDifficulty): Quest {
  const origin = pick(ORIGINS)
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [1, 2], normal: [2, 3], hard: [3, 4], extreme: [4, 5], legendary: [5, 6],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "own_hero_origin", origin, count }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: `Tộc ${ORIGIN_LABEL[origin]}`,
    description: `Sở hữu ít nhất ${count} tướng thuộc tộc **${ORIGIN_LABEL[origin]}**.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateCollectGoldQuest(diff: QuestDifficulty): Quest {
  const amounts: Record<QuestDifficulty, [number, number]> = {
    easy: [500, 1500], normal: [2000, 5000], hard: [8000, 15000],
    extreme: [20000, 40000], legendary: [60000, 120000],
  }
  const [min, max] = amounts[diff]
  const amount = randInt(min, max)
  const obj: QuestObjective = { type: "collect_gold", amount, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Tích Lũy Vàng",
    description: `Thu thập tổng cộng **${amount.toLocaleString()}🪙** vàng từ chiến đấu.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateLevelHeroQuest(diff: QuestDifficulty): Quest {
  const levels: Record<QuestDifficulty, [number, number]> = {
    easy: [10, 20], normal: [25, 35], hard: [40, 50], extreme: [55, 65], legendary: [70, 80],
  }
  const [min, max] = levels[diff]
  const level = randInt(min, max)
  const obj: QuestObjective = { type: "level_hero", level }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Tôi Luyện Anh Hùng",
    description: `Nâng cấp bất kỳ anh hùng nào lên cấp **${level}**.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateRecruitQuest(diff: QuestDifficulty): Quest {
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [3, 8], normal: [10, 20], hard: [25, 40], extreme: [50, 80], legendary: [100, 150],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "recruit_total", count, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Mở Rộng Đội Ngũ",
    description: `Triệu hồi tổng cộng **${count}** tướng.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateConsecutiveWinsQuest(diff: QuestDifficulty): Quest {
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [3, 5], normal: [8, 12], hard: [18, 25], extreme: [35, 50], legendary: [60, 80],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "win_consecutive", count, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Bất Khả Chiến Bại",
    description: `Chiến thắng **${count} trận liên tiếp** mà không thua.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateTowerReachFloorQuest(diff: QuestDifficulty, towerRecord: number): Quest {
  const bonus: Record<QuestDifficulty, [number, number]> = {
    easy: [3, 8], normal: [10, 20], hard: [25, 40], extreme: [50, 80], legendary: [100, 150],
  }
  const [bMin, bMax] = bonus[diff]
  const floor = Math.max(5, (towerRecord || 0) + randInt(bMin, bMax))
  const obj: QuestObjective = { type: "tower_reach_floor", floor, current: towerRecord || 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Leo Tháp Vô Cực",
    description: `Đạt tầng **${floor}** trong chế độ Tháp Vô Cực.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateTowerClearFloorsQuest(diff: QuestDifficulty): Quest {
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [5, 10], normal: [15, 25], hard: [30, 50], extreme: [60, 100], legendary: [120, 200],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "tower_clear_floors", count, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Chinh Phục Tháp",
    description: `Vượt qua tổng cộng **${count}** tầng trong Tháp Vô Cực.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

function generateRaidParticipateQuest(diff: QuestDifficulty): Quest {
  const counts: Record<QuestDifficulty, [number, number]> = {
    easy: [1, 2], normal: [3, 5], hard: [6, 10], extreme: [12, 18], legendary: [20, 30],
  }
  const [min, max] = counts[diff]
  const count = randInt(min, max)
  const obj: QuestObjective = { type: "raid_participate", count, current: 0 }
  return {
    id: uid(), difficulty: diff, completed: false,
    title: "Chiến Binh Raid",
    description: `Tham gia **${count}** lần đột kích Raid Boss.`,
    objective: obj,
    reward: buildReward(diff, obj),
  }
}

// ============================================================
// Objective type pool per difficulty
// ============================================================

type QuestGen = (diff: QuestDifficulty, ctx: GeneratorContext) => Quest

const OBJECTIVE_POOL: Record<QuestDifficulty, QuestGen[]> = {
  easy: [
    (d, c) => generateKillQuest(d),
    (d, c) => generateKillRarityQuest(d),
    (d, c) => generateOwnHeroRarityQuest(d),
    (d, c) => generateOwnHeroRoleQuest(d),
    (d, c) => generateCollectGoldQuest(d),
    (d, c) => generateReachStageQuest(d, c.currentStage),
    (d, c) => generateLevelHeroQuest(d),
    (d, c) => generateRecruitQuest(d),
    (d, c) => generateTowerClearFloorsQuest(d),
    (d, c) => generateRaidParticipateQuest(d),
  ],
  normal: [
    (d, c) => generateKillQuest(d),
    (d, c) => generateKillRarityQuest(d),
    (d, c) => generateKillStreakQuest(d),
    (d, c) => generateOwnHeroRarityQuest(d),
    (d, c) => generateOwnHeroRoleQuest(d),
    (d, c) => generateOwnHeroOriginQuest(d),
    (d, c) => generateCollectGoldQuest(d),
    (d, c) => generateReachStageQuest(d, c.currentStage),
    (d, c) => generateLevelHeroQuest(d),
    (d, c) => generateNoDeatheQuest(d),
    (d, c) => generateRecruitQuest(d),
    (d, c) => generateTowerReachFloorQuest(d, c.towerRecord),
    (d, c) => generateTowerClearFloorsQuest(d),
    (d, c) => generateRaidParticipateQuest(d),
  ],
  hard: [
    (d, c) => generateKillQuest(d),
    (d, c) => generateKillRarityQuest(d),
    (d, c) => generateKillStreakQuest(d),
    (d, c) => generateOwnHeroRarityQuest(d),
    (d, c) => generateOwnHeroOriginQuest(d),
    (d, c) => generateCollectGoldQuest(d),
    (d, c) => generateReachStageQuest(d, c.currentStage),
    (d, c) => generateNoDeatheQuest(d),
    (d, c) => generateConsecutiveWinsQuest(d),
    (d, c) => generateLevelHeroQuest(d),
    (d, c) => generateRecruitQuest(d),
    (d, c) => generateTowerReachFloorQuest(d, c.towerRecord),
    (d, c) => generateTowerClearFloorsQuest(d),
    (d, c) => generateRaidParticipateQuest(d),
  ],
  extreme: [
    (d, c) => generateKillQuest(d),
    (d, c) => generateKillRarityQuest(d),
    (d, c) => generateKillStreakQuest(d),
    (d, c) => generateOwnHeroRarityQuest(d),
    (d, c) => generateReachStageQuest(d, c.currentStage),
    (d, c) => generateNoDeatheQuest(d),
    (d, c) => generateConsecutiveWinsQuest(d),
    (d, c) => generateCollectGoldQuest(d),
    (d, c) => generateLevelHeroQuest(d),
    (d, c) => generateTowerReachFloorQuest(d, c.towerRecord),
    (d, c) => generateRaidParticipateQuest(d),
  ],
  legendary: [
    (d, c) => generateKillQuest(d),
    (d, c) => generateKillRarityQuest(d),
    (d, c) => generateKillStreakQuest(d),
    (d, c) => generateOwnHeroRarityQuest(d),
    (d, c) => generateReachStageQuest(d, c.currentStage),
    (d, c) => generateNoDeatheQuest(d),
    (d, c) => generateConsecutiveWinsQuest(d),
    (d, c) => generateCollectGoldQuest(d),
    (d, c) => generateLevelHeroQuest(d),
  ],
}

type GeneratorContext = { currentStage: number; towerRecord: number }

function generateQuest(diff: QuestDifficulty, ctx: GeneratorContext): Quest {
  const pool = OBJECTIVE_POOL[diff]
  const gen = pick(pool)
  return gen(diff, ctx)
}

// ============================================================
// Generate a full batch of quests (6 active)
// ============================================================

const DIFFICULTY_DISTRIBUTION: QuestDifficulty[] = [
  "easy", "easy", "easy",
  "normal", "normal", "normal",
  "hard", "hard",
  "extreme", "extreme",
]

export function generateQuestBatch(state: GameState): Quest[] {
  const ctx: GeneratorContext = { currentStage: state.currentStage, towerRecord: state.towerRecord ?? 0 }
  // Add legendary quests once player is past stage 30
  const pool = [...DIFFICULTY_DISTRIBUTION]
  if (state.highestStage >= 30) pool.push("legendary")
  if (state.highestStage >= 60) pool.push("legendary")

  const quests: Quest[] = []
  const usedTitles = new Set<string>()

  for (const diff of pool) {
    let quest: Quest
    let tries = 0
    do {
      quest = generateQuest(diff, ctx)
      tries++
    } while (usedTitles.has(quest.title) && tries < 10)
    usedTitles.add(quest.title)
    quests.push(quest)
  }

  return quests
}

// ============================================================
// Check if objective is completed given current game state
// ============================================================

export function checkObjectiveCompletion(obj: QuestObjective, state: GameState, questState: QuestState): boolean {
  switch (obj.type) {
    case "kill_total":
      return obj.current >= obj.count
    case "kill_streak":
      return obj.current >= obj.count
    case "kill_monster_rarity":
      return obj.current >= obj.count
    case "reach_stage":
      return state.highestStage >= obj.stage
    case "win_no_deaths":
      return obj.current >= obj.count
    case "own_hero_rarity": {
      const minRank = rarityRank(obj.rarity)
      const count = state.heroes.filter(h => {
        const tpl = HEROES_BY_ID[h.templateId]
        return tpl && rarityRank(tpl.rarity) >= minRank
      }).length
      return count >= obj.count
    }
    case "own_hero_role": {
      const count = state.heroes.filter(h => {
        const tpl = HEROES_BY_ID[h.templateId]
        return tpl && tpl.role === obj.role
      }).length
      return count >= obj.count
    }
    case "own_hero_origin": {
      const count = state.heroes.filter(h => {
        const tpl = HEROES_BY_ID[h.templateId]
        return tpl && tpl.origins.includes(obj.origin as Origin)
      }).length
      return count >= obj.count
    }
    case "collect_gold":
      return obj.current >= obj.amount
    case "level_hero": {
      return state.heroes.some(h => h.level >= obj.level)
    }
    case "win_consecutive":
      return obj.current >= obj.count
    case "recruit_total":
      return obj.current >= obj.count
    case "spend_gems":
      return obj.current >= obj.amount
    case "tower_reach_floor":
      return (state.towerRecord ?? 0) >= obj.floor
    case "tower_clear_floors":
      return obj.current >= obj.count
    case "raid_participate":
      return obj.current >= obj.count
    default:
      return false
  }
}

// ============================================================
// Progress label helpers
// ============================================================

export function getObjectiveProgress(obj: QuestObjective, state: GameState): { label: string; pct: number } {
  switch (obj.type) {
    case "kill_total":
      return { label: `${obj.current}/${obj.count} quái`, pct: Math.min(1, obj.current / obj.count) }
    case "kill_streak":
      return { label: `${obj.current}/${obj.count} trận liên tiếp`, pct: Math.min(1, obj.current / obj.count) }
    case "kill_monster_rarity":
      return { label: `${obj.current}/${obj.count} quái ${RARITY_LABEL[obj.rarity]}`, pct: Math.min(1, obj.current / obj.count) }
    case "reach_stage":
      return { label: `Tầng ${state.highestStage}/${obj.stage}`, pct: Math.min(1, state.highestStage / obj.stage) }
    case "win_no_deaths":
      return { label: `${obj.current}/${obj.count} trận sạch`, pct: Math.min(1, obj.current / obj.count) }
    case "own_hero_rarity": {
      const minRank = rarityRank(obj.rarity)
      const count = state.heroes.filter(h => {
        const tpl = HEROES_BY_ID[h.templateId]
        return tpl && rarityRank(tpl.rarity) >= minRank
      }).length
      return { label: `${count}/${obj.count} tướng`, pct: Math.min(1, count / obj.count) }
    }
    case "own_hero_role": {
      const count = state.heroes.filter(h => {
        const tpl = HEROES_BY_ID[h.templateId]
        return tpl && tpl.role === obj.role
      }).length
      return { label: `${count}/${obj.count} tướng`, pct: Math.min(1, count / obj.count) }
    }
    case "own_hero_origin": {
      const count = state.heroes.filter(h => {
        const tpl = HEROES_BY_ID[h.templateId]
        return tpl && tpl.origins.includes(obj.origin as Origin)
      }).length
      return { label: `${count}/${obj.count} tướng`, pct: Math.min(1, count / obj.count) }
    }
    case "collect_gold":
      return { label: `${obj.current.toLocaleString()}/${obj.amount.toLocaleString()}🪙`, pct: Math.min(1, obj.current / obj.amount) }
    case "level_hero": {
      const maxLv = state.heroes.reduce((m, h) => Math.max(m, h.level), 0)
      return { label: `Cao nhất: Cấp ${maxLv}/${obj.level}`, pct: Math.min(1, maxLv / obj.level) }
    }
    case "win_consecutive":
      return { label: `${obj.current}/${obj.count} liên tiếp`, pct: Math.min(1, obj.current / obj.count) }
    case "recruit_total":
      return { label: `${obj.current}/${obj.count} tướng`, pct: Math.min(1, obj.current / obj.count) }
    case "spend_gems":
      return { label: `${obj.current}/${obj.amount}💎`, pct: Math.min(1, obj.current / obj.amount) }
    case "tower_reach_floor": {
      const record = state.towerRecord ?? 0
      return { label: `Tầng ${record}/${obj.floor}`, pct: Math.min(1, record / obj.floor) }
    }
    case "tower_clear_floors":
      return { label: `${obj.current}/${obj.count} tầng`, pct: Math.min(1, obj.current / obj.count) }
    case "raid_participate":
      return { label: `${obj.current}/${obj.count} lần`, pct: Math.min(1, obj.current / obj.count) }
    default:
      return { label: "?", pct: 0 }
  }
}
