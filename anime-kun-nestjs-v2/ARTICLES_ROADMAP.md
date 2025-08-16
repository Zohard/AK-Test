# Articles System Implementation Roadmap

## Phase 8: Articles System (Webzine)

### 8.1 Core Articles Module

#### 8.1.1 Database Schema Analysis
- ✅ Analyzed webzine tables structure:
  - `ak_webzine_articles` - Main articles table
  - `ak_webzine_categories` - Article categories
  - `ak_webzine_art2cat` - Article-category relationships
  - `ak_webzine_com` - Article comments
  - `ak_webzine_img` - Article images
  - `ak_webzine_sous_categories` - Sub-categories
  - `ak_webzine_to_fiches` - Article-content relationships
  - `ak_webzine_une` - Featured articles

#### 8.1.2 Prisma Schema Integration
- [ ] Add Prisma models for webzine tables
- [ ] Define relationships between articles, categories, comments
- [ ] Set up proper foreign key constraints
- [ ] Generate Prisma client with new models

#### 8.1.3 Core Articles Service
- [ ] Create `ArticlesService` with CRUD operations
- [ ] Implement article creation with rich text content
- [ ] Add article status management (draft, published, archived)
- [ ] Implement article search and filtering
- [ ] Add article statistics (views, comments count)

#### 8.1.4 Articles DTOs
- [ ] `CreateArticleDto` - Article creation
- [ ] `UpdateArticleDto` - Article updates
- [ ] `ArticleQueryDto` - Search and filtering
- [ ] `ArticleResponseDto` - API responses
- [ ] `PublishArticleDto` - Publishing workflow

### 8.2 Categories Management

#### 8.2.1 Categories Service
- [ ] Create `CategoriesService` for category management
- [ ] Implement category CRUD operations
- [ ] Add sub-categories support
- [ ] Category hierarchy management
- [ ] Category statistics

#### 8.2.2 Category DTOs
- [ ] `CreateCategoryDto`
- [ ] `UpdateCategoryDto`
- [ ] `CategoryQueryDto`
- [ ] `CategoryResponseDto`

### 8.3 Comments System

#### 8.3.1 Comments Service
- [ ] Create `CommentsService` for article comments
- [ ] Implement comment CRUD operations
- [ ] Add comment moderation system
- [ ] Nested comments support (replies)
- [ ] Comment spam protection

#### 8.3.2 Comment DTOs
- [ ] `CreateCommentDto`
- [ ] `UpdateCommentDto`
- [ ] `CommentQueryDto`
- [ ] `ModerateCommentDto`

### 8.4 Articles Controller (Public API)

#### 8.4.1 Public Endpoints
- [ ] `GET /api/articles` - List published articles
- [ ] `GET /api/articles/:id` - Get article details
- [ ] `GET /api/articles/category/:categoryId` - Articles by category
- [ ] `GET /api/articles/search` - Search articles
- [ ] `GET /api/articles/featured` - Featured articles
- [ ] `POST /api/articles/:id/view` - Track article views

#### 8.4.2 Public Comments Endpoints
- [ ] `GET /api/articles/:id/comments` - Get article comments
- [ ] `POST /api/articles/:id/comments` - Add comment (auth required)
- [ ] `PUT /api/articles/comments/:commentId` - Update own comment
- [ ] `DELETE /api/articles/comments/:commentId` - Delete own comment

### 8.5 Admin Articles Management

#### 8.5.1 Admin Articles Controller
- [ ] `GET /api/admin/articles` - List all articles (with drafts)
- [ ] `POST /api/admin/articles` - Create article (writers only)
- [ ] `GET /api/admin/articles/:id` - Get article (including drafts)
- [ ] `PUT /api/admin/articles/:id` - Update article (author/admin)
- [ ] `DELETE /api/admin/articles/:id` - Delete article (admin only)
- [ ] `PUT /api/admin/articles/:id/publish` - Publish article
- [ ] `PUT /api/admin/articles/:id/unpublish` - Unpublish article
- [ ] `GET /api/admin/articles/stats` - Articles statistics

#### 8.5.2 Admin Categories Controller
- [ ] `GET /api/admin/categories` - List categories
- [ ] `POST /api/admin/categories` - Create category (admin only)
- [ ] `PUT /api/admin/categories/:id` - Update category (admin only)
- [ ] `DELETE /api/admin/categories/:id` - Delete category (admin only)

#### 8.5.3 Admin Comments Moderation
- [ ] `GET /api/admin/comments` - List all comments
- [ ] `GET /api/admin/comments/pending` - Pending moderation
- [ ] `PUT /api/admin/comments/:id/approve` - Approve comment
- [ ] `PUT /api/admin/comments/:id/reject` - Reject comment
- [ ] `DELETE /api/admin/comments/:id` - Delete comment

### 8.6 Permission System

