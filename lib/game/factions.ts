import type { Origin, Role, SynergyDefinition, Trait } from "./types"

export const ROLE_LABEL: Record<Role, string> = {
  warrior: "Đấu Sĩ",
  assassin: "Sát Thủ",
  mage: "Pháp Sư",
  marksman: "Xạ Thủ",
  tank: "Vệ Binh",
  support: "Trợ Thủ",
}

export const ORIGIN_LABEL: Record<Origin, string> = {
  human: "Loài Người",
  beastkin: "Thú Nhân",
  cyber: "Tương Lai",
  ancient: "Cổ Xưa",
  elemental: "Nguyên Tố",
  undead: "Bất Tử",
  dragon: "Long Tộc",
  demon: "Ác Quỷ",
  celestial: "Thiên Thần",
  outlaw: "Băng Đảng",
  phantom: "Huyễn Ma",
  plague: "Dịch Hạch",
  storm: "Phong Bão",
}

export const TRAIT_LABEL: Record<Trait, string> = {
  ...ROLE_LABEL,
  ...ORIGIN_LABEL,
}

export const ALL_ROLES: Role[] = [
  "warrior",
  "assassin",
  "mage",
  "marksman",
  "tank",
  "support",
]

export const ALL_ORIGINS: Origin[] = [
  "human",
  "beastkin",
  "cyber",
  "ancient",
  "elemental",
  "undead",
  "dragon",
  "demon",
  "celestial",
  "outlaw",
  "phantom",
  "plague",
  "storm",
]

