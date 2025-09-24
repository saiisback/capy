"use client"

import { useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useRouter } from "next/navigation"
import WelcomeScreen from "@/components/welcome-screen"

export default function HomePage() {
  const { connected, invitationAccepted } = useWallet()
  const router = useRouter()

  // Handle routing based on wallet state
  useEffect(() => {
    console.log('Home page state:', { connected, invitationAccepted })
    
    // Ensure connected is a boolean
    const isConnected = Boolean(connected)
    
    if (isConnected && !invitationAccepted) {
      // Redirect to invitation page if connected but no invitation accepted
      router.push('/invitation')
    } else if (isConnected && invitationAccepted) {
      // Redirect to dashboard if connected and invitation accepted
      router.push('/dashboard')
    }
    // If not connected, stay on welcome page
  }, [connected, invitationAccepted, router])

  return (
    <div className="min-h-screen bg-background">
      <WelcomeScreen />
    </div>
  )
}
