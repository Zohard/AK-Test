# 📋 Articles Page Implementation Roadmap

## 🔍 **Current State Analysis**

### ✅ **Backend - FULLY IMPLEMENTED**
- **Complete Articles API** in `/modules/articles/`
- **Full CRUD operations** with proper authentication & permissions
- **Categories system** with dedicated service
- **Comments system** for articles
- **Article search** and filtering
- **SEO-friendly slugs** (`/articles/slug/:niceUrl`)
- **View tracking** and analytics
- **Admin panel** integration
- **Featured articles** support

### ✅ **Type Definitions - READY**
- Article interfaces defined in `frontendv2/types/index.ts`
- Query parameters and DTOs ready

### ❌ **Frontend - MISSING**
- No articles pages in frontendv2
- No article components
- No article API composables

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Core Infrastructure** ⚡ *Priority: HIGH*

#### **1.1 API Composables**
```typescript
// composables/useArticlesAPI.ts
- fetchArticles(query: ArticleQueryParams)
- fetchArticleById(id: number) 
- fetchArticleBySlug(niceUrl: string)
- fetchFeaturedArticles(limit?: number)
- fetchArticlesByCategory(categoryId: number)
- fetchArticlesByAuthor(authorId: number)
- searchArticles(query: string)
- trackArticleView(id: number)
```

#### **1.2 Categories API**
```typescript
// composables/useCategoriesAPI.ts  
- fetchCategories()
- fetchCategoryById(id: number)
```

#### **1.3 Comments API**
```typescript
// composables/useCommentsAPI.ts
- fetchComments(articleId: number)
- createComment(articleId: number, content: string)
- deleteComment(id: number)
```

---

### **Phase 2: Core Components** ⚡ *Priority: HIGH*

#### **2.1 Article Card Components**
```vue
// components/articles/ArticleCard.vue
- Thumbnail image
- Title & excerpt
- Author info with avatar
- Publication date
- Category badge
- View count
- Comment count
- SEO-friendly links
```

```vue
// components/articles/ArticleCardGrid.vue
- Responsive grid layout
- Loading skeletons
- Pagination controls
```

#### **2.2 Article Content Components**
```vue
// components/articles/ArticleContent.vue
- Rich text content rendering
- Image galleries (imgunebig, imgunebig2)
- Social sharing buttons
- Print-friendly format
```

```vue
// components/articles/ArticleHeader.vue
- Hero image
- Title & subtitle
- Author profile card
- Publication date
- Category & tags
- View counter
```

#### **2.3 Navigation Components**
```vue
// components/articles/ArticleNavigation.vue
- Previous/Next article navigation
- Related articles sidebar
- Breadcrumb navigation
```

---

### **Phase 3: Page Implementation** ⚡ *Priority: HIGH*

#### **3.1 Articles List Page**
```vue
// pages/articles/index.vue
- Hero section with featured articles
- Category filter tabs
- Search functionality 
- Article grid with pagination
- SEO meta tags
- Loading states
```

**URL**: `/articles`

#### **3.2 Article Detail Page**
```vue
// pages/articles/[slug].vue  
- Full article content
- Author bio section
- Comments section
- Related articles
- Social sharing
- Print functionality
- SEO optimization
- View tracking
```

**URL**: `/articles/[nice-url-slug]`

#### **3.3 Category Page**
```vue
// pages/articles/category/[slug].vue
- Category description
- Articles filtered by category
- Category-specific SEO
```

**URL**: `/articles/category/[category-slug]`

#### **3.4 Author Page**  
```vue
// pages/articles/author/[id].vue
- Author profile & bio
- Articles by author
- Author statistics
```

**URL**: `/articles/author/[author-id]`

---

### **Phase 4: Advanced Features** ⚡ *Priority: MEDIUM*

#### **4.1 Search & Filters**
```vue
// components/articles/ArticleSearch.vue
- Real-time search
- Category filters  
- Date range filters
- Author filters
- Sort options (date, views, comments)
```

#### **4.2 Comments System**
```vue
// components/articles/CommentSection.vue
- Nested comment display
- Add comment form (authenticated users)
- Comment moderation
- Reply functionality
- Like/dislike system
```

#### **4.3 Social Features**
- Social media sharing
- Reading time estimation  
- Bookmark functionality
- Reading progress indicator

---

### **Phase 5: SEO & Performance** ⚡ *Priority: MEDIUM*

#### **5.1 SEO Optimization**
- Dynamic meta tags per article
- Open Graph tags
- Twitter Cards
- JSON-LD structured data
- Sitemap integration
- Canonical URLs

#### **5.2 Performance**
- Image lazy loading
- Content pagination for long articles
- Caching strategies
- PWA features

---

### **Phase 6: Admin Features** ⚡ *Priority: LOW*

