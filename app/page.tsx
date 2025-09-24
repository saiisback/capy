"use client"

import { useState } from "react"
import WelcomeScreen from "@/components/welcome-screen"
import InvitationScreen from "@/components/invitation-screen"
import DashboardScreen from "@/components/dashboard-screen"

type AppState = 'welcome' | 'invitation' | 'dashboard'

export default function CapyApp() {
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome')
  const [walletConnected, setWalletConnected] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const handleWalletConnect = () => {
    setWalletConnected(true)
    setCurrentScreen('invitation')
  }

  const handleInviteSent = () => {
    setInviteSent(true)
  }

  const handleInviteAccepted = () => {
    setCurrentScreen('dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === 'welcome' && (
        <WelcomeScreen onWalletConnect={handleWalletConnect} />
      )}
      {currentScreen === 'invitation' && (
        <InvitationScreen 
          onInviteSent={handleInviteSent}
          onInviteAccepted={handleInviteAccepted}
          inviteSent={inviteSent}
        />
      )}
      {currentScreen === 'dashboard' && (
        <DashboardScreen />
      )}
    </div>
  )
}
