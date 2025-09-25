// Real Aptos/Petra Wallet Integration
import { Aptos, AptosConfig, Network, SimpleTransaction } from "@aptos-labs/ts-sdk";

// Extend window interface for Petra wallet
declare global {
  interface Window {
    aptos?: any;
  }
}

export interface WalletAccount {
  address: string;
  publicKey: string;
  accountType: 'Ed25519' | 'Keyless' | 'Secp256k1';
}

export interface PetInvitation {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface CoParentPair {
  id: string;
  parent1: WalletAccount;
  parent2: WalletAccount;
  petCreated: boolean;
  createdAt: number;
}

// --- CONFIGURATION ---
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

// Ensure your contract address is set in your .env.local file
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5d6605640f430521df2e7da9706ae111f0b3e8b9a6801b57ee4bca03e2ba7668";

// --- HELPER FUNCTIONS ---

/**
 * Checks if the contract address is properly configured.
 */
const isContractDeployed = (): boolean => {
  return CONTRACT_ADDRESS !== "0x123" && CONTRACT_ADDRESS.length >= 60;
};

/**
 * Safely gets the Petra wallet instance from the window object.
 */
const getWallet = () => {
  if (typeof window !== 'undefined' && window.aptos) {
    return window.aptos;
  }
  throw new Error('Petra wallet not found. Please install the Petra wallet extension.');
};

/**
 * A robust utility to parse numeric IDs from various complex data structures
 * returned by Aptos view functions.
 * @param data The raw data from the view function.
 * @returns A number or null if parsing fails.
 */
const parseIdFromView = (data: any): number | null => {
  if (data === null || data === undefined) return null;

  // Handle empty arrays
  if (Array.isArray(data) && data.length === 0) {
    return null;
  }

  // Direct number or string
  if (typeof data === 'number') return data;
  if (typeof data === 'string') {
    const parsed = parseInt(data, 10);
    return isNaN(parsed) ? null : parsed;
  }

  // Handle array-wrapped data
  if (Array.isArray(data) && data.length > 0) {
    return parseIdFromView(data[0]);
  }

  // Handle common Move struct formats
  if (typeof data === 'object') {
    const potentialId = data.inner || data.value || data.id;
    if (potentialId) {
      return parseIdFromView(potentialId);
    }
  }

  console.warn('Could not parse ID from an unknown data structure:', data);
  return null;
};


// --- MAIN WALLET SERVICE ---

class AptosWalletService {
  private connected = false;
  private account: WalletAccount | null = null;
  private coParentPairs: CoParentPair[] = [];

  // Connect to the wallet and set the account info
  async connect(account: any): Promise<WalletAccount> {
    const walletAccount: WalletAccount = {
      address: account.address,
      publicKey: account.publicKey.toString(),
      accountType: 'Ed25519', // Defaulting as Petra adapter doesn't specify
    };

    this.connected = true;
    this.account = walletAccount;
    return walletAccount;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.account = null;
  }

