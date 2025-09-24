"use client"

import { useState } from "react"
import Image from "next/image"

export default function DashboardScreen() {
  const [happiness, setHappiness] = useState(75)
  const [petState, setPetState] = useState("Idle")
  const [diaryEntries, setDiaryEntries] = useState([
    { id: 1, action: "🍖", text: "Fed at 2:30 PM", time: "14:30" },
    { id: 2, action: "❤️", text: "Showed love at 1:15 PM", time: "13:15" },
    { id: 3, action: "🎮", text: "Played arcade game at 12:45 PM", time: "12:45" },
  ])

  const handleFeed = () => {
    setHappiness(Math.min(100, happiness + 15))
    setPetState("Eating")
    const newEntry = {
      id: Date.now(),
      action: "🍖",
      text: `Fed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setDiaryEntries([newEntry, ...diaryEntries.slice(0, 4)])
    
    // Reset to idle after 2 seconds
    setTimeout(() => setPetState("Idle"), 2000)
  }

  const handleShowLove = () => {
    setHappiness(Math.min(100, happiness + 10))
    setPetState("Excited")
    const newEntry = {
      id: Date.now(),
      action: "❤️",
      text: `Showed love at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setDiaryEntries([newEntry, ...diaryEntries.slice(0, 4)])
    
    // Reset to idle after 2 seconds
    setTimeout(() => setPetState("Idle"), 2000)
  }

  const getPetSprite = () => {
    switch (petState) {
      case "Eating":
        return "/CatPackPaid/Sprites/Classical/Individual/Eating.png"
      case "Excited":
        return "/CatPackPaid/Sprites/Classical/Individual/Excited.png"
      default:
        return "/CatPackPaid/Sprites/Classical/Individual/Idle.png"
    }
  }

  return (
    <div className="min-h-screen pixel-grid p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-pixel text-3xl md:text-4xl text-foreground">
            YOUR CAPY PET
          </h1>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: Pet's Room */}
          <div className="retro-panel p-8 min-h-96">
            <h2 className="font-pixel text-lg text-card-foreground mb-6 text-center">
              PET ROOM
            </h2>
            
            {/* Pet Display */}
            <div className="flex flex-col items-center justify-center h-64 relative">
              {/* Room Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/20 rounded-lg"></div>
              
              {/* Pet Sprite */}
              <div className="relative z-10 mb-4">
                <Image
                  src={getPetSprite()}
                  alt="Pet"
                  width={64}
                  height={64}
                  style={{ 
                    imageRendering: 'pixelated',
                    transform: 'scale(6)',
                  }}
                />
              </div>
              
              {/* Pet Status */}
              <div className="text-center">
                <p className="font-nunito text-sm text-card-foreground mb-2">
                  {petState}
                </p>
              </div>
            </div>
            
            {/* Happiness Meter */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-nunito text-sm font-semibold text-card-foreground">
                  Happiness
                </span>
                <span className="font-nunito text-sm text-card-foreground">
                  {happiness}%
                </span>
              </div>
              <div className="retro-progress">
                <div 
                  className="retro-progress-fill transition-all duration-500"
                  style={{ width: `${happiness}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Column 2: UI & Action Panels */}
          <div className="space-y-6">
            
            {/* Actions Panel */}
            <div className="retro-panel p-6">
              <h3 className="font-pixel text-md text-card-foreground mb-4">
                ACTIONS
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={handleFeed}
                  className="retro-button bg-secondary text-secondary-foreground hover:bg-secondary/90 flex-1"
                >
                  FEED
                </button>
                <button
                  onClick={handleShowLove}
                  className="retro-button bg-accent text-accent-foreground hover:bg-accent/90 flex-1"
                >
                  SHOW LOVE
                </button>
              </div>
            </div>

            {/* Arcade Panel */}
            <div className="retro-panel p-6">
              <h3 className="font-pixel text-md text-card-foreground mb-4">
                ARCADE
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 hover:bg-card-foreground/10 transition-colors">
                  <span className="text-lg">🎯</span>
                  <span className="font-nunito text-sm text-card-foreground">Target Practice</span>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-card-foreground/10 transition-colors">
                  <span className="text-lg">🏃</span>
                  <span className="font-nunito text-sm text-card-foreground">Chase Game</span>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-card-foreground/10 transition-colors">
                  <span className="text-lg">🧩</span>
                  <span className="font-nunito text-sm text-card-foreground">Puzzle Time</span>
                </div>
              </div>
            </div>

            {/* Pet Diary Panel */}
            <div className="retro-panel p-6">
              <h3 className="font-pixel text-md text-card-foreground mb-4">
                PET DIARY
              </h3>
              <div className="space-y-2 font-mono text-xs">
                {diaryEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-center gap-2 text-card-foreground"
                  >
                    <span className="text-sm">{entry.action}</span>
                    <span className="flex-1">{entry.text}</span>
                    <span className="text-card-foreground/70">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
