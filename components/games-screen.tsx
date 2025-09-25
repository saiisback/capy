"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { StarIcon, TargetIcon, RunningIcon, PuzzleIcon, GameControllerIcon } from "./ui/icons"

interface GameState {
  score: number
  timeLeft: number
  isPlaying: boolean
  gameOver: boolean
}

export default function GamesScreen() {
  const { account, loading, claimGameReward } = useWallet()
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: 30,
    isPlaying: false,
    gameOver: false
  })
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [claimingReward, setClaimingReward] = useState(false)
  const [rewardError, setRewardError] = useState<string | null>(null)

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

  const startGame = (gameType: string) => {
    setSelectedGame(gameType)
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
  }

  const resetGame = () => {
    setSelectedGame(null)
    setGameState({
      score: 0,
      timeLeft: 30,
      isPlaying: false,
      gameOver: false
    })
    setRewardClaimed(false)
    setRewardError(null)
  }

  const handleClaimReward = async () => {
    if (!selectedGame || rewardClaimed) return
    
    try {
      setClaimingReward(true)
      setRewardError(null)
      
      // Call the blockchain function to claim reward
      await claimGameReward(selectedGame, gameState.score)
      
      setRewardClaimed(true)
      
    } catch (error) {
      console.error('Failed to claim reward:', error)
      setRewardError(error instanceof Error ? error.message : 'Failed to claim reward')
    } finally {
      setClaimingReward(false)
    }
  }

  const calculateRewardAmount = (score: number): number => {
    // Match the smart contract logic: 1 APT per 10 points, max 10 APT, min 1 APT
    const baseReward = Math.floor(score / 10)
    if (baseReward > 10) return 10
    if (baseReward < 1) return 1
    return baseReward
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

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="font-pixel text-4xl text-foreground mb-4">🎮 Arcade Games</h1>
          <p className="text-muted-foreground mb-8">Please connect your wallet to play games</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <GameControllerIcon size={32} className="text-primary" />
            <h1 className="font-pixel text-4xl text-foreground">🎮 ARCADE GAMES</h1>
            <GameControllerIcon size={32} className="text-primary" />
          </div>
          <p className="text-muted-foreground">Play games to earn points and make your pet happy!</p>
        </div>

        {!selectedGame ? (
          /* Game Selection */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Target Practice */}
            <div className="retro-panel p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => startGame('target')}>
              <TargetIcon size={48} className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-pixel text-xl text-foreground mb-2">Target Practice</h3>
              <p className="text-muted-foreground text-sm mb-4">Click on targets to score points!</p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <StarIcon size={16} />
                <span>Click targets to win</span>
              </div>
            </div>

            {/* Chase Game */}
            <div className="retro-panel p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => startGame('chase')}>
              <RunningIcon size={48} className="text-secondary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-pixel text-xl text-foreground mb-2">Chase Game</h3>
              <p className="text-muted-foreground text-sm mb-4">Help the cat catch the mouse!</p>
              <div className="flex items-center justify-center gap-2 text-sm text-secondary">
                <StarIcon size={16} />
                <span>Click to move mouse</span>
              </div>
            </div>

            {/* Puzzle Game */}
            <div className="retro-panel p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => startGame('puzzle')}>
              <PuzzleIcon size={48} className="text-accent mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-pixel text-xl text-foreground mb-2">Puzzle Time</h3>
              <p className="text-muted-foreground text-sm mb-4">Arrange the numbers in order!</p>
              <div className="flex items-center justify-center gap-2 text-sm text-accent">
                <StarIcon size={16} />
                <span>Slide pieces to solve</span>
              </div>
            </div>
          </div>
        ) : (
          /* Game Play Area */
          <div className="retro-panel p-8">
            {/* Game Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={resetGame}
                  className="retro-button bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2"
                >
                  ← Back to Games
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
                  <div className="bg-background border-2 border-foreground p-8 text-center rounded-lg max-w-md">
                    <div className="font-pixel text-3xl text-foreground mb-4">
                      {gameState.score > 50 ? '🎉 Great Job!' : '😊 Good Try!'}
                    </div>
                    <div className="text-xl text-muted-foreground mb-4">
                      Final Score: <span className="font-bold text-primary">{gameState.score}</span>
                    </div>
                    
                    {/* Reward Information */}
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <StarIcon size={16} className="text-primary" />
                        <span className="font-pixel text-sm text-primary">REWARD AVAILABLE</span>
                        <StarIcon size={16} className="text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-primary mb-1">
                        {calculateRewardAmount(gameState.score)} APT
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {gameState.score >= 10 ? 
                          `${Math.floor(gameState.score / 10)} points earned the reward!` : 
                          'Minimum 1 APT reward guaranteed!'}
                      </div>
                    </div>

                    {/* Claim Button or Status */}
                    {!rewardClaimed ? (
                      <div className="space-y-3">
                        <button
                          onClick={handleClaimReward}
                          disabled={claimingReward || loading}
                          className="retro-button bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full py-3 flex items-center justify-center gap-2"
                        >
                          {claimingReward ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              CLAIMING...
                            </>
                          ) : (
                            <>
                              🪙 CLAIM {calculateRewardAmount(gameState.score)} APT
                            </>
                          )}
                        </button>
                        
                        {rewardError && (
                          <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded p-2">
                            ❌ {rewardError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
                          <StarIcon size={16} />
                          <span className="font-pixel text-sm">REWARD CLAIMED!</span>
                          <StarIcon size={16} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {calculateRewardAmount(gameState.score)} APT has been added to your wallet
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={resetGame}
                      className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 mt-4"
                    >
                      {rewardClaimed ? 'Play Again' : 'Skip Reward & Play Again'}
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
        )}
      </div>
    </div>
  )
}
