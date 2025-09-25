"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { HeartIcon, StarIcon, ImageIcon, ExternalLinkIcon } from "./ui/icons"

interface PetNFT {
  pair_id: string
  owner: string
  co_parent: string
  pet_name: string
  pet_description: string
  pet_metadata_uri: string
  created_at: number
  claimed: boolean
}

interface CollectionInfo {
  collection_name: string
  collection_description: string
  collection_uri: string
  total_supply: number
  claimed_supply: number
}

export default function PetsDashboard() {
  const { account, connected } = useWallet()
  const [pets, setPets] = useState<PetNFT[]>([])
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPets = async () => {
    if (!account || !connected) return

    try {
      setLoading(true)
      setError(null)

      // Get user's pet NFTs
      const userPetIds = await walletService.getUserPetNFTs(account.address)
      
      const petsData: PetNFT[] = []
      for (const pairId of userPetIds) {
        try {
          const petData = await walletService.getPetNFT(parseInt(pairId))
          petsData.push({
            pair_id: pairId,
            owner: petData.owner,
            co_parent: petData.co_parent,
            pet_name: petData.pet_name,
            pet_description: petData.pet_description,
            pet_metadata_uri: petData.pet_metadata_uri,
            created_at: petData.created_at,
            claimed: petData.claimed
          })
        } catch (err) {
          console.error(`Failed to load pet ${pairId}:`, err)
        }
      }

      setPets(petsData)

      // Get collection info
      try {
        const collectionData = await walletService.getNFTCollectionInfo()
        setCollectionInfo({
          collection_name: collectionData[0],
          collection_description: collectionData[1],
          collection_uri: collectionData[2],
          total_supply: collectionData[3],
          claimed_supply: collectionData[4]
        })
      } catch (err) {
        console.error('Failed to load collection info:', err)
      }

    } catch (err) {
      console.error('Failed to load pets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load pets')
    } finally {
      setLoading(false)
    }
  }

  const claimPet = async (pairId: string) => {
    try {
      setLoading(true)
      await walletService.claimPetNFT(parseInt(pairId))
      await loadPets() // Reload to show updated status
    } catch (err) {
      console.error('Failed to claim pet:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim pet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (connected && account) {
      loadPets()
    }
  }, [connected, account])

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="font-pixel text-4xl text-foreground mb-4">🐾 My Pet Collection</h1>
          <p className="text-muted-foreground mb-8">Please connect your wallet to view your pets</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <HeartIcon size={32} className="text-primary" />
            <h1 className="font-pixel text-4xl text-foreground">🐾 MY PET COLLECTION</h1>
            <HeartIcon size={32} className="text-primary" />
          </div>
          <p className="text-muted-foreground">View and manage your collaborative digital pets</p>
        </div>

        {/* Collection Stats */}
        {collectionInfo && (
          <div className="retro-panel p-6 mb-8 bg-muted">
            <h2 className="font-pixel text-xl text-foreground mb-4 flex items-center gap-2">
              <StarIcon size={20} className="text-primary" />
              Collection Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="font-pixel text-2xl text-primary">{collectionInfo.total_supply}</div>
                <div className="text-sm text-muted-foreground">Total Pets</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-2xl text-secondary">{collectionInfo.claimed_supply}</div>
                <div className="text-sm text-muted-foreground">Claimed</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-2xl text-accent">{pets.length}</div>
                <div className="text-sm text-muted-foreground">Your Pets</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="font-pixel text-lg text-muted-foreground">Loading your pets...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="retro-panel p-4 bg-destructive text-destructive-foreground mb-8">
            <p className="font-nunito text-sm">{error}</p>
          </div>
        )}

        {/* Pets Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="font-pixel text-2xl text-muted-foreground mb-4">🐾</div>
                <div className="font-pixel text-xl text-foreground mb-2">No Pets Yet</div>
                <div className="text-muted-foreground">
                  Create your first collaborative pet by sending an invitation!
                </div>
              </div>
            ) : (
              pets.map((pet) => (
                <div key={pet.pair_id} className="retro-panel p-6 hover:shadow-lg transition-shadow">
                  {/* Pet Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <HeartIcon size={20} className="text-primary" />
                      <h3 className="font-pixel text-lg text-foreground">{pet.pet_name}</h3>
                    </div>
                    {pet.claimed ? (
                      <div className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-pixel">
                        CLAIMED
                      </div>
                    ) : (
                      <div className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-pixel">
                        PENDING
                      </div>
                    )}
                  </div>

                  {/* Pet Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {pet.pet_description}
                  </p>

                  {/* Co-parent Info */}
                  <div className="mb-4 p-3 bg-muted rounded">
                    <div className="text-xs text-muted-foreground mb-1">Co-parent:</div>
                    <div className="font-mono text-sm text-foreground">
                      {pet.co_parent.slice(0, 8)}...{pet.co_parent.slice(-6)}
                    </div>
                  </div>

                  {/* Metadata Link */}
                  <div className="mb-4">
                    <a 
                      href={pet.pet_metadata_uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      <ImageIcon size={16} />
                      View Metadata
                      <ExternalLinkIcon size={12} />
                    </a>
                  </div>

                  {/* Claim Button */}
                  {!pet.claimed && (
                    <button
                      onClick={() => claimPet(pet.pair_id)}
                      disabled={loading}
                      className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full py-2 flex items-center justify-center gap-2"
                    >
                      <StarIcon size={16} />
                      {loading ? 'Claiming...' : 'Claim NFT'}
                    </button>
                  )}

                  {/* Created Date */}
                  <div className="mt-4 text-xs text-muted-foreground">
                    Created: {new Date(pet.created_at / 1000).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={loadPets}
            disabled={loading}
            className="retro-button bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 px-6 py-2"
          >
            {loading ? 'Refreshing...' : 'Refresh Pets'}
          </button>
        </div>
      </div>
    </div>
  )
}
