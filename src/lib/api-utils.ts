import { signOut } from "next-auth/react"

/**
 * Enhanced fetch wrapper that handles account deactivation
 * Automatically signs out user if they receive a deactivation error
 */
export async function fetchWithAuth(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  
  // Check if account has been deactivated
  if (response.status === 403) {
    try {
      const data = await response.clone().json()
      if (data.code === "ACCOUNT_DEACTIVATED") {
        // Account has been deactivated - sign out and redirect to login
        alert(data.message || "Your account has been deactivated. You will be logged out.")
        await signOut({ 
          callbackUrl: "/login?error=account_deactivated",
          redirect: true 
        })
        return response
      }
    } catch (error) {
      // If we can't parse the response, continue with normal error handling
    }
  }
  
  return response
}

/**
 * API error handler that checks for deactivation
 */
export function handleApiError(error: unknown, response?: Response) {
  if (response?.status === 403) {
    // This might be an account deactivation - the fetchWithAuth should have handled it
    // but if we're here, it means the deactivation wasn't caught
    window.location.href = "/login?error=account_deactivated"
    return
  }
  
  // Handle other errors normally
  console.error("API Error:", error)
}




