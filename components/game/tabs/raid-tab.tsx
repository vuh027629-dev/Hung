"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useGame, computeHeroStats } from "@/lib/game/store"
import { HEROES_BY_ID } from "@/lib/game/heroes"
import { PASSIVES, SKILLS, SKILL_EVOLUTION_MAP } from "@/lib/game/skills"
import { ITEMS_BY_ID } from "@/lib/game/items"
import { RARITY_STAT_MULT } from "@/lib/game/rarity"
import {
  performSkill,
  performBasicAttack,
  processEndOfTurn,
  onUnitTurnStart,
  aiChooseAction,
} from "@/lib/game/combat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Skull, Sword, Shield, Zap, Sparkles, Heart, Crosshair,
  Star, Swords, Users, Flame, Snowflake, EyeOff, Droplets,
  Bug, Play, Pause, RotateCcw, Info,
} from "lucide-react"
import type {
  BattleUnit, CombatState, CombatLogEntry,
  OwnedHero, Stats, ItemPassive, Skill, SkillEffect,
} from "@/lib/game/types"

// ─────────────────────────────────────────────────────────────
// BOSS SKILL & PASSIVE POOLS
// ─────────────────────────────────────────────────────────────

// Each BossSkillDef maps to a real Skill object the engine can execute
interface BossSkillDef {
  id: string
  name: string
  description: string
  cooldown: number
  targeting: Skill["targeting"]
  effects: SkillEffect[]
  tags: string[]      // for display / theming
  element?: string
}

interface BossPassiveDef {
  id: string
  name: string
  description: string
  // Stat modifiers applied at unit build time
  modifier?: Partial<Stats>
  // Special engine behaviour handled in raid tick
  signatureId?: string
}

// ── Skill pool (boss can draw from these) ─────────────────────
const BOSS_SKILL_POOL: BossSkillDef[] = [
  // ── Basic attacks ──
  { id:"b_smash",       name:"Nghiền Nát",         description:"Giáng đòn vật lý 140% ATK lên 1 mục tiêu.",       cooldown:0, targeting:"enemy",       effects:[{damage:{scale:1.4,stat:"atk",type:"physical"}}],                                                                          tags:["physical","single"] },
  { id:"b_cleave",      name:"Chém Vòng Cung",      description:"Chém tất cả 80% ATK.",                             cooldown:2, targeting:"all-enemies", effects:[{damage:{scale:0.8,stat:"atk",type:"physical"}}],                                                                          tags:["physical","aoe"] },
  { id:"b_void_bolt",   name:"Tia Hư Không",        description:"Phóng tia pháp 130% MAG lên 1 mục tiêu.",         cooldown:0, targeting:"enemy",       effects:[{damage:{scale:1.3,stat:"mag",type:"magic"}}],                                                                             tags:["magic","single"] },
  { id:"b_nova",        name:"Bùng Nổ Phép Thuật",  description:"Nổ pháp khắp chiến trường 75% MAG.",              cooldown:3, targeting:"all-enemies", effects:[{damage:{scale:0.75,stat:"mag",type:"magic"}}],                                                                            tags:["magic","aoe"] },

  // ── Debuff ──
  { id:"b_terrify",     name:"Khiến Khiếp Sợ",      description:"Giảm ATK 30% tất cả anh hùng trong 3 lượt.",      cooldown:3, targeting:"all-enemies", effects:[{status:{kind:"atkDown",value:30,turns:3,name:"Sợ Hãi",target:"all-enemies"}}],                                           tags:["debuff","aoe"] },
  { id:"b_weaken",      name:"Làm Yếu",             description:"Giảm DEF 25% 1 mục tiêu trong 3 lượt.",           cooldown:2, targeting:"enemy",       effects:[{status:{kind:"defDown",value:25,turns:3,name:"Yếu Đuối"}}],                                                              tags:["debuff","single"] },
  { id:"b_slow",        name:"Trì Hoãn",            description:"Giảm SPD 40% tất cả anh hùng trong 2 lượt.",      cooldown:4, targeting:"all-enemies", effects:[{status:{kind:"spdDown",value:40,turns:2,name:"Chậm Lại",target:"all-enemies"}}],                                        tags:["debuff","aoe"] },
  { id:"b_stun_strike", name:"Đòn Choáng",          description:"100% ATK + choáng 1 lượt (60%).",                 cooldown:3, targeting:"enemy",       effects:[{damage:{scale:1.0,stat:"atk",type:"physical"}},{status:{kind:"stun",value:1,turns:1,name:"Choáng"}}],                    tags:["physical","stun","single"] },
  { id:"b_blind_wave",  name:"Màn Sương Mù",        description:"Phủ mù lên tất cả trong 2 lượt + 60% MAG.",       cooldown:4, targeting:"all-enemies", effects:[{damage:{scale:0.6,stat:"mag",type:"magic"}},{status:{kind:"spdDown",value:20,turns:2,name:"Mù Quáng",target:"all-enemies"}}], tags:["magic","debuff","aoe"] },

  // ── DoT ──
  { id:"b_ignite",      name:"Thiêu Đốt",           description:"Đốt cháy tất cả 3 lượt + 60% ATK.",               cooldown:3, targeting:"all-enemies", effects:[{damage:{scale:0.6,stat:"atk",type:"physical"}},{status:{kind:"burn",value:0.12,turns:3,name:"Bỏng Lửa",target:"all-enemies"}}], tags:["fire","dot","aoe"] },
  { id:"b_poison_mist", name:"Sương Độc",           description:"Đầu độc tất cả 4 lượt.",                          cooldown:4, targeting:"all-enemies", effects:[{status:{kind:"poison",value:0.1,turns:4,name:"Độc",target:"all-enemies"}}],                                              tags:["poison","dot","aoe"] },
  { id:"b_bleed_rake",  name:"Cào Xé",              description:"Gây chảy máu 3 lượt + 110% ATK.",                 cooldown:2, targeting:"enemy",       effects:[{damage:{scale:1.1,stat:"atk",type:"physical"}},{status:{kind:"bleed",value:0.15,turns:3,name:"Chảy Máu"}}],             tags:["physical","dot","single"] },

  // ── Self-buff ──
  { id:"b_enrage",      name:"Cuồng Nộ",            description:"Tăng ATK bản thân 40% trong 3 lượt.",             cooldown:5, targeting:"self",        effects:[{status:{kind:"atkUp",value:40,turns:3,name:"Cuồng Nộ"}}],                                                                tags:["buff","self"] },
  { id:"b_iron_skin",   name:"Da Thép",              description:"Tăng DEF bản thân 50% và hồi khiên 20% HP.",     cooldown:5, targeting:"self",        effects:[{status:{kind:"defUp",value:50,turns:3,name:"Da Thép"}},{status:{kind:"shield",value:0.20,turns:3,name:"Khiên Thép"}}],  tags:["buff","self","tank"] },
  { id:"b_berserk",     name:"Điên Cuồng",          description:"Tăng tốc 50% + ATK 30% trong 2 lượt.",           cooldown:6, targeting:"self",        effects:[{status:{kind:"spdUp",value:50,turns:2,name:"Điên Cuồng"}},{status:{kind:"atkUp",value:30,turns:2,name:"Điên Cuồng 2"}}], tags:["buff","self"] },

  // ── Heavy hitters ──
  { id:"b_meteor",      name:"Thiên Thạch Rơi",     description:"Pháp tuyệt kỹ 200% MAG lên tất cả.",              cooldown:6, targeting:"all-enemies", effects:[{damage:{scale:2.0,stat:"mag",type:"magic"}}],                                                                            tags:["magic","aoe","heavy"] },
  { id:"b_execute",     name:"Phán Quyết Tử Vong",  description:"250% ATK lên 1 mục tiêu. Sát thương thật.",       cooldown:6, targeting:"enemy",       effects:[{damage:{scale:2.5,stat:"atk",type:"true"}}],                                                                             tags:["true","single","heavy"] },
  { id:"b_earthquake",  name:"Địa Chấn",            description:"120% ATK lên tất cả + giảm DEF 20% 2 lượt.",     cooldown:5, targeting:"all-enemies", effects:[{damage:{scale:1.2,stat:"atk",type:"physical"}},{status:{kind:"defDown",value:20,turns:2,name:"Nứt Giáp",target:"all-enemies"}}], tags:["physical","aoe","debuff"] },
  { id:"b_soul_drain",  name:"Hút Hồn",             description:"160% MAG + hồi 30% sát thương gây ra.",           cooldown:4, targeting:"enemy",       effects:[{damage:{scale:1.6,stat:"mag",type:"magic"}}],                                                                            tags:["magic","single","lifesteal"] },
  { id:"b_void_rift",   name:"Vết Nứt Hư Không",   description:"80% ATK thật lên tất cả + choáng ngẫu nhiên.",   cooldown:5, targeting:"all-enemies", effects:[{damage:{scale:0.8,stat:"atk",type:"true"}},{status:{kind:"stun",value:1,turns:1,name:"Chấn Động"}}],                    tags:["true","aoe","stun"] },

  // ── Multi-hit ──
  { id:"b_barrage",     name:"Hỏa Lực Liên Hoàn",  description:"4 đòn liên tiếp mỗi đòn 50% ATK.",               cooldown:4, targeting:"enemy",       effects:[{damage:{scale:0.5,stat:"atk",type:"physical",hits:4}}],                                                                  tags:["physical","multi","single"] },
  { id:"b_storm_slash", name:"Kiếm Bão Tố",         description:"3 đòn pháp mỗi đòn 55% MAG.",                    cooldown:3, targeting:"enemy",       effects:[{damage:{scale:0.55,stat:"mag",type:"magic",hits:3}}],                                                                    tags:["magic","multi","single"] },
]

