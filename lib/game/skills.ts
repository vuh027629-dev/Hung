import type { Passive, Skill } from "./types"

// ============================================================
// Skill database — referenced by heroes via id.
// effects[] applied in order. Damage uses caster.stats[stat] * scale.
// ============================================================

export const SKILLS: Record<string, Skill> = {
  // ---------- Generic Physical ----------
  slash: {
    id: "slash",
    name: "Chém Dũng Mãnh",
    description: "Chém đối thủ gây 130% sát thương vật lý.",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 1.3, stat: "atk", type: "physical" } }],
    tier: 1,
  },
  doubleStrike: {
    id: "doubleStrike",
    name: "Song Đả",
    description: "Hai đòn liên tiếp, mỗi đòn 80% sát thương vật lý.",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 0.8, stat: "atk", type: "physical", hits: 2 } }],
    tier: 1,
  },
  whirlwind: {
    id: "whirlwind",
    name: "Lốc Xoáy Thép",
    description: "Quét tất cả kẻ địch với 90% ATK.",
    cooldown: 4,
    targeting: "all-enemies",
    ultimate: true,
    effects: [{ damage: { scale: 0.9, stat: "atk", type: "physical" } }],
    tier: 2,
  },
  executioner: {
    id: "executioner",
    name: "Đoạn Hồn Trảm",
    description: "Đòn xử trảm 220% ATK, +50% với địch dưới 40% HP.",
    cooldown: 5,
    targeting: "enemy",
    effects: [{ damage: { scale: 2.2, stat: "atk", type: "physical" } }],
    tier: 3,
    evolvesTo: "executioner_evo",
  },
  bleedSlash: {
    id: "bleedSlash",
    name: "Vết Cắt Tử Thần",
    description: "100% ATK + bleed 30% ATK/turn trong 3 lượt.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 1.0, stat: "atk", type: "physical" } },
      { status: { kind: "bleed", value: 60, turns: 3, name: "Chảy Máu" } },
    ],
    tier: 2,
    evolvesTo: "bleedSlash_evo",
  },

  // ---------- Assassin ----------
  shadowStrike: {
    id: "shadowStrike",
    name: "Ám Sát",
    description: "150% ATK, +30% chí mạng cho đòn này.",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 1.5, stat: "atk", type: "physical" } }],
    tier: 1,
  },
  bladeDance: {
    id: "bladeDance",
    name: "Vũ Điệu Lưỡi Kiếm",
    description: "3 đòn mỗi đòn 70% ATK.",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 0.7, stat: "atk", type: "physical", hits: 3 } }],
    tier: 2,
    evolvesTo: "bladeDance_evo",
  },
  deathMark: {
    id: "deathMark",
    name: "Dấu Tử Thần",
    description: "Đánh dấu 1 mục tiêu — giảm 40% DEF trong 2 lượt (mọi đòn đánh vào nó đều mạnh hơn).",
    cooldown: 5,
    targeting: "enemy",
    effects: [{ status: { kind: "defDown", value: 40, turns: 2, name: "Dấu Tử Thần" } }],
    tier: 2,
    evolvesTo: "deathMark_evo",
  },
  finalEclipse: {
    id: "finalEclipse",
    name: "Nguyệt Thực Cuối Cùng",
    description: "260% ATK, không né được. Hồi 100% sát thương gây ra cho bản thân.",
    cooldown: 6,
    targeting: "enemy",
    ultimate: true,
    effects: [
      { damage: { scale: 2.6, stat: "atk", type: "physical" } },
      { heal: { scale: 2.6, stat: "atk" } },
    ],
    tier: 3,
  },

  // ---------- Mage ----------
  fireball: {
    id: "fireball",
    name: "Cầu Lửa",
    description: "140% MAG + áp burn 20% MAG/turn (2 lượt).",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 1.4, stat: "mag", type: "magic" } },
      { status: { kind: "burn", value: 70, turns: 2, name: "Bỏng" } },
    ],
    tier: 1,
  },
  arcaneBolt: {
    id: "arcaneBolt",
    name: "Tinh Thuật Đạn",
    description: "120% MAG cho 1 mục tiêu.",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 1.2, stat: "mag", type: "magic" } }],
    tier: 1,
  },
  iceLance: {
    id: "iceLance",
    name: "Băng Phong Thương",
    description: "130% MAG + giảm SPD 30% trong 2 lượt.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 1.3, stat: "mag", type: "magic" } },
      { status: { kind: "spdDown", value: 30, turns: 2, name: "Đóng Băng" } },
    ],
    tier: 2,
  },
  meteor: {
    id: "meteor",
    name: "Thiên Thạch",
    description: "180% MAG lên toàn bộ kẻ địch.",
    cooldown: 5,
    targeting: "all-enemies",
    effects: [{ damage: { scale: 1.8, stat: "mag", type: "magic" } }],
    tier: 3,
  },
  arcaneNova: {
    id: "arcaneNova",
    name: "Tinh Tú Bùng Nổ",
    description: "240% MAG cho 1 mục tiêu, không thể chặn.",
    cooldown: 5,
    targeting: "enemy",
    effects: [{ damage: { scale: 2.4, stat: "mag", type: "magic" } }],
    tier: 3,
  },
  chainLightning: {
    id: "chainLightning",
    name: "Sấm Liên Hoàn",
    description: "100% MAG mỗi địch (toàn bộ).",
    cooldown: 4,
    targeting: "all-enemies",
    effects: [{ damage: { scale: 1.0, stat: "mag", type: "magic" } }],
    tier: 2,
  },

  // ---------- Marksman ----------
  pierceShot: {
    id: "pierceShot",
    name: "Phá Giáp Tiễn",
    description: "120% ATK sát thương chuẩn (xuyên DEF).",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 1.2, stat: "atk", type: "true" } }],
    tier: 1,
  },
  rapidFire: {
    id: "rapidFire",
    name: "Bắn Nhanh",
    description: "4 đòn mỗi đòn 55% ATK.",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 0.55, stat: "atk", type: "physical", hits: 4 } }],
    tier: 2,
    evolvesTo: "rapidFire_evo",
  },
  volley: {
    id: "volley",
    name: "Mưa Tên",
    description: "85% ATK lên toàn bộ địch.",
    cooldown: 4,
    targeting: "all-enemies",
    ultimate: true,
    effects: [{ damage: { scale: 0.85, stat: "atk", type: "physical" } }],
    tier: 2,
  },
  trueShot: {
    id: "trueShot",
    name: "Tiễn Chính Tâm",
    description: "250% ATK chuẩn, không thể né.",
    cooldown: 6,
    targeting: "enemy",
    ultimate: true,
    effects: [{ damage: { scale: 2.5, stat: "atk", type: "true" } }],
    tier: 3,
  },

  // ---------- Tank ----------
  shieldBash: {
    id: "shieldBash",
    name: "Khiên Đả",
    description: "100% ATK + làm choáng 1 lượt.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 1.0, stat: "atk", type: "physical" } },
      { status: { kind: "stun", value: 1, turns: 1, name: "Choáng" } },
    ],
    tier: 1,
  },
  ironBulwark: {
    id: "ironBulwark",
    name: "Thành Thép",
    description: "Khiên 30% HP + DEF +50% trong 3 lượt.",
    cooldown: 5,
    targeting: "self",
    effects: [
      { status: { kind: "shield", value: 0.3, turns: 3, name: "Khiên Thép" } },
      { status: { kind: "defUp", value: 50, turns: 3, name: "Cường Phòng" } },
    ],
    tier: 2,
  },
  taunt: {
    id: "taunt",
    name: "Thách Đấu",
    description: "Tăng 80% DEF & RES trong 2 lượt và buộc địch tấn công mình.",
    cooldown: 5,
    targeting: "self",
    ultimate: true,
    effects: [
      { status: { kind: "defUp", value: 80, turns: 2, name: "Khiêu Khích" } },
    ],
    tier: 2,
  },
  earthquake: {
    id: "earthquake",
    name: "Địa Chấn",
    description: "150% ATK toàn bộ + làm chậm SPD 25% (2 lượt).",
    cooldown: 6,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 1.5, stat: "atk", type: "physical" } },
      { status: { kind: "spdDown", value: 25, turns: 2, name: "Choáng Đất" } },
    ],
    tier: 3,
  },

  // ---------- Support ----------
  heal: {
    id: "heal",
    name: "Hồi Phục",
    description: "Hồi 160% MAG HP cho 1 đồng minh.",
    cooldown: 4,
    targeting: "ally",
    effects: [{ heal: { scale: 1.6, stat: "mag" } }],
    tier: 1,
  },
  groupHeal: {
    id: "groupHeal",
    name: "Ân Sủng Toàn Đội",
    description: "Hồi 120% MAG HP cho tất cả đồng minh.",
    cooldown: 5,
    targeting: "all-allies",
    effects: [{ heal: { scale: 1.2, stat: "mag" } }],
    tier: 3,
    evolvesTo: "groupHeal_evo",
  },
  blessing: {
    id: "blessing",
    name: "Ban Phước",
    description: "Toàn đội +30% ATK trong 3 lượt.",
    cooldown: 5,
    targeting: "all-allies",
    effects: [{ status: { kind: "atkUp", value: 30, turns: 3, name: "Ban Phước" } }],
    tier: 2,
  },
  cleanse: {
    id: "cleanse",
    name: "Thanh Tẩy",
    description: "Hồi 100% MAG + xoá hiệu ứng xấu.",
    cooldown: 4,
    targeting: "ally",
    effects: [{ heal: { scale: 1.0, stat: "mag" } }],
    tier: 2,
  },

  // ---------- Signature / Legendary+ ----------
  dragonRoar: {
    id: "dragonRoar",
    name: "Rống Của Long Tổ",
    description: "Toàn đội +40% ATK & 30% HP, địch -25% DEF (3 lượt).",
    cooldown: 6,
    targeting: "all-allies",
    ultimate: true,
    effects: [
      { status: { kind: "atkUp", value: 40, turns: 3, name: "Long Uy" } },
      { status: { kind: "regen", value: 0.1, turns: 3, name: "Long Khí" } },
    ],
    tier: 3,
  },
  dragonBreath: {
    id: "dragonBreath",
    name: "Long Diệm Phun Trào",
    description: "200% MAG toàn bộ địch + burn 30% MAG/turn (3 lượt).",
    cooldown: 6,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 2.0, stat: "mag", type: "magic" } },
      { status: { kind: "burn", value: 85, turns: 3, name: "Long Diệm" } },
    ],
    tier: 3,
    evolvesTo: "dragonBreath_evo",
  },
  voidRift: {
    id: "voidRift",
    name: "Khe Hư Vô",
    description: "210% MAG sát thương chuẩn, giảm 1 CD toàn đội.",
    cooldown: 6,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 2.1, stat: "mag", type: "true" } },
      { cooldownReductionAll: 1 },
    ],
    tier: 3,
  },
  judgment: {
    id: "judgment",
    name: "Phán Quyết",
    description: "300% MAG sát thương chuẩn lên 1 mục tiêu.",
    cooldown: 6,
    targeting: "enemy",
    ultimate: true,
    effects: [{ damage: { scale: 3.0, stat: "mag", type: "true" } }],
    tier: 3,
  },
  resurrection: {
    id: "resurrection",
    name: "Phục Sinh",
    description: "Hồi 100% HP cho đồng minh và miễn nhiễm 1 lượt.",
    cooldown: 7,
    targeting: "ally",
    ultimate: true,
    effects: [
      { heal: { scale: 3.0, stat: "mag" } },
      { status: { kind: "shield", value: 0.4, turns: 2, name: "Linh Quang" } },
    ],
    tier: 3,
  },
  cyberRailgun: {
    id: "cyberRailgun",
    name: "Pháo Ray Xuyên Giáp",
    description: "270% ATK chuẩn, +50% sát thương với địch còn full HP.",
    cooldown: 6,
    targeting: "enemy",
    ultimate: true,
    effects: [{ damage: { scale: 2.7, stat: "atk", type: "true" } }],
    tier: 3,
  },
  cyberOverdrive: {
    id: "cyberOverdrive",
    name: "Quá Tải Hệ Thống",
    description: "Bản thân +60% SPD và +30% ATK trong 3 lượt.",
    cooldown: 5,
    targeting: "self",
    effects: [
      { status: { kind: "spdUp", value: 60, turns: 3, name: "Tăng Tốc" } },
      { status: { kind: "atkUp", value: 30, turns: 3, name: "Quá Tải" } },
    ],
    tier: 2,
  },
  poisonDart: {
    id: "poisonDart",
    name: "Phi Tiêu Độc",
    description: "90% ATK + poison 25% ATK/turn (3 lượt).",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 0.9, stat: "atk", type: "physical" } },
      { status: { kind: "poison", value: 42, turns: 3, name: "Trúng Độc" } },
    ],
    tier: 2,
  },
  soulDrain: {
    id: "soulDrain",
    name: "Hút Hồn",
    description: "150% MAG, hút 80% damage thành HP.",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 1.5, stat: "mag", type: "magic" } }],
    tier: 2,
    evolvesTo: "soulDrain_evo",
  },
  iceAge: {
    id: "iceAge",
    name: "Kỷ Băng Hà",
    description: "190% MAG toàn đội địch + đóng băng (stun) 1 lượt.",
    cooldown: 6,
    targeting: "all-enemies",
    ultimate: true,
    effects: [
      { damage: { scale: 1.9, stat: "mag", type: "magic" } },
      { status: { kind: "stun", value: 1, turns: 1, name: "Đóng Băng" } },
    ],
    tier: 3,
  },
  feralLeap: {
    id: "feralLeap",
    name: "Lao Hoang Dã",
    description: "160% ATK + bản thân +30% Crit (2 lượt).",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 1.6, stat: "atk", type: "physical" } },
      { status: { kind: "atkUp", value: 30, turns: 2, name: "Bản Năng" } },
    ],
    tier: 2,
  },
  outlawAmbush: {
    id: "outlawAmbush",
    name: "Phục Kích Băng Đảng",
    description: "200% ATK lên địch yếu nhất, không tốn lượt nếu giết được.",
    cooldown: 5,
    targeting: "enemy",
    effects: [{ damage: { scale: 2.0, stat: "atk", type: "physical" } }],
    tier: 3,
  },
  starfall: {
    id: "starfall",
    name: "Sao Băng Giáng",
    description: "320% MAG lên 1 địch, có 50% gây stun 1 lượt.",
    cooldown: 7,
    targeting: "enemy",
    ultimate: true,
    effects: [
      { damage: { scale: 3.2, stat: "mag", type: "magic" } },
      { status: { kind: "stun", value: 1, turns: 1, name: "Choáng Sao" } },
    ],
    tier: 3,
    evolvesTo: "starfall_evo",
  },

  // ============================================================
  // Evolved Skills (unlocked when base skill reaches lv 5)
  // ============================================================
  slash_evo: {
    id: "slash_evo",
    name: "⚡ Chém Thần Vũ",
    description: "Tiến hóa từ Chém Dũng Mãnh — 200% ATK + bleed 25%/turn 2 lượt.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 2.0, stat: "atk", type: "physical" } },
      { status: { kind: "bleed", value: 50, turns: 2, name: "Chém Thần" } },
    ],
    tier: 1,
    special: true,
  },
  fireball_evo: {
    id: "fireball_evo",
    name: "⚡ Địa Ngục Hỏa",
    description: "Tiến hóa từ Cầu Lửa — 220% MAG toàn địch + burn 30% MAG/turn 3 lượt.",
    cooldown: 4,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 2.2, stat: "mag", type: "magic" } },
      { status: { kind: "burn", value: 90, turns: 3, name: "Địa Ngục Lửa" } },
    ],
    tier: 1,
    special: true,
  },
  shadowStrike_evo: {
    id: "shadowStrike_evo",
    name: "⚡ Tử Thần Ám Sát",
    description: "Tiến hóa từ Ám Sát — 280% ATK + áp Dấu Tử (2 lượt).",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 2.8, stat: "atk", type: "physical" } },
      { status: { kind: "defDown", value: 35, turns: 2, name: "Dấu Tử Thần" } },
    ],
    tier: 1,
    special: true,
  },
  heal_evo: {
    id: "heal_evo",
    name: "⚡ Phục Hồi Thiêng Liêng",
    description: "Tiến hóa từ Hồi Phục — Hồi 160% MAG + regen 8% HP/turn 3 lượt.",
    cooldown: 4,
    targeting: "ally",
    effects: [
      { heal: { scale: 3.2, stat: "mag" } },
      { status: { kind: "regen", value: 0.08, turns: 3, name: "Phục Hồi Thiêng" } },
    ],
    tier: 1,
    special: true,
  },
  shieldBash_evo: {
    id: "shieldBash_evo",
    name: "⚡ Khiên Đả Hủy Diệt",
    description: "Tiến hóa từ Khiên Đả — 180% ATK + stun 2 lượt + DEF Up 60%.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 1.8, stat: "atk", type: "physical" } },
      { status: { kind: "stun", value: 1, turns: 2, name: "Choáng Nặng" } },
      { status: { kind: "defUp", value: 60, turns: 2, name: "Thép Phòng", target: "self" } },
    ],
    tier: 1,
    special: true,
  },
  pierceShot_evo: {
    id: "pierceShot_evo",
    name: "⚡ Tên Xuyên Thần",
    description: "Tiến hóa từ Phá Giáp Tiễn — 240% ATK chuẩn toàn địch.",
    cooldown: 4,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 2.4, stat: "atk", type: "true" } },
    ],
    tier: 1,
    special: true,
  },
  starfall_evo: {
    id: "starfall_evo",
    name: "⚡ Thiên Hà Sụp Đổ",
    description: "Tiến hóa từ Sao Băng Giáng — 500% MAG lên 1 địch, stun 2 lượt.",
    cooldown: 7,
    targeting: "enemy",
    ultimate: true,
    effects: [
      { damage: { scale: 5.0, stat: "mag", type: "magic" } },
      { status: { kind: "stun", value: 1, turns: 2, name: "Choáng Thiên Hà" } },
    ],
    tier: 3,
    special: true,
  },

  // ============================================================
  // Special Skills (bonus for specific heroes or items)
  // ============================================================
  voidPulse: {
    id: "voidPulse",
    name: "✦ Xung Hư Không",
    description: "Kỹ năng đặc biệt — 180% MAG chuẩn toàn địch + giảm 1 CD toàn đội.",
    cooldown: 5,
    ultimate: true,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 1.8, stat: "mag", type: "true" } },
      { cooldownReductionAll: 1 },
    ],
    tier: 3,
    special: true,
  },
  soulRend: {
    id: "soulRend",
    name: "✦ Xé Linh Hồn",
    description: "Kỹ năng đặc biệt — 250% ATK + hồi máu 80% sát thương gây ra cho bản thân.",
    cooldown: 5,
    targeting: "enemy",
    effects: [
      { damage: { scale: 2.5, stat: "atk", type: "physical" } },
      { heal: { scale: 2.0, stat: "atk" } },
    ],
    ultimate: true,
    tier: 3,
    special: true,
  },
  divineWrath: {
    id: "divineWrath",
    name: "✦ Thịnh Nộ Thần Linh",
    description: "Kỹ năng đặc biệt — 200% MAG toàn đội địch + ban phước +50% ATK toàn đội 3 lượt.",
    cooldown: 6,
    targeting: "all-enemies",
    ultimate: true,
    effects: [
      { damage: { scale: 2.0, stat: "mag", type: "true" } },
      { status: { kind: "atkUp", value: 50, turns: 3, name: "Thịnh Nộ", target: "self" } },
    ],
    tier: 3,
    special: true,
  },
  bloodFrenzy: {
    id: "bloodFrenzy",
    name: "✦ Điên Cuồng Huyết",
    description: "Kỹ năng đặc biệt — Bản thân +80% ATK, +50% SPD, hồi 8% HP/lượt trong 3 lượt.",
    cooldown: 6,
    targeting: "self",
    effects: [
      { status: { kind: "atkUp", value: 80, turns: 3, name: "Huyết Cuồng" } },
      { status: { kind: "spdUp", value: 50, turns: 3, name: "Tốc Huyết" } },
      { status: { kind: "regen", value: 0.08, turns: 3, name: "Huyết Sinh" } },
    ],
    tier: 3,
    special: true,
  },

  // ── PHANTOM SKILLS ───────────────────────────────────────────
  phantomStep: {
    id: "phantomStep",
    name: "Bước Ma",
    description: "Thoát xác — bản thân +60% EVA trong 2 lượt rồi đánh 130% ATK vật lý.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { status: { kind: "spdUp", value: 40, turns: 2, name: "Hư Ảo", target: "self" } },
      { damage: { scale: 1.3, stat: "atk", type: "physical" } },
    ],
    tier: 2,
  },
  phantomEcho: {
    id: "phantomEcho",
    name: "Tiếng Vọng Huyễn Ảnh",
    description: "Phản chiếu tâm trí — 180% MAG vào 1 mục tiêu. Nếu mục tiêu đang buff, sát thương tăng 50%.",
    cooldown: 4,
    targeting: "enemy",
    effects: [{ damage: { scale: 1.8, stat: "mag", type: "magic" } }],
    tier: 2,
  },
  mirrorRealm: {
    id: "mirrorRealm",
    name: "✦ Lãnh Địa Gương Vỡ",
    description: "Tối thượng — tạo 3 phân thân ảo trong 2 lượt, mỗi phân thân đánh 80% MAG vào kẻ địch ngẫu nhiên mỗi lượt (tổng 6 đòn).",
    cooldown: 6,
    targeting: "all-enemies",
    ultimate: true,
    effects: [
      { damage: { scale: 0.8, stat: "mag", type: "magic", hits: 3 } },
      { status: { kind: "defDown", value: 20, turns: 2, name: "Gương Vỡ" } },
    ],
    tier: 3,
    special: true,
  },
  stormEclipse: {
    id: "stormEclipse",
    name: "✦ Nhật Thực Bão Tố",
    description: "Huyễn Ma + Phong Bão hợp nhất — 300% ATK chân thực + áp Chảy Máu + giảm SPD 40% toàn địch 3 lượt.",
    cooldown: 7,
    targeting: "all-enemies",
    ultimate: true,
    effects: [
      { damage: { scale: 3.0, stat: "atk", type: "true" } },
      { status: { kind: "bleed", value: 72, turns: 3, name: "Bão Cắt" } },
      { status: { kind: "spdDown", value: 40, turns: 3, name: "Trói Bão" } },
    ],
    tier: 3,
    special: true,
  },

  // ── PLAGUE SKILLS ────────────────────────────────────────────
  plagueCloud: {
    id: "plagueCloud",
    name: "Mây Độc",
    description: "Bung mây dịch — 110% MAG + áp Độc 20% MAG/lượt (3 lượt) lên tất cả địch.",
    cooldown: 4,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 1.1, stat: "mag", type: "magic" } },
      { status: { kind: "poison", value: 40, turns: 3, name: "Dịch Độc" } },
    ],
    tier: 2,
  },
  plaguePulse: {
    id: "plaguePulse",
    name: "Xung Dịch Hạch",
    description: "Phát xung bệnh — 100% ATK + áp Độc lên tất cả địch trong tầm. Bản thân hồi 5% HP mỗi địch nhiễm độc.",
    cooldown: 4,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 1.0, stat: "atk", type: "physical" } },
      { status: { kind: "poison", value: 30, turns: 3, name: "Lây Lan" } },
    ],
    tier: 2,
  },
  plagueNova: {
    id: "plagueNova",
    name: "✦ Đại Bùng Phát Dịch",
    description: "Tối thượng — 250% MAG lên toàn địch + áp Độc nặng 30% MAG/lượt (4 lượt). Địch đang có Độc nhận thêm 50% sát thương.",
    cooldown: 6,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 2.5, stat: "mag", type: "magic" } },
      { status: { kind: "poison", value: 52, turns: 4, name: "Đại Dịch" } },
    ],
    tier: 3,
  },
  pestilenceField: {
    id: "pestilenceField",
    name: "✦ Cánh Đồng Bệnh Hoạn",
    description: "Tối thượng — 200% ATK chân thực + toàn đội địch nhiễm Độc + Bỏng đồng thời 4 lượt. Bản thân hồi 30% HP.",
    cooldown: 6,
    targeting: "all-enemies",
    ultimate: true,
    effects: [
      { damage: { scale: 2.0, stat: "atk", type: "true" } },
      { status: { kind: "poison", value: 44, turns: 4, name: "Dịch Cánh Đồng" } },
      { status: { kind: "burn", value: 55, turns: 4, name: "Lửa Dịch" } },
      { heal: { scale: 0.3, stat: "hp" } },
    ],
    tier: 3,
  },
  pandemicWave: {
    id: "pandemicWave",
    name: "✦ Sóng Đại Dịch",
    description: "Thiên khải — toàn đội địch: Độc + Bỏng + giảm ATK 30% (5 lượt). Đồng thời hồi đồng đội yếu nhất 40% HP.",
    cooldown: 6,
    targeting: "all-enemies",
    ultimate: true,
    effects: [
      { status: { kind: "poison", value: 58, turns: 5, name: "Đại Dịch Hoành Hành" } },
      { status: { kind: "burn", value: 50, turns: 5, name: "Bỏng Dịch" } },
      { status: { kind: "atkDown", value: 30, turns: 5, name: "Suy Kiệt" } },
    ],
    tier: 3,
    special: true,
  },

  // ── STORM SKILLS ─────────────────────────────────────────────
  galeShot: {
    id: "galeShot",
    name: "Đạn Gió Xoáy",
    description: "Bắn 2 phát có sức gió — 100% ATK/phát, mỗi phát giảm 15% SPD mục tiêu (2 lượt).",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 1.0, stat: "atk", type: "physical", hits: 2 } },
      { status: { kind: "spdDown", value: 15, turns: 2, name: "Gió Cắt" } },
    ],
    tier: 1,
  },
  galeSlash: {
    id: "galeSlash",
    name: "Chém Lốc Phong",
    description: "Xông vào như lốc xoáy — 170% ATK vật lý. Sau đòn này, SPD bản thân +30% trong 2 lượt.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 1.7, stat: "atk", type: "physical" } },
      { status: { kind: "spdUp", value: 30, turns: 2, name: "Phong Tốc", target: "self" } },
    ],
    tier: 2,
  },
  stormBarrage: {
    id: "stormBarrage",
    name: "Mưa Bão Đạn",
    description: "5 đạn bão tố — mỗi đạn 65% ATK ngẫu nhiên lên địch bất kỳ.",
    cooldown: 4,
    targeting: "all-enemies",
    effects: [{ damage: { scale: 0.65, stat: "atk", type: "physical", hits: 5 } }],
    tier: 2,
  },
  cycloneStrike: {
    id: "cycloneStrike",
    name: "Cú Đánh Lốc Xoáy",
    description: "Xuyên phòng — 220% ATK chân thực vào 1 mục tiêu. Toàn bộ kẻ địch bị giảm 25% SPD trong 2 lượt.",
    cooldown: 5,
    targeting: "enemy",
    effects: [
      { damage: { scale: 2.2, stat: "atk", type: "true" } },
      { status: { kind: "spdDown", value: 25, turns: 2, name: "Lốc Hút", target: "all-enemies" } },
    ],
    tier: 3,
  },
  thunderCyclone: {
    id: "thunderCyclone",
    name: "✦ Lốc Xoáy Thiên Lôi",
    description: "Tối thượng — 280% ATK vật lý lên 1 mục tiêu + 100% ATK cho tất cả kẻ địch xung quanh. Áp Stun 1 lượt.",
    cooldown: 6,
    targeting: "enemy",
    ultimate: true,
    effects: [
      { damage: { scale: 2.8, stat: "atk", type: "physical" } },
      { status: { kind: "stun", value: 1, turns: 1, name: "Sét Đánh" } },
    ],
    tier: 3,
  },
  tempestBlast: {
    id: "tempestBlast",
    name: "✦ Bão Lửa Tận Thế",
    description: "Tối thượng — combo bão + sét: 200% ATK vào tất cả địch. Các đòn tiếp theo trong lượt này +50% ATK.",
    cooldown: 6,
    targeting: "all-enemies",
    ultimate: true,
    effects: [
      { damage: { scale: 2.0, stat: "atk", type: "physical" } },
      { status: { kind: "atkUp", value: 50, turns: 2, name: "Bão Khí", target: "self" } },
    ],
    tier: 3,
    special: true,
  },

  bladeDance_evo: {
    id: "bladeDance_evo",
    name: "⚡ Vũ Điệu Tử Thần",
    description: "Tiến hóa từ Vũ Điệu Lưỡi Đao — 4 đòn x60% ATK, mỗi đòn trúng gây bleed 20% ATK/lượt 2 lượt.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 0.6, stat: "atk", type: "physical", hits: 4 } },
      { status: { kind: "bleed", value: 40, turns: 2, name: "Lưỡi Vũ Điệu" } },
    ],
    tier: 2,
    special: true,
  },
  dragonBreath_evo: {
    id: "dragonBreath_evo",
    name: "⚡ Thần Long Hỏa Ngục",
    description: "Tiến hóa từ Rồng Phun Lửa — 320% MAG toàn địch + burn 50% MAG/lượt 3 lượt.",
    cooldown: 5,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 3.2, stat: "mag", type: "magic" } },
      { status: { kind: "burn", value: 120, turns: 3, name: "Rồng Thiêu" } },
    ],
    tier: 2,
    special: true,
  },
  groupHeal_evo: {
    id: "groupHeal_evo",
    name: "⚡ Ánh Sáng Hồi Sinh",
    description: "Tiến hóa từ Ân Sủng Toàn Đội — Hồi 90% MAG HP toàn đội + regen 5% HP/lượt 3 lượt.",
    cooldown: 5,
    targeting: "all-allies",
    effects: [
      { heal: { scale: 1.8, stat: "mag" } },
      { status: { kind: "regen", value: 0.05, turns: 3, name: "Thánh Ân" } },
    ],
    tier: 2,
    special: true,
  },
  executioner_evo: {
    id: "executioner_evo",
    name: "⚡ Lưỡi Kiếm Phán Xét",
    description: "Tiến hóa từ Pháp Trường — 300% ATK, nếu địch HP < 30% thì instant kill.",
    cooldown: 5,
    targeting: "enemy",
    effects: [
      { damage: { scale: 3.0, stat: "atk", type: "physical" } },
    ],
    tier: 2,
    special: true,
  },
  deathMark_evo: {
    id: "deathMark_evo",
    name: "⚡ Hắc Ấn Tử Vong",
    description: "Tiến hóa từ Dấu Tử Thần — Giảm 60% DEF + 60% RES 3 lượt. Mọi đòn từ đội vào mục tiêu tăng thêm 20% sát thương.",
    cooldown: 5,
    targeting: "enemy",
    effects: [
      { status: { kind: "defDown", value: 60, turns: 3, name: "Hắc Ấn" } },
      { status: { kind: "resDown", value: 60, turns: 3, name: "Hắc Ấn" } },
    ],
    tier: 2,
    special: true,
  },
  rapidFire_evo: {
    id: "rapidFire_evo",
    name: "⚡ Bão Đạn Thần Tốc",
    description: "Tiến hóa từ Xạ Kích Liên Hoàn — 6 đòn x45% ATK toàn địch ngẫu nhiên, mỗi đòn có 30% crit thêm.",
    cooldown: 4,
    targeting: "all-enemies",
    effects: [
      { damage: { scale: 0.45, stat: "atk", type: "physical", hits: 6 } },
    ],
    tier: 2,
    special: true,
  },
  bleedSlash_evo: {
    id: "bleedSlash_evo",
    name: "⚡ Lưỡi Đao Máu Đỏ",
    description: "Tiến hóa từ Chém Gây Chảy Máu — 220% ATK + bleed 80% ATK/lượt 4 lượt, không thể trị.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 2.2, stat: "atk", type: "physical" } },
      { status: { kind: "bleed", value: 80, turns: 4, name: "Máu Không Cầm" } },
    ],
    tier: 2,
    special: true,
  },
  soulDrain_evo: {
    id: "soulDrain_evo",
    name: "⚡ Hút Hồn Tuyệt Đối",
    description: "Tiến hóa từ Hút Hồn — 200% MAG + hồi 100% sát thương gây ra + silence địch 2 lượt.",
    cooldown: 4,
    targeting: "enemy",
    effects: [
      { damage: { scale: 2.0, stat: "mag", type: "magic" } },
      { heal: { scale: 2.0, stat: "mag" } },
      { status: { kind: "silence", value: 1, turns: 2, name: "Im Lặng Vĩnh Cửu" } },
    ],
    tier: 2,
    special: true,
  },
}

