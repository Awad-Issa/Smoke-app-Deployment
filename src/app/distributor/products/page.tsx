"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  description?: string
  image?: string
  createdAt: string
}

export default function DistributorProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: ""
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DISTRIBUTOR") {
      router.push("/login")
      return
    }
    fetchProducts()
  }, [session, status, router])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/distributor/products")
      const data = await response.json()
      
      // Handle errors
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingProduct 
        ? `/api/distributor/products/${editingProduct.id}`
        : "/api/distributor/products"
      
      const method = editingProduct ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          image: formData.image
        })
      })

      if (response.ok) {
        resetForm()
        fetchProducts()
      }
    } catch (error) {
      console.error("Error saving product:", error)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || "",
      image: product.image || ""
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    
    try {
      const response = await fetch(`/api/distributor/products/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", price: "", description: "", image: "" })
    setEditingProduct(null)
    setShowAddForm(false)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Updated */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Products</h1>
              <p className="text-sm text-gray-600">{products.length} products</p>
            </div>
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
      </header>

      {/* Mobile Navigation */}
      <nav className="bg-white border-b">
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => router.push("/distributor/supermarkets")}
              className="flex-shrink-0 bg-purple-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-600 transition-all"
            >
              📍 Supermarkets
            </button>
            <button
              onClick={() => router.push("/distributor/orders")}
              className="flex-shrink-0 bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition-all"
            >
              📋 Orders
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-shrink-0 bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-all"
            >
              ➕ Add Product
            </button>
          </div>
        </div>
      </nav>

      <div className="px-4 py-4">

        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-4 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="w-full">
              <div className="space-y-4 mb-4 w-full">
                <div className="w-full">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    📦 Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="w-full">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    💰 Price (₪)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="w-full">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    🖼️ Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image && (
                    <div className="mt-3">
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                
              </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-600 transition-all"
              >
                {editingProduct ? "✏️ Update Product" : "➕ Add Product"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all"
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">Add your first product to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
            >
              ➕ Add Your First Product
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 overflow-hidden">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2IiByeD0iMTIiLz4KPHA+8J+Tty8vcD4KPC9zdmc+'
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                        <span className="text-gray-400 text-2xl">📦</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate">{product.name}</h3>
                        <p className="text-2xl font-bold text-green-600">₪{product.price.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                          title="Edit product"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete product"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
