"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  startTransition,
} from "react"
import { toast } from "sonner"

import {
  buildCombatState,
  checkEnded,
  computeRewards,
  consumePotionInCombat,
  performBasicAttack,
  performSkill,
  processEndOfTurn,
  onUnitTurnStart,
  aiChooseAction,
  resolvePlayerTarget,
  xpToNextLevel,
  playerXpToNextLevel,
  _uid as uid,
  computeHeroStats,
} from "./combat"
import { HEROES_BY_ID, HEROES_BY_RARITY } from "./heroes"
import { ITEMS_BY_ID, pickRandomShopItems, pickPremiumShopItems, getPremiumTier, SHOP_STOCK_COUNT, generateInnate } from "./items"
import { PASSIVES, SKILLS, SKILL_EVOLUTION_MAP, SKILL_LEVEL_REQUIREMENTS, checkSkillUnlockCondition } from "./skills"
import { DIG_RATES, HERO_GACHA_RATES, HERO_GACHA_RATES_GOLD, RARITY_ORDER, RARITY_LABEL, rarityRank, rollRarity, applyLuckToRates } from "./rarity"
import { SKILL_TREE_BY_ID, canLearnNode, computePlayerStatsFromTree } from "./skill-tree"
import { generateQuestBatch, checkObjectiveCompletion } from "./quests"
import type { Quest, QuestState } from "./quests"
import {
  ALL_BY_ID as ALL_BLESSINGS_BY_ID,
  BLESSINGS, PACTS,
  rollShardsGems, rollShardsGold,
} from "./blessings"
// fireHook is defined in combat.ts but we need it in store for round hooks
import { _fireHook as fireHook } from "./combat"
import type {
  BattleRow,
  CombatState,
  EquipSlot,
  GameState,
  ItemTemplate,
  OwnedHero,
  PremiumShopStock,
  Rarity,
  GameEventId,
  ActiveEvent,
} from "./types"

// ============================================================
// Daily Event System
// ============================================================

export const GAME_EVENTS: Record<GameEventId, { name: string; description: string; icon: string; rarity: "uncommon" | "rare" | "epic" }> = {
  blood_moon: {
    name: "Đêm Trăng Máu",
    icon: "🩸🌕",
    rarity: "uncommon",
    description: "Toàn bộ kẻ địch trong ngày hôm nay được tăng 25% phòng thủ, HP và sát thương.",
  },
  war_economy: {
    name: "CHIẾN TRANH MỸ-IRAN ĐANG DIỄN RA!! VẬT GIÁ LEO THANG",
    icon: "💣📈",
    rarity: "uncommon",
    description: "Toàn bộ giá cả (cửa hàng, triệu hồi) đắt hơn 25%. Tiền phạt mỗi lần thua cũng tăng 25%.",
  },
  black_market: {
    name: "CHỢ ĐEN XUẤT HIỆN!",
    icon: "🕵️‍♂️🏪",
    rarity: "rare",
    description: "Một kẻ buôn bán bí ẩn xuất hiện trong bóng tối... Hàng hóa đặc biệt sẽ sớm có mặt.",
  },
}

// Xác suất xuất hiện event theo độ hiếm (weight)
const EVENT_WEIGHTS: Record<GameEventId, number> = {
  blood_moon: 40,
  war_economy: 40,
  black_market: 20,
}

// Roll events cho 1 ngày mới
// - 10% cơ bản để có ít nhất 1 event
// - Mỗi event sau có 10% tiếp tục (nhưng không được trùng)
function rollDailyEvents(dayNumber: number): ActiveEvent[] {
  const allEventIds = Object.keys(GAME_EVENTS) as GameEventId[]
  const available = [...allEventIds]
  const result: ActiveEvent[] = []

  // Lần đầu: 10% có event
  if (Math.random() > 0.10) return []

  while (available.length > 0) {
    // Roll xem có event tiếp theo không (10%)
    if (result.length > 0 && Math.random() > 0.10) break

    // Chọn event theo weight từ danh sách còn lại
    const totalWeight = available.reduce((sum, id) => sum + EVENT_WEIGHTS[id], 0)
    let rand = Math.random() * totalWeight
    let chosen: GameEventId | null = null
    for (const id of available) {
      rand -= EVENT_WEIGHTS[id]
      if (rand <= 0) { chosen = id; break }
    }
    if (!chosen) chosen = available[available.length - 1]

    result.push({ eventId: chosen, dayRolled: dayNumber })
    available.splice(available.indexOf(chosen), 1)
  }

  return result
}

// Helper: kiểm tra event có active không
export function hasEvent(state: GameState, eventId: GameEventId): boolean {
  return (state.activeEvents ?? []).some(e => e.eventId === eventId)
}

// Helper: price multiplier từ war_economy event
export function getEventPriceMultiplier(state: GameState): number {
  return hasEvent(state, "war_economy") ? 1.25 : 1.0
}

// Helper: defeat penalty multiplier
export function getEventPenaltyMultiplier(state: GameState): number {
  return hasEvent(state, "war_economy") ? 1.25 : 1.0
}

// Helper: enemy stat multiplier từ blood_moon
export function getBloodMoonMultiplier(state: GameState): number {
  return hasEvent(state, "blood_moon") ? 1.25 : 1.0
}



function createInitialState(): GameState {
  // Give player a starting hero (a Common warrior) + 5 minor potions + 200 gold + 30 gems
  const starter: OwnedHero = {
    uid: uid(),
    templateId: "h_borin",
    level: 1,
    xp: 0,
    skillLevels: [1, 1, 1],
    equipment: {},
  }
  const starterMage: OwnedHero = {
    uid: uid(),
    templateId: "h_mirelle",
    level: 1,
    xp: 0,
    skillLevels: [1, 1, 1],
    equipment: {},
  }
  const starterTank: OwnedHero = {
    uid: uid(),
    templateId: "h_otto",
    level: 1,
    xp: 0,
    skillLevels: [1, 1, 1],
    equipment: {},
  }
  return {
    gold: 500,
    gems: 50,
    blessingShards: 0,
    pactShards: 0,
    level: 1,
    xp: 0,
    statPoints: 0,
    skillPoints: 0,
    playerStats: {
      attackBonus: 0,
      defenseBonus: 0,
      hpBonus: 0,
      magicBonus: 0,
      speedBonus: 0,
      critBonus: 0,
    },
    skillTree: { nodes: {} },
    heroes: [starter, starterMage, starterTank],
    inventory: [
      { uid: uid(), itemId: "p_minor", quantity: 5 },
      { uid: uid(), itemId: "p_medium", quantity: 2 },
    ],
    team: [starter.uid, starterMage.uid, starterTank.uid, null, null, null],
    teamRows: ["front", "back", "front", "front", "back", "back"] as BattleRow[],
    highestStage: 1,
    currentStage: 1,
    clearedStage: 0,
    notifications: [],
    combat: null,
    totalRolls: 0,
    totalDigs: 0,
    battlesWon: 0,
    raidBattlesUsed: 0,
    raidResetAtBattle: 5,
    towerState: null,
    towerRecord: 0,
    towerClaimedMilestones: [],
    questState: {
      active: [],
      completed: [],
      lastRefreshed: 0,
      killStreak: 0,
      noDeathStreak: 0,
      consecutiveWins: 0,
    },
    shopStock: {
      weapon: { items: pickRandomShopItems("weapon", SHOP_STOCK_COUNT.weapon).map(it => ({ ...it, innate: generateInnate(ITEMS_BY_ID[it.itemId]) })), refreshedAt: Date.now(), dayNumber: 1 },
      armor: { items: pickRandomShopItems("armor", SHOP_STOCK_COUNT.armor).map(it => ({ ...it, innate: generateInnate(ITEMS_BY_ID[it.itemId]) })), refreshedAt: Date.now(), dayNumber: 1 },
      trinket: { items: pickRandomShopItems("trinket", SHOP_STOCK_COUNT.trinket).map(it => ({ ...it, innate: generateInnate(ITEMS_BY_ID[it.itemId]) })), refreshedAt: Date.now(), dayNumber: 1 },
      potion: { items: pickRandomShopItems("potion", SHOP_STOCK_COUNT.potion).map(it => it), refreshedAt: Date.now(), dayNumber: 1 },
    },
    premiumShopStock: undefined,
    activeEvents: [],
    currentDay: 1,
    luckBuff: null,
    autoSellRarities: [],
  }
}

// ============================================================
// Actions
// ============================================================

