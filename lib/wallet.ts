// Real Aptos/Petra Wallet Integration
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"

// Extend window interface for Petra wallet
declare global {
  interface Window {
    aptos?: any
  }
}

export interface WalletAccount {
  address: string
  publicKey: string
  accountType: 'Ed25519' | 'Keyless' | 'Secp256k1'
}

export interface PetInvitation {
  id: string
  from: string
  to: string
  status: 'pending' | 'accepted' | 'rejected'
  timestamp: number
}

export interface CoParentPair {
  id: string
  parent1: WalletAccount
  parent2: WalletAccount
  petCreated: boolean
  createdAt: number
}

// Real Aptos SDK integration
const aptosConfig = new AptosConfig({ network: Network.TESTNET })
const aptos = new Aptos(aptosConfig)

// Contract address - using the fresh deployed address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x6452e5567c68fecc959b07313751674e3b9b766b31b77443646cfea761c4b1ef"

// Check if contract is deployed
const isContractDeployed = () => {
  return CONTRACT_ADDRESS !== "0x123" && CONTRACT_ADDRESS.length >= 60
}

// Helper function to get wallet instance
const getWallet = () => {
  if (typeof window !== 'undefined' && window.aptos) {
    return window.aptos
  }
  throw new Error('Petra wallet not found. Please install Petra wallet extension.')
}

class AptosWalletService {
  private connected = false
  private account: WalletAccount | null = null
  private invitations: PetInvitation[] = []
  private coParentPairs: CoParentPair[] = []

  // Real connection to Petra wallet
  async connect(account: any): Promise<WalletAccount> {
    // Real wallet connection from Aptos wallet adapter
    const walletAccount: WalletAccount = {
      address: account.address,
      publicKey: account.publicKey.toString(),
      accountType: this.getAccountType(account.publicKey)
    }

    this.connected = true
    this.account = walletAccount
    return walletAccount
  }

  private getAccountType(publicKey: any): 'Ed25519' | 'Keyless' | 'Secp256k1' {
    // Determine account type based on Petra wallet adapter response
    // For now, default to Ed25519 as it's the most common type in Petra
    return 'Ed25519'
  }


  async disconnect(): Promise<void> {
    this.connected = false
    this.account = null
  }

  getAccount(): WalletAccount | null {
    return this.account
  }

  isConnected(): boolean {
    return this.connected
  }

  // Ensure user has initialized their account
  private async ensureUserInitialized(): Promise<void> {
    if (!this.account) throw new Error('Wallet not connected')
    
    try {
      const wallet = getWallet()
      
      // Check if CapyData resource exists for this user
      try {
        const accountResources = await aptos.getAccountResources({ 
          accountAddress: this.account.address 
        })
        
        // Look for CapyData resource
        const capyResource = accountResources.find(resource => 
          resource.type.includes('::capy::CapyData')
        )
        
        if (capyResource) {
          console.log('User already initialized')
          return
        }
        
        // User not initialized, let's initialize them
        console.log('User not initialized, initializing...')
        
        const initTransaction = await wallet.signAndSubmitTransaction({
          arguments: [],
          function: `${CONTRACT_ADDRESS}::capy::initialize`,
          type: 'entry_function_payload',
          type_arguments: []
        })
        
        console.log('User initialization transaction:', initTransaction.hash)
        await aptos.waitForTransaction({ transactionHash: initTransaction.hash })
        console.log('User initialized successfully')
        
      } catch (error) {
        console.error('Failed to check/initialize user:', error)
        // If checking resources fails, assume user needs initialization
        if (String(error).includes('E_ALREADY_INITIALIZED')) {
          console.log('User already initialized (caught from error)')
          return
        }
        throw error
      }
    } catch (error) {
      console.error('Failed to ensure user initialization:', error)
      throw new Error(`Failed to initialize user: ${error}`)
    }
  }

