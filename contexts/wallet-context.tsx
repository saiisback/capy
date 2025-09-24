"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { WalletAccount, CoParentPair, walletService } from '@/lib/wallet'

interface WalletContextType {
  // Wallet state
  connected: boolean
  account: WalletAccount | null
  coParent: WalletAccount | null
  coParentPair: CoParentPair | null
  
  // Connection functions
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  // Pet functions
  sendInvitation: (toAddress: string) => Promise<void>
  acceptInvitation: () => Promise<void>
  feedPet: () => Promise<void>
  showLoveToPet: () => Promise<void>
  
  // State management
  loading: boolean
  error: string | null
  invitationSent: boolean
  invitationAccepted: boolean
}

const WalletContext = createContext<WalletContextType | null>(null)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Use real Aptos wallet adapter
  const { connect: aptosConnect, disconnect: aptosDisconnect, account: aptosAccount, connected: aptosConnected } = useAptosWallet()
  
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [coParent, setCoParent] = useState<WalletAccount | null>(null)
  const [coParentPair, setCoParentPair] = useState<CoParentPair | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationSent, setInvitationSent] = useState(false)
  const [invitationAccepted, setInvitationAccepted] = useState(false)

  // Initialize wallet state on mount
  useEffect(() => {
    const initializeWallet = async () => {
      if (aptosConnected && aptosAccount) {
        try {
          const walletAccount = await walletService.connect(aptosAccount)
          setAccount(walletAccount)
          
          const currentCoParent = walletService.getCoParent()
          const pairs = walletService.getCoParentPairs()
          
          setCoParent(currentCoParent)
          setCoParentPair(pairs[0] || null)
          setInvitationAccepted(!!currentCoParent)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to initialize wallet')
        }
      }
    }

    initializeWallet()
  }, [aptosConnected, aptosAccount])

  const connect = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if Petra wallet is available
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection is only available in the browser')
      }
      
      // Use real Aptos wallet connection with Petra wallet name
      await aptosConnect('Petra' as any)
      
    } catch (err) {
      console.error('Wallet connection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    try {
      setLoading(true)
      
      // Use real Aptos wallet disconnection
      await aptosDisconnect()
      
      // Reset all state
      setAccount(null)
      setCoParent(null)
      setCoParentPair(null)
      setInvitationSent(false)
      setInvitationAccepted(false)
      setError(null)
      
    } catch (err) {
      console.error('Wallet disconnection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet')
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async (toAddress: string) => {
    try {
      setLoading(true)
      setError(null)
      
      await walletService.sendInvitation(toAddress)
      setInvitationSent(true)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get the first pending invitation (in real app, this would be more sophisticated)
      const pendingInvitations = walletService.getPendingInvitations()
      if (pendingInvitations.length === 0) {
        throw new Error('No pending invitations found')
      }

      const pair = await walletService.acceptInvitation(pendingInvitations[0].id)
      setCoParentPair(pair)
      setCoParent(walletService.getCoParent())
      setInvitationAccepted(true)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setLoading(false)
    }
  }

  const feedPet = async () => {
    try {
      setLoading(true)
      setError(null)
      await walletService.feedPet()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to feed pet')
    } finally {
      setLoading(false)
    }
  }

  const showLoveToPet = async () => {
    try {
      setLoading(true)
      setError(null)
      await walletService.showLoveToPet()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to show love to pet')
    } finally {
      setLoading(false)
    }
  }

  const value: WalletContextType = {
    // State
    connected: aptosConnected,
    account,
    coParent,
    coParentPair,
    loading,
    error,
    invitationSent,
    invitationAccepted,
    
    // Functions
    connect,
    disconnect,
    sendInvitation,
    acceptInvitation,
    feedPet,
    showLoveToPet,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
