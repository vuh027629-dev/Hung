import type { PlayerStats, Stats } from "./types"

export type SkillTreeNode = {
  id: string
  name: string
  description: string
  branch: "warrior" | "arcane" | "shadow" | "guardian"
  tier: 1 | 2 | 3 | 4
  maxRank: number
  cost: number // skill points per rank
  requires?: string[] // node ids that must have at least 1 rank
  // Bonuses applied per rank to player stat
  apply: (rank: number, stats: PlayerStats) => PlayerStats
}

const inc = (key: keyof PlayerStats, perRank: number): SkillTreeNode["apply"] =>
  (rank, stats) => ({ ...stats, [key]: stats[key] + perRank * rank })

export const SKILL_TREE: SkillTreeNode[] = [
  // Branch: Warrior (atk + hp)
  { id: "war_atk1", name: "Sức Mạnh I", description: "+8 ATK mỗi cấp.", branch: "warrior", tier: 1, maxRank: 5, cost: 1, apply: inc("attackBonus", 8) },
  { id: "war_hp1", name: "Sức Bền I", description: "+60 HP mỗi cấp.", branch: "warrior", tier: 1, maxRank: 5, cost: 1, apply: inc("hpBonus", 60) },
  { id: "war_atk2", name: "Sức Mạnh II", description: "+16 ATK mỗi cấp.", branch: "warrior", tier: 2, maxRank: 5, cost: 2, requires: ["war_atk1"], apply: inc("attackBonus", 16) },
  { id: "war_def", name: "Cơ Bắp Thép", description: "+10 DEF mỗi cấp.", branch: "warrior", tier: 2, maxRank: 5, cost: 2, requires: ["war_hp1"], apply: inc("defenseBonus", 10) },
  { id: "war_master", name: "Bậc Thầy Vũ Khí", description: "+30 ATK & +5 Crit mỗi cấp. (combo: Sức Mạnh II)", branch: "warrior", tier: 3, maxRank: 3, cost: 3, requires: ["war_atk2", "war_def"], apply: (r, s) => ({ ...s, attackBonus: s.attackBonus + 30 * r, critBonus: s.critBonus + 5 * r }) },
  { id: "war_legend", name: "Truyền Thuyết Chiến Trường", description: "+60 ATK, +200 HP mỗi cấp.", branch: "warrior", tier: 4, maxRank: 1, cost: 5, requires: ["war_master"], apply: (r, s) => ({ ...s, attackBonus: s.attackBonus + 60 * r, hpBonus: s.hpBonus + 200 * r }) },

  // Branch: Arcane (mag)
  { id: "arc_mag1", name: "Trí Tuệ I", description: "+10 MAG mỗi cấp.", branch: "arcane", tier: 1, maxRank: 5, cost: 1, apply: inc("magicBonus", 10) },
  { id: "arc_spd", name: "Linh Hoạt", description: "+4 SPD mỗi cấp.", branch: "arcane", tier: 1, maxRank: 5, cost: 1, apply: inc("speedBonus", 4) },
  { id: "arc_mag2", name: "Trí Tuệ II", description: "+20 MAG mỗi cấp.", branch: "arcane", tier: 2, maxRank: 5, cost: 2, requires: ["arc_mag1"], apply: inc("magicBonus", 20) },
  { id: "arc_arch", name: "Đại Pháp Sư", description: "+45 MAG, +6 SPD mỗi cấp. (combo: Trí Tuệ II + Linh Hoạt)", branch: "arcane", tier: 3, maxRank: 3, cost: 3, requires: ["arc_mag2", "arc_spd"], apply: (r, s) => ({ ...s, magicBonus: s.magicBonus + 45 * r, speedBonus: s.speedBonus + 6 * r }) },
  { id: "arc_omniscient", name: "Toàn Tri", description: "+100 MAG mỗi cấp.", branch: "arcane", tier: 4, maxRank: 1, cost: 5, requires: ["arc_arch"], apply: inc("magicBonus", 100) },

  // Branch: Shadow (crit/spd)
  { id: "sha_crit1", name: "Sắc Bén", description: "+4 Crit mỗi cấp.", branch: "shadow", tier: 1, maxRank: 5, cost: 1, apply: inc("critBonus", 4) },
  { id: "sha_spd", name: "Tốc Đả", description: "+5 SPD mỗi cấp.", branch: "shadow", tier: 1, maxRank: 5, cost: 1, apply: inc("speedBonus", 5) },
  { id: "sha_crit2", name: "Hiểm Độc", description: "+8 Crit mỗi cấp.", branch: "shadow", tier: 2, maxRank: 5, cost: 2, requires: ["sha_crit1"], apply: inc("critBonus", 8) },
  { id: "sha_master", name: "Sát Thủ Bóng Đêm", description: "+12 Crit, +10 SPD mỗi cấp. (combo: Hiểm Độc + Tốc Đả)", branch: "shadow", tier: 3, maxRank: 3, cost: 3, requires: ["sha_crit2", "sha_spd"], apply: (r, s) => ({ ...s, critBonus: s.critBonus + 12 * r, speedBonus: s.speedBonus + 10 * r }) },
  { id: "sha_eternal", name: "Bóng Vĩnh Hằng", description: "+30 Crit và +30 SPD.", branch: "shadow", tier: 4, maxRank: 1, cost: 5, requires: ["sha_master"], apply: (r, s) => ({ ...s, critBonus: s.critBonus + 30 * r, speedBonus: s.speedBonus + 30 * r }) },

  // Branch: Guardian (hp/def)
  { id: "gua_hp1", name: "Bền Bỉ", description: "+80 HP mỗi cấp.", branch: "guardian", tier: 1, maxRank: 5, cost: 1, apply: inc("hpBonus", 80) },
  { id: "gua_def", name: "Vỏ Cứng", description: "+12 DEF mỗi cấp.", branch: "guardian", tier: 1, maxRank: 5, cost: 1, apply: inc("defenseBonus", 12) },
  { id: "gua_hp2", name: "Bền Bỉ II", description: "+160 HP mỗi cấp.", branch: "guardian", tier: 2, maxRank: 5, cost: 2, requires: ["gua_hp1"], apply: inc("hpBonus", 160) },
  { id: "gua_master", name: "Hộ Vệ Thiên Đường", description: "+250 HP, +20 DEF mỗi cấp. (combo: Bền Bỉ II + Vỏ Cứng)", branch: "guardian", tier: 3, maxRank: 3, cost: 3, requires: ["gua_hp2", "gua_def"], apply: (r, s) => ({ ...s, hpBonus: s.hpBonus + 250 * r, defenseBonus: s.defenseBonus + 20 * r }) },
  { id: "gua_eternal", name: "Bức Tường Vô Tận", description: "+500 HP và +60 DEF.", branch: "guardian", tier: 4, maxRank: 1, cost: 5, requires: ["gua_master"], apply: (r, s) => ({ ...s, hpBonus: s.hpBonus + 500 * r, defenseBonus: s.defenseBonus + 60 * r }) },
]