// ── Passive pool ──────────────────────────────────────────────
const BOSS_PASSIVE_POOL: BossPassiveDef[] = [
  { id:"p_wrath",       name:"Cuồng Nộ Bất Tử",     description:"ATK tăng 20% khi HP dưới 50%.",             signatureId:"boss_rage" },
  { id:"p_regen",       name:"Hồi Sinh Bóng Tối",   description:"Hồi 3% MaxHP mỗi lượt.",                   signatureId:"boss_regen" },
  { id:"p_armor",       name:"Vảy Thép",             description:"DEF tăng thêm 30%.",                       modifier:{def:0.30} },
  { id:"p_swift",       name:"Tốc Biến",             description:"SPD tăng 25%.",                            modifier:{spd:0.25} },
  { id:"p_thorns",      name:"Gai Độc",              description:"Phản 15% sát thương nhận về.",             signatureId:"boss_thorns" },
  { id:"p_crit",        name:"Mắt Thần",             description:"Crit Rate tăng 20%, Crit DMG tăng 50%.",   modifier:{crit:20,critDmg:50} },
  { id:"p_lifesteal",   name:"Hút Máu",              description:"Hút 20% sát thương gây ra.",               modifier:{lifesteal:20} },
  { id:"p_aoe_mastery", name:"Bá Chủ Vùng Rộng",    description:"Sát thương AoE tăng 30%.",                 signatureId:"boss_aoe_bonus" },
  { id:"p_undying",     name:"Bất Tử Lần 1",        description:"Lần đầu HP về 0: sống sót với 1 HP.",      signatureId:"boss_undying" },
  { id:"p_enrage_low",  name:"Phẫn Nộ Cuối Cùng",   description:"Dưới 30% HP: hành động 2 lần/lượt.",      signatureId:"boss_double_turn" },
  { id:"p_magic_armor", name:"Kháng Phép",           description:"RES tăng 40%.",                            modifier:{res:0.40} },
  { id:"p_berserker",   name:"Chiến Binh Điên",      description:"Mỗi lượt ATK tăng thêm 5% (max 50%).",    signatureId:"boss_scaling" },
  { id:"p_execute",     name:"Hành Quyết",           description:"Sát thương tăng 50% lên mục tiêu dưới 25% HP.", signatureId:"boss_execute_bonus" },
  { id:"p_phase_shift", name:"Chuyển Dịch Pha",      description:"Mỗi phase đổi: hồi 15% MaxHP.",           signatureId:"boss_phase_heal" },
  { id:"p_immunity",    name:"Miễn Dịch",            description:"Miễn nhiễm choáng và chậm.",              signatureId:"boss_cc_immune" },
]

// ─────────────────────────────────────────────────────────────
// GENERATED BOSS TYPE
// ─────────────────────────────────────────────────────────────
interface BossPhase {
  phaseNumber: number
  hpThreshold: number
  description: string
  auraColor: string
}

