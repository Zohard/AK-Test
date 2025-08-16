# Architecture Cible - Anime-Kun NestJS

## Vision Générale

Migration de l'API Express.js actuelle (6825 lignes) vers une architecture NestJS moderne, modulaire et type-safe selon les spécifications du cahier des charges.

## Stack Technique Cible

### Backend
- **Framework** : NestJS 10+ avec TypeScript 5+
- **Base de données** : PostgreSQL (Supabase serverless)
- **ORM** : Prisma avec génération client type-safe
- **Cache** : Redis pour sessions et cache applicatif
- **Queue** : BullMQ pour tâches asynchrones
- **Validation** : class-validator + class-transformer
- **Documentation** : Swagger/OpenAPI 3.0 auto-générée

### Frontend
- **Framework** : Vue 3 + Composition API + TypeScript
- **Meta-framework** : Nuxt 3 (déjà en place)
- **State Management** : Pinia
- **Styling** : TailwindCSS

### Infrastructure
- **Database** : Supabase PostgreSQL
- **Storage** : Supabase Storage pour images
- **Deployment** : Docker + Kubernetes ou PaaS (Fly.io)
- **Monitoring** : Prometheus + Grafana + Sentry

## Architecture NestJS Détaillée

### Structure des Modules

```typescript
src/
├── app.module.ts              # Module racine
├── main.ts                    # Point d'entrée
├── common/                    # Éléments transversaux
│   ├── guards/
│   │   ├── auth.guard.ts      # Authentification JWT
│   │   ├── roles.guard.ts     # Contrôle des rôles
│   │   └── owner.guard.ts     # Propriété des ressources
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── cache.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   ├── validation.pipe.ts
│   │   └── parse-int.pipe.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── api-pagination.decorator.ts
│   └── middleware/
│       ├── logger.middleware.ts
│       └── cors.middleware.ts
├── config/                    # Configuration
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── redis.config.ts
│   ├── swagger.config.ts
│   └── app.config.ts
├── modules/                   # Modules métier
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       └── reset-password.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       └── user-profile.dto.ts
│   ├── animes/
│   │   ├── animes.module.ts
│   │   ├── animes.controller.ts
│   │   ├── animes.service.ts
│   │   ├── entities/
│   │   │   ├── anime.entity.ts
│   │   │   ├── episode.entity.ts
│   │   │   └── anime-genre.entity.ts
│   │   └── dto/
│   │       ├── create-anime.dto.ts
│   │       ├── update-anime.dto.ts
│   │       └── anime-filter.dto.ts
│   ├── mangas/
│   │   ├── mangas.module.ts
│   │   ├── mangas.controller.ts
│   │   ├── mangas.service.ts
│   │   ├── entities/
│   │   │   ├── manga.entity.ts
│   │   │   └── manga-chapter.entity.ts
│   │   └── dto/
│   ├── reviews/
│   │   ├── reviews.module.ts
│   │   ├── reviews.controller.ts
│   │   ├── reviews.service.ts
│   │   ├── entities/
│   │   │   └── review.entity.ts
│   │   └── dto/
│   ├── admin/
│   │   ├── admin.module.ts
│   │   ├── controllers/
│   │   │   ├── admin-users.controller.ts
│   │   │   ├── admin-content.controller.ts
│   │   │   └── admin-moderation.controller.ts
│   │   ├── services/
│   │   │   ├── admin-users.service.ts
│   │   │   ├── admin-content.service.ts
│   │   │   └── admin-moderation.service.ts
│   │   └── dto/
│   ├── search/
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   ├── search.service.ts
│   │   └── dto/
│   │       └── search-query.dto.ts
│   ├── upload/
│   │   ├── upload.module.ts
│   │   ├── upload.controller.ts
│   │   ├── upload.service.ts
│   │   └── dto/
│   │       └── upload-file.dto.ts
│   └── notifications/
│       ├── notifications.module.ts
│       ├── notifications.gateway.ts
│       ├── notifications.service.ts
│       └── dto/
├── shared/                    # Types et utilitaires partagés
│   ├── types/
│   │   ├── api-response.type.ts
│   │   ├── pagination.type.ts
│   │   └── user-role.enum.ts
│   ├── constants/
│   │   ├── api-tags.constant.ts
│   │   └── app.constant.ts
│   └── utils/
│       ├── pagination.util.ts
│       ├── password.util.ts
│       └── file.util.ts
└── database/                  # Prisma
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.ts
    └── database.service.ts
```

### Exemples d'Implémentation

#### 1. Module Auth