type Action =
  | { type: "RESET" }
  | { type: "LOAD"; payload: GameState }
  // Currency / progress
  | { type: "ADD_GOLD"; amount: number }
  | { type: "ADD_GEMS"; amount: number }
  | { type: "ADD_PLAYER_XP"; amount: number }
  | { type: "SET_STAGE"; stage: number; fromVictory?: boolean; fromWatch?: boolean }
  // Team
  | { type: "SET_TEAM_SLOT"; slot: number; uid: string | null }
  | { type: "SET_TEAM_ROW"; slot: number; row: BattleRow }
  // Heroes
  | { type: "ADD_HERO"; templateId: string }
  | { type: "ADD_HEROES"; templateIds: string[] }
  | { type: "ADD_HERO_XP"; uid: string; amount: number }
  | { type: "SACRIFICE_HERO"; uid: string }
  | { type: "EQUIP_ITEM"; heroUid: string; slot: EquipSlot; itemId: string | null }
  | { type: "ADD_SKILL_POINT_HERO"; uid: string; index: 0 | 1 | 2 }
  // Inventory
  | { type: "ADD_ITEM"; itemId: string; quantity?: number; innate?: import("./types").ItemInnate }
  | { type: "REMOVE_ITEM"; uid: string; quantity?: number }
  | { type: "SELL_ITEM"; uid: string }
  | { type: "RESTOCK_SHOP"; kind: import("./types").ShopKind }
  | { type: "BUY_SHOP_ITEM"; kind: import("./types").ShopKind; itemIndex: number }
  | { type: "BUY_SHOP_ITEM_NO_GOLD"; kind: import("./types").ShopKind; itemIndex: number }
  | { type: "BUY_PREMIUM_SHOP_ITEM"; itemIndex: number }
  | { type: "RESTOCK_PREMIUM_SHOP" }
  // Skill tree
  | { type: "LEARN_NODE"; nodeId: string }
  // Combat
  | { type: "START_COMBAT" }
  | { type: "START_WATCH_COMBAT" }
  | { type: "END_COMBAT" }
  | { type: "SET_COMBAT"; state: CombatState | null }
  // Stats
  | { type: "INC_STAT"; key: keyof GameState["playerStats"]; cost?: number }
  // Notifications
  | { type: "PUSH_NOTIFY"; text: string }
  | { type: "INC_DIG" }
  | { type: "INC_BATTLES_WON" }
  | { type: "INC_RAID_ATTEMPT" }
  // Quests
  | { type: "INIT_QUESTS" }
  | { type: "REFRESH_QUESTS" }
  | { type: "CLAIM_QUEST"; questId: string }
  | { type: "QUEST_ON_BATTLE_WIN"; killedRarities: import("./types").Rarity[]; hadDeaths: boolean }
  | { type: "QUEST_ON_RECRUIT"; count: number }
  | { type: "QUEST_ON_GOLD_EARNED"; amount: number }
  // Blessings & Pacts
  | { type: "ADD_BLESSING_SHARDS"; amount: number }
  | { type: "ADD_PACT_SHARDS"; amount: number }
  | { type: "ROLL_SHARDS_GEMS" }
  | { type: "ROLL_SHARDS_GOLD" }
  | { type: "EQUIP_BLESSING_PACT"; heroUid: string; blessingPactId: string }
  | { type: "UNEQUIP_BLESSING_PACT"; heroUid: string }
  | { type: "RESET_HERO_SKILLS"; uid: string }
  | { type: "EQUIP_HERO_SKILL"; uid: string; slot: 0 | 1 | 2; skillId: string }
  | { type: "RESET_PLAYER_STATS" }
  | { type: "UNLOCK_HERO_SKILL"; uid: string; skillId: string }
  // Tower
  | { type: "TOWER_START_RUN" }
  | { type: "TOWER_START_FLOOR_COMBAT" }
  | { type: "TOWER_HEAL_TEAM" }               // apply 30% heal to all living team members
  | { type: "TOWER_SWAP_HERO"; heroUid: string; slot: number }  // swap bench hero into team
  | { type: "TOWER_CONTINUE" }                // advance to next floor
  | { type: "TOWER_GIVE_UP" }                 // end run, save record
  | { type: "TOWER_SET_POST_VICTORY_STEP"; step: import("./types").TowerPostVictoryChoice }
  | { type: "TOWER_SET_PENDING_SWAP"; heroUid: string | null; slot: number | null }
  | { type: "QUEST_ON_TOWER_FLOOR_CLEAR"; floor: number }
  | { type: "QUEST_ON_RAID_PARTICIPATE" }
  // Batched reward action — applies all combat rewards in a single reducer call (no intermediate re-renders)
  | { type: "BATCH_COMBAT_REWARDS"; combat: CombatState; isTowerCombat: boolean; isWatchMode: boolean }
  // Defeat penalty — lose gold (can go negative), no cap
  | { type: "APPLY_DEFEAT_PENALTY"; goldLoss: number }
  // Luck potions
  | { type: "USE_LUCK_POTION"; uid: string; tier: 1 | 2 | 3 }
  | { type: "SET_LUCK_BUFF_ROLLS"; rollsLeft: number }
  | { type: "SET_AUTO_SELL_RARITIES"; rarities: Rarity[] }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "RESET":
      return createInitialState()
    case "LOAD": {
      const loaded = action.payload
      // Migrate old 5-slot teams to 6 slots
      const migratedTeam = [...(loaded.team ?? [null,null,null,null,null])]
      while (migratedTeam.length < 6) migratedTeam.push(null)
      // Migrate / generate teamRows
      const migratedRows: BattleRow[] = (loaded as any).teamRows
        ? [...(loaded as any).teamRows]
        : migratedTeam.map((uid) => {
            if (!uid) return "back" as BattleRow
            const owned = (loaded.heroes ?? []).find((h: OwnedHero) => h.uid === uid)
            if (!owned) return "back" as BattleRow
            const tpl = HEROES_BY_ID[owned.templateId]
            return (tpl?.range === "melee" ? "front" : "back") as BattleRow
          })
      while (migratedRows.length < 6) migratedRows.push("back")
      return {
        ...loaded,
        team: migratedTeam,
        teamRows: migratedRows,
        clearedStage: loaded.clearedStage ?? (loaded.highestStage > 1 ? loaded.highestStage - 1 : 0),
        blessingShards: loaded.blessingShards ?? 0,
        pactShards: loaded.pactShards ?? 0,
        towerState: loaded.towerState ?? null,
        towerRecord: loaded.towerRecord ?? 0,
        towerClaimedMilestones: loaded.towerClaimedMilestones ?? [],
        questState: loaded.questState ?? {
          active: [], completed: [], lastRefreshed: 0,
          killStreak: 0, noDeathStreak: 0, consecutiveWins: 0,
        },
        activeEvents: (loaded as any).activeEvents ?? [],
        currentDay: (loaded as any).currentDay ?? Math.floor(((loaded as any).battlesWon ?? 0) / 5) + 1,
        luckBuff: (loaded as any).luckBuff ?? null,
        autoSellRarities: (loaded as any).autoSellRarities ?? [],
        premiumShopStock: (loaded as any).premiumShopStock ?? undefined,
      }
    }
    case "ADD_GOLD":
      return { ...state, gold: Math.max(0, state.gold + action.amount) }
    case "ADD_GEMS":
      return { ...state, gems: Math.max(0, state.gems + action.amount) }
    case "ADD_PLAYER_XP": {
      let xp = state.xp + action.amount
      let level = state.level
      let statPoints = state.statPoints
      let skillPoints = state.skillPoints
      while (xp >= playerXpToNextLevel(level)) {
        xp -= playerXpToNextLevel(level)
        level++
        statPoints += 3
        skillPoints += 1
      }
      // Auto-init premium shop when first reaching level 50
      let premiumShopStock = state.premiumShopStock
      if (!premiumShopStock) {
        const tier = getPremiumTier(level, state.towerRecord ?? 0)
        if (tier) {
          const rawItems = pickPremiumShopItems(tier, 8)
          premiumShopStock = {
            items: rawItems.map(it => ({ ...it, innate: generateInnate(ITEMS_BY_ID[it.itemId]) })),
            refreshedAt: Date.now(), dayNumber: 1,
          }
        }
      }
      return { ...state, xp, level, statPoints, skillPoints, premiumShopStock }
    }
    case "SET_STAGE": {
      return {
        ...state,
        currentStage: Math.max(1, action.stage),
        // highestStage: always tracks furthest stage reached
        highestStage: action.fromVictory
          ? Math.max(state.highestStage, action.stage)
          : state.highestStage,
        // clearedStage: only advances when player manually wins (not watch mode)
        clearedStage: (action.fromVictory && !action.fromWatch)
          ? Math.max(state.clearedStage ?? 0, action.stage - 1)
          : (state.clearedStage ?? 0),
      }
    }
    case "SET_TEAM_SLOT": {
      const team = [...state.team]
      while (team.length < 6) team.push(null)
      if (action.uid) {
        for (let i = 0; i < team.length; i++) if (team[i] === action.uid) team[i] = null
      }
      team[action.slot] = action.uid
      // Auto-assign row when placing hero
      const teamRows = [...(state.teamRows ?? ["front","back","front","front","back","back"])]
      while (teamRows.length < 6) teamRows.push("back")
      if (action.uid) {
        const owned = state.heroes.find(h => h.uid === action.uid)
        const tpl = owned ? HEROES_BY_ID[owned.templateId] : null
        teamRows[action.slot] = tpl?.range === "melee" ? "front" : teamRows[action.slot]
      }
      return { ...state, team, teamRows }
    }
    case "SET_TEAM_ROW": {
      const teamRows = [...(state.teamRows ?? ["front","back","front","front","back","back"])]
      while (teamRows.length < 6) teamRows.push("back")
      // Melee bắt buộc ở hàng trước
      const heroUid = state.team[action.slot]
      if (heroUid) {
        const owned = state.heroes.find(h => h.uid === heroUid)
        const tpl = owned ? HEROES_BY_ID[owned.templateId] : null
        if (tpl?.range === "melee" && action.row === "back") return state
      }
      teamRows[action.slot] = action.row
      return { ...state, teamRows }
    }
    case "ADD_HERO": {
      const tpl = HEROES_BY_ID[action.templateId]
      if (!tpl) return state
      // If already owned: convert to upgrade material? simplest: add as new instance and grant 5 gems
      const existing = state.heroes.find((h) => h.templateId === action.templateId)
      const dupGems = existing ? rarityRank(tpl.rarity) * 2 + 1 : 0
      const newHero: OwnedHero = {
        uid: uid(),
        templateId: action.templateId,
        level: 1,
        xp: 0,
        skillLevels: [1, 1, 1],
        equipment: {},
      }
      return {
        ...state,
        heroes: [...state.heroes, newHero],
        gems: state.gems + dupGems,
      }
    }
    case "ADD_HEROES": {
      const autoSellSet = new Set(state.autoSellRarities as Rarity[])
      let goldGain = 0
      let gemGain = 0
      const keptHeroes: typeof state.heroes = []
      for (const tid of action.templateIds) {
        const tpl = HEROES_BY_ID[tid]
        if (tpl && autoSellSet.has(tpl.rarity)) {
          // Auto-sell: same payout as SACRIFICE_HERO at level 1
          goldGain += (rarityRank(tpl.rarity) + 1) * 80
          gemGain += rarityRank(tpl.rarity) >= 3 ? rarityRank(tpl.rarity) * 3 : 0
        } else {
          keptHeroes.push({
            uid: uid(),
            templateId: tid,
            level: 1,
            xp: 0,
            skillLevels: [1, 1, 1] as [number, number, number],
            equipment: {},
          })
        }
      }
      return {
        ...state,
        heroes: [...state.heroes, ...keptHeroes],
        totalRolls: state.totalRolls + action.templateIds.length,
        gold: state.gold + goldGain,
        gems: state.gems + gemGain,
      }
    }
    case "SET_AUTO_SELL_RARITIES": {
      return { ...state, autoSellRarities: action.rarities }
    }
    case "ADD_HERO_XP": {
      const heroes = state.heroes.map((h) => {
        if (h.uid !== action.uid) return h
        let xp = h.xp + action.amount
        let level = h.level
        while (xp >= xpToNextLevel(level) && level < 60) {
          xp -= xpToNextLevel(level)
          level++
        }
        return { ...h, xp, level }
      })
      return { ...state, heroes }
    }
    case "SACRIFICE_HERO": {
      const target = state.heroes.find((h) => h.uid === action.uid)
      if (!target) return state
      const tpl = HEROES_BY_ID[target.templateId]
      const goldGain = (rarityRank(tpl.rarity) + 1) * 80 + target.level * 20
      const gemGain = rarityRank(tpl.rarity) >= 3 ? rarityRank(tpl.rarity) * 3 : 0
      const team = state.team.map((u) => (u === action.uid ? null : u))
      return {
        ...state,
        heroes: state.heroes.filter((h) => h.uid !== action.uid),
        team,
        gold: state.gold + goldGain,
        gems: state.gems + gemGain,
      }
    }
    case "EQUIP_ITEM": {
      const heroes = state.heroes.map((h) => {
        if (h.uid !== action.heroUid) return h
        return { ...h, equipment: { ...h.equipment, [action.slot]: action.itemId || undefined } }
      })
      return { ...state, heroes }
    }
    case "ADD_SKILL_POINT_HERO": {
      const heroes = state.heroes.map((h) => {
        if (h.uid !== action.uid) return h
        const tpl = HEROES_BY_ID[h.templateId]
        if (!tpl) return h
        // Determine which skill is in this slot
        const loadout = h.equippedSkillIds ?? tpl.skills
        const skillId = loadout[action.index]
        const isBonus = !tpl.skills.includes(skillId as any)
        const reqs = SKILL_LEVEL_REQUIREMENTS[action.index] || [1, 5, 10, 20, 35]
        if (isBonus) {
          // Track bonus skill level in bonusSkillLevels map
          const bonusLvls = { ...(h.bonusSkillLevels ?? {}) }
          const currentLvl = bonusLvls[skillId] ?? 1
          if (currentLvl >= 5) return h
          const requiredHeroLevel = reqs[currentLvl]
          if (h.level < requiredHeroLevel) return h
          bonusLvls[skillId] = currentLvl + 1
          return { ...h, bonusSkillLevels: bonusLvls }
        }
        const lvls = [...h.skillLevels] as [number, number, number]
        const currentLvl = lvls[action.index]
        if (currentLvl >= 5) return h
        // Check hero level requirement
        const requiredHeroLevel = reqs[currentLvl] // reqs[currentLvl] = level needed to reach skillLvl+1
        if (h.level < requiredHeroLevel) return h
        lvls[action.index] = currentLvl + 1
        return { ...h, skillLevels: lvls }
      })
      return { ...state, heroes }
    }
    case "ADD_ITEM": {
      const qty = action.quantity || 1
      // Items with innate are stored as separate inventory entries
      if (action.innate) {
        return {
          ...state,
          inventory: [
            ...state.inventory,
            { uid: uid(), itemId: action.itemId, quantity: qty, innate: action.innate },
          ],
        }
      }
      const existing = state.inventory.find((i) => i.itemId === action.itemId && !i.innate)
      if (existing) {
        return {
          ...state,
          inventory: state.inventory.map((i) =>
            i.itemId === action.itemId && !i.innate ? { ...i, quantity: i.quantity + qty } : i,
          ),
        }
      }
      return {
        ...state,
        inventory: [
          ...state.inventory,
          { uid: uid(), itemId: action.itemId, quantity: qty },
        ],
      }
    }
    case "RESTOCK_SHOP": {
      const { kind } = action
      const rawItems = pickRandomShopItems(kind, SHOP_STOCK_COUNT[kind])
      const itemsWithInnate = rawItems.map((it) => {
        const tpl = ITEMS_BY_ID[it.itemId]
        const innate = tpl ? generateInnate(tpl) : undefined
        return innate ? { ...it, innate } : it
      })
      const prevStock = state.shopStock?.[kind]
      return {
        ...state,
        shopStock: {
          ...state.shopStock,
          [kind]: {
            items: itemsWithInnate,
            refreshedAt: Date.now(),
            dayNumber: (prevStock?.dayNumber ?? 0) + 1,
          },
        },
      }
    }
    case "BUY_SHOP_ITEM":
    case "BUY_SHOP_ITEM_NO_GOLD": {
      const { kind, itemIndex } = action
      const stock = state.shopStock?.[kind]
      if (!stock) return state
      const stockItem = stock.items[itemIndex]
      if (!stockItem || stockItem.stock <= 0) return state
      const item = ITEMS_BY_ID[stockItem.itemId]
      if (!item) return state
      // For BUY_SHOP_ITEM: deduct gold normally. For BUY_SHOP_ITEM_NO_GOLD: gold already deducted
      if (action.type === "BUY_SHOP_ITEM" && state.gold < item.basePrice) return state
      const newItems = stock.items.map((it, idx) =>
        idx === itemIndex ? { ...it, stock: it.stock - 1 } : it
      )
      const newInv: typeof state.inventory[0][] = [...state.inventory]
      if (stockItem.innate) {
        newInv.push({ uid: uid(), itemId: item.id, quantity: 1, innate: stockItem.innate })
      } else {
        const existing = newInv.find((i) => i.itemId === item.id && !i.innate)
        if (existing) {
          const idx = newInv.indexOf(existing)
          newInv[idx] = { ...existing, quantity: existing.quantity + 1 }
        } else {
          newInv.push({ uid: uid(), itemId: item.id, quantity: 1 })
        }
      }
      return {
        ...state,
        gold: action.type === "BUY_SHOP_ITEM" ? state.gold - item.basePrice : state.gold,
        inventory: newInv,
        shopStock: {
          ...state.shopStock,
          [kind]: { ...stock, items: newItems },
        },
      }
    }
    case "REMOVE_ITEM": {
      const qty = action.quantity || 1
      const inv = state.inventory
        .map((i) => (i.uid === action.uid ? { ...i, quantity: i.quantity - qty } : i))
        .filter((i) => i.quantity > 0)
      return { ...state, inventory: inv }
    }
    case "BUY_PREMIUM_SHOP_ITEM": {
      const stock = state.premiumShopStock
      if (!stock) return state
      const si = stock.items[action.itemIndex]
      if (!si || si.stock <= 0) return state
      const tpl = ITEMS_BY_ID[si.itemId]
      if (!tpl || state.gold < tpl.basePrice) return state
      const newItems = stock.items.map((it, idx) =>
        idx === action.itemIndex ? { ...it, stock: it.stock - 1 } : it
      )
      const newInvItem: typeof state.inventory[0] = si.innate
        ? { uid: uid(), itemId: tpl.id, quantity: 1, innate: si.innate }
        : { uid: uid(), itemId: tpl.id, quantity: 1 }
      return {
        ...state,
        gold: state.gold - tpl.basePrice,
        inventory: [...state.inventory, newInvItem],
        premiumShopStock: { ...stock, items: newItems },
      }
    }
    case "RESTOCK_PREMIUM_SHOP": {
      const tier = getPremiumTier(state.level, state.towerRecord ?? 0)
      if (!tier) return state
      const rawItems = pickPremiumShopItems(tier, 8)
      const prev = state.premiumShopStock
      return {
        ...state,
        premiumShopStock: {
          items: rawItems.map(it => ({ ...it, innate: generateInnate(ITEMS_BY_ID[it.itemId]) })),
          refreshedAt: Date.now(),
          dayNumber: (prev?.dayNumber ?? 0) + 1,
        },
      }
    }
    case "SELL_ITEM": {
      const item = state.inventory.find((i) => i.uid === action.uid)
      if (!item) return state
      const tpl = ITEMS_BY_ID[item.itemId]
      if (!tpl) return state
      const price = Math.round(tpl.basePrice * 0.4)
      return {
        ...state,
        gold: state.gold + price,
        inventory: state.inventory
          .map((i) =>
            i.uid === action.uid ? { ...i, quantity: i.quantity - 1 } : i,
          )
          .filter((i) => i.quantity > 0),
      }
    }
    case "USE_LUCK_POTION": {
      // action: { uid: string, tier: 1|2|3 }
      const invItem = state.inventory.find((i) => i.uid === action.uid)
      if (!invItem || invItem.quantity <= 0) return state
      const newBuff = { tier: action.tier as 1 | 2 | 3, rollsLeft: 100 }
      return {
        ...state,
        luckBuff: newBuff,
        inventory: state.inventory
          .map((i) => i.uid === action.uid ? { ...i, quantity: i.quantity - 1 } : i)
          .filter((i) => i.quantity > 0),
      }
    }
    case "SET_LUCK_BUFF_ROLLS": {
      if (!state.luckBuff) return state
      const rollsLeft = action.rollsLeft as number
      if (rollsLeft <= 0) return { ...state, luckBuff: null }
      return { ...state, luckBuff: { ...state.luckBuff, rollsLeft } }
    }
    case "LEARN_NODE": {
      const node = SKILL_TREE_BY_ID[action.nodeId]
      if (!node) return state
      const cur = state.skillTree.nodes[node.id] || 0
      if (cur >= node.maxRank) return state
      if (state.skillPoints < node.cost) return state
      if (!canLearnNode(node, state.skillTree.nodes)) return state
      const nodes = { ...state.skillTree.nodes, [node.id]: cur + 1 }
      const playerStats = computePlayerStatsFromTree(nodes)
      return {
        ...state,
        skillTree: { nodes },
        skillPoints: state.skillPoints - node.cost,
        playerStats,
      }
    }
    case "INC_STAT": {
      const cost = action.cost ?? 1
      if (state.statPoints < cost) return state
      const playerStats = { ...state.playerStats }
      // Each stat point gives a fixed bump
      const stepByKey: Record<keyof GameState["playerStats"], number> = {
        attackBonus: 4,
        magicBonus: 5,
        defenseBonus: 4,
        hpBonus: 30,
        speedBonus: 2,
        critBonus: 1,
      }
      playerStats[action.key] = playerStats[action.key] + stepByKey[action.key]
      return {
        ...state,
        statPoints: state.statPoints - cost,
        playerStats,
      }
    }
    case "START_COMBAT": {
      // Need at least 1 hero in team
      const filled = state.team.filter((u) => !!u)
      if (filled.length === 0) return state
      const combat = buildCombatState(state)
      return { ...state, combat }
    }
    case "START_WATCH_COMBAT": {
      const filled = state.team.filter((u) => !!u)
      if (filled.length === 0) return state
      const combat = buildCombatState(state)
      // In watch mode AI also handles player turns — never await input
      combat.watchMode = true
      combat.awaitingPlayerInput = false
      return { ...state, combat }
    }
    case "END_COMBAT":
      return { ...state, combat: null }
    case "SET_COMBAT":
      return { ...state, combat: action.state }
    case "PUSH_NOTIFY":
      return { ...state, notifications: [action.text, ...state.notifications].slice(0, 10) }
    case "INC_DIG":
      return { ...state, totalDigs: state.totalDigs + 1 }
    case "INC_BATTLES_WON": {
      const newBattlesWon = state.battlesWon + 1
      // Auto-restock every 5 battles (1 "day")
      const isNewDay = newBattlesWon % 5 === 0
      // Reset raid counter on new day
      const raidReset = isNewDay
        ? { raidBattlesUsed: 0, raidResetAtBattle: newBattlesWon + 5 }
        : {}
      if (isNewDay) {
        const kinds: import("./types").ShopKind[] = ["weapon", "armor", "trinket", "potion"]
        const newShopStock = { ...state.shopStock }
        for (const kind of kinds) {
          const rawItems = pickRandomShopItems(kind, SHOP_STOCK_COUNT[kind])
          const itemsWithInnate = rawItems.map((it) => {
            const tpl = ITEMS_BY_ID[it.itemId]
            const innate = tpl ? generateInnate(tpl) : undefined
            return innate ? { ...it, innate } : it
          })
          const prev = newShopStock[kind]
          newShopStock[kind] = { items: itemsWithInnate, refreshedAt: Date.now(), dayNumber: (prev?.dayNumber ?? 0) + 1 }
        }
        const newDay = (state.currentDay ?? 1) + 1
        const newEvents = rollDailyEvents(newDay)
        return { ...state, battlesWon: newBattlesWon, shopStock: newShopStock, activeEvents: newEvents, currentDay: newDay, ...raidReset }
      }
      return { ...state, battlesWon: newBattlesWon }
    }
    case "INC_RAID_ATTEMPT":
      return { ...state, raidBattlesUsed: (state.raidBattlesUsed ?? 0) + 1 }
    // ============================================================
    // Infinite Tower actions
    // ============================================================
    case "TOWER_START_RUN": {
      const filled = state.team.filter(u => !!u)
      if (filled.length === 0) return state
      const towerState: import("./types").TowerRunState = {
        floor: 1,
        pendingHeal: false,
        pendingSwapHeroUid: null,
        pendingSwapSlot: null,
        postVictoryStep: null,
      }
      return { ...state, towerState }
    }
    case "TOWER_START_FLOOR_COMBAT": {
      if (!state.towerState) return state
      const towerFloor = state.towerState.floor
      const virtualState = { ...state, currentStage: Math.max(1, towerFloor * 2) }
      const combat = buildCombatState(virtualState)
      // Apply 30% heal to all player units (from previous floor victory heal)
      if (towerFloor > 1) {
        for (const u of combat.units) {
          if (u.side === "player") {
            const healAmt = Math.floor(u.hpMax * 0.30)
            u.hp = Math.min(u.hpMax, u.hp + healAmt)
          }
        }
      }
      combat.log = [{ id: uid(), text: `🗼 Tầng Vô Cực ${towerFloor} bắt đầu! ${combat.units.filter(u => u.side === "enemy").length} kẻ địch.`, kind: "system" as const }]
      combat.stage = towerFloor
      return { ...state, combat }
    }
    case "TOWER_HEAL_TEAM": {
      // Apply 30% max HP heal to all living team heroes in memory (combat is null at this point)
      // We patch the hero hpMax -> but heroes don't have current HP outside combat.
      // We'll store a pendingHeal flag and apply it when next tower combat starts instead.
      if (!state.towerState) return state
      return { ...state, towerState: { ...state.towerState, pendingHeal: false } }
    }
    case "TOWER_SWAP_HERO": {
      if (!state.towerState) return state
      const { heroUid, slot } = action
      // Validate
      const heroExists = state.heroes.find(h => h.uid === heroUid)
      if (!heroExists) return state
      const team = [...state.team]
      // Remove hero from any current slot
      for (let i = 0; i < team.length; i++) if (team[i] === heroUid) team[i] = null
      team[slot] = heroUid
      return { ...state, team, towerState: { ...state.towerState, pendingSwapHeroUid: null, pendingSwapSlot: null } }
    }
    case "TOWER_SET_POST_VICTORY_STEP": {
      if (!state.towerState) return state
      return { ...state, towerState: { ...state.towerState, postVictoryStep: action.step } }
    }
    case "TOWER_SET_PENDING_SWAP": {
      if (!state.towerState) return state
      return { ...state, towerState: { ...state.towerState, pendingSwapHeroUid: action.heroUid, pendingSwapSlot: action.slot } }
    }
    case "TOWER_CONTINUE": {
      if (!state.towerState) return state
      const nextFloor = state.towerState.floor + 1
      const newRecord = Math.max(state.towerRecord ?? 0, state.towerState.floor)
      const towerState: import("./types").TowerRunState = {
        floor: nextFloor,
        pendingHeal: false,
        pendingSwapHeroUid: null,
        pendingSwapSlot: null,
        postVictoryStep: null,
      }
      return { ...state, towerState, towerRecord: newRecord }
    }
    case "TOWER_GIVE_UP": {
      const newRecord = Math.max(state.towerRecord ?? 0, state.towerState?.floor ?? 0)
      return { ...state, towerState: null, towerRecord: newRecord, combat: null }
    }
    case "APPLY_DEFEAT_PENALTY": {
      // Gold can go negative — no floor
      return { ...state, gold: state.gold - action.goldLoss }
    }
    case "QUEST_ON_TOWER_FLOOR_CLEAR": {
      const qs = state.questState
      if (!qs) return state
      const updated = qs.active.map(q => {
        if (q.completed) return q
        if (q.objective.type === "tower_clear_floors") {
          return { ...q, objective: { ...q.objective, current: q.objective.current + 1 } }
        }
        if (q.objective.type === "tower_reach_floor") {
          return { ...q, objective: { ...q.objective, current: Math.max(q.objective.current, action.floor) } }
        }
        return q
      })
      return { ...state, questState: { ...qs, active: updated } }
    }
    case "QUEST_ON_RAID_PARTICIPATE": {
      const qs = state.questState
      if (!qs) return state
      const updated = qs.active.map(q => {
        if (q.completed) return q
        if (q.objective.type === "raid_participate") {
          return { ...q, objective: { ...q.objective, current: q.objective.current + 1 } }
        }
        return q
      })
      return { ...state, questState: { ...qs, active: updated } }
    }
    // ============================================================
    // Quest actions
    // ============================================================
    case "INIT_QUESTS":
    case "REFRESH_QUESTS": {
      const existing = state.questState?.active ?? []
      if (action.type === "INIT_QUESTS" && existing.length > 0) return state
      const newQuests = generateQuestBatch(state)
      const qs: QuestState = {
        active: newQuests,
        completed: state.questState?.completed ?? [],
        lastRefreshed: Date.now(),
        killStreak: state.questState?.killStreak ?? 0,
        noDeathStreak: state.questState?.noDeathStreak ?? 0,
        consecutiveWins: state.questState?.consecutiveWins ?? 0,
      }
      return { ...state, questState: qs }
    }
    case "CLAIM_QUEST": {
      const qs = state.questState
      if (!qs) return state
      const quest = qs.active.find(q => q.id === action.questId)
      if (!quest || !checkObjectiveCompletion(quest.objective, state, qs)) return state
      let ns = { ...state }
      const r = quest.reward
      if (r.gold) ns = { ...ns, gold: ns.gold + r.gold }
      if (r.gems) ns = { ...ns, gems: ns.gems + r.gems }
      if (r.items) {
        for (const it of r.items) {
          const existing2 = ns.inventory.find(i => i.itemId === it.itemId && !i.innate)
          if (existing2) {
            ns = { ...ns, inventory: ns.inventory.map(i => i.uid === existing2.uid ? { ...i, quantity: i.quantity + it.quantity } : i) }
          } else {
            ns = { ...ns, inventory: [...ns.inventory, { uid: uid(), itemId: it.itemId, quantity: it.quantity }] }
          }
        }
      }
      if (r.heroRarity) {
        const pool = HEROES_BY_RARITY[r.heroRarity] || []
        if (pool.length > 0) {
          const tplId = pool[Math.floor(Math.random() * pool.length)].id
          const newHero = { uid: uid(), templateId: tplId, level: 1, xp: 0, skillLevels: [1, 1, 1] as [1,1,1], equipment: {} }
          ns = { ...ns, heroes: [...ns.heroes, newHero] }
        }
      }
      const newActive = qs.active.filter(q => q.id !== action.questId)
      const claimedQuest = { ...quest, completed: true, claimedAt: Date.now() }
      const newCompleted = [claimedQuest, ...(qs.completed ?? [])].slice(0, 50)
      ns = { ...ns, questState: { ...qs, active: newActive, completed: newCompleted } }
      return ns
    }
    case "QUEST_ON_BATTLE_WIN": {
      const qs = state.questState
      if (!qs) return state
      const killedRarities = action.killedRarities
      const hadDeaths = action.hadDeaths
      const newKillStreak = (qs.killStreak ?? 0) + 1
      const newConsecutiveWins = (qs.consecutiveWins ?? 0) + 1
      const newNoDeathStreak = hadDeaths ? 0 : (qs.noDeathStreak ?? 0) + 1
      const totalKills = killedRarities.length
      const updatedActive = qs.active.map(q => {
        if (q.completed) return q
        let obj = { ...q.objective }
        switch (obj.type) {
          case "kill_total":
            obj = { ...obj, current: obj.current + totalKills }; break
          case "kill_streak":
            obj = { ...obj, current: newKillStreak }; break
          case "kill_monster_rarity": {
            const minRank = rarityRank(obj.rarity)
            const matching = killedRarities.filter(r2 => rarityRank(r2) >= minRank).length
            obj = { ...obj, current: obj.current + matching }; break
          }
          case "win_no_deaths":
            obj = hadDeaths ? { ...obj, current: 0 } : { ...obj, current: obj.current + 1 }; break
          case "win_consecutive":
            obj = { ...obj, current: newConsecutiveWins }; break
          default: break
        }
        return { ...q, objective: obj }
      })
      return { ...state, questState: { ...qs, active: updatedActive, killStreak: newKillStreak, noDeathStreak: newNoDeathStreak, consecutiveWins: newConsecutiveWins } }
    }
    case "QUEST_ON_RECRUIT": {
      const qs = state.questState
      if (!qs) return state
      const updatedActive = qs.active.map(q => {
        if (q.completed || q.objective.type !== "recruit_total") return q
        return { ...q, objective: { ...q.objective, current: q.objective.current + action.count } }
      })
      return { ...state, questState: { ...qs, active: updatedActive } }
    }
    case "QUEST_ON_GOLD_EARNED": {
      const qs = state.questState
      if (!qs) return state
      const updatedActive = qs.active.map(q => {
        if (q.completed || q.objective.type !== "collect_gold") return q
        return { ...q, objective: { ...q.objective, current: q.objective.current + action.amount } }
      })
      return { ...state, questState: { ...qs, active: updatedActive } }
    }
    // ============================================================
    // Blessing / Pact
    // ============================================================
    case "ADD_BLESSING_SHARDS":
      return { ...state, blessingShards: (state.blessingShards ?? 0) + action.amount }
    case "ADD_PACT_SHARDS":
      return { ...state, pactShards: (state.pactShards ?? 0) + action.amount }
    case "ROLL_SHARDS_GEMS": {
      const cost = 50
      if (state.gems < cost) return state
      const result = rollShardsGems()
      return {
        ...state,
        gems: state.gems - cost,
        blessingShards: (state.blessingShards ?? 0) + result.blessingShards,
        pactShards: (state.pactShards ?? 0) + result.pactShards,
      }
    }
    case "ROLL_SHARDS_GOLD": {
      const cost = 1000
      if (state.gold < cost) return state
      const result = rollShardsGold()
      return {
        ...state,
        gold: state.gold - cost,
        blessingShards: (state.blessingShards ?? 0) + result.blessingShards,
        pactShards: (state.pactShards ?? 0) + result.pactShards,
      }
    }
    case "EQUIP_BLESSING_PACT": {
      const bp = ALL_BLESSINGS_BY_ID[action.blessingPactId]
      if (!bp) return state
      // Check shard cost
      const shardKey = bp.kind === "blessing" ? "blessingShards" : "pactShards"
      const currentShards = (state[shardKey] ?? 0)
      if (currentShards < bp.shardCost) return state
      // Check uniqueness: no other hero in team can have this same id
      const teamUids = state.team.filter(Boolean) as string[]
      const conflict = state.heroes.find(h =>
        teamUids.includes(h.uid) && h.uid !== action.heroUid && h.blessingPactId === action.blessingPactId
      )
      if (conflict) return state
      // Check: hero can only hold one (blessing or pact)
      const heroes = state.heroes.map(h =>
        h.uid === action.heroUid ? { ...h, blessingPactId: action.blessingPactId } : h
      )
      return {
        ...state,
        heroes,
        [shardKey]: currentShards - bp.shardCost,
      }
    }
    case "UNEQUIP_BLESSING_PACT": {
      const heroes = state.heroes.map(h =>
        h.uid === action.heroUid ? { ...h, blessingPactId: undefined } : h
      )
      return { ...state, heroes }
    }
    case "RESET_HERO_SKILLS": {
      const hero = state.heroes.find((h) => h.uid === action.uid)
      if (!hero) return state
      const basePoints = hero.skillLevels.reduce((sum, lv) => sum + (lv - 1), 0)
      const bonusPoints = Object.values(hero.bonusSkillLevels ?? {}).reduce((sum, lv) => sum + (lv - 1), 0)
      const totalSkillPoints = basePoints + bonusPoints
      const cost = 2000 + totalSkillPoints * 500
      if (state.gold < cost) return state
      const heroes = state.heroes.map((h) =>
        h.uid !== action.uid ? h : { ...h, skillLevels: [1, 1, 1] as [number, number, number], unlockedSkills: [], bonusSkillLevels: {} }
      )
      return { ...state, gold: state.gold - cost, heroes }
    }
    case "RESET_PLAYER_STATS": {
      const s = state.playerStats
      const totalSpent = Math.round(
        s.attackBonus / 4 + s.defenseBonus / 4 + s.hpBonus / 30 +
        s.magicBonus / 5 + s.speedBonus / 2 + s.critBonus
      )
      const RESET_GOLD_COST = 10000
      const RESET_GEM_COST = 1000
      if (state.gold < RESET_GOLD_COST || state.gems < RESET_GEM_COST) return state
      return {
        ...state,
        gold: state.gold - RESET_GOLD_COST,
        gems: state.gems - RESET_GEM_COST,
        statPoints: state.statPoints + totalSpent,
        playerStats: { attackBonus: 0, defenseBonus: 0, hpBonus: 0, magicBonus: 0, speedBonus: 0, critBonus: 0 },
      }
    }
    case "UNLOCK_HERO_SKILL": {
      const heroes = state.heroes.map((h) => {
        if (h.uid !== action.uid) return h
        const already = h.unlockedSkills || []
        if (already.includes(action.skillId)) return h
        return { ...h, unlockedSkills: [...already, action.skillId] }
      })
      return { ...state, heroes }
    }
    case "EQUIP_HERO_SKILL": {
      const heroes = state.heroes.map((h) => {
        if (h.uid !== action.uid) return h
        const tpl = HEROES_BY_ID[h.templateId]
        const current: [string, string, string] = h.equippedSkillIds
          ? [...h.equippedSkillIds]
          : [...tpl.skills]
        current[action.slot] = action.skillId
        return { ...h, equippedSkillIds: current as [string, string, string] }
      })
      return { ...state, heroes }
    }
    case "BATCH_COMBAT_REWARDS": {
      // Apply ALL combat rewards in a single state update — eliminates 6-8 intermediate re-renders
      const { combat, isTowerCombat, isWatchMode } = action
      if (combat.ended !== "victory" || !combat.rewards) return state

      let { gold, gems, xp, items } = combat.rewards
      let ns = state

      // Half rewards when replaying a stage already beaten (manual or watch mode)
      // Use highestStage as the ground truth — any stage < highestStage has been beaten before
      const isReplay = !isTowerCombat && combat.stage < ns.highestStage
      if (isReplay || isWatchMode) {
        gold = Math.floor(gold / 2)
        gems = Math.floor(gems / 2)
        xp = Math.floor(xp / 2)
        items = [] // no item drops on replay/watch
      }

      // Tower: only grant resources at milestone floors (10, 20, 30...) — each only once
      if (isTowerCombat) {
        const floor = ns.towerState?.floor ?? 0
        const isMilestone = floor > 0 && floor % 10 === 0
        const alreadyClaimed = (ns.towerClaimedMilestones ?? []).includes(floor)
        if (!isMilestone || alreadyClaimed) {
          // Non-milestone floor: no gold/gems/items; small XP only
          gold = 0; gems = 0; items = []
          xp = Math.floor(xp / 3)
        } else {
          // Milestone: generous scaling reward, claimable only once
          const tier = Math.floor(floor / 10)
          gold = 500 * tier + 200
          gems = 10 * tier
          xp = xp * 2
          ns = { ...ns, towerClaimedMilestones: [...(ns.towerClaimedMilestones ?? []), floor] }
        }
      }

      // Gold & gems
      ns = { ...ns, gold: ns.gold + gold }
      if (gems) ns = { ...ns, gems: ns.gems + gems }

      // Player XP + level up
      let newXp = ns.xp + xp
      let newLevel = ns.level
      let newStatPoints = ns.statPoints
      let newSkillPoints = ns.skillPoints
      while (newXp >= playerXpToNextLevel(newLevel)) {
        newXp -= playerXpToNextLevel(newLevel)
        newLevel++
        newStatPoints += 3
        newSkillPoints += 1
      }
      ns = { ...ns, xp: newXp, level: newLevel, statPoints: newStatPoints, skillPoints: newSkillPoints }

      // Hero XP
      const updatedHeroes = ns.heroes.map(h => {
        if (!ns.team.includes(h.uid)) return h
        let hXp = h.xp + xp
        let hLv = h.level
        while (hXp >= xpToNextLevel(hLv)) { hXp -= xpToNextLevel(hLv); hLv++ }
        return { ...h, xp: hXp, level: hLv }
      })
      ns = { ...ns, heroes: updatedHeroes }

      // Inventory items
      if (items.length > 0) {
        const newInventory = [...ns.inventory]
        for (const { itemId, quantity } of items) {
          const existing = newInventory.find(i => i.itemId === itemId && !ITEMS_BY_ID[itemId]?.unique)
          if (existing) {
            const idx = newInventory.indexOf(existing)
            newInventory[idx] = { ...existing, quantity: existing.quantity + quantity }
          } else {
            newInventory.push({ uid: uid(), itemId, quantity })
          }
        }
        ns = { ...ns, inventory: newInventory }
      }

      // Stage advancement or tower
      if (!isTowerCombat) {
        const nextStage = combat.stage + 1
        ns = {
          ...ns,
          // Watch mode: don't push currentStage past what player has manually cleared
          currentStage: isWatchMode ? ns.currentStage : nextStage,
          highestStage: Math.max(ns.highestStage, nextStage),
          // clearedStage: only update when player manually wins (not watch mode)
          clearedStage: isWatchMode ? ns.clearedStage : Math.max(ns.clearedStage, combat.stage),
        }
      } else {
        ns = { ...ns, towerState: ns.towerState ? { ...ns.towerState, postVictoryStep: "choose_hero" as const } : ns.towerState }
      }

      // battlesWon + shop auto-restock
      const newBattlesWon = ns.battlesWon + 1
      const isNewDay = newBattlesWon % 5 === 0
      ns = { ...ns, battlesWon: newBattlesWon }
      if (isNewDay) {
        const kinds: import("./types").ShopKind[] = ["weapon", "armor", "trinket", "potion"]
        const newShopStock = { ...ns.shopStock }
        for (const kind of kinds) {
          const rawItems = pickRandomShopItems(kind, SHOP_STOCK_COUNT[kind])
          const itemsWithInnate = rawItems.map(it => {
            const tpl = ITEMS_BY_ID[it.itemId]
            const innate = tpl ? generateInnate(tpl) : undefined
            return innate ? { ...it, innate } : it
          })
          const prev = newShopStock[kind]
          newShopStock[kind] = { items: itemsWithInnate, refreshedAt: Date.now(), dayNumber: (prev?.dayNumber ?? 0) + 1 }
        }
        const newDay = (ns.currentDay ?? 1) + 1
        const newEvents = rollDailyEvents(newDay)
        ns = { ...ns, shopStock: newShopStock, raidBattlesUsed: 0, raidResetAtBattle: newBattlesWon + 5, activeEvents: newEvents, currentDay: newDay }
        // Auto-add new daily quests when a new day starts
        if (ns.questState) {
          const newDailyQuests = generateQuestBatch(ns)
          const existingQs = ns.questState
          ns = { ...ns, questState: { ...existingQs, active: [...existingQs.active, ...newDailyQuests], lastRefreshed: Date.now() } }
        }
      }

      // Quest: battle win tracking
      const qs = ns.questState
      if (qs) {
        const killedRarities = combat.units.filter(u => u.side === "enemy" && u.hp <= 0).map(u => u.rarity)
        const hadDeaths = combat.units.some(u => u.side === "player" && u.hp <= 0)
        const newKillStreak = (qs.killStreak ?? 0) + 1
        const newConsecutiveWins = (qs.consecutiveWins ?? 0) + 1
        const newNoDeathStreak = hadDeaths ? 0 : (qs.noDeathStreak ?? 0) + 1
        const totalKills = killedRarities.length
        const questActive = qs.active.map(q => {
          if (q.completed) return q
          let obj = { ...q.objective }
          switch (obj.type) {
            case "kill_total": obj = { ...obj, current: obj.current + totalKills }; break
            case "kill_streak": obj = { ...obj, current: newKillStreak }; break
            case "kill_monster_rarity": {
              const minRank = rarityRank(obj.rarity)
              const matching = killedRarities.filter(r2 => rarityRank(r2) >= minRank).length
              obj = { ...obj, current: obj.current + matching }; break
            }
            case "win_no_deaths": obj = hadDeaths ? { ...obj, current: 0 } : { ...obj, current: obj.current + 1 }; break
            case "win_consecutive": obj = { ...obj, current: newConsecutiveWins }; break
            case "collect_gold": obj = { ...obj, current: obj.current + gold }; break
            default: break
          }
          return { ...q, objective: obj }
        })
        ns = { ...ns, questState: { ...qs, active: questActive, killStreak: newKillStreak, noDeathStreak: newNoDeathStreak, consecutiveWins: newConsecutiveWins } }
      }

      return ns
    }
  }
  return state
}