export const SKILL_TREE_BY_ID: Record<string, SkillTreeNode> =
  SKILL_TREE.reduce((acc, n) => ((acc[n.id] = n), acc), {} as Record<string, SkillTreeNode>)

export const BRANCH_LABEL: Record<SkillTreeNode["branch"], string> = {
  warrior: "Chiến Binh",
  arcane: "Tinh Thuật",
  shadow: "Bóng Đêm",
  guardian: "Hộ Vệ",
}

export const BRANCH_ICON_COLOR: Record<SkillTreeNode["branch"], string> = {
  warrior: "text-rarity-mythic",
  arcane: "text-rarity-rare",
  shadow: "text-rarity-epic",
  guardian: "text-rarity-legendary",
}

export function computePlayerStatsFromTree(nodes: Record<string, number>): PlayerStats {
  let stats: PlayerStats = {
    attackBonus: 0,
    defenseBonus: 0,
    hpBonus: 0,
    magicBonus: 0,
    speedBonus: 0,
    critBonus: 0,
  }
  for (const id in nodes) {
    const node = SKILL_TREE_BY_ID[id]
    if (!node) continue
    const rank = nodes[id]
    if (rank > 0) stats = node.apply(rank, stats)
  }
  return stats
}

export function canLearnNode(node: SkillTreeNode, currentNodes: Record<string, number>): boolean {
  if (!node.requires) return true
  return node.requires.every((r) => (currentNodes[r] || 0) >= 1)
}
