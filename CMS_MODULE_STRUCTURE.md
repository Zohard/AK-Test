# WordPress-Equivalent CMS Module Structure

## Module Organization

This document outlines the recommended module structure for implementing the WordPress-equivalent CMS using NestJS architecture.

```
src/modules/cms/
├── posts/                      # Posts Management
│   ├── dto/
│   │   ├── create-post.dto.ts
│   │   ├── update-post.dto.ts
│   │   ├── post-query.dto.ts
│   │   └── post-response.dto.ts
│   ├── entities/
│   │   └── post.entity.ts
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   └── posts.module.ts
├── pages/                      # Pages Management
│   ├── dto/
│   │   ├── create-page.dto.ts
│   │   ├── update-page.dto.ts
│   │   └── page-query.dto.ts
│   ├── pages.controller.ts
│   ├── pages.service.ts
│   └── pages.module.ts
├── comments/                   # Comments System
│   ├── dto/
│   │   ├── create-comment.dto.ts
│   │   ├── update-comment.dto.ts
│   │   └── comment-query.dto.ts
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   └── comments.module.ts
├── media/                      # Media Management
│   ├── dto/
│   │   ├── upload-media.dto.ts
│   │   └── media-query.dto.ts
│   ├── media.controller.ts
│   ├── media.service.ts
│   └── media.module.ts
├── taxonomies/                 # Categories, Tags, Custom Taxonomies
│   ├── dto/
│   │   ├── create-taxonomy.dto.ts
│   │   ├── update-taxonomy.dto.ts
│   │   └── taxonomy-query.dto.ts
│   ├── taxonomies.controller.ts
│   ├── taxonomies.service.ts
│   └── taxonomies.module.ts
├── users/                      # User Management
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   └── user-query.dto.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── themes/                     # Theme System
│   ├── dto/
│   │   ├── theme-config.dto.ts
│   │   └── customize-theme.dto.ts
│   ├── themes.controller.ts
│   ├── themes.service.ts
│   ├── theme-loader.service.ts
│   └── themes.module.ts
├── plugins/                    # Plugin System
│   ├── dto/
│   │   ├── plugin-config.dto.ts
│   │   └── plugin-settings.dto.ts
│   ├── plugins.controller.ts
│   ├── plugins.service.ts
│   ├── plugin-loader.service.ts
│   └── plugins.module.ts
├── widgets/                    # Widget System
│   ├── dto/
│   │   ├── create-widget.dto.ts
│   │   └── widget-settings.dto.ts
│   ├── widgets.controller.ts
│   ├── widgets.service.ts
│   └── widgets.module.ts
├── menus/                      # Navigation Menus
│   ├── dto/
│   │   ├── create-menu.dto.ts
│   │   ├── menu-item.dto.ts
│   │   └── menu-query.dto.ts
│   ├── menus.controller.ts
│   ├── menus.service.ts
│   └── menus.module.ts
├── options/                    # Site Settings
│   ├── dto/
│   │   ├── update-options.dto.ts
│   │   └── options-query.dto.ts
│   ├── options.controller.ts
│   ├── options.service.ts
│   └── options.module.ts
├── seo/                        # SEO Management
│   ├── dto/
│   │   ├── seo-data.dto.ts
│   │   └── sitemap.dto.ts
│   ├── seo.controller.ts
│   ├── seo.service.ts
│   └── seo.module.ts
├── cache/                      # Caching System
│   ├── cache.service.ts
│   ├── cache.module.ts
│   └── interceptors/
│       └── cache.interceptor.ts
├── hooks/                      # WordPress-style Hook System
│   ├── hooks.service.ts
│   ├── action-hooks.service.ts
│   ├── filter-hooks.service.ts
│   └── hooks.module.ts
├── common/
│   ├── decorators/
│   │   ├── wp-hook.decorator.ts
│   │   ├── wp-filter.decorator.ts
│   │   └── wp-capability.decorator.ts
│   ├── guards/
│   │   ├── capability.guard.ts
│   │   └── post-access.guard.ts
│   ├── interceptors/
│   │   ├── cache.interceptor.ts
│   │   └── hook.interceptor.ts
│   └── pipes/
│       └── wp-validation.pipe.ts
├── cms.controller.ts           # Main CMS Controller
├── cms.service.ts              # Main CMS Service
└── cms.module.ts               # Main CMS Module
```

