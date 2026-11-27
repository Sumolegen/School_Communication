import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AttendanceStatus } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertStudentAccess, calculatePercentage, resolveGrade } from '@shared/utils';

@Injectable()
export class ReportCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReportCard(studentId: string, termId: string | undefined, user: AuthUser) {
    const stuAccess = await assertStudentAccess(this.prisma, user, studentId);

    const [student, school, gradeScales, marks, attendanceRecords, examTerm] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { id: stuAccess.id },
        include: {
          section: { include: { schoolClass: true } },
          academicYear: true,
        },
      }),
      this.prisma.school.findUnique({
        where: { id: stuAccess.schoolId },
        select: {
          id: true,
          name: true,
          schoolCode: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
          address: true,
          contactPhone: true,
        },
      }),
      this.prisma.gradeScale.findMany({ where: { schoolId: stuAccess.schoolId } }),
      this.prisma.examMark.findMany({
        where: {
          schoolId: stuAccess.schoolId,
          studentId: stuAccess.id,
          ...(termId ? { assessment: { examTermId: termId } } : {}),
        },
        include: {
          assessment: {
            include: {
              subject: true,
              examTerm: true,
            },
          },
        },
        orderBy: [{ assessment: { examTerm: { startDate: 'asc' } } }, { assessment: { subject: { name: 'asc' } } }],
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          schoolId: stuAccess.schoolId,
          academicYearId: stuAccess.academicYearId,
          studentId: stuAccess.id,
        },
        select: { status: true },
      }),
      termId ? this.prisma.examTerm.findFirst({ where: { id: termId, schoolId: stuAccess.schoolId } }) : null,
    ]);

    const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMax = marks.reduce((sum, m) => sum + m.assessment.maxMarks, 0);
    const overallPercentage = calculatePercentage(totalObtained, totalMax);
    const overallGrade = totalMax > 0 ? resolveGrade(overallPercentage, gradeScales) : 'N/A';
    const overallPassed = marks.length > 0 && marks.every((m) => m.isPassed);

    const presentDays = attendanceRecords.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE,
    ).length;
    const attendancePercentage =
      attendanceRecords.length > 0 ? Number(((presentDays / attendanceRecords.length) * 100).toFixed(1)) : 100;

    return {
      school,
      student: {
        id: student?.id,
        fullName: student?.fullName,
        admissionNo: student?.admissionNo,
        rollNo: student?.rollNo,
        className: student?.section.schoolClass.name,
        sectionName: student?.section.name,
        academicYear: student?.academicYear.name,
      },
      examTerm: examTerm ? { id: examTerm.id, name: examTerm.name, termType: examTerm.termType } : null,
      subjects: marks.map((m) => ({
        markId: m.id,
        termName: m.assessment.examTerm.name,
        termType: m.assessment.examTerm.termType,
        subjectName: m.assessment.subject.name,
        subjectCode: m.assessment.subject.code,
        assessmentTitle: m.assessment.title,
        marksObtained: m.marksObtained,
        maxMarks: m.assessment.maxMarks,
        passMarks: m.assessment.passMarks,
        percentage: m.percentage,
        grade: m.grade,
        isPassed: m.isPassed,
        remarks: m.remarks,
      })),
      summary: {
        totalObtained,
        totalMax,
        overallPercentage,
        overallGrade,
        resultStatus: marks.length === 0 ? 'PENDING' : overallPassed ? 'PASS' : 'FAIL',
        attendancePercentage,
        totalAttendanceDays: attendanceRecords.length,
        presentDays,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
