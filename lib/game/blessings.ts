// ============================================================
// Chúc Phúc Thiên Thần (Angel Blessings) & Giao Kèo Ác Quỷ (Devil Pacts)
// ============================================================
// These are special innates equipped to heroes. Each has deep combat effects
// processed in the combat engine. A hero can only hold one (blessing OR pact).
// No two heroes in the team can share the same blessing/pact id.
// ============================================================

import type { BattleUnit, CombatLogEntry, CombatState } from "./types"

// ============================================================
// Token items used to unlock blessings/pacts
// ============================================================
export const BLESSING_SHARD_ID = "blessing_shard"   // Angel Feather Shard
export const PACT_SHARD_ID = "pact_shard"           // Devil Contract Shard

// ============================================================
// Core effect hook types — called by combat engine
// ============================================================

export type BlessingPactContext = {
  state: CombatState
  bearer: BattleUnit  // the hero carrying the blessing/pact
  log: CombatLogEntry[]
  // Optional: attacker/target for hit-based hooks
  attacker?: BattleUnit
  target?: BattleUnit
  dmg?: number
  allies?: BattleUnit[]
  enemies?: BattleUnit[]
}

export type BlessingPactHooks = {
  /** Called once when combat starts */
  onBattleStart?: (ctx: BlessingPactContext) => void
  /** Called at start of bearer's turn */
  onTurnStart?: (ctx: BlessingPactContext) => void
  /** Called at end of bearer's turn */
  onTurnEnd?: (ctx: BlessingPactContext) => void
  /** Called when bearer deals damage */
  onDealDamage?: (ctx: BlessingPactContext) => void
  /** Called when bearer takes damage */
  onTakeDamage?: (ctx: BlessingPactContext) => void
  /** Called when bearer kills an enemy */
  onKill?: (ctx: BlessingPactContext) => void
  /** Called when an ally dies */
  onAllyDeath?: (ctx: BlessingPactContext) => void
  /** Called when bearer's HP drops below 30% (once per battle) */
  onLowHp?: (ctx: BlessingPactContext) => void
  /** Called when bearer uses their ultimate */
  onUltimate?: (ctx: BlessingPactContext) => void
  /** Called every end-of-round (after all units acted) */
  onRoundEnd?: (ctx: BlessingPactContext) => void
}

export type BlessingKind = "blessing" | "pact"

export type BlessingPact = {
  id: string
  name: string
  kind: BlessingKind
  tier: 1 | 2 | 3   // 1=basic, 2=advanced, 3=pinnacle
  shardCost: number
  description: string  // shown in UI
  /** Extra text for the "curse" side of pacts */
  curseSuffix?: string
  /** Visual flavor */
  lore: string
  hooks: BlessingPactHooks
}

// ============================================================
// Helper: _uid, push log, find allies/enemies
// ============================================================
function uid() { return Math.random().toString(36).slice(2, 9) }

function alive(state: CombatState, side: "player" | "enemy") {
  return state.units.filter(u => u.side === side && u.hp > 0)
}

function pushLog(log: CombatLogEntry[], text: string, kind: CombatLogEntry["kind"] = "status") {
  log.push({ id: uid(), text, kind })
}

function applyDot(unit: BattleUnit, kind: "burn" | "poison" | "bleed", value: number, turns: number, name: string, log: CombatLogEntry[]) {
  unit.statuses.push({ id: uid(), kind, value, turns, name })
  pushLog(log, `${unit.name} bị ${name}`, "status")
}

function applyBuff(unit: BattleUnit, kind: "atkUp"|"defUp"|"spdUp"|"regen"|"shield", value: number, turns: number, name: string, log: CombatLogEntry[]) {
  unit.statuses.push({ id: uid(), kind, value, turns, name })
}

function applyDebuff(unit: BattleUnit, kind: "atkDown"|"defDown"|"spdDown"|"stun", value: number, turns: number, name: string, log: CombatLogEntry[]) {
  unit.statuses.push({ id: uid(), kind, value, turns, name })
  pushLog(log, `${unit.name} bị ${name}`, "status")
}

// ============================================================
// ===================== ANGEL BLESSINGS ======================
// ============================================================

