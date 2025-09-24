"use client"

import { useState } from "react"
import Image from "next/image"
import { useWallet } from "@/contexts/wallet-context"
import { MailIcon, WalletIcon, HeartIcon, LoadingDots } from "./ui/icons"

export default function InvitationScreen() {
  const { 
    sendInvitation, 
    acceptInvitation, 
    invitationSent, 
    loading, 
    error 
  } = useWallet()
  
  const [walletAddress, setWalletAddress] = useState("")
  
  const handleSendInvite = async () => {
    if (walletAddress.trim()) {
      await sendInvitation(walletAddress.trim())
      // Simulate the co-parent accepting the invitation after 3 seconds
      setTimeout(async () => {
        await acceptInvitation()
      }, 3000)
    }
  }

  if (invitationSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 pixel-grid">
        <div className="retro-panel max-w-lg w-full p-8 text-center">
          {/* Header with icon */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <MailIcon size={24} className="text-primary" />
            <h1 className="font-pixel text-2xl md:text-3xl text-card-foreground">
              INVITE SENT!
            </h1>
            <MailIcon size={24} className="text-primary" />
          </div>
          
          {/* Enhanced Animated Cat */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/10 rounded-lg animate-pulse"></div>
              <div className="relative animate-bounce">
                <Image
                  src="/CatPackPaid/Sprites/Classical/Individual/Waiting.png"
                  alt="Waiting Cat"
                  width={64}
                  height={64}
                  style={{ 
                    imageRendering: 'pixelated',
                    transform: 'scale(4)',
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Enhanced Waiting Message */}
          <div className="mb-8">
            <p className="font-nunito text-lg text-card-foreground leading-relaxed mb-4">
              Waiting for your co-parent to accept. We'll take you to your new pet as soon as they do!
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-card-foreground/70">
              <HeartIcon size={16} className="text-primary" />
              <span className="font-nunito">Your pet is ready to be born!</span>
              <HeartIcon size={16} className="text-primary" />
            </div>
          </div>
          
          {/* Enhanced Loading animation */}
          <div className="flex flex-col items-center gap-4">
            <LoadingDots className="text-card-foreground" />
            <div className="font-pixel text-xs text-card-foreground/50">
              BLOCKCHAIN CONFIRMING...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pixel-grid">
      <div className="retro-panel max-w-lg w-full p-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HeartIcon size={20} className="text-primary" />
            <h1 className="font-pixel text-2xl md:text-3xl text-card-foreground">
              INVITE YOUR CO-PARENT
            </h1>
            <HeartIcon size={20} className="text-primary" />
          </div>
          <div className="w-full h-1 bg-primary/20"></div>
        </div>
        
        {/* Enhanced Instruction */}
        <div className="mb-8 p-4 bg-card-foreground/5 border-2 border-border" style={{ borderStyle: 'solid' }}>
          <p className="font-nunito text-base text-card-foreground leading-relaxed">
            Your pet can only be minted once your co-parent accepts the on-chain invitation. 
            Enter their wallet address below to send the invite.
          </p>
        </div>
        
        {/* Enhanced Input Field */}
        <div className="mb-8">
          <label className="font-nunito text-sm font-semibold text-card-foreground block mb-3 flex items-center gap-2">
            <WalletIcon size={16} className="text-primary" />
            Wallet Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border-2 border-border bg-input text-foreground font-nunito text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
              style={{ borderStyle: 'solid' }}
            />
            {walletAddress && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Send Invite Button */}
        <button
          onClick={handleSendInvite}
          disabled={!walletAddress.trim() || loading}
          className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full text-lg py-4 flex items-center justify-center gap-3 group transition-all duration-200"
        >
          <MailIcon size={20} className="group-hover:animate-pulse" />
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
        
        {error && (
          <div className="mt-4 retro-panel p-4 bg-destructive text-destructive-foreground">
            <p className="font-nunito text-sm">{error}</p>
          </div>
        )}
        
        {/* Enhanced Decorative Elements */}
        <div className="mt-8 flex justify-center items-center gap-4">
          <Image
            src="/CatPackPaid/Sprites/Classical/Individual/Dance.png"
            alt="Dancing Cat"
            width={32}
            height={32}
            style={{ 
              imageRendering: 'pixelated',
              transform: 'scale(2)',
            }}
          />
          <div className="text-center">
            <div className="font-pixel text-xs text-card-foreground/50 mb-1">
              ★ READY TO CONNECT ★
            </div>
            <div className="flex items-center gap-1">
              <HeartIcon size={12} className="text-primary animate-pulse" />
              <HeartIcon size={12} className="text-secondary animate-pulse" style={{ animationDelay: '0.2s' }} />
              <HeartIcon size={12} className="text-accent animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
          <Image
            src="/CatPackPaid/Sprites/Classical/Individual/Excited.png"
            alt="Excited Cat"
            width={32}
            height={32}
            style={{ 
              imageRendering: 'pixelated',
              transform: 'scale(2)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
