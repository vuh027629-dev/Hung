"use client"

import { useGameSelector } from "@/lib/game/store"
import { checkObjectiveCompletion } from "@/lib/game/quests"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Swords, Sparkles, ShoppingBag, Backpack,
  Users, Brain, Scroll, Feather, Skull, Castle, CalendarDays,
} from "lucide-react"
import { Header } from "./header"
import { BattleTab } from "./tabs/battle-tab"
import { RecruitTab } from "./tabs/recruit-tab"
import { ShopTab } from "./tabs/shop-tab"
import { InventoryTab } from "./tabs/inventory-tab"
import { HeroesTab } from "./tabs/heroes-tab"
import { StatsTab } from "./tabs/stats-tab"
import { QuestTab } from "./tabs/quest-tab"
import { BlessingPactTab } from "./tabs/blessing-pact-tab"
import { RaidTab } from "./tabs/raid-tab"
import { TowerTab } from "./tabs/tower-tab"
import { EventTab } from "./tabs/event-tab"
import { CombatScreen } from "./combat-screen"

export function GameShell() {
  const statPoints = useGameSelector(s => s.statPoints)
  const skillPoints = useGameSelector(s => s.skillPoints)
  const towerState = useGameSelector(s => s.towerState)
  const activeEvents = useGameSelector(s => s.activeEvents ?? [])
  const hasCombat = useGameSelector(s => !!s.combat)
  const claimableCount = useGameSelector(s => {
    const qs = s.questState
    return qs
      ? (qs.active ?? []).filter(q => !q.completed && checkObjectiveCompletion(q.objective, s, qs)).length
      : 0
  })

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 mx-auto max-w-7xl w-full px-3 sm:px-4 py-4">
        <Tabs defaultValue="battle" className="space-y-4">
          <TabsList className="flex flex-wrap justify-start h-auto gap-1 bg-card/60 ornate-border p-1">
            <TabsTrigger value="battle" className="font-fantasy">
              <Swords className="size-4 mr-1" />
              Chiến Đấu
            </TabsTrigger>
            <TabsTrigger value="recruit" className="font-fantasy">
              <Sparkles className="size-4 mr-1" />
              Triệu Hồi
            </TabsTrigger>
            <TabsTrigger value="shop" className="font-fantasy">
              <ShoppingBag className="size-4 mr-1" />
              Cửa Hàng
            </TabsTrigger>
            <TabsTrigger value="inventory" className="font-fantasy">
              <Backpack className="size-4 mr-1" />
              Kho Đồ
            </TabsTrigger>
            <TabsTrigger value="heroes" className="font-fantasy">
              <Users className="size-4 mr-1" />
              Anh Hùng
            </TabsTrigger>
            <TabsTrigger value="stats" className="font-fantasy">
              <Brain className="size-4 mr-1" />
              Chỉ Số & Kỹ Năng
              {(statPoints > 0 || skillPoints > 0) && (
                <span className="ml-1 text-[9px] bg-primary text-primary-foreground rounded-full px-1.5">!</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="quests" className="font-fantasy">
              <Scroll className="size-4 mr-1" />
              Nhiệm Vụ
              {claimableCount > 0 && (
                <span className="ml-1 text-[9px] bg-green-500 text-white rounded-full px-1.5 animate-pulse">
                  {claimableCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="blessings" className="font-fantasy">
              <Feather className="size-4 mr-1 text-sky-300" />
              Phúc & Kèo
            </TabsTrigger>
            <TabsTrigger value="raid" className="font-fantasy">
              <Skull className="size-4 mr-1 text-red-400" />
              Raid Boss
            </TabsTrigger>
            <TabsTrigger value="tower" className="font-fantasy">
              <Castle className="size-4 mr-1 text-violet-400" />
              Tháp Vô Cực
              {towerState && (
                <span className="ml-1 text-[9px] bg-orange-500 text-white rounded-full px-1.5 animate-pulse">
                  {towerState!.floor}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="font-fantasy">
              <CalendarDays className="size-4 mr-1 text-amber-400" />
              Sự Kiện
              {activeEvents.length > 0 && (
                <span className="ml-1 text-[9px] bg-red-500 text-white rounded-full px-1.5 animate-pulse">
                  {activeEvents.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="battle"><div className="tab-bg-base tab-bg-battle p-4"><BattleTab /></div></TabsContent>
          <TabsContent value="recruit"><div className="tab-bg-base tab-bg-recruit p-4"><RecruitTab /></div></TabsContent>
          <TabsContent value="shop"><div className="tab-bg-base tab-bg-shop p-4"><ShopTab /></div></TabsContent>
          <TabsContent value="inventory"><div className="tab-bg-base tab-bg-inventory p-4"><InventoryTab /></div></TabsContent>
          <TabsContent value="heroes"><div className="tab-bg-base tab-bg-heroes p-4"><HeroesTab /></div></TabsContent>
          <TabsContent value="stats"><div className="tab-bg-base tab-bg-stats p-4"><StatsTab /></div></TabsContent>
          <TabsContent value="quests"><div className="tab-bg-base tab-bg-quests p-4"><QuestTab /></div></TabsContent>
          <TabsContent value="blessings"><div className="tab-bg-base tab-bg-blessings p-4"><BlessingPactTab /></div></TabsContent>
          <TabsContent value="raid"><div className="tab-bg-base tab-bg-raid p-4"><RaidTab /></div></TabsContent>
          <TabsContent value="tower"><div className="tab-bg-base tab-bg-tower p-4"><TowerTab /></div></TabsContent>
          <TabsContent value="events"><div className="tab-bg-base tab-bg-quests p-4"><EventTab /></div></TabsContent>
        </Tabs>
      </div>

      {hasCombat && <CombatScreen />}

      <footer className="mx-auto max-w-7xl w-full px-4 py-4 text-center text-[10px] text-muted-foreground">
        AETHERIA — Fantasy Turn-Based Saga · Auto-save local · Cloud Save qua tài khoản
      </footer>
    </main>
  )
}