## Sample Implementation Files

### Main CMS Module
```typescript
// cms.module.ts
import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { PagesModule } from './pages/pages.module';
import { CommentsModule } from './comments/comments.module';
import { MediaModule } from './media/media.module';
import { TaxonomiesModule } from './taxonomies/taxonomies.module';
import { UsersModule } from './users/users.module';
import { ThemesModule } from './themes/themes.module';
import { PluginsModule } from './plugins/plugins.module';
import { WidgetsModule } from './widgets/widgets.module';
import { MenusModule } from './menus/menus.module';
import { OptionsModule } from './options/options.module';
import { SeoModule } from './seo/seo.module';
import { CacheModule } from './cache/cache.module';
import { HooksModule } from './hooks/hooks.module';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';

@Module({
  imports: [
    PostsModule,
    PagesModule,
    CommentsModule,
    MediaModule,
    TaxonomiesModule,
    UsersModule,
    ThemesModule,
    PluginsModule,
    WidgetsModule,
    MenusModule,
    OptionsModule,
    SeoModule,
    CacheModule,
    HooksModule,
  ],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
```

### Posts Module Example
```typescript
// posts/posts.module.ts
import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaService } from '../../../shared/services/prisma.service';
import { HooksModule } from '../hooks/hooks.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [HooksModule, CacheModule],
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
  exports: [PostsService],
})
export class PostsModule {}
```

