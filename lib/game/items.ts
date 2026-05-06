import type { ItemTemplate, Rarity, ShopKind } from "./types"
import { SHOP_RARITY_WEIGHTS } from "./rarity"

// ============================================================
// Weapons (atk / mag focused)
// ============================================================
const WEAPONS: ItemTemplate[] = [
  // Common
  { id: "w_shortsword", name: "Đoản Kiếm Sắt", kind: "equip", slot: "weapon", rarity: "common", stats: { atk: 12, crit: 3 }, description: "Đoản kiếm rèn từ thép thô.", basePrice: 220 },
  { id: "w_woodbow", name: "Cung Gỗ Du", kind: "equip", slot: "weapon", rarity: "common", stats: { atk: 10, spd: 8 }, description: "Cung làm từ gỗ du, nhẹ và êm.", basePrice: 220 },
  { id: "w_appstaff", name: "Trượng Học Việc", kind: "equip", slot: "weapon", rarity: "common", stats: { mag: 14, res: 5 }, description: "Trượng dành cho học trò pháp sư.", basePrice: 240 },
  { id: "w_irondagger", name: "Chủy Sắt", kind: "equip", slot: "weapon", rarity: "common", stats: { atk: 9, crit: 7, spd: 5 }, description: "Chủy nhẹ, sắc — vũ khí của tay đua.", basePrice: 230 },
  { id: "w_woodclub", name: "Chùy Gỗ Sồi", kind: "equip", slot: "weapon", rarity: "common", stats: { atk: 14, hp: 40 }, description: "Chùy gỗ sồi nguyên khối — nặng tay.", basePrice: 220 },
  { id: "w_bonewand", name: "Đũa Xương", kind: "equip", slot: "weapon", rarity: "common", stats: { mag: 12, crit: 5 }, description: "Đũa làm từ xương quái thú nhỏ.", basePrice: 230 },

  // Rare
  { id: "w_steelblade", name: "Lưỡi Thép Gấp", kind: "equip", slot: "weapon", rarity: "rare", stats: { atk: 26, crit: 6, spd: 5 }, description: "Lưỡi thép cuộn xếp 32 lớp.", basePrice: 800 },
  { id: "w_arcanewand", name: "Đũa Tinh Tú", kind: "equip", slot: "weapon", rarity: "rare", stats: { mag: 32, crit: 5 }, description: "Đầu đũa nạm pha lê thiên thạch.", basePrice: 800 },
  { id: "w_huntbow", name: "Cung Săn Bạch Liên", kind: "equip", slot: "weapon", rarity: "rare", stats: { atk: 22, spd: 14, crit: 6 }, description: "Cung của thợ săn cao cấp.", basePrice: 820, passive: { kind: "onHit", status: "bleed", chance: 0.2, value: 0.04, turns: 3, name: "Vết Cắt", description: "20% gây Chảy Máu (4% HP/lượt, 3 lượt) khi đánh thường" } },
  { id: "w_flameblade", name: "Lưỡi Hỏa Diệm", kind: "equip", slot: "weapon", rarity: "rare", stats: { atk: 24, mag: 12 }, description: "Lưỡi kiếm cháy âm ỉ.", basePrice: 820, passive: { kind: "onHit", status: "burn", chance: 0.25, value: 0.05, turns: 2, name: "Bỏng Lửa", description: "25% gây Bỏng (5% HP/lượt, 2 lượt) khi đánh thường" } },
  { id: "w_venomtooth", name: "Răng Độc", kind: "equip", slot: "weapon", rarity: "rare", stats: { atk: 22, crit: 8 }, description: "Răng tẩm độc của Quái Đầm Lầy.", basePrice: 840, passive: { kind: "onHit", status: "poison", chance: 0.3, value: 0.04, turns: 3, name: "Độc Hắc", description: "30% gây Độc (4% HP/lượt, 3 lượt) khi đánh thường" } },
  { id: "w_thundermace", name: "Chùy Sấm", kind: "equip", slot: "weapon", rarity: "rare", stats: { atk: 28, hp: 100 }, description: "Chùy nạm sét, đôi khi giật điện.", basePrice: 850, passive: { kind: "onHit", status: "stun", chance: 0.1, value: 1, turns: 1, name: "Choáng Sét", description: "10% gây Choáng 1 lượt khi đánh thường" } },

  // Epic
  { id: "w_dragonfang", name: "Răng Long Tộc", kind: "equip", slot: "weapon", rarity: "epic", stats: { atk: 50, crit: 12, lifesteal: 8 }, description: "Răng nanh của Long Tộc cổ.", basePrice: 2400 },
  { id: "w_voidstaff", name: "Trượng Hư Vô", kind: "equip", slot: "weapon", rarity: "epic", stats: { mag: 60, res: 15, crit: 8 }, description: "Đầu trượng nuốt cả ánh sáng.", basePrice: 2400 },
  { id: "w_executioner", name: "Đại Đao Đoạt Mệnh", kind: "equip", slot: "weapon", rarity: "epic", stats: { atk: 55, critDmg: 25 }, description: "Đại đao lưỡi rộng.", basePrice: 2500, passive: { kind: "execute", threshold: 0.25, bonus: 0.5, description: "+50% sát thương lên kẻ địch dưới 25% HP" } },
  { id: "w_frostlance", name: "Giáo Băng Cực", kind: "equip", slot: "weapon", rarity: "epic", stats: { atk: 45, mag: 25, spd: 8 }, description: "Đầu giáo phát ra hơi lạnh.", basePrice: 2480, passive: { kind: "onHit", status: "spdDown" as const, chance: 0.4, value: 30, turns: 2, name: "Băng Hàn", description: "40% giảm 30% SPD đối thủ trong 2 lượt" } },
  { id: "w_runehammer", name: "Búa Khắc Văn", kind: "equip", slot: "weapon", rarity: "epic", stats: { atk: 48, def: 20, hp: 200 }, description: "Búa hiệp sĩ phong ấn.", basePrice: 2450, passive: { kind: "onHit", status: "defDown", chance: 0.4, value: 25, turns: 2, name: "Vỡ Giáp", description: "40% phá giáp 25% mục tiêu" } },

  // Legendary
  { id: "w_sunblade", name: "Lưỡi Mặt Trời", kind: "equip", slot: "weapon", rarity: "legendary", stats: { atk: 90, mag: 30, crit: 18, critDmg: 25, lifesteal: 10 }, description: "Một mảnh sao đã rơi xuống.", basePrice: 6800, passive: { kind: "onHit", status: "burn", chance: 0.4, value: 0.08, turns: 3, name: "Hỏa Hồn", description: "40% Bỏng 8% HP/lượt × 3" } },
  { id: "w_moonglaive", name: "Liềm Nguyệt Quang", kind: "equip", slot: "weapon", rarity: "legendary", stats: { atk: 80, spd: 25, crit: 22, critDmg: 30 }, description: "Liềm bằng ánh trăng.", basePrice: 6800, passive: { kind: "onHit", status: "bleed", chance: 0.5, value: 0.07, turns: 3, name: "Trăng Cứa", description: "50% Chảy Máu 7% HP/lượt × 3" } },
  { id: "w_stormcaller", name: "Trượng Hô Bão", kind: "equip", slot: "weapon", rarity: "legendary", stats: { mag: 95, atk: 25, crit: 16, critDmg: 30 }, description: "Trượng triệu hồi bão tố.", basePrice: 6800, passive: { kind: "onHit", status: "stun", chance: 0.18, value: 1, turns: 1, name: "Sét Hô", description: "18% Choáng 1 lượt" } },

  // New Legendary — Armor Break
  { id: "w_sunderaxe", name: "Búa Khai Phá Giáp", kind: "equip", slot: "weapon", rarity: "legendary", stats: { atk: 85, def: 20, critDmg: 20 }, description: "Mỗi đòn đánh phá vỡ lớp giáp đối thủ.", basePrice: 7200, passive: { kind: "armorBreak", pct: 0.12, chance: 0.5, description: "50% phá 12% DEF đối thủ khi đánh thường (3 lượt)" } },
  { id: "w_nullblade", name: "Kiếm Xóa Giáp", kind: "equip", slot: "weapon", rarity: "legendary", stats: { atk: 80, mag: 40, crit: 20 }, description: "Lưỡi kiếm làm tan chảy giáp bất kỳ.", basePrice: 7500, passive: { kind: "armorBreak", pct: 0.2, chance: 0.65, description: "65% phá 20% DEF/RES đối thủ" } },
  // Mythic — Armor Break
  { id: "w_godreaver", name: "Lưỡi Diệt Thần", kind: "equip", slot: "weapon", rarity: "mythic", stats: { atk: 140, crit: 25, critDmg: 50, lifesteal: 15 }, description: "Đã uống máu của ba vị thần.", basePrice: 18000, passive: { kind: "execute", threshold: 0.35, bonus: 0.8, description: "+80% sát thương dưới 35% HP" } },
  { id: "w_chaosrend", name: "Móng Hỗn Mang", kind: "equip", slot: "weapon", rarity: "mythic", stats: { atk: 130, mag: 80, crit: 30, critDmg: 40 }, description: "Móng vuốt từ Hỗn Mang Cổ Đại.", basePrice: 18000, passive: { kind: "onHit", status: "poison", chance: 0.5, value: 0.1, turns: 4, name: "Độc Hỗn Mang", description: "50% Độc 10% HP/lượt × 4" } },

  // Mythic — Scaling / Divine
  { id: "w_crescentblade", name: "Lưỡi Bán Nguyệt Thần Thánh", kind: "equip", slot: "weapon", rarity: "mythic", stats: { atk: 120, mag: 70, crit: 22, critDmg: 45 }, description: "Lưỡi kiếm ngày càng mạnh hơn theo thời gian chiến đấu.", basePrice: 25000, passive: { kind: "scalingPerTurn", stat: "atk", amountPerTurn: 10, maxStacks: 15, description: "+10 ATK mỗi lượt (tối đa 15 lần)" } },
  { id: "w_abyssal", name: "Kiếm Vực Thẳm Vô Tận", kind: "equip", slot: "weapon", rarity: "mythic", stats: { atk: 125, crit: 28, critDmg: 50, lifesteal: 12 }, description: "Vũ khí thần thoại cực kì hiếm — mỗi đòn chém hút dần sinh lực kẻ địch.", basePrice: 28000, passive: { kind: "armorBreak", pct: 0.25, chance: 0.7, description: "70% phá 25% DEF đối thủ — xuyên giáp huyền năng" } },
  // Celestial
  { id: "w_starforge", name: "Tạc Tinh Thiên Khí", kind: "equip", slot: "weapon", rarity: "celestial", stats: { atk: 200, mag: 100, crit: 40, critDmg: 80, spd: 30, lifesteal: 20 }, description: "Vũ khí được rèn ở trung tâm vũ trụ.", basePrice: 60000, passive: { kind: "execute", threshold: 0.4, bonus: 1.0, description: "+100% sát thương dưới 40% HP" } },

  // ── VŨ KHÍ MỚI — Cơ Chế Đặc Biệt ───────────────────────────

  // Epic — Bounty (snowball per kill)
  { id: "w_warbounty", name: "Lưỡi Thưởng Đầu", kind: "equip", slot: "weapon", rarity: "epic", stats: { atk: 46, crit: 10, spd: 6 }, description: "Mỗi kẻ địch bị hạ thêm sức mạnh — thợ săn thưởng đầu chuyên nghiệp.", basePrice: 2600, passive: { kind: "bounty", goldPerKill: 25, statBonus: "atk", bonusPerKill: 8, description: "+25 vàng và +8 ATK vĩnh viễn mỗi khi hạ địch (tối đa 5 lần)" } },

  // Epic — Mana Shield (absorb dmg as energy)
  { id: "w_soulcapacitor", name: "Tụ Hồn Pháp Khí", kind: "equip", slot: "weapon", rarity: "epic", stats: { mag: 55, res: 18, crit: 9 }, description: "Vũ khí kỳ lạ — hấp thụ sát thương nhận vào thành năng lượng.", basePrice: 2550, passive: { kind: "manaShield", dmgToEnergy: 0.15, maxPct: 0.4, description: "15% sát thương nhận về chuyển thành năng lượng (tối đa 40% HP mỗi trận)" } },

  // Legendary — Mirror Shield weapon variant
  { id: "w_voidmirror", name: "Gương Hư Không", kind: "equip", slot: "weapon", rarity: "legendary", stats: { mag: 80, res: 30, crit: 14, eva: 12 }, description: "Gương phản chiếu cả phép và vật lý.", basePrice: 7000, passive: { kind: "mirrorShield", reflectMag: 0.2, reflectPhys: 0.1, description: "Phản 20% sát thương phép và 10% sát thương vật lý về kẻ tấn công" } },

  // Legendary — Bounty legendary
  { id: "w_headhunter", name: "Đại Đao Thưởng Thủ", kind: "equip", slot: "weapon", rarity: "legendary", stats: { atk: 88, crit: 16, critDmg: 30 }, description: "Đại đao của tay thợ săn thưởng lừng danh — mỗi đầu địch có giá của nó.", basePrice: 7500, passive: { kind: "bounty", goldPerKill: 60, statBonus: "crit", bonusPerKill: 3, description: "+60 vàng và +3% Crit vĩnh viễn mỗi khi hạ địch (tối đa 7 lần)" } },

  // Mythic — Mana Shield mythic
  { id: "w_voidabsorber", name: "Kiếm Hút Hư Không", kind: "equip", slot: "weapon", rarity: "mythic", stats: { atk: 115, mag: 70, crit: 25, critDmg: 42 }, description: "Vũ khí huyền năng hút năng lượng từ mọi đòn tấn công nhận vào.", basePrice: 20000, passive: { kind: "manaShield", dmgToEnergy: 0.25, maxPct: 0.8, description: "25% sát thương nhận về → năng lượng (tối đa 80% HP mỗi trận). Kẻ tấn công mất 10% năng lượng" } },

  // Mythic — Mirror Staff
  { id: "w_reflectionstaff", name: "Trượng Phản Ảnh Toàn Tri", kind: "equip", slot: "weapon", rarity: "mythic", stats: { mag: 145, res: 60, crit: 22, critDmg: 40 }, description: "Trượng của Đại Pháp Sư Gương — phản chiếu cả vũ trụ.", basePrice: 22000, passive: { kind: "mirrorShield", reflectMag: 0.35, reflectPhys: 0.2, description: "Phản 35% phép và 20% vật lý. Khi phản đòn gây crit, giảm CD của kỹ năng 1 lượt" } },

  // Celestial — Bounty Celestial
  { id: "w_godslayer", name: "Kiếm Tru Thần Thiên Cổ", kind: "equip", slot: "weapon", rarity: "celestial", stats: { atk: 210, mag: 90, crit: 42, critDmg: 85, lifesteal: 18 }, description: "Được rèn riêng để giết thần. Mỗi thần ngã xuống để lại di sản.", basePrice: 65000, passive: { kind: "bounty", goldPerKill: 150, statBonus: "atk", bonusPerKill: 20, description: "+150 vàng và +20 ATK vĩnh viễn mỗi khi hạ địch (không giới hạn)" } },

  // ── TRANSCENDENT WEAPONS (100k+) ─────────────────────────────
  // Unique mechanics: soul drain, chain lightning, time warp, echo strike

  // T1: Soul Drain — hút tất cả buff/energy của kẻ địch khi đánh
  { id: "w_souldrain", name: "Lưỡi Hút Hồn Vô Tận", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 280, mag: 120, crit: 35, critDmg: 60, lifesteal: 25 }, description: "Lưỡi kiếm hút cạn linh hồn — mỗi nhát chém cướp sức mạnh kẻ địch.", basePrice: 108000, passive: { kind: "soulDrain", energySteal: 20, statSteal: "atk", stealPct: 0.08, description: "Mỗi đòn đánh: cướp 20 năng lượng + 8% ATK từ kẻ địch (tích lũy đến hết trận)" } },

  // T2: Chain Lightning — đòn chính xét thêm 2 kẻ địch ngẫu nhiên
  { id: "w_chainlightning", name: "Thần Sét Liên Hoàn", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 260, mag: 180, crit: 38, critDmg: 55, spd: 22 }, description: "Sét liên hoàn — mỗi đòn đánh truyền điện sang 2 kẻ khác.", basePrice: 115000, passive: { kind: "chainLightning", targets: 2, dmgPct: 0.55, stunChance: 0.25, description: "Đòn đánh truyền 55% sát thương sang 2 kẻ địch khác. 25% stun mỗi kẻ bị dây" } },

  // T3: Echo Strike — lặp lại đòn đánh thường với 40% sát thương sau mỗi lượt
  { id: "w_echoblade", name: "Kiếm Vang Âm Không Gian", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 300, crit: 40, critDmg: 70, spd: 18, lifesteal: 15 }, description: "Đòn chém vang vọng trong không gian — kẻ địch nhận thêm một nhát từ chiều khác.", basePrice: 120000, passive: { kind: "echoStrike", echoPct: 0.4, echoDelay: 1, description: "Sau mỗi đòn đánh thường, cuối lượt sau kẻ địch nhận thêm 40% sát thương đó (không thể crit, không hút máu)" } },

  // ── DIVINE WEAPONS (200k+) ────────────────────────────────────

  // D1: Judgment — tăng sát thương tuyến tính theo số lượt chiến đấu đã qua
  { id: "w_judgment", name: "Kiếm Phán Xét Vĩnh Hằng", kind: "equip", slot: "weapon", rarity: "divine", stats: { atk: 380, mag: 160, crit: 45, critDmg: 80, lifesteal: 20 }, description: "Kiếm tích tụ năng lượng từng lượt — càng đánh lâu càng chết chóc.", basePrice: 210000, passive: { kind: "scalingPerTurn", stat: "atk", amountPerTurn: 25, maxStacks: 30, description: "+25 ATK mỗi lượt (tối đa 30 lượt = +750 ATK)" } },

  // D2: Reality Fracture — 30% xuyên giáp tuyệt đối (bỏ qua DEF/RES hoàn toàn 1 lần)
  { id: "w_realityfracture", name: "Đao Bẻ Gãy Thực Tại", kind: "equip", slot: "weapon", rarity: "divine", stats: { atk: 420, crit: 50, critDmg: 90, spd: 28, lifesteal: 18 }, description: "Lưỡi dao rạch toạc không gian — một số đòn hoàn toàn bỏ qua mọi lớp phòng thủ.", basePrice: 225000, passive: { kind: "armorBreak", pct: 1.0, chance: 0.3, description: "30% đòn đánh hoàn toàn xuyên thủng mọi DEF/RES (True Damage). 70% còn lại phá 30% giáp" } },

  // D3: Twin Soul — mỗi lần crit tạo một đòn phantom 60%
  { id: "w_twinsoul", name: "Song Linh Sát Thần", kind: "equip", slot: "weapon", rarity: "divine", stats: { atk: 350, mag: 200, crit: 55, critDmg: 100, lifesteal: 22 }, description: "Hai linh hồn trong một lưỡi kiếm — mỗi cú chí mạng triệu hồi bóng ma đánh thêm.", basePrice: 240000, passive: { kind: "echoStrike", echoPct: 0.6, echoDelay: 0, description: "Mỗi lần CRIT: ngay lập tức tạo đòn bóng ma 60% sát thương (bóng ma cũng có thể crit)" } },

  // ── PRIMORDIAL WEAPONS (500k+) ────────────────────────────────

  // P1: World Ender — sau 5 lượt, xóa sổ kẻ địch HP thấp nhất
  { id: "w_worldender", name: "Lưỡi Khai Tận Thế", kind: "equip", slot: "weapon", rarity: "primordial", stats: { atk: 600, mag: 300, crit: 60, critDmg: 120, lifesteal: 30, spd: 35 }, description: "Vũ khí nguyên thủy nhất — mỗi 5 lượt xóa sổ một kẻ địch.", basePrice: 520000, passive: { kind: "execute", threshold: 0.5, bonus: 2.0, description: "Kẻ địch dưới 50% HP nhận +200% sát thương. Mỗi 5 lượt: kẻ địch HP thấp nhất bị xử quyết tức thì (HP > 0 → 0)" } },

  // P2: Omega
  { id: "w_omega", name: "Bạo Kiếm Omega Tối Thượng", kind: "equip", slot: "weapon", rarity: "primordial", stats: { atk: 700, mag: 350, crit: 65, critDmg: 130, lifesteal: 35, spd: 30 }, description: "Vũ khí cuối cùng được rèn trước khi vũ trụ khép lại.", basePrice: 580000, passive: { kind: "chainLightning", targets: 3, dmgPct: 0.8, stunChance: 0.4, description: "Mọi đòn đánh lan sang 3 kẻ địch (80% sát thương). 40% stun." } },

  // ── NEW UNIQUE WEAPONS ─────────────────────────────────────────────
  // Transcendent
  { id: "w_frenzyblade", name: "Cuồng Đao Bất Diệt", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 310, spd: 80, crit: 38, critDmg: 55 }, description: "Càng đánh càng nhanh — liên kích vô hạn, không giới hạn.", basePrice: 118000, passive: { kind: "frenzySword", spdPerHit: 12, description: "+12 SPD mỗi đòn đánh thường. Mở khóa liên kích vô hạn từ tốc độ (giảm CD skill vẫn còn giới hạn)." } },
  { id: "w_deathrune", name: "Đao Khắc Tử Thần Ấn", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 290, crit: 45, critDmg: 75, lifesteal: 18 }, description: "Mỗi đòn chém lên kẻ sắp chết đều tích nạp năng lượng vô hạn.", basePrice: 112000, passive: { kind: "deathMark", threshold: 0.35, dmgAmp: 0.8, description: "Kẻ địch dưới 35% HP nhận +80% sát thương, người đánh hồi đầy năng lượng." } },
  { id: "w_bloodoath", name: "Đao Giao Ước Máu", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 330, mag: 80, crit: 35, critDmg: 65, lifesteal: 5 }, description: "Đổi máu lấy sức mạnh — từng lượt trôi qua trở nên nguy hiểm hơn.", basePrice: 115000, passive: { kind: "bloodPact", hpCostPct: 0.04, dmgBonus: 0.35, description: "-4% HP mỗi lượt. Đổi lấy +35% sát thương cộng dồn (tối đa 3 stacks = +105%)." } },
  { id: "w_stormbolt", name: "Đao Sét Liên Hoàn Thiên Khải", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 270, mag: 160, crit: 36, critDmg: 58, spd: 20 }, description: "Mỗi đòn đánh bắn thêm tia sét sang kẻ địch ngẫu nhiên.", basePrice: 110000, passive: { kind: "stormStrike", chainChance: 0.65, dmgDecay: 0.55, description: "65% đòn đánh thường bắn thêm sét sang kẻ địch ngẫu nhiên khác (55% sát thương)." } },
  { id: "w_cursedge", name: "Kiếm Nguyền Cổ Đại", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 380, crit: 42, critDmg: 80 }, description: "Gây sát thương khổng lồ nhưng cũng tự thương chính mình.", basePrice: 116000, passive: { kind: "cursedBlade", selfDmgPct: 0.12, dmgMult: 1.7, description: "×1.7 tổng sát thương. Mỗi đòn tự nhận 12% lượng đó (true damage)." } },
  { id: "w_souldrain_t", name: "Lưỡi Hút Linh Hồn", kind: "equip", slot: "weapon", rarity: "transcendent", stats: { atk: 280, mag: 120, crit: 35, critDmg: 60, lifesteal: 25 }, description: "Mỗi nhát chém cướp sức mạnh kẻ địch vĩnh viễn.", basePrice: 108000, passive: { kind: "soulDrain", stealPct: 0.08, description: "Mỗi đòn đánh cướp 8% ATK từ kẻ địch (tích lũy đến hết trận)." } },
  // Divine
  { id: "w_divinefrenz", name: "Cuồng Đao Thần Thánh Vô Hạn", kind: "equip", slot: "weapon", rarity: "divine", stats: { atk: 450, spd: 120, crit: 50, critDmg: 95, lifesteal: 12 }, description: "Phiên bản thần thánh — liên kích vô hạn với tốc độ phi thường.", basePrice: 215000, passive: { kind: "frenzySword", spdPerHit: 22, description: "+22 SPD mỗi đòn đánh thường. Với SPD đủ cao, có thể đánh hàng chục lần/lượt." } },
  { id: "w_timewarpblade", name: "Kiếm Bẻ Cong Thời Gian", kind: "equip", slot: "weapon", rarity: "divine", stats: { atk: 400, mag: 180, crit: 48, critDmg: 90, spd: 22 }, description: "Mỗi kỹ năng sử dụng kéo thời gian đồng đội về phía trước.", basePrice: 228000, passive: { kind: "timeWarp", cdFlatReduction: 2, description: "Sau mỗi kỹ năng (kể cả ult), giảm 2 lượt CD tất cả kỹ năng của đồng đội." } },
  { id: "w_echoblade_divine", name: "Lưỡi Vang Vọng Thần Thánh", kind: "equip", slot: "weapon", rarity: "divine", stats: { atk: 480, crit: 52, critDmg: 100, lifesteal: 20 }, description: "Mỗi đòn chém vang vọng ngay lập tức — không thể né tránh.", basePrice: 222000, passive: { kind: "echoStrike", echoPct: 0.65, echoDelay: 0, description: "50% cơ hội lặp lại đòn đánh thường với 65% sát thương (true damage)." } },
  { id: "w_deathrune_divine", name: "Đao Tử Thần Ấn Thần Thánh", kind: "equip", slot: "weapon", rarity: "divine", stats: { atk: 500, crit: 58, critDmg: 110, lifesteal: 25 }, description: "Tử Thần Ấn cấp thần thánh — kẻ dưới nửa máu bị nghiền nát.", basePrice: 232000, passive: { kind: "deathMark", threshold: 0.5, dmgAmp: 1.2, description: "Kẻ địch dưới 50% HP nhận +120% sát thương, người đánh hồi đầy năng lượng." } },
  { id: "w_bloodpact_divine", name: "Đao Giao Ước Thần Huyết", kind: "equip", slot: "weapon", rarity: "divine", stats: { atk: 520, mag: 180, crit: 50, critDmg: 105, lifesteal: 8 }, description: "Giao ước bằng sinh mệnh thần thánh — sức mạnh vô biên.", basePrice: 235000, passive: { kind: "bloodPact", hpCostPct: 0.06, dmgBonus: 0.50, description: "-6% HP mỗi lượt. Đổi lấy +50% sát thương cộng dồn (tối đa 3 stacks = +150%)." } },
  // Primordial
  { id: "w_primalfrenzy", name: "Cuồng Đao Nguyên Thủy Hỗn Mang", kind: "equip", slot: "weapon", rarity: "primordial", stats: { atk: 680, spd: 200, crit: 65, critDmg: 130, lifesteal: 28 }, description: "Đánh không ngừng cho đến khi kẻ địch tan biến.", basePrice: 560000, passive: { kind: "frenzySword", spdPerHit: 40, description: "+40 SPD mỗi đòn đánh thường. Không giới hạn liên kích." } },
  { id: "w_primordialoath", name: "Đao Giao Ước Nguyên Huyết", kind: "equip", slot: "weapon", rarity: "primordial", stats: { atk: 750, mag: 300, crit: 62, critDmg: 125, lifesteal: 8 }, description: "Sức mạnh vô biên đổi bằng cái chết chậm.", basePrice: 575000, passive: { kind: "bloodPact", hpCostPct: 0.08, dmgBonus: 0.60, description: "-8% HP mỗi lượt. Đổi lấy +60% sát thương cộng dồn (tối đa 3 stacks = +180%)." } },
  { id: "w_primalstorm", name: "Đao Sét Nguyên Thủy Vô Biên", kind: "equip", slot: "weapon", rarity: "primordial", stats: { atk: 650, mag: 350, crit: 68, critDmg: 135, spd: 45 }, description: "Sét nguyên thủy bắn thẳng vào tim mọi kẻ địch.", basePrice: 565000, passive: { kind: "stormStrike", chainChance: 1.0, dmgDecay: 0.75, description: "Mọi đòn đánh thường luôn bắn thêm sét sang kẻ địch ngẫu nhiên (75% sát thương)." } },
]