#### 8.6.1 User Roles for Articles
- [ ] **Reader** - Can read published articles, add comments
- [ ] **Writer** - Can create/edit own articles, manage own comments
- [ ] **Editor** - Can edit any article, moderate comments
- [ ] **Admin** - Full access to articles, categories, comments

#### 8.6.2 Guards and Decorators
- [ ] `@CanWriteArticles()` - Writer/Editor/Admin roles
- [ ] `@CanEditArticle()` - Author or Editor/Admin
- [ ] `@CanModerateComments()` - Editor/Admin roles
- [ ] `@CanManageCategories()` - Admin only
- [ ] Article ownership verification

### 8.7 Media Integration

#### 8.7.1 Article Images
- [ ] Integrate with existing Media module
- [ ] Support for article cover images
- [ ] Rich text editor image uploads
- [ ] Image gallery for articles
- [ ] Image optimization and resizing

#### 8.7.2 Article-Content Relationships
- [ ] Link articles to anime/manga (ak_webzine_to_fiches)
- [ ] Related content suggestions
- [ ] Content tagging system
- [ ] Cross-reference management

### 8.8 Rich Text Editor Support

#### 8.8.1 Content Management
- [ ] HTML content sanitization
- [ ] Markdown support (optional)
- [ ] Rich text formatting preservation
- [ ] Content validation and length limits
- [ ] Auto-save drafts functionality

#### 8.8.2 SEO Features
- [ ] Meta descriptions management
- [ ] URL slugs generation
- [ ] Tags management
- [ ] Social media preview generation

### 8.9 Featured Articles System

#### 8.9.1 Homepage Integration
- [ ] Featured articles management (ak_webzine_une)
- [ ] Article spotlight rotation
- [ ] Featured articles API endpoints
- [ ] Admin interface for featuring articles

### 8.10 Analytics and Reporting

#### 8.10.1 Article Metrics
- [ ] View tracking and analytics
- [ ] Popular articles tracking
- [ ] Author performance metrics
- [ ] Category performance analysis
- [ ] Comment engagement metrics

#### 8.10.2 Admin Dashboard
- [ ] Articles overview dashboard
- [ ] Writing activity reports
- [ ] Comment moderation queue
- [ ] Popular content insights

### 8.11 Testing Suite

#### 8.11.1 Unit Tests
- [ ] Articles service tests
- [ ] Categories service tests
- [ ] Comments service tests
- [ ] Permission guards tests

#### 8.11.2 Integration Tests
- [ ] Articles API endpoints
- [ ] Admin management endpoints
- [ ] Comment moderation flow
- [ ] Media integration tests

#### 8.11.3 E2E Tests
- [ ] Complete article lifecycle
- [ ] Publishing workflow
- [ ] Comment moderation process
- [ ] Multi-user collaboration

### 8.12 Documentation

#### 8.12.1 API Documentation
- [ ] Swagger documentation for all endpoints
- [ ] Permission requirements documentation
- [ ] Response examples and schemas
- [ ] Error handling documentation

#### 8.12.2 User Guides
- [ ] Writer's guide for article creation
- [ ] Editor's guide for content management
- [ ] Admin guide for system management
- [ ] Comment moderation guidelines

## Implementation Order

### Phase 8.1: Core Foundation (Week 1)
1. Prisma schema integration
2. Basic Articles service and DTOs
3. Core CRUD operations
4. Basic API endpoints

### Phase 8.2: Categories & Comments (Week 2)
1. Categories management system
2. Comments system with moderation
3. Article-category relationships
4. Basic admin endpoints

### Phase 8.3: Permissions & Security (Week 3)
1. Role-based access control
2. Article ownership verification
3. Permission guards implementation
4. Security validations

### Phase 8.4: Advanced Features (Week 4)
1. Rich text editor integration
2. Media and image management
3. Featured articles system
4. Analytics and reporting

### Phase 8.5: Testing & Documentation (Week 5)
1. Comprehensive testing suite
2. API documentation
3. User guides and workflows
4. Performance optimization

## Technical Considerations

### Database Optimization
- Add proper indexes for article queries
- Implement full-text search for content
- Optimize comment pagination
- Cache frequently accessed articles

### Security Measures
- Content sanitization to prevent XSS
- Rate limiting for article creation
- Image upload security validation
- Comment spam protection

### Performance Features
- Article content caching
- Lazy loading for comments
- Image lazy loading and optimization
- Database query optimization

### Scalability Planning
- CDN integration for media files
- Database connection pooling
- Microservice architecture preparation
- Monitoring and logging integration

## Success Metrics

- [ ] Complete CRUD operations for articles
- [ ] Functional permission system
- [ ] Comment moderation workflow
- [ ] Media integration working
- [ ] All tests passing (>90% coverage)
- [ ] API documentation complete
- [ ] Performance benchmarks met
- [ ] Security audit passed