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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-600 truncate">
                {session?.user?.supermarketName || session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => router.push("/cart")}
              className="relative bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5 6m9.5-6v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6m8 0V9a1 1 0 00-1-1H8a1 1 0 00-1 1v4.01" />
              </svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="bg-white border-b px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => router.push("/orders")}
            className="flex-shrink-0 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
          >
            📋 Orders
          </button>
          <button
            onClick={() => router.push("/account")}
            className="flex-shrink-0 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            👤 Account
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex-shrink-0 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="px-4 py-4">

        {/* Cart Summary (Mobile) */}
        {cart.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">{getTotalItems()} items in cart</p>
                <p className="text-blue-700 text-sm">${getTotalPrice().toFixed(2)} total</p>
              </div>
              <button
                onClick={() => router.push("/cart")}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg"
              >
                View Cart →
              </button>
            </div>
          </div>
        )}

        {/* Products Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => {
            const cartQuantity = getCartQuantity(product.id)
            return (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Product Image */}
                {product.image && (
                  <div className="aspect-square relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold bg-red-600 px-3 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description || "No description available"}
                  </p>
                  
                  {/* Price and Stock */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-green-600">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Stock</div>
                      <div className="font-semibold text-gray-700">{product.stock}</div>
                    </div>
                  </div>
                  
                  {/* Add to Cart / Quantity Controls */}
                  {cartQuantity > 0 ? (
                    <div className="space-y-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-center space-x-3 bg-gray-50 rounded-xl p-2">
                        <button
                          onClick={() => updateQuantity(product.id, cartQuantity - 1)}
                          className="bg-white text-gray-700 w-10 h-10 rounded-xl hover:bg-gray-100 transition-all shadow-sm font-semibold"
                        >
                          -
                        </button>
                        <span className="font-bold text-lg text-gray-900 min-w-[2rem] text-center">{cartQuantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                          className="bg-white text-gray-700 w-10 h-10 rounded-xl hover:bg-gray-100 transition-all shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={cartQuantity >= product.stock}
                        >
                          +
                        </button>
                      </div>
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="w-full text-red-600 hover:text-red-700 text-sm font-medium py-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        Remove from Cart
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-base transition-all ${
                        product.stock === 0
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-500 mb-4">There are no products available at the moment.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Fixed Bottom Cart Button (Mobile) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-20">
          <button
            onClick={() => router.push("/cart")}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            View Cart • {getTotalItems()} items • ${getTotalPrice().toFixed(2)}
          </button>
        </div>
      )}
    </div>
  )
}