// ============================================================
// Armors (hp / def / res focused)
// ============================================================
const ARMORS: ItemTemplate[] = [
  // Common
  { id: "a_clothrobe", name: "Áo Choàng Vải", kind: "equip", slot: "armor", rarity: "common", stats: { hp: 80, def: 8, res: 6 }, description: "Áo choàng vải dày.", basePrice: 220 },
  { id: "a_leather", name: "Giáp Da Sói", kind: "equip", slot: "armor", rarity: "common", stats: { hp: 100, def: 14 }, description: "Da sói được phơi khô.", basePrice: 220 },
  { id: "a_studded", name: "Giáp Da Đinh", kind: "equip", slot: "armor", rarity: "common", stats: { hp: 90, def: 12, eva: 4 }, description: "Da gắn đinh sắt — chống đâm.", basePrice: 230 },
  { id: "a_apprenticerobe", name: "Áo Học Sĩ", kind: "equip", slot: "armor", rarity: "common", stats: { hp: 70, res: 16, mag: 6 }, description: "Áo của pháp sư tập sự.", basePrice: 230 },
  { id: "a_huntervest", name: "Áo Săn", kind: "equip", slot: "armor", rarity: "common", stats: { hp: 80, def: 6, spd: 8 }, description: "Áo săn nhẹ.", basePrice: 230 },

  // Rare
  { id: "a_chain", name: "Giáp Xích Sắt", kind: "equip", slot: "armor", rarity: "rare", stats: { hp: 220, def: 28, res: 14 }, description: "Lưới xích thép.", basePrice: 800 },
  { id: "a_silkrobe", name: "Áo Tơ Pháp Sư", kind: "equip", slot: "armor", rarity: "rare", stats: { hp: 180, res: 36, mag: 16 }, description: "Áo dệt từ tơ pháp linh.", basePrice: 800 },
  { id: "a_brigandine", name: "Giáp Lữ Khách", kind: "equip", slot: "armor", rarity: "rare", stats: { hp: 240, def: 24, spd: 6 }, description: "Giáp da bọc thép, linh hoạt.", basePrice: 820, passive: { kind: "regen", pct: 0.04, description: "Hồi 4% HP mỗi lượt" } },
  { id: "a_thornmail", name: "Giáp Gai", kind: "equip", slot: "armor", rarity: "rare", stats: { hp: 200, def: 30 }, description: "Giáp lưng có gai.", basePrice: 820, passive: { kind: "thorns", pct: 0.1, description: "Phản 10% sát thương vật lý nhận về kẻ tấn công" } },

  // Epic
  { id: "a_plate", name: "Giáp Tấm Hiệp Sĩ", kind: "equip", slot: "armor", rarity: "epic", stats: { hp: 480, def: 55, res: 25, spd: -3 }, description: "Bộ giáp đã chặn nghìn nhát chém.", basePrice: 2400 },
  { id: "a_arcanevest", name: "Áo Phù Văn Cổ", kind: "equip", slot: "armor", rarity: "epic", stats: { hp: 380, res: 60, mag: 30, crit: 6 }, description: "Áo khắc bùa bảo hộ.", basePrice: 2400, passive: { kind: "battleStart", effect: "shield", value: 0.15, turns: 99, description: "Vào trận tạo khiên 15% HP tối đa" } },
  { id: "a_phoenixmail", name: "Giáp Lửa Phượng", kind: "equip", slot: "armor", rarity: "epic", stats: { hp: 420, def: 40, res: 30, lifesteal: 6 }, description: "Giáp dệt lông phượng hoàng.", basePrice: 2450, passive: { kind: "regen", pct: 0.06, description: "Hồi 6% HP mỗi lượt" } },
  { id: "a_obsidianplate", name: "Giáp Hắc Diệu", kind: "equip", slot: "armor", rarity: "epic", stats: { hp: 460, def: 60, res: 30 }, description: "Giáp đá đen — phản đòn.", basePrice: 2450, passive: { kind: "thorns", pct: 0.18, description: "Phản 18% sát thương vật lý" } },

  // Legendary
  { id: "a_dragonscale", name: "Giáp Vảy Rồng", kind: "equip", slot: "armor", rarity: "legendary", stats: { hp: 900, def: 90, res: 60, lifesteal: 5 }, description: "Vảy rồng tự hồi.", basePrice: 6800, passive: { kind: "regen", pct: 0.1, description: "Hồi 10% HP mỗi lượt" } },
  { id: "a_eternalbastion", name: "Giáp Trường Tồn", kind: "equip", slot: "armor", rarity: "legendary", stats: { hp: 1100, def: 95, res: 70 }, description: "Khiên hộ thân của các vương cổ.", basePrice: 6800, passive: { kind: "battleStart", effect: "shield", value: 0.3, turns: 99, description: "Vào trận tạo khiên 30% HP tối đa" } },
  { id: "a_thornedaegis", name: "Aegis Gai Thép", kind: "equip", slot: "armor", rarity: "legendary", stats: { hp: 850, def: 100, res: 50 }, description: "Khiên đầy gai sắc.", basePrice: 6800, passive: { kind: "thorns", pct: 0.3, description: "Phản 30% sát thương vật lý" } },

  // Mythic
  { id: "a_voidplate", name: "Giáp Hư Không", kind: "equip", slot: "armor", rarity: "mythic", stats: { hp: 1600, def: 140, res: 110, eva: 15 }, description: "Mặc giáp này như đứng giữa hai thực tại.", basePrice: 18000, passive: { kind: "regen", pct: 0.12, description: "Hồi 12% HP mỗi lượt" } },
  { id: "a_dawnward", name: "Giáp Bình Minh", kind: "equip", slot: "armor", rarity: "mythic", stats: { hp: 1500, def: 130, res: 130, lifesteal: 10 }, description: "Giáp ánh bình minh.", basePrice: 18000, passive: { kind: "battleStart", effect: "shield", value: 0.45, turns: 99, description: "Vào trận tạo khiên 45% HP tối đa" } },

  // New Legendary — Counterstrike
  { id: "a_mirrorplate", name: "Giáp Gương Phản Hồn", kind: "equip", slot: "armor", rarity: "legendary", stats: { hp: 800, def: 88, res: 55, lifesteal: 8 }, description: "Giáp ma thuật — mỗi đòn tấn công đều có thể phản lại.", basePrice: 7200, passive: { kind: "counterstrike", pct: 0.35, chance: 0.4, description: "40% phản đòn 35% sát thương vật lý nhận về" } },
  { id: "a_soulshield", name: "Giáp Linh Hồn Bất Diệt", kind: "equip", slot: "armor", rarity: "legendary", stats: { hp: 950, def: 80, res: 80 }, description: "Linh hồn của kẻ chết làm giáp.", basePrice: 7500, passive: { kind: "lifeLink", pct: 0.15, description: "Khi thành viên đồng đội chết, hồi 15% HP tối đa" } },
  // Mythic — Counterstrike
  { id: "a_vengeful", name: "Giáp Huyền Thoại Phục Thù", kind: "equip", slot: "armor", rarity: "mythic", stats: { hp: 1800, def: 160, res: 120, eva: 10 }, description: "Giáp huyền thoại — mọi đòn đánh vào đều bị trả đũa.", basePrice: 20000, passive: { kind: "counterstrike", pct: 0.6, chance: 0.6, description: "60% phản đòn 60% sát thương nhận về — cả ma thuật" } },
  { id: "a_chronoplate", name: "Giáp Thời Gian Vĩnh Hằng", kind: "equip", slot: "armor", rarity: "mythic", stats: { hp: 2000, def: 150, res: 150 }, description: "Mỗi lượt giáp này ngày càng mạnh hơn.", basePrice: 22000, passive: { kind: "scalingPerTurn", stat: "def", amountPerTurn: 8, maxStacks: 20, description: "+8 DEF mỗi lượt (tối đa 20 lần)" } },
  // Celestial
  { id: "a_celestial", name: "Áo Thiên Quang", kind: "equip", slot: "armor", rarity: "celestial", stats: { hp: 2800, def: 220, res: 200, spd: 20, lifesteal: 15 }, description: "Dệt từ ánh sao đầu tiên.", basePrice: 60000, passive: { kind: "regen", pct: 0.18, description: "Hồi 18% HP mỗi lượt" } },

  // ── GIÁP MỚI — Cơ Chế Đặc Biệt ─────────────────────────────
  // Epic — Mirror Reflect Armor
  { id: "a_phantom_wrap", name: "Giáp Huyễn Bào", kind: "equip", slot: "armor", rarity: "epic", stats: { hp: 360, def: 35, res: 50, eva: 18 }, description: "Giáp dệt từ sương ma — mỗi đòn đánh vào có cơ hội phản về dưới dạng phép.", basePrice: 2500, passive: { kind: "mirrorShield", reflectMag: 0.15, reflectPhys: 0.08, description: "Phản 15% sát thương phép và 8% vật lý về kẻ tấn công" } },

  // Legendary — Mana Shield Armor (for mages/support)
  { id: "a_soulweave", name: "Áo Dệt Linh Hồn", kind: "equip", slot: "armor", rarity: "legendary", stats: { hp: 750, res: 85, mag: 40, eva: 10 }, description: "Áo của đại pháp sư — hấp thụ mọi sát thương vào năng lượng thần bí.", basePrice: 7200, passive: { kind: "manaShield", dmgToEnergy: 0.2, maxPct: 0.6, description: "20% mỗi sát thương nhận → năng lượng (tối đa 60% HP/trận)" } },

  // Mythic — Full Mirror Armor
  { id: "a_prismatic", name: "Giáp Lăng Kính Vạn Chiều", kind: "equip", slot: "armor", rarity: "mythic", stats: { hp: 1900, def: 155, res: 145, eva: 20 }, description: "Giáp phản chiếu mọi sát thương — cả ma thuật lẫn vũ lực.", basePrice: 21000, passive: { kind: "mirrorShield", reflectMag: 0.4, reflectPhys: 0.3, description: "Phản 40% phép và 30% vật lý. Khi phản >300 dmg, stun kẻ tấn công 1 lượt" } },

  // ── TRANSCENDENT ARMORS ───────────────────────────────────────

  // Thorns + scaling each hit taken
  { id: "a_ironwrath", name: "Giáp Thịnh Nộ Sắt Thần", kind: "equip", slot: "armor", rarity: "transcendent", stats: { hp: 3500, def: 280, res: 200, eva: 15 }, description: "Giáp của thần chiến tranh — càng bị đánh càng nguy hiểm hơn.", basePrice: 105000, passive: { kind: "scalingPerTurn", stat: "def", amountPerTurn: 15, maxStacks: 25, description: "Mỗi lượt +15 DEF (tối đa 25 lần = +375 DEF). Gai phản 25% vật lý" } },

  // Conditional immortality — một lần trong trận về 1HP thay vì chết
  { id: "a_lifeanchor", name: "Giáp Neo Sinh Mệnh", kind: "equip", slot: "armor", rarity: "transcendent", stats: { hp: 4000, def: 250, res: 230, lifesteal: 12 }, description: "Neo chặt linh hồn vào thể xác — một lần trong trận sống sót thay vì bị hạ gục.", basePrice: 112000, passive: { kind: "battleStart", effect: "shield", value: 0.6, turns: 99, description: "Vào trận tạo khiên 60% HP. KHI CHẾT LẦN ĐẦU: sống với 1HP thay vì bị hạ (1 lần/trận)" } },

  // ── DIVINE ARMORS ─────────────────────────────────────────────

  // Fortress — giảm 50% sát thương nhận về nhưng mất toàn bộ SPD
  { id: "a_fortress", name: "Giáp Thần Pháo Đài Tuyệt Đối", kind: "equip", slot: "armor", rarity: "divine", stats: { hp: 6000, def: 450, res: 380, spd: -40 }, description: "Pháo đài di động — bất bại nhưng chậm như đá.", basePrice: 215000, passive: { kind: "thorns", pct: 0.5, description: "Phản 50% mọi sát thương. Giảm 50% sát thương nhận vào. SPD -40 (đóng băng vị trí hàng trước)" } },

  // Soul Bond — kết nối với đồng đội HP thấp nhất, chia sẻ sát thương
  { id: "a_soulbond", name: "Giáp Liên Kết Linh Hồn", kind: "equip", slot: "armor", rarity: "divine", stats: { hp: 5000, def: 380, res: 350, lifesteal: 20 }, description: "Giáp kết nối tâm hồn — khi đồng đội sắp chết, người mang giáp đỡ đòn thay.", basePrice: 230000, passive: { kind: "lifeLink", pct: 0.4, description: "Khi đồng đội dưới 20% HP, tự động đỡ 70% sát thương cho họ. Khi đồng đội chết, hồi 40% HP" } },

  // ── PRIMORDIAL ARMORS ─────────────────────────────────────────

  // Null Armor — hấp thụ tất cả debuff và chuyển thành buff
  { id: "a_nullplate", name: "Giáp Hủy Diệt Nguyên Thủy", kind: "equip", slot: "armor", rarity: "primordial", stats: { hp: 8000, def: 600, res: 580, eva: 30, lifesteal: 25 }, description: "Giáp trước khi khái niệm 'sát thương' tồn tại — mọi debuff bị lật ngược.", basePrice: 530000, passive: { kind: "mirrorShield", reflectMag: 0.7, reflectPhys: 0.6, description: "Phản 70% phép và 60% vật lý. Mọi debuff nhận về bị hấp thụ: biến thành buff +10% ATK/MAG (tối đa 10 lần). Regen 15% HP/lượt" } },
]

