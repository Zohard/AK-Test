import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = ((page || 1) - 1) * (limit || 20);

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { memberName: { contains: search, mode: 'insensitive' as const } },
            { realName: { contains: search, mode: 'insensitive' as const } },
            {
              emailAddress: { contains: search, mode: 'insensitive' as const },
            },
          ],
        }
      : {};

    // Build order by clause
    const orderBy = { [sortBy || 'dateRegistered']: sortOrder || 'desc' };

    const [users, total] = await Promise.all([
      this.prisma.smfMember.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          idMember: true,
          memberName: true,
          realName: true,
          emailAddress: true,
          dateRegistered: true,
          lastLogin: true,
          posts: true,
          nbCritiques: true,
          nbSynopsis: true,
          nbContributions: true,
          experience: true,
          idGroup: true,
          avatar: true,
          personalText: true,
          location: true,
          // Don't include password fields
        },
      }),
      this.prisma.smfMember.count({ where }),
    ]);

    return {
      users: users.map(this.sanitizeUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / (limit || 20)),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.smfMember.findUnique({
      where: { idMember: id },
      select: {
        idMember: true,
        memberName: true,
        realName: true,
        emailAddress: true,
        dateRegistered: true,
        lastLogin: true,
        posts: true,
        nbCritiques: true,
        nbSynopsis: true,
        nbContributions: true,
        experience: true,
        idGroup: true,
        avatar: true,
        personalText: true,
        signature: true,
        location: true,
        websiteTitle: true,
        websiteUrl: true,
        birthdate: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return this.sanitizeUser(user);
  }

  async update(
    id: number,
    updateProfileDto: UpdateProfileDto,
    currentUserId: number,
    isAdmin: boolean = false,
  ) {
    // Check if user can update this profile
    if (id !== currentUserId && !isAdmin) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre profil',
      );
    }

    const user = await this.prisma.smfMember.findUnique({
      where: { idMember: id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const { email, currentPassword, newPassword, ...otherFields } =
      updateProfileDto;

    // Build update data
    const updateData: any = {};

    // Handle email change (requires current password)
    if (email && email !== user.emailAddress) {
      if (!currentPassword) {
        throw new BadRequestException(
          "Mot de passe actuel requis pour changer l'email",
        );
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwd,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      // Check if email is already taken
      const existingUser = await this.prisma.smfMember.findFirst({
        where: {
          emailAddress: email,
          idMember: { not: id },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Cette adresse email est déjà utilisée');
      }

      updateData.emailAddress = email;
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        throw new BadRequestException(
          'Mot de passe actuel requis pour changer le mot de passe',
        );
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwd,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.passwd = hashedPassword;
    }

    // Handle other fields
    Object.entries(otherFields).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Aucune modification fournie');
    }

    const updatedUser = await this.prisma.smfMember.update({
      where: { idMember: id },
      data: updateData,
      select: {
        idMember: true,
        memberName: true,
        realName: true,
        emailAddress: true,
        dateRegistered: true,
        lastLogin: true,
        posts: true,
        nbCritiques: true,
        nbSynopsis: true,
        nbContributions: true,
        experience: true,
        idGroup: true,
        avatar: true,
        personalText: true,
        signature: true,
        location: true,
        websiteTitle: true,
        websiteUrl: true,
        birthdate: true,
      },
    });

    // If password was changed, revoke all refresh tokens
    if (newPassword) {
      await this.prisma.akRefreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    }

    return this.sanitizeUser(updatedUser);
  }

  async create(createUserDto: CreateUserDto) {
    const { password, memberName, emailAddress, ...otherFields } =
      createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.smfMember.findFirst({
      where: {
        OR: [{ memberName }, { emailAddress }],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Un utilisateur avec ce nom ou cette email existe déjà',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.smfMember.create({
      data: {
        memberName,
        emailAddress,
        passwd: hashedPassword,
        dateRegistered: Math.floor(Date.now() / 1000),
        idGroup: otherFields.idGroup || 0,
        realName: otherFields.realName || memberName,
      } as any,
      select: {
        idMember: true,
        memberName: true,
        realName: true,
        emailAddress: true,
        dateRegistered: true,
        idGroup: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async remove(id: number, currentUserId: number, isAdmin: boolean = false) {
    // Only admin can delete users, or users can delete themselves
    if (id !== currentUserId && !isAdmin) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que votre propre compte',
      );
    }

    const user = await this.prisma.smfMember.findUnique({
      where: { idMember: id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Don't allow deleting admin users unless requested by another admin
    if (user.idGroup === 1 && !isAdmin) {
      throw new ForbiddenException('Impossible de supprimer un administrateur');
    }

    await this.prisma.smfMember.delete({
      where: { idMember: id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  async getUserStats(id: number) {
    const user = await this.prisma.smfMember.findUnique({
      where: { idMember: id },
      select: {
        idMember: true,
        memberName: true,
        posts: true,
        nbCritiques: true,
        nbSynopsis: true,
        nbContributions: true,
        experience: true,
        dateRegistered: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Get reviews count and average rating
    const reviewStats = await this.prisma.akCritique.aggregate({
      where: { idMembre: id },
      _count: true,
      _avg: { notation: true },
    });

    return {
      user: this.sanitizeUser(user),
      stats: {
        totalReviews: reviewStats._count,
        averageReviewRating: reviewStats._avg.notation || 0,
        joinDate: new Date(user.dateRegistered * 1000).toISOString(),
        lastLoginDate: user.lastLogin
          ? new Date(user.lastLogin * 1000).toISOString()
          : null,
      },
    };
  }

  private sanitizeUser(user: any) {
    // Remove sensitive fields and format response
    const {
      idMember,
      memberName,
      realName,
      emailAddress,
      dateRegistered,
      lastLogin,
      ...otherFields
    } = user;

    return {
      id: idMember,
      username: memberName,
      realName,
      email: emailAddress,
      registrationDate: dateRegistered,
      lastLogin,
      isAdmin: user.idGroup === 1 || idMember === 1 || idMember === 17667,
      ...otherFields,
    };
  }
}
