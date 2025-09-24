"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import InvitationScreen from "@/components/invitation-screen"

export default function InvitationPage() {
  const { connected, invitationAccepted } = useWallet()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if wallet is connected
    if (!connected) {
      // Redirect to home if not connected
      router.push('/')
      return
    }
    
    // Check if invitation is already accepted
    if (invitationAccepted) {
      // Redirect to dashboard if invitation is accepted
      router.push('/dashboard')
      return
    }
    
    setIsLoading(false)
  }, [connected, invitationAccepted, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <InvitationScreen />
    </div>
  )
}