#### **6.1 Content Management** *(Optional)*
```vue  
// pages/admin/articles/
- Article creation/editing
- WYSIWYG editor
- Image upload
- Category management
- Publishing workflow
```

---

## 📁 **File Structure**

```
frontendv2/
├── pages/
│   └── articles/
│       ├── index.vue              # Articles list
│       ├── [slug].vue             # Article detail  
│       ├── category/
│       │   └── [slug].vue         # Category page
│       └── author/
│           └── [id].vue           # Author page
├── components/
│   └── articles/
│       ├── ArticleCard.vue
│       ├── ArticleCardGrid.vue
│       ├── ArticleContent.vue
│       ├── ArticleHeader.vue
│       ├── ArticleNavigation.vue
│       ├── ArticleSearch.vue
│       └── CommentSection.vue
├── composables/
│   ├── useArticlesAPI.ts
│   ├── useCategoriesAPI.ts
│   └── useCommentsAPI.ts
└── assets/
    └── css/
        └── articles.css           # Article-specific styles
```

---

## 🎯 **Implementation Priority**

### **Week 1: Foundation**
- [ ] API composables (useArticlesAPI, useCategoriesAPI)
- [ ] Basic ArticleCard component
- [ ] Articles index page with basic listing

### **Week 2: Core Features**  
- [ ] Article detail page with full content display
- [ ] Article navigation and related articles
- [ ] Category filtering
- [ ] Search functionality

### **Week 3: Polish**
- [ ] Comments system integration
- [ ] SEO optimization
- [ ] Performance improvements
- [ ] Mobile responsiveness

---

## 🔗 **API Endpoints Available**

```
GET    /api/articles                    # List published articles
GET    /api/articles/featured           # Featured articles  
GET    /api/articles/:id                # Get by ID
GET    /api/articles/slug/:niceUrl      # Get by slug ⭐
GET    /api/articles/category/:categoryId # By category
GET    /api/articles/author/:authorId   # By author
GET    /api/articles/search             # Search articles
POST   /api/articles/:id/view           # Track view
```

---

## 💡 **Key Implementation Notes**

1. **SEO URLs**: Use `/articles/slug/:niceUrl` endpoint for SEO-friendly URLs
2. **Image Handling**: Backend provides `img`, `imgunebig`, `imgunebig2` fields
3. **View Tracking**: Implement view tracking on article page load
4. **Comments**: Separate API endpoints for comments management
5. **Categories**: Full category system with hierarchy support
6. **Author Profiles**: Link to user profiles with article counts

---

## 📝 **API Response Format Reference**

### Articles List Response
```json
{
  "articles": [
    {
      "idArt": 559,
      "titre": "Article Title",
      "niceUrl": "article-slug",
      "date": "2013-11-13T17:00:00.000Z",
      "img": "http://example.com/image.jpg",
      "imgunebig": "http://example.com/image-big.jpg", 
      "imgunebig2": "http://example.com/image-big2.jpg",
      "auteur": 12952,
      "metaDescription": "Article excerpt...",
      "tags": "tag1, tag2, tag3",
      "nbCom": 0,
      "nbClics": 202,
      "statut": 1,
      "author": {
        "idMember": 12952,
        "memberName": "Author Name",
        "realName": "Real Name"
      },
      "categories": [null],
      "commentCount": 0,
      "imageCount": 15
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 169,
    "totalItems": 507,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## ✅ **Implementation Progress**

### Phase 1: Core Infrastructure
- [ ] `composables/useArticlesAPI.ts`
- [ ] `composables/useCategoriesAPI.ts`  
- [ ] `composables/useCommentsAPI.ts`

### Phase 2: Core Components
- [ ] `components/articles/ArticleCard.vue`
- [ ] `components/articles/ArticleCardGrid.vue`
- [ ] `components/articles/ArticleContent.vue`
- [ ] `components/articles/ArticleHeader.vue`
- [ ] `components/articles/ArticleNavigation.vue`

### Phase 3: Page Implementation
- [ ] `pages/articles/index.vue`
- [ ] `pages/articles/[slug].vue`
- [ ] `pages/articles/category/[slug].vue`
- [ ] `pages/articles/author/[id].vue`

### Phase 4: Advanced Features
- [ ] Search & Filters
- [ ] Comments System
- [ ] Social Features

### Phase 5: SEO & Performance
- [ ] SEO Optimization
- [ ] Performance Features

### Phase 6: Admin Features
- [ ] Content Management (Optional)

---

*This roadmap provides a complete implementation plan for the articles system, leveraging the already-complete backend infrastructure. The frontend implementation can be done incrementally, starting with basic article listing and progressing to advanced features.*

---

**Last Updated**: August 20, 2025  
**Status**: Ready for Implementation  
**Backend**: ✅ Complete  
**Frontend**: 🚧 Pending Implementation