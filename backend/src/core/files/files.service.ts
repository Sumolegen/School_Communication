import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '@config/prisma.service';
import { FileCategory, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId } from '@shared/utils';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getUploadBaseDir(): string {
    const configured = this.configService.get<string>('app.uploadDir')?.trim();
    return configured ? path.resolve(configured) : path.join(os.tmpdir(), 'school-communication-uploads');
  }

  async uploadFile(
    file: Express.Multer.File,
    category: FileCategory = FileCategory.OTHER,
    user: AuthUser,
    schoolIdParam?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Only PDF and JPEG/PNG/WEBP/GIF image files are allowed.');
    }

    const maxBytes = (this.configService.get<number>('app.maxFileSizeMb') ?? 10) * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`File exceeds maximum allowed size (${maxBytes / (1024 * 1024)} MB).`);
    }

    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '') || '.bin';
    const storageKey = `${schoolId}_${randomUUID()}${safeExt}`;
    const baseDir = this.getUploadBaseDir();
    await fs.mkdir(baseDir, { recursive: true });
    await fs.writeFile(path.join(baseDir, storageKey), file.buffer);

    const created = await this.prisma.fileAsset.create({
      data: {
        schoolId,
        uploadedById: user.userId,
        originalName: path.basename(file.originalname),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        publicUrl: '',
        category,
      },
    });

    return this.prisma.fileAsset.update({
      where: { id: created.id },
      data: { publicUrl: `/api/v1/files/${created.id}/download` },
    });
  }

  async getFileForDownload(id: string, user: AuthUser) {
    const asset = await this.prisma.fileAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('File not found.');
    }
    if (user.role !== RoleCode.SUPER_ADMIN && asset.schoolId !== user.schoolId) {
      throw new ForbiddenException('Cross-school file access is forbidden.');
    }

    const filePath = path.join(this.getUploadBaseDir(), asset.storageKey);
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      throw new NotFoundException('Stored file payload was not found on disk.');
    }

    return { asset, filePath };
  }
}