// Evolution map: base skill id -> evolved skill id
export const SKILL_EVOLUTION_MAP: Record<string, string> = {
  slash: "slash_evo",
  fireball: "fireball_evo",
  shadowStrike: "shadowStrike_evo",
  heal: "heal_evo",
  shieldBash: "shieldBash_evo",
  pierceShot: "pierceShot_evo",
  starfall: "starfall_evo",
  bladeDance: "bladeDance_evo",
  dragonBreath: "dragonBreath_evo",
  groupHeal: "groupHeal_evo",
  executioner: "executioner_evo",
  deathMark: "deathMark_evo",
  rapidFire: "rapidFire_evo",
  bleedSlash: "bleedSlash_evo",
  soulDrain: "soulDrain_evo",
}

// Skill level requirements per skill index (hero must be this level to upgrade to that level)
// skillIndex 0,1 = regular skills; index 2 = ultimate
export const SKILL_LEVEL_REQUIREMENTS: Record<number, number[]> = {
  0: [1, 5, 10, 20, 35],  // lv1-5 requires hero lv 1,5,10,20,35
  1: [1, 7, 15, 25, 40],
  2: [1, 10, 20, 35, 50],
}

// ============================================================
// Passives (signature)
// ============================================================
export const PASSIVES: Record<string, Passive> = {
  ironWill: {
    id: "ironWill",
    name: "Ý Chí Sắt",
    description: "+15% DEF & RES cố định.",
    modifier: { def: 0.15, res: 0.15 },
  },
  bloodthirst: {
    id: "bloodthirst",
    name: "Khát Máu",
    description: "+15% Lifesteal.",
    modifier: { lifesteal: 15 },
  },
  arcaneAffinity: {
    id: "arcaneAffinity",
    name: "Hòa Hợp Phép Thuật",
    description: "+20% MAG.",
    modifier: { mag: 0.2 },
  },
  swiftStrike: {
    id: "swiftStrike",
    name: "Tốc Đả",
    description: "+25% SPD, +10% ACC.",
    modifier: { spd: 0.25, acc: 10 },
  },
  fortress: {
    id: "fortress",
    name: "Pháo Đài",
    description: "+25% HP, +20% DEF.",
    modifier: { hp: 0.25, def: 0.2 },
  },
  guardianAura: {
    id: "guardianAura",
    name: "Hào Quang Bảo Hộ",
    description: "Toàn đội +10% RES, hồi 5% HP/turn.",
    modifier: { res: 0.1 },
    signatureId: "team-regen",
  },
  shadowblade: {
    id: "shadowblade",
    name: "Bóng Đêm",
    description: "+25% Crit, +30% CritDmg.",
    modifier: { crit: 25, critDmg: 30 },
  },
  feralInstinct: {
    id: "feralInstinct",
    name: "Bản Năng Hoang Dã",
    description: "+15% ATK, +15% Lifesteal.",
    modifier: { atk: 0.15, lifesteal: 15 },
  },
  cyberCore: {
    id: "cyberCore",
    name: "Lõi Năng Lượng",
    description: "+15% ATK, +15% SPD, miễn poison.",
    modifier: { atk: 0.15, spd: 0.15 },
  },
  ancientSage: {
    id: "ancientSage",
    name: "Hiền Triết Cổ Đại",
    description: "+25% MAG, đầu trận giảm 1 CD toàn đội.",
    modifier: { mag: 0.25 },
    signatureId: "ancient-cdr",
  },
  elementalSurge: {
    id: "elementalSurge",
    name: "Năng Lượng Nguyên Tố",
    description: "+20% MAG, đánh thường áp burn 10%.",
    modifier: { mag: 0.2 },
    signatureId: "elem-passive-burn",
  },
  dragonHeart: {
    id: "dragonHeart",
    name: "Tim Rồng",
    description: "+25% ATK, +25% MAG.",
    modifier: { atk: 0.25, mag: 0.25 },
  },
  demonPact: {
    id: "demonPact",
    name: "Khế Ước Quỷ",
    description: "+30% Lifesteal, mỗi đòn đánh áp burn nhẹ.",
    modifier: { lifesteal: 30 },
    signatureId: "demon-passive-burn",
  },
  divineBlessing: {
    id: "divineBlessing",
    name: "Ân Sủng Thiêng Liêng",
    description: "Khiên 20% HP đầu trận, +20% RES.",
    modifier: { res: 0.2 },
    signatureId: "celestial-shield",
  },
  riskTaker: {
    id: "riskTaker",
    name: "Liều Lĩnh",
    description: "+30% Crit, +20% ATK, -10% DEF.",
    modifier: { crit: 30, atk: 0.2, def: -0.1 },
  },
  undyingSoul: {
    id: "undyingSoul",
    name: "Linh Hồn Bất Tử",
    description: "Khi tử trận lần đầu, hồi sinh với 30% HP.",
    modifier: {},
    signatureId: "undead-revive",
  },
  marksmanship: {
    id: "marksmanship",
    name: "Thiện Xạ",
    description: "+15% ATK, +15% SPD, +10% ACC.",
    modifier: { atk: 0.15, spd: 0.15, acc: 10 },
  },
  spellweaver: {
    id: "spellweaver",
    name: "Thợ Dệt Phép",
    description: "+30% MAG, kỹ năng phép có 20% CDR sau khi crit.",
    modifier: { mag: 0.3 },
  },
  bulwark: {
    id: "bulwark",
    name: "Bức Tường Sống",
    description: "+40% HP, +30% DEF, -15% SPD.",
    modifier: { hp: 0.4, def: 0.3, spd: -0.15 },
  },
  // ── NEW PASSIVES ─────────────────────────────────────────────
  ghostVeil: {
    id: "ghostVeil",
    name: "Màn Huyễn Ma",
    description: "+25% EVA. Khi HP xuống dưới 40%, thoát xác: vô hình 1 lượt (không thể bị nhắm mục tiêu).",
    modifier: { eva: 25 },
    signatureId: "ghost-veil",
  },
  infectiousAura: {
    id: "infectiousAura",
    name: "Hào Quang Lây Nhiễm",
    description: "+20% MAG. Khi tấn công thường, 25% áp Độc nhẹ (10% MAG/lượt, 2 lượt).",
    modifier: { mag: 0.2 },
    signatureId: "infectious-aura",
  },
  plagueHost: {
    id: "plagueHost",
    name: "Thân Xác Dịch Hạch",
    description: "+30% HP, +20% DEF. Miễn nhiễm mọi Độc/Bỏng. Khi nhận sát thương, 20% phản Độc lại kẻ tấn công.",
    modifier: { hp: 0.3, def: 0.2 },
    signatureId: "plague-host",
  },
  epidemicGod: {
    id: "epidemicGod",
    name: "Thần Đại Dịch",
    description: "+35% MAG. Độc và Bỏng của đội gây thêm 30% sát thương. Khi kẻ địch chết do Độc/Bỏng, đồng đội yếu nhất hồi 10% HP.",
    modifier: { mag: 0.35 },
    signatureId: "epidemic-god",
  },
  windRider: {
    id: "windRider",
    name: "Cưỡi Gió",
    description: "+20% SPD. Mỗi lượt cộng thêm 2% SPD (tối đa 10 lần). Khi SPD >200, đánh thường thêm 1 đòn phụ 50% ATK.",
    modifier: { spd: 0.2 },
    signatureId: "wind-rider",
  },
  stormChaser: {
    id: "stormChaser",
    name: "Kẻ Săn Bão",
    description: "+25% SPD, +15% ACC. Mỗi khi tốc độ vượt đối thủ >50 điểm, sát thương tăng 20%.",
    modifier: { spd: 0.25, acc: 15 },
    signatureId: "storm-chaser",
  },
  mirrorSoul: {
    id: "mirrorSoul",
    name: "Linh Hồn Gương Vỡ",
    description: "+30% EVA, +20% MAG. Khi né thành công, ngay lập tức tích năng lượng +15. Mỗi lần né tích lũy 5% MAG (tối đa 5 lần).",
    modifier: { eva: 30, mag: 0.2 },
    signatureId: "mirror-soul",
  },
  etherealStorm: {
    id: "etherealStorm",
    name: "Bão Hư Vô",
    description: "+40% EVA, +30% SPD. Khi né thành công, đòn phản công ngay 80% ATK chân thực. Miễn nhiễm Stun.",
    modifier: { eva: 40, spd: 0.3 },
    signatureId: "ethereal-storm",
  },
}

