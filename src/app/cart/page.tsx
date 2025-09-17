"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
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

    const item = cart.find(item => item.productId === productId)
    if (item && quantity > item.stock) {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <button
          onClick={() => router.push("/products")}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Continue Shopping
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Cart Items</h2>
              </div>
              <div className="divide-y">
                {cart.map((item) => (
                  <div key={item.productId} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium">{item.name}</h3>
                        <p className="text-gray-600">${item.price.toFixed(2)} each</p>
                        <p className="text-sm text-gray-500">Stock: {item.stock}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-300"
                            disabled={item.quantity >= item.stock}
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Order Summary</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Items ({getTotalItems()})</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                  className="w-full mt-6 bg-green-500 text-white py-3 px-4 rounded font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </button>
                <p className="text-sm text-gray-500 mt-3 text-center">
                  Order will be sent to distributor for processing
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