// ============================================================
// Trinkets (jewelry)
// ============================================================
const TRINKETS: ItemTemplate[] = [
  // Common
  { id: "t_amulet", name: "Bùa May Mắn", kind: "equip", slot: "trinket", rarity: "common", stats: { crit: 5, eva: 3 }, description: "Một chiếc bùa nhỏ.", basePrice: 240 },
  { id: "t_copperring", name: "Nhẫn Đồng", kind: "equip", slot: "trinket", rarity: "common", stats: { atk: 4, hp: 30 }, description: "Nhẫn đồng đơn giản.", basePrice: 220 },
  { id: "t_ironpendant", name: "Mặt Dây Sắt", kind: "equip", slot: "trinket", rarity: "common", stats: { def: 6, res: 6 }, description: "Mặt dây bảo hộ.", basePrice: 230 },
  { id: "t_silverearring", name: "Khuyên Bạc", kind: "equip", slot: "trinket", rarity: "common", stats: { mag: 6, acc: 4 }, description: "Khuyên bạc tinh tế.", basePrice: 240 },
  { id: "t_runicstone", name: "Đá Khắc Rune", kind: "equip", slot: "trinket", rarity: "common", stats: { mag: 8, hp: 30 }, description: "Đá nhỏ khắc văn cổ.", basePrice: 240 },

  // Rare
  { id: "t_focusring", name: "Nhẫn Tập Trung", kind: "equip", slot: "trinket", rarity: "rare", stats: { mag: 20, acc: 8, crit: 5 }, description: "Đá trung tâm phát sáng yếu.", basePrice: 800 },
  { id: "t_bloodband", name: "Vòng Huyết Mạch", kind: "equip", slot: "trinket", rarity: "rare", stats: { atk: 18, lifesteal: 8 }, description: "Vòng tay tẩm huyết.", basePrice: 820 },
  { id: "t_swiftband", name: "Vòng Phong Linh", kind: "equip", slot: "trinket", rarity: "rare", stats: { spd: 14, eva: 8 }, description: "Vòng tay nhẹ tựa lông.", basePrice: 820 },
  { id: "t_warpendant", name: "Mặt Dây Chiến Trận", kind: "equip", slot: "trinket", rarity: "rare", stats: { atk: 16, def: 10, hp: 80 }, description: "Mặt dây của lính veteran.", basePrice: 820, passive: { kind: "battleStart", effect: "atkUp", value: 20, turns: 3, description: "Vào trận +20% ATK trong 3 lượt" } },

  // Epic
  { id: "t_swiftcloak", name: "Khuyên Phong", kind: "equip", slot: "trinket", rarity: "epic", stats: { spd: 25, eva: 12, crit: 8 }, description: "Khuyên tai biến gió thành cánh.", basePrice: 2400 },
  { id: "t_manaprism", name: "Lăng Kính Pháp Lực", kind: "equip", slot: "trinket", rarity: "epic", stats: { mag: 50, res: 20, crit: 10 }, description: "Lăng kính tích trữ pháp lực.", basePrice: 2400, passive: { kind: "manaRegen", amount: 10, description: "+10 năng lượng mỗi lượt" } },
  { id: "t_bloodgem", name: "Hồng Tâm Đá", kind: "equip", slot: "trinket", rarity: "epic", stats: { atk: 40, lifesteal: 15, crit: 8 }, description: "Đá đỏ rỉ máu.", basePrice: 2450 },
  { id: "t_guardianbrooch", name: "Thẻ Vệ Thần", kind: "equip", slot: "trinket", rarity: "epic", stats: { hp: 350, def: 30, res: 25 }, description: "Thẻ bùa của hộ vệ.", basePrice: 2450, passive: { kind: "battleStart", effect: "shield", value: 0.2, turns: 99, description: "Vào trận tạo khiên 20% HP" } },

  // Legendary
  { id: "t_phoenixfeather", name: "Lông Phượng Hoàng", kind: "equip", slot: "trinket", rarity: "legendary", stats: { hp: 400, mag: 35, lifesteal: 12, crit: 10 }, description: "Một sợi lông từ phượng hoàng.", basePrice: 6800, passive: { kind: "regen", pct: 0.08, description: "Hồi 8% HP mỗi lượt" } },
  { id: "t_dragoneye", name: "Mắt Rồng Cổ", kind: "equip", slot: "trinket", rarity: "legendary", stats: { atk: 80, mag: 40, crit: 25, critDmg: 35 }, description: "Mắt long tộc — nhìn thấu yếu điểm.", basePrice: 6800, passive: { kind: "execute", threshold: 0.2, bonus: 0.6, description: "+60% sát thương dưới 20% HP" } },
  { id: "t_stormcrown", name: "Vương Miện Phong Bão", kind: "equip", slot: "trinket", rarity: "legendary", stats: { spd: 30, atk: 60, crit: 18, eva: 15 }, description: "Miện làm từ tia chớp tinh khôi.", basePrice: 6800, passive: { kind: "manaRegen", amount: 15, description: "+15 năng lượng mỗi lượt" } },

  // Mythic
  { id: "t_voidcrown", name: "Vương Miện Hư Vô", kind: "equip", slot: "trinket", rarity: "mythic", stats: { atk: 60, mag: 60, crit: 20, critDmg: 40, spd: 15 }, description: "Đeo lên đầu, bạn nghe tiếng vũ trụ.", basePrice: 18000, passive: { kind: "manaRegen", amount: 25, description: "+25 năng lượng mỗi lượt" } },
  { id: "t_souljewel", name: "Bảo Châu Linh Hồn", kind: "equip", slot: "trinket", rarity: "mythic", stats: { hp: 800, mag: 100, lifesteal: 18 }, description: "Châu chứa nhiều linh hồn.", basePrice: 18000, passive: { kind: "regen", pct: 0.14, description: "Hồi 14% HP mỗi lượt" } },

  // Celestial
  { id: "t_eyeofcosmos", name: "Mắt Vũ Trụ", kind: "equip", slot: "trinket", rarity: "celestial", stats: { atk: 120, mag: 120, crit: 35, critDmg: 70, spd: 25, lifesteal: 15 }, description: "Một mảnh nhãn cầu của Đấng Sáng Tạo.", basePrice: 60000, passive: { kind: "manaRegen", amount: 35, description: "+35 năng lượng mỗi lượt" } },

  // ── TRANG SỨC MỚI — Cơ Chế Đặc Biệt ────────────────────────
  // Rare — Bounty Ring
  { id: "t_slayer_seal", name: "Ấn Kẻ Giết Chóc", kind: "equip", slot: "trinket", rarity: "rare", stats: { atk: 14, crit: 6 }, description: "Ấn ma thuật ghi nhận từng cái chết — trao quyền năng cho chủ nhân.", basePrice: 850, passive: { kind: "bounty", goldPerKill: 20, statBonus: "atk", bonusPerKill: 5, description: "+20 vàng và +5 ATK vĩnh viễn mỗi khi hạ địch (tối đa 5 lần)" } },

  // Epic — Mana Absorb Trinket
  { id: "t_void_prism", name: "Lăng Kính Hư Vô", kind: "equip", slot: "trinket", rarity: "epic", stats: { mag: 45, res: 22, crit: 8 }, description: "Lăng kính nuốt mọi ma thuật — kể cả ma thuật tấn công vào người đeo.", basePrice: 2480, passive: { kind: "manaShield", dmgToEnergy: 0.2, maxPct: 0.5, description: "20% sát thương phép nhận vào → năng lượng (tối đa 50% HP/trận)" } },

  // Legendary — Bounty Trinket (SPD snowball)
  { id: "t_ghost_trophy", name: "Chiến Tích Huyễn Ma", kind: "equip", slot: "trinket", rarity: "legendary", stats: { spd: 28, eva: 18, crit: 16 }, description: "Bộ sưu tập linh hồn địch thủ — mỗi linh hồn thêm sức nhanh.", basePrice: 7200, passive: { kind: "bounty", goldPerKill: 40, statBonus: "spd", bonusPerKill: 6, description: "+40 vàng và +6 SPD vĩnh viễn mỗi khi hạ địch (tối đa 6 lần)" } },

  // Mythic — Mirror Trinket (full reflect)
  { id: "t_mirror_amulet", name: "Bùa Gương Vạn Ảnh", kind: "equip", slot: "trinket", rarity: "mythic", stats: { eva: 25, res: 65, spd: 18 }, description: "Bùa ma thuật phản chiếu mọi loại sát thương — kẻ tấn công tự hại bản thân.", basePrice: 20000, passive: { kind: "mirrorShield", reflectMag: 0.3, reflectPhys: 0.25, description: "Phản 30% phép và 25% vật lý — cộng thêm vào EVA hiện có" } },

  // Celestial — Godkiller Bounty
  { id: "t_pantheon_mark", name: "Dấu Thần Linh Tàn Phế", kind: "equip", slot: "trinket", rarity: "celestial", stats: { atk: 100, mag: 100, crit: 30, critDmg: 60, spd: 20 }, description: "Mang dấu này, kể thù bước đến sẽ để lại di sản.", basePrice: 65000, passive: { kind: "bounty", goldPerKill: 120, statBonus: "mag", bonusPerKill: 15, description: "+120 vàng và +15 MAG vĩnh viễn mỗi khi hạ địch (không giới hạn)" } },

  // ── TRANSCENDENT TRINKETS ─────────────────────────────────────

  // Mirror of Reversal: đòn chí mạng nhận về bị đảo ngược thành heal
  { id: "t_reversal_mirror", name: "Gương Đảo Vận", kind: "equip", slot: "trinket", rarity: "transcendent", stats: { hp: 600, crit: 30, critDmg: 50, eva: 25, mag: 80 }, description: "Gương huyền bí đảo ngược vận mệnh — crit nhận vào trở thành máu hồi.", basePrice: 102000, passive: { kind: "mirrorShield", reflectMag: 0.3, reflectPhys: 0.3, description: "Khi nhận CRIT: hấp thụ hoàn toàn và hồi 30% lượng đó. Phản 30% mọi sát thương khác" } },

  // Temporal Gem: giảm cooldown tất cả kỹ năng 1 mỗi khi giết kẻ địch
  { id: "t_temporal_gem", name: "Đá Thời Gian Bị Đánh Cắp", kind: "equip", slot: "trinket", rarity: "transcendent", stats: { atk: 120, mag: 120, crit: 28, critDmg: 55, spd: 30 }, description: "Viên đá kiểm soát thời gian — mỗi kẻ địch ngã xuống rút ngắn thời gian chờ.", basePrice: 110000, passive: { kind: "bounty", goldPerKill: 80, statBonus: "crit", bonusPerKill: 5, description: "Mỗi kill: -1 CD tất cả kỹ năng + +80 vàng + +5% Crit vĩnh viễn (tối đa 10 kill)" } },

  // ── DIVINE TRINKETS ───────────────────────────────────────────

  // Aether Core: người đeo nhận 20% năng lượng từ mọi sát thương gây ra
  { id: "t_aether_core", name: "Lõi Không Khí Thần Thánh", kind: "equip", slot: "trinket", rarity: "divine", stats: { atk: 160, mag: 160, crit: 40, critDmg: 75, lifesteal: 25 }, description: "Lõi năng lượng thuần túy — đòn đánh nào cũng tích nạp năng lượng thần thánh.", basePrice: 205000, passive: { kind: "manaShield", dmgToEnergy: 0.3, maxPct: 2.0, description: "20% sát thương GÂY RA → năng lượng (không giới hạn). Khi đầy năng lượng: +100% ATK/MAG cho đến khi dùng skill" } },

  // Crown of Supremacy: mỗi khi đồng đội hạ địch, người đeo nhận 10% stat của kẻ đó
  { id: "t_supremacy_crown", name: "Vương Miện Tối Thượng Thiên Thần", kind: "equip", slot: "trinket", rarity: "divine", stats: { atk: 180, mag: 180, crit: 45, critDmg: 80, spd: 35 }, description: "Vương miện của đấng ngồi trên tất cả — mỗi chiến thắng của đồng đội tăng sức mạnh của ta.", basePrice: 220000, passive: { kind: "scalingPerTurn", stat: "atk", amountPerTurn: 30, maxStacks: 20, description: "Mỗi lượt +30 ATK và +30 MAG. Khi ĐỒNG ĐỘI kill: +50 ATK/MAG tức thì" } },

  // ── PRIMORDIAL TRINKETS ───────────────────────────────────────

  // Void Eye
  { id: "t_void_eye", name: "Mắt Hư Vô Nguyên Thủy", kind: "equip", slot: "trinket", rarity: "primordial", stats: { atk: 250, mag: 250, crit: 70, critDmg: 150, spd: 50, lifesteal: 30 }, description: "Con mắt nhìn thấy mọi điểm yếu trong vũ trụ — không thể né tránh, không thể chặn.", basePrice: 510000, passive: { kind: "execute", threshold: 0.6, bonus: 3.0, description: "Kẻ địch dưới 60% HP nhận +300% sát thương. Mọi đòn đánh bỏ qua Eva. 30% gây gấp đôi sát thương" } },

  // ── NEW UNIQUE TRINKETS ─────────────────────────────────────────────
  // Vòng Tự Động Ulti — autoUlt: energy regen mỗi lượt, tự fire ult khi đầy (kể cả ngoài lượt)
  { id: "t_autoult_t", name: "Vòng Tự Động Thần Kỳ", kind: "equip", slot: "trinket", rarity: "transcendent", stats: { atk: 80, mag: 80, crit: 20, spd: 15, hp: 500 }, description: "Năng lượng tự tích lũy — ultimat tự động phóng khi đạt ngưỡng, kể cả ngoài lượt.", basePrice: 108000, passive: { kind: "autoUlt", energyPerTurn: 18, description: "+18 năng lượng mỗi lượt (cộng với hồi bình thường). Khi đầy năng lượng, tự động tung ult (nếu mục tiêu đơn → chọn ngẫu nhiên 1 kẻ địch)." } },
  { id: "t_autoult_d", name: "Vương Miện Tự Kích Hoạt", kind: "equip", slot: "trinket", rarity: "divine", stats: { atk: 150, mag: 150, crit: 35, spd: 25, hp: 1200 }, description: "Vương miện thần thánh tự kích hoạt sức mạnh tối thượng liên tục.", basePrice: 215000, passive: { kind: "autoUlt", energyPerTurn: 30, description: "+30 năng lượng mỗi lượt. Khi đầy năng lượng, tự động tung ult (kể cả ngoài lượt). Ulti đơn mục tiêu → chọn ngẫu nhiên 1 kẻ địch." } },
  { id: "t_autoult_p", name: "Lõi Nguyên Thủy Tự Hủy Diệt", kind: "equip", slot: "trinket", rarity: "primordial", stats: { atk: 280, mag: 280, crit: 55, spd: 40, hp: 2500, lifesteal: 20 }, description: "Lõi nguyên thủy liên tục giải phóng sức mạnh tối thượng — không thể kiểm soát.", basePrice: 520000, passive: { kind: "autoUlt", energyPerTurn: 50, description: "+50 năng lượng mỗi lượt. Ult tự kích hoạt gần như mỗi lượt. Ulti đơn mục tiêu → ngẫu nhiên 1 kẻ địch." } },
  // Lõi Phượng Hoàng — phoenixCore: hồi sống 1 lần
  { id: "t_phoenix_t", name: "Lõi Phượng Hoàng Bất Tử", kind: "equip", slot: "trinket", rarity: "transcendent", stats: { hp: 2500, def: 80, res: 80, lifesteal: 15 }, description: "Khi cái chết đến, ngọn lửa phượng hoàng hồi sinh tướng lĩnh.", basePrice: 115000, passive: { kind: "phoenixCore", revivePct: 0.35, description: "Khi HP về 0 lần đầu: hồi sống với 35% HP tối đa và đầy năng lượng. Chỉ 1 lần/trận." } },
  { id: "t_phoenix_d", name: "Ngọn Lửa Phượng Hoàng Thần Thánh", kind: "equip", slot: "trinket", rarity: "divine", stats: { hp: 4500, def: 150, res: 150, lifesteal: 22 }, description: "Ngọn lửa thần thánh hồi sinh với sức mạnh gần như toàn vẹn.", basePrice: 220000, passive: { kind: "phoenixCore", revivePct: 0.60, description: "Khi HP về 0 lần đầu: hồi sống với 60% HP tối đa và đầy năng lượng. Chỉ 1 lần/trận." } },
  { id: "t_phoenix_p", name: "Phượng Hoàng Nguyên Thủy Bất Diệt", kind: "equip", slot: "trinket", rarity: "primordial", stats: { hp: 8000, def: 280, res: 280, lifesteal: 30, spd: 20 }, description: "Phượng hoàng nguyên thủy — hồi sinh hoàn toàn và tiếp tục tàn phá.", basePrice: 530000, passive: { kind: "phoenixCore", revivePct: 0.90, description: "Khi HP về 0 lần đầu: hồi sống với 90% HP tối đa và đầy năng lượng. Chỉ 1 lần/trận." } },
]