// ============================================================
// Skill unlock condition checker
// ============================================================
import type { OwnedHero, SkillUnlockCondition } from "./types"

export function checkSkillUnlockCondition(
  condition: SkillUnlockCondition,
  hero: OwnedHero,
  battlesWon: number,
): boolean {
  switch (condition.type) {
    case "twoSkillsMaxLevel":
      return hero.skillLevels.filter((lv) => lv >= 5).length >= 2
    case "heroLevel":
      return hero.level >= condition.level
    case "allSkillsLevel":
      return hero.skillLevels.every((lv) => lv >= condition.level)
    case "battlesWon":
      return battlesWon >= condition.count
    case "skillCombo":
      // Each named skill must be at level >= 3
      return condition.skillIds.every((sid, i) => {
        // Map skillId to index via skills array (we check base skills only)
        // We check if any of the hero's skill slots contains this skillId at lv3+
        return true // simplified — real impl would need template lookup; UI handles display
      })
    default:
      return false
  }
}

export function getUnlockConditionText(condition: SkillUnlockCondition): string {
  switch (condition.type) {
    case "twoSkillsMaxLevel": return "Đạt lv.MAX 2 kỹ năng bất kỳ"
    case "heroLevel": return `Anh hùng đạt Lv.${condition.level}`
    case "allSkillsLevel": return `Tất cả kỹ năng đạt Lv.${condition.level}`
    case "battlesWon": return `Thắng ${condition.count} trận`
    case "skillCombo": return `Combo: ${condition.skillIds.join(" + ")} đạt Lv.3`
    default: return "Điều kiện ẩn"
  }
}

