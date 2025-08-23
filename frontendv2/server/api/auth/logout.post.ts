export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Get auth token from header or cookie
  const authToken = getHeader(event, 'authorization') || getCookie(event, 'auth-token')
  
  if (!authToken) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authentication token provided'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Call the NestJS backend to invalidate the token
    const backendUrl = `${config.public.apiBase}/auth/logout`
    
    await $fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
      }
    })
    
  } catch (error: any) {
    // Log the error but continue with client-side logout
    console.warn('Backend logout failed:', error)
  }
  
  // Clear authentication cookies regardless of backend response
  setCookie(event, 'auth-token', '', {
    secure: true,
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    httpOnly: false
  })
  
  setCookie(event, 'refresh-token', '', {
    secure: true,
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    httpOnly: true
  })
  
  return {
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  }
})