  getAccount(): WalletAccount | null {
    return this.account;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Checks if the user's account has been initialized on the contract.
   * If not, it sends a transaction to initialize it.
   * @param accountAddress The address to check, defaults to the connected account.
   */
  private async ensureUserInitialized(accountAddress?: string): Promise<void> {
    const finalAddress = accountAddress || this.account?.address;
    if (!finalAddress) throw new Error('No account address available.');

    // Check if user is already initialized by looking for any CapyData-related resources
    try {
      // Try to get the CapyData resource
      const resource = await aptos.getAccountResource({ 
        accountAddress: finalAddress, 
        resourceType: `${CONTRACT_ADDRESS}::capy::CapyData`
      });
      if (resource) {
        console.log('User already initialized (has CapyData).');
        return;
      }
    } catch (e: any) {
      // If we get a 404, the user is not initialized
      if (e.status === 404) {
        console.log('User not initialized (404 error), proceeding with initialization');
      } else if (e.status === 400) {
        // 400 error might mean the resource exists but we can't access it
        // This could mean the user is already initialized
        console.log('User might already be initialized (400 error), checking inventory...');
        try {
          // Check if user has any inventory items
          const inventory = await aptos.getAccountResource({ 
            accountAddress: finalAddress, 
            resourceType: `${CONTRACT_ADDRESS}::capy::UserInventory`
          });
          if (inventory) {
            console.log('User already initialized (has inventory), skipping initialization');
            return;
          }
        } catch (inventoryError) {
          console.log('User not initialized (no inventory), proceeding with initialization');
        }
      } else {
        console.error('Failed to check for user initialization:', e);
        throw e;
      }
    }

    console.log('User not initialized, sending transaction...');
    try {
      const wallet = getWallet();
      const transaction = {
        function: `${CONTRACT_ADDRESS}::capy::initialize`,
        arguments: [],
        type: 'entry_function_payload',
        type_arguments: []
      };
      
      console.log('DEBUG: Transaction payload:', transaction);
      
      // Use the correct format for Petra wallet
      const response = await wallet.signAndSubmitTransaction({ payload: transaction });
      console.log('DEBUG: Transaction response:', response);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log('User initialized successfully.');
    } catch (error) {
      console.error('Failed during user initialization transaction:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if the error is because user is already initialized
      if (error instanceof Error && error.message && error.message.includes('E_ALREADY_INITIALIZED')) {
        console.log('User was already initialized, continuing...');
        return;
      }
      
      throw new Error(`Failed to initialize user: ${error}`);
    }
  }

  /**
   * Sends a co-parenting invitation to another address.
   * @param toAddress The recipient's Aptos address.
   */
  async sendInvitation(toAddress: string): Promise<PetInvitation> {
    if (!this.account) throw new Error('Wallet not connected');
    if (!isContractDeployed()) throw new Error('Contract address not configured.');

    try {
      const wallet = getWallet();
      const transaction = {
        function: `${CONTRACT_ADDRESS}::capy::send_invitation`,
        arguments: [this.account.address, toAddress], // Pass both sender and recipient addresses
        type: 'entry_function_payload',
        type_arguments: []
      };

      const response = await wallet.signAndSubmitTransaction({payload: transaction});
      await aptos.waitForTransaction({ transactionHash: response.hash });

      const newInvitation: PetInvitation = {
        id: `inv_${Date.now()}`,
        from: this.account.address,
        to: toAddress,
        status: 'pending',
        timestamp: Date.now(),
      };
      return newInvitation;

    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw new Error(`Failed to send invitation: ${error}`);
    }
  }

  /**
   * Accepts a co-parenting invitation.
   * @param invitationId The ID of the invitation to accept.
   */
  async acceptInvitation(invitationId: string): Promise<CoParentPair> {
    if (!this.account) throw new Error('Wallet not connected');

    try {
        console.log('DEBUG: Ensuring user is initialized before accepting invitation...');
        await this.ensureUserInitialized();
        console.log('DEBUG: User initialization check complete.');

        const wallet = getWallet();
        const transaction = {
        function: `${CONTRACT_ADDRESS}::capy::accept_invitation`,
            arguments: [parseInt(invitationId)],
        type: 'entry_function_payload',
        type_arguments: []
        };

        const response = await wallet.signAndSubmitTransaction({payload: transaction});
        await aptos.waitForTransaction({ transactionHash: response.hash });

        console.log('DEBUG: Invitation accepted. Fetching details to create pair object...');
        // Refetch invitation details to find the other parent
        const invitationData: any = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_invitation_view`,
          functionArguments: [CONTRACT_ADDRESS, parseInt(invitationId)],
        },
        });

        const [id, from, to, status, createdAt, acceptedAt] = invitationData;

      const coParentPair: CoParentPair = {
            id: `pair_${id}`,
            parent1: this.account, // Current user
            parent2: { // The user who sent the invitation
                address: from as string,
                publicKey: 'N/A', // Public key isn't available from the contract view
                accountType: 'Ed25519',
        },
        petCreated: true,
            createdAt: Date.now(),
        };

        this.coParentPairs.push(coParentPair);
        return coParentPair;

    } catch (error) {
        console.error('Failed to accept invitation:', error);
        throw new Error(`Failed to accept invitation: ${error}`);
    }
  }

  /**
   * Fetches all pending invitations for the currently connected user.
   */
  async getPendingInvitations(): Promise<PetInvitation[]> {
    if (!this.account) return [];
    
    try {
        console.log('DEBUG: Getting invitations for user:', this.account.address);
        const invitationIds: any[] = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_user_invitations_view`,
          functionArguments: [CONTRACT_ADDRESS, this.account.address],
        },
        });

        console.log('DEBUG: Raw invitation IDs:', invitationIds);
        const invitations: PetInvitation[] = [];
        
        // Check if invitationIds is empty or not an array
        if (!Array.isArray(invitationIds) || invitationIds.length === 0) {
            console.log('DEBUG: No invitations found for user');
            return invitations;
        }
        
        for (const rawId of invitationIds) {
            const id = parseIdFromView(rawId);
            if (!id) continue;

            try {
                const invData: any[] = await aptos.view({
              payload: {
                function: `${CONTRACT_ADDRESS}::capy::get_invitation_view`,
                        functionArguments: [CONTRACT_ADDRESS, id],
                    },
                });

                console.log('DEBUG: Raw invitation data:', invData);
                
                // The data comes back as an array with an object, so we need to access the first element
                const invitationData = invData[0];
                const { id: invId, from, to, status, created_at: createdAt } = invitationData;
                
                console.log('DEBUG: Parsed invitation details:', { invId, from, to, status, createdAt, currentUser: this.account.address });
                // Status 0 means 'Pending' in the contract
              if (to === this.account.address && status === 0) {
                console.log('DEBUG: Adding invitation to list');
                invitations.push({
                        id: invId.toString(),
                        from: from,
                        to: to,
                  status: 'pending',
                        timestamp: parseInt(createdAt.toString()),
                    });
                } else {
                    console.log('DEBUG: Invitation not for this user or not pending');
                }
            } catch (err) {
                console.error(`Failed to fetch details for invitation ID ${id}:`, err);
            }
        }
        return invitations;
    } catch (error) {
        console.error('Failed to get pending invitations:', error);
        return [];
    }
  }
  