  // Send invitation to co-parent via blockchain - NO SIGNATURE REQUIRED FROM SENDER
  async sendInvitation(toAddress: string): Promise<PetInvitation> {
    if (!this.account) throw new Error('Wallet not connected')
    
    if (!isContractDeployed()) {
      throw new Error('Smart contract not deployed. Please deploy the contract first and set NEXT_PUBLIC_CONTRACT_ADDRESS environment variable.')
    }

    try {
      const wallet = getWallet()
      
      // Real blockchain transaction to Aptos testnet - using new function signature
      const transaction = await wallet.signAndSubmitTransaction({
        arguments: [this.account.address, toAddress], // from_address, to_address
        function: `${CONTRACT_ADDRESS}::capy::send_invitation`,
        type: 'entry_function_payload',
        type_arguments: []
      })

      console.log('Invitation transaction submitted:', transaction.hash)

      // Wait for transaction to be confirmed
      await aptos.waitForTransaction({ transactionHash: transaction.hash })

      const invitation: PetInvitation = {
        id: `inv_${Date.now()}`,
        from: this.account.address,
        to: toAddress,
        status: 'pending',
        timestamp: Date.now()
      }

      this.invitations.push(invitation)
      return invitation

    } catch (error) {
      console.error('Failed to send invitation:', error)
      throw new Error(`Failed to send invitation: ${error}`)
    }
  }