// ============================================================
// Provider
// ============================================================

type GameActions = {
  dispatch: React.Dispatch<Action>
  // Convenience operations (mutate state via dispatch + side-effects)
  rollHero: (count: 1 | 10) => void
  rollHeroGold: (count: 1 | 10) => void
  digArtifact: () => void
  buyItem: (itemId: string) => void
  buyShopItem: (kind: import("./types").ShopKind, itemIndex: number) => void
  restockShop: (kind: import("./types").ShopKind) => void
  buyPremiumShopItem: (itemIndex: number) => void
  restockPremiumShop: () => void
  sellItem: (uid: string) => void
  useLuckPotion: (uid: string, tier: 1 | 2 | 3) => void
  setAutoSellRarities: (rarities: Rarity[]) => void
  equipBest: (heroUid: string) => void
  startCombat: () => void
  startWatchCombat: () => void // AI controls both sides
  setTeamRow: (slot: number, row: BattleRow) => void
  // Combat actions
  combatChooseSkill: (skillIndex: 0 | 1 | 2, targetUid: string | null) => void
  combatBasicAttack: (targetUid: string) => void
  combatUsePotion: (inventoryItemUid: string, targetUid: string) => void
  combatFlee: () => void
  combatSkipTurn: () => void
  // Misc
  resetGame: () => void
  resetHeroSkills: (uid: string) => void
  resetPlayerStats: () => void
  unlockHeroSkill: (uid: string, skillId: string) => void
  // Blessings & Pacts
  rollShardsWithGems: () => void
  rollShardsWithGold: () => void
  equipBlessingPact: (heroUid: string, blessingPactId: string) => void
  unequipBlessingPact: (heroUid: string) => void
  // Tower
  towerStartRun: () => void
  towerStartFloorCombat: () => void
  towerGiveUp: () => void
  towerContinue: () => void
}