interface GeneratedBoss {
  name: string
  title: string
  lore: string
  element: string
  rarity: "Normal" | "Elite" | "Legendary" | "Mythic"
  floor: number
  baseStats: { hp: number; atk: number; def: number; spd: number; critRate: number; critDmg: number }
  phases: BossPhase[]
  skillIds: string[]         // ids from BOSS_SKILL_POOL
  passiveIds: string[]       // ids from BOSS_PASSIVE_POOL
  spawnSize: 1 | 2
  lore_skills: string        // how AI themed the skill set
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const FLOOR_MULT = (f: number) => 1 + (f - 1) * 0.18
const ENERGY_MAX = 100

const STATUS_META: Record<string, { color: string; icon: React.FC<{ className?: string }>; label: string }> = {
  stun:    { color:"text-yellow-400", icon:Zap,       label:"Choáng" },
  blind:   { color:"text-indigo-400", icon:EyeOff,    label:"Mù" },
  poison:  { color:"text-green-400",  icon:Bug,        label:"Độc" },
  burn:    { color:"text-orange-400", icon:Flame,      label:"Cháy" },
  freeze:  { color:"text-cyan-400",   icon:Snowflake,  label:"Băng" },
  bleed:   { color:"text-pink-400",   icon:Droplets,   label:"Chảy Máu" },
  curse:   { color:"text-purple-400", icon:Skull,      label:"Nguyền" },
  defDown: { color:"text-red-400",    icon:Shield,     label:"Giảm DEF" },
  atkDown: { color:"text-orange-300", icon:Sword,      label:"Giảm ATK" },
  spdDown: { color:"text-blue-300",   icon:Snowflake,  label:"Chậm" },
  atkUp:   { color:"text-red-300",    icon:Sword,      label:"Tăng ATK" },
  defUp:   { color:"text-blue-300",   icon:Shield,     label:"Tăng DEF" },
  spdUp:   { color:"text-green-300",  icon:Zap,        label:"Tăng SPD" },
  regen:   { color:"text-emerald-400",icon:Heart,      label:"Hồi Máu" },
  shield:  { color:"text-sky-300",    icon:Shield,     label:"Khiên" },
}

const BOSS_RARITY_STYLE: Record<string, { badge: string; text: string }> = {
  Normal:    { badge:"bg-slate-500/20 text-slate-300 border-slate-500/50",    text:"text-slate-300"  },
  Elite:     { badge:"bg-blue-500/20 text-blue-300 border-blue-500/50",       text:"text-blue-300"   },
  Legendary: { badge:"bg-yellow-500/20 text-yellow-300 border-yellow-500/50", text:"text-yellow-300" },
  Mythic:    { badge:"bg-pink-500/20 text-pink-300 border-pink-500/50",       text:"text-pink-300"   },
}

const ELEMENT_EMOJI: Record<string, string> = {
  fire:"🔥", ice:"❄️", lightning:"⚡", shadow:"🌑", poison:"☠️", holy:"✨", chaos:"🌀",
}

const ROLE_ICON: Record<string, React.FC<{ className?: string }>> = {
  warrior:Sword, assassin:Zap, mage:Sparkles, marksman:Crosshair, tank:Shield, support:Heart,
}

const LOG_COLOR: Record<string, string> = {
  damage:"text-red-300", heal:"text-green-400", status:"text-purple-300",
  info:"text-blue-300", system:"text-yellow-400", victory:"text-yellow-400", defeat:"text-red-400",
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const ruid = () => Math.random().toString(36).slice(2, 9)

function emptyStats(): Stats {
  return { hp:0,atk:0,mag:0,def:0,res:0,spd:0,crit:0,critDmg:0,acc:0,eva:0,lifesteal:0 }
}
function addStats(a: Stats, b: Partial<Stats>): Stats {
  const out = { ...a }
  for (const k in b) { const key=k as keyof Stats; out[key]=(out[key]||0)+(b[key]||0) }
  return out
}
function multiplyStatsByPct(base: Stats, pct: Partial<Stats>): Stats {
  const out = { ...base }
  for (const k in pct) {
    const key=k as keyof Stats; const mult=pct[key]||0
    if (["crit","critDmg","acc","eva","lifesteal"].includes(key)) out[key]=(out[key]||0)+mult
    else out[key]=Math.round((out[key]||0)*(1+mult))
  }
  return out
}

function buildPlayerUnit(owned: OwnedHero, playerBonuses: Partial<Stats>={}): BattleUnit {
  const tpl = HEROES_BY_ID[owned.templateId]
  if (!tpl) throw new Error("Unknown template")
  const lvl = owned.level
  const mult = RARITY_STAT_MULT[tpl.rarity]
  let stats = emptyStats()
  for (const key in tpl.baseStats) {
    const k=key as keyof Stats
    const base=(tpl.baseStats as Stats)[k]||0
    const grow=(tpl.growth as Stats)[k]||0
    stats[k]=Math.round((base+grow*(lvl-1))*mult)
  }
  for (const slot of ["weapon","armor","trinket"] as const) {
    const itemId=owned.equipment[slot]; if(!itemId) continue
    const item=ITEMS_BY_ID[itemId]; if(!item?.stats) continue
    stats=addStats(stats,item.stats)
  }
  const sLvlSum=owned.skillLevels.reduce((a,b)=>a+b,0)
  if (tpl.role==="mage"||tpl.role==="support") stats.mag=Math.round(stats.mag*(1+sLvlSum*0.01))
  else stats.atk=Math.round(stats.atk*(1+sLvlSum*0.01))
  stats=addStats(stats,playerBonuses)
  const passive=PASSIVES[tpl.passive]
  if (passive?.modifier) stats=multiplyStatsByPct(stats,passive.modifier as Partial<Stats>)
  const itemPassives: ItemPassive[]=[]
  for (const slot of ["weapon","armor","trinket"] as const) {
    const itemId=owned.equipment[slot]; if(!itemId) continue
    const item=ITEMS_BY_ID[itemId]; if(item?.passive) itemPassives.push(item.passive)
  }
  const hpMax=stats.hp
  return {
    uid:ruid(), side:"player", templateId:tpl.id, name:tpl.name,
    rarity:tpl.rarity, range:tpl.range, role:tpl.role, origins:tpl.origins,
    level:owned.level, hp:hpMax, hpMax, energy:0, energyMax:ENERGY_MAX, stats,
    skills:tpl.skills.map((sid,i)=>{
      const lvl=owned.skillLevels[i]
      const evoId=SKILL_EVOLUTION_MAP[sid]
      const useId=lvl>=5&&evoId?evoId:sid
      return SKILLS[useId]??SKILLS[sid]
    }),
    skillLevels:[...owned.skillLevels] as [number,number,number],
    passiveId:tpl.passive, cooldowns:[0,0,0], statuses:[],
    build:tpl.build, synergyText:[], itemPassives,
  }
}

function buildBossUnit(boss: GeneratedBoss): BattleUnit {
  const skillDefs = boss.skillIds.map(id=>BOSS_SKILL_POOL.find(s=>s.id===id)).filter(Boolean) as BossSkillDef[]
  while (skillDefs.length < 3) skillDefs.push(BOSS_SKILL_POOL[0])
  const skills3 = skillDefs.slice(0,3).map(def=>({
    id:def.id, name:def.name, description:def.description,
    cooldown:def.cooldown, targeting:def.targeting,
    effects:def.effects, tier:1 as const,
  })) as [Skill,Skill,Skill]

  // Apply passive modifiers
  let stats: Stats = {
    hp:boss.baseStats.hp, atk:boss.baseStats.atk, mag:Math.floor(boss.baseStats.atk*0.85),
    def:boss.baseStats.def, res:Math.floor(boss.baseStats.def*0.7),
    spd:boss.baseStats.spd, crit:Math.round(boss.baseStats.critRate*100),
    critDmg:Math.round(boss.baseStats.critDmg*100),
    acc:100, eva:5, lifesteal:0,
  }
  for (const pid of boss.passiveIds) {
    const p=BOSS_PASSIVE_POOL.find(x=>x.id===pid)
    if (p?.modifier) stats=multiplyStatsByPct(stats,p.modifier)
  }

  return {
    uid:"boss-"+ruid(), side:"enemy", templateId:"boss", name:boss.name,
    rarity:"mythic" as any, range:"melee", role:"warrior", origins:[],
    level:boss.floor, hp:stats.hp, hpMax:stats.hp, energy:0, energyMax:ENERGY_MAX, stats,
    skills:skills3, skillLevels:[1,1,1], passiveId:"",
    cooldowns:[0,0,0], statuses:[],
    build:"atk", synergyText:[], itemPassives:[],
  }
}

// ─────────────────────────────────────────────────────────────
// AI GENERATOR
// ─────────────────────────────────────────────────────────────
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled=[...arr].sort(()=>Math.random()-0.5)
  return shuffled.slice(0,n)
}

// Weight skills by floor/element/rarity — called locally, no AI needed for skill selection
function pickBossSkills(floor: number, element: string, rarity: string): string[] {
  // Skill counts by rarity
  const count = rarity==="Mythic"?4:rarity==="Legendary"?4:rarity==="Elite"?3:3

  // Basic attack (always 1)
  const basicPool = element==="fire"||element==="lightning"||element==="holy"
    ? BOSS_SKILL_POOL.filter(s=>s.tags.includes("magic")&&s.tags.includes("single"))
    : BOSS_SKILL_POOL.filter(s=>s.tags.includes("physical")&&s.tags.includes("single"))
  const basic = pickRandom(basicPool,1)

  // AoE (always 1)
  const aoePool = floor>=5
    ? BOSS_SKILL_POOL.filter(s=>s.tags.includes("aoe"))
    : BOSS_SKILL_POOL.filter(s=>s.tags.includes("aoe")&&!s.tags.includes("heavy"))
  const aoe = pickRandom(aoePool.filter(s=>!basic.find(b=>b.id===s.id)),1)

  // Special / heavy (1 for all, 2 for Legendary+)
  const specialPool = BOSS_SKILL_POOL.filter(s=>
    !basic.find(b=>b.id===s.id)&&!aoe.find(a=>a.id===s.id)&&
    (s.tags.includes("heavy")||s.tags.includes("debuff")||s.tags.includes("dot")||s.tags.includes("stun"))
  )
  const specialCount = (rarity==="Mythic"||rarity==="Legendary") ? 2 : 1
  const special = pickRandom(specialPool, specialCount)

  return [...basic,...aoe,...special].slice(0,count).map(s=>s.id)
}

function pickBossPassives(floor: number, rarity: string, skillIds: string[]): string[] {
  const count = rarity==="Mythic"?3:rarity==="Legendary"?2:rarity==="Elite"?2:1

  // Thematic picks based on skills
  const hasAoe    = skillIds.some(id=>BOSS_SKILL_POOL.find(s=>s.id===id)?.tags.includes("aoe"))
  const hasDot    = skillIds.some(id=>BOSS_SKILL_POOL.find(s=>s.id===id)?.tags.includes("dot"))
  const hasMagic  = skillIds.some(id=>BOSS_SKILL_POOL.find(s=>s.id===id)?.tags.includes("magic"))
  const hasHeavy  = skillIds.some(id=>BOSS_SKILL_POOL.find(s=>s.id===id)?.tags.includes("heavy"))

  const preferred: string[] = []
  if (hasAoe)   preferred.push("p_aoe_mastery")
  if (hasDot)   preferred.push("p_regen")
  if (hasMagic) preferred.push("p_magic_armor","p_crit")
  if (hasHeavy) preferred.push("p_execute","p_wrath")
  if (floor>=30) preferred.push("p_undying")
  if (floor>=20) preferred.push("p_phase_shift")
  if (floor>=15) preferred.push("p_berserker","p_enrage_low")

  const pool = BOSS_PASSIVE_POOL.filter(p=>
    preferred.includes(p.id)||Math.random()<0.4
  )
  return pickRandom(pool.length>=count?pool:BOSS_PASSIVE_POOL,count).map(p=>p.id)
}

async function generateBoss(floor: number): Promise<GeneratedBoss> {
  const rarity = floor>=50?"Mythic":floor>=30?"Legendary":floor>=15?"Elite":"Normal"
  const hp  = Math.floor((8000+floor*600)*FLOOR_MULT(floor))
  const atk = Math.floor((280+floor*18)*FLOOR_MULT(floor))
  const def = Math.floor((80+floor*6)*FLOOR_MULT(floor))
  const elements = ["fire","ice","lightning","shadow","poison","holy","chaos"]

  // Pick skills/passives locally (deterministic, no AI needed)
  const element = elements[Math.floor(Math.random()*elements.length)]
  const skillIds   = pickBossSkills(floor,element,rarity)
  const passiveIds = pickBossPassives(floor,rarity,skillIds)

  // Only call AI for name/lore/flavour (fast, small response)
  const skillNames  = skillIds.map(id=>BOSS_SKILL_POOL.find(s=>s.id===id)?.name).filter(Boolean).join(", ")
  const passiveNames= passiveIds.map(id=>BOSS_PASSIVE_POOL.find(p=>p.id===id)?.name).filter(Boolean).join(", ")

  const prompt=`You are a game designer. Create a raid boss for floor ${floor} of a dark fantasy tower.
Element: "${element}", Rarity: "${rarity}".
The boss has these skills: ${skillNames}.
Passives: ${passiveNames}.

Return ONLY valid JSON (no markdown):
{
  "name": "Boss name (Vietnamese or dark fantasy)",
  "title": "Short menacing subtitle",
  "lore": "1-2 sentence dark lore in Vietnamese matching the element and skills",
  "lore_skills": "1 sentence describing the combat style based on skills (Vietnamese)"
}`

  const baseStats = { hp, atk, def, spd:70+floor, critRate:Math.min(0.4,0.1+floor*0.003), critDmg:Math.min(4,1.8+floor*0.02) }
  const phases: BossPhase[] = [
    { phaseNumber:1, hpThreshold:1.0, description:"Thức tỉnh...", auraColor:"#ef4444" },
    ...(floor>=10?[{ phaseNumber:2, hpThreshold:0.6, description:"Điên cuồng khi còn 60% HP!", auraColor:"#f59e0b" }]:[]),
    ...(floor>=25?[{ phaseNumber:3, hpThreshold:0.3, description:"Hình dạng hủy diệt cuối cùng!", auraColor:"#ec4899" }]:[]),
  ]

  try {
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400,
        messages:[{role:"user",content:prompt}] }),
    })
    const data=await res.json()
    const text=(data.content as {type:string;text?:string}[])?.map(c=>c.text??"").join("")??""
    const clean=text.replace(/```json|```/g,"").trim()
    const flavour=JSON.parse(clean)
    return { ...flavour, element, rarity, floor, baseStats, phases, skillIds, passiveIds, spawnSize:floor>=20?2:1 }
  } catch {
    return {
      name:["Tử Thần Bóng Tối","Vua Vực Thẳm","Quỷ Thống Trị","Linh Hồn Đọa Đày"][floor%4],
      title:"Kẻ Canh Giữ Tầng "+floor,
      lore:"Sinh ra từ bóng tối vĩnh hằng, nó chờ đợi những kẻ dám thách thức.",
      lore_skills:"Kết hợp đòn tấn công diện rộng và hiệu ứng tiêu hao.",
      element, rarity:rarity as GeneratedBoss["rarity"], floor,
      baseStats, phases, skillIds, passiveIds, spawnSize:floor>=20?2:1,
    }
  }
}