export const BLESSINGS: BlessingPact[] = [

  // ── Tier 1 ──────────────────────────────────────────────

  {
    id: "b_mirror_soul",
    name: "Hồn Phản Chiếu",
    kind: "blessing",
    tier: 1,
    shardCost: 3,
    description: "Mỗi khi tướng này bị tấn công, phản chiếu 18% sát thương nhận về cho kẻ tấn công dưới dạng sát thương thật. Nếu HP dưới 40%, tỉ lệ tăng lên 35%.",
    lore: "Ánh sáng thiên thần không chỉ chữa lành — nó còn trả lại mọi đau thương.",
    hooks: {
      onTakeDamage({ bearer, attacker, dmg, log }) {
        if (!attacker || !dmg || dmg <= 0 || attacker.hp <= 0) return
        const pct = bearer.hp / bearer.hpMax < 0.4 ? 0.35 : 0.18
        const reflect = Math.max(1, Math.round(dmg * pct))
        attacker.hp = Math.max(0, attacker.hp - reflect)
        pushLog(log, `✨ [Hồn Phản Chiếu] ${bearer.name} phản ${reflect} sát thương thật lên ${attacker.name}!`, "damage")
      }
    }
  },

  {
    id: "b_last_rites",
    name: "Nghi Lễ Cuối",
    kind: "blessing",
    tier: 1,
    shardCost: 3,
    description: "Khi một đồng đội chết, tướng này ngay lập tức hồi 12% HP tối đa và tăng 20% sát thương trong 2 lượt.",
    lore: "Linh hồn đồng đội truyền sức mạnh lúc lâm chung.",
    hooks: {
      onAllyDeath({ bearer, log }) {
        if (bearer.hp <= 0) return
        const heal = Math.round(bearer.hpMax * 0.12)
        bearer.hp = Math.min(bearer.hpMax, bearer.hp + heal)
        applyBuff(bearer, "atkUp", 20, 2, "Tưởng Niệm", log)
        pushLog(log, `✨ [Nghi Lễ Cuối] ${bearer.name} hấp thụ ý chí đồng đội, hồi ${heal} HP!`, "heal")
      }
    }
  },

  {
    id: "b_chain_lightning",
    name: "Sấm Thiên Đường",
    kind: "blessing",
    tier: 1,
    shardCost: 3,
    description: "Khi tướng này gây sát thương, 40% cơ hội sét nhảy sang 1 kẻ địch ngẫu nhiên khác gây thêm 25% sát thương phép.",
    lore: "Ánh sét thiên đường không dừng ở một chỗ.",
    hooks: {
      onDealDamage({ state, bearer, target, dmg, log }) {
        if (!dmg || dmg <= 0 || Math.random() > 0.4) return
        const enemies = alive(state, bearer.side === "player" ? "enemy" : "player").filter(u => u.uid !== target?.uid)
        if (enemies.length === 0) return
        const bounce = enemies[Math.floor(Math.random() * enemies.length)]
        const bolt = Math.max(1, Math.round(dmg * 0.25))
        bounce.hp = Math.max(0, bounce.hp - bolt)
        pushLog(log, `⚡ [Sấm Thiên Đường] Sét nhảy! ${bounce.name} mất ${bolt}!`, "damage")
      }
    }
  },

  {
    id: "b_sanctified_ground",
    name: "Thánh Địa",
    kind: "blessing",
    tier: 1,
    shardCost: 4,
    description: "Đầu mỗi lượt, tướng này tạo ra một vùng thánh địa: tất cả đồng đội (kể cả bản thân) trong đội hồi 3% HP tối đa.",
    lore: "Bước chân thiên thần biến đất thường thành đất thánh.",
    hooks: {
      onTurnStart({ state, bearer, log }) {
        const allies = alive(state, bearer.side)
        for (const ally of allies) {
          const heal = Math.round(ally.hpMax * 0.03)
          ally.hp = Math.min(ally.hpMax, ally.hp + heal)
        }
        pushLog(log, `✨ [Thánh Địa] ${bearer.name} thánh hóa chiến trường, đội hồi ${Math.round(bearer.hpMax * 0.03)} HP!`, "heal")
      }
    }
  },

  // ── Tier 2 ──────────────────────────────────────────────

  {
    id: "b_echo_strike",
    name: "Vang Vọng Thiên Khải",
    kind: "blessing",
    tier: 2,
    shardCost: 6,
    description: "Sau mỗi lần tướng này dùng chiêu tối thượng, chiêu đó tự động kích hoạt lại với 50% sức mạnh ngay sau đó (không tốn năng lượng).",
    lore: "Tiếng vang của thiên thần khiến phép thuật ngân mãi trong không trung.",
    hooks: {
      onUltimate({ state, bearer, log }) {
        // Mark to fire echo on next turn via a status
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 1, name: "__echo_ultimate" })
        pushLog(log, `✨ [Vang Vọng Thiên Khải] Chiêu tối thượng của ${bearer.name} sẽ vang vọng lần nữa!`, "info")
      },
      onTurnStart({ bearer, log }) {
        const echo = bearer.statuses.find(s => s.name === "__echo_ultimate")
        if (!echo) return
        bearer.statuses = bearer.statuses.filter(s => s.name !== "__echo_ultimate")
        pushLog(log, `✨ [Vang Vọng] Chiêu tối thượng vang vọng! (50% sức mạnh)`, "info")
        // The engine will handle echo via flag — set energy artificially
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: -50, turns: 1, name: "__echo_active" })
      }
    }
  },

  {
    id: "b_judgment_mark",
    name: "Dấu Phán Xét",
    kind: "blessing",
    tier: 2,
    shardCost: 6,
    description: "Khi tướng này tấn công, gán Dấu Phán Xét lên mục tiêu (tối đa 3 dấu). Khi kẻ địch đủ 3 dấu, nổ tung gây 80% ATK sát thương thật và reset dấu.",
    lore: "Trời phán xử — không phải bằng lời, mà bằng sét lửa.",
    hooks: {
      onDealDamage({ state, bearer, target, log }) {
        if (!target || target.hp <= 0) return
        let markStatus = target.statuses.find(s => s.name === `__judgment_mark_${bearer.uid}`)
        if (!markStatus) {
          markStatus = { id: uid(), kind: "defDown", value: 0, turns: 999, name: `__judgment_mark_${bearer.uid}` }
          target.statuses.push(markStatus)
        }
        markStatus.value += 1
        pushLog(log, `⚖️ [Dấu Phán Xét] ${target.name} nhận dấu thứ ${markStatus.value}/3!`, "status")
        if (markStatus.value >= 3) {
          target.statuses = target.statuses.filter(s => s.name !== `__judgment_mark_${bearer.uid}`)
          const burst = Math.max(1, Math.round(bearer.stats.atk * 0.8))
          target.hp = Math.max(0, target.hp - burst)
          pushLog(log, `⚖️ [Phán Xét Khai Hỏa!] ${target.name} chịu ${burst} sát thương thật!`, "damage")
        }
      }
    }
  },

  {
    id: "b_guardian_angel",
    name: "Thiên Thần Hộ Mệnh",
    kind: "blessing",
    tier: 2,
    shardCost: 7,
    description: "Một lần duy nhất mỗi trận, khi tướng này sắp chết (HP về 0), thay vào đó hồi về 25% HP và được miễn sát thương trong 1 lượt.",
    lore: "Thiên thần hộ vệ sẽ không để linh hồn tốt lành rơi vào bóng tối.",
    hooks: {
      onTakeDamage({ bearer, log }) {
        const alreadyUsed = bearer.statuses.some(s => s.name === "__guardian_used")
        if (alreadyUsed) return
        if (bearer.hp > 0) return  // only trigger at death edge
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 1, turns: 9999, name: "__guardian_used" })
        const revive = Math.round(bearer.hpMax * 0.25)
        bearer.hp = revive
        applyBuff(bearer, "shield", 1.0, 1, "Khiên Thiên Thần", log)
        pushLog(log, `👼 [Thiên Thần Hộ Mệnh] ${bearer.name} được hồi sinh với ${revive} HP!`, "heal")
      }
    }
  },

  {
    id: "b_soul_link",
    name: "Liên Kết Linh Hồn",
    kind: "blessing",
    tier: 2,
    shardCost: 6,
    description: "Tướng này liên kết linh hồn với đồng đội có HP thấp nhất: 30% sát thương nhận vào của đồng đội đó được chuyển sang tướng này thay thế.",
    lore: "Trong ánh sáng thiên đường, ranh giới giữa hai tâm hồn tan biến.",
    hooks: {
      onBattleStart({ state, bearer, log }) {
        // Grant bearer +15% DEF to represent absorbing hits, and track link target
        bearer.stats.def = Math.round(bearer.stats.def * 1.15)
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 9999, name: "__soul_link_active" })
        pushLog(log, `🔗 [Liên Kết Linh Hồn] ${bearer.name} liên kết linh hồn! +15% DEF để hứng đỡ đòn cho đồng đội yếu nhất!`, "info")
      },
      onRoundEnd({ state, bearer, log }) {
        // Each round: heal the weakest ally as a proxy for damage redirection
        const allies = alive(state, bearer.side).filter(u => u.uid !== bearer.uid)
        if (allies.length === 0) return
        const weakest = allies.reduce((a, b) => a.hp / a.hpMax < b.hp / b.hpMax ? a : b)
        if (weakest.hp / weakest.hpMax > 0.7) return  // only help if actually hurt
        const absorb = Math.round(bearer.stats.def * 0.5)  // absorb scales with bearer's DEF
        weakest.hp = Math.min(weakest.hpMax, weakest.hp + absorb)
        const selfCost = Math.round(absorb * 0.4)
        bearer.hp = Math.max(1, bearer.hp - selfCost)
        pushLog(log, `🔗 [Liên Kết Linh Hồn] ${bearer.name} hứng đỡ cho ${weakest.name}: +${absorb} HP, tự mất ${selfCost} HP!`, "heal")
      }
    }
  },

  {
    id: "b_divine_timing",
    name: "Thời Khắc Thần Thánh",
    kind: "blessing",
    tier: 2,
    shardCost: 5,
    description: "Tốc độ của tướng này tăng 8% mỗi lượt (tối đa 10 lượt). Khi vượt 200% tốc độ ban đầu, được thêm 1 lượt đánh ngay.",
    lore: "Thời gian của thiên thần không bị trói buộc như phàm nhân.",
    hooks: {
      onTurnStart({ bearer, log }) {
        const stackStatus = bearer.statuses.find(s => s.name === "__divine_timing_stack")
        const stacks = stackStatus ? stackStatus.value : 0
        if (stacks >= 10) return
        const gain = Math.round(bearer.stats.spd * 0.08)
        bearer.stats.spd += gain
        if (!stackStatus) {
          bearer.statuses.push({ id: uid(), kind: "spdUp", value: 1, turns: 9999, name: "__divine_timing_stack" })
        } else {
          stackStatus.value += 1
        }
        pushLog(log, `⏳ [Thời Khắc Thần Thánh] ${bearer.name} +${gain} SPD (stack ${stacks + 1}/10)`, "status")
      }
    }
  },

  // ── Tier 3 ──────────────────────────────────────────────

  {
    id: "b_celestial_execution",
    name: "Hành Hình Thiên Giới",
    kind: "blessing",
    tier: 3,
    shardCost: 12,
    description: "Khi tướng này giết một kẻ địch, ngay lập tức tấn công kẻ địch có HP thấp nhất còn lại thêm một lần (không tốn lượt). Hiệu ứng này có thể xích tối đa 4 lần.",
    lore: "Phán quyết của thiên đường không có điểm dừng cho đến khi kẻ tà ác cuối cùng sụp đổ.",
    hooks: {
      onKill({ state, bearer, log }) {
        const chains = bearer.statuses.filter(s => s.name === "__exec_chain").length
        if (chains >= 4) return
        const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
        if (enemies.length === 0) return
        const target = enemies.reduce((a, b) => a.hp < b.hp ? a : b)
        const bonus = Math.max(1, Math.round(bearer.stats.atk * 0.9))
        target.hp = Math.max(0, target.hp - bonus)
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 1, name: "__exec_chain" })
        pushLog(log, `⚔️ [Hành Hình Thiên Giới] Xích ${chains + 1}! ${bearer.name} tiếp tục tấn công ${target.name} -${bonus}!`, "damage")
        if (target.hp <= 0) {
          // Recursion-like: will trigger onKill again next resolve
          pushLog(log, `💀 ${target.name} bị tiêu diệt trong chuỗi hành hình!`, "damage")
        }
      }
    }
  },

  {
    id: "b_seraphim_aura",
    name: "Hào Quang Thánh Thần",
    kind: "blessing",
    tier: 3,
    shardCost: 14,
    description: "Tất cả đồng đội nhận +15% ATK, +15% MAG và hồi 5% HP mỗi lượt. Khi tướng này HP dưới 25%, hào quang tăng gấp đôi và lan sang kẻ địch gây yếu điểm.",
    lore: "Khi thánh thần xuất hiện, cả chiến trường rung chuyển trước uy nghi vô biên.",
    hooks: {
      onBattleStart({ state, bearer, log }) {
        const allies = alive(state, bearer.side)
        for (const ally of allies) {
          ally.stats.atk = Math.round(ally.stats.atk * 1.15)
          ally.stats.mag = Math.round(ally.stats.mag * 1.15)
        }
        pushLog(log, `✨ [Hào Quang Thánh Thần] Cả đội nhận +15% ATK và MAG!`, "status")
      },
      onTurnStart({ state, bearer, log }) {
        const multiplier = bearer.hp / bearer.hpMax < 0.25 ? 2 : 1
        const healPct = multiplier === 2 ? 0.05 : 0.03  // 3% normal, 5% when low HP (was always 5%)
        const allies = alive(state, bearer.side)
        for (const ally of allies) {
          const heal = Math.round(ally.hpMax * healPct)
          ally.hp = Math.min(ally.hpMax, ally.hp + heal)
        }
        if (multiplier === 2) {
          const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
          for (const e of enemies) {
            applyDebuff(e, "defDown", 20, 1, "Yếu Điểm Thánh", log)
          }
          pushLog(log, `🔱 [Hào Quang Khuếch Đại] ${bearer.name} đang hấp hối — hào quang bùng cháy gấp đôi!`, "status")
        }
      }
    }
  },

  {
    id: "b_time_rewind",
    name: "Hoàn Lưu Thời Gian",
    kind: "blessing",
    tier: 3,
    shardCost: 13,
    description: "Một lần mỗi trận, khi bất kỳ đồng đội nào chết, tướng này hoàn lưu thời gian: đồng đội đó được hồi sinh với 40% HP và xóa mọi debuff.",
    lore: "Thiên thần bậc cao không chấp nhận cái chết là điểm kết.",
    hooks: {
      onAllyDeath({ state, bearer, log }) {
        if (bearer.statuses.some(s => s.name === "__rewind_used")) return
        if (bearer.hp <= 0) return
        // Find the most recently dead ally (hp == 0)
        const deadAlly = state.units.find(u => u.side === bearer.side && u.hp <= 0 && u.uid !== bearer.uid)
        if (!deadAlly) return
        bearer.statuses.push({ id: uid(), kind: "shield", value: 0, turns: 0, name: "__rewind_used" })
        deadAlly.hp = Math.round(deadAlly.hpMax * 0.4)
        deadAlly.statuses = deadAlly.statuses.filter(s =>
          !["burn","poison","bleed","stun","atkDown","defDown","spdDown"].includes(s.kind)
        )
        pushLog(log, `⏪ [Hoàn Lưu Thời Gian] ${bearer.name} hồi sinh ${deadAlly.name} với ${deadAlly.hp} HP!`, "heal")
      }
    }
  },

  {
    id: "b_sovereign_will",
    name: "Ý Chí Thiên Vương",
    kind: "blessing",
    tier: 3,
    shardCost: 15,
    description: "Cuối mỗi vòng, tướng này phân tích chiến trường: với mỗi đồng đội còn sống, tăng 6% ATK; với mỗi kẻ địch còn sống, tăng 6% DEF. Các stack này tích lũy vĩnh viễn trong trận.",
    lore: "Ý chí của thiên vương lớn mạnh theo từng thử thách — không bị khuất phục bởi nghịch cảnh, mà được tôi luyện từ đó.",
    hooks: {
      onRoundEnd({ state, bearer, log }) {
        const allies = state.units.filter(u => u.side === bearer.side && u.hp > 0 && u.uid !== bearer.uid).length
        const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0).length
        const atkGain = Math.round(bearer.stats.atk * 0.06 * allies)
        const defGain = Math.round(bearer.stats.def * 0.06 * enemies)
        if (atkGain > 0) { bearer.stats.atk += atkGain }
        if (defGain > 0) { bearer.stats.def += defGain }
        if (atkGain > 0 || defGain > 0)
          pushLog(log, `👑 [Ý Chí Thiên Vương] ${bearer.name} +${atkGain} ATK, +${defGain} DEF từ chiến trường!`, "status")
      }
    }
  },

  {
    id: "b_astral_projection",
    name: "Phóng Chiếu Tinh Thần",
    kind: "blessing",
    tier: 3,
    shardCost: 14,
    description: "Khi tướng này dùng chiêu bất kỳ, một bản sao tinh thần xuất hiện và tấn công một kẻ địch ngẫu nhiên gây 60% MAG sát thương phép. Nếu đó là chiêu tối thượng, bản sao tấn công toàn bộ kẻ địch.",
    lore: "Linh hồn thiên thần không bị giam cầm trong thân xác — nó lan tỏa khắp chiến trường như ánh sáng.",
    hooks: {
      onUltimate({ state, bearer, log }) {
        // Mark so onTurnEnd won't double-fire this turn
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 1, name: "__astral_ult_fired" })
        const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
        const dmg = Math.max(1, Math.round(bearer.stats.mag * 0.6))
        for (const e of enemies) {
          e.hp = Math.max(0, e.hp - dmg)
          pushLog(log, `👻 [Phóng Chiếu - Tối Thượng] Bản sao tấn công ${e.name} -${dmg}!`, "damage")
        }
      },
      onTurnEnd({ state, bearer, log }) {
        // Skip if ultimate already triggered this turn
        if (bearer.statuses.some(s => s.name === "__astral_ult_fired")) return
        const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
        if (enemies.length === 0) return
        const target = enemies[Math.floor(Math.random() * enemies.length)]
        const dmg = Math.max(1, Math.round(bearer.stats.mag * 0.6))
        target.hp = Math.max(0, target.hp - dmg)
        pushLog(log, `👻 [Phóng Chiếu] Bản sao tinh thần tấn công ${target.name} -${dmg}!`, "damage")
      }
    }
  },

  {
    id: "b_eternal_covenant",
    name: "Giao Ước Vĩnh Cửu",
    kind: "blessing",
    tier: 3,
    shardCost: 16,
    description: "Khi trận chiến bắt đầu, tướng này lập giao ước với toàn đội: mỗi đồng đội nhận 10% HP hồi phục lúc tướng này dùng chiêu, và mỗi khi đồng đội hồi HP, tướng này nhận 5% năng lượng miễn phí.",
    lore: "Giao ước thiêng liêng không phân biệt khoảng cách — liên kết linh hồn vượt qua thời gian và không gian.",
    hooks: {
      onBattleStart({ bearer, log }) {
        pushLog(log, `⚡ [Giao Ước Vĩnh Cửu] ${bearer.name} lập giao ước với toàn đội!`, "info")
      },
      onTurnEnd({ state, bearer, log }) {
        const allies = state.units.filter(u => u.side === bearer.side && u.hp > 0 && u.uid !== bearer.uid)
        let healed = 0
        for (const ally of allies) {
          if (ally.hp / ally.hpMax > 0.85) continue  // don't overheal near-full allies
          const heal = Math.round(ally.hpMax * 0.05)
          ally.hp = Math.min(ally.hpMax, ally.hp + heal)
          healed++
        }
        if (healed > 0)
          pushLog(log, `✨ [Giao Ước] ${bearer.name} chia sẻ hồi phục cho ${healed} đồng đội!`, "heal")
        // Energy regen from covenant (capped to prevent infinite ultimate spam)
        const energyGain = Math.round(bearer.energyMax * 0.03 * Math.min(allies.length, 2))
        bearer.energy = Math.min(bearer.energyMax, bearer.energy + energyGain)
      }
    }
  },

  {
    id: "b_worldbreaker_light",
    name: "Ánh Sáng Phá Thế",
    kind: "blessing",
    tier: 3,
    shardCost: 15,
    description: "Một lần duy nhất khi tướng này HP giảm xuống dưới 25%, giải phóng ánh sáng hủy diệt: gây 150% ATK sát thương thật lên toàn bộ kẻ địch. Sau đó, mỗi đòn đánh trong 2 lượt tiếp theo xuyên qua 50% DEF mục tiêu.",
    lore: "Khi thiên thần đứng ở bờ vực tử vong, ánh sáng trong họ bùng cháy dữ dội nhất.",
    hooks: {
      onTakeDamage({ state, bearer, log }) {
        if (bearer.statuses.some(s => s.name === "__worldbreaker_used")) return
        if (bearer.hp / bearer.hpMax > 0.25) return
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 1, turns: 9999, name: "__worldbreaker_used" })
        const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
        const dmg = Math.round(bearer.stats.atk * 1.5)
        for (const e of enemies) {
          e.hp = Math.max(0, e.hp - dmg)
          pushLog(log, `💥 [Ánh Sáng Phá Thế] ${e.name} chịu ${dmg} sát thương thật!`, "damage")
        }
        applyBuff(bearer, "atkUp", 50, 2, "Xuyên Giáp Ánh Sáng", log)
        pushLog(log, `💥 [Ánh Sáng Phá Thế] ${bearer.name} bùng nổ! +50% xuyên giáp trong 2 lượt!`, "status")
      }
    }
  },

  {
    id: "b_fate_weaver",
    name: "Dệt Số Phận",
    kind: "blessing",
    tier: 3,
    shardCost: 15,
    description: "Đầu mỗi vòng, tướng này 'dệt' vận mệnh: ngẫu nhiên hoán đổi SPD của một kẻ địch với SPD của một đồng đội (có lợi nhất). Kẻ địch bị hoán đổi cũng nhận debuff giảm 25% ATK trong 2 lượt.",
    lore: "Số phận không phải thứ cố định — với đôi tay đúng đắn, nó có thể được thêu dệt lại.",
    hooks: {
      onRoundEnd({ state, bearer, log }) {
        const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
        const allies = state.units.filter(u => u.side === bearer.side && u.hp > 0)
        if (enemies.length === 0 || allies.length === 0) return
        const fastEnemy = enemies.reduce((a, b) => a.stats.spd > b.stats.spd ? a : b)
        const slowAlly = allies.reduce((a, b) => a.stats.spd < b.stats.spd ? a : b)
        const tmpSpd = fastEnemy.stats.spd
        fastEnemy.stats.spd = slowAlly.stats.spd
        slowAlly.stats.spd = tmpSpd
        applyDebuff(fastEnemy, "atkDown", 25, 2, "Vận Mệnh Đảo Lộn", log)
        pushLog(log, `🕸️ [Dệt Số Phận] SPD của ${fastEnemy.name} và ${slowAlly.name} bị hoán đổi!`, "status")
      }
    }
  },

  {
    id: "b_phoenix_ascension",
    name: "Thăng Hoa Phượng Hoàng",
    kind: "blessing",
    tier: 3,
    shardCost: 16,
    description: "Khi tướng này chết lần đầu, thay vì tử trận họ hồi về 25% HP và nhận +40% ATK trong 2 lượt. Trong 2 lượt đó tướng này bị giảm 30% DEF và không thể nhận hồi phục. Sau 2 lượt, nếu không bị tiêu diệt thì sống tiếp bình thường.",
    lore: "Tro tàn của thiên thần không bao giờ lạnh — nhưng ngọn lửa tái sinh chỉ cháy một lần.",
    hooks: {
      onTakeDamage({ bearer, log }) {
        if (bearer.statuses.some(s => s.name === "__phoenix_used")) return
        if (bearer.hp > 0) return
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 1, turns: 9999, name: "__phoenix_used" })
        bearer.hp = Math.round(bearer.hpMax * 0.25)
        bearer.statuses = bearer.statuses.filter(s => !["stun"].includes(s.kind))
        applyBuff(bearer, "atkUp", 40, 2, "Phượng Hoàng Bùng Cháy", log)
        applyDebuff(bearer, "defDown", 30, 2, "Thân Xác Bất Ổn", log)
        pushLog(log, `🔥 [Thăng Hoa Phượng Hoàng] ${bearer.name} tái sinh với 25% HP! +40% ATK, -30% DEF trong 2 lượt!`, "heal")
      }
    }
  },

  {
    id: "b_sacred_geometry",
    name: "Hình Học Thần Thánh",
    kind: "blessing",
    tier: 3,
    shardCost: 13,
    description: "Sát thương của tướng này tăng thêm 15% cho mỗi đồng đội còn sống trong đội (tối đa +60% với 4 đồng đội). Khi một đồng đội chết, tướng này mất 8% ATK vĩnh viễn — đội hình tan vỡ để lại vết thương thật.",
    lore: "Thiên thần hiểu rằng sức mạnh thật sự đến từ sự hoàn hảo của đội hình — và mất đi một phần sẽ làm tổn thương toàn bộ.",
    hooks: {
      onBattleStart({ state, bearer, log }) {
        pushLog(log, `📐 [Hình Học Thần Thánh] ${bearer.name} kích hoạt công thức thiêng liêng!`, "info")
      },
      onTurnStart({ state, bearer }) {
        const aliveAllies = state.units.filter(u => u.side === bearer.side && u.hp > 0 && u.uid !== bearer.uid).length
        const bonus = aliveAllies * 15
        const existing = bearer.statuses.find(s => s.name === "__sacred_geo_bonus")
        if (!existing) {
          bearer.statuses.push({ id: uid(), kind: "atkUp", value: bonus, turns: 9999, name: "__sacred_geo_bonus" })
        } else {
          existing.value = bonus
        }
      },
      onAllyDeath({ bearer, log }) {
        const loss = Math.round(bearer.stats.atk * 0.08)
        bearer.stats.atk = Math.max(1, bearer.stats.atk - loss)
        bearer.stats.mag = Math.max(1, bearer.stats.mag - loss)
        pushLog(log, `📐 [Hình Học Thần Thánh] Đội hình tan vỡ! ${bearer.name} mất ${loss} ATK/MAG vĩnh viễn!`, "status")
      }
    }
  },

  {
    id: "b_divine_paradox",
    name: "Nghịch Lý Thần Thánh",
    kind: "blessing",
    tier: 3,
    shardCost: 16,
    description: "Tướng này nhận sát thương bình thường nhưng mỗi điểm sát thương nhận vào được chuyển hóa thành năng lượng (tối đa 5 lần mỗi vòng). Khi đủ năng lượng tối thượng, tự động giải phóng không tốn lượt.",
    lore: "Điều khiến thiên thần trở nên vô song không phải là bất tử — mà là biến đau thương thành sức mạnh.",
    hooks: {
      onTakeDamage({ bearer, dmg, log }) {
        const counter = bearer.statuses.find(s => s.name === "__paradox_counter")
        const uses = counter?.value ?? 0
        if (uses >= 5) return
        if (!dmg || dmg <= 0) return
        const energyGain = Math.min(dmg * 0.5, bearer.energyMax * 0.25)
        bearer.energy = Math.min(bearer.energyMax, bearer.energy + energyGain)
        if (!counter) {
          bearer.statuses.push({ id: uid(), kind: "atkUp", value: 1, turns: 9999, name: "__paradox_counter" })
        } else {
          counter.value += 1
        }
        pushLog(log, `⚡ [Nghịch Lý] ${bearer.name} hấp thụ ${Math.round(energyGain)} năng lượng từ đau thương! (${uses + 1}/5 lượt này)`, "status")
      },
      onRoundEnd({ bearer }) {
        const counter = bearer.statuses.find(s => s.name === "__paradox_counter")
        if (counter) counter.value = 0
      }
    }
  },

  // ── Tier 2 (New) ────────────────────────────────────────

  {
    id: "b_star_formation",
    name: "Trận Hình Sao Băng",
    kind: "blessing",
    tier: 2,
    shardCost: 6,
    description: "Đầu trận, kết nối với 2 đồng đội ngẫu nhiên thành trận hình. Mỗi khi bất kỳ thành viên trận hình tấn công, tất cả thành viên còn lại hồi 4% HP. Nếu cả 3 còn sống sau vòng 5, cả đội nhận +20% ATK/MAG vĩnh viễn.",
    lore: "Sao băng không đi một mình — chúng tạo thành chòm sao rực rỡ.",
    hooks: {
      onBattleStart({ state, bearer, log }) {
        const allies = alive(state, bearer.side).filter(u => u.uid !== bearer.uid)
        const chosen = allies.sort(() => Math.random() - 0.5).slice(0, 2)
        const ids = [bearer.uid, ...chosen.map(u => u.uid)].join(",")
        bearer.statuses.push({ id: uid(), kind: "spdUp", value: 0, turns: 9999, name: `__star_formation:${ids}` })
        pushLog(log, `⭐ [Trận Hình Sao Băng] ${bearer.name} kết nối với ${chosen.map(u => u.name).join(", ")}!`, "info")
      },
      onDealDamage({ state, bearer, log }) {
        const formStatus = bearer.statuses.find(s => s.name.startsWith("__star_formation:"))
        if (!formStatus) return
        const ids = formStatus.name.split(":")[1].split(",")
        const members = state.units.filter(u => ids.includes(u.uid) && u.uid !== bearer.uid && u.hp > 0)
        for (const m of members) {
          const heal = Math.round(m.hpMax * 0.04)
          m.hp = Math.min(m.hpMax, m.hp + heal)
        }
        if (members.length > 0) pushLog(log, `⭐ [Trận Hình] Đồng đội hồi HP!`, "heal")
      },
      onRoundEnd({ state, bearer, log }) {
        const formStatus = bearer.statuses.find(s => s.name.startsWith("__star_formation:"))
        if (!formStatus) return
        formStatus.value += 1
        if (formStatus.value === 5) {
          const ids = formStatus.name.split(":")[1].split(",")
          const allAlive = ids.every(id => state.units.find(u => u.uid === id && u.hp > 0))
          if (allAlive) {
            for (const a of alive(state, bearer.side)) {
              a.stats.atk = Math.round(a.stats.atk * 1.2)
              a.stats.mag = Math.round(a.stats.mag * 1.2)
            }
            pushLog(log, `⭐ [Trận Hình Hoàn Hảo!] Cả đội nhận +20% ATK/MAG vĩnh viễn!`, "status")
          }
        }
      }
    }
  },

  {
    id: "b_aegis_of_dawn",
    name: "Khiên Bình Minh",
    kind: "blessing",
    tier: 2,
    shardCost: 7,
    description: "Cuối mỗi vòng, ban một lớp khiên cho đồng đội HP thấp nhất, hấp thụ sát thương bằng 20% ATK của tướng này. Khi khiên bị phá, kẻ phá khiên nhận sát thương thật bằng 40% ATK của người ban khiên.",
    lore: "Ánh bình minh bảo vệ người yếu đuối — và trừng phạt kẻ dám tấn công họ.",
    hooks: {
      onRoundEnd({ state, bearer, log }) {
        const allies = alive(state, bearer.side).filter(u => u.uid !== bearer.uid)
        if (allies.length === 0) return
        const weakest = allies.reduce((a, b) => a.hp / a.hpMax < b.hp / b.hpMax ? a : b)
        const shieldAtkVal = Math.round(bearer.stats.atk * 0.20)
        const shieldFrac = shieldAtkVal / Math.max(1, weakest.hpMax)
        // Remove old aegis from this weakest before adding new one
        weakest.statuses = weakest.statuses.filter(s => s.name !== "Khiên Bình Minh")
        weakest.statuses.push({ id: uid(), kind: "shield", value: shieldFrac, turns: 2, name: "Khiên Bình Minh" })
        // Store retaliate ATK value separately (atkUp marker with turns:2)
        weakest.statuses = weakest.statuses.filter(s => !s.name.startsWith("__aegis_retalia:"))
        weakest.statuses.push({ id: uid(), kind: "atkUp", value: shieldAtkVal, turns: 2, name: `__aegis_retalia:${bearer.uid}` })
        pushLog(log, `🌅 [Khiên Bình Minh] ${bearer.name} ban khiên cho ${weakest.name}!`, "status")
      },
      onTakeDamage({ bearer, attacker, log }) {
        // Fires when the bearer (weakest ally) has their shield broken — retalia check
        const retalia = bearer.statuses.find(s => s.name.startsWith("__aegis_retalia:"))
        if (!retalia || !attacker || attacker.hp <= 0) return
        const shieldStillActive = bearer.statuses.some(s => s.name === "Khiên Bình Minh" && s.value > 0.001)
        if (shieldStillActive) return
        const retaliateDmg = Math.round(retalia.value * 0.4)
        if (retaliateDmg <= 0) return
        attacker.hp = Math.max(0, attacker.hp - retaliateDmg)
        bearer.statuses = bearer.statuses.filter(s => !s.name.startsWith("__aegis_retalia:"))
        pushLog(log, `🌅 [Phản Đòn Bình Minh] Khiên vỡ! ${attacker.name} nhận ${retaliateDmg} sát thương thật!`, "damage")
      }
    }
  },

  // ── Tier 3 (New) ────────────────────────────────────────

  {
    id: "b_echo_of_creation",
    name: "Vang Vọng Khai Thiên",
    kind: "blessing",
    tier: 3,
    shardCost: 15,
    description: "Đầu trận lưu lại chỉ số gốc. Mỗi lượt, phục hồi 50% lượng chỉ số bị giảm do debuff. Nếu đang bị giảm 3 chỉ số trở lên cùng lúc, hồi đầy năng lượng để kích hoạt chiêu tối thượng ngay lượt sau.",
    lore: "Ký ức về hình hài hoàn hảo nhất không bao giờ phai.",
    hooks: {
      onBattleStart({ bearer, log }) {
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: bearer.stats.atk, turns: 9999, name: "__echo_base_atk" })
        bearer.statuses.push({ id: uid(), kind: "defUp", value: bearer.stats.def, turns: 9999, name: "__echo_base_def" })
        bearer.statuses.push({ id: uid(), kind: "spdUp", value: bearer.stats.spd, turns: 9999, name: "__echo_base_spd" })
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: bearer.stats.mag, turns: 9999, name: "__echo_base_mag" })
        pushLog(log, `🌌 [Vang Vọng Khai Thiên] ${bearer.name} lưu lại ký ức hình hài hoàn hảo!`, "info")
      },
      onTurnStart({ bearer, log }) {
        const baseAtk = bearer.statuses.find(s => s.name === "__echo_base_atk")?.value ?? 0
        const baseDef = bearer.statuses.find(s => s.name === "__echo_base_def")?.value ?? 0
        const baseSpd = bearer.statuses.find(s => s.name === "__echo_base_spd")?.value ?? 0
        const baseMag = bearer.statuses.find(s => s.name === "__echo_base_mag")?.value ?? 0
        if (baseAtk === 0) return
        let debuffCount = 0
        if (bearer.stats.atk < baseAtk) { bearer.stats.atk = Math.min(baseAtk, bearer.stats.atk + Math.round((baseAtk - bearer.stats.atk) * 0.5)); debuffCount++ }
        if (bearer.stats.def < baseDef) { bearer.stats.def = Math.min(baseDef, bearer.stats.def + Math.round((baseDef - bearer.stats.def) * 0.5)); debuffCount++ }
        if (bearer.stats.spd < baseSpd) { bearer.stats.spd = Math.min(baseSpd, bearer.stats.spd + Math.round((baseSpd - bearer.stats.spd) * 0.5)); debuffCount++ }
        if (bearer.stats.mag < baseMag) { bearer.stats.mag = Math.min(baseMag, bearer.stats.mag + Math.round((baseMag - bearer.stats.mag) * 0.5)); debuffCount++ }
        if (debuffCount >= 3) {
          bearer.energy = bearer.energyMax
          pushLog(log, `🌌 [Bản Sao Khai Thiên] ${bearer.name} kháng ${debuffCount} debuff — năng lượng tối thượng đã sạc đầy!`, "info")
        } else if (debuffCount > 0) {
          pushLog(log, `🌌 [Bản Sao Ký Ức] ${bearer.name} phục hồi ${debuffCount} chỉ số từ ký ức!`, "status")
        }
      }
    }
  },

  {
    id: "b_sovereign_light",
    name: "Hào Quang Chủ Quyền",
    kind: "blessing",
    tier: 3,
    shardCost: 14,
    description: "Đầu trận: mọi kẻ địch có ATK cao hơn tướng này bị giảm 20% ATK. Mỗi khi tướng này được hồi HP (từ regen), 50% lượng đó chuyển thành sát thương thật lên kẻ địch HP cao nhất. Nếu là tướng cuối cùng còn sống, bùng phát 200% ATK sát thương thật lên toàn địch.",
    lore: "Thánh thần định nghĩa lại quy luật của chiến trường.",
    hooks: {
      onBattleStart({ state, bearer, log }) {
        const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
        let count = 0
        for (const e of enemies) {
          if (e.stats.atk > bearer.stats.atk) { e.stats.atk = Math.round(e.stats.atk * 0.8); count++ }
        }
        if (count > 0) pushLog(log, `👑 [Chủ Quyền] ${bearer.name} áp đặt! ${count} kẻ địch mạnh hơn bị -20% ATK!`, "status")
      },
      onTurnStart({ state, bearer, log }) {
        const regens = bearer.statuses.filter(s => s.kind === "regen")
        if (regens.length === 0) return
        const totalRegen = regens.reduce((s, r) => s + Math.round(bearer.hpMax * r.value), 0)
        if (totalRegen <= 0) return
        const convert = Math.round(totalRegen * 0.5)
        const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
        if (enemies.length === 0) return
        const fattest = enemies.reduce((a, b) => a.hp > b.hp ? a : b)
        fattest.hp = Math.max(0, fattest.hp - convert)
        pushLog(log, `👑 [Hào Quang Chủ Quyền] Chuyển hóa ${convert} regen thành sát thương lên ${fattest.name}!`, "damage")
      },
      onAllyDeath({ state, bearer, log }) {
        if (bearer.hp <= 0) return
        if (bearer.statuses.some(s => s.name === "__sovereign_burst_used")) return
        const alliesAlive = state.units.filter(u => u.side === bearer.side && u.hp > 0)
        if (alliesAlive.length !== 1 || alliesAlive[0].uid !== bearer.uid) return
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 9999, name: "__sovereign_burst_used" })
        const burst = Math.round(bearer.stats.atk * 2.0)
        for (const e of alive(state, bearer.side === "player" ? "enemy" : "player")) {
          e.hp = Math.max(0, e.hp - burst)
        }
        pushLog(log, `👑 [QUANG NĂNG BẤT DIỆT] ${bearer.name} — tướng cuối — bùng phát ${burst} sát thương thật lên mọi địch!`, "damage")
      }
    }
  },
]