// ============================================================
// Potions
// ============================================================
const POTIONS: ItemTemplate[] = [
  { id: "p_minor", name: "Bình Hồi Phục Nhỏ", kind: "potion", rarity: "common", potion: { healPct: 0.3 }, description: "Hồi 30% HP cho 1 đồng minh.", basePrice: 80 },
  { id: "p_minor_mana", name: "Bình Năng Lượng Nhỏ", kind: "potion", rarity: "common", potion: { energy: 30 }, description: "Hồi 30 năng lượng cho 1 đồng minh.", basePrice: 90 },
  { id: "p_medium", name: "Bình Hồi Phục Vừa", kind: "potion", rarity: "rare", potion: { healPct: 0.55 }, description: "Hồi 55% HP cho 1 đồng minh.", basePrice: 200 },
  { id: "p_medium_mana", name: "Bình Năng Lượng Vừa", kind: "potion", rarity: "rare", potion: { energy: 60 }, description: "Hồi 60 năng lượng.", basePrice: 220 },
  { id: "p_rage", name: "Linh Đan Phẫn Nộ", kind: "potion", rarity: "rare", potion: { buff: { kind: "atkUp", value: 50, turns: 3, name: "Phẫn Nộ" } }, description: "+50% ATK trong 3 lượt.", basePrice: 250 },
  { id: "p_haste", name: "Linh Đan Nhanh Nhẹn", kind: "potion", rarity: "rare", potion: { buff: { kind: "spdUp", value: 50, turns: 3, name: "Tốc Độ" } }, description: "+50% SPD trong 3 lượt.", basePrice: 250 },
  { id: "p_iron", name: "Linh Đan Sắt Đá", kind: "potion", rarity: "rare", potion: { buff: { kind: "defUp", value: 60, turns: 3, name: "Sắt Đá" } }, description: "+60% DEF trong 3 lượt.", basePrice: 250 },
  { id: "p_major", name: "Bình Hồi Phục Lớn", kind: "potion", rarity: "epic", potion: { healPct: 0.85 }, description: "Hồi 85% HP cho 1 đồng minh.", basePrice: 500 },
  { id: "p_major_mana", name: "Bình Năng Lượng Lớn", kind: "potion", rarity: "epic", potion: { energy: 100 }, description: "Hồi đầy năng lượng.", basePrice: 600 },
  { id: "p_regen", name: "Tiên Đan Hồi Sinh", kind: "potion", rarity: "epic", potion: { buff: { kind: "regen", value: 0.1, turns: 3, name: "Hồi Sinh" } }, description: "Hồi 10% HP mỗi lượt × 3 lượt.", basePrice: 480 },
  { id: "p_shield", name: "Đan Khiên Pháp", kind: "potion", rarity: "epic", potion: { buff: { kind: "shield", value: 0.25, turns: 99, name: "Khiên Đan" } }, description: "Tạo khiên 25% HP tối đa.", basePrice: 520 },
  { id: "p_elixir", name: "Tiên Đan Bất Tử", kind: "potion", rarity: "legendary", potion: { healPct: 1.0, energy: 100, cleanse: true }, description: "Hồi đầy HP & Năng lượng, thanh tẩy debuff.", basePrice: 1500 },
  { id: "p_godblood", name: "Huyết Thần", kind: "potion", rarity: "mythic", potion: { healPct: 1.0, energy: 100, cleanse: true, buff: { kind: "atkUp", value: 100, turns: 3, name: "Huyết Cuồng" } }, description: "Hồi đầy + +100% ATK 3 lượt.", basePrice: 5000 },
  // ── THUỐC MAY MẮN ──────────────────────────────────────────────
  { id: "p_luck_small",  name: "Thuốc May Mắn Nhỏ",  kind: "potion", rarity: "rare",      potion: {}, description: "Tăng 25% may mắn trong 100 lần roll (tướng + phúc/kèo). Dịch chuyển xác suất từ common/rare lên bậc cao hơn.",  basePrice: 500 },
  { id: "p_luck_medium", name: "Thuốc May Mắn Vừa",  kind: "potion", rarity: "epic",      potion: {}, description: "Tăng 50% may mắn trong 100 lần roll (tướng + phúc/kèo). Dịch chuyển xác suất từ common/rare lên bậc cao hơn.",  basePrice: 1500 },
  { id: "p_luck_large",  name: "Thuốc May Mắn Lớn",  kind: "potion", rarity: "legendary", potion: {}, description: "Tăng 75% may mắn trong 100 lần roll (tướng + phúc/kèo). Dịch chuyển xác suất từ common/rare lên bậc cao hơn.",  basePrice: 4000 },
]