  // Accept invitation via blockchain
  async acceptInvitation(invitationId: string): Promise<CoParentPair> {
    if (!this.account) throw new Error('Wallet not connected')

    try {
      const wallet = getWallet()
      
      console.log('DEBUG: Attempting to accept invitation', invitationId)
      console.log('DEBUG: User address:', this.account.address)
      console.log('DEBUG: Contract address:', CONTRACT_ADDRESS)
      
      // First, ensure the user is initialized
      console.log('DEBUG: Checking user initialization...')
      await this.ensureUserInitialized()
      console.log('DEBUG: User initialization check complete')
      
      // Double-check user resources before proceeding
      try {
        const accountResources = await aptos.getAccountResources({ 
          accountAddress: this.account.address 
        })
        console.log('DEBUG: User resources:', accountResources.map(r => r.type))
        
        const capyResource = accountResources.find(resource => 
          resource.type.includes('::capy::CapyData')
        )
        console.log('DEBUG: CapyData resource found:', !!capyResource)
      } catch (resourceError) {
        console.error('DEBUG: Failed to check resources:', resourceError)
      }
      
      // Real blockchain transaction to accept invitation
      console.log('DEBUG: Submitting accept invitation transaction...')
      const transactionPayload = {
        arguments: [parseInt(invitationId)],
        function: `${CONTRACT_ADDRESS}::capy::accept_invitation`,
        type: 'entry_function_payload',
        type_arguments: []
      }
      
      console.log('DEBUG: Transaction payload:', transactionPayload)
      console.log('DEBUG: Full function name:', `${CONTRACT_ADDRESS}::capy::accept_invitation`)
      console.log('DEBUG: Parsed invitation ID:', parseInt(invitationId))
      
      const transaction = await wallet.signAndSubmitTransaction(transactionPayload)

      console.log('Accept invitation transaction submitted:', transaction.hash)
      await aptos.waitForTransaction({ transactionHash: transaction.hash })
      
      // Get the invitation details to find the sender
      const invitationData = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_invitation_view`,
          functionArguments: [CONTRACT_ADDRESS, parseInt(invitationId)],
        },
      })

      console.log('Invitation data after acceptance:', invitationData)

      // Create co-parent pair with real data
      const coParentPair: CoParentPair = {
        id: invitationId,
        parent1: this.account,
        parent2: {
          address: invitationData[1] as string, // from address
          publicKey: `0x${Math.random().toString(16).slice(2, 34).padStart(32, '0')}`, // We don't have the public key from the contract
          accountType: 'Ed25519'
        },
        petCreated: true,
        createdAt: Date.now()
      }

      this.coParentPairs.push(coParentPair)
      return coParentPair

    } catch (error) {
      console.error('Failed to accept invitation:', error)
      throw new Error(`Failed to accept invitation: ${error}`)
    }
  }

  // Get pending invitations from blockchain
  async getPendingInvitations(): Promise<PetInvitation[]> {
    if (!this.account) return []
    
    try {
      // Get user invitations from the smart contract
      const userInvitations = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_user_invitations_view`,
          functionArguments: [CONTRACT_ADDRESS, this.account.address],
        },
      })


      // Convert blockchain data to frontend format
      const invitations: PetInvitation[] = []
      
      if (userInvitations && Array.isArray(userInvitations)) {
        for (const invitationId of userInvitations) {
          // Skip if invitationId is empty, null, undefined, or not a valid number/string
          if (!invitationId || 
              invitationId === null || 
              invitationId === undefined || 
              invitationId === '' ||
              (typeof invitationId === 'string' && invitationId.trim() === '') ||
              (typeof invitationId === 'number' && (isNaN(invitationId) || invitationId <= 0))) {
            console.log('Skipping invalid invitation ID:', invitationId)
            continue
          }
          
          try {
            // Handle Move struct type - extract the actual ID value
            let validInvitationId: number
            
            
            if (Array.isArray(invitationId)) {
              if (invitationId.length > 0) {
                // If it's an array, take the first element
                const firstElement = invitationId[0]
                if (typeof firstElement === 'string') {
                  validInvitationId = parseInt(firstElement, 10)
                } else if (typeof firstElement === 'number') {
                  validInvitationId = firstElement
                } else {
                  validInvitationId = parseInt(String(firstElement), 10)
                }
              } else {
                continue
              }
            } else if (typeof invitationId === 'object' && invitationId !== null) {
              // If it's a Move struct, try to extract the ID value
              if ('inner' in invitationId && typeof invitationId.inner === 'string') {
                validInvitationId = parseInt(invitationId.inner, 10)
              } else if ('value' in invitationId && typeof invitationId.value === 'string') {
                validInvitationId = parseInt(invitationId.value, 10)
              } else if (typeof invitationId === 'object' && 'toString' in invitationId) {
                validInvitationId = parseInt(invitationId.toString(), 10)
              } else {
                console.log('DEBUG: Unknown object structure, trying JSON.stringify:', JSON.stringify(invitationId))
                // Try to extract any numeric value from the object
                const jsonStr = JSON.stringify(invitationId)
                const numMatch = jsonStr.match(/\d+/)
                if (numMatch) {
                  validInvitationId = parseInt(numMatch[0], 10)
                } else {
                  console.log('Skipping invitation ID with unknown structure:', invitationId)
                  continue
                }
              }
            } else if (typeof invitationId === 'string') {
              validInvitationId = parseInt(invitationId, 10)
            } else if (typeof invitationId === 'number') {
              validInvitationId = invitationId
            } else {
              console.log('Skipping invitation ID with unsupported type:', typeof invitationId, invitationId)
              continue
            }
            
            // Double-check the converted ID is valid
            if (isNaN(validInvitationId) || validInvitationId <= 0) {
              console.log('Skipping invalid converted invitation ID:', validInvitationId)
              continue
            }
            
            // Get individual invitation details
            const invitationData = await aptos.view({
              payload: {
                function: `${CONTRACT_ADDRESS}::capy::get_invitation_view`,
                functionArguments: [CONTRACT_ADDRESS, validInvitationId],
              },
            })

            console.log('Invitation data for ID', invitationId, ':', invitationData)
            console.log('DEBUG: Invitation data details:', {
              data: invitationData,
              length: invitationData?.length,
              isArray: Array.isArray(invitationData),
              firstElement: Array.isArray(invitationData) ? invitationData[0] : 'not array',
              stringified: JSON.stringify(invitationData, null, 2)
            })

            // Handle different response formats
            let actualInvitation: any = null
            if (invitationData && Array.isArray(invitationData)) {
              if (invitationData.length === 1 && typeof invitationData[0] === 'object') {
                // If it's wrapped in an array, unwrap it
                actualInvitation = invitationData[0]
                console.log('DEBUG: Unwrapped invitation from array:', actualInvitation)
              } else if (invitationData.length >= 6) {
                // Direct array format
                actualInvitation = invitationData
                console.log('DEBUG: Using direct array format')
              }
            } else if (invitationData && typeof invitationData === 'object') {
              // Direct object format
              actualInvitation = invitationData
              console.log('DEBUG: Using direct object format')
            }

            if (actualInvitation) {
              // Try different ways to extract invitation data
              let id, from, to, status, createdAt, acceptedAt

              if (Array.isArray(actualInvitation) && actualInvitation.length >= 6) {
                [id, from, to, status, createdAt, acceptedAt] = actualInvitation
                console.log('DEBUG: Extracted from array format')
              } else if (typeof actualInvitation === 'object') {
                // Try object properties
                id = actualInvitation.id || actualInvitation.invitation_id
                from = actualInvitation.from || actualInvitation.from_address
                to = actualInvitation.to || actualInvitation.to_address
                status = actualInvitation.status
                createdAt = actualInvitation.created_at || actualInvitation.createdAt
                acceptedAt = actualInvitation.accepted_at || actualInvitation.acceptedAt
                console.log('DEBUG: Extracted from object format')
              }
              
              console.log('DEBUG: Invitation details for receiver check:', {
                id: (id as any)?.toString(),
                from: from as string,
                to: to as string,
                status: status,
                statusType: typeof status,
                currentUser: this.account.address,
                isRecipient: to === this.account.address,
                isPending: status === 0,
                rawData: actualInvitation
              })
              
              // Only include invitations where current user is the recipient and status is pending (0)
              if (to === this.account.address && status === 0) {
                console.log('DEBUG: Adding invitation to pending list')
                invitations.push({
                  id: (id as any)?.toString() || '',
                  from: from as string,
                  to: to as string,
                  status: 'pending',
                  timestamp: parseInt((createdAt as any)?.toString() || '0')
                })
              } else {
                console.log('DEBUG: Invitation filtered out:', {
                  reason: to !== this.account.address ? 'Not recipient' : 'Status not pending',
                  actualStatus: status,
                  expectedStatus: 0
                })
              }
            } else {
              console.log('DEBUG: Could not parse invitation data structure:', {
                data: invitationData,
                length: invitationData?.length,
                isArray: Array.isArray(invitationData)
              })
            }
          } catch (invitationError) {
            console.error('Failed to fetch invitation details for ID', invitationId, ':', invitationError)
          }
        }
      }

      console.log('Processed invitations:', invitations)
      return invitations

    } catch (error) {
      console.error('Failed to get pending invitations:', error)
      return []
    }
  }

  // Get sent invitations from blockchain
  async getSentInvitations(): Promise<PetInvitation[]> {
    if (!this.account) return []
    
    try {
      // Get user invitations from the smart contract
      const userInvitations = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_user_invitations_view`,
          functionArguments: [CONTRACT_ADDRESS, this.account.address],
        },
      })

      console.log('Raw sent invitations from blockchain:', userInvitations)
      console.log('Sent invitations type:', typeof userInvitations, 'Array?', Array.isArray(userInvitations))
      console.log('Sent invitations length:', userInvitations?.length)

      // Convert blockchain data to frontend format
      const invitations: PetInvitation[] = []
      
      if (userInvitations && Array.isArray(userInvitations)) {
        for (const invitationId of userInvitations) {
          // Skip if invitationId is empty, null, undefined, or not a valid number/string
          if (!invitationId || 
              invitationId === null || 
              invitationId === undefined || 
              invitationId === '' ||
              (typeof invitationId === 'string' && invitationId.trim() === '') ||
              (typeof invitationId === 'number' && (isNaN(invitationId) || invitationId <= 0))) {
            console.log('Skipping invalid sent invitation ID:', invitationId)
            continue
          }
          
          try {
            // Handle Move struct type - extract the actual ID value
            let validInvitationId: number
            
            console.log('DEBUG: Processing sent invitation ID:', {
              invitationId,
              type: typeof invitationId,
              isArray: Array.isArray(invitationId),
              keys: typeof invitationId === 'object' ? Object.keys(invitationId || {}) : 'not object'
            })
            
            if (Array.isArray(invitationId) && invitationId.length > 0) {
              // If it's an array, take the first element
              const firstElement = invitationId[0]
              console.log('DEBUG: Sent array detected, first element:', firstElement, typeof firstElement)
              if (typeof firstElement === 'string') {
                validInvitationId = parseInt(firstElement, 10)
              } else if (typeof firstElement === 'number') {
                validInvitationId = firstElement
              } else {
                console.log('DEBUG: Sent first element is not string/number:', firstElement)
                validInvitationId = parseInt(String(firstElement), 10)
              }
            } else if (typeof invitationId === 'object' && invitationId !== null) {
              // If it's a Move struct, try to extract the ID value
              if ('inner' in invitationId && typeof invitationId.inner === 'string') {
                validInvitationId = parseInt(invitationId.inner, 10)
              } else if ('value' in invitationId && typeof invitationId.value === 'string') {
                validInvitationId = parseInt(invitationId.value, 10)
              } else if (typeof invitationId === 'object' && 'toString' in invitationId) {
                validInvitationId = parseInt(invitationId.toString(), 10)
              } else {
                console.log('DEBUG: Unknown sent object structure, trying JSON.stringify:', JSON.stringify(invitationId))
                // Try to extract any numeric value from the object
                const jsonStr = JSON.stringify(invitationId)
                const numMatch = jsonStr.match(/\d+/)
                if (numMatch) {
                  validInvitationId = parseInt(numMatch[0], 10)
                } else {
                  console.log('Skipping sent invitation ID with unknown structure:', invitationId)
                  continue
                }
              }
            } else if (typeof invitationId === 'string') {
              validInvitationId = parseInt(invitationId, 10)
            } else if (typeof invitationId === 'number') {
              validInvitationId = invitationId
            } else {
              console.log('Skipping sent invitation ID with unsupported type:', typeof invitationId, invitationId)
              continue
            }
            
            // Double-check the converted ID is valid
            if (isNaN(validInvitationId) || validInvitationId <= 0) {
              console.log('Skipping invalid converted sent invitation ID:', validInvitationId)
              continue
            }
            
            // Get individual invitation details
            const invitationData = await aptos.view({
              payload: {
                function: `${CONTRACT_ADDRESS}::capy::get_invitation_view`,
                functionArguments: [CONTRACT_ADDRESS, validInvitationId],
              },
            })

            console.log('Sent invitation data for ID', invitationId, ':', invitationData)

            if (invitationData && invitationData.length >= 6) {
              const [id, from, to, status, createdAt, acceptedAt] = invitationData
              
              // Only include invitations where current user is the sender
              if (from === this.account.address) {
                let statusText = 'pending'
                if (status === 1) statusText = 'accepted'
                else if (status === 2) statusText = 'rejected'
                
                invitations.push({
                  id: (id as any)?.toString() || '',
                  from: from as string,
                  to: to as string,
                  status: statusText as 'pending' | 'accepted' | 'rejected',
                  timestamp: parseInt((createdAt as any)?.toString() || '0')
                })
              }
            }
          } catch (invitationError) {
            console.error('Failed to fetch sent invitation details for ID', invitationId, ':', invitationError)
          }
        }
      }

      console.log('Processed sent invitations:', invitations)
      return invitations

    } catch (error) {
      console.error('Failed to get sent invitations:', error)
      return []
    }
  }

  // Get co-parent pairs for current account
  getCoParentPairs(): CoParentPair[] {
    if (!this.account) return []
    
    return this.coParentPairs.filter(pair => 
      pair.parent1.address === this.account!.address || 
      pair.parent2.address === this.account!.address
    )
  }

  // Load co-parent pairs from blockchain
  async loadCoParentPairsFromBlockchain(): Promise<CoParentPair[]> {
    console.log('DEBUG: loadCoParentPairsFromBlockchain called')
    if (!this.account) {
      console.log('DEBUG: No account, returning empty array')
      return []
    }
    
    try {
      // First, ensure the user is initialized
      console.log('DEBUG: Ensuring user is initialized...')
      await this.ensureUserInitialized()
      console.log('DEBUG: User initialization complete')
      
      // WORKAROUND: The smart contract has a design issue where get_user_pairs_view
      // tries to access CapyData on the contract address instead of user address.
      // As a workaround, we'll check accepted invitations to determine co-parent pairs.
      
      console.log('DEBUG: Using workaround to load co-parent pairs from accepted invitations')
      
      // Get all user invitations to find accepted ones
      const userInvitations = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_user_invitations_view`,
          functionArguments: [CONTRACT_ADDRESS, this.account.address],
        },
      })

      console.log('DEBUG: User invitations from blockchain:', userInvitations)
      console.log('DEBUG: User invitations type:', typeof userInvitations, 'Array?', Array.isArray(userInvitations))
      console.log('DEBUG: User invitations length:', userInvitations?.length)

      const pairs: CoParentPair[] = []
      
      if (userInvitations && Array.isArray(userInvitations)) {
        console.log('DEBUG: Processing', userInvitations.length, 'user invitations')
        for (const invitationId of userInvitations) {
          try {
            // Handle different invitation ID formats
            let validInvitationId: number
            
            if (Array.isArray(invitationId) && invitationId.length > 0) {
              const firstElement = invitationId[0]
              if (typeof firstElement === 'string') {
                validInvitationId = parseInt(firstElement, 10)
              } else if (typeof firstElement === 'number') {
                validInvitationId = firstElement
              } else {
                validInvitationId = parseInt(String(firstElement), 10)
              }
            } else if (typeof invitationId === 'object' && invitationId !== null) {
              if ('inner' in invitationId && typeof invitationId.inner === 'string') {
                validInvitationId = parseInt(invitationId.inner, 10)
              } else if ('value' in invitationId && typeof invitationId.value === 'string') {
                validInvitationId = parseInt(invitationId.value, 10)
              } else {
                const jsonStr = JSON.stringify(invitationId)
                const numMatch = jsonStr.match(/\d+/)
                if (numMatch) {
                  validInvitationId = parseInt(numMatch[0], 10)
                } else {
                  continue
                }
              }
            } else if (typeof invitationId === 'string') {
              validInvitationId = parseInt(invitationId, 10)
            } else if (typeof invitationId === 'number') {
              validInvitationId = invitationId
            } else {
              continue
            }
            
            if (isNaN(validInvitationId) || validInvitationId <= 0) {
              continue
            }
            
            // Get invitation details to check if it was accepted
            const invitationData = await aptos.view({
              payload: {
                function: `${CONTRACT_ADDRESS}::capy::get_invitation_view`,
                functionArguments: [CONTRACT_ADDRESS, validInvitationId],
              },
            })

            console.log('DEBUG: Invitation data for ID', invitationId, ':', invitationData)
            console.log('DEBUG: Invitation data structure:', {
              isArray: Array.isArray(invitationData),
              length: invitationData?.length,
              data: invitationData
            })

            if (invitationData && Array.isArray(invitationData) && invitationData.length >= 6) {
              const [id, from, to, status, createdAt, acceptedAt] = invitationData
              
              console.log('DEBUG: Parsed invitation data:', {
                id,
                from,
                to,
                status,
                statusType: typeof status,
                createdAt,
                acceptedAt,
                currentUser: this.account.address,
                isRecipient: to === this.account.address,
                isAccepted: status === 1
              })
              
              // Only process accepted invitations (status = 1)
              if (status === 1) {
                console.log('DEBUG: Processing accepted invitation, creating co-parent pair')
                const coParentPair: CoParentPair = {
                  id: `pair_${validInvitationId}`,
                  parent1: {
                    address: from as string,
                    publicKey: `0x${Math.random().toString(16).slice(2, 34).padStart(32, '0')}`,
                    accountType: 'Ed25519'
                  },
                  parent2: {
                    address: to as string,
                    publicKey: `0x${Math.random().toString(16).slice(2, 34).padStart(32, '0')}`,
                    accountType: 'Ed25519'
                  },
                  petCreated: true,
                  createdAt: parseInt((acceptedAt as any)?.toString() || '0')
                }
                
                pairs.push(coParentPair)
                console.log('DEBUG: Added co-parent pair:', coParentPair)
              } else {
                console.log('DEBUG: Invitation not accepted, status:', status, 'type:', typeof status)
              }
            } else {
              console.log('DEBUG: Invitation data format not expected:', {
                isArray: Array.isArray(invitationData),
                length: invitationData?.length,
                data: invitationData
              })
            }
          } catch (invitationError) {
            console.error('Failed to fetch invitation details for ID', invitationId, ':', invitationError)
          }
        }
      }

      // Update local storage
      this.coParentPairs = pairs
      console.log('DEBUG: Loaded co-parent pairs from accepted invitations:', pairs)
      console.log('DEBUG: loadCoParentPairsFromBlockchain completed successfully')
      return pairs

    } catch (error) {
      console.error('Failed to load co-parent pairs from blockchain:', error)
      
      // If user is not initialized, return empty array (this is normal for new users)
      if (String(error).includes('E_NOT_INITIALIZED')) {
        console.log('User not initialized yet, returning empty co-parent pairs')
        return []
      }
      
      return []
    }
  }

  // Get the co-parent for the current user
  getCoParent(): WalletAccount | null {
    const pairs = this.getCoParentPairs()
    if (pairs.length === 0 || !this.account) return null

    const pair = pairs[0]
    return pair.parent1.address === this.account.address ? pair.parent2 : pair.parent1
  }

  // Real pet interactions on blockchain
  async feedPet(pairId: string): Promise<void> {
    if (!this.account) throw new Error('Wallet not connected')
    
    try {
      const wallet = getWallet()
      
      // First, ensure the user is initialized
      await this.ensureUserInitialized()
      
      // Real blockchain transaction
      const transaction = await wallet.signAndSubmitTransaction({
        arguments: [parseInt(pairId)],
        function: `${CONTRACT_ADDRESS}::capy::feed_pet`,
        type: 'entry_function_payload',
        type_arguments: []
      })

      console.log('Feed pet transaction submitted:', transaction.hash)
      await aptos.waitForTransaction({ transactionHash: transaction.hash })
      
    } catch (error) {
      console.error('Failed to feed pet:', error)
      throw new Error(`Failed to feed pet: ${error}`)
    }
  }

  async showLoveToPet(pairId: string): Promise<void> {
    if (!this.account) throw new Error('Wallet not connected')
    
    try {
      const wallet = getWallet()
      
      // First, ensure the user is initialized
      await this.ensureUserInitialized()
      
      // Real blockchain transaction
      const transaction = await wallet.signAndSubmitTransaction({
        arguments: [parseInt(pairId)],
        function: `${CONTRACT_ADDRESS}::capy::show_love_to_pet`,
        type: 'entry_function_payload',
        type_arguments: []
      })

      console.log('Show love transaction submitted:', transaction.hash)
      await aptos.waitForTransaction({ transactionHash: transaction.hash })
      
    } catch (error) {
      console.error('Failed to show love to pet:', error)
      throw new Error(`Failed to show love to pet: ${error}`)
    }
  }
}

// Export singleton instance
export const walletService = new AptosWalletService()

// Utility functions
export const shortenAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const getAccountTypeColor = (accountType: string): string => {
  switch (accountType) {
    case 'Ed25519': return 'text-primary'
    case 'Keyless': return 'text-secondary' 
    case 'Secp256k1': return 'text-accent'
    default: return 'text-foreground'
  }
}
