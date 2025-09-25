"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { walletService } from "@/lib/wallet"
import { StarIcon, ShoppingCartIcon, HeartIcon } from "./ui/icons"

interface MarketplaceItem {
  id: string
  name: string
  description: string
  price: number
  category: 'food' | 'toys' | 'decorations' | 'furniture' | 'games'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  image: string
}

const marketplaceItems: MarketplaceItem[] = [
  // Food Items
  {
    id: 'cat_food_premium',
    name: 'Premium Cat Food',
    description: 'Nutritious and delicious food that makes your pet happy',
    price: 0.5,
    category: 'food',
    rarity: 'common',
    image: '/CatPackPaid/CatItems/CatToys/catfood.png'
  },
  {
    id: 'fish_deluxe',
    name: 'Deluxe Fish',
    description: 'Fresh fish that your pet will love',
    price: 0.6,
    category: 'food',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/CatToys/fish.png'
  },
  {
    id: 'treats_special',
    name: 'Special Treats',
    description: 'Rare treats that boost happiness',
    price: 0.7,
    category: 'food',
    rarity: 'epic',
    image: '/CatPackPaid/CatItems/CatToys/catfood.png'
  },

  // Toys
  {
    id: 'ball_blue',
    name: 'Blue Ball',
    description: 'A fun blue ball for your pet to play with',
    price: 0.5,
    category: 'toys',
    rarity: 'common',
    image: '/CatPackPaid/CatItems/CatToys/BlueBall.gif'
  },
  {
    id: 'mouse_toy',
    name: 'Mouse Toy',
    description: 'Interactive mouse toy that moves',
    price: 0.6,
    category: 'toys',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/CatToys/Mouse.gif'
  },
  {
    id: 'laser_pointer',
    name: 'Laser Pointer',
    description: 'High-tech laser pointer for endless fun',
    price: 0.8,
    category: 'toys',
    rarity: 'epic',
    image: '/CatPackPaid/CatItems/CatToys/CatToy.gif'
  },

  // Decorations
  {
    id: 'flower_pot',
    name: 'Flower Pot',
    description: 'Beautiful flower pot to decorate your pet\'s room',
    price: 0.5,
    category: 'decorations',
    rarity: 'common',
    image: '/CatPackPaid/CatItems/Decorations/CatRoomDecorations.png'
  },
  {
    id: 'wall_art',
    name: 'Wall Art',
    description: 'Elegant wall art for your pet\'s space',
    price: 0.7,
    category: 'decorations',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/Decorations/CatRoomDecorations.png'
  },

  // Furniture
  {
    id: 'cat_bed_blue',
    name: 'Blue Cat Bed',
    description: 'Comfortable blue bed for your pet to rest',
    price: 0.6,
    category: 'furniture',
    rarity: 'common',
    image: '/CatPackPaid/CatItems/Beds/CatBedBlue.png'
  },
  {
    id: 'cat_bed_purple',
    name: 'Purple Cat Bed',
    description: 'Luxurious purple bed for ultimate comfort',
    price: 0.8,
    category: 'furniture',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/Beds/CatBedPurple.png'
  },
  {
    id: 'cat_home',
    name: 'Cat Home',
    description: 'A cozy home for your pet to live in',
    price: 0.9,
    category: 'furniture',
    rarity: 'epic',
    image: '/CatPackPaid/CatItems/Beds/CatHomes.png'
  },

  // Games
  {
    id: 'puzzle_game',
    name: 'Puzzle Game',
    description: 'Interactive puzzle game to keep your pet entertained',
    price: 0.7,
    category: 'games',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/PlayGrounds/CatPlayGround.png'
  },
  {
    id: 'arcade_machine',
    name: 'Arcade Machine',
    description: 'Retro arcade machine for gaming fun',
    price: 0.9,
    category: 'games',
    rarity: 'legendary',
    image: '/CatPackPaid/CatItems/PlayGrounds/CatPlayGround.png'
  }
]

const categoryIcons = {
  food: '🍽️',
  toys: '🎾',
  decorations: '🎨',
  furniture: '🛏️',
  games: '🎮'
}

const rarityColors = {
  common: 'text-gray-500',
  rare: 'text-blue-500',
  epic: 'text-purple-500',
  legendary: 'text-yellow-500'
}

