import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { RecordsService } from '@modules/attendance/records/records.service';
import { AttendanceStatus, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';

describe('Attendance Marking & Automatic Absence Alerts', () => {
  const teacherUser: AuthUser = {
    userId: 'teacher-1',
    schoolId: 'school-a',
    role: RoleCode.TEACHER,
    permissions: ['ATTENDANCE_MARK'],
    phone: '9876543211',
    fullName: 'Anitha',
    staffId: 'staff-1',
    linkedStudentIds: [],
    assignedSectionIds: ['sec-1'],
  };

  it('defaults unmarked section roster students to PRESENT', async () => {
    const prismaMock = {
      section: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sec-1',
          schoolId: 'school-a',
          academicYearId: 'ay-1',
          classTeacherId: 'staff-1',
        }),
      },
      staffAssignment: { findFirst: jest.fn().mockResolvedValue({ id: 'assign-1' }) },
      studentProfile: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'stu-1', admissionNo: '001', fullName: 'Aarav', rollNo: '01' },
          { id: 'stu-2', admissionNo: '002', fullName: 'Diya', rollNo: '02' },
        ]),
      },
      attendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const notificationsMock = {
      notifyParentsOfAbsence: jest.fn().mockResolvedValue({ count: 0 }),
    } as unknown as CoreNotificationsService;

    const service = new RecordsService(prismaMock, notificationsMock);
    const roster = await service.getSectionRosterForDate('sec-1', '2026-11-27', teacherUser);

    expect(roster.alreadySubmitted).toBe(false);
    expect(roster.students).toHaveLength(2);
    expect(roster.students.every((s) => s.status === AttendanceStatus.PRESENT)).toBe(true);
  });

  it('triggers parent absence alerts only for ABSENT students on bulk submit', async () => {
    const upsertMock = jest.fn().mockImplementation(async ({ create }) => create);
    const prismaMock = {
      section: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sec-1',
          schoolId: 'school-a',
          academicYearId: 'ay-1',
          classTeacherId: 'staff-1',
        }),
      },
      staffAssignment: { findFirst: jest.fn().mockResolvedValue({ id: 'assign-1' }) },
      studentProfile: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'stu-1', fullName: 'Aarav' },
          { id: 'stu-2', fullName: 'Diya' },
        ]),
      },
      $transaction: jest.fn().mockImplementation(async (fn) =>
        fn({
          attendanceRecord: { upsert: upsertMock },
        }),
      ),
    } as unknown as PrismaService;

    const notifyMock = jest.fn().mockResolvedValue({ count: 1 });
    const notificationsMock = {
      notifyParentsOfAbsence: notifyMock,
    } as unknown as CoreNotificationsService;

    const service = new RecordsService(prismaMock, notificationsMock);
    const result = await service.markBulk(
      {
        sectionId: 'sec-1',
        date: '2026-11-27',
        records: [
          { studentId: 'stu-1', status: AttendanceStatus.PRESENT },
          { studentId: 'stu-2', status: AttendanceStatus.ABSENT },
        ],
      },
      teacherUser,
    );

    expect(result.savedCount).toBe(2);
    expect(result.absentCount).toBe(1);
    expect(result.absenceAlertsSent).toBe(1);
    expect(notifyMock).toHaveBeenCalledWith({
      schoolId: 'school-a',
      absentStudents: [{ studentId: 'stu-2', studentName: 'Diya', dateIso: '2026-11-27' }],
    });
  });

  it('rejects bulk attendance when a student does not belong to the section', async () => {
    const prismaMock = {
      section: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sec-1',
          schoolId: 'school-a',
          academicYearId: 'ay-1',
          classTeacherId: 'staff-1',
        }),
      },
      staffAssignment: { findFirst: jest.fn().mockResolvedValue({ id: 'assign-1' }) },
      studentProfile: { findMany: jest.fn().mockResolvedValue([{ id: 'stu-1', fullName: 'Aarav' }]) },
    } as unknown as PrismaService;

    const service = new RecordsService(prismaMock, {
      notifyParentsOfAbsence: jest.fn(),
    } as unknown as CoreNotificationsService);

    await expect(
      service.markBulk(
        {
          sectionId: 'sec-1',
          date: '2026-11-27',
          records: [
            { studentId: 'stu-1', status: AttendanceStatus.PRESENT },
            { studentId: 'stu-foreign', status: AttendanceStatus.ABSENT },
          ],
        },
        teacherUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