  /**
   * **FIXED**: Purchases an item from the marketplace.
   * This now uses the correct, non-deprecated wallet call format.
   * @param itemId The ID of the item to purchase.
   */
  async purchaseItem(itemId: number): Promise<void> {
    if (!this.account) throw new Error('Wallet not connected.');
    
    try {
      console.log(`DEBUG: Starting purchase for item ID: ${itemId}`);
      
      const wallet = getWallet();
      const transaction = {
        function: `${CONTRACT_ADDRESS}::capy::purchase_item`,
        arguments: [itemId],
        type: 'entry_function_payload',
        type_arguments: []
      };

      console.log('DEBUG: Submitting purchase transaction...');
      const response = await wallet.signAndSubmitTransaction({ payload: transaction });

      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log(`Item ${itemId} purchased successfully. Txn hash: ${response.hash}`);

    } catch (error: any) {
      console.error('Failed to purchase item:', error);
      const errorMessage = error.message || String(error);

      // Handle initialization error by trying to initialize first
      if (errorMessage.includes('E_NOT_INITIALIZED')) {
        console.log('User not initialized, attempting initialization...');
        try {
          await this.ensureUserInitialized();
          // Retry the purchase after initialization
          const wallet = getWallet();
          const transaction = {
            function: `${CONTRACT_ADDRESS}::capy::purchase_item`,
            arguments: [itemId],
            type: 'entry_function_payload',
            type_arguments: []
          };
          
          const response = await wallet.signAndSubmitTransaction({ payload: transaction });
          await aptos.waitForTransaction({ transactionHash: response.hash });
          console.log(`Item ${itemId} purchased successfully after initialization. Txn hash: ${response.hash}`);
          return;
        } catch (initError) {
          console.error('Failed to initialize user:', initError);
          throw new Error('Your account needs to be initialized first. Please try again.');
        }
      }

      // Provide more helpful, user-friendly error messages
      if (errorMessage.includes('E_ITEM_NOT_FOUND')) {
        throw new Error('This item could not be found in the marketplace.');
      } else if (errorMessage.includes('E_ITEM_ALREADY_OWNED')) {
        throw new Error('You already own this item.');
      } else {
        throw new Error(`Failed to purchase item: ${errorMessage}`);
      }
    }
  }

