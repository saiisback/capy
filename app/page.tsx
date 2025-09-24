"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import WelcomeScreen from "@/components/welcome-screen"
import InvitationScreen from "@/components/invitation-screen"
import DashboardScreen from "@/components/dashboard-screen"

type AppState = 'welcome' | 'invitation' | 'dashboard'

export default function CapyApp() {
  const { connected, invitationAccepted } = useWallet()
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome')

  // Update screen based on wallet state
  useEffect(() => {
    if (!connected) {
      setCurrentScreen('welcome')
    } else if (connected && !invitationAccepted) {
      setCurrentScreen('invitation')
    } else if (connected && invitationAccepted) {
      setCurrentScreen('dashboard')
    }
  }, [connected, invitationAccepted])

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === 'welcome' && (
        <WelcomeScreen />
      )}
      {currentScreen === 'invitation' && (
        <InvitationScreen />
      )}
      {currentScreen === 'dashboard' && (
        <DashboardScreen />
      )}
    </div>
  )
}
