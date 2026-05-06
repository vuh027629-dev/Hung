import { GameProvider } from "@/lib/game/store"
import { GameShell } from "@/components/game/game-shell"

export default function Page() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  )
}
