import type React from "react"
import type { Metadata } from "next"
import { Press_Start_2P, Nunito } from "next/font/google"
import "./globals.css"

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-press-start",
  display: "swap",
})

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
})

export const metadata: Metadata = {
  title: "CAPY - Virtual Pet DApp",
  description: "Adopt a pixel pet with your favorite person",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${nunito.style.fontFamily};
  --font-press-start: ${pressStart2P.variable};
  --font-nunito: ${nunito.variable};
}
        `}</style>
      </head>
      <body className={`${pressStart2P.variable} ${nunito.variable} font-nunito`}>{children}</body>
    </html>
  )
}