### Posts Service Example
```typescript
// posts/posts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { HooksService } from '../hooks/hooks.service';
import { CacheService } from '../cache/cache.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dto';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private hooksService: HooksService,
    private cacheService: CacheService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: number) {
    // Apply pre-save filters (WordPress-style hooks)
    const filteredData = await this.hooksService.applyFilters(
      'wp_insert_post_data',
      createPostDto,
    );

    const post = await this.prisma.wpPost.create({
      data: {
        ...filteredData,
        postAuthor: authorId,
        postDate: new Date(),
        postDateGmt: new Date(),
        postModified: new Date(),
        postModifiedGmt: new Date(),
      },
      include: {
        author: {
          select: {
            idMember: true,
            memberName: true,
            emailAddress: true,
          },
        },
        comments: true,
        postMeta: true,
        termRelationships: {
          include: {
            termTaxonomy: {
              include: {
                term: true,
              },
            },
          },
        },
      },
    });

    // Trigger post-save actions
    await this.hooksService.doAction('wp_insert_post', post);

    // Clear related cache
    await this.cacheService.invalidateGroup('posts');

    return post;
  }

  async findAll(query: PostQueryDto) {
    const {
      page = 1,
      limit = 10,
      status = 'publish',
      author,
      category,
      tag,
      search,
      orderBy = 'postDate',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const cacheKey = `posts:${JSON.stringify(query)}`;

    // Check cache first
    let result = await this.cacheService.get(cacheKey);
    if (result) {
      return result;
    }

    const where: any = {
      postStatus: status,
      postType: 'post',
    };

    if (author) {
      where.postAuthor = author;
    }

    if (search) {
      where.OR = [
        { postTitle: { contains: search, mode: 'insensitive' } },
        { postContent: { contains: search, mode: 'insensitive' } },
        { postExcerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category || tag) {
      where.termRelationships = {
        some: {
          termTaxonomy: {
            ...(category && { taxonomy: 'category', term: { slug: category } }),
            ...(tag && { taxonomy: 'post_tag', term: { slug: tag } }),
          },
        },
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.wpPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        include: {
          author: {
            select: {
              idMember: true,
              memberName: true,
            },
          },
          termRelationships: {
            include: {
              termTaxonomy: {
                include: {
                  term: true,
                },
              },
            },
          },
          postMeta: true,
        },
      }),
      this.prisma.wpPost.count({ where }),
    ]);

    result = {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  async findOne(id: number) {
    const cacheKey = `post:${id}`;
    let post = await this.cacheService.get(cacheKey);

    if (!post) {
      post = await this.prisma.wpPost.findUnique({
        where: { ID: BigInt(id) },
        include: {
          author: {
            select: {
              idMember: true,
              memberName: true,
              realName: true,
            },
          },
          comments: {
            where: { commentApproved: '1' },
            include: {
              commentMeta: true,
            },
            orderBy: { commentDate: 'asc' },
          },
          postMeta: true,
          termRelationships: {
            include: {
              termTaxonomy: {
                include: {
                  term: true,
                },
              },
            },
          },
          mediaAttachment: true,
          revisions: {
            orderBy: { revisionDate: 'desc' },
            take: 10,
          },
        },
      });

      if (!post) {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }

      await this.cacheService.set(cacheKey, post, 600); // 10 minutes
    }

    // Apply content filters
    const filteredPost = await this.hooksService.applyFilters(
      'the_content',
      post,
    );

    // Track post view
    await this.hooksService.doAction('wp_head', post);

    return filteredPost;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number) {
    const existingPost = await this.findOne(id);

    // Check if user can edit this post
    const canEdit = await this.hooksService.applyFilters(
      'user_can_edit_post',
      existingPost.postAuthor === userId,
      userId,
      id,
    );

    if (!canEdit) {
      throw new ForbiddenException('You cannot edit this post');
    }

    // Create revision before updating
    await this.createRevision(id, userId);

    // Apply pre-update filters
    const filteredData = await this.hooksService.applyFilters(
      'wp_update_post_data',
      updatePostDto,
      existingPost,
    );

    const updatedPost = await this.prisma.wpPost.update({
      where: { ID: BigInt(id) },
      data: {
        ...filteredData,
        postModified: new Date(),
        postModifiedGmt: new Date(),
      },
      include: {
        author: true,
        comments: true,
        postMeta: true,
        termRelationships: {
          include: {
            termTaxonomy: {
              include: {
                term: true,
              },
            },
          },
        },
      },
    });

    // Trigger post-update actions
    await this.hooksService.doAction('post_updated', updatedPost, existingPost);

    // Clear cache
    await this.cacheService.delete(`post:${id}`);
    await this.cacheService.invalidateGroup('posts');

    return updatedPost;
  }

  async remove(id: number, userId: number) {
    const post = await this.findOne(id);

    // Check permissions
    const canDelete = await this.hooksService.applyFilters(
      'user_can_delete_post',
      post.postAuthor === userId,
      userId,
      id,
    );

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this post');
    }

    // Trigger before delete action
    await this.hooksService.doAction('before_delete_post', post);

    await this.prisma.wpPost.delete({
      where: { ID: BigInt(id) },
    });

    // Trigger after delete action
    await this.hooksService.doAction('deleted_post', id);

    // Clear cache
    await this.cacheService.delete(`post:${id}`);
    await this.cacheService.invalidateGroup('posts');

    return { message: 'Post deleted successfully' };
  }

  private async createRevision(postId: number, authorId: number) {
    const post = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(postId) },
      include: {
        postMeta: true,
      },
    });

    if (!post) return;

    await this.prisma.wpPostRevision.create({
      data: {
        postId: BigInt(postId),
        authorId,
        revisionContent: {
          title: post.postTitle,
          content: post.postContent,
          excerpt: post.postExcerpt,
          status: post.postStatus,
          meta: post.postMeta,
        },
        revisionType: 'manual',
      },
    });
  }

  // WordPress-style query methods
  async getRecentPosts(limit = 5) {
    return this.findAll({
      limit,
      status: 'publish',
      orderBy: 'postDate',
      order: 'desc',
    });
  }

  async getPostsByCategory(categorySlug: string, limit = 10) {
    return this.findAll({
      limit,
      category: categorySlug,
      status: 'publish',
    });
  }

  async getPostsByAuthor(authorId: number, limit = 10) {
    return this.findAll({
      limit,
      author: authorId,
      status: 'publish',
    });
  }

  async searchPosts(searchTerm: string, limit = 10) {
    return this.findAll({
      limit,
      search: searchTerm,
      status: 'publish',
    });
  }
}
```

