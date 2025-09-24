"use client"

import Image from "next/image"

interface WelcomeScreenProps {
  onWalletConnect: () => void
}

export default function WelcomeScreen({ onWalletConnect }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        {/* CAPY Title */}
        <h1 className="font-pixel text-6xl md:text-8xl text-foreground mb-8 tracking-wider">
          CAPY
        </h1>
        
        {/* Cat Sprites Display */}
        <div className="flex justify-center items-center gap-8 mb-8">
          <div className="relative">
            <Image
              src="/CatPackFree/Idle.png"
              alt="Idle Cat"
              width={64}
              height={64}
              className="pixelated-image"
              style={{ 
                imageRendering: 'pixelated',
                transform: 'scale(3)',
              }}
            />
          </div>
          <div className="relative">
            <Image
              src="/CatPackPaid/Sprites/Classical/Individual/Idle.png"
              alt="Idle Cat 2"
              width={64}
              height={64}
              className="pixelated-image"
              style={{ 
                imageRendering: 'pixelated',
                transform: 'scale(3)',
              }}
            />
          </div>
          <div className="relative">
            <Image
              src="/CatPackPaid/Sprites/Classical/Individual/Excited.png"
              alt="Excited Cat"
              width={64}
              height={64}
              className="pixelated-image"
              style={{ 
                imageRendering: 'pixelated',
                transform: 'scale(3)',
              }}
            />
          </div>
        </div>
        
        {/* Subtitle */}
        <p className="font-nunito text-xl md:text-2xl text-foreground mb-12 leading-relaxed">
          Adopt a pixel pet with your favorite person
        </p>
        
        {/* Connect Wallet Button */}
        <button
          onClick={onWalletConnect}
          className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-4"
        >
          Connect Aptos Wallet
        </button>
        
        {/* Decorative elements */}
        <div className="mt-16 text-center">
          <div className="font-pixel text-xs text-muted-foreground">
            ★ POWERED BY BLOCKCHAIN ★
          </div>
        </div>
      </div>
    </div>
  )
}
