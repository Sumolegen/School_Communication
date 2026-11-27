import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { NotificationCategory, PriorityLevel, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertStudentAccess, resolveEffectiveSchoolId } from '@shared/utils';
import { SendMessageDto } from './parent-communication.dto';

@Injectable()
export class ParentCommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async listThreads(user: AuthUser, studentId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    const where: Record<string, unknown> = { schoolId };

    if (user.role === RoleCode.PARENT) {
      where.parentUserId = user.userId;
      if (studentId) {
        await assertStudentAccess(this.prisma, user, studentId);
        where.studentId = studentId;
      }
    } else if (user.role === RoleCode.TEACHER) {
      where.teacherUserId = user.userId;
    } else if (user.role === RoleCode.STUDENT) {
      where.studentId = user.studentId ?? '__none__';
    }

    const threads = await this.prisma.messageThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNo: true,
            section: { include: { schoolClass: true } },
          },
        },
        // Never expose phone numbers in thread responses to protect teacher privacy
        parentUser: { select: { id: true, fullName: true } },
        teacherUser: { select: { id: true, fullName: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            attachmentFile: { select: { id: true, originalName: true, publicUrl: true } },
          },
        },
      },
    });

    const unreadCounts = await this.prisma.message.groupBy({
      by: ['threadId'],
      where: {
        schoolId,
        receiverUserId: user.userId,
        isRead: false,
      },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadCounts.map((u) => [u.threadId, u._count.id]));

    return threads.map((t) => ({
      ...t,
      lastMessage: t.messages[0] ?? null,
      unreadCount: unreadMap.get(t.id) ?? 0,
    }));
  }

  async getMessages(threadId: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const thread = await this.prisma.messageThread.findFirst({
      where: { id: threadId, schoolId },
      include: {
        student: { select: { id: true, fullName: true, admissionNo: true } },
        parentUser: { select: { id: true, fullName: true } },
        teacherUser: { select: { id: true, fullName: true } },
      },
    });
    if (!thread) throw new NotFoundException('Message thread not found.');

    const isParticipant = thread.parentUserId === user.userId || thread.teacherUserId === user.userId;
    if (!isParticipant && user.role !== RoleCode.SCHOOL_ADMIN && user.role !== RoleCode.SUPER_ADMIN) {
      throw new ForbiddenException('You are not a participant in this conversation thread.');
    }

    const messages = await this.prisma.message.findMany({
      where: { threadId: thread.id, schoolId },
      orderBy: { createdAt: 'asc' },
      include: {
        senderUser: { select: { id: true, fullName: true, role: { select: { code: true } } } },
        attachmentFile: { select: { id: true, originalName: true, mimeType: true, publicUrl: true } },
      },
    });

    return { thread, messages };
  }

  async markThreadRead(threadId: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const result = await this.prisma.message.updateMany({
      where: {
        schoolId,
        threadId,
        receiverUserId: user.userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async getAvailableContacts(user: AuthUser, studentId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);

    if (user.role === RoleCode.PARENT) {
      const targetStudentId = studentId ?? user.linkedStudentIds[0];
      if (!targetStudentId) return [];
      const student = await assertStudentAccess(this.prisma, user, targetStudentId);

      const assignments = await this.prisma.staffAssignment.findMany({
        where: { schoolId, sectionId: student.sectionId },
        include: {
          staff: {
            include: {
              user: { select: { id: true, fullName: true } },
            },
          },
          subject: { select: { id: true, name: true } },
        },
      });

      const teacherMap = new Map<string, { userId: string; fullName: string; designation: string; subjects: string[] }>();
      for (const a of assignments) {
        const key = a.staff.user.id;
        const entry = teacherMap.get(key) ?? {
          userId: a.staff.user.id,
          fullName: a.staff.user.fullName,
          designation: a.staff.designation,
          subjects: [],
        };
        if (a.subject) entry.subjects.push(a.subject.name);
        else if (a.isClassTeacher) entry.subjects.push('Class Teacher');
        teacherMap.set(key, entry);
      }
      return Array.from(teacherMap.values());
    }

    if (user.role === RoleCode.TEACHER || user.role === RoleCode.SCHOOL_ADMIN) {
      const sectionIds =
        user.role === RoleCode.TEACHER
          ? user.assignedSectionIds.length
            ? user.assignedSectionIds
            : ['__none__']
          : undefined;

      const students = await this.prisma.studentProfile.findMany({
        where: {
          schoolId,
          isActive: true,
          ...(sectionIds ? { sectionId: { in: sectionIds } } : {}),
        },
        include: {
          section: { include: { schoolClass: true } },
          parentLinks: {
            include: {
              parentUser: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { fullName: 'asc' },
      });

      return students.flatMap((stu) =>
        stu.parentLinks.map((link) => ({
          studentId: stu.id,
          studentName: stu.fullName,
          className: `${stu.section.schoolClass.name} - ${stu.section.name}`,
          userId: link.parentUser.id,
          fullName: link.parentUser.fullName,
          relationship: link.relationship,
        })),
      );
    }

    return [];
  }

  async sendMessage(dto: SendMessageDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found.');

    if (user.role === RoleCode.STUDENT) {
      throw new ForbiddenException('Direct parent-teacher messaging is restricted to parents and teachers.');
    }

    if (user.role === RoleCode.PARENT) {
      if (school.messagingBroadcastOnly) {
        throw new ForbiddenException('School is currently configured for one-way broadcast messaging only.');
      }
      if (school.messagingStartHour !== null && school.messagingEndHour !== null) {
        const currentHour = new Date().getHours();
        if (currentHour < school.messagingStartHour || currentHour >= school.messagingEndHour) {
          throw new ForbiddenException(
            `Parent messaging is allowed only between ${school.messagingStartHour}:00 and ${school.messagingEndHour}:00.`,
          );
        }
      }
    }

    let thread = dto.threadId
      ? await this.prisma.messageThread.findFirst({ where: { id: dto.threadId, schoolId } })
      : null;

    if (!thread) {
      if (!dto.studentId || !dto.receiverUserId) {
        throw new BadRequestException('Provide either threadId, or both studentId and receiverUserId.');
      }
      const student = await assertStudentAccess(this.prisma, user, dto.studentId);

      let parentUserId: string;
      let teacherUserId: string;

      if (user.role === RoleCode.PARENT) {
        parentUserId = user.userId;
        teacherUserId = dto.receiverUserId;
        const assignment = await this.prisma.staffAssignment.findFirst({
          where: {
            schoolId,
            sectionId: student.sectionId,
            staff: { userId: teacherUserId },
          },
        });
        const classTeacher = await this.prisma.section.findFirst({
          where: { id: student.sectionId, classTeacher: { userId: teacherUserId } },
        });
        if (!assignment && !classTeacher) {
          throw new ForbiddenException('Parents may only message teachers assigned to their child’s class.');
        }
      } else {
        teacherUserId = user.userId;
        parentUserId = dto.receiverUserId;
        const link = await this.prisma.parentStudentLink.findUnique({
          where: { parentUserId_studentId: { parentUserId, studentId: student.id } },
        });
        if (!link) {
          throw new ForbiddenException('Selected recipient is not a linked parent of this student.');
        }
      }

      thread = await this.prisma.messageThread.upsert({
        where: {
          schoolId_studentId_parentUserId_teacherUserId: {
            schoolId,
            studentId: student.id,
            parentUserId,
            teacherUserId,
          },
        },
        update: {},
        create: {
          schoolId,
          studentId: student.id,
          parentUserId,
          teacherUserId,
        },
      });
    } else {
      const isParticipant = thread.parentUserId === user.userId || thread.teacherUserId === user.userId;
      if (!isParticipant) {
        throw new ForbiddenException('You cannot post into this conversation thread.');
      }
    }

    const receiverUserId =
      thread.parentUserId === user.userId ? thread.teacherUserId : thread.parentUserId;

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          schoolId,
          threadId: thread.id,
          senderUserId: user.userId,
          receiverUserId,
          body: dto.body.trim(),
          attachmentFileId: dto.attachmentFileId ?? null,
        },
        include: {
          senderUser: { select: { id: true, fullName: true } },
          attachmentFile: { select: { id: true, originalName: true, publicUrl: true } },
        },
      });

      await tx.messageThread.update({
        where: { id: thread.id },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    await this.notificationsService.dispatchToUsers({
      schoolId,
      recipientUserIds: [receiverUserId],
      studentId: thread.studentId,
      title: `New Message from ${user.fullName}`,
      body: dto.body.trim().slice(0, 140),
      category: NotificationCategory.MESSAGE,
      priority: PriorityLevel.NORMAL,
      referenceType: 'MESSAGE_THREAD',
      referenceId: thread.id,
    });

    return message;
  }
}