// ============================================================
// ====================== DEVIL PACTS =========================
// ============================================================

export const PACTS: BlessingPact[] = [

  // ── Tier 1 ──────────────────────────────────────────────

  {
    id: "p_blood_price",
    name: "Giá Máu",
    kind: "pact",
    tier: 1,
    shardCost: 2,
    description: "Sát thương của tướng này tăng 35%, nhưng mỗi lần tấn công, tướng này mất 4% HP tối đa.",
    curseSuffix: "Mỗi đòn đánh tiêu hao sinh lực của chính mình.",
    lore: "Ác quỷ cho sức mạnh đổi lấy giọt máu — và chúng không bao giờ thỏa mãn.",
    hooks: {
      onBattleStart({ bearer, log }) {
        bearer.stats.atk = Math.round(bearer.stats.atk * 1.35)
        bearer.stats.mag = Math.round(bearer.stats.mag * 1.35)
        pushLog(log, `🩸 [Giá Máu] ${bearer.name} nhận +35% sát thương đổi lấy sinh lực!`, "status")
      },
      onDealDamage({ bearer, log }) {
        const cost = Math.max(1, Math.round(bearer.hpMax * 0.04))
        bearer.hp = Math.max(1, bearer.hp - cost)
        pushLog(log, `🩸 [Giá Máu] ${bearer.name} mất ${cost} HP từ hợp đồng!`, "damage")
      }
    }
  },

  {
    id: "p_soul_drain",
    name: "Hút Hồn",
    kind: "pact",
    tier: 1,
    shardCost: 2,
    description: "Mỗi kẻ địch tướng này giết, hút 20% HP tối đa của kẻ đó. Nhưng tốc độ giảm 5% sau mỗi lần giết.",
    curseSuffix: "Ác quỷ đòi phần của chúng qua tốc độ dần mòn.",
    lore: "Hút cạn linh hồn — và để lại một vết thương trong tâm hồn kẻ hút.",
    hooks: {
      onKill({ state, bearer, target, log }) {
        if (!target) return
        const steal = Math.round(target.hpMax * 0.20)
        bearer.hp = Math.min(bearer.hpMax, bearer.hp + steal)
        const spdLoss = Math.round(bearer.stats.spd * 0.05)
        bearer.stats.spd = Math.max(10, bearer.stats.spd - spdLoss)
        pushLog(log, `👻 [Hút Hồn] ${bearer.name} hút ${steal} HP từ ${target?.name ?? "kẻ địch"}, mất ${spdLoss} SPD!`, "status")
      }
    }
  },

  {
    id: "p_cursed_blade",
    name: "Lưỡi Nguyền",
    kind: "pact",
    tier: 1,
    shardCost: 3,
    description: "Đòn đánh của tướng này luôn gây thêm 'Băng Hủy' (không thể chữa lành trong 2 lượt). Nhưng tướng này mất 15% DEF và RES.",
    curseSuffix: "Vết thương của ác quỷ ngăn chặn mọi sự chữa lành.",
    lore: "Con dao nguyền từ địa ngục — cứa vào xác thịt và cả linh hồn.",
    hooks: {
      onBattleStart({ bearer, log }) {
        bearer.stats.def = Math.round(bearer.stats.def * 0.85)
        bearer.stats.res = Math.round(bearer.stats.res * 0.85)
        pushLog(log, `🗡️ [Lưỡi Nguyền] ${bearer.name} nhận lưỡi nguyền (-15% DEF/RES)!`, "status")
      },
      onDealDamage({ target, log }) {
        if (!target || target.hp <= 0) return
        // Apply "anti-heal" marker via a status
        const exists = target.statuses.find(s => s.name === "Băng Hủy")
        if (!exists) {
          target.statuses.push({ id: uid(), kind: "defDown", value: 0, turns: 2, name: "Băng Hủy" })
          pushLog(log, `🗡️ [Băng Hủy] ${target.name} không thể hồi HP trong 2 lượt!`, "status")
        } else {
          exists.turns = 2
        }
      }
    }
  },

  {
    id: "p_reaper_pact",
    name: "Giao Kèo Tử Thần",
    kind: "pact",
    tier: 1,
    shardCost: 3,
    description: "Tướng này gây thêm 60% sát thương khi kẻ địch HP dưới 30%. Nhưng bản thân nhận thêm 25% sát thương từ mọi nguồn.",
    curseSuffix: "Ác quỷ tử thần cũng đang dõi theo ngươi.",
    lore: "Cái giao kèo với tử thần là con dao hai lưỡi — sắc bén cho cả hai phía.",
    hooks: {
      onBattleStart({ bearer, log }) {
        bearer.statuses.push({ id: uid(), kind: "defDown", value: 25, turns: 9999, name: "__reaper_vulnerability" })
        pushLog(log, `💀 [Giao Kèo Tử Thần] ${bearer.name} trở nên dễ bị tổn thương hơn!`, "status")
      },
      onDealDamage({ bearer, target, dmg, state, log }) {
        if (!target || !dmg || dmg <= 0) return
        if (target.hp / target.hpMax < 0.3) {
          const bonus = Math.round(dmg * 0.6)
          target.hp = Math.max(0, target.hp - bonus)
          pushLog(log, `💀 [Giao Kèo Tử Thần] Tử thần kề! ${target.name} nhận thêm ${bonus} sát thương!`, "damage")
        }
      }
    }
  },

  // ── Tier 2 ──────────────────────────────────────────────

  {
    id: "p_demon_feast",
    name: "Bữa Tiệc Ác Quỷ",
    kind: "pact",
    tier: 2,
    shardCost: 5,
    description: "Sau mỗi lần giết, tướng này được thêm 1 lượt tấn công ngay lập tức. Nhưng cuối mỗi vòng, mất 8% HP tối đa như 'thuế máu'.",
    curseSuffix: "Tiệc tùng của ác quỷ luôn có hóa đơn phải trả.",
    lore: "Ác quỷ đãi tiệc bằng máu kẻ thù — và thu phí bằng máu ngươi.",
    hooks: {
      onKill({ bearer, log }) {
        pushLog(log, `😈 [Bữa Tiệc Ác Quỷ] ${bearer.name} tiếp tục cơn say máu!`, "info")
        // Mark for extra turn
        bearer.statuses.push({ id: uid(), kind: "spdUp", value: 0, turns: 1, name: "__feast_extra_turn" })
      },
      onRoundEnd({ bearer, log }) {
        const tax = Math.round(bearer.hpMax * 0.08)
        bearer.hp = Math.max(1, bearer.hp - tax)
        pushLog(log, `😈 [Thuế Máu] ${bearer.name} trả ${tax} HP cho ác quỷ!`, "damage")
      }
    }
  },

  {
    id: "p_void_echo",
    name: "Tiếng Vọng Hư Vô",
    kind: "pact",
    tier: 2,
    shardCost: 5,
    description: "Khi tướng này dùng chiêu, có 50% cơ hội chiêu đó bị nhân đôi (tự động tung lại). Nhưng 30% cơ hội chiêu bị phản tác dụng và ảnh hưởng chính tướng này.",
    curseSuffix: "Hư vô không phân biệt bạn hay thù.",
    lore: "Tiếng vọng từ hư vô có thể là đồng minh — hoặc kẻ thù.",
    hooks: {
      onTurnStart({ bearer, log }) {
        pushLog(log, `🌀 [Tiếng Vọng Hư Vô] ${bearer.name} cảm nhận sự bất định của hư vô...`, "info")
      }
      // Main logic handled in performSkill hook — flagged via status
    }
  },

  {
    id: "p_berserker_rage",
    name: "Cuồng Nộ Thú Ác",
    kind: "pact",
    tier: 2,
    shardCost: 6,
    description: "ATK/MAG tăng 5% mỗi lần nhận sát thương (tối đa 20 lần). Nhưng mỗi khi tướng này tấn công, bỏ qua 1 đồng đội ngẫu nhiên và gây 15% sát thương lên họ (không kiểm soát được).",
    curseSuffix: "Cuồng nộ không có mắt — bạn bè hay kẻ thù đều là mục tiêu.",
    lore: "Ác quỷ tặng sức mạnh từ cơn đau — nhưng sức mạnh đó mù quáng.",
    hooks: {
      onTakeDamage({ bearer, log }) {
        const stack = bearer.statuses.find(s => s.name === "__berserker_stack")
        if (stack && stack.value >= 20) return
        const gain = Math.round(bearer.stats.atk * 0.05)
        bearer.stats.atk += gain
        bearer.stats.mag += gain
        if (!stack) {
          bearer.statuses.push({ id: uid(), kind: "atkUp", value: 1, turns: 9999, name: "__berserker_stack" })
        } else {
          stack.value += 1
        }
        pushLog(log, `😤 [Cuồng Nộ] ${bearer.name} +${gain} ATK/MAG từ cơn đau! (${(stack?.value ?? 1)}/20)`, "status")
      },
      onDealDamage({ state, bearer, dmg, log }) {
        if (!dmg || dmg <= 0) return
        const allies = alive(state, bearer.side).filter(u => u.uid !== bearer.uid)
        if (allies.length === 0) return
        if (Math.random() > 0.6) return  // only 40% chance to hit ally
        const victim = allies[Math.floor(Math.random() * allies.length)]
        const friendly = Math.max(1, Math.round(dmg * 0.15))
        victim.hp = Math.max(0, victim.hp - friendly)
        pushLog(log, `😤 [Cuồng Nộ Mù Quáng] ${bearer.name} vô tình đánh ${victim.name} -${friendly}!`, "damage")
      }
    }
  },

  {
    id: "p_death_gamble",
    name: "Canh Bạc Tử Thần",
    kind: "pact",
    tier: 2,
    shardCost: 5,
    description: "Đầu lượt của tướng này, tung đồng xu: Mặt sấp — sát thương tăng 80% lượt này; Mặt ngửa — mất 15% HP ngay lập tức.",
    curseSuffix: "Ác quỷ luôn thắng trong ván cược lâu dài.",
    lore: "Canh bạc với tử thần: đôi khi ngươi thắng — nhưng không bao giờ mãi mãi.",
    hooks: {
      onTurnStart({ bearer, log }) {
        if (Math.random() < 0.5) {
          applyBuff(bearer, "atkUp", 80, 1, "Vận May Ác Quỷ", log)
          pushLog(log, `🎲 [Canh Bạc] Mặt sấp! ${bearer.name} nhận +80% sát thương lượt này!`, "status")
        } else {
          const loss = Math.round(bearer.hpMax * 0.15)
          bearer.hp = Math.max(1, bearer.hp - loss)
          pushLog(log, `🎲 [Canh Bạc] Mặt ngửa! ${bearer.name} mất ${loss} HP!`, "damage")
        }
      }
    }
  },

  {
    id: "p_corruption_spread",
    name: "Lan Truyền Tà Ác",
    kind: "pact",
    tier: 2,
    shardCost: 6,
    description: "Mỗi khi tướng này gây debuff lên kẻ địch, debuff đó lây sang 1 kẻ địch ngẫu nhiên khác. Nhưng tướng này cũng nhận 1 debuff ngẫu nhiên từ kẻ địch mỗi vòng.",
    curseSuffix: "Tà ác lan truyền không chừa một ai.",
    lore: "Ác quỷ gieo mầm bệnh — và mầm bệnh đó không phân biệt chủ nhân.",
    hooks: {
      onDealDamage({ state, bearer, target, log }) {
        if (!target || target.hp <= 0) return
        const debuffs = target.statuses.filter(s => ["atkDown","defDown","spdDown","burn","poison","bleed","stun"].includes(s.kind))
        if (debuffs.length === 0) return
        const spread = debuffs[Math.floor(Math.random() * debuffs.length)]
        const others = alive(state, target.side).filter(u => u.uid !== target.uid)
        if (others.length === 0) return
        const victim = others[Math.floor(Math.random() * others.length)]
        victim.statuses.push({ ...spread, id: uid() })
        pushLog(log, `🦠 [Lan Truyền Tà Ác] ${spread.name} lây từ ${target.name} sang ${victim.name}!`, "status")
      },
      onRoundEnd({ state, bearer, log }) {
        const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
        const allDebuffs = enemies.flatMap(e => e.statuses.filter(s =>
          ["atkDown","defDown","spdDown","burn","poison","bleed"].includes(s.kind)
        ))
        if (allDebuffs.length === 0) return
        const backfire = allDebuffs[Math.floor(Math.random() * allDebuffs.length)]
        bearer.statuses.push({ ...backfire, id: uid(), turns: 1 })
        pushLog(log, `🦠 [Phản Nhiễm] ${bearer.name} cũng bị nhiễm ${backfire.name} từ tà ác của chính mình!`, "status")
      }
    }
  },

  // ── Tier 3 ──────────────────────────────────────────────

  {
    id: "p_apocalypse_seal",
    name: "Ấn Tận Thế",
    kind: "pact",
    tier: 3,
    shardCost: 12,
    description: "Sau 5 vòng, gọi Ấn Tận Thế: tất cả kẻ địch mất 40% HP tối đa (sát thương thật), đồng thời tất cả đồng đội cũng mất 15% HP. Thú quỷ xuất hiện mỗi 5 vòng.",
    curseSuffix: "Tận thế không phân biệt bạn thù.",
    lore: "Ấn Tận Thế của ác quỷ tối cao hủy diệt tất cả — nhưng bên phục vụ chúng cũng chịu ảnh hưởng.",
    hooks: {
      onBattleStart({ bearer }) {
        bearer.statuses.push({ id: uid(), kind: "spdUp", value: 0, turns: 9999, name: "__apocalypse_round_counter" })
      },
      onRoundEnd({ state, bearer, log }) {
        const counter = bearer.statuses.find(s => s.name === "__apocalypse_round_counter")
        if (!counter) return
        counter.value += 1
        if (counter.value % 5 === 0) {
          pushLog(log, `🔴 [ẤN TẬN THẾ] ${bearer.name} giải phóng Ấn Tận Thế!`, "system")
          const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
          for (const e of enemies) {
            const dmg = Math.round(e.hpMax * 0.4)
            e.hp = Math.max(0, e.hp - dmg)
            pushLog(log, `🔴 ${e.name} mất ${dmg} từ Ấn Tận Thế!`, "damage")
          }
          const allies = alive(state, bearer.side)
          for (const a of allies) {
            const cost = Math.round(a.hpMax * 0.15)
            a.hp = Math.max(1, a.hp - cost)
            pushLog(log, `🔴 ${a.name} cũng chịu ${cost} từ phản lực Tận Thế!`, "damage")
          }
        }
      }
    }
  },

  {
    id: "p_dark_mirror",
    name: "Gương Tối",
    kind: "pact",
    tier: 3,
    shardCost: 11,
    description: "Tướng này sao chép hoàn toàn mọi buff của kẻ địch mạnh nhất ngay khi chúng kích hoạt. Nhưng mỗi buff sao chép, mất 5% HP. Khi chết, gương tối vỡ — gây 100% HP tối đa của mình lên tất cả kẻ địch (sát thương thật).",
    curseSuffix: "Gương tối phản chiếu sức mạnh — và cái giá là linh hồn.",
    lore: "Ác quỷ tặng gương nhìn thấu sức mạnh kẻ địch — nhưng mỗi lần nhìn, tâm hồn mờ đi một phần.",
    hooks: {
      onTurnStart({ state, bearer, log }) {
        const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
        if (enemies.length === 0) return
        const strongest = enemies.reduce((a, b) => a.stats.atk + a.stats.mag > b.stats.atk + b.stats.mag ? a : b)
        const buffs = strongest.statuses.filter(s => ["atkUp","defUp","spdUp","shield","regen"].includes(s.kind))
        if (buffs.length === 0) return
        const copy = buffs[Math.floor(Math.random() * buffs.length)]
        bearer.statuses.push({ ...copy, id: uid(), turns: Math.min(copy.turns, 2) })
        const cost = Math.round(bearer.hpMax * 0.05)
        bearer.hp = Math.max(1, bearer.hp - cost)
        pushLog(log, `🪞 [Gương Tối] ${bearer.name} sao chép ${copy.name} từ ${strongest.name}, mất ${cost} HP!`, "status")
      }
    }
  },

  {
    id: "p_sin_harvest",
    name: "Thu Hoạch Tội Lỗi",
    kind: "pact",
    tier: 3,
    shardCost: 13,
    description: "Mỗi khi bất kỳ nhân vật nào (bạn hay thù) nhận sát thương, tướng này tích 'Tội Lỗi'. Khi đủ 100 Tội Lỗi, giải phóng: gây sát thương thật bằng 150% tổng Tội Lỗi tích lũy lên tất cả kẻ địch, rồi reset. Nhưng HP tối đa giảm 3% mỗi lần giải phóng.",
    curseSuffix: "Tội lỗi của cả hai phía đổ xuống đầu ngươi.",
    lore: "Ác quỷ thu hoạch từng giọt đau khổ — và phun trả thành dòng lũ.",
    hooks: {
      onBattleStart({ bearer }) {
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 9999, name: "__sin_counter" })
      },
      onTakeDamage({ bearer, dmg }) {
        const counter = bearer.statuses.find(s => s.name === "__sin_counter")
        if (counter && dmg) counter.value += Math.floor(dmg / 10)
      },
      onDealDamage({ bearer, dmg, state, log }) {
        const counter = bearer.statuses.find(s => s.name === "__sin_counter")
        if (counter && dmg) {
          counter.value += Math.floor(dmg / 10)
          if (counter.value >= 100) {
            const burst = Math.round(counter.value * 1.5)
            const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
            for (const e of enemies) {
              e.hp = Math.max(0, e.hp - burst)
            }
            pushLog(log, `😈 [Thu Hoạch Tội Lỗi] ${bearer.name} giải phóng ${counter.value} tội lỗi — ${burst} sát thương thật lên mọi kẻ địch!`, "damage")
            counter.value = 0
            bearer.hpMax = Math.max(100, Math.round(bearer.hpMax * 0.97))
            bearer.hp = Math.min(bearer.hp, bearer.hpMax)
            pushLog(log, `😈 HP tối đa của ${bearer.name} giảm 3%!`, "status")
          }
        }
      }
    }
  },

  {
    id: "p_hollow_king",
    name: "Vương Rỗng Tuếch",
    kind: "pact",
    tier: 3,
    shardCost: 12,
    description: "Tướng này mất toàn bộ DEF và RES (về 0). Đổi lại, mỗi điểm DEF/RES mất đi được cộng gấp đôi vào ATK và MAG. Khi HP dưới 50%, nhận thêm 50% sát thương từ mọi nguồn.",
    curseSuffix: "Vương không cần giáp — nhưng một đòn trúng có thể kết liễu.",
    lore: "Ác quỷ rỗng tuếch không cần bảo vệ — chúng giết trước khi bị giết.",
    hooks: {
      onBattleStart({ bearer, log }) {
        const defBonus = bearer.stats.def * 2
        const resBonus = bearer.stats.res * 2
        bearer.stats.atk += defBonus
        bearer.stats.mag += resBonus
        bearer.stats.def = 0
        bearer.stats.res = 0
        pushLog(log, `💀 [Vương Rỗng Tuếch] ${bearer.name} xóa bỏ mọi phòng thủ, +${defBonus} ATK +${resBonus} MAG!`, "status")
      }
    }
  },

  {
    id: "p_world_eater",
    name: "Kẻ Nuốt Thế Giới",
    kind: "pact",
    tier: 3,
    shardCost: 14,
    description: "Mỗi khi tướng này giết kẻ địch, lấy 30% ATK, MAG, SPD của kẻ đó. Nhưng mỗi 3 vòng, tướng này mất 15% HP tối đa tích lũy — cơ thể không thể chứa đựng sức mạnh đánh cắp mãi mãi.",
    curseSuffix: "Kẻ nuốt thế giới rốt cuộc cũng bị thế giới nuốt lại.",
    lore: "Ác quỷ tối thượng nuốt cả thần linh — nhưng thứ nuốt vào sẽ gặm nhấm từ bên trong.",
    hooks: {
      onKill({ bearer, target, log }) {
        if (!target) return
        const atkSteal = Math.round(target.stats.atk * 0.3)
        const magSteal = Math.round(target.stats.mag * 0.3)
        const spdSteal = Math.round(target.stats.spd * 0.3)
        bearer.stats.atk += atkSteal
        bearer.stats.mag += magSteal
        bearer.stats.spd += spdSteal
        pushLog(log, `🌑 [Kẻ Nuốt Thế Giới] ${bearer.name} nuốt ${target.name}: +${atkSteal} ATK +${magSteal} MAG +${spdSteal} SPD!`, "status")
      },
      onRoundEnd({ bearer, log }) {
        const counter = bearer.statuses.find(s => s.name === "__world_eater_rnd")
        if (!counter) {
          bearer.statuses.push({ id: uid(), kind: "atkUp", value: 1, turns: 9999, name: "__world_eater_rnd" })
          return
        }
        counter.value++
        if (counter.value % 3 === 0) {
          const penalty = Math.round(bearer.hpMax * 0.15)
          bearer.hpMax = Math.max(100, bearer.hpMax - penalty)
          bearer.hp = Math.min(bearer.hp, bearer.hpMax)
          pushLog(log, `🌑 [Kẻ Nuốt Thế Giới] Cơ thể ${bearer.name} sụp đổ! HP tối đa -${penalty}!`, "damage")
        }
      }
    }
  },

  {
    id: "p_cursed_immortal",
    name: "Xác Chết Biết Đi",
    kind: "pact",
    tier: 3,
    shardCost: 13,
    description: "Tướng này mất khả năng hồi HP từ mọi nguồn hoàn toàn. Đổi lại, mỗi khi HP giảm xuống dưới một ngưỡng mới (50%, 30%, 15%), tướng này bùng phát: tấn công tức thì kẻ địch HP thấp nhất với 120% ATK sát thương thật. Mỗi bùng phát chỉ xảy ra một lần.",
    curseSuffix: "Không thể chữa lành — chỉ có thể tiếp tục tàn phá cho đến khi ngã xuống.",
    lore: "Ác quỷ cướp đi khả năng chữa lành — đổi lấy cơn thịnh nộ của kẻ biết mình đang chết dần.",
    hooks: {
      onBattleStart({ bearer, log }) {
        bearer.statuses.push({ id: uid(), kind: "defDown", value: 0, turns: 9999, name: "__walking_dead_active" })
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 9999, name: "__walking_dead_thresholds" })
        pushLog(log, `💀 [Xác Chết Biết Đi] ${bearer.name} mất khả năng hồi HP — mỗi lần gần chết sẽ bùng phát!`, "info")
      },
      onTakeDamage({ state, bearer, log }) {
        const thresholds = [0.5, 0.3, 0.15]
        const pct = bearer.hp / bearer.hpMax
        const status = bearer.statuses.find(s => s.name === "__walking_dead_thresholds")
        if (!status) return
        for (let i = 0; i < thresholds.length; i++) {
          const bit = 1 << i
          if (pct < thresholds[i] && !(status.value & bit)) {
            status.value |= bit
            const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
            if (enemies.length === 0) return
            const target = enemies.reduce((a, b) => a.hp < b.hp ? a : b)
            const dmg = Math.round(bearer.stats.atk * 1.2)
            target.hp = Math.max(0, target.hp - dmg)
            pushLog(log, `💀 [Xác Chết Biết Đi] Bùng phát tại ${Math.round(thresholds[i]*100)}% HP! ${target.name} -${dmg} sát thương thật!`, "damage")
          }
        }
      }
    }
  },

  {
    id: "p_void_sovereign",
    name: "Chúa Tể Hư Vô",
    kind: "pact",
    tier: 3,
    shardCost: 15,
    description: "Khi tướng này dùng tối thượng, xóa bỏ mọi buff của tất cả kẻ địch và hút toàn bộ giá trị buff đó (quy đổi thành ATK). Nhưng năng lượng nạp chậm hơn 40% và chiêu tối thượng có cooldown thêm 1 vòng.",
    curseSuffix: "Hư vô hấp thụ tất cả — kể cả thời gian của chính ngươi.",
    lore: "Chúa tể hư vô không cần sức mạnh của riêng mình — chúng lấy của người khác.",
    hooks: {
      onUltimate({ state, bearer, log }) {
        const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
        let totalAbsorbed = 0
        for (const e of enemies) {
          const buffs = e.statuses.filter(s => ["atkUp","defUp","spdUp","shield","regen"].includes(s.kind))
          totalAbsorbed += buffs.reduce((sum, b) => sum + b.value, 0)
          e.statuses = e.statuses.filter(s => !["atkUp","defUp","spdUp","shield","regen"].includes(s.kind))
        }
        const atkBonus = Math.round(totalAbsorbed * 10)
        if (atkBonus > 0) {
          bearer.stats.atk += atkBonus
          pushLog(log, `🌌 [Chúa Tể Hư Vô] ${bearer.name} hút sạch buff địch, nhận +${atkBonus} ATK!`, "status")
        } else {
          pushLog(log, `🌌 [Chúa Tể Hư Vô] ${bearer.name} xóa buff địch nhưng không có gì để hút!`, "info")
        }
      },
      onBattleStart({ bearer }) {
        // Reduce energy gain passively via status marker
        bearer.statuses.push({ id: uid(), kind: "spdDown", value: 0, turns: 9999, name: "__void_sovereign_penalty" })
      }
    }
  },

  {
    id: "p_death_mirror",
    name: "Gương Tử Thần",
    kind: "pact",
    tier: 3,
    shardCost: 14,
    description: "Mỗi khi một kẻ địch chết, linh hồn chúng bị bẫy: gây thêm 80% ATK sát thương thật lên tất cả kẻ địch còn lại. Nhưng mỗi khi linh hồn kích hoạt, tướng này mất 10% HP tối đa.",
    curseSuffix: "Gương tử thần phản chiếu mọi cái chết — kể cả của ngươi.",
    lore: "Ác quỷ thu hồn kẻ chết và dùng chúng như vũ khí. Giá phải trả là một phần sinh mệnh của kẻ sử dụng.",
    hooks: {
      onRoundEnd({ state, bearer, log }) {
        const deadEnemies = state.units.filter(u => u.side !== bearer.side && u.hp <= 0)
        if (deadEnemies.length === 0) return
        const counter = bearer.statuses.find(s => s.name === "__death_mirror_kills")
        const prevKills = counter?.value ?? 0
        const currentKills = deadEnemies.length
        const newKills = currentKills - prevKills
        if (newKills <= 0) return
        if (!counter) bearer.statuses.push({ id: uid(), kind: "atkUp", value: currentKills, turns: 9999, name: "__death_mirror_kills" })
        else counter.value = currentKills
        const aliveEnemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
        const dmg = Math.round(bearer.stats.atk * 0.8 * newKills)
        for (const e of aliveEnemies) {
          e.hp = Math.max(0, e.hp - dmg)
        }
        const hpCost = Math.round(bearer.hpMax * 0.1 * newKills)
        bearer.hpMax = Math.max(100, bearer.hpMax - hpCost)
        bearer.hp = Math.min(bearer.hp, bearer.hpMax)
        pushLog(log, `🪞 [Gương Tử Thần] ${newKills} linh hồn kích hoạt! ${dmg} sát thương thật lên địch còn lại, ${bearer.name} mất ${hpCost} HP tối đa!`, "damage")
      }
    }
  },

  {
    id: "p_hellfire_baptism",
    name: "Lễ Rửa Tội Địa Ngục",
    kind: "pact",
    tier: 3,
    shardCost: 13,
    description: "Đầu trận, tướng này bốc cháy Lửa Địa Ngục (mất 8% HP tối đa/vòng, không thể tắt). Đổi lại, nhận +60% ATK và +60% MAG chỉ cho bản thân. Mỗi lần Lửa Địa Ngục gây sát thương, lan tia lửa nhỏ lên một kẻ địch ngẫu nhiên (3% HP tối đa địch).",
    curseSuffix: "Lửa địa ngục thiêu đốt kẻ mang nó trước khi thiêu đốt kẻ thù.",
    lore: "Ác quỷ rửa tội bằng lửa — sức mạnh xuất phát từ ngọn lửa đang ăn mòn chính mình.",
    hooks: {
      onBattleStart({ bearer, log }) {
        bearer.stats.atk = Math.round(bearer.stats.atk * 1.6)
        bearer.stats.mag = Math.round(bearer.stats.mag * 1.6)
        applyDot(bearer, "burn", 0.08, 9999, "Lửa Địa Ngục", log)
        pushLog(log, `🔥 [Lễ Rửa Tội] ${bearer.name} nhận +60% ATK/MAG nhưng bị đốt 8% HP/vòng vĩnh viễn!`, "status")
      },
      onTurnEnd({ state, bearer, log }) {
        const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
        if (enemies.length === 0) return
        const target = enemies[Math.floor(Math.random() * enemies.length)]
        const spark = Math.round(target.hpMax * 0.03)
        target.hp = Math.max(0, target.hp - spark)
        pushLog(log, `🔥 [Tia Lửa] Lửa địa ngục bắn tia sang ${target.name} -${spark}!`, "damage")
      }
    }
  },

  {
    id: "p_soul_usurper",
    name: "Cướp Đoạt Linh Hồn",
    kind: "pact",
    tier: 3,
    shardCost: 16,
    description: "Khi tướng này HP dưới 30%, chúng cướp linh hồn kẻ địch có HP cao nhất: hoán đổi toàn bộ chỉ số ATK, MAG, SPD với kẻ đó trong 3 vòng. Kẻ địch nhận lại chỉ số yếu hơn và bị choáng 1 lượt. Sau 3 vòng, chỉ số quay về — nhưng tướng này mất 20% HP tối đa.",
    curseSuffix: "Linh hồn bị cướp sẽ đòi lại gấp đôi khi được trả.",
    lore: "Ác quỷ không tạo ra sức mạnh — chúng cướp đoạt nó từ kẻ xứng đáng hơn.",
    hooks: {
      onLowHp({ state, bearer, log }) {
        if (bearer.statuses.some(s => s.name === "__usurp_used")) return
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 1, turns: 9999, name: "__usurp_used" })
        const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
        if (enemies.length === 0) return
        const target = enemies.reduce((a, b) => (a.stats.atk + a.stats.mag) > (b.stats.atk + b.stats.mag) ? a : b)
        // Store bearer's original stats before swap so we can revert
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: bearer.stats.atk, turns: 9999, name: "__usurp_orig_atk" })
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: bearer.stats.mag, turns: 9999, name: "__usurp_orig_mag" })
        bearer.statuses.push({ id: uid(), kind: "spdUp", value: bearer.stats.spd, turns: 9999, name: "__usurp_orig_spd" })
        // Swap stats
        const [bAtk, bMag, bSpd] = [bearer.stats.atk, bearer.stats.mag, bearer.stats.spd]
        bearer.stats.atk = target.stats.atk
        bearer.stats.mag = target.stats.mag
        bearer.stats.spd = target.stats.spd
        target.stats.atk = bAtk
        target.stats.mag = bMag
        target.stats.spd = bSpd
        // Stun target
        applyDebuff(target, "stun", 1, 1, "Bị Cướp Hồn", log)
        // Countdown for revert (3 rounds → use turns:3 as a real timer via onRoundEnd)
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 3, turns: 9999, name: "__usurp_revert_count" })
        pushLog(log, `👹 [Cướp Đoạt Linh Hồn] ${bearer.name} hoán đổi chỉ số với ${target.name}! ${target.name} bị choáng! (3 vòng)`, "status")
      },
      onRoundEnd({ bearer, log }) {
        const revert = bearer.statuses.find(s => s.name === "__usurp_revert_count")
        if (!revert) return
        revert.value -= 1
        if (revert.value <= 0) {
          // Revert stats from stored originals
          const origAtk = bearer.statuses.find(s => s.name === "__usurp_orig_atk")?.value ?? bearer.stats.atk
          const origMag = bearer.statuses.find(s => s.name === "__usurp_orig_mag")?.value ?? bearer.stats.mag
          const origSpd = bearer.statuses.find(s => s.name === "__usurp_orig_spd")?.value ?? bearer.stats.spd
          bearer.stats.atk = origAtk
          bearer.stats.mag = origMag
          bearer.stats.spd = origSpd
          bearer.statuses = bearer.statuses.filter(s => !["__usurp_revert_count","__usurp_orig_atk","__usurp_orig_mag","__usurp_orig_spd"].includes(s.name))
          const hpLoss = Math.round(bearer.hpMax * 0.2)
          bearer.hpMax = Math.max(100, bearer.hpMax - hpLoss)
          bearer.hp = Math.min(bearer.hp, bearer.hpMax)
          pushLog(log, `👹 [Cướp Đoạt Linh Hồn] Chỉ số trả về! ${bearer.name} mất ${hpLoss} HP tối đa!`, "damage")
        }
      }
    }
  },

  {
    id: "p_twin_damnation",
    name: "Song Đọa Đày",
    kind: "pact",
    tier: 3,
    shardCost: 15,
    description: "Mỗi đòn đánh của tướng này tạo ra một 'Dấu Đọa Đày' trên mục tiêu. Khi tướng này chịu sát thương, tất cả Dấu Đọa Đày trên mọi kẻ địch nổ tung gây 50% ATK sát thương thật mỗi dấu. Nhưng nổ tung cũng hao tổn 3% HP tối đa của tướng này mỗi dấu.",
    curseSuffix: "Đọa đày kẻ thù — và mang chút đọa đày về phần mình.",
    lore: "Ác quỷ trói buộc kẻ thù bằng dây xích nguyền rủa — nhưng dây xích đó cũng buộc vào cổ tay ác quỷ.",
    hooks: {
      onDealDamage({ bearer, target, log }) {
        if (!target || target.hp <= 0) return
        const existing = target.statuses.filter(s => s.name === `__twin_damn_${bearer.uid}`).length
        if (existing < 5) {
          target.statuses.push({ id: uid(), kind: "defDown", value: 0, turns: 9999, name: `__twin_damn_${bearer.uid}` })
          pushLog(log, `⛓️ [Song Đọa Đày] ${target.name} nhận Dấu Đọa Đày (${existing + 1})!`, "status")
        }
      },
      onTakeDamage({ state, bearer, dmg, log }) {
        if (!dmg || dmg <= 0) return
        const enemies = state.units.filter(u => u.side !== bearer.side)
        let totalMarks = 0
        for (const e of enemies) {
          const marks = e.statuses.filter(s => s.name === `__twin_damn_${bearer.uid}`)
          if (marks.length === 0) continue
          totalMarks += marks.length
          const burst = Math.round(bearer.stats.atk * 0.5 * marks.length)
          e.hp = Math.max(0, e.hp - burst)
          e.statuses = e.statuses.filter(s => s.name !== `__twin_damn_${bearer.uid}`)
          pushLog(log, `⛓️ [Song Đọa Đày] ${marks.length} dấu nổ tung trên ${e.name}: -${burst}!`, "damage")
        }
        if (totalMarks > 0) {
          const selfCost = Math.round(bearer.hpMax * 0.03 * totalMarks)
          bearer.hpMax = Math.max(100, bearer.hpMax - selfCost)
          bearer.hp = Math.min(bearer.hp, bearer.hpMax)
          pushLog(log, `⛓️ [Song Đọa Đày] ${bearer.name} hao tổn ${selfCost} HP tối đa từ phản lực!`, "damage")
        }
      }
    }
  },

  {
    id: "p_oblivion_pact",
    name: "Giao Kèo Quên Lãng",
    kind: "pact",
    tier: 3,
    shardCost: 15,
    description: "Tướng này mất khả năng dùng tối thượng vĩnh viễn (năng lượng tích đến max rồi bị xả, gây 60% ATK sát thương thật lên địch ngẫu nhiên). Đổi lại, cooldown mọi kỹ năng thường chỉ còn 1 lượt và mỗi lần năng lượng bị xả cưỡng bức, tướng này nhận +8% ATK vĩnh viễn.",
    curseSuffix: "Đổi đỉnh cao để trở nên liên tục và không ngừng nghỉ — sức mạnh tích lũy nhưng không bao giờ bùng nổ đúng nghĩa.",
    lore: "Ác quỷ lấy đi quyền tỏa sáng — đổi lấy áp lực không hồi kết.",
    hooks: {
      onBattleStart({ bearer, log }) {
        bearer.cooldowns[2] = 99
        pushLog(log, `🌑 [Giao Kèo Quên Lãng] ${bearer.name} mất tối thượng — kỹ năng thường cooldown 1, năng lượng tích sẽ tự xả!`, "status")
      },
      onTurnStart({ state, bearer, log }) {
        bearer.cooldowns[0] = Math.min(bearer.cooldowns[0], 1)
        bearer.cooldowns[1] = Math.min(bearer.cooldowns[1], 1)
        bearer.cooldowns[2] = 99
        if (bearer.energy >= bearer.energyMax) {
          const enemies = state.units.filter(u => u.side !== bearer.side && u.hp > 0)
          if (enemies.length > 0) {
            const target = enemies[Math.floor(Math.random() * enemies.length)]
            const dmg = Math.round(bearer.stats.atk * 0.6)
            target.hp = Math.max(0, target.hp - dmg)
            pushLog(log, `🌑 [Năng Lượng Xả Cưỡng] ${bearer.name} phóng năng lượng tích tụ: ${target.name} -${dmg}!`, "damage")
          }
          const gain = Math.round(bearer.stats.atk * 0.08)
          bearer.stats.atk += gain
          bearer.energy = 0
          pushLog(log, `🌑 [Quên Lãng Tích Lũy] +${gain} ATK vĩnh viễn!`, "status")
        }
      }
    }
  },

  // ── Tier 2 (New) ────────────────────────────────────────

  {
    id: "p_chain_of_debt",
    name: "Xích Nợ Ác Quỷ",
    kind: "pact",
    tier: 2,
    shardCost: 5,
    description: "Mỗi khi nhận sát thương, 80% lượng đó tích vào 'Nợ Máu'. Mỗi đòn đánh gây thêm sát thương thật bằng 100% Nợ Máu hiện tại. Cuối vòng, trả 50% Nợ Máu bằng HP thật.",
    curseSuffix: "Nợ ác quỷ không mất đi — chỉ dồn lại đến khi không thể trả.",
    lore: "Ác quỷ cho ngươi vay thời gian — lãi suất là cả mạng sống.",
    hooks: {
      onBattleStart({ bearer }) {
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 9999, name: "__blood_debt" })
      },
      onTakeDamage({ bearer, dmg }) {
        if (!dmg || dmg <= 0) return
        const debt = bearer.statuses.find(s => s.name === "__blood_debt")
        if (debt) debt.value += Math.round(dmg * 0.8)
      },
      onDealDamage({ bearer, target, log }) {
        if (!target || target.hp <= 0) return
        const debt = bearer.statuses.find(s => s.name === "__blood_debt")
        if (!debt || debt.value <= 0) return
        const bonus = Math.round(debt.value)
        target.hp = Math.max(0, target.hp - bonus)
        pushLog(log, `⛓️ [Đòn Nợ Máu] ${bearer.name} giải phóng ${bonus} Nợ Máu lên ${target.name}!`, "damage")
      },
      onRoundEnd({ bearer, log }) {
        const debt = bearer.statuses.find(s => s.name === "__blood_debt")
        if (!debt || debt.value <= 0) return
        const payment = Math.round(debt.value * 0.5)
        bearer.hp = Math.max(1, bearer.hp - payment)
        debt.value = Math.round(debt.value * 0.5)
        pushLog(log, `⛓️ [Thanh Toán Nợ] ${bearer.name} trả ${payment} HP cho ác quỷ! Nợ còn: ${debt.value}`, "damage")
      }
    }
  },

  {
    id: "p_parasite_king",
    name: "Ký Sinh Vương",
    kind: "pact",
    tier: 2,
    shardCost: 6,
    description: "Ký sinh lên kẻ địch mạnh nhất: sao chép 25% ATK, MAG, DEF của mục tiêu. Mỗi vòng, ký chủ mất 3% các chỉ số đó. Khi ký chủ chết, tướng này mất 25% HP hiện tại và chuyển ký sinh sang mục tiêu mới.",
    curseSuffix: "Ký sinh không tồn tại được khi ký chủ chết.",
    lore: "Ác quỷ không chiến đấu bằng sức riêng — chúng bám víu vào sức mạnh kẻ khác.",
    hooks: {
      onBattleStart({ state, bearer, log }) {
        const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
        if (enemies.length === 0) return
        const host = enemies.reduce((a, b) => (a.stats.atk + a.stats.mag) > (b.stats.atk + b.stats.mag) ? a : b)
        bearer.stats.atk += Math.round(host.stats.atk * 0.25)
        bearer.stats.mag += Math.round(host.stats.mag * 0.25)
        bearer.stats.def += Math.round(host.stats.def * 0.25)
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 9999, name: `__parasite:${host.uid}` })
        pushLog(log, `🪱 [Ký Sinh Vương] ${bearer.name} ký sinh lên ${host.name}!`, "status")
      },
      onRoundEnd({ state, bearer, log }) {
        const parasiteStatus = bearer.statuses.find(s => s.name.startsWith("__parasite:"))
        if (!parasiteStatus) return
        const hostUid = parasiteStatus.name.split(":")[1]
        const host = state.units.find(u => u.uid === hostUid)
        if (!host || host.hp <= 0) {
          bearer.statuses = bearer.statuses.filter(s => !s.name.startsWith("__parasite:"))
          const penalty = Math.round(bearer.hp * 0.25)
          bearer.hp = Math.max(1, bearer.hp - penalty)
          pushLog(log, `🪱 [Ký Chủ Chết!] ${bearer.name} mất ${penalty} HP!`, "damage")
          const enemies = alive(state, bearer.side === "player" ? "enemy" : "player")
          if (enemies.length > 0) {
            const newHost = enemies.reduce((a, b) => (a.stats.atk + a.stats.mag) > (b.stats.atk + b.stats.mag) ? a : b)
            bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 9999, name: `__parasite:${newHost.uid}` })
            pushLog(log, `🪱 [Ký Sinh Mới] ${bearer.name} chuyển sang ${newHost.name}!`, "info")
          }
          return
        }
        const drain = Math.round(host.stats.atk * 0.03)
        if (drain > 0) host.stats.atk = Math.max(1, host.stats.atk - drain)
        const magDrain = Math.round(host.stats.mag * 0.03)
        if (magDrain > 0) host.stats.mag = Math.max(1, host.stats.mag - magDrain)
        pushLog(log, `🪱 [Hút Tinh Lực] ${host.name} mất ${drain} ATK!`, "status")
      }
    }
  },

  // ── Tier 3 (New) ────────────────────────────────────────

  {
    id: "p_abyssal_throne",
    name: "Ngai Vàng Vực Thẳm",
    kind: "pact",
    tier: 3,
    shardCost: 14,
    description: "Tối đa 2 lần mỗi trận: khi HP về 0, tướng này hồi sống với 1 HP và miễn sát thương 1 lượt. Mỗi lần kích hoạt: toàn đội đồng minh mất 20% HP hiện tại và tướng này mất vĩnh viễn 10% ATK/MAG.",
    curseSuffix: "Ngai vàng vực thẳm đòi tế phẩm từ đồng đội.",
    lore: "Ác quỷ tối cao bất tử — nhưng đơn độc.",
    hooks: {
      onTakeDamage({ state, bearer, log }) {
        if (bearer.hp > 0) return
        const uses = bearer.statuses.filter(s => s.name === "__abyssal_throne_use").length
        if (uses >= 2) return
        bearer.hp = 1
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: uses + 1, turns: 9999, name: "__abyssal_throne_use" })
        applyBuff(bearer, "shield", 1.0, 1, "Bất Tử Vực Thẳm", log)
        pushLog(log, `🕳️ [NGAI VÀNG VỰC THẲM] ${bearer.name} KHÔNG THỂ CHẾT! (lần ${uses + 1}/2)`, "status")
        for (const a of alive(state, bearer.side).filter(u => u.uid !== bearer.uid)) {
          const cost = Math.round(a.hp * 0.2)
          a.hp = Math.max(1, a.hp - cost)
          pushLog(log, `🕳️ ${a.name} hiến tế ${cost} HP!`, "damage")
        }
        bearer.stats.atk = Math.round(bearer.stats.atk * 0.9)
        bearer.stats.mag = Math.round(bearer.stats.mag * 0.9)
        pushLog(log, `🕳️ ${bearer.name} mất vĩnh viễn 10% ATK/MAG!`, "status")
      }
    }
  },

  {
    id: "p_soul_auction",
    name: "Đấu Giá Linh Hồn",
    kind: "pact",
    tier: 3,
    shardCost: 12,
    description: "Cuối mỗi vòng, đấu giá một chỉ số ngẫu nhiên với ác quỷ: 50% nhận +40% trong 2 lượt; 50% mất vĩnh viễn 8%. Thua đủ 5 lần: tướng này chết ngay nhưng gây 300% ATK sát thương thật lên toàn địch.",
    curseSuffix: "Mỗi canh bạc với ác quỷ đều có ngày tổng kết.",
    lore: "Ác quỷ mua linh hồn từng mảnh — và ngươi luôn nghĩ mình thắng cho đến khi không còn gì để bán.",
    hooks: {
      onBattleStart({ bearer }) {
        bearer.statuses.push({ id: uid(), kind: "atkUp", value: 0, turns: 9999, name: "__auction_losses" })
      },
      onRoundEnd({ state, bearer, log }) {
        const lossTracker = bearer.statuses.find(s => s.name === "__auction_losses")
        if (!lossTracker || lossTracker.value >= 5) return
        const statKeys = ["atk", "def", "spd", "mag"] as const
        const chosen = statKeys[Math.floor(Math.random() * statKeys.length)]
        if (Math.random() < 0.5) {
          const gain = Math.round(bearer.stats[chosen] * 0.4)
          const kind = chosen === "def" ? "defUp" : chosen === "spd" ? "spdUp" : "atkUp"
          bearer.statuses.push({ id: uid(), kind, value: gain, turns: 2, name: "Đấu Giá Thắng" })
          pushLog(log, `🎰 [Đấu Giá THẮNG] ${bearer.name} nhận +${gain} ${chosen.toUpperCase()} trong 2 lượt!`, "status")
        } else {
          lossTracker.value += 1
          bearer.stats[chosen] = Math.max(1, Math.round(bearer.stats[chosen] * 0.92))
          pushLog(log, `🎰 [Đấu Giá THUA] ${bearer.name} mất 8% ${chosen.toUpperCase()} vĩnh viễn! (${lossTracker.value}/5)`, "damage")
          if (lossTracker.value >= 5) {
            const burst = Math.round(bearer.stats.atk * 3.0)
            for (const e of alive(state, bearer.side === "player" ? "enemy" : "player")) {
              e.hp = Math.max(0, e.hp - burst)
            }
            pushLog(log, `🎰 [THU HỒI HỢP ĐỒNG] Ác quỷ thu hồn ${bearer.name}! ${burst} sát thương lên mọi địch!`, "system")
            bearer.hp = 0
          }
        }
      }
    }
  },
]

