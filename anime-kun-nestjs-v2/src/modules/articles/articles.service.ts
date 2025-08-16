import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { PublishArticleDto } from './dto/publish-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto, authorId: number) {
    const { categoryIds, contentIds, contentTypes, ...articleData } = createArticleDto;

    // Generate nice URL if not provided
    const niceUrl = articleData.niceUrl || this.generateNiceUrl(articleData.titre);
    
    // Ensure URL uniqueness
    const existingArticle = await this.prisma.akWebzineArticle.findFirst({
      where: { niceUrl }
    });
    
    if (existingArticle) {
      throw new BadRequestException('An article with this URL already exists');
    }

    // Create article
    const createData = {
      ...articleData,
      niceUrl,
      auteur: authorId,
      date: new Date(),
      nbCom: 0,
      nbClics: 0,
      alreadyPing: 0,
      statut: 0, // Draft by default
    };

    // Convert boolean fields to int for database
    if ('trackbacksOpen' in createData && typeof createData.trackbacksOpen === 'boolean') {
      (createData as any).trackbacksOpen = createData.trackbacksOpen ? 1 : 0;
    }
    if ('onindex' in createData && typeof createData.onindex === 'boolean') {
      (createData as any).onindex = createData.onindex ? 1 : 0;
    }
    if ('nl2br' in createData && typeof createData.nl2br === 'boolean') {
      (createData as any).nl2br = createData.nl2br ? 1 : 0;
    }

    const article = await this.prisma.akWebzineArticle.create({
      data: createData as any,
      include: {
        author: {
          select: {
            idMember: true,
            memberName: true,
            realName: true,
          }
        },
      }
    });

    // Add categories if provided
    if (categoryIds && categoryIds.length > 0) {
      await this.addCategoriesToArticle(article.idArt, categoryIds);
    }

    // Add content relationships if provided
    if (contentIds && contentTypes && contentIds.length === contentTypes.length) {
      await this.addContentRelationships(article.idArt, contentIds, contentTypes);
    }

    return this.getById(article.idArt);
  }

  async findAll(query: ArticleQueryDto) {
    const { page = 1, limit = 20, search, categoryId, authorId, status, sort, order = 'desc', onindex, tag, includeContent } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const where: any = {};

    // Status filter (only show published articles for public)
    if (status === 'published') {
      where.statut = 1;
    } else if (status === 'draft') {
      where.statut = 0;
    } else if (status === 'archived') {
      where.statut = -1;
    }
    // If status === 'all', don't add status filter (admin only)

    // Search filter
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { texte: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Author filter
    if (authorId) {
      where.auteur = authorId;
    }

    // Index filter
    if (onindex !== undefined) {
      where.onindex = onindex ? 1 : 0;
    }

    // Tag filter
    if (tag) {
      where.tags = { contains: tag, mode: 'insensitive' };
    }

    // Category filter
    if (categoryId) {
      where.categories = {
        some: {
          idCat: categoryId
        }
      };
    }

    // Sort configuration
    const orderBy: any = {};
    const sortOrder = (order || 'DESC').toLowerCase();
    switch (sort) {
      case 'title':
        orderBy.titre = sortOrder;
        break;
      case 'views':
        orderBy.nbClics = sortOrder;
        break;
      case 'comments':
        orderBy.nbCom = sortOrder;
        break;
      default:
        orderBy.date = sortOrder;
    }

    // Execute query
    const [articles, total] = await Promise.all([
      this.prisma.akWebzineArticle.findMany({
        where,
        include: {
          author: {
            select: {
              idMember: true,
              memberName: true,
              realName: true,
            }
          },
          categories: {
            include: {
              category: true
            }
          },
          _count: {
            select: {
              comments: true,
              images: true,
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.akWebzineArticle.count({ where }),
    ]);

    // Transform results
    const transformedArticles = articles.map(article => ({
      ...article,
      content: includeContent ? article.texte : undefined,
      texte: undefined, // Remove full content unless requested
      categories: article.categories.map(cat => cat.category),
      commentCount: article._count.comments,
      imageCount: article._count.images,
      _count: undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      articles: transformedArticles,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getById(id: number, includeContent: boolean = true) {
    const article = await this.prisma.akWebzineArticle.findUnique({
      where: { idArt: id },
      include: {
        author: {
          select: {
            idMember: true,
            memberName: true,
            realName: true,
          }
        },
        categories: {
          include: {
            category: true
          }
        },
        comments: {
          where: { moderation: 1 }, // Only approved comments
          include: {
            member: {
              select: {
                idMember: true,
                memberName: true,
              }
            }
          },
          orderBy: { date: 'asc' }
        },
        images: true,
        contentRelations: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count
    await this.incrementViewCount(id);

    return {
      ...article,
      categories: article.categories.map(cat => cat.category),
      content: includeContent ? article.texte : undefined,
      texte: undefined,
    };
  }

  async getByNiceUrl(niceUrl: string, includeContent: boolean = true) {
    const article = await this.prisma.akWebzineArticle.findFirst({
      where: { niceUrl },
      include: {
        author: {
          select: {
            idMember: true,
            memberName: true,
            realName: true,
          }
        },
        categories: {
          include: {
            category: true
          }
        },
        comments: {
          where: { moderation: 1 },
          include: {
            member: {
              select: {
                idMember: true,
                memberName: true,
              }
            }
          },
          orderBy: { date: 'asc' }
        },
        images: true,
        contentRelations: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count
    await this.incrementViewCount(article.idArt);

    return {
      ...article,
      categories: article.categories.map(cat => cat.category),
      content: includeContent ? article.texte : undefined,
      texte: undefined,
    };
  }

  async update(id: number, updateArticleDto: UpdateArticleDto, userId: number, isAdmin: boolean = false) {
    const existingArticle = await this.prisma.akWebzineArticle.findUnique({
      where: { idArt: id }
    });

    if (!existingArticle) {
      throw new NotFoundException('Article not found');
    }

    // Check permissions
    if (!isAdmin && existingArticle.auteur !== userId) {
      throw new ForbiddenException('You can only edit your own articles');
    }

    const { categoryIds, contentIds, contentTypes, ...articleData } = updateArticleDto;

    // Update nice URL if title changed
    if (articleData.titre && articleData.titre !== existingArticle.titre) {
      articleData.niceUrl = this.generateNiceUrl(articleData.titre);
    }

    // Convert boolean fields to int for database
    const updateData = { ...articleData };
    if ('trackbacksOpen' in updateData && typeof updateData.trackbacksOpen === 'boolean') {
      (updateData as any).trackbacksOpen = updateData.trackbacksOpen ? 1 : 0;
    }
    if ('onindex' in updateData && typeof updateData.onindex === 'boolean') {
      (updateData as any).onindex = updateData.onindex ? 1 : 0;
    }
    if ('nl2br' in updateData && typeof updateData.nl2br === 'boolean') {
      (updateData as any).nl2br = updateData.nl2br ? 1 : 0;
    }

    // Update article
    const updatedArticle = await this.prisma.akWebzineArticle.update({
      where: { idArt: id },
      data: updateData as any,
    });

    // Update categories if provided
    if (categoryIds !== undefined) {
      await this.updateArticleCategories(id, categoryIds);
    }

    // Update content relationships if provided
    if (contentIds !== undefined && contentTypes !== undefined) {
      await this.updateContentRelationships(id, contentIds, contentTypes);
    }

    return this.getById(id);
  }

  async publish(id: number, publishDto: PublishArticleDto, userId: number, isAdmin: boolean = false) {
    const article = await this.prisma.akWebzineArticle.findUnique({
      where: { idArt: id }
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check permissions
    if (!isAdmin && article.auteur !== userId) {
      throw new ForbiddenException('You can only publish your own articles');
    }

    const updateData: any = {
      statut: publishDto.publish ? 1 : 0,
    };

    if (publishDto.onindex !== undefined) {
      updateData.onindex = publishDto.onindex ? 1 : 0;
    }

    if (publishDto.publishDate) {
      updateData.date = new Date(publishDto.publishDate);
    } else if (publishDto.publish && article.statut === 0) {
      // Set publish date to now if publishing for the first time
      updateData.date = new Date();
    }

    await this.prisma.akWebzineArticle.update({
      where: { idArt: id },
      data: updateData,
    });

    return this.getById(id);
  }

  async remove(id: number, userId: number, isAdmin: boolean = false) {
    const article = await this.prisma.akWebzineArticle.findUnique({
      where: { idArt: id }
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Only admins can delete articles
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can delete articles');
    }

    await this.prisma.akWebzineArticle.delete({
      where: { idArt: id }
    });

    return { message: 'Article deleted successfully' };
  }

  async getStats() {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM ak_webzine_articles WHERE statut = 1) as published_articles,
        (SELECT COUNT(*) FROM ak_webzine_articles WHERE statut = 0) as draft_articles,
        (SELECT COUNT(*) FROM ak_webzine_articles WHERE statut = -1) as archived_articles,
        (SELECT COUNT(*) FROM ak_webzine_com WHERE moderation = 1) as approved_comments,
        (SELECT COUNT(*) FROM ak_webzine_com WHERE moderation = 0) as pending_comments,
        (SELECT COUNT(*) FROM ak_webzine_categories) as categories_count
    `;

    const result = (stats as any[])[0];
    
    return {
      published_articles: Number(result.published_articles),
      draft_articles: Number(result.draft_articles),
      archived_articles: Number(result.archived_articles),
      approved_comments: Number(result.approved_comments),
      pending_comments: Number(result.pending_comments),
      categories_count: Number(result.categories_count),
    };
  }

  private generateNiceUrl(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 100); // Limit length
  }

  private async incrementViewCount(articleId: number) {
    await this.prisma.akWebzineArticle.update({
      where: { idArt: articleId },
      data: {
        nbClics: {
          increment: 1,
        },
      },
    });
  }

  private async addCategoriesToArticle(articleId: number, categoryIds: number[]) {
    const data = categoryIds.map(categoryId => ({
      idArt: articleId,
      idCat: categoryId,
    }));

    await this.prisma.akWebzineArt2Cat.createMany({
      data,
      skipDuplicates: true,
    });
  }

  private async updateArticleCategories(articleId: number, categoryIds: number[]) {
    // Remove existing categories
    await this.prisma.akWebzineArt2Cat.deleteMany({
      where: { idArt: articleId },
    });

    // Add new categories
    if (categoryIds.length > 0) {
      await this.addCategoriesToArticle(articleId, categoryIds);
    }
  }

  private async addContentRelationships(articleId: number, contentIds: number[], contentTypes: string[]) {
    // Create each relationship individually since idRelation is auto-generated
    for (let i = 0; i < contentIds.length; i++) {
      await this.prisma.akWebzineToFiche.create({
        data: {
          idArticle: articleId,
          idWpArticle: 0, // Legacy field
          idFiche: contentIds[i],
          type: contentTypes[i],
        }
      });
    }
  }

  private async updateContentRelationships(articleId: number, contentIds: number[], contentTypes: string[]) {
    // Remove existing relationships
    await this.prisma.akWebzineToFiche.deleteMany({
      where: { idArticle: articleId },
    });

    // Add new relationships
    if (contentIds.length > 0 && contentTypes.length > 0) {
      await this.addContentRelationships(articleId, contentIds, contentTypes);
    }
  }
}