// ============================================================
// Artifacts (only obtainable via digging)
// ============================================================
const ARTIFACTS: ItemTemplate[] = [
  { id: "art_shard", name: "Mảnh Đá Cổ", kind: "artifact", rarity: "common", description: "Mảnh đá phát sáng yếu.", basePrice: 120 },
  { id: "art_coin", name: "Đồng Tiền Cổ", kind: "artifact", rarity: "rare", description: "Đồng tiền của một đế chế đã sụp đổ.", basePrice: 500 },
  { id: "art_scroll", name: "Cuộn Giấy Cổ Đại", kind: "artifact", rarity: "epic", description: "Bùa chú cổ.", basePrice: 1800 },
  { id: "art_relic", name: "Di Vật Hoàng Tộc", kind: "artifact", rarity: "legendary", description: "Vật trang sức của vị vua đã chết.", basePrice: 5500 },
  { id: "art_godshard", name: "Mảnh Linh Hồn Thần", kind: "artifact", rarity: "mythic", description: "Một mảnh linh hồn còn rung động.", basePrice: 18000 },
  { id: "art_cosmicegg", name: "Trứng Vũ Trụ", kind: "artifact", rarity: "celestial", description: "Bên trong có thể là một thực tại non.", basePrice: 80000 },
  { id: "art_timecrystal", name: "Tinh Thể Thời Gian", kind: "artifact", rarity: "transcendent", description: "Tinh thể đóng băng một khoảnh khắc vĩnh cửu.", basePrice: 200000 },
  { id: "art_soulflame", name: "Ngọn Lửa Linh Hồn Vũ Trụ", kind: "artifact", rarity: "divine", description: "Ngọn lửa không bao giờ tắt từ nguồn gốc vũ trụ.", basePrice: 450000 },
  { id: "art_genesis", name: "Hạt Giống Sáng Thế", kind: "artifact", rarity: "primordial", description: "Hạt giống chứa toàn bộ mọi khả năng tồn tại.", basePrice: 1000000 },
]

