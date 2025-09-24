"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { WalletAccount, CoParentPair, walletService } from '@/lib/wallet'

// Extend window interface for Petra wallet
declare global {
  interface Window {
    aptos?: any
  }
}

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
  refreshCoParentData: () => Promise<void>
  
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
  const { 
    connect: aptosConnect, 
    disconnect: aptosDisconnect, 
    account: aptosAccount, 
    connected: aptosConnected,
    network,
    wallet
  } = useAptosWallet()
  
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [coParent, setCoParent] = useState<WalletAccount | null>(null)
  const [coParentPair, setCoParentPair] = useState<CoParentPair | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationSent, setInvitationSent] = useState(false)
  const [invitationAccepted, setInvitationAccepted] = useState(false)

  // Add a manual connection state to track if we're actually connected
  const [manualConnected, setManualConnected] = useState(false)

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window !== 'undefined' && window.aptos) {
        try {
          const isConnected = await window.aptos.isConnected()
          if (isConnected) {
            console.log('Wallet already connected on mount')
            const accounts = await window.aptos.account()
            if (accounts && accounts.length > 0) {
              const petraAccount = {
                address: accounts[0].address,
                publicKey: accounts[0].publicKey,
                accountType: 'Ed25519' as const
              }
              const walletAccount = await walletService.connect(petraAccount)
              setAccount(walletAccount)
              setManualConnected(true)
            }
          }
        } catch (err) {
          console.log('No existing wallet connection')
        }
      }
    }
    
    checkExistingConnection()
  }, [])

  // Initialize wallet state on mount and when wallet state changes
  useEffect(() => {
    console.log('Wallet state changed:', { 
      aptosConnected, 
      aptosAccount: !!aptosAccount,
      accountAddress: aptosAccount?.address,
      network: network?.name,
      walletName: wallet?.name
    })
    
    const initializeWallet = async () => {
      // Check if Petra wallet is actually connected by checking window.aptos
      const isPetraConnected = typeof window !== 'undefined' && window.aptos && window.aptos.isConnected && window.aptos.isConnected()
      
      if (aptosConnected && aptosAccount) {
        try {
          console.log('Connecting wallet with account:', aptosAccount.address)
          const walletAccount = await walletService.connect(aptosAccount)
          setAccount(walletAccount)
          
          // Load co-parent data from blockchain (this may fail for uninitialized users)
          try {
            const pairs = await walletService.loadCoParentPairsFromBlockchain()
            const currentCoParent = walletService.getCoParent()
            
            setCoParent(currentCoParent)
            setCoParentPair(pairs[0] || null)
            setInvitationAccepted(!!currentCoParent)
          } catch (coParentError) {
            // This is normal for new users who haven't been initialized yet
            console.log('No co-parent data available (user may not be initialized yet)')
            setCoParent(null)
            setCoParentPair(null)
            setInvitationAccepted(false)
          }
          setError(null) // Clear any previous errors
          setManualConnected(true) // Set manual connected state
          console.log('Wallet connected successfully')
        } catch (err) {
          console.error('Wallet connection error:', err)
          setError(err instanceof Error ? err.message : 'Failed to initialize wallet')
        }
      } else if (isPetraConnected && typeof window !== 'undefined' && window.aptos) {
        // Try to get account from Petra directly if adapter isn't working
        try {
          console.log('Petra is connected but adapter not working, trying direct connection...')
          const accounts = await window.aptos.account()
          if (accounts && accounts.length > 0) {
            const petraAccount = {
              address: accounts[0].address,
              publicKey: accounts[0].publicKey,
              accountType: 'Ed25519' as const
            }
            const walletAccount = await walletService.connect(petraAccount)
            setAccount(walletAccount)
            setManualConnected(true) // Set manual connected state
            console.log('Direct Petra connection successful')
          }
        } catch (err) {
          console.error('Direct Petra connection failed:', err)
        }
      } else {
        console.log('Wallet disconnected, resetting state')
        // Reset state when wallet is disconnected
        setAccount(null)
        setCoParent(null)
        setCoParentPair(null)
        setInvitationSent(false)
        setInvitationAccepted(false)
        setError(null)
        setManualConnected(false) // Reset manual connected state
      }
    }

    initializeWallet()
  }, [aptosConnected, aptosAccount, network, wallet])

  const connect = async () => {
    try {
      console.log('Attempting to connect wallet...')
      setLoading(true)
      setError(null)
      
      // Check if Petra wallet is available
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection is only available in the browser')
      }
      
      // Check if Petra wallet is installed
      if (!window.aptos) {
        throw new Error('Petra wallet is not installed. Please install Petra wallet extension.')
      }
      
      console.log('Petra wallet detected, calling aptosConnect...')
      // Use real Aptos wallet connection with Petra wallet name
      await aptosConnect('Petra' as any)
      console.log('aptosConnect completed')
      
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
      setManualConnected(false)
      
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
      
      // Get the first pending invitation from blockchain
      const pendingInvitations = await walletService.getPendingInvitations()
      if (pendingInvitations.length === 0) {
        throw new Error('No pending invitations found')
      }

      const pair = await walletService.acceptInvitation(pendingInvitations[0].id)
      
      // Reload co-parent data from blockchain after accepting invitation
      const pairs = await walletService.loadCoParentPairsFromBlockchain()
      const currentCoParent = walletService.getCoParent()
      
      setCoParentPair(pairs[0] || pair)
      setCoParent(currentCoParent)
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
      
      // Get the first available co-parent pair
      const pairs = walletService.getCoParentPairs()
      if (pairs.length === 0) {
        throw new Error('No co-parent pair found. Please accept an invitation first.')
      }
      
      const pairId = pairs[0].id
      await walletService.feedPet(pairId)
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
      
      // Get the first available co-parent pair
      const pairs = walletService.getCoParentPairs()
      if (pairs.length === 0) {
        throw new Error('No co-parent pair found. Please accept an invitation first.')
      }
      
      const pairId = pairs[0].id
      await walletService.showLoveToPet(pairId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to show love to pet')
    } finally {
      setLoading(false)
    }
  }

  const refreshCoParentData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Reload co-parent data from blockchain
      const pairs = await walletService.loadCoParentPairsFromBlockchain()
      const currentCoParent = walletService.getCoParent()
      
      setCoParent(currentCoParent)
      setCoParentPair(pairs[0] || null)
      setInvitationAccepted(!!currentCoParent)
      
    } catch (err) {
      // Don't show error for uninitialized users - this is normal
      if (!String(err).includes('E_NOT_INITIALIZED')) {
        setError(err instanceof Error ? err.message : 'Failed to refresh co-parent data')
      }
    } finally {
      setLoading(false)
    }
  }

  // Determine if wallet is actually connected
  const isActuallyConnected = Boolean(manualConnected || (aptosConnected && aptosAccount && account) || (account && typeof window !== 'undefined' && window.aptos))
  
  console.log('Final connection state:', {
    aptosConnected,
    hasAptosAccount: !!aptosAccount,
    hasAccount: !!account,
    manualConnected,
    isActuallyConnected,
    isActuallyConnectedBoolean: Boolean(isActuallyConnected),
    hasPetra: typeof window !== 'undefined' && !!window.aptos
  })

  const value: WalletContextType = {
    // State
    connected: isActuallyConnected,
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
    refreshCoParentData,
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