### Posts Controller Example
```typescript
// posts/posts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CapabilityGuard } from '../common/guards/capability.guard';
import { RequireCapability } from '../common/decorators/wp-capability.decorator';

@ApiTags('CMS - Posts')
@Controller('cms/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  @RequireCapability('edit_posts')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiBearerAuth()
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postsService.create(createPostDto, req.user.idMember);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts with filtering' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  findAll(@Query() query: PostQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent posts' })
  @ApiResponse({ status: 200, description: 'Recent posts retrieved' })
  getRecentPosts(@Query('limit') limit?: number) {
    return this.postsService.getRecentPosts(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search posts' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  searchPosts(
    @Query('q') searchTerm: string,
    @Query('limit') limit?: number,
  ) {
    return this.postsService.searchPosts(searchTerm, limit);
  }

  @Get('category/:categorySlug')
  @ApiOperation({ summary: 'Get posts by category' })
  @ApiResponse({ status: 200, description: 'Category posts retrieved' })
  getPostsByCategory(
    @Param('categorySlug') categorySlug: string,
    @Query('limit') limit?: number,
  ) {
    return this.postsService.getPostsByCategory(categorySlug, limit);
  }

  @Get('author/:authorId')
  @ApiOperation({ summary: 'Get posts by author' })
  @ApiResponse({ status: 200, description: 'Author posts retrieved' })
  getPostsByAuthor(
    @Param('authorId', ParseIntPipe) authorId: number,
    @Query('limit') limit?: number,
  ) {
    return this.postsService.getPostsByAuthor(authorId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  @RequireCapability('edit_posts')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiBearerAuth()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    return this.postsService.update(id, updatePostDto, req.user.idMember);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  @RequireCapability('delete_posts')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiBearerAuth()
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.postsService.remove(id, req.user.idMember);
  }
}
```

### WordPress-Style Hook System
```typescript
// hooks/hooks.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class HooksService {
  private actionHooks = new Map<string, Array<Function>>();
  private filterHooks = new Map<string, Array<Function>>();

  // WordPress-style action hooks
  addAction(hook: string, callback: Function, priority = 10) {
    if (!this.actionHooks.has(hook)) {
      this.actionHooks.set(hook, []);
    }
    
    const hooks = this.actionHooks.get(hook);
    hooks.push({ callback, priority });
    hooks.sort((a, b) => a.priority - b.priority);
  }

  async doAction(hook: string, ...args: any[]) {
    const hooks = this.actionHooks.get(hook) || [];
    for (const { callback } of hooks) {
      await callback(...args);
    }
  }

  // WordPress-style filter hooks
  addFilter(hook: string, callback: Function, priority = 10) {
    if (!this.filterHooks.has(hook)) {
      this.filterHooks.set(hook, []);
    }
    
    const hooks = this.filterHooks.get(hook);
    hooks.push({ callback, priority });
    hooks.sort((a, b) => a.priority - b.priority);
  }

  async applyFilters(hook: string, value: any, ...args: any[]) {
    const hooks = this.filterHooks.get(hook) || [];
    let filteredValue = value;
    
    for (const { callback } of hooks) {
      filteredValue = await callback(filteredValue, ...args);
    }
    
    return filteredValue;
  }

  removeAction(hook: string, callback: Function) {
    const hooks = this.actionHooks.get(hook);
    if (hooks) {
      const index = hooks.findIndex(h => h.callback === callback);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }

  removeFilter(hook: string, callback: Function) {
    const hooks = this.filterHooks.get(hook);
    if (hooks) {
      const index = hooks.findIndex(h => h.callback === callback);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }
}
```

## Integration with Main App

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { CmsModule } from './modules/cms/cms.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    AdminModule,
    CmsModule, // Add the CMS module
  ],
})
export class AppModule {}
```

This structure provides:
1. **Modular Architecture**: Each WordPress feature as a separate module
2. **WordPress Compatibility**: Hook system, capability checks, familiar patterns
3. **Modern NestJS Features**: Guards, decorators, interceptors, caching
4. **Database Integration**: Full Prisma ORM integration with WordPress tables
5. **Extensibility**: Plugin and theme system architecture
6. **Performance**: Built-in caching and optimization
7. **Security**: Role-based access control and capability system