export const ITEMS: ItemTemplate[] = [
  ...WEAPONS,
  ...ARMORS,
  ...TRINKETS,
  ...POTIONS,
  ...ARTIFACTS,
]

export const ITEMS_BY_ID: Record<string, ItemTemplate> = ITEMS.reduce(
  (acc, it) => {
    acc[it.id] = it
    return acc
  },
  {} as Record<string, ItemTemplate>,
)

// ============================================================
// Shop pools (which items can spawn in each shop kind)
// ============================================================
const POOLS: Record<ShopKind, ItemTemplate[]> = {
  weapon: WEAPONS,
  armor: ARMORS,
  trinket: TRINKETS,
  potion: POTIONS,
}

export function shopPool(kind: ShopKind): ItemTemplate[] {
  return POOLS[kind]
}

export function pickRandomShopItems(kind: ShopKind, count: number): { itemId: string; stock: number }[] {
  const pool = POOLS[kind]
  const out: { itemId: string; stock: number }[] = []
  for (let i = 0; i < count; i++) {
    // weighted by rarity
    const totalWeight = pool.reduce((sum, it) => sum + (SHOP_RARITY_WEIGHTS[it.rarity] || 0), 0)
    let r = Math.random() * totalWeight
    let chosen: ItemTemplate = pool[0]
    for (const it of pool) {
      r -= SHOP_RARITY_WEIGHTS[it.rarity] || 0
      if (r <= 0) {
        chosen = it
        break
      }
    }
    // Stock: high rarity = lower stock
    const stock = chosen.rarity === "common" ? 5 : chosen.rarity === "rare" ? 4 : chosen.rarity === "epic" ? 3 : chosen.rarity === "legendary" ? 2 : 1
    out.push({ itemId: chosen.id, stock })
  }
  return out
}

