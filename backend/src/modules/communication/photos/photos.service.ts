import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertSectionAccess, getStudentOrParentSectionIds, resolveEffectiveSchoolId, toDateOnly } from '@shared/utils';
import { AddPhotosToAlbumDto, CreatePhotoAlbumDto } from './photos.dto';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  async listAlbums(user: AuthUser, sectionId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    const where: Record<string, unknown> = { schoolId };

    if (sectionId) {
      where.sectionId = sectionId;
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const allowed = await getStudentOrParentSectionIds(this.prisma, user);
      where.OR = [{ sectionId: null }, { sectionId: { in: allowed.length ? allowed : ['__none__'] } }];
    }

    return this.prisma.photoAlbum.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      include: {
        section: { include: { schoolClass: true } },
        createdBy: { select: { id: true, fullName: true } },
        photos: {
          include: {
            file: { select: { id: true, originalName: true, mimeType: true, publicUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createAlbum(dto: CreatePhotoAlbumDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    if (dto.sectionId) {
      await assertSectionAccess(this.prisma, user, dto.sectionId);
    }

    return this.prisma.$transaction(async (tx) => {
      const album = await tx.photoAlbum.create({
        data: {
          schoolId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          eventDate: toDateOnly(dto.eventDate),
          sectionId: dto.sectionId ?? null,
          createdById: user.userId,
        },
      });

      if (dto.photos?.length) {
        await tx.photoItem.createMany({
          data: dto.photos.map((p) => ({
            schoolId,
            albumId: album.id,
            fileId: p.fileId,
            caption: p.caption ?? null,
          })),
        });
      }

      return tx.photoAlbum.findUnique({
        where: { id: album.id },
        include: {
          section: { include: { schoolClass: true } },
          photos: { include: { file: true } },
        },
      });
    });
  }

  async addPhotos(albumId: string, dto: AddPhotosToAlbumDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const album = await this.prisma.photoAlbum.findFirst({ where: { id: albumId, schoolId } });
    if (!album) throw new NotFoundException('Photo album not found.');

    await this.prisma.photoItem.createMany({
      data: dto.photos.map((p) => ({
        schoolId,
        albumId: album.id,
        fileId: p.fileId,
        caption: p.caption ?? null,
      })),
    });

    return this.prisma.photoAlbum.findUnique({
      where: { id: album.id },
      include: { photos: { include: { file: true } } },
    });
  }

  async removeAlbum(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.photoAlbum.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Photo album not found.');
    await this.prisma.photoAlbum.delete({ where: { id } });
    return { deleted: true, id };
  }
}