// ─────────────────────────────────────────────────────────────
// COMBAT ENGINE TICK
// ─────────────────────────────────────────────────────────────
function computeTurnOrder(units: BattleUnit[]): string[] {
  return units.filter(u=>u.hp>0).sort((a,b)=>{
    const sa=a.stats.spd,sb=b.stats.spd
    if (sb===sa) return a.side==="player"?-1:1
    return sb-sa
  }).map(u=>u.uid)
}

// Boss passive signatures handled in tick
function applyBossPassiveSignatures(
  boss: GeneratedBoss, bossUnit: BattleUnit,
  cs: CombatState, prevHp: number,
) {
  for (const pid of boss.passiveIds) {
    const p=BOSS_PASSIVE_POOL.find(x=>x.id===pid)
    if (!p?.signatureId) continue
    switch (p.signatureId) {
      case "boss_rage": {
        // ATK bonus when below 50%
        if (bossUnit.hp/bossUnit.hpMax<0.5 && !bossUnit.statuses.some(s=>s.kind==="atkUp"&&s.name==="Cuồng Nộ Thụ Động")) {
          bossUnit.statuses.push({id:ruid(),kind:"atkUp",value:20,turns:9999,name:"Cuồng Nộ Thụ Động"})
          cs.log.push({id:ruid(),text:`🔥 ${bossUnit.name} kích hoạt Cuồng Nộ — ATK tăng 20%!`,kind:"status"})
        }
        break
      }
      case "boss_regen": {
        if (bossUnit.hp>0&&!bossUnit.statuses.some(s=>s.name==="Hồi Sinh Tối Thượng")) {
          bossUnit.statuses.push({id:ruid(),kind:"regen",value:0.03,turns:9999,name:"Hồi Sinh Tối Thượng"})
        }
        break
      }
      case "boss_thorns": {
        // Applied reactively in damage (approximate: regen as proxy)
        break
      }
      case "boss_phase_heal": {
        // Heal when crossing phase threshold
        const ratio=bossUnit.hp/bossUnit.hpMax
        const prev=prevHp/bossUnit.hpMax
        for (const ph of boss.phases) {
          if (prev>ph.hpThreshold&&ratio<=ph.hpThreshold&&ph.phaseNumber>1) {
            const heal=Math.floor(bossUnit.hpMax*0.15)
            bossUnit.hp=Math.min(bossUnit.hpMax,bossUnit.hp+heal)
            cs.log.push({id:ruid(),text:`💉 ${bossUnit.name} CHUYỂN DẠNG — hồi ${heal.toLocaleString()} HP!`,kind:"heal"})
          }
        }
        break
      }
      case "boss_scaling": {
        if (!bossUnit.statuses.some(s=>s.name==="__bscaling")) {
          bossUnit.statuses.push({id:ruid(),kind:"atkUp",value:1,turns:9999,name:"__bscaling"})
        } else {
          const stack=bossUnit.statuses.find(s=>s.name==="__bscaling")!
          if (stack.value<10) { // max 10 stacks = 50% ATK
            stack.value++
            bossUnit.stats.atk=Math.round(bossUnit.stats.atk*1.05)
          }
        }
        break
      }
    }
  }
}

function runOneTick(cs: CombatState, boss: GeneratedBoss): {
  newState: CombatState; outcome:"continue"|"win"|"lose"
} {
  if (cs.order.length===0) {
    return { newState:{...cs,order:computeTurnOrder(cs.units)}, outcome:"continue" }
  }

  const activeUid=cs.order[cs.activeUnitIndex%cs.order.length]
  const actor=cs.units.find(u=>u.uid===activeUid)

  if (!actor||actor.hp<=0) {
    const newOrder=computeTurnOrder(cs.units)
    return { newState:{...cs,order:newOrder,activeUnitIndex:0}, outcome:"continue" }
  }

  const prevBossHp = cs.units.find(u=>u.side==="enemy")?.hp ?? 0
  onUnitTurnStart(actor)

  const stunned=actor.statuses.some(s=>s.kind==="stun")
  if (stunned) {
    cs.log.push({id:ruid(),text:`💫 ${actor.name} bị choáng, mất lượt!`,kind:"status"})
  } else {
    const action=aiChooseAction(cs,actor)
    if (action.kind==="skill") {
      performSkill(cs,actor,action.skillIndex,action.targetUid)
    } else {
      const target=cs.units.find(u=>u.uid===action.targetUid&&u.hp>0)
      if (target) performBasicAttack(cs,actor,target)
    }
  }

  processEndOfTurn(cs,actor)

  // Apply boss passives
  const bossUnit=cs.units.find(u=>u.side==="enemy"&&u.hp>0)
  if (bossUnit) {
    applyBossPassiveSignatures(boss,bossUnit,cs,prevBossHp)

    // Phase transition log
    const ratio=bossUnit.hp/bossUnit.hpMax
    const curPhase=boss.phases.filter(p=>ratio<=p.hpThreshold).pop()
    const prevPhase=boss.phases.filter(p=>prevBossHp/bossUnit.hpMax<=p.hpThreshold).pop()
    if (curPhase&&curPhase.phaseNumber!==(prevPhase?.phaseNumber??1)&&curPhase.phaseNumber>1) {
      cs.log.push({id:ruid(),text:`⚡ ${bossUnit.name} CHUYỂN DẠNG → Phase ${curPhase.phaseNumber}! ${curPhase.description}`,kind:"system"})
    }
  }

  // Advance
  let nextIdx=cs.activeUnitIndex+1
  let newOrder=cs.order
  if (nextIdx>=cs.order.length) {
    cs.round++
    newOrder=computeTurnOrder(cs.units)
    nextIdx=0
    cs.log.push({id:ruid(),text:`── Hiệp ${cs.round} ──`,kind:"system"})
  }
  const newCs:CombatState={...cs,order:newOrder,activeUnitIndex:nextIdx,turn:cs.turn+1}

  const playerAlive=newCs.units.some(u=>u.side==="player"&&u.hp>0)
  const bossAlive  =newCs.units.some(u=>u.side==="enemy"&&u.hp>0)
  if (!bossAlive)   return {newState:newCs,outcome:"win"}
  if (!playerAlive) return {newState:newCs,outcome:"lose"}
  return {newState:newCs,outcome:"continue"}
}

