"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { StarIcon, ShoppingCartIcon, HeartIcon, GiftIcon, HomeIcon, GamepadIcon } from "./ui/icons"

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
    price: 5,
    category: 'food',
    rarity: 'common',
    image: '/CatPackPaid/CatItems/CatToys/catfood.png'
  },
  {
    id: 'fish_deluxe',
    name: 'Deluxe Fish',
    description: 'Fresh fish that your pet will love',
    price: 8,
    category: 'food',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/CatToys/fish.png'
  },
  {
    id: 'treats_special',
    name: 'Special Treats',
    description: 'Rare treats that boost happiness',
    price: 15,
    category: 'food',
    rarity: 'epic',
    image: '/CatPackPaid/CatItems/CatToys/catfood.png'
  },

  // Toys
  {
    id: 'ball_blue',
    name: 'Blue Ball',
    description: 'A fun blue ball for your pet to play with',
    price: 3,
    category: 'toys',
    rarity: 'common',
    image: '/CatPackPaid/CatItems/CatToys/BlueBall.gif'
  },
  {
    id: 'mouse_toy',
    name: 'Mouse Toy',
    description: 'Interactive mouse toy that moves',
    price: 7,
    category: 'toys',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/CatToys/Mouse.gif'
  },
  {
    id: 'laser_pointer',
    name: 'Laser Pointer',
    description: 'High-tech laser pointer for endless fun',
    price: 12,
    category: 'toys',
    rarity: 'epic',
    image: '/CatPackPaid/CatItems/CatToys/CatToy.gif'
  },

  // Decorations
  {
    id: 'flower_pot',
    name: 'Flower Pot',
    description: 'Beautiful flower pot to decorate your pet\'s room',
    price: 4,
    category: 'decorations',
    rarity: 'common',
    image: '/CatPackPaid/CatItems/Decorations/CatRoomDecorations.png'
  },
  {
    id: 'wall_art',
    name: 'Wall Art',
    description: 'Elegant wall art for your pet\'s space',
    price: 10,
    category: 'decorations',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/Decorations/CatRoomDecorations.png'
  },

  // Furniture
  {
    id: 'cat_bed_blue',
    name: 'Blue Cat Bed',
    description: 'Comfortable blue bed for your pet to rest',
    price: 20,
    category: 'furniture',
    rarity: 'common',
    image: '/CatPackPaid/CatItems/Beds/CatBedBlue.png'
  },
  {
    id: 'cat_bed_purple',
    name: 'Purple Cat Bed',
    description: 'Luxurious purple bed for ultimate comfort',
    price: 35,
    category: 'furniture',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/Beds/CatBedPurple.png'
  },
  {
    id: 'cat_home',
    name: 'Cat Home',
    description: 'A cozy home for your pet to live in',
    price: 50,
    category: 'furniture',
    rarity: 'epic',
    image: '/CatPackPaid/CatItems/Beds/CatHomes.png'
  },

  // Games
  {
    id: 'puzzle_game',
    name: 'Puzzle Game',
    description: 'Interactive puzzle game to keep your pet entertained',
    price: 25,
    category: 'games',
    rarity: 'rare',
    image: '/CatPackPaid/CatItems/PlayGrounds/CatPlayGround.png'
  },
  {
    id: 'arcade_machine',
    name: 'Arcade Machine',
    description: 'Retro arcade machine for gaming fun',
    price: 75,
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
  const { account, loading } = useWallet()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<MarketplaceItem[]>([])
  const [showCart, setShowCart] = useState(false)

  const categories = ['all', 'food', 'toys', 'decorations', 'furniture', 'games']
  
  const filteredItems = selectedCategory === 'all' 
    ? marketplaceItems 
    : marketplaceItems.filter(item => item.category === selectedCategory)

  const addToCart = (item: MarketplaceItem) => {
    setCart([...cart, item])
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
    
    // TODO: Implement blockchain purchase
    alert(`Purchasing ${cart.length} items for ${getTotalPrice()} APT tokens...`)
    setCart([])
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
              onClick={() => setShowCart(!showCart)}
              className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
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
              onClick={() => setSelectedCategory(category)}
              className={`retro-button px-4 py-2 ${
                selectedCategory === category 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
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
                    onClick={() => addToCart(item)}
                    className="retro-button bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-1 text-sm"
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
                  onClick={() => setShowCart(false)}
                  className="text-muted-foreground hover:text-foreground"
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
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive/80"
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
                      onClick={purchaseItems}
                      disabled={loading}
                      className="retro-button bg-primary text-primary-foreground hover:bg-primary/90 w-full py-3 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Purchase Items'}
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
