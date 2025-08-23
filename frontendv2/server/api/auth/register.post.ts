export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  // Validate input
  const requiredFields = ['pseudo', 'email', 'password', 'confirmPassword', 'agreeToTerms']
  const missingFields = requiredFields.filter(field => !body[field])
  
  if (missingFields.length > 0) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'All fields are required',
        field: missingFields[0]
      },
      timestamp: new Date().toISOString()
    }
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Please enter a valid email address',
        field: 'email'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  // Validate password match
  if (body.password !== body.confirmPassword) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'PASSWORD_MISMATCH',
        message: 'Passwords do not match',
        field: 'confirmPassword'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  // Validate password strength
  if (body.password.length < 8) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 8 characters long',
        field: 'password'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  // Validate username
  if (body.pseudo.length < 3 || body.pseudo.length > 20) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'INVALID_USERNAME',
        message: 'Username must be between 3 and 20 characters',
        field: 'pseudo'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  // Validate terms agreement
  if (!body.agreeToTerms) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'TERMS_NOT_ACCEPTED',
        message: 'You must agree to the terms and conditions',
        field: 'agreeToTerms'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Call the NestJS backend for registration
    const backendUrl = `${config.public.apiBase}/auth/register`
    
    const response = await $fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        pseudo: body.pseudo,
        email: body.email,
        password: body.password,
        agreeToTerms: body.agreeToTerms
      }
    })
    
    // Transform backend response to frontend format
    const authResponse = {
      success: true,
      data: {
        user: {
          id: response.user?.id || response.id,
          pseudo: response.user?.pseudo || response.pseudo || response.username,
          email: response.user?.email || response.email,
          avatar: response.user?.avatar || response.avatar,
          bio: response.user?.bio || response.bio || '',
          isVerified: response.user?.isVerified || response.verified || false,
          joinDate: response.user?.joinDate || response.createdAt,
          reviewsCount: 0,
          averageRating: 0,
          permissions: response.user?.permissions || response.permissions || ['create_review'],
          preferences: {
            receiveNotifications: true,
            profilePublic: true,
            allowComments: true,
            theme: 'auto'
          }
        },
        token: response.token || response.accessToken,
        refreshToken: response.refreshToken
      },
      timestamp: new Date().toISOString()
    }
    
    // Set secure cookies
    setCookie(event, 'auth-token', authResponse.data.token, {
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day for new registrations
      httpOnly: false
    })
    
    if (authResponse.data.refreshToken) {
      setCookie(event, 'refresh-token', authResponse.data.refreshToken, {
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true
      })
    }
    
    return authResponse
    
  } catch (error: any) {
    console.error('Register API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'REGISTER_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Registration failed'
    let errorField = error.response?.data?.field
    
    // Handle specific error cases
    if (statusCode === 409) {
      if (errorMessage.toLowerCase().includes('email')) {
        errorCode = 'EMAIL_EXISTS'
        errorMessage = 'An account with this email already exists'
        errorField = 'email'
      } else if (errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('pseudo')) {
        errorCode = 'USERNAME_EXISTS'
        errorMessage = 'This username is already taken'
        errorField = 'pseudo'
      }
    } else if (statusCode === 429) {
      errorCode = 'TOO_MANY_ATTEMPTS'
      errorMessage = 'Too many registration attempts. Please try again later.'
    }
    
    setResponseStatus(event, statusCode)
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        field: errorField,
        details: error.response?.data
      },
      timestamp: new Date().toISOString()
    }
  }
})