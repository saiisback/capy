"use client"

import Image from "next/image"
import { useWallet } from "@/contexts/wallet-context"
import { WalletIcon, StarIcon, GameControllerIcon, HeartIcon, PetIcon } from "./ui/icons"

export default function WelcomeScreen() {
  const { connect, disconnect, account, loading, error } = useWallet()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pixel-grid"> 
      <div className="text-center max-w-2xl flex flex-col items-center justify-center">
        {/* CAPY Title with enhanced styling */}
        <div className="mb-8">
          <h1 className="font-pixel text-5xl md:text-7xl text-foreground tracking-wider mb-4">
            CAPY
          </h1>
          <div className="flex justify-center items-center gap-2">
            <StarIcon size={20} className="text-primary" />
            <StarIcon size={16} className="text-secondary" />
            <StarIcon size={20} className="text-primary" />
          </div>
        </div>
        
        {/* Enhanced Cat Sprites Display */}
        <div className="flex justify-center items-center gap-8 mb-20">
          <div className="relative group">
            <div className="absolute -inset-2 bg-primary/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Image
              src="/catidle.gif"
              alt="Animated Idle Cat"
              width={64}
              height={64}
              className="pixelated-image relative p-1 z-10 bg-foreground rounded-full"
              style={{ 
                imageRendering: 'pixelated',
                transform: 'scale(3)',
              }}
            />
          </div>
        </div>
        
        {/* Enhanced Subtitle */}
        <div className="mb-10">
          <p className="font-nunito text-lg md:text-xl text-foreground leading-relaxed mb-4">
            Adopt a pixel pet with your favorite person
          </p>
          <div className="flex justify-center items-center gap-4 text-sm text-foreground">
            <span className="flex items-center gap-1 font-nunito">
              <StarIcon size={16} className="text-primary" />
              Blockchain Powered
            </span>
            <span className="font-pixel text-xs text-muted-foreground">•</span>
            <span className="flex items-center gap-1 font-nunito">
              <GameControllerIcon size={16} className="text-accent" />
              Retro Gaming
            </span>
            <span className="font-pixel text-xs text-muted-foreground">•</span>
            <span className="flex items-center gap-1 font-nunito">
              <HeartIcon size={16} className="text-secondary" />
              Shared Love
            </span>
          </div>
        </div>
        
        {/* Enhanced Connect Wallet Button */}
        <div className="space-y-4 mb-10">
          {account ? (
            <div className="space-y-4">
              <div className="retro-panel p-4 bg-primary/10 border border-primary/20 max-w-md mx-auto">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <WalletIcon size={16} className="text-primary" />
                    <span className="font-nunito text-sm text-primary font-semibold">Wallet Connected</span>
                  </div>
                  <p className="font-mono text-xs text-primary/70">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3 flex items-center gap-3 group transition-all duration-200"
                >
                  <PetIcon size={20} className="group-hover:animate-pulse" />
                  🎮 PLAY
                </button>
                <button
                  onClick={disconnect}
                  className="retro-button bg-muted text-muted-foreground hover:bg-muted/80 text-lg px-8 py-3 flex items-center gap-3 group transition-all duration-200"
                >
                  <WalletIcon size={20} className="group-hover:animate-pulse" />
                  LOGOUT
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={loading}
              className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-lg px-10 py-3 flex items-center gap-3 group transition-all duration-200"
            >
              <WalletIcon size={20} className="group-hover:animate-pulse" />
              {loading ? 'Connecting...' : 'Connect Petra Wallet'}
            </button>
          )}
          
          {error && (
            <div className="retro-panel p-4 bg-destructive text-destructive-foreground max-w-md mx-auto">
              <p className="font-nunito text-sm">{error}</p>
            </div>
          )}
        </div>
        
        {/* Enhanced decorative elements */}
        <div className="mt-10 flex justify-center">
          <div className="retro-panel p-6 max-w-sm">
            <div className="font-pixel text-xs text-card-foreground mb-3">
              ★ FEATURES ★
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-nunito text-card-foreground">
              <div className="flex items-center gap-2">
                <StarIcon size={12} className="text-primary" />
                <span>Pixel Perfect</span>
              </div>
              <div className="flex items-center gap-2">
                <StarIcon size={12} className="text-secondary" />
                <span>Co-Parenting</span>
              </div>
              <div className="flex items-center gap-2">
                <StarIcon size={12} className="text-accent" />
                <span>Arcade Games</span>
              </div>
              <div className="flex items-center gap-2">
                <StarIcon size={12} className="text-primary" />
                <span>Blockchain</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