  // --- Other Methods ---
  
  async feedPet(pairId: string): Promise<void> {
    if (!this.account) throw new Error('Wallet not connected');
    
    try {
      await this.ensureUserInitialized();
      const wallet = getWallet();
      const transaction = {
        function: `${CONTRACT_ADDRESS}::capy::feed_pet`,
        arguments: [parseInt(pairId)],
        type: 'entry_function_payload',
        type_arguments: []
      };
      
      const response = await wallet.signAndSubmitTransaction({ payload: transaction });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log('Feed pet transaction successful.');
      
    } catch (error) {
      console.error('Failed to feed pet:', error);
      throw new Error(`Failed to feed pet: ${error}`);
    }
  }

  async showLoveToPet(pairId: string): Promise<void> {
    if (!this.account) throw new Error('Wallet not connected');
    
    try {
      await this.ensureUserInitialized();
      const wallet = getWallet();
      const transaction = {
        function: `${CONTRACT_ADDRESS}::capy::show_love_to_pet`,
        arguments: [parseInt(pairId)],
        type: 'entry_function_payload',
        type_arguments: []
      };
      
      const response = await wallet.signAndSubmitTransaction({ payload: transaction });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log('Show love to pet transaction successful.');
      
    } catch (error) {
      console.error('Failed to show love to pet:', error);
      throw new Error(`Failed to show love to pet: ${error}`);
    }
  }

  async claimGameReward(gameType: string, score: number): Promise<void> {
    if (!this.account) throw new Error('Wallet not connected');
    
    try {
      await this.ensureUserInitialized();
      const wallet = getWallet();
      const transaction = {
        function: `${CONTRACT_ADDRESS}::capy::claim_game_reward`,
        arguments: [gameType, score],
        type: 'entry_function_payload',
        type_arguments: []
      };
      
      const response = await wallet.signAndSubmitTransaction({ payload: transaction });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      console.log('Claim game reward transaction successful.');
      
    } catch (error) {
      console.error('Failed to claim game reward:', error);
      throw new Error(`Failed to claim game reward: ${error}`);
    }
  }