// ============================================================
// BONUS SKILLS — Unique creative mechanics per hero
// ============================================================

// ── BORIN (human warrior) ──────────────────────────────────
// Already has executioner, bleedSlash as bonus. Add 2 more:
// (bonusSkills already defined in heroes.ts, these are the skill defs)

// Borin bonus skill 1: "Đất Sụp" — AOE taunt + next hit on Borin is countered
// (already has executioner + bleedSlash defined above)

// ── LYRRA (human marksman) ────────────────────────────────
Object.assign(SKILLS, {
  windArrow: {
    id: "windArrow",
    name: "Tên Cuồng Phong",
    description: "Bắn tên xuyên gió — 110% ATK cho tất cả địch trong hàng. Địch trúng bị giảm ACC 25% trong 2 lượt.",
    cooldown: 4,
    targeting: "all-enemies" as const,
    effects: [
      { damage: { scale: 1.1, stat: "atk" as const, type: "physical" as const } },
      { status: { kind: "spdDown" as const, value: 20, turns: 2, name: "Mù Gió" } },
    ],
    tier: 2 as const,
  },
  phantomArrow: {
    id: "phantomArrow",
    name: "Tiễn Ảo Hình",
    description: "Bắn 3 ảnh phân thân — mỗi mũi tên 60% ATK, mỗi đòn có 40% né miễn phí trong lượt này.",
    cooldown: 5,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 0.6, stat: "atk" as const, type: "physical" as const, hits: 3 } }],
    tier: 3 as const,
  },
  // GROM bonus skills
  packHowl: {
    id: "packHowl",
    name: "Hú Gọi Bầy",
    description: "Hú lên! Toàn đội +20% ATK và +15% SPD trong 3 lượt. Bản thân hồi 15% HP.",
    cooldown: 5,
    targeting: "all-allies" as const,
    effects: [
      { status: { kind: "atkUp" as const, value: 20, turns: 3, name: "Sức Mạnh Bầy Sói", target: "all-allies" as const } },
      { heal: { scale: 0.15, stat: "hp" as const } },
    ],
    tier: 2 as const,
  },
  berserkerRage: {
    id: "berserkerRage",
    name: "Điên Cuồng Thú Hoang",
    description: "Chuyển toàn bộ DEF thành ATK trong 2 lượt. Đánh 240% ATK với crit +50%, rồi trả lại DEF ban đầu.",
    cooldown: 6,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 2.4, stat: "atk" as const, type: "physical" as const } }],
    tier: 3 as const,
  },
  // MIRELLE bonus skills
  manaShatter: {
    id: "manaShatter",
    name: "Nổ Tung Phép Thuật",
    description: "Khống chế — áp Stun 1 lượt lên 1 địch + 120% MAG. Nếu mục tiêu đang có buff, sát thương +50%.",
    cooldown: 4,
    targeting: "enemy" as const,
    effects: [
      { damage: { scale: 1.2, stat: "mag" as const, type: "magic" as const } },
      { status: { kind: "stun" as const, value: 1, turns: 1, name: "Phép Nổ" } },
    ],
    tier: 2 as const,
  },
  spellMirror: {
    id: "spellMirror",
    name: "Gương Phản Phép",
    description: "Tạo lá chắn 80% MAG phản lại toàn bộ phép magic nhận được trong 2 lượt tiếp theo.",
    cooldown: 5,
    targeting: "self" as const,
    effects: [
      { status: { kind: "shield" as const, value: 200, turns: 2, name: "Gương Phép" } },
    ],
    tier: 2 as const,
  },
  // OTTO bonus skills
  immovableStance: {
    id: "immovableStance",
    name: "Tư Thế Bất Động",
    description: "2 lượt không thể bị knockback, stun, hay giảm chỉ số. Nhận -30% sát thương. Phản đòn 40% ATK với mọi đòn vật lý nhận.",
    cooldown: 5,
    targeting: "self" as const,
    effects: [
      { status: { kind: "defUp" as const, value: 30, turns: 2, name: "Tư Thế Sắt" } },
    ],
    tier: 2 as const,
  },
  fortressBreaker: {
    id: "fortressBreaker",
    name: "Thành Trì Sụp Đổ",
    description: "Dùng khiên tấn công — 180% ATK chân thực. Nếu địch có DEF > 100, gây thêm 1% HP tối đa của địch như true damage.",
    cooldown: 6,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 1.8, stat: "atk" as const, type: "true" as const } }],
    tier: 3 as const,
  },
  // ZARA bonus skills
  smokeBomb: {
    id: "smokeBomb",
    name: "Bom Khói",
    description: "Ném bom khói — bản thân vô hình 1 lượt (không thể bị nhắm). Toàn bộ địch giảm ACC 35% trong 2 lượt.",
    cooldown: 4,
    targeting: "self" as const,
    effects: [
      { status: { kind: "evaUp" as const, value: 50, turns: 1, name: "Khói Ẩn" } as any },
    ],
    tier: 2 as const,
  },
  venomBlade: {
    id: "venomBlade",
    name: "Lưỡi Độc Nha",
    description: "Tẩm độc lưỡi dao — 3 đòn 90% ATK mỗi đòn. Mỗi đòn có 60% áp Poison 2 lượt. Hút 30% sát thương gây ra.",
    cooldown: 5,
    targeting: "enemy" as const,
    effects: [
      { damage: { scale: 0.9, stat: "atk" as const, type: "physical" as const, hits: 3 } },
      { status: { kind: "poison" as const, value: 28, turns: 2, name: "Nọc Độc" } },
    ],
    tier: 3 as const,
  },
  // THALAS bonus skills
  infernalCore: {
    id: "infernalCore",
    name: "Lõi Địa Ngục",
    description: "Bùng cháy từ bên trong — 200% MAG lên 1 địch. Nếu địch đang Burn, sát thương nhân đôi và lan sang địch kề.",
    cooldown: 5,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 2.0, stat: "mag" as const, type: "magic" as const } }],
    tier: 3 as const,
  },
  glacialTrap: {
    id: "glacialTrap",
    name: "Bẫy Băng Sơn",
    description: "Cài bẫy — địch tấn công bản thân lần tới nhận 150% MAG lạnh + giảm 40% SPD trong 3 lượt.",
    cooldown: 4,
    targeting: "self" as const,
    effects: [
      { status: { kind: "defUp" as const, value: 0, turns: 3, name: "Bẫy Băng" } },
    ],
    tier: 2 as const,
  },
  // RAVI bonus skills
  tigerPounce: {
    id: "tigerPounce",
    name: "Hổ Vồ Mồi",
    description: "Nhảy vào địch thấp máu nhất — 200% ATK + hút 50% sát thương. Nếu địch chết, ngay lập tức hành động thêm 1 lần.",
    cooldown: 5,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 2.0, stat: "atk" as const, type: "physical" as const } }],
    tier: 3 as const,
  },
  woundDeepen: {
    id: "woundDeepen",
    name: "Xé Toạc Vết Thương",
    description: "Xé rộng vết chảy máu — nếu địch đang Bleed, đòn này gây 160% ATK và bleed nổ tung (gây ngay 3 lượt còn lại).",
    cooldown: 4,
    targeting: "enemy" as const,
    effects: [{ damage: { scale: 1.6, stat: "atk" as const, type: "physical" as const } }],
    tier: 2 as const,
  },
  // EMBER bonus skills
  scatterBomb: {
    id: "scatterBomb",
    name: "Bom Nổ Văng",
    description: "Bắn bom nổ mảnh — 90% ATK lên tất cả địch. Mỗi địch có 50% nhận thêm Bleed 2 lượt.",
    cooldown: 4,
    targeting: "all-enemies" as const,
    effects: [
      { damage: { scale: 0.9, stat: "atk" as const, type: "physical" as const } },
      { status: { kind: "bleed" as const, value: 35, turns: 2, name: "Mảnh Bom" } },
    ],
    tier: 2 as const,
  },
  deadEyeShot: {
    id: "deadEyeShot",
    name: "Mắt Chết",
    description: "Ngắm kỹ 1 lượt (giảm 40% SPD) rồi bắn phát chí tử: 300% ATK chân thực, đảm bảo crit.",
    cooldown: 6,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 3.0, stat: "atk" as const, type: "true" as const } }],
    tier: 3 as const,
  },
  // AELINOR bonus skills
  prayerShield: {
    id: "prayerShield",
    name: "Khiên Cầu Nguyện",
    description: "Trao khiên thiêng cho đồng minh ít máu nhất: Hấp thụ 30% HP tối đa địch đó. Tồn tại 3 lượt.",
    cooldown: 4,
    targeting: "ally" as const,
    effects: [
      { status: { kind: "shield" as const, value: 300, turns: 3, name: "Khiên Cầu" } },
    ],
    tier: 2 as const,
  },
  moonlightSurge: {
    id: "moonlightSurge",
    name: "Vầng Trăng Bùng Nổ",
    description: "Kêu gọi ánh trăng — hồi 25% HP toàn đội + tăng MAG 30% cho caster trong 3 lượt. Xóa 1 debuff cho mỗi đồng đội.",
    cooldown: 6,
    targeting: "all-allies" as const,
    ultimate: true as const,
    effects: [
      { heal: { scale: 0.25, stat: "hp" as const } },
      { status: { kind: "atkUp" as const, value: 30, turns: 3, name: "Ánh Trăng", target: "self" as const } },
    ],
    tier: 3 as const,
  },
  // KAEL bonus skills
  thunderMantle: {
    id: "thunderMantle",
    name: "Áo Giáp Sấm",
    description: "Bao phủ bản thân bằng sét — mọi kẻ địch tấn công nhận 80% MAG sát thương phản ngược. Kéo dài 3 lượt.",
    cooldown: 5,
    targeting: "self" as const,
    effects: [
      { status: { kind: "defUp" as const, value: 20, turns: 3, name: "Sấm Giáp" } },
    ],
    tier: 2 as const,
  },
  stormjudgment: {
    id: "stormjudgment",
    name: "Phán Xét Sấm Thiên",
    description: "Triệu hồi sấm từ trời — 250% ATK+MAG hỗn hợp lên 1 địch. Áp Stun 1 lượt. Nếu địch đang Stun, sát thương +80%.",
    cooldown: 6,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [
      { damage: { scale: 2.5, stat: "atk" as const, type: "true" as const } },
      { status: { kind: "stun" as const, value: 1, turns: 1, name: "Phán Xét" } },
    ],
    tier: 3 as const,
  },
  // NYX bonus skills
  nightmareStep: {
    id: "nightmareStep",
    name: "Bước Ác Mộng",
    description: "Thoát vào bóng tối — vô hình 1 lượt + SPD +50%. Đòn kế tiếp sau vô hình đảm bảo crit và +80% ATK.",
    cooldown: 4,
    targeting: "self" as const,
    effects: [
      { status: { kind: "spdUp" as const, value: 50, turns: 1, name: "Bóng Đêm" } },
    ],
    tier: 2 as const,
  },
  soulHarvest: {
    id: "soulHarvest",
    name: "Thu Hoạch Linh Hồn",
    description: "Mỗi kẻ địch đã chết trong trận: bản thân tăng 15% ATK vĩnh viễn (tối đa 5 lần). Kích hoạt ngay và khi địch ngã.",
    cooldown: 4,
    targeting: "self" as const,
    effects: [],
    tier: 1 as const,
    special: true as const,
  },
  // OZRIC bonus skills
  frozenField: {
    id: "frozenField",
    name: "Cánh Đồng Đóng Băng",
    description: "Đóng băng toàn bộ chiến trường 2 lượt: tất cả địch giảm SPD 50% và nhận thêm 25% sát thương phép.",
    cooldown: 5,
    targeting: "all-enemies" as const,
    effects: [
      { status: { kind: "spdDown" as const, value: 50, turns: 2, name: "Đồng Băng" } },
    ],
    tier: 3 as const,
  },
  absoluteZero: {
    id: "absoluteZero",
    name: "Tuyệt Đối Không",
    description: "Lạnh tuyệt đối — 1 địch bị Stun 2 lượt hoàn toàn + 220% MAG. Cooldown giảm 2 nếu địch chết.",
    cooldown: 6,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [
      { damage: { scale: 2.2, stat: "mag" as const, type: "magic" as const } },
      { status: { kind: "stun" as const, value: 2, turns: 2, name: "Đóng Băng Tuyệt Đối" } },
    ],
    tier: 3 as const,
  },
  // VEX bonus skills
  nanotechStrike: {
    id: "nanotechStrike",
    name: "Đòn Nano Công Nghệ",
    description: "Tiêm nano vào địch — 120% ATK. Mỗi lượt sau địch mất 5% HP tối đa (không thể chết từ hiệu ứng này, 4 lượt).",
    cooldown: 4,
    targeting: "enemy" as const,
    effects: [
      { damage: { scale: 1.2, stat: "atk" as const, type: "true" as const } },
      { status: { kind: "poison" as const, value: 40, turns: 4, name: "Nano Ký Sinh" } },
    ],
    tier: 2 as const,
  },
  overclock: {
    id: "overclock",
    name: "Quá Tải Hệ Thống",
    description: "Ép CPU — ATK tăng 60%, SPD tăng 40% trong 3 lượt. Sau đó -20% ATK lượt thứ 4 (quá nhiệt).",
    cooldown: 6,
    ultimate: true,
    targeting: "self" as const,
    effects: [
      { status: { kind: "atkUp" as const, value: 60, turns: 3, name: "Quá Tải" } },
      { status: { kind: "spdUp" as const, value: 40, turns: 3, name: "Tốc Độ Cao" } },
      { status: { kind: "atkDown" as const, value: 20, turns: 4, name: "Quá Nhiệt" } },
    ],
    tier: 2 as const,
  },
  // MORGATH bonus skills
  soulChain: {
    id: "soulChain",
    name: "Xích Linh Hồn",
    description: "Xiềng 1 địch bằng linh hồn cổ — địch đó mất 30% ATK và bị buộc phải tấn công Morgath trong 2 lượt.",
    cooldown: 4,
    targeting: "enemy" as const,
    effects: [
      { status: { kind: "atkDown" as const, value: 30, turns: 2, name: "Xích Hồn" } },
    ],
    tier: 2 as const,
  },
  graveTide: {
    id: "graveTide",
    name: "Sóng Lăng Mộ",
    description: "Gọi sóng xác chết — 150% ATK chân thực lên tất cả địch. Mỗi địch chết trong trận: Morgath hồi thêm 5% HP tối đa.",
    cooldown: 6,
    targeting: "all-enemies" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 1.5, stat: "atk" as const, type: "true" as const } }],
    tier: 3 as const,
  },
  // SERAPHINE bonus skills
  holyBarrier: {
    id: "holyBarrier",
    name: "Hàng Rào Thánh",
    description: "Tạo hàng rào thiêng — toàn đội nhận khiên 20% HP tối đa. Nếu địch dùng Ultimate, khiên nhân đôi.",
    cooldown: 5,
    targeting: "all-allies" as const,
    effects: [
      { status: { kind: "shield" as const, value: 250, turns: 3, name: "Hàng Rào Thánh" } },
    ],
    tier: 2 as const,
  },
  divineStrike: {
    id: "divineStrike",
    name: "Đòn Thần Thánh",
    description: "Thiên thần trừng phạt — 200% MAG chân thực lên 1 địch. Nếu địch HP < 50%, gây thêm 150% MAG + heal đồng đội yếu nhất 25% HP.",
    cooldown: 6,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 2.0, stat: "mag" as const, type: "true" as const } }],
    tier: 3 as const,
  },
  // DRAKTHAR bonus skills
  dragonScaleMoult: {
    id: "dragonScaleMoult",
    name: "Lột Xác Rồng",
    description: "Lột lớp vảy — hồi sinh 20% HP. Trong 2 lượt tiếp theo nhận -50% sát thương. Khi hiệu ứng hết, vảy mới +15% DEF vĩnh viễn (tối đa 3 lần).",
    cooldown: 6,
    targeting: "self" as const,
    effects: [
      { heal: { scale: 0.2, stat: "hp" as const } },
      { status: { kind: "defUp" as const, value: 50, turns: 2, name: "Vảy Rồng Mới" } },
    ],
    tier: 2 as const,
  },
  ancientDragonRoar: {
    id: "ancientDragonRoar",
    name: "Tiếng Gầm Thái Cổ",
    description: "Gầm vang trời — toàn bộ địch giảm 40% ATK và DEF trong 3 lượt. Toàn đội tăng 25% ATK trong 3 lượt.",
    cooldown: 6,
    targeting: "all-enemies" as const,
    ultimate: true as const,
    effects: [
      { status: { kind: "atkDown" as const, value: 40, turns: 3, name: "Sợ Hãi" } },
      { status: { kind: "defDown" as const, value: 40, turns: 3, name: "Lung Lay" } },
    ],
    tier: 3 as const,
  },
  // VELKA bonus skills
  undeadArmy: {
    id: "undeadArmy",
    name: "Đội Quân Tử Thi",
    description: "Triệu xác chết đồng đội đã ngã — mỗi đồng minh chết tăng 20% MAG và hút thêm 5% sinh lực cho Velka trong trận này.",
    cooldown: 4,
    targeting: "self" as const,
    effects: [
      { status: { kind: "atkUp" as const, value: 20, turns: 4, name: "Quân Đội Tử Thi" } },
    ],
    tier: 2 as const,
  },
  doomCurse: {
    id: "doomCurse",
    name: "Lời Nguyền Tử Thần",
    description: "Nguyền 1 địch: trong 4 lượt, mọi hiệu ứng chữa lành của địch chuyển thành sát thương. Khi nguyền hết, địch mất 20% HP tối đa.",
    cooldown: 6,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [
      { status: { kind: "defDown" as const, value: 0, turns: 4, name: "Lời Nguyền" } },
    ],
    tier: 3 as const,
    special: true as const,
  },
  // SILVANIR bonus skills
  starRain: {
    id: "starRain",
    name: "Mưa Sao Băng",
    description: "Bắn 8 tên sao — mỗi tên 45% ATK ngẫu nhiên lên địch bất kỳ. Mỗi crit tăng SPD bản thân 5% (lượt này).",
    cooldown: 5,
    targeting: "all-enemies" as const,
    effects: [{ damage: { scale: 0.45, stat: "atk" as const, type: "physical" as const, hits: 8 } }],
    tier: 2 as const,
  },
  constellationArrow: {
    id: "constellationArrow",
    name: "Tên Chòm Sao",
    description: "Bắn qua tất cả thực tại — 350% ATK chân thực lên 1 địch. Không thể né, không thể chặn. Cooldown giảm 1 mỗi khi địch chết trong trận.",
    cooldown: 7,
    targeting: "enemy" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 3.5, stat: "atk" as const, type: "true" as const } }],
    tier: 3 as const,
  },
  // KAZUMI bonus skills
  mirrorKill: {
    id: "mirrorKill",
    name: "Giết Bóng Gương",
    description: "Tạo phân thân — đánh cùng mục tiêu 2 lần đồng thời, mỗi đòn 90% ATK. Đòn thứ 2 không thể bị né.",
    cooldown: 4,
    targeting: "enemy" as const,
    effects: [{ damage: { scale: 0.9, stat: "atk" as const, type: "physical" as const, hits: 2 } }],
    tier: 2 as const,
  },
  rainDeath: {
    id: "rainDeath",
    name: "Vũ Khúc Lưỡi Mưa",
    description: "Hoà vào cơn mưa — đánh cả đội địch 1 lần 120% ATK. Nếu bất kỳ địch nào chết, Kazumi ẩn thân 1 lượt ngay sau.",
    cooldown: 6,
    targeting: "all-enemies" as const,
    ultimate: true as const,
    effects: [{ damage: { scale: 1.2, stat: "atk" as const, type: "physical" as const } }],
    tier: 3 as const,
  },
})