// Synergy definitions: each gives stacking buffs at specific counts.
// Applied to all team members (not just synergy-matching ones, for simplicity).
export const SYNERGIES: SynergyDefinition[] = [
  // Roles
  {
    trait: "warrior",
    name: "Đấu Sĩ",
    description: "Khi một đấu sĩ hạ kẻ địch, đấu sĩ kế tiếp trong lượt không tốn cooldown cho kỹ năng đầu tiên.",
    tiers: [
      { count: 2, description: "+15% ATK, +10% DEF. Hạ địch → đấu sĩ kế tiếp hành động ngay.", modifiers: { atk: 0.15, def: 0.1 }, bonusId: "warrior-chain-1" },
      { count: 4, description: "+35% ATK, +25% DEF. Khi đấu sĩ crit, toàn đội đấu sĩ +10% ATK vĩnh viễn (tối đa 5 lần/trận).", modifiers: { atk: 0.35, def: 0.25 }, bonusId: "warrior-chain-2" },
    ],
  },
  {
    trait: "assassin",
    name: "Sát Thủ",
    description: "Sát thủ nhắm vào mục tiêu thấp HP nhất. Mỗi lần crit: nạp năng lượng tức thì +20.",
    tiers: [
      { count: 2, description: "+15% Crit, +30% CritDmg. Crit → +20 năng lượng ngay lập tức.", modifiers: { crit: 15, critDmg: 30 }, bonusId: "assassin-energize-1" },
      { count: 3, description: "+30% Crit, +60% CritDmg. Khi sát thủ hạ địch: vô hình 1 lượt, không thể bị nhắm mục tiêu.", modifiers: { crit: 30, critDmg: 60 }, bonusId: "assassin-energize-2" },
    ],
  },
  {
    trait: "mage",
    name: "Pháp Sư",
    description: "Phép thuật cộng hưởng — kỹ năng phép sau khi crit giảm 1 cooldown toàn đội pháp sư.",
    tiers: [
      { count: 2, description: "+25% MAG. Sau crit phép: giảm 1 CD của pháp sư kế tiếp.", modifiers: { mag: 0.25 }, bonusId: "mage-resonance-1" },
      { count: 4, description: "+60% MAG, +20% RES. Mỗi kỹ năng phép áp debuff: địch chịu +15% sát thương tiếp theo.", modifiers: { mag: 0.6, res: 0.2 }, bonusId: "mage-resonance-2" },
    ],
  },
  {
    trait: "marksman",
    name: "Xạ Thủ",
    description: "Khi xạ thủ bắn trúng mục tiêu đã có debuff: đòn đó xuyên 100% phòng thủ.",
    tiers: [
      { count: 2, description: "+25% SPD, +15% ACC. Bắn trúng địch đang có debuff → xuyên giáp hoàn toàn.", modifiers: { spd: 0.25, acc: 15 }, bonusId: "marksman-pierce-1" },
      { count: 3, description: "+50% SPD, +30% ACC. Sau mỗi 3 lượt: mọi xạ thủ bắn thêm 1 đòn tự do 80% ATK.", modifiers: { spd: 0.5, acc: 30 }, bonusId: "marksman-pierce-2" },
    ],
  },
  {
    trait: "tank",
    name: "Vệ Binh",
    description: "Vệ binh hấp thụ sát thương thay đồng đội yếu nhất khi đồng đội đó sắp bị chí mạng.",
    tiers: [
      { count: 2, description: "+25% HP, +20% DEF. Khi đồng minh <30% HP bị đánh: tank chặn 40% sát thương đó.", modifiers: { hp: 0.25, def: 0.2 }, bonusId: "tank-intercept-1" },
      { count: 4, description: "+60% HP, +50% DEF, +20% RES. Tank có Lifesteal 20%. Khi tank chết: hồi 25% HP cho toàn đội.", modifiers: { hp: 0.6, def: 0.5, res: 0.2, lifesteal: 20 }, bonusId: "tank-intercept-2" },
    ],
  },
  {
    trait: "support",
    name: "Trợ Thủ",
    description: "Mỗi khi trợ thủ hồi máu: đồng minh nhận hồi thêm 1 lá chắn nhỏ bằng 50% lượng hồi đó.",
    tiers: [
      { count: 2, description: "+10% Regen, +15% RES. Mỗi lần heal: tạo khiên 50% lượng heal (tồn tại 2 lượt).", modifiers: { res: 0.15 }, bonusId: "support-overheal-1" },
      { count: 3, description: "+20% Regen, +30% RES. Khi khiên bể: phản 30% sát thương lại kẻ phá khiên.", modifiers: { res: 0.3 }, bonusId: "support-overheal-2" },
    ],
  },
  // Origins
  {
    trait: "human",
    name: "Loài Người",
    description: "Kiên cường — khi dưới 25% HP, Loài Người kháng CC và nhận giảm sát thương thêm 20%.",
    tiers: [
      { count: 2, description: "+10% mọi chỉ số. Dưới 25% HP: kháng Stun + -15% sát thương nhận.", modifiers: { atk: 0.1, mag: 0.1, hp: 0.1, def: 0.1 }, bonusId: "human-resilience-1" },
      { count: 4, description: "+25% mọi chỉ số. Dưới 25% HP: +50% ATK & MAG thêm vào (Liều chết).", modifiers: { atk: 0.25, mag: 0.25, hp: 0.25, def: 0.25 }, bonusId: "human-resilience-2" },
    ],
  },
  {
    trait: "beastkin",
    name: "Thú Nhân",
    description: "Bản năng săn mồi — mỗi lần đánh thường có 25% kích hoạt Bầy Sói: đánh thêm 1 lần miễn phí.",
    tiers: [
      { count: 2, description: "+20% ATK, +10% Lifesteal. Đánh thường 25% proc đòn phụ 60% ATK.", modifiers: { atk: 0.2, lifesteal: 10 }, bonusId: "beastkin-frenzy-1" },
      { count: 3, description: "+45% ATK, +25% Lifesteal. Đòn phụ tăng 100% ATK. Khi hạ địch: toàn đội Thú Nhân hành động sớm hơn.", modifiers: { atk: 0.45, lifesteal: 25 }, bonusId: "beastkin-frenzy-2" },
    ],
  },
  {
    trait: "cyber",
    name: "Tương Lai",
    description: "Giao thức tấn công — Tương Lai chia sẻ dữ liệu: khi 1 unit tấn công, unit kế tiếp +10% ATK đòn đó.",
    tiers: [
      { count: 2, description: "+15% True Dmg, +15% SPD. Sau mỗi lượt: tích lũy 10 năng lượng tự động.", modifiers: { spd: 0.15 }, bonusId: "cyber-datalink-1" },
      { count: 3, description: "+30% True Dmg, +30% SPD. Khi Ultimate kích hoạt: toàn bộ Tương Lai cùng +25% ATK trong 2 lượt.", modifiers: { spd: 0.3 }, bonusId: "cyber-datalink-2" },
    ],
  },
  {
    trait: "ancient",
    name: "Cổ Xưa",
    description: "Tri thức vạn năm — Cổ Xưa nhớ tên mọi kỹ năng địch đã dùng; sát thương nhận từ kỹ năng đã thấy -15%.",
    tiers: [
      { count: 2, description: "+20% MAG, giảm 1 CD đầu trận. Kỹ năng địch đã thấy: -15% sát thương.", modifiers: { mag: 0.2 }, bonusId: "ancient-memory-1" },
      { count: 4, description: "+50% MAG, giảm 2 CD đầu trận. Kỹ năng địch đã thấy: -30% sát thương + phản 10% lại.", modifiers: { mag: 0.5 }, bonusId: "ancient-memory-2" },
    ],
  },
  {
    trait: "elemental",
    name: "Nguyên Tố",
    description: "Cộng hưởng nguyên tố — khi 2 loại trạng thái thái tố (Burn + Poison / Ice + Lightning) cùng tồn tại trên 1 địch: nổ phản ứng gây 20% HP tối đa sát thương thật.",
    tiers: [
      { count: 2, description: "+20% MAG. Burn+Poison trên cùng 1 địch: nổ phản ứng 20% HP sát thương thật.", modifiers: { mag: 0.2 }, bonusId: "elemental-reaction-1" },
      { count: 3, description: "+45% MAG. Phản ứng gây 35% HP thật + trải ra tất cả địch (splash 15% HP).", modifiers: { mag: 0.45 }, bonusId: "elemental-reaction-2" },
    ],
  },
  {
    trait: "undead",
    name: "Bất Tử",
    description: "Không bao giờ bỏ cuộc — khi Bất Tử ngã xuống, linh hồn lơ lửng 1 lượt vẫn gây hiệu ứng passive.",
    tiers: [
      { count: 2, description: "+20% Lifesteal, +15% HP. Khi chết: Bất Tử tiếp tục áp passive thêm 1 lượt.", modifiers: { lifesteal: 20, hp: 0.15 }, bonusId: "undead-lingering-1" },
      { count: 3, description: "+40% Lifesteal, +30% HP. Khi chết: hồi sinh 1 lần với 30% HP + hồi phục 10% HP/lượt trong 2 lượt.", modifiers: { lifesteal: 40, hp: 0.3 }, bonusId: "undead-lingering-2" },
    ],
  },
  {
    trait: "dragon",
    name: "Long Tộc",
    description: "Sức mạnh vô song — sát thương tăng theo HP đã mất. Khi HP < 50%: Long Tộc chuyển sang Hình Thái Long Noãn.",
    tiers: [
      { count: 2, description: "+25% ATK, +25% MAG. HP<50%: +20% ATK thêm (Hình Thái Long Noãn).", modifiers: { atk: 0.25, mag: 0.25 }, bonusId: "dragon-wrath-1" },
      { count: 3, description: "+55% ATK, +55% MAG. HP<50%: kháng CC, +40% ATK thêm + áp Burn cho mọi đòn.", modifiers: { atk: 0.55, mag: 0.55 }, bonusId: "dragon-wrath-2" },
    ],
  },
  {
    trait: "demon",
    name: "Ác Quỷ",
    description: "Thỏa thuận quỷ — mỗi kỹ năng của Ác Quỷ tiêu 5% HP bản thân, nhưng gây thêm 25% sát thương.",
    tiers: [
      { count: 2, description: "+20% Lifesteal. Kỹ năng -5% HP bản thân, gây thêm 25% sát thương.", modifiers: { lifesteal: 20 }, bonusId: "demon-bloodpact-1" },
      { count: 3, description: "+40% Lifesteal, +20% ATK. HP dùng để kích hoạt kỹ năng được hút lại 100% từ địch.", modifiers: { lifesteal: 40, atk: 0.2 }, bonusId: "demon-bloodpact-2" },
    ],
  },
  {
    trait: "celestial",
    name: "Thiên Thần",
    description: "Phán xét thiêng liêng — khi đồng minh bị tấn công bởi kỹ năng Ultimate: Thiên Thần ngắt chuỗi và phản lại 50% MAG.",
    tiers: [
      { count: 2, description: "Khiên 15% HP đầu trận, +15% RES. Khi đồng minh nhận Ultimate địch: phản 50% MAG.", modifiers: { res: 0.15 }, bonusId: "celestial-counter-1" },
      { count: 3, description: "Khiên 30% HP, +30% RES. Khi đồng minh nhận Ultimate địch: phản 100% MAG + Stun địch 1 lượt.", modifiers: { res: 0.3 }, bonusId: "celestial-counter-2" },
    ],
  },
  {
    trait: "outlaw",
    name: "Băng Đảng",
    description: "Chơi bẩn — đầu trận Outlaw tiết lộ điểm yếu địch: mỗi địch có 1 chỉ số bị giảm 30% ngẫu nhiên.",
    tiers: [
      { count: 2, description: "Đầu trận: địch -20% DEF. Mỗi lần địch dùng kỹ năng, Outlaw +5% ACC (tối đa 3 lần).", modifiers: {}, bonusId: "outlaw-exploit-1" },
      { count: 3, description: "Đầu trận: địch -40% DEF. Khi Outlaw tấn công từ phía sau (kẻ địch đang bị debuff): +50% ATK đó.", modifiers: { crit: 20 }, bonusId: "outlaw-exploit-2" },
    ],
  },
  // ── NEW ORIGINS ──────────────────────────────────────────────
  {
    trait: "phantom",
    name: "Huyễn Ma",
    description: "Bóng ma — khi đồng minh chết, Huyễn Ma thoát xác vào bóng tối: vô hình 1 lượt và tích lũy EVA vĩnh viễn.",
    tiers: [
      {
        count: 2,
        description: "+25% EVA. Khi đồng minh chết: +10 EVA vĩnh viễn. Khi né thành công: +15 năng lượng.",
        modifiers: { eva: 25 },
        bonusId: "phantom-deathstep-1",
      },
      {
        count: 3,
        description: "+50% EVA. Khi đồng minh chết: +20 EVA + vô hình 1 lượt. Mỗi lần né: phản đòn 80% ATK chân thực.",
        modifiers: { eva: 50 },
        bonusId: "phantom-deathstep-2",
      },
    ],
  },
  {
    trait: "plague",
    name: "Dịch Hạch",
    description: "Lây lan — mỗi lượt, Độc/Bỏng lan thêm 1 địch ngẫu nhiên. Địch chết trong trạng thái nhiễm độc nổ gây sát thương thật.",
    tiers: [
      {
        count: 2,
        description: "+20% MAG. Độc/Bỏng lan sang 1 địch ngẫu nhiên mỗi lượt. Địch chết trong độc: nổ 10% HP tối đa lên tất cả.",
        modifiers: { mag: 0.2 },
        bonusId: "plague-pandemic-1",
      },
      {
        count: 3,
        description: "+40% MAG. Độc/Bỏng lan toàn bộ địch. Địch chết trong độc: nổ 20% HP + Dịch Hạch lây tiếp đội địch vô thời hạn.",
        modifiers: { mag: 0.4 },
        bonusId: "plague-pandemic-2",
      },
    ],
  },
  {
    trait: "storm",
    name: "Phong Bão",
    description: "Cơn bão tích điện — SPD cộng dồn mỗi lượt. Khi đạt đỉnh, giải phóng Sấm Sét: Stun toàn bộ địch 1 lượt.",
    tiers: [
      {
        count: 2,
        description: "+20% SPD, +15% ACC. Mỗi lượt: +3% SPD (tích đến 10 lần). Khi đủ 10 lần: Stun toàn địch 1 lượt.",
        modifiers: { spd: 0.2, acc: 15 },
        bonusId: "storm-discharge-1",
      },
      {
        count: 3,
        description: "+40% SPD, +25% ACC. Mỗi lượt: +5% SPD (tích đến 15 lần). Stun hồi lại sau 3 lượt. Đánh thường tấn công 2 địch.",
        modifiers: { spd: 0.4, acc: 25 },
        bonusId: "storm-discharge-2",
      },
    ],
  },
]

export const SYNERGY_BY_TRAIT: Record<Trait, SynergyDefinition> = SYNERGIES.reduce(
  (acc, s) => {
    acc[s.trait] = s
    return acc
  },
  {} as Record<Trait, SynergyDefinition>,
)
