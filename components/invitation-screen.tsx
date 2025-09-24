"use client"

import { useState } from "react"
import Image from "next/image"

interface InvitationScreenProps {
  onInviteSent: () => void
  onInviteAccepted: () => void
  inviteSent: boolean
}

export default function InvitationScreen({ 
  onInviteSent, 
  onInviteAccepted, 
  inviteSent 
}: InvitationScreenProps) {
  const [walletAddress, setWalletAddress] = useState("")
  
  const handleSendInvite = () => {
    if (walletAddress.trim()) {
      onInviteSent()
      // Simulate invite acceptance after 3 seconds for demo
      setTimeout(() => {
        onInviteAccepted()
      }, 3000)
    }
  }

  if (inviteSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 pixel-grid">
        <div className="retro-panel max-w-lg w-full p-8 text-center">
          {/* Header */}
          <h1 className="font-pixel text-2xl md:text-3xl text-card-foreground mb-8">
            INVITE SENT!
          </h1>
          
          {/* Animated Cat */}
          <div className="flex justify-center mb-8">
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
          
          {/* Waiting Message */}
          <p className="font-nunito text-lg text-card-foreground leading-relaxed mb-6">
            Waiting for your co-parent to accept. We'll take you to your new pet as soon as they do!
          </p>
          
          {/* Loading animation */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-card-foreground animate-pulse"></div>
            <div className="w-3 h-3 bg-card-foreground animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-card-foreground animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pixel-grid">
      <div className="retro-panel max-w-lg w-full p-8">
        {/* Header */}
        <h1 className="font-pixel text-2xl md:text-3xl text-card-foreground mb-8 text-center">
          INVITE YOUR CO-PARENT
        </h1>
        
        {/* Instruction */}
        <p className="font-nunito text-base text-card-foreground leading-relaxed mb-8">
          Your pet can only be minted once your co-parent accepts the on-chain invitation. 
          Enter their wallet address below to send the invite.
        </p>
        
        {/* Input Field */}
        <div className="mb-8">
          <label className="font-nunito text-sm font-semibold text-card-foreground block mb-3">
            Wallet Address
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 border-2 border-border bg-input text-foreground font-nunito text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ borderStyle: 'solid' }}
          />
        </div>
        
        {/* Send Invite Button */}
        <button
          onClick={handleSendInvite}
          disabled={!walletAddress.trim()}
          className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full text-lg py-4"
        >
          Send Invite
        </button>
        
        {/* Decorative Cat */}
        <div className="flex justify-center mt-8">
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
        </div>
      </div>
    </div>
  )
}