// ─────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────
function HpBar({ current,max,colorAuto=false,color="bg-green-500" }:
  { current:number;max:number;colorAuto?:boolean;color?:string }) {
  const pct=Math.max(0,(current/max)*100)
  const auto=pct>60?"bg-green-500":pct>30?"bg-yellow-500":"bg-red-500"
  return (
    <div className="w-full h-2 bg-secondary/40 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-300",colorAuto?auto:color)} style={{width:`${pct}%`}}/>
    </div>
  )
}

function EnergyBar({ current,max }:{current:number;max:number}) {
  return (
    <div className="w-full h-1 bg-secondary/30 rounded-full overflow-hidden mt-0.5">
      <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{width:`${(current/max)*100}%`}}/>
    </div>
  )
}

function StatusPip({ status }:{ status:{kind:string;turns:number;name:string} }) {
  const meta=STATUS_META[status.kind]; if(!meta) return null
  const Icon=meta.icon
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded border border-current/30 bg-current/10",meta.color)}>
      <Icon className="size-2.5"/>{meta.label}({status.turns})
    </span>
  )
}

function SkillBadge({ def,cd }:{def:BossSkillDef;cd:number}) {
  const typeIcon = def.tags.includes("aoe")?<Zap className="size-3"/>:
                   def.tags.includes("heavy")?<Star className="size-3"/>:
                   def.tags.includes("dot")?<Droplets className="size-3"/>:
                   def.tags.includes("debuff")?<EyeOff className="size-3"/>:
                   def.tags.includes("buff")?<Sparkles className="size-3"/>:
                   <Sword className="size-3"/>
  return (
    <div className="group relative">
      <div className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border",
        cd>0?"border-border/30 bg-background/30 text-muted-foreground":"border-border bg-card/60 text-foreground")}>
        {typeIcon}{def.name}{cd>0&&<span className="text-red-400 ml-0.5">({cd})</span>}
      </div>
      <div className="pointer-events-none absolute bottom-full left-0 mb-1 z-50 w-56 rounded-lg border border-border bg-popover p-2 text-[10px] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="font-bold mb-0.5">{def.name}</p>
        <p className="text-muted-foreground mb-1">{def.description}</p>
        <div className="flex flex-wrap gap-1">
          {def.tags.map(t=>(
            <span key={t} className="px-1 rounded bg-secondary/50 text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PassiveBadge({ def }:{def:BossPassiveDef}) {
  return (
    <div className="group relative inline-block">
      <span className="text-xs text-purple-300 cursor-help">
        <span className="font-bold">✦ {def.name}</span>
        <span className="text-muted-foreground ml-1 hidden sm:inline">— {def.description}</span>
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// REWARD CALCULATION
// ─────────────────────────────────────────────────────────────
interface RaidReward {
  gold: number
  gems: number
  playerXp: number
  heroXp: number   // per hero
  bonusReason?: string  // speed/flawless bonus description
}

function calcRaidReward(boss: GeneratedBoss, turnCount: number, aliveHeroes: number): RaidReward {
  const f = boss.floor
  const rarityMult = { Normal: 1, Elite: 2.2, Legendary: 5, Mythic: 12 }[boss.rarity] ?? 1

  // Base rewards scale with floor and rarity
  const baseGold   = Math.round((300 + f * 80)  * rarityMult)
  const baseGems   = Math.round((3   + f * 0.6) * rarityMult)
  const baseXp     = Math.round((200 + f * 60)  * rarityMult)
  const baseHeroXp = Math.round((150 + f * 40)  * rarityMult)

  // Speed bonus: under (floor * 3 + 20) turns
  const speedThreshold = f * 3 + 20
  const isSpeedKill = turnCount <= speedThreshold
  const speedMult = isSpeedKill ? 1.5 : 1

  // Flawless bonus: all heroes survived
  const isFlawless = aliveHeroes >= 1
  const flawlessMult = isFlawless ? 1.3 : 1

  const totalMult = speedMult * flawlessMult

  const reasons: string[] = []
  if (isSpeedKill) reasons.push(`⚡ Tốc Chiến ×1.5 (≤${speedThreshold} lượt)`)
  if (isFlawless)  reasons.push(`🛡️ Không Thương Vong ×1.3`)

  return {
    gold:    Math.round(baseGold   * totalMult),
    gems:    Math.round(baseGems   * totalMult),
    playerXp:Math.round(baseXp     * totalMult),
    heroXp:  Math.round(baseHeroXp * totalMult),
    bonusReason: reasons.length ? reasons.join("  ") : undefined,
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export function RaidTab() {
  const { state, dispatch } = useGame()

  // ── Daily raid limit: 1 raid per day (5 combat battles) ──
  const RAIDS_PER_DAY = 1
  const raidBattlesUsed = state.raidBattlesUsed ?? 0
  const raidResetAtBattle = state.raidResetAtBattle ?? 5
  const canRaid = raidBattlesUsed < RAIDS_PER_DAY
  // Battles remaining until next reset
  const battlesUntilReset = Math.max(0, raidResetAtBattle - state.battlesWon)

  const [floor,setFloor]               = useState(Math.max(1,state.highestStage))
  const [boss,setBoss]                 = useState<GeneratedBoss|null>(null)
  const [isGenerating,setIsGenerating] = useState(false)
  const [selectedUids,setSelectedUids] = useState<string[]>([])

  const csRef    = useRef<CombatState|null>(null)
  const bossRef  = useRef<GeneratedBoss|null>(null)
  const runRef   = useRef(false)
  const logRef   = useRef<HTMLDivElement>(null)

  const [snap,setSnap]         = useState<CombatState|null>(null)
  const [isRunning,setIsRunning] = useState(false)
  const [result,setResult]     = useState<"win"|"lose"|null>(null)
  const [raidReward,setRaidReward] = useState<RaidReward|null>(null)
  const [turnCount,setTurnCount] = useState(0)
  const [logs,setLogs]         = useState<CombatLogEntry[]>([
    {id:"0",text:"Chọn tầng và nhấn Tạo Boss AI để bắt đầu Raid!"}
  ])

  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight},[logs])

  const syncSnap=useCallback(()=>{
    if(!csRef.current) return
    const cs=csRef.current
    // Shallow clone with units spread — no need for deep status/cooldown clone for display
    setSnap({
      ...cs,
      units:cs.units.map(u=>({...u})),
      log:cs.log,
    })
  },[])

  // ── Generate ──
  const handleGenerate=async()=>{
    setIsGenerating(true)
    runRef.current=false; setIsRunning(false); setResult(null); setRaidReward(null); setTurnCount(0)
    csRef.current=null; bossRef.current=null; setSnap(null)
    setLogs([{id:ruid(),text:`🔮 AI đang tạo boss tầng ${floor}...`}])

    const generated=await generateBoss(floor)
    bossRef.current=generated; setBoss(generated)

    const teamUids=(state.team.filter(Boolean) as string[]).slice(0,4)
    setSelectedUids(teamUids)
    setIsGenerating(false)

    const rs=BOSS_RARITY_STYLE[generated.rarity]
    const skillNames=generated.skillIds.map(id=>BOSS_SKILL_POOL.find(s=>s.id===id)?.name).filter(Boolean).join(", ")
    const passiveNames=generated.passiveIds.map(id=>BOSS_PASSIVE_POOL.find(p=>p.id===id)?.name).filter(Boolean).join(", ")
    setLogs([
      {id:ruid(),text:`💀 ${generated.name} xuất hiện! [${generated.rarity}] Tầng ${floor}`},
      {id:ruid(),text:`📖 ${generated.lore}`},
      {id:ruid(),text:`⚔️ Phong cách: ${generated.lore_skills}`},
      {id:ruid(),text:`🗡️ Kỹ năng: ${skillNames}`},
      {id:ruid(),text:`✦ Nội tại: ${passiveNames}`},
      ...(generated.phases.length>1?[{id:ruid(),text:`⚠️ Boss có ${generated.phases.length} giai đoạn biến dạng!`}]:[]),
      ...(generated.spawnSize===2?[{id:ruid(),text:`📐 Boss khổng lồ — chiếm 2 ô trận địa!`}]:[]),
    ])
  }

  // ── Start battle ──
  const startBattle=useCallback(()=>{
    const b=bossRef.current; if(!b||selectedUids.length===0) return
    if (!canRaid) return  // blocked by daily limit
    const playerBonuses: Partial<Stats>={
      atk:state.playerStats.attackBonus, mag:state.playerStats.magicBonus,
      def:state.playerStats.defenseBonus, hp:state.playerStats.hpBonus,
      spd:state.playerStats.speedBonus, crit:state.playerStats.critBonus,
    }
    const playerUnits: BattleUnit[]=selectedUids.flatMap(uid=>{
      const owned=state.heroes.find(h=>h.uid===uid); if(!owned) return []
      try { return [buildPlayerUnit(owned,playerBonuses)] } catch { return [] }
    })
    const bossUnit=buildBossUnit(b)
    const all=[...playerUnits,bossUnit]
    const order=computeTurnOrder(all)
    const initLog: CombatLogEntry[]=[
      {id:ruid(),text:`⚔️ RAID BẮT ĐẦU! ${playerUnits.map(u=>u.name).join(", ")} vs ${b.name}`,kind:"system"},
    ]
    csRef.current={ stage:b.floor,turn:0,units:all,order,activeUnitIndex:0,round:1,log:initLog,ended:null,awaitingPlayerInput:false }
    syncSnap(); setLogs(initLog); setTurnCount(0); setResult(null); setRaidReward(null)
    dispatch({ type: "INC_RAID_ATTEMPT" })
    dispatch({ type: "QUEST_ON_RAID_PARTICIPATE" })
    runRef.current=true; setIsRunning(true)
  },[canRaid,selectedUids,state.heroes,state.playerStats,syncSnap,dispatch])

  // ── Loop ──
  useEffect(()=>{
    if(!isRunning||result) return
    const id=setInterval(()=>{
      if(!runRef.current||!csRef.current||!bossRef.current) return
      const {newState,outcome}=runOneTick(csRef.current,bossRef.current)
      csRef.current=newState; syncSnap()
      setTurnCount(t=>t+1)
      const newEntries=newState.log.slice(-10)
      setLogs(prev=>{
        const lastId=prev[prev.length-1]?.id
        const fresh=newEntries.filter(e=>e.id!==lastId)
        return fresh.length?[...prev.slice(-110),...fresh]:prev
      })
      if(outcome!=="continue"){
        runRef.current=false; setIsRunning(false); setResult(outcome)
        if (outcome === "win" && bossRef.current) {
          const aliveCount = newState.units.filter(u => u.side === "player" && u.hp > 0).length
          const tc = newState.turn
          const reward = calcRaidReward(bossRef.current, tc, aliveCount)
          setRaidReward(reward)
          dispatch({ type: "ADD_GOLD", amount: reward.gold })
          if (reward.gems > 0) dispatch({ type: "ADD_GEMS", amount: reward.gems })
          dispatch({ type: "ADD_PLAYER_XP", amount: reward.playerXp })
          const heroUids = newState.units.filter(u => u.side === "player").map(u =>
            state.heroes.find(h => HEROES_BY_ID[h.templateId]?.id === u.templateId)?.uid
          ).filter(Boolean) as string[]
          for (const uid of heroUids) {
            dispatch({ type: "ADD_HERO_XP", uid, amount: reward.heroXp })
          }
        }
      }
    },900)
    return ()=>clearInterval(id)
  },[isRunning,result,syncSnap,dispatch,state.heroes])

  // ─── RENDER ───
  const bossUnit  = snap?.units.find(u=>u.side==="enemy")
  const heroUnits = snap?.units.filter(u=>u.side==="player")??[]
  const bossHpPct = bossUnit?(bossUnit.hp/bossUnit.hpMax)*100:100
  const bossHpCol = bossHpPct>60?"bg-green-500":bossHpPct>30?"bg-yellow-500":"bg-red-500"

  const currentPhase = boss&&bossUnit
    ? [...boss.phases].reverse().find(p=>bossUnit.hp/bossUnit.hpMax<=p.hpThreshold) ?? boss.phases[0]
    : boss?.phases[0]

  const bossCooldowns = bossUnit?.cooldowns??[0,0,0]
  const rs = boss?BOSS_RARITY_STYLE[boss.rarity]:BOSS_RARITY_STYLE.Normal

  // resolved skill/passive defs for display
  const bossSkillDefs  = boss?.skillIds.map(id=>BOSS_SKILL_POOL.find(s=>s.id===id)).filter(Boolean) as BossSkillDef[] ?? []
  const bossPassiveDefs= boss?.passiveIds.map(id=>BOSS_PASSIVE_POOL.find(p=>p.id===id)).filter(Boolean) as BossPassiveDef[] ?? []

  return (
    <div className="space-y-4">
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>

      {/* FLOOR SELECTOR */}
      <Card className="ornate-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-fantasy flex items-center gap-2 text-base">
            <Skull className="size-5 text-red-400"/>
            Raid Boss — Tầng Thách Thức
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground shrink-0">Tầng:</span>
            <input type="range" min={1} max={100} value={floor}
              onChange={e=>setFloor(Number(e.target.value))}
              className="flex-1 min-w-32 accent-primary" disabled={isRunning}/>
            <span className={cn("font-fantasy font-black text-xl w-10 text-center",
              floor>=50?"text-rarity-mythic":floor>=30?"text-rarity-legendary":floor>=15?"text-rarity-rare":"text-muted-foreground"
            )}>{floor}</span>
            <Badge variant="outline" className={cn("font-bold",
              floor>=50?"border-rarity-mythic text-rarity-mythic":floor>=30?"border-rarity-legendary text-rarity-legendary":floor>=15?"border-rarity-rare text-rarity-rare":"",
            )}>
              {floor>=50?"Mythic":floor>=30?"Legendary":floor>=15?"Elite":"Normal"}
            </Badge>
            <Button onClick={handleGenerate} disabled={isGenerating||isRunning||!canRaid} className="font-fantasy">
              <Sparkles className="size-4 mr-1.5"/>
              {isGenerating?"Đang tạo...":!canRaid?"Hết lượt hôm nay":"✨ Tạo Boss AI"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DAILY RAID LIMIT BANNER */}
      {!canRaid ? (
        <Card className="border-orange-500/40 bg-orange-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <span className="text-3xl shrink-0">⏳</span>
            <div className="flex-1">
              <p className="font-fantasy font-bold text-orange-300">Đã dùng lượt Raid hôm nay</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Raid Boss giới hạn <strong className="text-foreground">1 lần / ngày</strong> (mỗi ngày = 5 trận chiến đấu).
                {battlesUntilReset > 0
                  ? <> Còn <strong className="text-orange-300">{battlesUntilReset} trận combat</strong> nữa để reset.</>
                  : <> Reset ngay sau trận combat kế tiếp.</>
                }
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-orange-400">0/{RAIDS_PER_DAY}</p>
              <p className="text-[10px] text-muted-foreground">lượt còn lại</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 px-1">
          <span className="text-green-400 text-sm">✅</span>
          <p className="text-xs text-muted-foreground">
            Lượt Raid hôm nay: <strong className="text-green-400">{RAIDS_PER_DAY - raidBattlesUsed}/{RAIDS_PER_DAY}</strong> còn lại
            {battlesUntilReset > 0 && <span className="ml-1 text-muted-foreground/60">(reset sau {battlesUntilReset} trận)</span>}
          </p>
        </div>
      )}

      {!boss&&!isGenerating&&(
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground gap-3">
          <Skull className="size-12 opacity-20"/>
          <p className="font-fantasy text-lg">Chọn tầng và nhấn <span className="text-primary">Tạo Boss AI</span></p>
          <p className="text-sm">Mỗi boss có bộ kỹ năng & nội tại khác nhau — AI tạo tên, lore và phong cách chiến đấu</p>
        </div>
      )}

      {boss&&(
        <div className="grid lg:grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-4">

            {/* BOSS CARD */}
            <Card className="ornate-border" style={{borderColor:currentPhase?.auraColor+"88"}}>
              <CardContent className="pt-4 space-y-3">
                {/* Header row */}
                <div className="flex gap-3 items-start">
                  {/* Sprite */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={cn("flex items-center justify-center rounded-xl border-2 transition-all duration-700",boss.spawnSize===2?"w-28 h-14":"w-14 h-14")}
                      style={{borderColor:currentPhase?.auraColor,boxShadow:`0 0 20px ${currentPhase?.auraColor}55`,background:`radial-gradient(circle,${currentPhase?.auraColor}18,transparent 70%)`,animation:"float 3s ease-in-out infinite"}}
                    >
                      <span className={boss.spawnSize===2?"text-4xl":"text-3xl"}>{ELEMENT_EMOJI[boss.element]??"💀"}</span>
                    </div>
                    {boss.phases.length>1&&(
                      <div className="flex gap-1">
                        {boss.phases.map((p,i)=>{
                          const cur=boss.phases.indexOf(currentPhase??boss.phases[0])
                          return <div key={i} className="w-4 h-1.5 rounded-full transition-all duration-500"
                            style={{background:i<=cur?p.auraColor:"#374151"}} title={`Phase ${p.phaseNumber}: ${p.description}`}/>
                        })}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h2 className={cn("font-fantasy font-black text-lg",rs.text)}>{boss.name}</h2>
                      <Badge className={rs.badge}>{boss.rarity}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {ELEMENT_EMOJI[boss.element]} {boss.element} · Tầng {boss.floor}
                        {boss.spawnSize===2&&" · 📐 2 ô"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-2">{boss.title}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono font-bold" style={{color:currentPhase?.auraColor}}>
                          {(bossUnit?.hp??boss.baseStats.hp).toLocaleString()} / {boss.baseStats.hp.toLocaleString()} HP
                        </span>
                        <span className="text-muted-foreground">{Math.round(bossHpPct)}%</span>
                      </div>
                      <div className="w-full h-3 bg-secondary/40 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-300",bossHpCol)} style={{width:`${bossHpPct}%`}}/>
                      </div>
                      {bossUnit&&<EnergyBar current={bossUnit.energy} max={bossUnit.energyMax}/>}
                    </div>
                    {(bossUnit?.statuses??[]).length>0&&(
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {bossUnit!.statuses.filter(s=>!s.name.startsWith("__")).map((s,i)=><StatusPip key={i} status={s}/>)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[10px]">
                  {([
                    ["⚔️ ATK",boss.baseStats.atk.toLocaleString()],
                    ["🛡️ DEF",boss.baseStats.def.toLocaleString()],
                    ["💨 SPD",boss.baseStats.spd],
                    ["🎯 CRIT",`${Math.round(boss.baseStats.critRate*100)}%`],
                    ["💥 CDMG",`${boss.baseStats.critDmg.toFixed(1)}x`],
                    ["📐 Size",boss.spawnSize===2?"2 ô":"1 ô"],
                  ] as [string,string|number][]).map(([label,val])=>(
                    <div key={label} className="flex flex-col items-center px-1.5 py-1 rounded bg-background/50 border border-border/50">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-bold">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                    Kỹ Năng Boss <span className="text-[9px] normal-case font-normal">(hover để xem chi tiết)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bossSkillDefs.map((def,i)=>(
                      <SkillBadge key={def.id} def={def} cd={bossCooldowns[i]??0}/>
                    ))}
                  </div>
                </div>

                {/* Passives */}
                {bossPassiveDefs.length>0&&(
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1.5">Nội Tại Boss</p>
                    <div className="space-y-1">
                      {bossPassiveDefs.map(def=>(
                        <div key={def.id} className="text-xs">
                          <span className="font-bold text-purple-300">✦ {def.name}</span>
                          <span className="text-muted-foreground ml-1.5">{def.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phases */}
                {boss.phases.length>1&&(
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Giai Đoạn Biến Dạng</p>
                    {boss.phases.map((p,i)=>{
                      const cur=boss.phases.indexOf(currentPhase??boss.phases[0])
                      return (
                        <div key={i} className={cn("flex items-center gap-2 text-xs mb-0.5",i===cur?"font-bold":"text-muted-foreground")}>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{background:p.auraColor}}/>
                          <span>Phase {p.phaseNumber} ({Math.round(p.hpThreshold*100)}%):</span>
                          <span>{p.description}</span>
                          {i===cur&&<Badge className="text-[9px] px-1 py-0 ml-auto" variant="outline">ACTIVE</Badge>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Lore */}
                <div className="border-t border-border/30 pt-2 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground/70 italic">{boss.lore}</p>
                  <p className="text-[10px] text-blue-300/70 italic">⚔️ {boss.lore_skills}</p>
                </div>
              </CardContent>
            </Card>

            {/* HERO LIVE CARDS */}
            {heroUnits.length>0&&(
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {heroUnits.map(u=>{
                  const dead=u.hp<=0
                  const Icon=ROLE_ICON[u.role]??Sword
                  return (
                    <Card key={u.uid} className={cn("p-2 space-y-1.5 transition-opacity",dead&&"opacity-40")}>
                      <div className="flex items-center gap-1.5">
                        <div className="size-6 rounded bg-background/60 border border-border flex items-center justify-center shrink-0">
                          <Icon className="size-3.5 text-muted-foreground"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate">{u.name}</p>
                          <p className="text-[9px] text-muted-foreground">{dead?"☠️ Đã chết":u.role}</p>
                        </div>
                      </div>
                      <HpBar current={u.hp} max={u.hpMax} colorAuto/>
                      <p className="text-[9px] text-muted-foreground">{u.hp.toLocaleString()}/{u.hpMax.toLocaleString()}</p>
                      <EnergyBar current={u.energy} max={u.energyMax}/>
                      <div className="flex gap-1">
                        {u.skills.map((sk,i)=>sk&&(
                          <div key={i} title={`${sk.name}${u.cooldowns[i]>0?` (${u.cooldowns[i]} lượt CD)`:""}`}
                            className={cn("flex-1 h-1.5 rounded-full text-center",u.cooldowns[i]>0?"bg-secondary/50":"bg-primary/60")}/>
                        ))}
                      </div>
                      {u.statuses.filter(s=>!s.name.startsWith("__")).length>0&&(
                        <div className="flex flex-wrap gap-0.5">
                          {u.statuses.filter(s=>!s.name.startsWith("__")).slice(0,3).map((s,i)=><StatusPip key={i} status={s}/>)}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}

            {/* CONTROLS */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isRunning&&!result&&(
                <Button onClick={startBattle} disabled={selectedUids.length===0||!canRaid} className="font-fantasy gap-2">
                  <Play className="size-4"/>{canRaid?"Bắt Đầu Raid":"Hết lượt hôm nay"}
                </Button>
              )}
              {isRunning&&(
                <Button variant="outline" onClick={()=>{runRef.current=false;setIsRunning(false)}} className="gap-2">
                  <Pause className="size-4"/>Tạm Dừng
                </Button>
              )}
              {!isRunning&&!result&&turnCount>0&&(
                <Button variant="outline" onClick={()=>{runRef.current=true;setIsRunning(true)}} className="gap-2">
                  <Play className="size-4"/>Tiếp Tục
                </Button>
              )}
              {result&&(
                <Button onClick={handleGenerate} variant={result==="win"?"default":"destructive"} className="font-fantasy gap-2">
                  <RotateCcw className="size-4"/>
                  {result==="win"?"✨ Tầng Tiếp Theo":"🔄 Thử Lại"}
                </Button>
              )}
              {(isRunning||turnCount>0)&&(
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isRunning&&<span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block"/>}
                  Lượt {turnCount} · Hiệp {snap?.round??1}
                </span>
              )}
            </div>

            {/* RESULT */}
            {result&&(
              <Card className={cn("border-2 overflow-hidden",result==="win"?"border-yellow-500/60 bg-yellow-500/5":"border-red-500/60 bg-red-500/5")}>
                <CardContent className="pt-5 space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-4xl">{result==="win"?"🏆":"💔"}</p>
                    <p className={cn("font-fantasy font-black text-2xl",result==="win"?"text-yellow-400":"text-red-400")}>
                      {result==="win"?"CHIẾN THẮNG!":"THẤT BẠI!"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result==="win"
                        ?`Tiêu diệt ${boss?.name} sau ${snap?.turn??turnCount} lượt · Hiệp ${snap?.round??1}`
                        :"Tất cả anh hùng đã ngã xuống. Hãy tăng cường đội hình và thử lại!"}
                    </p>
                  </div>

                  {/* LOOT — only on win */}
                  {result==="win"&&raidReward&&(
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 text-center">
                        ✦ Phần Thưởng Raid ✦
                      </p>

                      {/* Main rewards grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center gap-1 rounded-lg bg-background/50 border border-yellow-500/20 py-3 px-2">
                          <span className="text-2xl">🪙</span>
                          <span className="font-bold text-yellow-300 text-sm">+{raidReward.gold.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground">Vàng</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 rounded-lg bg-background/50 border border-cyan-500/20 py-3 px-2">
                          <span className="text-2xl">💎</span>
                          <span className="font-bold text-cyan-300 text-sm">+{raidReward.gems}</span>
                          <span className="text-[10px] text-muted-foreground">Đá Quý</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 rounded-lg bg-background/50 border border-purple-500/20 py-3 px-2">
                          <span className="text-2xl">✨</span>
                          <span className="font-bold text-purple-300 text-sm">+{raidReward.playerXp.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground">EXP Bản Thân</span>
                        </div>
                      </div>

                      {/* Hero XP */}
                      <div className="rounded-lg bg-background/40 border border-border/40 p-3">
                        <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Users className="size-3.5"/>
                          EXP Anh Hùng (+{raidReward.heroXp.toLocaleString()} mỗi người)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {snap?.units.filter(u=>u.side==="player").map(u=>(
                            <div key={u.uid} className={cn(
                              "flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border",
                              u.hp>0
                                ?"bg-green-500/10 border-green-500/30 text-green-300"
                                :"bg-white/5 border-white/10 text-muted-foreground line-through"
                            )}>
                              <span className="font-semibold">{u.name}</span>
                              {u.hp>0&&<span className="text-green-400">+{raidReward.heroXp.toLocaleString()} EXP</span>}
                              {u.hp<=0&&<span className="text-muted-foreground text-[10px]">đã chết</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bonus reasons */}
                      {raidReward.bonusReason&&(
                        <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                          <p className="text-[11px] text-primary font-semibold">Bonus đã áp dụng:</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{raidReward.bonusReason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* BATTLE LOG */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-fantasy flex items-center gap-2">
                  <Swords className="size-4"/>Nhật Ký Chiến Đấu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={logRef} className="h-48 overflow-y-auto space-y-0.5 text-[11px] font-mono">
                  {logs.map((l,i)=>(
                    <p key={l.id??i} className={cn("border-b border-border/20 py-0.5 leading-snug",LOG_COLOR[l.kind??""]??"text-muted-foreground")}>
                      {l.text}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: HERO SELECTION */}
          <div className="space-y-3">
            <Card className="ornate-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-fantasy flex items-center gap-2">
                  <Users className="size-4"/>Chọn Anh Hùng ({selectedUids.length}/4)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {state.heroes.length===0&&(
                  <p className="text-xs text-muted-foreground">Chưa có anh hùng nào.</p>
                )}
                {state.heroes.map(owned=>{
                  const tpl=HEROES_BY_ID[owned.templateId]; if(!tpl) return null
                  const sel=selectedUids.includes(owned.uid)
                  const Icon=ROLE_ICON[tpl.role]??Sword
                  const live=heroUnits.find(u=>u.templateId===tpl.id)
                  const dead=live?live.hp<=0:false
                  return (
                    <button key={owned.uid} type="button"
                      disabled={isRunning||dead}
                      onClick={()=>{
                        if(isRunning) return
                        setSelectedUids(prev=>prev.includes(owned.uid)
                          ?prev.filter(u=>u!==owned.uid)
                          :prev.length<4?[...prev,owned.uid]:prev)
                      }}
                      className={cn("w-full text-left rounded-lg border-2 p-2 transition-all",
                        dead?"opacity-40 cursor-not-allowed border-border/30 bg-background/20":
                        sel?"border-primary bg-primary/10":"border-border bg-card/60 hover:border-primary/50")}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-7 rounded bg-background/60 border border-border flex items-center justify-center shrink-0">
                          <Icon className="size-3.5 text-muted-foreground"/>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{tpl.name}</p>
                          <p className="text-[9px] text-muted-foreground">{dead?"☠️ Đã chết":`Lv.${owned.level} · ${tpl.role}`}</p>
                        </div>
                      </div>
                      {live?(
                        <>
                          <HpBar current={live.hp} max={live.hpMax} colorAuto/>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{live.hp.toLocaleString()}/{live.hpMax.toLocaleString()}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {live.skills.map((sk,i)=>sk&&(
                              <span key={i}
                                className={cn("text-[9px] px-1 rounded border",live.cooldowns[i]>0?"border-border/30 text-muted-foreground":"border-primary/50 text-primary")}
                                title={`${sk.name}${live.cooldowns[i]>0?` — CD ${live.cooldowns[i]} lượt`:""}`}>
                                {sk.name.slice(0,5)}
                              </span>
                            ))}
                          </div>
                          {live.statuses.filter(s=>!s.name.startsWith("__")).length>0&&(
                            <div className="flex flex-wrap gap-0.5 mt-1">
                              {live.statuses.filter(s=>!s.name.startsWith("__")).map((s,i)=><StatusPip key={i} status={s}/>)}
                            </div>
                          )}
                        </>
                      ):(
                        <div className="flex gap-1 flex-wrap mt-1">
                          {tpl.skills.map(sid=>{
                            const sk=SKILLS[sid]; if(!sk) return null
                            return <span key={sid} className="text-[9px] px-1 rounded border border-border/40 text-muted-foreground">{sk.name.slice(0,6)}</span>
                          })}
                        </div>
                      )}
                    </button>
                  )
                })}
                <p className="text-[9px] text-muted-foreground text-center pt-1">Tối đa 4 · Click để chọn/bỏ</p>
              </CardContent>
            </Card>

            {/* Skill pool info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-fantasy flex items-center gap-1.5">
                  <Info className="size-3.5"/>Pool Kỹ Năng Boss
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-[10px] text-muted-foreground">
                <p>Boss được chọn ngẫu nhiên từ <strong className="text-foreground">{BOSS_SKILL_POOL.length}</strong> kỹ năng và <strong className="text-foreground">{BOSS_PASSIVE_POOL.length}</strong> nội tại.</p>
                <p>• <span className="text-blue-300">Xanh</span> = sẵn sàng · <span className="text-red-400">Đỏ</span> = cooldown</p>
                <p>• Hover kỹ năng để xem chi tiết</p>
                <p className="border-t border-border/30 pt-1 mt-1 font-bold text-foreground">💡 Cơ chế</p>
                <p>• Anh hùng dùng <strong>đúng kỹ năng thật</strong></p>
                <p>• AI tự chọn skill tối ưu mỗi lượt</p>
                <p>• Thanh xanh = năng lượng chiêu tuyệt kỹ</p>
                <p>• Tầng 20+ boss chiếm <strong>2 ô</strong></p>
                <p>• Chỉ số tăng ~18%/tầng</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
