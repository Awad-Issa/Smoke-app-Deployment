"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  description?: string
  image?: string
  distributorId: string
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
}

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "SUPERMARKET") {
      router.push("/login")
      return
    }
    fetchProducts()
    loadCart()
  }, [session, status, router])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/supermarket/products")
      const data = await response.json()
      
      // Handle deactivation error
      if (response.status === 403 && data.code === "ACCOUNT_DEACTIVATED") {
        alert(data.message || "Your account has been deactivated. You will be logged out.")
        // Redirect to login with deactivation message
        window.location.href = "/login?error=account_deactivated"
        return
      }
      
      // Handle other errors
      if (!response.ok || data.error) {
        console.error("API Error:", data.error || "Failed to fetch products")
        setProducts([]) // Set empty array instead of error object
        return
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data)
      } else {
        console.error("Invalid data format - expected array, got:", typeof data)
        setProducts([])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id)
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert("Cannot add more items than available stock")
        return
      }
      const newCart = cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      saveCart(newCart)
    } else {
      const newCart = [...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock
      }]
      saveCart(newCart)
    }
  }

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.productId !== productId)
    saveCart(newCart)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (product && quantity > product.stock) {
      alert("Cannot add more items than available stock")
      return
    }

    const newCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    )
    saveCart(newCart)
  }

  const getCartQuantity = (productId: string) => {
    const item = cart.find(item => item.productId === productId)
    return item ? item.quantity : 0
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Browse Products</h1>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            🛒 Supermarket: {session.user.email}
          </span>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push("/account")}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            👤 My Account
          </button>
          <button
            onClick={() => router.push("/orders")}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            📋 My Orders
          </button>
          <button
            onClick={() => router.push("/cart")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 relative"
          >
            🛒 Cart ({getTotalItems()})
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="font-medium">
              Cart: {getTotalItems()} items - ${getTotalPrice().toFixed(2)}
            </span>
            <button
              onClick={() => router.push("/cart")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Cart →
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const cartQuantity = getCartQuantity(product.id)
          return (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {product.image && (
                <div className="aspect-w-16 aspect-h-9">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {product.description || "No description available"}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Stock: {product.stock}
                  </span>
                </div>
                
                {cartQuantity > 0 ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(product.id, cartQuantity - 1)}
                        className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-medium w-8 text-center">{cartQuantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                        className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                        disabled={cartQuantity >= product.stock}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`w-full py-2 px-4 rounded font-medium ${
                      product.stock === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products available at the moment.</p>
        </div>
      )}
    </div>
  )
}