export default function MarketplaceScreen() {
  const { account, loading: walletLoading } = useWallet()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<MarketplaceItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(false)

  const categories = ['all', 'food', 'toys', 'decorations', 'furniture', 'games']
  
  const filteredItems = selectedCategory === 'all' 
    ? marketplaceItems 
    : marketplaceItems.filter(item => item.category === selectedCategory)

  const addToCart = (item: MarketplaceItem) => {
    console.log('addToCart called with:', item.name)
    setCart(prevCart => {
      const newCart = [...prevCart, item]
      console.log('Cart updated:', newCart.map(i => i.name))
      return newCart
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0)
  }

  const purchaseItems = async () => {
    if (!account) {
      alert('Please connect your wallet first!')
      return
    }
    
    try {
      setLoading(true)
      
      // Provide better user feedback about the transaction process
      alert('🛒 Starting purchase process...\n\n📱 IMPORTANT: A Petra wallet popup should appear for transaction approval.\n\n👀 If you don\'t see a popup:\n• Check if it was blocked by your browser\n• Look for a small wallet icon in your browser\n• Make sure Petra extension is enabled\n\n⏱️ You have up to 60 seconds to approve the transaction.')
      
      // For now, we'll purchase items one by one
      // In a real implementation, you might want to batch purchases
      for (const item of cart) {
        // Map frontend item ID to blockchain item ID
        // For now, we'll use a simple mapping based on item index
        const blockchainItemId = getBlockchainItemId(item.id)
        
        if (blockchainItemId) {
          await walletService.purchaseItem(blockchainItemId)
          console.log(`Purchased ${item.name} (ID: ${blockchainItemId})`)
        } else {
          console.warn(`No blockchain mapping found for item: ${item.name}`)
        }
      }
      
      alert(`🎉 Successfully purchased ${cart.length} items!\n\n✅ Items have been added to your inventory.`)
      setCart([])
      
    } catch (error) {
      console.error('Purchase failed:', error)
      
      // Provide specific error messages based on error type
      let errorMessage = 'Unknown error occurred'
      const errorString = error instanceof Error ? error.message : String(error)
      
      if (errorString.includes('timeout')) {
        errorMessage = '⏰ Transaction timed out after 60 seconds.\n\n💡 This usually means:\n• The Petra wallet popup didn\'t appear\n• The popup was blocked by your browser\n• You didn\'t approve the transaction in time\n\n🔧 To fix this:\n• Check browser popup blocker settings\n• Look for the Petra extension icon\n• Try the purchase again'
      } else if (errorString.includes('rejected') || errorString.includes('denied')) {
        errorMessage = '❌ Transaction was rejected.\n\n💡 To complete your purchase:\n• Click "Purchase Items" again\n• Approve the transaction in your Petra wallet'
      } else if (errorString.includes('insufficient')) {
        errorMessage = '💰 Insufficient funds.\n\n💡 Please ensure you have enough APT tokens in your wallet to complete the purchase.'
      } else if (errorString.includes('Petra wallet not available')) {
        errorMessage = '👛 Petra wallet not detected.\n\n💡 Please:\n• Install the Petra wallet extension\n• Connect your wallet\n• Refresh the page and try again'
      } else if (errorString.includes('not connected')) {
        errorMessage = '🔗 Wallet not connected.\n\n💡 Please connect your Petra wallet first.'
      } else {
        errorMessage = `❌ Purchase failed: ${errorString}\n\n💡 Please try again or contact support if the issue persists.`
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Map frontend item IDs to blockchain item IDs
  const getBlockchainItemId = (frontendItemId: string): number | null => {
    // This is a simple mapping - in a real app, you'd want to store this mapping
    // or fetch it from the blockchain
    const itemMapping: { [key: string]: number } = {
      'cat_food_premium': 1,
      'fish_deluxe': 2,
      'treats_special': 3,
      'ball_blue': 4,
      'mouse_toy': 5,
      'laser_pointer': 6,
      'flower_pot': 7,
      'wall_art': 8,
      'cat_bed_blue': 9,
      'cat_bed_purple': 10,
      'cat_home': 11,
      'puzzle_game': 12,
      'arcade_machine': 13
    }
    
    return itemMapping[frontendItemId] || null
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="font-pixel text-4xl text-foreground mb-4">Marketplace</h1>
          <p className="text-muted-foreground mb-8">Please connect your wallet to access the marketplace</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-pixel text-4xl text-foreground mb-2">🛒 Pet Marketplace</h1>
            <p className="text-muted-foreground">Buy items to make your pet happy!</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                console.log('TEST BUTTON CLICKED!')
                try {
                  // Test wallet connection
                  const { walletService } = await import('@/lib/wallet')
                  console.log('Wallet service loaded')
                  console.log('Account:', account)
                  alert('Test button works! Wallet service loaded.')
                } catch (error) {
                  console.error('Wallet test failed:', error)
                  const errorMessage = error instanceof Error ? error.message : String(error)
                  alert('Wallet test failed: ' + errorMessage)
                }
              }}
              className="retro-button bg-green-500 text-white hover:bg-green-600 px-4 py-2 cursor-pointer"
              type="button"
              style={{ zIndex: 9999, position: 'relative' }}
            >
              🧪 Test Wallet
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowCart(!showCart)
                console.log('Cart toggled, current cart:', cart)
              }}
              className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 cursor-pointer"
              type="button"
              style={{ zIndex: 9999, position: 'relative' }}
            >
              <ShoppingCartIcon size={20} />
              Cart ({cart.length})
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setSelectedCategory(category)
                console.log('Category selected:', category)
              }}
              className={`retro-button px-4 py-2 cursor-pointer ${
                selectedCategory === category 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              type="button"
            >
              {category === 'all' ? '🏪 All Items' : `${categoryIcons[category as keyof typeof categoryIcons]} ${category.charAt(0).toUpperCase() + category.slice(1)}`}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="retro-panel p-6 hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-16 h-16 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-pixel text-lg text-foreground">{item.name}</h3>
                  <span className={`text-sm font-bold ${rarityColors[item.rarity]}`}>
                    {item.rarity.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground">{item.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xl text-primary">{item.price} APT</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      addToCart(item)
                      console.log('Added to cart:', item.name)
                    }}
                    className="retro-button bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-1 text-sm cursor-pointer"
                    type="button"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border-2 border-foreground p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-pixel text-2xl text-foreground">Shopping Cart</h2>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowCart(false)
                    console.log('Cart closed')
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  type="button"
                >
                  ✕
                </button>
              </div>
              
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <h4 className="font-pixel text-sm">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.price} APT</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeFromCart(item.id)
                          console.log('Removed from cart:', item.name)
                        }}
                        className="text-destructive hover:text-destructive/80 cursor-pointer"
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-pixel text-lg">Total:</span>
                      <span className="font-pixel text-xl text-primary">{getTotalPrice()} APT</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!loading && !walletLoading) {
                          purchaseItems()
                          console.log('Purchase started for cart:', cart)
                        }
                      }}
                      disabled={loading || walletLoading}
                      className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 w-full py-3 disabled:opacity-50 cursor-pointer"
                      type="button"
                    >
                      {loading ? '🔄 Processing... Check your wallet!' : '🛒 Purchase Items'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
