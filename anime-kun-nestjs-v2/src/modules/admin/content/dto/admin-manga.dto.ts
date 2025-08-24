import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, Max, IsIn } from 'class-validator';

export class CreateAdminMangaDto {
  @ApiProperty({ description: 'Titre du manga' })
  @IsString()
  @IsNotEmpty()
  titre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  niceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  auteur?: string;

  @ApiPropertyOptional({ description: 'Année (string 4 chars)' })
  @IsOptional()
  @IsString()
  annee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  origine?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titreOrig?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titreFr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titresAlternatifs?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  nbVol?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nbVolumes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statutVol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  editeur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ enum: [0, 1, 2] })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1, 2])
  statut?: number;
}

export class UpdateAdminMangaDto extends CreateAdminMangaDto {}

export class AdminMangaListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Année (string 4 chars)' })
  @IsOptional()
  @IsString()
  annee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  editeur?: string;

  @ApiPropertyOptional({ enum: [0, 1, 2] })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1, 2])
  statut?: number;
}