// ============================================================
// Innate generation for purple+ gear
// ============================================================
import type { ItemInnate, StatKey } from "./types"

const INNATE_POOL_WEAPON: { stat: StatKey; label: string; min: number; max: number }[] = [
  { stat: "atk", label: "ATK", min: 5, max: 20 },
  { stat: "crit", label: "Chí Mạng", min: 2, max: 8 },
  { stat: "critDmg", label: "Sát Thương Chí Mạng", min: 5, max: 20 },
  { stat: "lifesteal", label: "Hút Máu", min: 2, max: 8 },
  { stat: "spd", label: "Tốc Độ", min: 3, max: 12 },
  { stat: "mag", label: "Phép Thuật", min: 5, max: 18 },
  { stat: "acc", label: "Chính Xác", min: 3, max: 12 },
  { stat: "hp", label: "HP Thêm", min: 30, max: 150 },
  { stat: "def", label: "Phòng Thủ Thêm", min: 3, max: 12 },
  { stat: "eva", label: "Né Tránh", min: 1, max: 5 },
]

const INNATE_POOL_ARMOR: { stat: StatKey; label: string; min: number; max: number }[] = [
  { stat: "hp", label: "HP", min: 50, max: 300 },
  { stat: "def", label: "Phòng Thủ", min: 5, max: 25 },
  { stat: "res", label: "Kháng Ma", min: 5, max: 25 },
  { stat: "eva", label: "Né Tránh", min: 2, max: 8 },
  { stat: "lifesteal", label: "Hút Máu", min: 2, max: 6 },
  { stat: "spd", label: "Tốc Độ", min: 2, max: 8 },
  { stat: "crit", label: "Chí Mạng", min: 1, max: 5 },
  { stat: "acc", label: "Chính Xác", min: 2, max: 8 },
  { stat: "atk", label: "ATK Thêm", min: 3, max: 12 },
  { stat: "mag", label: "Phép Thuật Thêm", min: 3, max: 12 },
]

