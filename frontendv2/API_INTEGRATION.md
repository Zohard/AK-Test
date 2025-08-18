# API Integration Guide - Frontend V2 → NestJS

## 🔗 Current Integration Status

### ✅ **Connected to Real NestJS API**

The frontendv2 is now **fully integrated** with your NestJS API and uses real data from the following endpoints:

## 📡 API Endpoints Used

### **Authentication**
- `POST /auth/login` - User login with JWT
- `POST /auth/register` - User registration  
- `POST /auth/refresh` - Token refresh
- `GET /auth/verify` - Token verification
- `GET /auth/profile` - User profile
- `POST /auth/logout` - Logout

### **Animes**
- `GET /animes` - List animes with filters and pagination
- `GET /animes/:id` - Get anime details
- `GET /animes/top` - Top rated animes
- `GET /animes/genres` - Available genres
- `GET /animes/genre/:genre` - Animes by genre
- `GET /animes/autocomplete` - Search autocomplete
- `GET /animes/:id/tags` - Anime tags
- `GET /animes/:id/relations` - Anime relations
- `POST /animes` - Create anime (authenticated)
- `PATCH /animes/:id` - Update anime (authenticated)
- `DELETE /animes/:id` - Delete anime (admin only)

## 🛠️ Implementation Details

### **API Configuration**
```typescript
// nuxt.config.ts
runtimeConfig: {
  public: {
    apiBase: process.env.API_BASE_URL || 'http://localhost:3000'
  }
}
```

### **Authentication Flow**
```typescript
// stores/auth.ts
- JWT access tokens with automatic refresh
- Secure token storage in localStorage
- Auto-retry on 401 responses
- Automatic redirect to login on auth failure
```

### **HTTP Interceptor**
```typescript
// plugins/api-interceptor.client.ts
- Automatic token injection in requests
- 401 error handling with token refresh
- Graceful fallback to login page
```

### **API Composables**
```typescript
// composables/useAnimeAPI.ts
- Type-safe API calls
- Error handling
- Loading states
- Response transformation
```

## 🔧 Configuration Required

### **1. Start NestJS API**
Ensure your NestJS API is running on port 3000:
```bash
cd anime-kun-nestjs-v2
npm run dev
```

### **2. Environment Variables**
Create `.env` in frontendv2:
```env
API_BASE_URL=http://localhost:3000
```

### **3. CORS Configuration**
Ensure your NestJS API allows requests from `http://localhost:3001`:
```typescript
// main.ts in NestJS
app.enableCors({
  origin: ['http://localhost:3001'],
  credentials: true
})
```

## 🎯 Pages Connected to Real API

### ✅ **Fully Connected**
- **Authentication** (`/login`, `/register`) - Real JWT auth
- **Animes List** (`/animes`) - Real anime data with filters
- **Home Page** (`/`) - Real stats and latest animes
- **Search** - Real autocomplete from API

### 🚧 **Needs Endpoints** (will fallback gracefully)
- **Manga endpoints** - Not implemented in NestJS yet
- **Reviews endpoints** - Not implemented in NestJS yet  
- **Articles endpoints** - Not implemented in NestJS yet

## 🔍 Error Handling

### **API Errors**
The frontend handles these scenarios gracefully:

1. **404 Endpoints** - Shows helpful messages
2. **Network Errors** - Retry options provided
3. **Auth Errors** - Automatic token refresh or redirect
4. **Server Errors** - User-friendly error messages

### **Development Debugging**
All API errors are logged to console with details:
```javascript
console.error('API Error:', {
  endpoint: '/animes',
  method: 'GET',
  error: { message, status, data }
})
```

## 🚀 Real Data Features

### **Animes Page**
- Real anime data from your database
- Live search and filtering
- Actual pagination based on API response
- Real image URLs through media endpoints

### **Authentication**
- Real user registration and login
- JWT tokens stored securely
- Automatic session management
- Real user permissions (admin detection)

### **Search**
- Real-time autocomplete from API
- Actual search results
- Proper image handling

## 📊 Response Format Handling

The frontend automatically handles different NestJS response formats:

```typescript
// Handles both formats:
response.data || response          // Array or paginated response
response.meta?.total || 0          // Pagination metadata
response.meta?.totalPages || 1     // Page calculations
```

## 🔐 Authentication Headers

All authenticated requests automatically include:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 🎨 Image Handling

Images are handled through the NestJS media endpoints:
```typescript
// Anime images
/media/anime/{filename}

// Manga images  
/media/manga/{filename}

// Avatars
/avatars/{filename}
```

## 🚦 API Status Indicators

The frontend provides visual feedback:
- **Loading states** during API calls
- **Error messages** with retry options
- **Empty states** when no data is available
- **Success indicators** for actions

## 🔄 Data Synchronization

- **Real-time updates** when data changes
- **Optimistic updates** for better UX
- **Conflict resolution** for concurrent edits
- **Cache invalidation** after mutations

## 🧪 Testing the Integration

1. **Start NestJS API**: `npm run dev` (port 3000)
2. **Start Frontend**: `npm run dev` (port 3001)  
3. **Test Authentication**: Register/login with real accounts
4. **Test Animes**: Browse real anime data
5. **Test Search**: Use autocomplete with real results

## 🎯 Next Phase: Enhanced Features

With real API integration complete, next steps include:

1. **Detail Pages** - Individual anime/manga pages
2. **Review System** - Create and manage reviews  
3. **User Profiles** - User dashboard and settings
4. **Admin Panel** - Content management interface
5. **Real-time Features** - Live notifications and updates

The foundation is now solid for advanced features! 🚀