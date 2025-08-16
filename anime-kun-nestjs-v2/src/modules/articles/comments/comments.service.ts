import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto, userId?: number, ipAddress?: string, userAgent?: string) {
    const { articleId, commentaire, nom, email, website } = createCommentDto;

    // Validate article exists
    const article = await this.prisma.akWebzineArticle.findUnique({
      where: { idArt: articleId }
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check if article allows comments (basic spam protection)
    if (article.statut !== 1) {
      throw new BadRequestException('Comments are not allowed on unpublished articles');
    }

    // Basic spam detection
    if (this.isSpamContent(commentaire)) {
      throw new BadRequestException('Comment appears to be spam');
    }

    // Determine moderation status
    // - Registered users: auto-approve
    // - Anonymous users: require moderation
    const moderation = userId ? 1 : 0;

    // Get next ID
    const lastComment = await this.prisma.akWebzineComment.findFirst({
      orderBy: { id: 'desc' },
    });
    const nextId = (lastComment?.id || 0) + 1;

    const comment = await this.prisma.akWebzineComment.create({
      data: {
        id: nextId,
        commentaire,
        nom: userId ? undefined : nom, // Use member name if logged in
        email: userId ? undefined : email,
        website: userId ? undefined : website,
        ip: ipAddress?.substring(0, 255),
        reverseip: this.reverseIp(ipAddress),
        date: new Date(),
        moderation,
        idMembre: userId || 0,
        idArticle: articleId,
      },
      include: {
        member: userId ? {
          select: {
            idMember: true,
            memberName: true,
          }
        } : undefined,
        article: {
          select: {
            idArt: true,
            titre: true,
          }
        }
      }
    });

    // Update article comment count if approved
    if (moderation === 1) {
      await this.updateArticleCommentCount(articleId);
    }

    return comment;
  }

  async findAll(query: CommentQueryDto) {
    const { page = 1, limit = 20, articleId, status = 'approved', search, memberId } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const where: any = {};

    // Article filter
    if (articleId) {
      where.idArticle = articleId;
    }

    // Status filter
    if (status === 'approved') {
      where.moderation = 1;
    } else if (status === 'pending') {
      where.moderation = 0;
    } else if (status === 'rejected') {
      where.moderation = -1;
    }
    // If status === 'all', don't add moderation filter

    // Search filter
    if (search) {
      where.OR = [
        { commentaire: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Member filter
    if (memberId) {
      where.idMembre = memberId;
    }

    // Execute query
    const [comments, total] = await Promise.all([
      this.prisma.akWebzineComment.findMany({
        where,
        include: {
          member: {
            select: {
              idMember: true,
              memberName: true,
            }
          },
          article: {
            select: {
              idArt: true,
              titre: true,
              niceUrl: true,
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.akWebzineComment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      comments,
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
    const comment = await this.prisma.akWebzineComment.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            idMember: true,
            memberName: true,
          }
        },
        article: {
          select: {
            idArt: true,
            titre: true,
            niceUrl: true,
          }
        }
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number, isAdmin: boolean = false) {
    const existingComment = await this.prisma.akWebzineComment.findUnique({
      where: { id }
    });

    if (!existingComment) {
      throw new NotFoundException('Comment not found');
    }

    // Check permissions
    if (!isAdmin && existingComment.idMembre !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Only allow editing content for non-admin users
    // Admins can edit everything
    const updateData = isAdmin ? updateCommentDto : {
      commentaire: updateCommentDto.commentaire
    };

    // Basic spam detection if content is being updated
    if (updateData.commentaire && this.isSpamContent(updateData.commentaire)) {
      throw new BadRequestException('Comment appears to be spam');
    }

    const updatedComment = await this.prisma.akWebzineComment.update({
      where: { id },
      data: updateData,
      include: {
        member: {
          select: {
            idMember: true,
            memberName: true,
          }
        },
        article: {
          select: {
            idArt: true,
            titre: true,
          }
        }
      }
    });

    return updatedComment;
  }

  async moderate(id: number, moderateDto: ModerateCommentDto) {
    const { status, reason } = moderateDto;
    
    const comment = await this.prisma.akWebzineComment.findUnique({
      where: { id }
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const oldStatus = comment.moderation;
    const newStatus = status === 'approved' ? 1 : status === 'rejected' ? -1 : 0;

    await this.prisma.akWebzineComment.update({
      where: { id },
      data: {
        moderation: newStatus,
      }
    });

    // Update article comment count if status changed
    if (oldStatus !== newStatus && comment.idArticle) {
      await this.updateArticleCommentCount(comment.idArticle);
    }

    return { 
      message: `Comment ${status} successfully`,
      reason: reason || undefined
    };
  }

  async remove(id: number, userId: number, isAdmin: boolean = false) {
    const comment = await this.prisma.akWebzineComment.findUnique({
      where: { id }
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check permissions
    if (!isAdmin && comment.idMembre !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.akWebzineComment.delete({
      where: { id }
    });

    // Update article comment count
    if (comment.idArticle && comment.moderation === 1) {
      await this.updateArticleCommentCount(comment.idArticle);
    }

    return { message: 'Comment deleted successfully' };
  }

  async getStats() {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM ak_webzine_com WHERE moderation = 1) as approved_comments,
        (SELECT COUNT(*) FROM ak_webzine_com WHERE moderation = 0) as pending_comments,
        (SELECT COUNT(*) FROM ak_webzine_com WHERE moderation = -1) as rejected_comments,
        (SELECT COUNT(*) FROM ak_webzine_com WHERE id_membre > 0) as member_comments,
        (SELECT COUNT(*) FROM ak_webzine_com WHERE id_membre = 0) as anonymous_comments
    `;

    const result = (stats as any[])[0];
    
    return {
      approved_comments: Number(result.approved_comments),
      pending_comments: Number(result.pending_comments),
      rejected_comments: Number(result.rejected_comments),
      member_comments: Number(result.member_comments),
      anonymous_comments: Number(result.anonymous_comments),
    };
  }

  async bulkModerate(commentIds: number[], status: string, reason?: string) {
    const moderationValue = status === 'approved' ? 1 : status === 'rejected' ? -1 : 0;
    
    const results: Array<{ id: number; status: string; message?: string }> = [];
    
    for (const commentId of commentIds) {
      try {
        await this.moderate(commentId, { status, reason });
        results.push({ id: commentId, status: 'success' });
      } catch (error) {
        results.push({ 
          id: commentId, 
          status: 'error', 
          message: error.message 
        });
      }
    }

    return {
      message: 'Bulk moderation completed',
      results,
    };
  }

  private async updateArticleCommentCount(articleId: number) {
    const approvedCount = await this.prisma.akWebzineComment.count({
      where: {
        idArticle: articleId,
        moderation: 1,
      }
    });

    await this.prisma.akWebzineArticle.update({
      where: { idArt: articleId },
      data: { nbCom: approvedCount }
    });
  }

  private isSpamContent(content: string): boolean {
    const spamPatterns = [
      /\b(buy|cheap|discount|free|money|cash|earn|income|profit|sale|offer|deal)\b.*\b(now|today|click|here|link)\b/i,
      /\b(viagra|cialis|pharmacy|pills|medication)\b/i,
      /\b(casino|poker|gambling|bet|lottery)\b/i,
      /(http|https):\/\/[^\s]+/g, // Multiple links
      /(.)\1{10,}/, // Repeated characters
    ];

    // Check for spam patterns
    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check for excessive links
    const linkCount = (content.match(/(http|https):\/\/[^\s]+/g) || []).length;
    if (linkCount > 2) {
      return true;
    }

    // Check for excessive capitalization
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
    if (totalLetters > 0 && (capsCount / totalLetters) > 0.7) {
      return true;
    }

    return false;
  }

  private reverseIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    
    try {
      return ip.split('.').reverse().join('.');
    } catch {
      return ip;
    }
  }
}