"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "SUPERMARKET") {
      router.push("/login")
      return
    }
    loadCart()
  }, [session, status, router])

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

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }


    const newCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    )
    saveCart(newCart)
  }

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.productId !== productId)
    saveCart(newCart)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/supermarket/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        })
      })

      if (response.ok) {
        // Clear cart
        setCart([])
        localStorage.removeItem("cart")
        
        // Redirect to orders page
        router.push("/orders?success=true")
      } else {
        const error = await response.json()
        
        // Handle deactivation error
        if (response.status === 403 && error.code === "ACCOUNT_DEACTIVATED") {
          alert(error.message || "Your account has been deactivated. You will be logged out.")
          // Redirect to login with deactivation message
          window.location.href = "/login?error=account_deactivated"
          return
        }
        
        alert(error.error || "Failed to place order")
      }
    } catch (error) {
      console.error("Error placing order:", error)
      alert("Failed to place order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/products")}
                className="mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shopping Cart</h1>
                <p className="text-sm text-gray-600">{cart.length} items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/orders")}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5 6m9.5-6v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6m8 0V9a1 1 0 00-1-1H8a1 1 0 00-1 1v4.01" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <button
              onClick={() => router.push("/products")}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile Cart Items */}
            {cart.map((item) => (
              <div key={item.productId} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-2xl font-bold text-green-600">₪{item.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="bg-white text-gray-700 w-10 h-10 rounded-xl hover:bg-gray-100 transition-all shadow-sm font-semibold"
                    >
                      -
                    </button>
                    <span className="font-bold text-lg text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="bg-white text-gray-700 w-10 h-10 rounded-xl hover:bg-gray-100 transition-all shadow-sm font-semibold"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="font-bold text-lg text-gray-900">₪{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({getTotalItems()})</span>
                  <span className="font-semibold">₪{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-green-600">₪{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="w-full mt-6 bg-green-500 text-white py-4 px-4 rounded-xl font-bold text-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Order will be sent to distributor for processing
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