// Legacy combined type for backward compatibility
type GameContextValue = { state: GameState } & GameActions

// ============================================================
// localStorage key management — per-user to prevent cross-account data bleed
// ============================================================
const BASE_STORAGE_KEY = "aetheria-save-v1"
let _currentStorageKey = BASE_STORAGE_KEY

export function setStorageUsername(username: string | null) {
  _currentStorageKey = username
    ? `${BASE_STORAGE_KEY}:${username.trim().toLowerCase()}`
    : BASE_STORAGE_KEY
}

export function getStorageKey() { return _currentStorageKey }

// Split into two contexts: state changes frequently, actions never change after mount
const GameStateContext = createContext<GameState | null>(null)
const GameActionsContext = createContext<GameActions | null>(null)

// Legacy combined context — kept for backward compat with useGame()
const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as GameState, createInitialState)
  const loadedRef = useRef(false)

  // Load from localStorage once on mount
  // Note: getStorageKey() returns the correct per-user key because
  // use-cloud-save calls setStorageUsername() synchronously before this effect fires
  // (child effects fire before parent effects in React)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    try {
      const raw = window.localStorage.getItem(getStorageKey())
      if (raw) {
        const parsed = JSON.parse(raw) as GameState
        if (parsed && parsed.heroes && parsed.team) {
          dispatch({ type: "LOAD", payload: parsed })
        }
      }
    } catch { /* ignore */ }
    setTimeout(() => dispatch({ type: "INIT_QUESTS" }), 50)
  }, [])

  // Persist on change — debounced 1.5s, and exclude heavy combat state from storage
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        // Don't persist active combat — it's transient and large
        const { combat: _combat, ...persistable } = state
        window.localStorage.setItem(getStorageKey(), JSON.stringify(persistable))
      } catch {
        // ignore quota errors
      }
    }, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [state])

  // ============================================================
  // Operations
  // ============================================================

  const rollHero = useCallback(
    (count: 1 | 10) => {
      const baseCost = count === 1 ? 30 : 280 // gems
      const priceMult = getEventPriceMultiplier(state)
      const cost = Math.round(baseCost * priceMult)
      if (state.gems < cost) {
        toast.error("Không đủ Đá Quý.")
        return
      }
      dispatch({ type: "ADD_GEMS", amount: -cost })
      const ids: string[] = []
      let pityLegendaryOrBetter = false
      // Apply luck buff to gacha rates
      const luckPct = state.luckBuff ? [0, 0.25, 0.50, 0.75][state.luckBuff.tier] : 0
      const rates = luckPct > 0 ? applyLuckToRates(HERO_GACHA_RATES, luckPct) : HERO_GACHA_RATES
      for (let i = 0; i < count; i++) {
        // 10-pull pity: ensure at least 1 epic+
        let rarity = rollRarity(rates) as Rarity
        if (count === 10 && i === 9 && !pityLegendaryOrBetter) {
          // guarantee at least epic on last roll
          if (rarityRank(rarity) < 2) rarity = "epic"
        }
        if (rarityRank(rarity) >= 3) pityLegendaryOrBetter = true
        const pool = HEROES_BY_RARITY[rarity] || []
        const tpl = pool[Math.floor(Math.random() * pool.length)]
        if (tpl) ids.push(tpl.id)
      }
      // Decrement luck buff rolls
      if (state.luckBuff) {
        const newRollsLeft = state.luckBuff.rollsLeft - count
        dispatch({ type: "SET_LUCK_BUFF_ROLLS", rollsLeft: Math.max(0, newRollsLeft) })
      }
      dispatch({ type: "ADD_HEROES", templateIds: ids })
      dispatch({ type: "QUEST_ON_RECRUIT", count: ids.length })
      const summary = ids
        .map((id) => HEROES_BY_ID[id])
        .map((h) => `${h.name} (${RARITY_LABEL[h.rarity]})`)
        .join(", ")
      toast.success(`Triệu hồi: ${summary}`)
    },
    [state.gems, state.activeEvents, state.luckBuff],
  )

  const rollHeroGold = useCallback(
    (count: 1 | 10) => {
      // Gold banner: 1 pull = 500 gold, 10 pulls = 4500 gold; max rarity = epic
      const baseCost = count === 1 ? 500 : 4500
      const priceMult = getEventPriceMultiplier(state)
      const cost = Math.round(baseCost * priceMult)
      if (state.gold < cost) {
        toast.error("Không đủ vàng.")
        return
      }
      dispatch({ type: "ADD_GOLD", amount: -cost })
      const ids: string[] = []
      // Apply luck buff to gacha rates
      const luckPct = state.luckBuff ? [0, 0.25, 0.50, 0.75][state.luckBuff.tier] : 0
      const rates = luckPct > 0 ? applyLuckToRates(HERO_GACHA_RATES_GOLD, luckPct) : HERO_GACHA_RATES_GOLD
      for (let i = 0; i < count; i++) {
        let rarity = rollRarity(rates) as Rarity
        // 10-pull pity: guarantee at least rare on last pull if none rolled rare+
        const hasRarePlus = ids.some((id) => {
          const h = HEROES_BY_ID[id]; return h && rarityRank(h.rarity) >= 1
        })
        if (count === 10 && i === 9 && !hasRarePlus) {
          if (rarityRank(rarity) < 1) rarity = "rare"
        }
        const pool = HEROES_BY_RARITY[rarity] || []
        const tpl = pool[Math.floor(Math.random() * pool.length)]
        if (tpl) ids.push(tpl.id)
      }
      // Decrement luck buff rolls
      if (state.luckBuff) {
        const newRollsLeft = state.luckBuff.rollsLeft - count
        dispatch({ type: "SET_LUCK_BUFF_ROLLS", rollsLeft: Math.max(0, newRollsLeft) })
      }
      dispatch({ type: "ADD_HEROES", templateIds: ids })
      dispatch({ type: "QUEST_ON_RECRUIT", count: ids.length })
      const summary = ids
        .map((id) => HEROES_BY_ID[id])
        .map((h) => `${h.name} (${RARITY_LABEL[h.rarity]})`)
        .join(", ")
      toast.success(`Triệu hồi: ${summary}`)
    },
    [state.gold, state.activeEvents, state.luckBuff],
  )

  const digArtifact = useCallback(
    () => {
    const cost = 60
    if (state.gold < cost) {
      toast.error("Cần 60 vàng để đào.")
      return
    }
    dispatch({ type: "ADD_GOLD", amount: -cost })
    dispatch({ type: "INC_DIG" })
    const result = rollRarity(DIG_RATES)
    if (result === "nothing") {
      dispatch({ type: "PUSH_NOTIFY", text: "Đào trúng đất đá. Không có gì." })
      toast("Không tìm thấy gì có giá trị...", { icon: "🪨" })
      return
    }
    // Find an artifact item of that rarity
    const artifacts = Object.values(ITEMS_BY_ID).filter(
      (i) => i.kind === "artifact" && i.rarity === result,
    )
    const drop = artifacts[Math.floor(Math.random() * artifacts.length)]
    if (drop) {
      dispatch({ type: "ADD_ITEM", itemId: drop.id, quantity: 1 })
      toast.success(`Đào được ${drop.name}!`, {
        description: `${RARITY_LABEL[drop.rarity]} — ${drop.description}`,
      })
    }
  }, [state.gold])

  const buyItem = useCallback(
    (itemId: string) => {
      const item = ITEMS_BY_ID[itemId]
      if (!item) return
      const priceMult = getEventPriceMultiplier(state)
      const finalPrice = Math.round(item.basePrice * priceMult)
      if (state.gold < finalPrice) {
        toast.error("Không đủ vàng.")
        return
      }
      dispatch({ type: "ADD_GOLD", amount: -finalPrice })
      dispatch({ type: "ADD_ITEM", itemId, quantity: 1 })
      toast.success(`Mua thành công ${item.name}.`)
    },
    [state.gold, state.activeEvents],
  )

  const buyShopItem = useCallback(
    (kind: import("./types").ShopKind, itemIndex: number) => {
      const stock = state.shopStock?.[kind]
      if (!stock) return
      const si = stock.items[itemIndex]
      if (!si || si.stock <= 0) { toast.error("Hết hàng."); return }
      const item = ITEMS_BY_ID[si.itemId]
      if (!item) return
      const priceMult = getEventPriceMultiplier(state)
      const finalPrice = Math.round(item.basePrice * priceMult)
      if (state.gold < finalPrice) { toast.error("Không đủ vàng."); return }
      // Deduct the event-adjusted price directly (BUY_SHOP_ITEM uses basePrice internally, so we override via ADD_GOLD)
      dispatch({ type: "ADD_GOLD", amount: -finalPrice })
      dispatch({ type: "BUY_SHOP_ITEM_NO_GOLD", kind, itemIndex })
      toast.success(`Mua thành công ${item.name}.`)
    },
    [state.gold, state.shopStock, state.activeEvents],
  )

  const restockShop = useCallback(
    (kind: import("./types").ShopKind) => {
      dispatch({ type: "RESTOCK_SHOP", kind })
      toast.success("Cửa hàng đã được restocked!")
    },
    [],
  )

  const buyPremiumShopItem = useCallback((itemIndex: number) => {
    const stock = state.premiumShopStock
    if (!stock) return
    const si = stock.items[itemIndex]
    if (!si || si.stock <= 0) { toast.error("Hết hàng."); return }
    const tpl = ITEMS_BY_ID[si.itemId]
    if (!tpl) return
    if (state.gold < tpl.basePrice) { toast.error("Không đủ vàng!"); return }
    dispatch({ type: "BUY_PREMIUM_SHOP_ITEM", itemIndex })
    toast.success(`✨ Mua thành công: ${tpl.name}`)
  }, [state.premiumShopStock, state.gold])

  const restockPremiumShop = useCallback(() => {
    dispatch({ type: "RESTOCK_PREMIUM_SHOP" })
    toast.success("🌟 Cửa Hàng Huyền Bảo đã được làm mới!")
  }, [])

  const sellItem = useCallback((uid: string) => {
    const inv = state.inventory.find((i) => i.uid === uid)
    if (!inv) return
    const it = ITEMS_BY_ID[inv.itemId]
    dispatch({ type: "SELL_ITEM", uid })
    toast.success(`Đã bán ${it?.name} (+${Math.round((it?.basePrice || 0) * 0.4)}🪙)`)
  }, [state.inventory])

  const useLuckPotion = useCallback((uid: string, tier: 1 | 2 | 3) => {
    const inv = state.inventory.find((i) => i.uid === uid)
    if (!inv || inv.quantity <= 0) return
    const labelMap = { 1: "Nhỏ (+25%)", 2: "Vừa (+50%)", 3: "Lớn (+75%)" }
    dispatch({ type: "USE_LUCK_POTION", uid, tier })
    toast.success(`✨ Thuốc May Mắn ${labelMap[tier]} đã kích hoạt! 100 lần roll tiếp theo được buff.`)
  }, [state.inventory])

  const setAutoSellRarities = useCallback((rarities: Rarity[]) => {
    dispatch({ type: "SET_AUTO_SELL_RARITIES", rarities })
  }, [])

  const equipBest = useCallback((heroUid: string) => {
    const owned = state.heroes.find((h) => h.uid === heroUid)
    if (!owned) return
    // Pick best item per slot from inventory by simple stat sum
    const slots: EquipSlot[] = ["weapon", "armor", "trinket"]
    for (const slot of slots) {
      const candidates = state.inventory
        .map((i) => ITEMS_BY_ID[i.itemId])
        .filter((it): it is ItemTemplate => !!it && it.kind === "equip" && it.slot === slot)
      if (candidates.length === 0) continue
      const best = candidates.sort((a, b) => {
        const sumA = Object.values(a.stats || {}).reduce((x, y) => x + (y as number), 0)
        const sumB = Object.values(b.stats || {}).reduce((x, y) => x + (y as number), 0)
        return sumB - sumA
      })[0]
      dispatch({ type: "EQUIP_ITEM", heroUid, slot, itemId: best.id })
    }
    toast.success("Đã trang bị tự động.")
  }, [state.heroes, state.inventory])

  const startCombat = useCallback(() => {
    const filled = state.team.filter((u) => !!u)
    if (filled.length === 0) {
      toast.error("Hãy chọn ít nhất 1 anh hùng vào đội.")
      return
    }
    const teamRows = state.teamRows ?? []
    const hasFront = filled.some((_, i) => teamRows[i] === "front")
    if (!hasFront) {
      toast.error("Đội hình phải có ít nhất 1 tướng ở hàng trước!")
      return
    }
    dispatch({ type: "START_COMBAT" })
  }, [state.team, state.teamRows])

  const startWatchCombat = useCallback(() => {
    const filled = state.team.filter((u) => !!u)
    if (filled.length === 0) {
      toast.error("Hãy chọn ít nhất 1 anh hùng vào đội.")
      return
    }
    const teamRows = state.teamRows ?? []
    const hasFront = filled.some((_, i) => teamRows[i] === "front")
    if (!hasFront) {
      toast.error("Đội hình phải có ít nhất 1 tướng ở hàng trước!")
      return
    }
    dispatch({ type: "START_WATCH_COMBAT" })
  }, [state.team, state.teamRows])

  // ============================================================
  // Combat actions — drives the player turn, then advances AI
  // ============================================================

  const combatRef = useRef(state.combat)
  useEffect(() => { combatRef.current = state.combat }, [state.combat])



  const advanceTurn = useCallback((next: CombatState) => {
    // Front-row promotion: if all player front-row units are dead, back-row units step up
    {
      const playerFrontAlive = next.units.filter(u => u.side === "player" && u.row === "front" && u.hp > 0)
      const playerBackAlive  = next.units.filter(u => u.side === "player" && u.row === "back"  && u.hp > 0)
      if (playerFrontAlive.length === 0 && playerBackAlive.length > 0) {
        for (const u of playerBackAlive) { u.row = "front" }
        next.log.push({ id: uid(), text: "⚔ Hàng trước đã ngã! Hàng sau tiến lên chiến đấu!", kind: "info" })
      }
      // Same for enemy side
      const enemyFrontAlive = next.units.filter(u => u.side === "enemy" && u.row === "front" && u.hp > 0)
      const enemyBackAlive  = next.units.filter(u => u.side === "enemy" && u.row === "back"  && u.hp > 0)
      if (enemyFrontAlive.length === 0 && enemyBackAlive.length > 0) {
        for (const u of enemyBackAlive) { u.row = "front" }
        next.log.push({ id: uid(), text: "⚔ Hàng trước kẻ địch bị tiêu diệt! Hàng sau của chúng tiến lên!", kind: "info" })
      }
    }
    // FIX: increment global turn counter
    next.turn = (next.turn || 0) + 1
    // FIX: Check end immediately after any action (catches kills from damage/DoT)
    {
      const immediateEnd = checkEnded(next)
      if (immediateEnd) {
        next.ended = immediateEnd
        if (immediateEnd === "victory") {
          const rewards = computeRewards(next.stage)
          next.rewards = rewards
          next.log.push({ id: uid(), text: `🏆 Chiến thắng! +${rewards.gold}🪙 +${rewards.gems}💎 +${rewards.xp} XP`, kind: "victory" })
        } else {
          next.log.push({ id: uid(), text: "💀 Thất bại! Hãy huấn luyện và quay lại.", kind: "defeat" })
        }
        next.awaitingPlayerInput = false
        return next
      }
    }
    // Skip dead units, recompute order each round when needed
    let safety = 50
    while (safety-- > 0) {
      // Check end
      const ended = checkEnded(next)
      if (ended) {
        next.ended = ended
        if (ended === "victory") {
          const rewards = computeRewards(next.stage)
          next.rewards = rewards
          next.log.push({ id: uid(), text: `🏆 Chiến thắng! +${rewards.gold}🪙 +${rewards.gems}💎 +${rewards.xp} XP`, kind: "victory" })
        } else {
          next.log.push({ id: uid(), text: "💀 Thất bại! Hãy huấn luyện và quay lại.", kind: "defeat" })
        }
        next.awaitingPlayerInput = false
        return next
      }

      next.activeUnitIndex++
      // Recompute order if exhausted
      if (next.activeUnitIndex >= next.order.length) {
        next.round++
        // End of round end-of-turn processing for all alive units
        for (const u of next.units) {
          if (u.hp > 0) processEndOfTurn(next, u)
        }
        // Fire onAllyDeath for all player units when any player unit died this round
        const deadPlayers = next.units.filter(u => u.side === "player" && u.hp <= 0)
        if (deadPlayers.length > 0) {
          for (const u of next.units.filter(u2 => u2.side === "player" && u2.hp > 0)) {
            fireHook("onAllyDeath", next, u)
          }
        }
        // Fire onRoundEnd for all alive player units
        for (const u of next.units.filter(u2 => u2.side === "player" && u2.hp > 0)) {
          fireHook("onRoundEnd", next, u)
        }
        // FIX: Check end AFTER processEndOfTurn — DoT/poison can kill last enemy here
        const endedAfterDoT = checkEnded(next)
        if (endedAfterDoT) {
          next.ended = endedAfterDoT
          if (endedAfterDoT === "victory") {
            const rewards = computeRewards(next.stage)
            next.rewards = rewards
            next.log.push({ id: uid(), text: `🏆 Chiến thắng! +${rewards.gold}🪙 +${rewards.gems}💎 +${rewards.xp} XP`, kind: "victory" })
          } else {
            next.log.push({ id: uid(), text: "💀 Thất bại! Hãy huấn luyện và quay lại.", kind: "defeat" })
          }
          next.awaitingPlayerInput = false
          return next
        }
        // recompute order from alive units (use effectiveSpd if available)
        next.order = next.units
          .filter((u) => u.hp > 0)
          .slice()
          .sort((a, b) => b.stats.spd - a.stats.spd)
          .map((u) => u.uid)
        next.activeUnitIndex = 0
      }
      const cur = next.units.find((u) => u.uid === next.order[next.activeUnitIndex])
      if (!cur || cur.hp <= 0) {
        // Dead unit still in order — skip it and move to next
        next.activeUnitIndex++
        continue
      }

      // FIX: Stunned — tick stun AND cooldowns, then skip
      if (cur.statuses.some((s) => s.kind === "stun")) {
        next.log.push({ id: uid(), text: `${cur.name} đang choáng — bỏ lượt.`, kind: "info" })
        cur.statuses = cur.statuses
          .map((s) => (s.kind === "stun" ? { ...s, turns: s.turns - 1 } : s))
          .filter((s) => s.turns > 0)
        // FIX: still tick cooldowns so unit isn't frozen in cooldown while stunned
        cur.cooldowns = cur.cooldowns.map((cd) => Math.max(0, cd - 1)) as [number, number, number]
        next.activeUnitIndex++
        continue
      }

      // FIX: Grant energy at start of own turn (was missing — onUnitTurnStart was declared but never called)
      onUnitTurnStart(cur, next)

      next.awaitingPlayerInput = cur.side === "player"
      return next
    }
    return next
  }, [])

  // After applying an action, advance turn & schedule AI step if needed
  // Shared clone helper — avoids repeating the same deep-clone inline everywhere.
  // Only clones units array + unit statuses/cooldowns; log is spread-cloned once.
  const cloneCombat = useCallback((cs: CombatState): CombatState => ({
    ...cs,
    units: cs.units.map((u) => ({
      ...u,
      statuses: u.statuses.slice(),
      cooldowns: u.cooldowns.slice() as [number, number, number],
      itemPassives: u.itemPassives, // immutable ref, no clone needed
    })),
    log: cs.log, // append-only — share the reference; combat.ts always pushes
    order: cs.order.slice(),
  }), [])

  const stepAI = useCallback(
    (combat: CombatState) => {
      let next = cloneCombat(combat)
      let safetyLimit = 30

      let cur = next.units.find((u) => u.uid === next.order[next.activeUnitIndex]) ?? null
      // Watch mode: AI drives BOTH sides. Normal mode: enemy side only.
      while (
        cur &&
        (cur.side === "enemy" || next.watchMode) &&
        next.ended === null &&
        safetyLimit-- > 0
      ) {
        const action = aiChooseAction(next, cur)
        if (action.kind === "skill") {
          performSkill(next, cur, action.skillIndex, action.targetUid)
        } else {
          const target = action.targetUid
            ? next.units.find((u) => u.uid === action.targetUid)
            : undefined
          if (target) performBasicAttack(next, cur, target)
          else break
        }
        next = advanceTurn(next)
        // In watch mode never pause for player input
        if (next.watchMode) next.awaitingPlayerInput = false
        cur = next.units.find((u) => u.uid === next.order[next.activeUnitIndex]) ?? null
        // Watch mode: stop after ONE action so UI re-renders between each action
        if (next.watchMode) break
      }
      return next
    },
    [advanceTurn, cloneCombat],
  )
  const finishCombatRewards = useCallback(
    (combat: CombatState) => {
      const isTowerCombat = !!state.towerState
      if (combat.ended === "victory" && combat.rewards) {
        // Single atomic dispatch — no intermediate re-renders between reward steps
        const isWatchMode = !!combat.watchMode
        dispatch({ type: "BATCH_COMBAT_REWARDS", combat, isTowerCombat, isWatchMode })
        // Check if this victory triggers a new day (battlesWon+1 divisible by 5)
        const nextBattlesWon = state.battlesWon + 1
        if (!isTowerCombat && nextBattlesWon % 5 === 0) {
          const nextDay = (state.currentDay ?? 1) + 1
          // We roll events the same way as the reducer to predict what will happen
          // Just show a generic "new day" toast — actual events shown in the Event tab
          setTimeout(() => {
            const newDayEvents = (state as any)._pendingEvents // can't access yet, use generic toast
            toast.info(`🌅 Ngày ${nextDay} bắt đầu! Kiểm tra tab Sự Kiện.`, { duration: 4000 })
          }, 800)
        }
      } else if (combat.ended === "defeat" && isTowerCombat) {
        // Tower defeat: save record and end run
        dispatch({ type: "TOWER_GIVE_UP" })
        const floor = state.towerState?.floor ?? 0
        toast.error(`Đội hình bị tiêu diệt tại Tầng ${floor} 💀`)
      } else if (combat.ended === "defeat" && !isTowerCombat) {
        // Normal battle defeat: lose gold equal to the stage (can go negative, no cap)
        const basePenalty = 50 + combat.stage * 10
        const penaltyMult = getEventPenaltyMultiplier(state)
        const penalty = Math.round(basePenalty * penaltyMult)
        dispatch({ type: "APPLY_DEFEAT_PENALTY", goldLoss: penalty })
        const warNote = penaltyMult > 1 ? " (📈+25% do chiến tranh)" : ""
        toast.error(`Thất bại! Mất ${penalty.toLocaleString()}🪙 vàng!${warNote}`)
      } else if (combat.ended === "fled" && isTowerCombat) {
        dispatch({ type: "TOWER_GIVE_UP" })
      }
    },
    [state.towerState, state.battlesWon, state.currentDay, state.activeEvents],
  )

  // Run AI step when:
  // 1. Normal: enemy turn (awaitingPlayerInput = false)
  // 2. WatchMode: any turn (AI drives both sides)
  useEffect(() => {
    if (!state.combat || state.combat.ended) return
    const shouldStep = state.combat.watchMode
      ? true
      : !state.combat.awaitingPlayerInput
    if (!shouldStep) return
    const delay = state.combat.watchMode ? 1200 : 50
    const timer = setTimeout(() => {
      const current = combatRef.current
      if (!current || current.ended) return
      if (!current.watchMode && current.awaitingPlayerInput) return
      const next = stepAI(current)
      if (next.watchMode && !next.ended) next.awaitingPlayerInput = false
      // Use startTransition so combat re-renders are lower priority than user input
      startTransition(() => {
        dispatch({ type: "SET_COMBAT", state: next })
        if (next.ended) finishCombatRewards(next)
      })
    }, delay)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.combat?.awaitingPlayerInput, state.combat?.activeUnitIndex, state.combat?.round, state.combat?.watchMode])

  const combatChooseSkill = useCallback(
    (skillIndex: 0 | 1 | 2, targetUid: string | null) => {
      const combat = combatRef.current
      if (!combat || combat.ended || !combat.awaitingPlayerInput) return
      const cur = combat.units.find((u) => u.uid === combat.order[combat.activeUnitIndex])
      if (!cur || cur.side !== "player") return
      if (cur.cooldowns[skillIndex] > 0) {
        toast.warning(`${cur.skills[skillIndex].name} còn ${cur.cooldowns[skillIndex]} lượt cooldown.`)
        return
      }
      let next: CombatState = cloneCombat(combat)
      const liveCur = next.units.find((u) => u.uid === cur.uid)!
      // Resolve row intercept for player single-target skills
      const resolvedTarget = targetUid ? resolvePlayerTarget(targetUid, liveCur.role, next.units) : targetUid
      performSkill(next, liveCur, skillIndex, resolvedTarget)
      next = advanceTurn(next)
      next = stepAI(next)
      dispatch({ type: "SET_COMBAT", state: next })
      if (next.ended) finishCombatRewards(next)
    },
    [advanceTurn, stepAI, finishCombatRewards],
  )

  const combatBasicAttack = useCallback(
    (targetUid: string) => {
      const combat = combatRef.current
      if (!combat || combat.ended || !combat.awaitingPlayerInput) return
      const cur = combat.units.find((u) => u.uid === combat.order[combat.activeUnitIndex])
      if (!cur || cur.side !== "player") return
      let next: CombatState = cloneCombat(combat)
      const liveCur = next.units.find((u) => u.uid === cur.uid)!
      // Resolve row intercept for player basic attacks
      const resolvedTargetUid = resolvePlayerTarget(targetUid, liveCur.role, next.units)
      const target = next.units.find((u) => u.uid === resolvedTargetUid)
      if (!target) return
      performBasicAttack(next, liveCur, target)
      next = advanceTurn(next)
      next = stepAI(next)
      dispatch({ type: "SET_COMBAT", state: next })
      if (next.ended) finishCombatRewards(next)
    },
    [advanceTurn, stepAI, finishCombatRewards],
  )

  const combatUsePotion = useCallback(
    (inventoryItemUid: string, targetUid: string) => {
      const combat = combatRef.current
      if (!combat || combat.ended || !combat.awaitingPlayerInput) return
      const cur = combat.units.find((u) => u.uid === combat.order[combat.activeUnitIndex])
      if (!cur || cur.side !== "player") return
      let next: CombatState = cloneCombat(combat)
      const result = consumePotionInCombat(next, inventoryItemUid, targetUid, state.inventory)
      if (!result.ok) {
        toast.error("Không thể dùng bình thuốc.")
        return
      }
      // FIX: removed intermediate SET_COMBAT dispatch that caused state desync.
      // Only decrement inventory, then dispatch final advanced state once.
      dispatch({ type: "REMOVE_ITEM", uid: inventoryItemUid, quantity: 1 })
      // Advance turn + AI in one pass
      let advanced = advanceTurn(next)
      advanced = stepAI(advanced)
      dispatch({ type: "SET_COMBAT", state: advanced })
      if (advanced.ended) finishCombatRewards(advanced)
    },
    [advanceTurn, stepAI, finishCombatRewards, state.inventory],
  )

  const combatFlee = useCallback(() => {
    const combat = combatRef.current
    if (!combat) return
    const next = { ...combat, ended: "fled" as const }
    next.log.push({ id: uid(), text: "🏃 Bạn đã bỏ chạy khỏi trận đấu.", kind: "info" })
    dispatch({ type: "SET_COMBAT", state: next })
    // Penalty: lose some gold
    dispatch({ type: "ADD_GOLD", amount: -Math.min(state.gold, 50) })
    toast.warning("Bạn đã bỏ chạy. -50🪙")
  }, [state.gold])

  const combatSkipTurn = useCallback(() => {
    const combat = combatRef.current
    if (!combat || combat.ended || !combat.awaitingPlayerInput) return
    const cur = combat.units.find((u) => u.uid === combat.order[combat.activeUnitIndex])
    if (!cur || cur.side !== "player") return
    let next: CombatState = cloneCombat(combat)
    const liveCur = next.units.find((u) => u.uid === cur.uid)!
    next.log.push({ id: uid(), text: `${liveCur.name} bỏ qua lượt.`, kind: "info" })
    next = advanceTurn(next)
    next = stepAI(next)
    dispatch({ type: "SET_COMBAT", state: next })
    if (next.ended) finishCombatRewards(next)
  }, [advanceTurn, stepAI, finishCombatRewards, cloneCombat])

  const resetGame = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(getStorageKey())
    dispatch({ type: "RESET" })
    toast.success("Đã reset game.")
  }, [])

  const resetHeroSkills = useCallback((uid: string) => {
    const hero = state.heroes.find((h) => h.uid === uid)
    if (!hero) return
    const totalSkillPoints = hero.skillLevels.reduce((sum, lv) => sum + (lv - 1), 0)
    const cost = 2000 + totalSkillPoints * 500
    if (state.gold < cost) { toast.error(`Không đủ vàng. Cần ${cost.toLocaleString()}🪙`); return }
    dispatch({ type: "RESET_HERO_SKILLS", uid })
    toast.success(`Đã reset điểm kỹ năng (-${cost.toLocaleString()}🪙). Hoàn lại ${totalSkillPoints} điểm.`)
  }, [state.heroes, state.gold])

  const resetPlayerStats = useCallback(() => {
    const s = state.playerStats
    const totalSpent = Math.round(
      s.attackBonus / 4 + s.defenseBonus / 4 + s.hpBonus / 30 +
      s.magicBonus / 5 + s.speedBonus / 2 + s.critBonus
    )
    const GOLD_COST = 10000
    const GEM_COST = 1000
    if (state.gold < GOLD_COST) { toast.error(`Không đủ vàng. Cần ${GOLD_COST.toLocaleString()}🪙`); return }
    if (state.gems < GEM_COST) { toast.error(`Không đủ đá quý. Cần ${GEM_COST.toLocaleString()}💎`); return }
    dispatch({ type: "RESET_PLAYER_STATS" })
    toast.success(`Đã reset chỉ số (-${GOLD_COST.toLocaleString()}🪙 -${GEM_COST.toLocaleString()}💎). Hoàn lại ${totalSpent} điểm chỉ số.`)
  }, [state.playerStats, state.gold, state.gems])

  const unlockHeroSkill = useCallback((uid: string, skillId: string) => {
    dispatch({ type: "UNLOCK_HERO_SKILL", uid, skillId })
  }, [])

  const setTeamRow = useCallback((slot: number, row: BattleRow) => {
    dispatch({ type: "SET_TEAM_ROW", slot, row })
  }, [])

  const rollShardsWithGems = useCallback(() => {
    if (state.gems < 50) { toast.error("Cần 50 💎 để tung cầu phúc!"); return }
    dispatch({ type: "ROLL_SHARDS_GEMS" })
    // Luck bonus: +1/+2/+3 bonus shards based on tier
    if (state.luckBuff && state.luckBuff.rollsLeft > 0) {
      const bonusShards = state.luckBuff.tier // tier 1→+1, tier 2→+2, tier 3→+3
      // Split bonus evenly between blessing and pact
      dispatch({ type: "ADD_BLESSING_SHARDS", amount: Math.ceil(bonusShards / 2) })
      dispatch({ type: "ADD_PACT_SHARDS", amount: Math.floor(bonusShards / 2) })
      const newRollsLeft = state.luckBuff.rollsLeft - 1
      dispatch({ type: "SET_LUCK_BUFF_ROLLS", rollsLeft: Math.max(0, newRollsLeft) })
    }
    toast.success("Tung cầu phúc thành công!")
  }, [state.gems, state.luckBuff])

  const rollShardsWithGold = useCallback(() => {
    if (state.gold < 1000) { toast.error("Cần 1000 🪙 để tung cầu phúc!"); return }
    dispatch({ type: "ROLL_SHARDS_GOLD" })
    // Luck bonus shards
    if (state.luckBuff && state.luckBuff.rollsLeft > 0) {
      const bonusShards = state.luckBuff.tier
      dispatch({ type: "ADD_BLESSING_SHARDS", amount: Math.ceil(bonusShards / 2) })
      dispatch({ type: "ADD_PACT_SHARDS", amount: Math.floor(bonusShards / 2) })
      const newRollsLeft = state.luckBuff.rollsLeft - 1
      dispatch({ type: "SET_LUCK_BUFF_ROLLS", rollsLeft: Math.max(0, newRollsLeft) })
    }
    toast.success("Tung cầu phúc thành công!")
  }, [state.gold, state.luckBuff])

  const equipBlessingPact = useCallback((heroUid: string, blessingPactId: string) => {
    const bp = ALL_BLESSINGS_BY_ID[blessingPactId]
    if (!bp) return
    const shardKey = bp.kind === "blessing" ? "blessingShards" : "pactShards"
    const currentShards = (state[shardKey] ?? 0)
    if (currentShards < bp.shardCost) {
      toast.error(`Cần ${bp.shardCost} ${bp.kind === "blessing" ? "Mảnh Thiên Thần" : "Mảnh Ác Quỷ"}!`)
      return
    }
    // Check team uniqueness
    const teamUids = state.team.filter(Boolean) as string[]
    const conflict = state.heroes.find(h =>
      teamUids.includes(h.uid) && h.uid !== heroUid && h.blessingPactId === blessingPactId
    )
    if (conflict) {
      toast.error(`Không thể trang bị ${bp.name} cho 2 tướng trong đội!`)
      return
    }
    dispatch({ type: "EQUIP_BLESSING_PACT", heroUid, blessingPactId })
    toast.success(`${bp.name} đã được trang bị!`)
  }, [state.heroes, state.team, state.blessingShards, state.pactShards])

  const unequipBlessingPact = useCallback((heroUid: string) => {
    dispatch({ type: "UNEQUIP_BLESSING_PACT", heroUid })
    toast.success("Đã gỡ nội tại!")
  }, [])

  const towerStartRun = useCallback(() => {
    const filled = state.team.filter(u => !!u)
    if (filled.length === 0) {
      toast.error("Hãy chọn ít nhất 1 anh hùng vào đội.")
      return
    }
    dispatch({ type: "TOWER_START_RUN" })
  }, [state.team])

  const towerStartFloorCombat = useCallback(() => {
    dispatch({ type: "TOWER_START_FLOOR_COMBAT" })
  }, [])

  const towerGiveUp = useCallback(() => {
    const floor = state.towerState?.floor ?? 0
    const record = Math.max(state.towerRecord ?? 0, floor)
    dispatch({ type: "TOWER_GIVE_UP" })
    if (floor > 0) {
      dispatch({ type: "QUEST_ON_TOWER_FLOOR_CLEAR", floor })
    }
    toast.info(`Đã bỏ cuộc tại tầng ${floor}. Kỷ lục: Tầng ${record} 🗼`)
  }, [state.towerState, state.towerRecord])

  const towerContinue = useCallback(() => {
    const floor = state.towerState?.floor ?? 0
    dispatch({ type: "QUEST_ON_TOWER_FLOOR_CLEAR", floor })
    dispatch({ type: "TOWER_CONTINUE" })
  }, [state.towerState])

  // Stable actions object — only recreates when the action callbacks themselves change
  // (which happens infrequently, not on every state tick)
  const actions = useMemo(() => ({
    dispatch,
    rollHero,
    rollHeroGold,
    digArtifact,
    buyItem,
    buyShopItem,
    restockShop,
    buyPremiumShopItem,
    restockPremiumShop,
    sellItem,
    useLuckPotion,
    setAutoSellRarities,
    equipBest,
    startCombat,
    startWatchCombat,
    setTeamRow,
    combatChooseSkill,
    combatBasicAttack,
    combatUsePotion,
    combatFlee,
    combatSkipTurn,
    resetGame,
    resetHeroSkills,
    resetPlayerStats,
    unlockHeroSkill,
    rollShardsWithGems,
    rollShardsWithGold,
    equipBlessingPact,
    unequipBlessingPact,
    towerStartRun,
    towerStartFloorCombat,
    towerGiveUp,
    towerContinue,
  }), [
    rollHero, rollHeroGold, digArtifact, buyItem, buyShopItem, restockShop, buyPremiumShopItem, restockPremiumShop,
    sellItem, useLuckPotion, setAutoSellRarities, equipBest, startCombat, startWatchCombat, setTeamRow, combatChooseSkill,
    combatBasicAttack, combatUsePotion, combatFlee, combatSkipTurn, resetGame, resetHeroSkills,
    resetPlayerStats, unlockHeroSkill, rollShardsWithGems, rollShardsWithGold,
    equipBlessingPact, unequipBlessingPact, towerStartRun, towerStartFloorCombat,
    towerGiveUp, towerContinue,
  ])

  // Combined value for legacy useGame() — recreates on every state change (unavoidable for compat)
  const value = useMemo<GameContextValue>(
    () => ({ state, ...actions }),
    [state, actions],
  )

  // Split providers: ActionsContext is STABLE (actions only recreate when callbacks change, rarely)
  // StateContext updates every state change but components using useGameSelector avoid wasted renders
  return (
    <GameActionsContext.Provider value={actions}>
      <GameStateContext.Provider value={state}>
        <GameContext.Provider value={value}>{children}</GameContext.Provider>
      </GameStateContext.Provider>
    </GameActionsContext.Provider>
  )
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error("useGame must be used within GameProvider")
  return ctx
}

