"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { walletService } from "@/lib/wallet"

interface InventoryItem {
  id: number
  name: string
  item_type: number
  price: number
  description: string
  image_url: string
  available: boolean
}

export default function InventoryScreen() {
  const { connected } = useWallet()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInventory = async () => {
    if (!connected) return
    
    setLoading(true)
    setError(null)
    
    try {
      const detailedInventory = await walletService.getDetailedInventory()
      setInventory(detailedInventory)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (connected) {
      loadInventory()
    }
  }, [connected])

  const getItemTypeName = (type: number) => {
    switch (type) {
      case 1: return "🍽️ Food"
      case 2: return "🎾 Toy"
      case 3: return "🛏️ Furniture"
      case 4: return "🎨 Decoration"
      default: return "❓ Unknown"
    }
  }

  const getItemTypeColor = (type: number) => {
    switch (type) {
      case 1: return "text-green-500"
      case 2: return "text-blue-500"
      case 3: return "text-purple-500"
      case 4: return "text-pink-500"
      default: return "text-gray-500"
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">🔐 Connect Wallet</h1>
          <p className="text-gray-300">Please connect your wallet to view your inventory</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎒 My Inventory</h1>
          <p className="text-gray-300">Your collection of items and rewards</p>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white mt-2">Loading inventory...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button 
              onClick={loadInventory}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {inventory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-bold text-white mb-2">Empty Inventory</h2>
                <p className="text-gray-300 mb-6">You don't have any items yet</p>
                <p className="text-gray-400">Visit the marketplace to purchase items!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {inventory.map((item) => (
                  <div key={item.id} className="retro-panel p-6 hover:scale-105 transition-transform">
                    <div className="text-center">
                      <div className="text-4xl mb-3">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-16 h-16 object-cover mx-auto rounded"
                          />
                        ) : (
                          "📦"
                        )}
                      </div>
                      
                      <h3 className="font-pixel text-lg text-foreground mb-2">
                        {item.name}
                      </h3>
                      
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${getItemTypeColor(item.item_type)} bg-opacity-20`}>
                        {getItemTypeName(item.item_type)}
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">ID: {item.id}</span>
                        <span className="text-primary font-bold">
                          {item.price} APT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={loadInventory}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
          >
            🔄 Refresh Inventory
          </button>
        </div>
      </div>
    </div>
  )
}