// ============================================================
// Lookup maps
// ============================================================
export const BLESSINGS_BY_ID: Record<string, BlessingPact> = {}
for (const b of BLESSINGS) BLESSINGS_BY_ID[b.id] = b

export const PACTS_BY_ID: Record<string, BlessingPact> = {}
for (const p of PACTS) PACTS_BY_ID[p.id] = p

export const ALL_BLESSINGS_PACTS: BlessingPact[] = [...BLESSINGS, ...PACTS]
export const ALL_BY_ID: Record<string, BlessingPact> = { ...BLESSINGS_BY_ID, ...PACTS_BY_ID }

// ============================================================
// Shard roll tables
// ============================================================
export type ShardRollResult = {
  blessingShards: number
  pactShards: number
}

// Gem roll: 50 gems → 2-8 shards, mix of blessing + pact
export function rollShardsGems(): ShardRollResult {
  const total = rollCount([
    { n: 2, w: 20 }, { n: 3, w: 30 }, { n: 4, w: 25 }, { n: 5, w: 15 },
    { n: 6, w: 6 }, { n: 7, w: 3 }, { n: 8, w: 1 },
  ])
  return splitShards(total)
}

// Gold roll: 1000 gold → 1-4 shards
export function rollShardsGold(): ShardRollResult {
  const total = rollCount([
    { n: 1, w: 50 }, { n: 2, w: 30 }, { n: 3, w: 15 }, { n: 4, w: 5 },
  ])
  return splitShards(total)
}

function rollCount(table: { n: number; w: number }[]): number {
  const total = table.reduce((s, e) => s + e.w, 0)
  let r = Math.random() * total
  for (const e of table) {
    r -= e.w
    if (r <= 0) return e.n
  }
  return table[table.length - 1].n
}

function splitShards(total: number): ShardRollResult {
  // roughly 60% blessing, 40% pact
  let blessingShards = 0, pactShards = 0
  for (let i = 0; i < total; i++) {
    if (Math.random() < 0.6) blessingShards++
    else pactShards++
  }
  return { blessingShards, pactShards }
}

// ============================================================
// Helper: get all hooks for a given blessingPactId
// ============================================================
export function getBlessingPactHooks(id: string): BlessingPactHooks | null {
  return ALL_BY_ID[id]?.hooks ?? null
}