/**
 * Actions-only hook — NEVER causes re-renders from state changes.
 * Use this in components that only dispatch actions and don't read state.
 */
export function useGameActions(): GameActions {
  const ctx = useContext(GameActionsContext)
  if (!ctx) throw new Error("useGameActions must be used within GameProvider")
  return ctx
}

/**
 * Selector hook — subscribes only to the slice of state returned by `selector`.
 * Components using this won't re-render when unrelated parts of state change.
 * e.g. useGameSelector(s => s.gold) — only re-renders when gold changes.
 *
 * Uses Object.is comparison by default. Pass a custom `isEqual` for deep comparison.
 */
export function useGameSelector<T>(selector: (state: GameState) => T, isEqual?: (a: T, b: T) => boolean): T {
  const stateCtx = useContext(GameStateContext)
  if (!stateCtx) throw new Error("useGameSelector must be used within GameProvider")

  const selectorRef = useRef(selector)
  const isEqualRef = useRef(isEqual)
  selectorRef.current = selector
  isEqualRef.current = isEqual

  const prevRef = useRef<T>(selector(stateCtx))
  const selected = selector(stateCtx)

  // Only update ref if value actually changed (avoids stale closure issues)
  const eq = isEqualRef.current ?? Object.is
  if (!eq(prevRef.current, selected)) {
    prevRef.current = selected
  }

  return prevRef.current
}

// Re-export utilities used by UI
export { computeHeroStats, xpToNextLevel, playerXpToNextLevel }
export { RARITY_ORDER, RARITY_LABEL }
export { BLESSINGS, PACTS, ALL_BLESSINGS_BY_ID }

/** Full state — dùng cho cloud save. Prefer useGameSelector cho từng field. */
export function useGameState(): GameState {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error("useGameState must be used within GameProvider")
  return ctx
}

/** Dispatch LOAD action để restore save từ cloud. */
export function useLoadSave() {
  const ctx = useContext(GameActionsContext)
  if (!ctx) throw new Error("useLoadSave must be used within GameProvider")
  return (saveData: GameState) => {
    ctx.dispatch({ type: "LOAD", payload: saveData })
    // Re-init quests after cloud load so quest objectives reflect restored state
    setTimeout(() => ctx.dispatch({ type: "INIT_QUESTS" }), 50)
  }
}
