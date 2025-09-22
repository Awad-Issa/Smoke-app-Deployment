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
    stock: "",
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
          stock: parseInt(formData.stock),
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
      stock: product.stock.toString(),
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
    setFormData({ name: "", price: "", stock: "", description: "", image: "" })
    setEditingProduct(null)
    setShowAddForm(false)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Products Management</h1>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            📦 Distributor: {session?.user?.email}
          </span>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => router.push("/distributor/supermarkets")}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            View Supermarkets
          </button>
          <button
            onClick={() => router.push("/distributor/orders")}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            View Orders
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Product
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <div className="mt-2">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEw0NCA0NEwyMCA0NFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.stock}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {product.description || "No description"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found. Add your first product to get started.
          </div>
        )}
      </div>
    </div>
  )
}