  async loadCoParentPairsFromBlockchain(): Promise<CoParentPair[]> {
    if (!this.account) throw new Error('Wallet not connected');
    
    try {
      // Get user's co-parent pairs from the contract
      const pairIds: any[] = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_user_pairs_view`,
          functionArguments: [CONTRACT_ADDRESS, this.account.address],
        },
      });

      const pairs: CoParentPair[] = [];
      
      // Check if pairIds is empty or not an array
      if (!Array.isArray(pairIds) || pairIds.length === 0) {
        return pairs;
      }
      
      for (const rawId of pairIds) {
        const id = parseIdFromView(rawId);
        if (!id) continue;

        try {
          const pairData: any[] = await aptos.view({
            payload: {
              function: `${CONTRACT_ADDRESS}::capy::get_pair_view`,
              functionArguments: [CONTRACT_ADDRESS, id],
            },
          });

          const [pairId, parent1, parent2, petCreated, createdAt] = pairData;
          pairs.push({
            id: `pair_${pairId}`,
            parent1: { address: parent1, publicKey: 'N/A', accountType: 'Ed25519' },
            parent2: { address: parent2, publicKey: 'N/A', accountType: 'Ed25519' },
            petCreated: petCreated,
            createdAt: parseInt(createdAt.toString()),
          });
        } catch (err) {
          console.error(`Failed to fetch details for pair ID ${id}:`, err);
        }
      }
      
      this.coParentPairs = pairs;
      return pairs;
    } catch (error) {
      console.error('Failed to load co-parent pairs from blockchain:', error);
      return [];
    }
  }

  getCoParent(): WalletAccount | null {
    if (this.coParentPairs.length === 0) return null;
    
    const currentPair = this.coParentPairs[0];
    // Return the other parent (not the current user)
    if (currentPair.parent1.address === this.account?.address) {
      return currentPair.parent2;
    } else {
      return currentPair.parent1;
    }
  }

  getCoParentPairs(): CoParentPair[] {
    return this.coParentPairs;
  }

  /**
   * Gets detailed inventory information for the connected user
   * @returns Promise<any[]> Array of detailed inventory items
   */
  async getDetailedInventory(): Promise<any[]> {
    if (!this.account) throw new Error('Wallet not connected');
    
    try {
      console.log('DEBUG: Getting detailed inventory for user:', this.account.address);
      
      // Get user's inventory from the contract
      const inventoryData: any[] = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_user_inventory_view`,
          functionArguments: [CONTRACT_ADDRESS, this.account.address],
        },
      });

      console.log('DEBUG: Raw inventory data:', inventoryData);

      // Get detailed information for each item
      const detailedItems = [];
      for (const itemId of inventoryData) {
        try {
          const itemData: any[] = await aptos.view({
            payload: {
              function: `${CONTRACT_ADDRESS}::capy::get_marketplace_item_view`,
              functionArguments: [CONTRACT_ADDRESS, itemId.toString()],
            },
          });

          const [id, name, itemType, price, description, imageUrl, available] = itemData;
          detailedItems.push({
            id: parseInt(id.toString()),
            name: Buffer.from(name).toString('utf8'),
            itemType: parseInt(itemType.toString()),
            price: parseInt(price.toString()),
            description: Buffer.from(description).toString('utf8'),
            imageUrl: Buffer.from(imageUrl).toString('utf8'),
            available: available,
            owned: true
          });
        } catch (err) {
          console.error(`Failed to fetch details for item ID ${itemId}:`, err);
        }
      }
      
      console.log('DEBUG: Detailed inventory items:', detailedItems);
      return detailedItems;
    } catch (error) {
      console.error('Failed to load detailed inventory:', error);
      return [];
    }
  }

  /**
   * Gets all pet NFT IDs for a user
   * @param userAddress The user's address
   * @returns Promise<string[]> Array of pet NFT IDs
   */
  async getUserPetNFTs(userAddress: string): Promise<string[]> {
    if (!isContractDeployed()) throw new Error('Contract address not configured.');
    
    try {
      const petIds: any[] = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_user_pet_nfts_view`,
          functionArguments: [CONTRACT_ADDRESS, userAddress],
        },
      });

      console.log('DEBUG: Raw NFT IDs from blockchain:', petIds);
      
      // Handle nested array structure - flatten if needed
      let flatIds: any[] = petIds;
      if (Array.isArray(petIds) && petIds.length > 0 && Array.isArray(petIds[0])) {
        flatIds = petIds[0];
        console.log('DEBUG: Flattened NFT IDs:', flatIds);
      }

      const result = flatIds.map(id => id.toString()).filter(id => id && id !== 'undefined');
      console.log('DEBUG: Final NFT IDs:', result);
      
      return result;
    } catch (error) {
      console.error('Failed to get user pet NFTs:', error);
      return [];
    }
  }

  /**
   * Gets detailed information for a specific pet NFT
   * @param pairId The pair ID of the pet NFT
   * @returns Promise<any> Pet NFT data
   */
  async getPetNFT(pairId: number): Promise<any> {
    if (!isContractDeployed()) throw new Error('Contract address not configured.');
    
    try {
      console.log('DEBUG: Getting NFT data for pair ID:', pairId);
      
      const petData: any[] = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_pet_nft_view`,
          functionArguments: [CONTRACT_ADDRESS, pairId.toString()],
        },
      });

      console.log('DEBUG: Raw NFT data from blockchain:', petData);

      const [id, owner, coParent, petName, petDescription, petMetadataUri, createdAt, claimed] = petData;
      
      const result = {
        id: id.toString(),
        owner: owner,
        co_parent: coParent,
        pet_name: Buffer.from(petName).toString('utf8'),
        pet_description: Buffer.from(petDescription).toString('utf8'),
        pet_metadata_uri: Buffer.from(petMetadataUri).toString('utf8'),
        created_at: parseInt(createdAt.toString()),
        claimed: claimed
      };
      
      console.log('DEBUG: Processed NFT data:', result);
      
      return result;
    } catch (error) {
      console.error('Failed to get pet NFT:', error);
      throw error;
    }
  }

  /**
   * Gets NFT collection information
   * @returns Promise<any[]> Collection data
   */
  async getNFTCollectionInfo(): Promise<any[]> {
    if (!isContractDeployed()) throw new Error('Contract address not configured.');
    
    try {
      const collectionData: any[] = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_nft_collection_info_view`,
          functionArguments: [CONTRACT_ADDRESS],
        },
      });

      return collectionData;
    } catch (error) {
      console.error('Failed to get collection info:', error);
      throw error;
    }
  }

  /**
   * Claims a pet NFT
   * @param pairId The pair ID of the pet NFT to claim
   */
  async claimPetNFT(pairId: string): Promise<void> {
    if (!this.account) throw new Error('Wallet not connected');
    if (!isContractDeployed()) throw new Error('Contract address not configured.');

    try {
      const wallet = getWallet();
      const transaction = {
        function: `${CONTRACT_ADDRESS}::capy::claim_pet_nft`,
        arguments: [pairId],
        type: 'entry_function_payload',
        type_arguments: []
      };

      const response = await wallet.signAndSubmitTransaction({payload: transaction});
      await aptos.waitForTransaction({ transactionHash: response.hash });
    } catch (error) {
      console.error('Failed to claim pet NFT:', error);
      throw new Error(`Failed to claim pet NFT: ${error}`);
    }
  }
}

// Export a singleton instance of the service
export const walletService = new AptosWalletService();

// Add the method to the instance if it's not there
if (!walletService.getDetailedInventory) {
  walletService.getDetailedInventory = async function(): Promise<any[]> {
    const account = (this as any).account;
    if (!account) throw new Error('Wallet not connected');
    
    try {
      console.log('DEBUG: Getting detailed inventory for user:', account.address);
      
      // Get user's inventory from the contract
      const inventoryData: any[] = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::capy::get_user_inventory_view`,
          functionArguments: [CONTRACT_ADDRESS, account.address],
        },
      });

      console.log('DEBUG: Raw inventory data:', inventoryData);

      // Get detailed information for each item
      const detailedItems = [];
      for (const itemId of inventoryData) {
        try {
          const itemData: any[] = await aptos.view({
            payload: {
              function: `${CONTRACT_ADDRESS}::capy::get_marketplace_item_view`,
              functionArguments: [CONTRACT_ADDRESS, itemId.toString()],
            },
          });

          const [id, name, itemType, price, description, imageUrl, available] = itemData;
          detailedItems.push({
            id: parseInt(id.toString()),
            name: Buffer.from(name).toString('utf8'),
            itemType: parseInt(itemType.toString()),
            price: parseInt(price.toString()),
            description: Buffer.from(description).toString('utf8'),
            imageUrl: Buffer.from(imageUrl).toString('utf8'),
            available: available,
            owned: true
          });
        } catch (err) {
          console.error(`Failed to fetch details for item ID ${itemId}:`, err);
        }
      }
      
      console.log('DEBUG: Detailed inventory items:', detailedItems);
      return detailedItems;
    } catch (error) {
      console.error('Failed to load detailed inventory:', error);
      return [];
    }
  };
}

// --- Standalone Utility Functions ---

export const shortenAddress = (address: string): string => {
  if (!address || address.length < 10) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getAccountTypeColor = (accountType: string): string => {
  switch (accountType) {
    case 'Ed25519': return 'text-primary';
    case 'Keyless': return 'text-secondary';
    case 'Secp256k1': return 'text-accent';
    default: return 'text-foreground';
  }
};