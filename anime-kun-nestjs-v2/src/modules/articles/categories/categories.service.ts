import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { nom } = createCategoryDto;
    
    // Generate nice URL if not provided
    const niceUrl = createCategoryDto.niceUrl || this.generateNiceUrl(nom);
    
    // Ensure URL uniqueness
    const existingCategory = await this.prisma.akWebzineCategory.findFirst({
      where: { niceUrl }
    });
    
    if (existingCategory) {
      throw new BadRequestException('A category with this URL already exists');
    }

    // Get next ID
    const lastCategory = await this.prisma.akWebzineCategory.findFirst({
      orderBy: { idCat: 'desc' },
    });
    const nextId = (lastCategory?.idCat || 0) + 1;

    const category = await this.prisma.akWebzineCategory.create({
      data: {
        idCat: nextId,
        nom,
        niceUrl,
      },
      include: {
        _count: {
          select: {
            articles: true,
          }
        }
      }
    });

    return {
      ...category,
      articleCount: category._count.articles,
      _count: undefined,
    };
  }

  async findAll(query: CategoryQueryDto) {
    const { page = 1, limit = 50, search, includeEmpty = false } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const where: any = {};

    // Search filter
    if (search) {
      where.nom = { contains: search, mode: 'insensitive' };
    }

    // Filter out empty categories if requested
    if (!includeEmpty) {
      where.articles = {
        some: {}
      };
    }

    // Execute query
    const [categories, total] = await Promise.all([
      this.prisma.akWebzineCategory.findMany({
        where,
        include: {
          _count: {
            select: {
              articles: true,
            }
          }
        },
        orderBy: { nom: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.akWebzineCategory.count({ where }),
    ]);

    // Transform results
    const transformedCategories = categories.map(category => ({
      ...category,
      articleCount: category._count.articles,
      _count: undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      categories: transformedCategories,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getById(id: number) {
    const category = await this.prisma.akWebzineCategory.findUnique({
      where: { idCat: id },
      include: {
        _count: {
          select: {
            articles: true,
          }
        },
        articles: {
          include: {
            article: {
              select: {
                idArt: true,
                titre: true,
                niceUrl: true,
                date: true,
                statut: true,
                author: {
                  select: {
                    idMember: true,
                    memberName: true,
                  }
                }
              }
            }
          },
          take: 10, // Latest 10 articles
          orderBy: {
            article: {
              date: 'desc'
            }
          }
        }
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      articleCount: category._count.articles,
      recentArticles: category.articles.map(rel => rel.article),
      articles: undefined,
      _count: undefined,
    };
  }

  async getByNiceUrl(niceUrl: string) {
    const category = await this.prisma.akWebzineCategory.findFirst({
      where: { niceUrl },
      include: {
        _count: {
          select: {
            articles: true,
          }
        }
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      articleCount: category._count.articles,
      _count: undefined,
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.akWebzineCategory.findUnique({
      where: { idCat: id }
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    const updateData = { ...updateCategoryDto };

    // Update nice URL if name changed
    if (updateData.nom && updateData.nom !== existingCategory.nom) {
      updateData.niceUrl = this.generateNiceUrl(updateData.nom);
      
      // Check for URL conflicts
      const conflictingCategory = await this.prisma.akWebzineCategory.findFirst({
        where: { 
          niceUrl: updateData.niceUrl,
          idCat: { not: id }
        }
      });
      
      if (conflictingCategory) {
        throw new BadRequestException('A category with this URL already exists');
      }
    }

    const updatedCategory = await this.prisma.akWebzineCategory.update({
      where: { idCat: id },
      data: updateData,
      include: {
        _count: {
          select: {
            articles: true,
          }
        }
      }
    });

    return {
      ...updatedCategory,
      articleCount: updatedCategory._count.articles,
      _count: undefined,
    };
  }

  async remove(id: number) {
    const category = await this.prisma.akWebzineCategory.findUnique({
      where: { idCat: id },
      include: {
        _count: {
          select: {
            articles: true,
          }
        }
      }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.articles > 0) {
      throw new BadRequestException('Cannot delete category that contains articles. Please move or delete all articles first.');
    }

    await this.prisma.akWebzineCategory.delete({
      where: { idCat: id }
    });

    return { message: 'Category deleted successfully' };
  }

  async getStats() {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM ak_webzine_categories) as total_categories,
        (SELECT COUNT(*) FROM ak_webzine_categories WHERE id_cat IN (
          SELECT DISTINCT id_cat FROM ak_webzine_art2cat
        )) as categories_with_articles,
        (SELECT COUNT(*) FROM ak_webzine_categories WHERE id_cat NOT IN (
          SELECT DISTINCT id_cat FROM ak_webzine_art2cat WHERE id_cat IS NOT NULL
        )) as empty_categories
    `;

    const result = (stats as any[])[0];
    
    return {
      total_categories: Number(result.total_categories),
      categories_with_articles: Number(result.categories_with_articles),
      empty_categories: Number(result.empty_categories),
    };
  }

  private generateNiceUrl(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .substring(0, 100); // Limit length
  }
}