```typescript
// auth/auth.module.ts
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}

// auth/dto/login.dto.ts
export class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Mot de passe requis' })
  @MinLength(6, { message: 'Mot de passe minimum 6 caractères' })
  password: string;
}

// auth/auth.controller.ts
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Inscription utilisateur' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Profil utilisateur connecté' })
  @ApiBearerAuth()
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
```

#### 2. Module Animes avec RBAC

```typescript
// animes/animes.controller.ts
@Controller('animes')
@ApiTags('Animes')
export class AnimesController {
  constructor(private animesService: AnimesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des animes avec pagination' })
  @ApiPaginatedResponse(AnimeDto)
  async findAll(@Query() query: AnimeFilterDto) {
    return this.animesService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Créer un anime' })
  @ApiBearerAuth()
  async create(@Body() createAnimeDto: CreateAnimeDto) {
    return this.animesService.create(createAnimeDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Modifier un anime' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimeDto: UpdateAnimeDto,
  ) {
    return this.animesService.update(id, updateAnimeDto);
  }
}

// animes/dto/create-anime.dto.ts
export class CreateAnimeDto {
  @IsString({ message: 'Titre requis' })
  @IsNotEmpty({ message: 'Titre ne peut être vide' })
  @Length(1, 255, { message: 'Titre entre 1 et 255 caractères' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Synopsis doit être une chaîne' })
  @MaxLength(5000, { message: 'Synopsis maximum 5000 caractères' })
  synopsis?: string;

  @IsOptional()
  @IsInt({ message: 'Année doit être un entier' })
  @Min(1900, { message: 'Année minimum 1900' })
  @Max(new Date().getFullYear() + 2, { message: 'Année invalide' })
  year?: number;

  @IsOptional()
  @IsArray({ message: 'Genres doit être un tableau' })
  @IsInt({ each: true, message: 'ID genre doit être un entier' })
  genreIds?: number[];
}
```

#### 3. Service avec Prisma

```typescript
// animes/animes.service.ts
@Injectable()
export class AnimesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async findAll(query: AnimeFilterDto): Promise<PaginatedResult<Anime>> {
    const cacheKey = `animes:${JSON.stringify(query)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const { page = 1, limit = 20, genre, year, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AnimeWhereInput = {
      ...(genre && { genres: { some: { id: genre } } }),
      ...(year && { year }),
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.anime.findMany({
        where,
        skip,
        take: limit,
        include: {
          genres: true,
          reviews: {
            select: { rating: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.anime.count({ where }),
    ]);

    const result = {
      items: items.map(anime => ({
        ...anime,
        averageRating: this.calculateAverageRating(anime.reviews),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await this.cacheService.set(cacheKey, result, 300); // 5min cache
    return result;
  }

  async create(createAnimeDto: CreateAnimeDto): Promise<Anime> {
    const { genreIds, ...animeData } = createAnimeDto;

    return this.prisma.anime.create({
      data: {
        ...animeData,
        ...(genreIds && {
          genres: {
            connect: genreIds.map(id => ({ id })),
          },
        }),
      },
      include: {
        genres: true,
      },
    });
  }

  private calculateAverageRating(reviews: { rating: number }[]): number | null {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }
}
```

## Avantages de cette Architecture

### 1. Maintenabilité
- **Séparation des responsabilités** : Chaque module a un rôle précis
- **Code réutilisable** : Services, guards et pipes partagés
- **Tests isolés** : Chaque module peut être testé indépendamment

### 2. Évolutivité
- **Ajout de fonctionnalités** : Nouveaux modules sans impact
- **Microservices ready** : Architecture préparée pour le découpage
- **Performance** : Cache intégré, pagination optimisée

### 3. Qualité de Code
- **TypeScript strict** : Typage complet, erreurs détectées à la compilation
- **Validation automatique** : DTOs avec class-validator
- **Documentation auto** : Swagger généré depuis les décorateurs

### 4. Sécurité
- **RBAC granulaire** : Contrôle d'accès par rôle et ressource
- **Guards composables** : Auth + Roles + Owner
- **Validation stricte** : Tous les inputs validés automatiquement

### 5. DevX (Developer Experience)
- **Auto-complétion** : TypeScript + IDE
- **Hot reload** : Développement rapide
- **CLI intégré** : Génération automatique de modules

## Migration Progressive

### Étape 1 : Cohabitation
- Nouveau projet NestJS en parallèle
- Proxy nginx pour router selon l'endpoint
- Migration endpoint par endpoint

### Étape 2 : Tests et Validation
- Tests de non-régression
- Tests de charge
- Validation frontend

### Étape 3 : Bascule
- Migration base de données si nécessaire
- Redirection trafic
- Monitoring intensif

Cette architecture moderne garantit la maintenabilité à long terme tout en respectant les standards industriels 2025.