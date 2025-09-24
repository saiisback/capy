"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { useWallet } from "@/contexts/wallet-context"
import { shortenAddress, getAccountTypeColor } from "@/lib/wallet"
import { 
  FoodIcon, 
  HeartIcon, 
  GameControllerIcon, 
  TargetIcon, 
  RunningIcon, 
  PuzzleIcon, 
  PetIcon, 
  ClockIcon, 
  StarIcon,
  WalletIcon,
  ShoppingCartIcon
} from "./ui/icons"

export default function DashboardScreen() {
  const { 
    account, 
    coParent, 
    coParentPair, 
    feedPet, 
    showLoveToPet, 
    loading 
  } = useWallet()
  const [happiness, setHappiness] = useState(75)
  const [petState, setPetState] = useState("Idle")
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gameState, setGameState] = useState({
    score: 0,
    timeLeft: 30,
    isPlaying: false,
    gameOver: false
  })

  // Target Practice Game
  const [targets, setTargets] = useState<Array<{id: number, x: number, y: number, size: number}>>([])
  const [targetsHit, setTargetsHit] = useState(0)

  // Chase Game
  const [catPosition, setCatPosition] = useState({ x: 50, y: 50 })
  const [mousePosition, setMousePosition] = useState({ x: 200, y: 200 })
  const [catSpeed, setCatSpeed] = useState(2)

  // Puzzle Game
  const [puzzlePieces, setPuzzlePieces] = useState<number[]>([])
  const [puzzleSolved, setPuzzleSolved] = useState(false)
  const [diaryEntries, setDiaryEntries] = useState([
    { id: 1, action: "feed", text: `Fed by ${shortenAddress(account?.address || 'Guest')} at 2:30 PM`, time: "14:30" },
    { id: 2, action: "love", text: `Loved by ${shortenAddress(coParent?.address || 'Co-parent')} at 1:15 PM`, time: "13:15" },
    { id: 3, action: "game", text: `${shortenAddress(account?.address || 'Guest')} played arcade game at 12:45 PM`, time: "12:45" },
  ])

  const handleFeed = async () => {
    setHappiness(Math.min(100, happiness + 15))
    setPetState("Eating")
    
    const newEntry = {
      id: Date.now(),
      action: "feed",
      text: `Fed by ${shortenAddress(account?.address || '')} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setDiaryEntries([newEntry, ...diaryEntries.slice(0, 4)])
    
    // Call blockchain function
    await feedPet()
    
    // Reset to idle after 2 seconds
    setTimeout(() => setPetState("Idle"), 2000)
  }

  const handleShowLove = async () => {
    setHappiness(Math.min(100, happiness + 10))
    setPetState("Excited")
    
    const newEntry = {
      id: Date.now(),
      action: "love",
      text: `Loved by ${shortenAddress(account?.address || '')} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setDiaryEntries([newEntry, ...diaryEntries.slice(0, 4)])
    
    // Call blockchain function
    await showLoveToPet()
    
    // Reset to idle after 2 seconds
    setTimeout(() => setPetState("Idle"), 2000)
  }

  // Game Functions
  const startGame = (gameType: string) => {
    setSelectedGame(gameType)
    setShowGames(false)
    setGameState({
      score: 0,
      timeLeft: 30,
      isPlaying: true,
      gameOver: false
    })
    
    if (gameType === 'target') {
      setTargets([])
      setTargetsHit(0)
      generateTargets()
    } else if (gameType === 'chase') {
      setCatPosition({ x: 50, y: 50 })
      setMousePosition({ x: 200, y: 200 })
      setCatSpeed(2)
    } else if (gameType === 'puzzle') {
      setPuzzlePieces([1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5))
      setPuzzleSolved(false)
    }
  }

  const endGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false, gameOver: true }))
    setHappiness(Math.min(100, happiness + 5))
  }

  const resetGame = () => {
    setSelectedGame(null)
    setGameState({
      score: 0,
      timeLeft: 30,
      isPlaying: false,
      gameOver: false
    })
  }

  // Target Practice Game Logic
  const generateTargets = () => {
    const newTargets = []
    for (let i = 0; i < 5; i++) {
      newTargets.push({
        id: i,
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
        size: Math.random() * 20 + 20
      })
    }
    setTargets(newTargets)
  }

  const hitTarget = (targetId: number) => {
    setTargets(prev => prev.filter(t => t.id !== targetId))
    setTargetsHit(prev => prev + 1)
    setGameState(prev => ({ ...prev, score: prev.score + 10 }))
    
    if (targets.length <= 1) {
      generateTargets()
    }
  }

  // Chase Game Logic
  const moveCat = useCallback(() => {
    if (selectedGame !== 'chase' || !gameState.isPlaying) return

    setCatPosition(prev => {
      const dx = mousePosition.x - prev.x
      const dy = mousePosition.y - prev.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 30) {
        // Mouse caught!
        setGameState(prev => ({ ...prev, score: prev.score + 5 }))
        setMousePosition({
          x: Math.random() * 300 + 50,
          y: Math.random() * 200 + 50
        })
        setCatSpeed(prev => Math.min(prev + 0.5, 5))
      }
      
      const newX = prev.x + (dx / distance) * catSpeed
      const newY = prev.y + (dy / distance) * catSpeed
      
      return {
        x: Math.max(20, Math.min(380, newX)),
        y: Math.max(20, Math.min(280, newY))
      }
    })
  }, [mousePosition, catSpeed, selectedGame, gameState.isPlaying])

  // Puzzle Game Logic
  const movePuzzlePiece = (index: number) => {
    if (selectedGame !== 'puzzle' || !gameState.isPlaying) return

    const emptyIndex = puzzlePieces.indexOf(9)
    const pieceIndex = puzzlePieces.indexOf(index + 1)
    
    // Check if piece is adjacent to empty space
    const isAdjacent = Math.abs(pieceIndex - emptyIndex) === 1 || 
                      Math.abs(pieceIndex - emptyIndex) === 3
    
    if (isAdjacent) {
      const newPieces = [...puzzlePieces]
      newPieces[pieceIndex] = 9
      newPieces[emptyIndex] = index + 1
      setPuzzlePieces(newPieces)
      
      // Check if puzzle is solved
      const isSolved = newPieces.every((piece, idx) => piece === idx + 1)
      if (isSolved) {
        setPuzzleSolved(true)
        setGameState(prev => ({ ...prev, score: prev.score + 100 }))
      }
    }
  }

  const getPetSprite = () => {
    switch (petState) {
      case "Eating":
        return "/CatPackPaid/Sprites/Classical/Individual/Eating.png"
      case "Excited":
        return "/CatPackPaid/Sprites/Classical/Individual/Excited.png"
      default:
        return "/catidle.gif"
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "feed":
        return <FoodIcon size={12} className="text-secondary" />
      case "love":
        return <HeartIcon size={12} className="text-primary" />
      case "game":
        return <GameControllerIcon size={12} className="text-accent" />
      default:
        return <StarIcon size={12} className="text-muted-foreground" />
    }
  }

  // Game Timer
  useEffect(() => {
    if (!gameState.isPlaying) return

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          endGame()
          return prev
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.isPlaying])

  // Chase Game Movement
  useEffect(() => {
    if (selectedGame === 'chase' && gameState.isPlaying) {
      const interval = setInterval(moveCat, 100)
      return () => clearInterval(interval)
    }
  }, [moveCat, selectedGame, gameState.isPlaying])

  return (
    <div className="min-h-screen pixel-grid p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <PetIcon size={32} className="text-primary" />
            <h1 className="font-pixel text-3xl md:text-4xl text-foreground">
              YOUR CAPY PET
            </h1>
            <PetIcon size={32} className="text-primary" />
          </div>
          <div className="w-full h-1 bg-primary/20"></div>
        </div>

        {/* Co-Parent Display */}
        <div className="mb-8">
          <div className="retro-panel p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <WalletIcon size={18} className="text-card-foreground" />
              <h2 className="font-pixel text-lg text-card-foreground">
                CO-PARENTS
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current User */}
              <div className="flex items-center gap-3 p-4 bg-card-foreground/5 border border-border">
                <div className="status-indicator status-online"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <WalletIcon size={14} className="text-primary" />
                    <span className="font-nunito text-sm font-semibold text-card-foreground">
                      You
                    </span>
                    <span className={`font-nunito text-xs ${getAccountTypeColor(account?.accountType || '')}`}>
                      {account?.accountType}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-card-foreground/70">
                    {shortenAddress(account?.address || '')}
                  </p>
                </div>
              </div>
              
              {/* Co-Parent */}
              <div className="flex items-center gap-3 p-4 bg-card-foreground/5 border border-border">
                <div className="status-indicator status-online"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <WalletIcon size={14} className="text-secondary" />
                    <span className="font-nunito text-sm font-semibold text-card-foreground">
                      Co-Parent
                    </span>
                    <span className={`font-nunito text-xs ${getAccountTypeColor(coParent?.accountType || '')}`}>
                      {coParent?.accountType || 'Ed25519'}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-card-foreground/70">
                    {shortenAddress(coParent?.address || '')}
                  </p>
                </div>
              </div>
            </div>
            
            {coParentPair && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-card-foreground/50">
                  <HeartIcon size={12} className="text-primary" />
                  <span className="font-nunito">
                    Pet created on {new Date(coParentPair.createdAt).toLocaleDateString()}
                  </span>
                  <HeartIcon size={12} className="text-primary" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: Enhanced Pet's Room */}
          <div className="retro-panel p-8 min-h-96">
            <div className="flex items-center justify-center gap-2 mb-6">
              <PetIcon size={20} className="text-card-foreground" />
              <h2 className="font-pixel text-lg text-card-foreground">
                PET ROOM
              </h2>
              <PetIcon size={20} className="text-card-foreground" />
            </div>
            
            {/* Enhanced Pet Display */}
            <div className="flex flex-col items-center justify-center h-64 relative group">
              {/* Room Background with enhanced styling */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/20 rounded-lg"></div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              
              {/* Pet Sprite with enhanced effects */}
              <div className="relative z-10 mb-4 group-hover:scale-105 transition-transform duration-300">
                <div className="absolute -inset-2 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image
                  src={getPetSprite()}
                  alt="Pet"
                  width={64}
                  height={64}
                  className="relative z-10"
                  style={{ 
                    imageRendering: 'pixelated',
                    transform: 'scale(6)',
                  }}
                />
              </div>
              
              {/* Enhanced Pet Status */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <StarIcon size={12} className="text-primary" />
                  <p className="font-nunito text-sm text-card-foreground font-semibold">
                    {petState}
                  </p>
                  <StarIcon size={12} className="text-primary" />
                </div>
                <div className="text-xs text-card-foreground/70 font-nunito">
                  {petState === "Idle" && "Ready for action!"}
                  {petState === "Eating" && "Nom nom nom..."}
                  {petState === "Excited" && "So happy!"}
                </div>
              </div>
            </div>
            
            {/* Enhanced Happiness Meter */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <HeartIcon size={16} className="text-primary" />
                  <span className="font-nunito text-sm font-semibold text-card-foreground">
                    Happiness
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-nunito text-sm text-card-foreground font-bold">
                    {happiness}%
                  </span>
                  <StarIcon size={12} className="text-primary" />
                </div>
              </div>
              <div className="retro-progress relative">
                <div 
                  className="retro-progress-fill transition-all duration-500 relative"
                  style={{ width: `${happiness}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-50"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-card-foreground/50 mt-1">
                <span>Sad</span>
                <span>Happy</span>
              </div>
            </div>
          </div>

          {/* Column 2: Enhanced UI & Action Panels */}
          <div className="space-y-6">
            
            {/* Enhanced Actions Panel */}
            <div className="retro-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <GameControllerIcon size={18} className="text-card-foreground" />
                <h3 className="font-pixel text-md text-card-foreground">
                  ACTIONS
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <button
                    onClick={handleFeed}
                    disabled={loading}
                    className="retro-button bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2 group transition-all duration-200"
                  >
                    <FoodIcon size={16} className="group-hover:animate-pulse" />
                    {loading ? 'FEEDING...' : 'FEED'}
                  </button>
                  <button
                    onClick={handleShowLove}
                    disabled={loading}
                    className="retro-button bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2 group transition-all duration-200"
                  >
                    <HeartIcon size={16} className="group-hover:animate-pulse" />
                    {loading ? 'LOVING...' : 'SHOW LOVE'}
                  </button>
                </div>
                
                <button
                  onClick={() => setShowMarketplace(true)}
                  className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 w-full flex items-center justify-center gap-2 group transition-all duration-200"
                >
                  <ShoppingCartIcon size={16} className="group-hover:animate-pulse" />
                  🛒 MARKETPLACE
                </button>
              </div>
            </div>

            {/* Enhanced Arcade Panel */}
            <div className="retro-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <GameControllerIcon size={18} className="text-card-foreground" />
                <h3 className="font-pixel text-md text-card-foreground">
                  ARCADE
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 hover:bg-card-foreground/10 transition-all duration-200 group cursor-pointer" onClick={() => startGame('target')}>
                  <TargetIcon size={16} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-nunito text-sm text-card-foreground flex-1">Target Practice</span>
                  <StarIcon size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-card-foreground/10 transition-all duration-200 group cursor-pointer" onClick={() => startGame('chase')}>
                  <RunningIcon size={16} className="text-secondary group-hover:scale-110 transition-transform" />
                  <span className="font-nunito text-sm text-card-foreground flex-1">Chase Game</span>
                  <StarIcon size={12} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-card-foreground/10 transition-all duration-200 group cursor-pointer" onClick={() => startGame('puzzle')}>
                  <PuzzleIcon size={16} className="text-accent group-hover:scale-110 transition-transform" />
                  <span className="font-nunito text-sm text-card-foreground flex-1">Puzzle Time</span>
                  <StarIcon size={12} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Enhanced Pet Diary Panel */}
            <div className="retro-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon size={18} className="text-card-foreground" />
                <h3 className="font-pixel text-md text-card-foreground">
                  PET DIARY
                </h3>
              </div>
              <div className="space-y-3 font-mono text-xs">
                {diaryEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-center gap-3 text-card-foreground p-2 hover:bg-card-foreground/5 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getActionIcon(entry.action)}
                    </div>
                    <span className="flex-1 font-nunito">{entry.text}</span>
                    <div className="flex items-center gap-1 text-card-foreground/70">
                      <ClockIcon size={10} />
                      <span>{entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Play Area */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border-2 border-foreground max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Game Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={resetGame}
                    className="retro-button bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2"
                  >
                    ← Back to Dashboard
                  </button>
                  <h2 className="font-pixel text-2xl text-foreground">
                    {selectedGame === 'target' && '🎯 Target Practice'}
                    {selectedGame === 'chase' && '🏃 Chase Game'}
                    {selectedGame === 'puzzle' && '🧩 Puzzle Time'}
                  </h2>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="font-pixel text-lg text-primary">Score</div>
                    <div className="font-nunito text-2xl font-bold">{gameState.score}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-pixel text-lg text-secondary">Time</div>
                    <div className="font-nunito text-2xl font-bold">{gameState.timeLeft}s</div>
                  </div>
                </div>
              </div>

              {/* Game Content */}
              <div className="relative">
                {selectedGame === 'target' && (
                  <div className="relative w-full h-64 bg-muted rounded-lg border-2 border-border overflow-hidden">
                    {targets.map(target => (
                      <button
                        key={target.id}
                        onClick={() => hitTarget(target.id)}
                        className="absolute bg-primary rounded-full hover:bg-primary/80 transition-colors"
                        style={{
                          left: target.x,
                          top: target.y,
                          width: target.size,
                          height: target.size,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    ))}
                    {targets.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="font-pixel text-2xl text-primary mb-2">🎯</div>
                          <div className="text-muted-foreground">Generating new targets...</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedGame === 'chase' && (
                  <div className="relative w-full h-64 bg-muted rounded-lg border-2 border-border overflow-hidden">
                    {/* Cat */}
                    <div
                      className="absolute bg-secondary rounded-full transition-all duration-100"
                      style={{
                        left: catPosition.x,
                        top: catPosition.y,
                        width: 20,
                        height: 20,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      🐱
                    </div>
                    
                    {/* Mouse */}
                    <button
                      onClick={() => {
                        setMousePosition({
                          x: Math.random() * 300 + 50,
                          y: Math.random() * 200 + 50
                        })
                      }}
                      className="absolute bg-accent rounded-full hover:bg-accent/80 transition-colors"
                      style={{
                        left: mousePosition.x,
                        top: mousePosition.y,
                        width: 15,
                        height: 15,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      🐭
                    </button>
                  </div>
                )}

                {selectedGame === 'puzzle' && (
                  <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-2 p-4 bg-muted rounded-lg">
                      {puzzlePieces.map((piece, index) => (
                        <button
                          key={index}
                          onClick={() => movePuzzlePiece(index)}
                          className={`w-16 h-16 flex items-center justify-center text-xl font-bold transition-colors ${
                            piece === 9 
                              ? 'bg-transparent' 
                              : 'bg-primary text-primary-foreground hover:bg-primary/80'
                          }`}
                          disabled={piece === 9}
                        >
                          {piece === 9 ? '' : piece}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Game Over Screen */}
                {gameState.gameOver && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="bg-background border-2 border-foreground p-8 text-center rounded-lg">
                      <div className="font-pixel text-3xl text-foreground mb-4">
                        {gameState.score > 50 ? '🎉 Great Job!' : '😊 Good Try!'}
                      </div>
                      <div className="text-xl text-muted-foreground mb-6">
                        Final Score: <span className="font-bold text-primary">{gameState.score}</span>
                      </div>
                      <button
                        onClick={resetGame}
                        className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2"
                      >
                        Play Again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Game Instructions */}
              <div className="mt-6 text-center">
                {selectedGame === 'target' && (
                  <p className="text-muted-foreground">
                    🎯 Click on the red targets to score points! Targets will respawn automatically.
                  </p>
                )}
                {selectedGame === 'chase' && (
                  <p className="text-muted-foreground">
                    🐱 Click on the mouse to move it away from the cat! The cat gets faster over time.
                  </p>
                )}
                {selectedGame === 'puzzle' && (
                  <p className="text-muted-foreground">
                    🧩 Click on numbers next to the empty space to slide them. Arrange 1-8 in order!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Modal */}
      {showMarketplace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border-2 border-foreground max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-pixel text-3xl text-foreground">🛒 Pet Marketplace</h2>
                <button
                  onClick={() => setShowMarketplace(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Food Items */}
                <div className="retro-panel p-4">
                  <h3 className="font-pixel text-lg text-foreground mb-4">🍽️ Food</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Premium Cat Food</span>
                      <span className="text-sm font-bold text-primary">5 APT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Deluxe Fish</span>
                      <span className="text-sm font-bold text-primary">8 APT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Special Treats</span>
                      <span className="text-sm font-bold text-primary">15 APT</span>
                    </div>
                  </div>
                </div>

                {/* Toys */}
                <div className="retro-panel p-4">
                  <h3 className="font-pixel text-lg text-foreground mb-4">🎾 Toys</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Blue Ball</span>
                      <span className="text-sm font-bold text-primary">3 APT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Mouse Toy</span>
                      <span className="text-sm font-bold text-primary">7 APT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Laser Pointer</span>
                      <span className="text-sm font-bold text-primary">12 APT</span>
                    </div>
                  </div>
                </div>

                {/* Furniture */}
                <div className="retro-panel p-4">
                  <h3 className="font-pixel text-lg text-foreground mb-4">🛏️ Furniture</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Blue Cat Bed</span>
                      <span className="text-sm font-bold text-primary">20 APT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Purple Cat Bed</span>
                      <span className="text-sm font-bold text-primary">35 APT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Cat Home</span>
                      <span className="text-sm font-bold text-primary">50 APT</span>
                    </div>
                  </div>
                </div>

                {/* Games */}
                <div className="retro-panel p-4">
                  <h3 className="font-pixel text-lg text-foreground mb-4">🎮 Games</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Puzzle Game</span>
                      <span className="text-sm font-bold text-primary">25 APT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Arcade Machine</span>
                      <span className="text-sm font-bold text-primary">75 APT</span>
                    </div>
                  </div>
                </div>

                {/* Decorations */}
                <div className="retro-panel p-4">
                  <h3 className="font-pixel text-lg text-foreground mb-4">🎨 Decorations</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Flower Pot</span>
                      <span className="text-sm font-bold text-primary">4 APT</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Wall Art</span>
                      <span className="text-sm font-bold text-primary">10 APT</span>
                    </div>
                  </div>
                </div>

                {/* Coming Soon */}
                <div className="retro-panel p-4">
                  <h3 className="font-pixel text-lg text-foreground mb-4">🚀 Coming Soon</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Magic Items</span>
                      <span className="text-sm font-bold text-muted-foreground">Soon</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">Rare Collectibles</span>
                      <span className="text-sm font-bold text-muted-foreground">Soon</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm mb-4">
                  💡 <strong>Coming Soon:</strong> Full marketplace with blockchain purchases, item ownership, and pet customization!
                </p>
                <button
                  onClick={() => setShowMarketplace(false)}
                  className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2"
                >
                  Close Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
