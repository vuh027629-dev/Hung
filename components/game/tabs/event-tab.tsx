"use client"

import { useGameSelector } from "@/lib/game/store"
import { GAME_EVENTS } from "@/lib/game/store"
import type { GameEventId } from "@/lib/game/types"

// Event rarity color mappings
const RARITY_COLORS: Record<string, string> = {
  uncommon: "from-green-900/60 to-green-800/30 border-green-500/40",
  rare:     "from-blue-900/60 to-blue-800/30 border-blue-500/40",
  epic:     "from-purple-900/60 to-purple-800/30 border-purple-500/40",
}
const RARITY_BADGE: Record<string, string> = {
  uncommon: "bg-green-700/80 text-green-200",
  rare:     "bg-blue-700/80 text-blue-200",
  epic:     "bg-purple-700/80 text-purple-200",
}
const RARITY_LABEL_VI: Record<string, string> = {
  uncommon: "Hiếm",
  rare:     "Quý Hiếm",
  epic:     "Sử Thi",
}

// Detail descriptions for each event effect
const EVENT_EFFECTS: Record<GameEventId, { label: string; color: string }[]> = {
  blood_moon: [
    { label: "👹 Kẻ địch +25% ATK & MAG", color: "text-red-300" },
    { label: "🛡️ Kẻ địch +25% DEF & RES", color: "text-orange-300" },
    { label: "❤️ Kẻ địch +25% HP tối đa", color: "text-rose-300" },
  ],
  war_economy: [
    { label: "🏪 Giá cửa hàng +25%", color: "text-yellow-300" },
    { label: "💫 Giá triệu hồi anh hùng +25%", color: "text-yellow-300" },
    { label: "💸 Tiền phạt khi thua +25%", color: "text-red-300" },
  ],
  black_market: [
    { label: "🕵️ Chợ đen xuất hiện trong bóng tối...", color: "text-gray-300" },
    { label: "📦 Hàng hóa đặc biệt sắp được cập nhật", color: "text-gray-400" },
    { label: "🔒 Tính năng đang phát triển", color: "text-gray-500" },
  ],
}

// Passive event chances info
const ALL_EVENT_CHANCES: { id: GameEventId; chance: string }[] = [
  { id: "blood_moon",  chance: "~4%" },
  { id: "war_economy", chance: "~4%" },
  { id: "black_market", chance: "~2%" },
]

export function EventTab() {
  const activeEvents = useGameSelector(s => s.activeEvents ?? [])
  const currentDay   = useGameSelector(s => s.currentDay ?? 1)
  const battlesWon   = useGameSelector(s => s.battlesWon)

  const battlesUntilNextDay = 5 - (battlesWon % 5)
  const hasEvents = activeEvents.length > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-fantasy font-bold text-amber-300 flex items-center gap-2">
            📅 Sự Kiện Hàng Ngày
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ngày {currentDay} · Còn {battlesUntilNextDay} trận đến ngày mới
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-card/60 border border-border/40 rounded-lg px-3 py-1.5">
          Mỗi ngày có <span className="text-amber-300 font-semibold">10%</span> xuất hiện sự kiện
        </div>
      </div>

      {/* Active events */}
      {hasEvents ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-amber-200 flex items-center gap-1.5">
            <span className="animate-pulse">🔥</span>
            Sự kiện đang diễn ra hôm nay ({activeEvents.length})
          </p>
          {activeEvents.map(ae => {
            const ev = GAME_EVENTS[ae.eventId]
            const effects = EVENT_EFFECTS[ae.eventId]
            const colors = RARITY_COLORS[ev.rarity]
            const badge  = RARITY_BADGE[ev.rarity]
            return (
              <div
                key={ae.eventId}
                className={`rounded-xl border bg-gradient-to-br ${colors} p-4 space-y-3 shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ev.icon}</span>
                    <div>
                      <div className="font-fantasy font-bold text-white leading-tight text-sm sm:text-base">
                        {ev.name}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badge}`}>
                        {RARITY_LABEL_VI[ev.rarity]}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground bg-black/30 rounded px-2 py-1">
                    Ngày {ae.dayRolled}
                  </div>
                </div>

                <p className="text-xs text-white/80 leading-relaxed">{ev.description}</p>

                <div className="space-y-1 pt-1 border-t border-white/10">
                  <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1">Hiệu ứng</p>
                  {effects.map((eff, i) => (
                    <div key={i} className={`text-xs font-medium ${eff.color} flex items-center gap-1.5`}>
                      <span>{eff.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border/30 bg-card/40 p-6 text-center space-y-2">
          <div className="text-3xl">🌙</div>
          <p className="text-sm font-semibold text-muted-foreground">Hôm nay bình yên</p>
          <p className="text-xs text-muted-foreground/70">Không có sự kiện nào diễn ra trong ngày hôm nay.</p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* Event Compendium */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">📖 Danh Sách Sự Kiện Có Thể Xuất Hiện</p>
        <div className="grid gap-3">
          {ALL_EVENT_CHANCES.map(({ id, chance }) => {
            const ev = GAME_EVENTS[id]
            const effects = EVENT_EFFECTS[id]
            const isActive = activeEvents.some(ae => ae.eventId === id)
            const badge = RARITY_BADGE[ev.rarity]
            return (
              <div
                key={id}
                className={`rounded-lg border p-3 space-y-2 transition-all ${
                  isActive
                    ? "border-amber-500/50 bg-amber-900/20"
                    : "border-border/30 bg-card/30 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ev.icon}</span>
                    <span className="text-xs font-fantasy font-semibold text-white/90">{ev.name}</span>
                    {isActive && (
                      <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                        ĐANG DIỄN RA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${badge}`}>
                      {RARITY_LABEL_VI[ev.rarity]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Tỉ lệ: <span className="text-amber-300">{chance}</span></span>
                  </div>
                </div>
                <div className="space-y-0.5 pl-7">
                  {effects.map((eff, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground/80">{eff.label}</p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Probability info */}
      <div className="rounded-lg border border-border/20 bg-card/20 p-3 text-[10px] text-muted-foreground space-y-1">
        <p className="font-semibold text-white/60">ℹ️ Cơ chế xác suất</p>
        <p>• Mỗi ngày mới (sau 5 trận) có <span className="text-amber-300">10%</span> để xuất hiện ít nhất 1 sự kiện.</p>
        <p>• Nếu có sự kiện đầu tiên, tiếp tục có <span className="text-amber-300">10%</span> để xuất hiện thêm sự kiện thứ 2 (khác loại).</p>
        <p>• Trọng số: Trăng Máu 40% · Chiến Tranh 40% · Chợ Đen 20%.</p>
        <p>• Nhiều sự kiện có thể diễn ra cùng lúc, nhưng không thể trùng nhau.</p>
      </div>
    </div>
  )
}
