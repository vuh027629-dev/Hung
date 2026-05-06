import type { Metadata, Viewport } from "next"
import { Cinzel, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Aetheria — Fantasy Turn-Based Saga",
  description:
    "Triệu hồi anh hùng, đào cổ vật, build đội hình tộc hệ và chinh phục các tầng tháp trong RPG fantasy theo lượt.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1a1530",
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`dark ${inter.variable} ${cinzel.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