const INNATE_POOL_TRINKET: { stat: StatKey; label: string; min: number; max: number }[] = [
  { stat: "crit", label: "Chí Mạng", min: 3, max: 10 },
  { stat: "critDmg", label: "Sát Thương Chí Mạng", min: 5, max: 25 },
  { stat: "atk", label: "ATK", min: 5, max: 18 },
  { stat: "mag", label: "Phép Thuật", min: 5, max: 18 },
  { stat: "spd", label: "Tốc Độ", min: 3, max: 12 },
  { stat: "lifesteal", label: "Hút Máu", min: 2, max: 10 },
  { stat: "acc", label: "Chính Xác", min: 3, max: 10 },
  { stat: "hp", label: "HP", min: 40, max: 200 },
  { stat: "def", label: "Phòng Thủ", min: 3, max: 15 },
  { stat: "res", label: "Kháng Ma", min: 3, max: 15 },
  { stat: "eva", label: "Né Tránh", min: 2, max: 8 },
]

// Rarities that get innate bonuses
const INNATE_RARITIES = new Set(["epic", "legendary", "mythic", "celestial", "transcendent", "divine", "primordial"])

// Rarity multiplier for innate strength
const INNATE_RARITY_MULT: Record<string, number> = {
  epic: 1.0,
  legendary: 1.6,
  mythic: 2.5,
  celestial: 4.0,
  transcendent: 6.0,
  divine: 9.0,
  primordial: 13.5,
}

export function generateInnate(item: ItemTemplate): ItemInnate | undefined {
  if (!item.slot || !INNATE_RARITIES.has(item.rarity)) return undefined
  // Pick innate pool by slot
  const pool = item.slot === "weapon" ? INNATE_POOL_WEAPON
    : item.slot === "armor" ? INNATE_POOL_ARMOR
    : INNATE_POOL_TRINKET
  const pick = pool[Math.floor(Math.random() * pool.length)]
  const mult = INNATE_RARITY_MULT[item.rarity] ?? 1
  const value = Math.round((pick.min + Math.random() * (pick.max - pick.min)) * mult)
  return { stat: pick.stat, value, label: pick.label }
}

// Stock counts per shop on each restock
export const SHOP_STOCK_COUNT: Record<ShopKind, number> = {
  weapon: 10,
  armor: 10,
  trinket: 10,
  potion: 12,
}

// Restock every X minutes (in ms)
export const SHOP_RESTOCK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

// Pick random artifact item of a given rarity
export function randomArtifactByRarity(rarity: Rarity): ItemTemplate | undefined {
  const list = ARTIFACTS.filter((a) => a.rarity === rarity)
  if (!list.length) return undefined
  return list[Math.floor(Math.random() * list.length)]
}

// For backwards compat
export function shopItemsForKind(kind: ShopKind): ItemTemplate[] {
  return POOLS[kind]
}

// ============================================================
// Premium Shop (Huyền Bảo) — unlocks at level 50
// ============================================================
export type PremiumShopTier = 1 | 2 | 3

export function getPremiumTier(level: number, towerRecord: number): PremiumShopTier | null {
  if (level >= 100 && towerRecord >= 60) return 3
  if (level >= 70 && towerRecord >= 40) return 2
  if (level >= 50) return 1
  return null
}

function premiumRarityWeights(tier: PremiumShopTier): Partial<Record<Rarity, number>> {
  if (tier === 1) return { legendary: 60, mythic: 30, transcendent: 10 }
  if (tier === 2) return { mythic: 60, transcendent: 35, divine: 5 }
  return { transcendent: 65, divine: 34, primordial: 1 }
}

export function pickPremiumShopItems(tier: PremiumShopTier, count: number): { itemId: string; stock: number }[] {
  const weights = premiumRarityWeights(tier)
  const eligibleRarities = new Set(Object.keys(weights) as Rarity[])
  const pool = [...WEAPONS, ...ARMORS, ...TRINKETS].filter(it => eligibleRarities.has(it.rarity as Rarity))
  if (!pool.length) return []
  const out: { itemId: string; stock: number }[] = []
  for (let i = 0; i < count; i++) {
    const totalW = Object.values(weights).reduce((s, w) => s + (w ?? 0), 0)
    let rr = Math.random() * totalW
    let picked: Rarity = Object.keys(weights)[0] as Rarity
    for (const [r, w] of Object.entries(weights) as [Rarity, number][]) {
      rr -= w; if (rr <= 0) { picked = r; break }
    }
    const rPool = pool.filter(it => it.rarity === picked)
    if (!rPool.length) continue
    out.push({ itemId: rPool[Math.floor(Math.random() * rPool.length)].id, stock: 1 })
  }
  return out
}

// ============================================================
// Enemy Equipment Generator
// ============================================================
// Probability of an enemy having equipment in each slot, by stage bracket
const ENEMY_EQUIP_CHANCE: Record<"weapon" | "armor" | "trinket", (stage: number) => number> = {
  weapon:  (s) => s < 5  ? 0 : s < 15 ? 0.35 : s < 30 ? 0.65 : s < 50 ? 0.85 : 0.95,
  armor:   (s) => s < 10 ? 0 : s < 20 ? 0.25 : s < 35 ? 0.55 : s < 55 ? 0.80 : 0.92,
  trinket: (s) => s < 15 ? 0 : s < 25 ? 0.20 : s < 40 ? 0.45 : s < 60 ? 0.70 : 0.88,
}

// Rarity weights for enemy equipment by stage
function enemyEquipRarityWeights(stage: number): Record<Rarity, number> {
  if (stage < 10) return  { common: 80, rare: 18, epic: 2, legendary: 0,   mythic: 0,    celestial: 0,    transcendent: 0,    divine: 0,    primordial: 0 }
  if (stage < 20) return  { common: 55, rare: 32, epic: 11, legendary: 2,  mythic: 0,    celestial: 0,    transcendent: 0,    divine: 0,    primordial: 0 }
  if (stage < 35) return  { common: 30, rare: 35, epic: 25, legendary: 9,  mythic: 1,    celestial: 0,    transcendent: 0,    divine: 0,    primordial: 0 }
  if (stage < 50) return  { common: 10, rare: 22, epic: 38, legendary: 22, mythic: 7,    celestial: 1,    transcendent: 0,    divine: 0,    primordial: 0 }
  if (stage < 65) return  { common: 3,  rare: 10, epic: 28, legendary: 38, mythic: 16,   celestial: 4,    transcendent: 1,    divine: 0,    primordial: 0 }
  if (stage < 80) return  { common: 0,  rare: 4,  epic: 15, legendary: 38, mythic: 28,   celestial: 12,   transcendent: 3,    divine: 0,    primordial: 0 }
  if (stage < 95) return  { common: 0,  rare: 1,  epic: 8,  legendary: 28, mythic: 38,   celestial: 18,   transcendent: 6,    divine: 1,    primordial: 0 }
  return                  { common: 0,  rare: 0,  epic: 3,  legendary: 15, mythic: 34,   celestial: 28,   transcendent: 14,   divine: 5,    primordial: 1 }
}

function pickEnemyEquipRarity(stage: number): Rarity {
  const weights = enemyEquipRarityWeights(stage)
  const total = (Object.values(weights) as number[]).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const [rarity, w] of Object.entries(weights) as [Rarity, number][]) {
    r -= w
    if (r <= 0) return rarity
  }
  return "common"
}

/**
 * Generate random equipment for an enemy hero.
 * Returns a partial equipment map { weapon?, armor?, trinket? }
 */
export function generateEnemyEquipment(stage: number): Partial<Record<"weapon" | "armor" | "trinket", string>> {
  const equipment: Partial<Record<"weapon" | "armor" | "trinket", string>> = {}
  for (const slot of ["weapon", "armor", "trinket"] as const) {
    if (Math.random() > ENEMY_EQUIP_CHANCE[slot](stage)) continue
    const rarity = pickEnemyEquipRarity(stage)
    const pool = POOLS[slot].filter((it) => it.rarity === rarity)
    // Fall back to next lower rarity if pool empty
    if (pool.length === 0) continue
    const item = pool[Math.floor(Math.random() * pool.length)]
    equipment[slot] = item.id
  }
  return equipment
}

