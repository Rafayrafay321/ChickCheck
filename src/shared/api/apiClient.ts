import { ApiError } from './errors'
import type { ApiResponse } from '@/shared/types'

// Base URL allows environment-based configuration.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Extends the native fetch API Config 
export interface RequestConfig extends RequestInit {
  timeoutMs?: number
}

/**
 * Central HTTP client engine for the FSD architecture.
 *
 * Features:
 * 1. Automatic timeout handling (via AbortController).
 * 2. Request Interceptors (attaching default headers/tokens).
 * 3. Response Interceptors (normalizing failures into ApiError, unwrapping success payload).
 */
export const apiClient = async <T = unknown> (
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { timeoutMs = 10000, headers: customHeaders, ...rest } = config

  // --- 1. Request Interceptor Logic ---
  const headers = new Headers(customHeaders)
  headers.set('Content-Type', 'application/json')
  
  // Simulated Token Injection Interceptor
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  // --- 2. Timeout Logic ---
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...rest,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // --- 3. Response Interceptor Logic ---
    if (!response.ok) {
      let errorBody
      try {
        errorBody = await response.json()
      } catch {
        errorBody = await response.text()
      }
      throw new ApiError(response.status, errorBody, `HTTP Error: ${response.statusText}`)
    }

    const json = await response.json() as ApiResponse<T>

    if (!json.success) {
       throw new ApiError(
         response.status,
         json,
         json.error || 'Unknown application error occurred'
       )
    }

    return json.data as T

  } catch (error: unknown) {
    clearTimeout(timeoutId)

    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, null, 'Request timed out')
    }

    throw new ApiError(0, null, error instanceof Error ? error.message : 'Network error occurred')
  }
}
