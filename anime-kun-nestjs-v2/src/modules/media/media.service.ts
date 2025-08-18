import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  private readonly uploadPath = './uploads';
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  async uploadImage(
    file: Express.Multer.File,
    type: 'anime' | 'manga' | 'avatar' | 'cover',
    relatedId?: number,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed.',
      );
    }

    // Ensure upload directory exists
    await this.ensureUploadDirectory();

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
    const filePath = path.join(this.uploadPath, filename);

    try {
      // Process and save image with Sharp
      const processedImage = await this.processImage(file.buffer, type);
      await fs.writeFile(filePath, processedImage);

      // Save to database
      const result = await this.prisma.$queryRaw`
        INSERT INTO ak_screenshots (url_screen, id_titre, type, upload_date)
        VALUES (${filename}, ${relatedId || 0}, ${this.getTypeId(type)}, NOW())
        RETURNING id_screen
      `;

      return {
        id: (result as any[])[0]?.id_screen,
        filename,
        originalName: file.originalname,
        size: processedImage.length,
        type,
        url: `/uploads/${filename}`,
        relatedId,
      };
    } catch (error) {
      // Clean up file if database insert fails
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
      throw error;
    }
  }

  async getMediaById(id: number) {
    const media = await this.prisma.$queryRaw`
      SELECT 
        id_screen as id,
        url_screen as filename,
        id_titre as related_id,
        type,
        upload_date
      FROM ak_screenshots 
      WHERE id_screen = ${id}
    `;

    if (!media || (media as any[]).length === 0) {
      throw new NotFoundException('Media not found');
    }

    const result = (media as any[])[0];
    return {
      id: Number(result.id),
      filename: result.filename,
      relatedId: Number(result.related_id),
      type: this.getTypeName(result.type),
      uploadDate: result.upload_date,
      url: `/uploads/${result.filename}`,
    };
  }

  async getMediaByRelatedId(relatedId: number, type: 'anime' | 'manga') {
    const typeId = this.getTypeId(type);
    const media = await this.prisma.$queryRaw`
      SELECT 
        id_screen as id,
        url_screen as filename,
        upload_date
      FROM ak_screenshots 
      WHERE id_titre = ${relatedId} AND type = ${typeId}
      ORDER BY upload_date DESC
    `;

    return (media as any[]).map((item) => ({
      id: Number(item.id),
      filename: item.filename,
      uploadDate: item.upload_date,
      url: `/uploads/${item.filename}`,
    }));
  }

  async deleteMedia(id: number, userId: number) {
    const media = await this.getMediaById(id);

    // Delete file from filesystem
    const filePath = path.join(this.uploadPath, media.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('File not found on filesystem:', error.message);
    }

    // Delete from database
    await this.prisma.$executeRaw`
      DELETE FROM ak_screenshots WHERE id_screen = ${id}
    `;

    return { message: 'Media deleted successfully' };
  }

  private async processImage(buffer: Buffer, type: string): Promise<Buffer> {
    let processor = sharp(buffer);

    // Get image metadata
    const metadata = await processor.metadata();

    // Define size constraints based on type
    const sizeConstraints = {
      avatar: { width: 150, height: 150 },
      cover: { width: 400, height: 600 },
      anime: { width: 800, height: 600 },
      manga: { width: 400, height: 600 },
    };

    const constraints = sizeConstraints[type] || sizeConstraints.anime;

    // Resize if image is larger than constraints
    if (
      metadata.width > constraints.width ||
      metadata.height > constraints.height
    ) {
      processor = processor.resize(constraints.width, constraints.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Optimize and convert to WebP for better compression
    return processor.webp({ quality: 85 }).toBuffer();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  private getTypeId(type: string): number {
    const typeMap = {
      anime: 1,
      manga: 2,
      avatar: 3,
      cover: 4,
    };
    return typeMap[type] || 1;
  }

  private getTypeName(typeId: number): string {
    const typeMap = {
      1: 'anime',
      2: 'manga',
      3: 'avatar',
      4: 'cover',
    };
    return typeMap[typeId] || 'anime';
  }

  async getUploadStats() {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        type,
        COUNT(*) as count,
        MAX(upload_date) as latest_upload
      FROM ak_screenshots 
      GROUP BY type
      ORDER BY type
    `;

    return (stats as any[]).map((stat) => ({
      type: this.getTypeName(stat.type),
      count: Number(stat.count),
      latestUpload: stat.latest_upload,
    }));
  }

  async serveImage(type: string, filename: string) {
    // For backwards compatibility, try to find in type-specific directory first
    let filePath = path.join(this.uploadPath, type, filename);

    try {
      await fs.access(filePath);
    } catch {
      // If not found in type directory, try root uploads directory
      filePath = path.join(this.uploadPath, filename);
      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundException('Image not found');
      }
    }

    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();

    // Determine content type
    let contentType = 'image/jpeg'; // default
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
    }

    // Generate ETag for caching
    const crypto = require('crypto');
    const etag = crypto.createHash('md5').update(buffer).digest('hex');

    return {
      buffer,
      contentType,
      etag,
    };
  }
}
