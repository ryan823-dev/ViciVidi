/**
 * Authentication utilities
 * Simple auth wrapper for API routes
 */

import { NextRequest } from 'next/server'
import { getUser } from './supabase/server'

export async function auth() {
  try {
    const user = await getUser()
    return user ? { user } : null
  } catch {
    return null
  }
}

export async function getAuthUser(request: NextRequest) {
  // Simple auth check - can be extended with proper session management
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  
  // For development, return a mock user
  if (process.env.NODE_ENV === 'development') {
    return { email: 'dev@example.com', id: 'dev-user' }
  }
  
  return null
}