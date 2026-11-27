import { PrismaClient, RoleCode, AttendanceStatus, DayOfWeek, ExamTermType, EventType, PriorityLevel, AnnouncementKind, TargetScope, RelationshipType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS: Array<{ code: string; module: string; description: string }> = [
  { code: 'PLATFORM_SCHOOL_MANAGE', module: 'school', description: 'Onboard and manage schools across platform' },
  { code: 'SCHOOL_BRANDING_MANAGE', module: 'school', description: 'Configure school branding and messaging settings' },
  { code: 'ACADEMIC_YEAR_MANAGE', module: 'academic-years', description: 'Create and activate academic years' },
  { code: 'USER_MANAGE', module: 'users', description: 'Pre-register and manage school users' },
  { code: 'PERMISSION_MANAGE', module: 'permissions', description: 'Configure school-level role permission overrides' },
  { code: 'STUDENT_MANAGE', module: 'students', description: 'Create and update student profiles and parent links' },
  { code: 'STUDENT_VIEW', module: 'students', description: 'View authorized student profiles' },
  { code: 'CLASS_MANAGE', module: 'students', description: 'Manage school classes and sections' },
  { code: 'STAFF_MANAGE', module: 'staff', description: 'Manage staff profiles and directory' },
  { code: 'STAFF_ASSIGN', module: 'staff', description: 'Assign teachers to classes and subjects' },
  { code: 'ANNOUNCEMENT_PUBLISH', module: 'communication', description: 'Publish school or class announcements' },
  { code: 'ALERT_PUBLISH', module: 'communication', description: 'Publish urgent or normal school alerts' },
  { code: 'CIRCULAR_PUBLISH', module: 'communication', description: 'Publish official school circulars' },
  { code: 'EVENT_MANAGE', module: 'communication', description: 'Create and manage events, holidays, PTMs, and exam schedules' },
  { code: 'HOMEWORK_PUBLISH', module: 'communication', description: 'Create and share daily homework' },
  { code: 'CLASS_UPDATE_PUBLISH', module: 'communication', description: 'Post section-specific class updates' },
  { code: 'PHOTO_UPLOAD', module: 'communication', description: 'Create albums and upload gallery photos' },
  { code: 'MESSAGE_SEND', module: 'communication', description: 'Participate in parent-teacher direct messaging' },
  { code: 'ATTENDANCE_MARK', module: 'attendance', description: 'Mark daily student attendance' },
  { code: 'ATTENDANCE_VIEW', module: 'attendance', description: 'View attendance records and reports' },
  { code: 'TIMETABLE_MANAGE', module: 'timetable', description: 'Create and update class timetables' },
  { code: 'TIMETABLE_VIEW', module: 'timetable', description: 'View class timetables' },
  { code: 'SUBJECT_MANAGE', module: 'academics', description: 'Manage school subjects' },
  { code: 'EXAM_MANAGE', module: 'academics', description: 'Manage exam terms, assessments, and grade scales' },
  { code: 'MARKS_ENTER', module: 'academics', description: 'Enter exam marks and academic updates' },
  { code: 'MARKS_VIEW', module: 'academics', description: 'View exam marks and report cards' },
  { code: 'ANALYTICS_VIEW', module: 'analytics', description: 'View authorized analytics dashboards and charts' },
];

const ROLE_DEFAULT_PERMISSIONS: Record<RoleCode, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map((p) => p.code),
  SCHOOL_ADMIN: PERMISSIONS.filter((p) => p.code !== 'PLATFORM_SCHOOL_MANAGE').map((p) => p.code),
  TEACHER: [
    'STUDENT_VIEW',
    'ANNOUNCEMENT_PUBLISH',
    'ALERT_PUBLISH',
    'HOMEWORK_PUBLISH',
    'CLASS_UPDATE_PUBLISH',
    'PHOTO_UPLOAD',
    'MESSAGE_SEND',
    'ATTENDANCE_MARK',
    'ATTENDANCE_VIEW',
    'TIMETABLE_VIEW',
    'MARKS_ENTER',
    'MARKS_VIEW',
    'ANALYTICS_VIEW',
  ],
  PARENT: [
    'STUDENT_VIEW',
    'MESSAGE_SEND',
    'ATTENDANCE_VIEW',
    'TIMETABLE_VIEW',
    'MARKS_VIEW',
    'ANALYTICS_VIEW',
  ],
  STUDENT: [
    'STUDENT_VIEW',
    'ATTENDANCE_VIEW',
    'TIMETABLE_VIEW',
    'MARKS_VIEW',
    'ANALYTICS_VIEW',
  ],
};

async function main() {
  console.log('Seeding School Communication database...');

  const roleRecords: Record<RoleCode, string> = {} as Record<RoleCode, string>;
  const roleNames: Record<RoleCode, string> = {
    SUPER_ADMIN: 'Super Admin',
    SCHOOL_ADMIN: 'School Administrator',
    TEACHER: 'Teacher',
    PARENT: 'Parent',
    STUDENT: 'Student',
  };

  for (const code of Object.values(RoleCode)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: roleNames[code] },
      create: { code, name: roleNames[code], isSystem: true },
    });
    roleRecords[code] = role.id;
  }

  const permMap: Record<string, string> = {};
  for (const perm of PERMISSIONS) {
    const saved = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
    permMap[perm.code] = saved.id;
  }

  for (const [roleCode, codes] of Object.entries(ROLE_DEFAULT_PERMISSIONS) as Array<[RoleCode, string[]]>) {
    const roleId = roleRecords[roleCode];
    for (const permCode of codes) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permMap[permCode] } },
        update: {},
        create: { roleId, permissionId: permMap[permCode] },
      });
    }
  }

  const defaultPinHash = await bcrypt.hash('1234', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // Super Admin
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { schoolId: null, phone: '9999999999' },
  });
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        schoolId: null,
        roleId: roleRecords.SUPER_ADMIN,
        phone: '9999999999',
        pinOrPasswordHash: adminPasswordHash,
        fullName: 'Super Admin',
        email: 'superadmin@schoolcomm.local',
        isPreRegistered: true,
        isActive: true,
      },
    });
  }

  // Demo School
  const school = await prisma.school.upsert({
    where: { schoolCode: 'DEMO01' },
    update: {},
    create: {
      schoolCode: 'DEMO01',
      name: 'Green Valley Public School',
      primaryColor: '#0F294A',
      accentColor: '#D97706',
      contactPhone: '9940877778',
      contactEmail: 'office@greenvalley.edu.in',
      address: '42 Knowledge Park Road, Chennai 600001',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'ANNUAL_5999',
      messagingBroadcastOnly: false,
      messagingStartHour: 7,
      messagingEndHour: 20,
      isActive: true,
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: '2026-2027' } },
    update: { isCurrent: true },
    create: {
      schoolId: school.id,
      name: '2026-2027',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      isCurrent: true,
    },
  });

  // Grade Scales
  const defaultScales = [
    { gradeLabel: 'A+', minPercentage: 90, maxPercentage: 100, remarks: 'Outstanding' },
    { gradeLabel: 'A', minPercentage: 80, maxPercentage: 89.99, remarks: 'Excellent' },
    { gradeLabel: 'B+', minPercentage: 70, maxPercentage: 79.99, remarks: 'Very Good' },
    { gradeLabel: 'B', minPercentage: 60, maxPercentage: 69.99, remarks: 'Good' },
    { gradeLabel: 'C', minPercentage: 50, maxPercentage: 59.99, remarks: 'Satisfactory' },
    { gradeLabel: 'D', minPercentage: 35, maxPercentage: 49.99, remarks: 'Needs Improvement' },
    { gradeLabel: 'F', minPercentage: 0, maxPercentage: 34.99, remarks: 'Fail' },
  ];
  for (const scale of defaultScales) {
    await prisma.gradeScale.upsert({
      where: { schoolId_gradeLabel: { schoolId: school.id, gradeLabel: scale.gradeLabel } },
      update: scale,
      create: { schoolId: school.id, ...scale },
    });
  }

  // School Admin, Teacher, Parent, Student users
  const schoolAdminUser = await prisma.user.upsert({
    where: { schoolId_phone: { schoolId: school.id, phone: '9876543210' } },
    update: {},
    create: {
      schoolId: school.id,
      roleId: roleRecords.SCHOOL_ADMIN,
      phone: '9876543210',
      pinOrPasswordHash: adminPasswordHash,
      fullName: 'Dr. Sumathi',
      email: 'principal@greenvalley.edu.in',
      isPreRegistered: true,
      isActive: true,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { schoolId_phone: { schoolId: school.id, phone: '9876543211' } },
    update: {},
    create: {
      schoolId: school.id,
      roleId: roleRecords.TEACHER,
      phone: '9876543211',
      pinOrPasswordHash: defaultPinHash,
      fullName: 'Anitha Krishnan',
      email: 'anitha.k@greenvalley.edu.in',
      isPreRegistered: true,
      isActive: true,
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { schoolId_phone: { schoolId: school.id, phone: '9876543212' } },
    update: {},
    create: {
      schoolId: school.id,
      roleId: roleRecords.PARENT,
      phone: '9876543212',
      pinOrPasswordHash: defaultPinHash,
      fullName: 'Ramesh Subramanian',
      email: 'ramesh.s@example.com',
      isPreRegistered: true,
      isActive: true,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { schoolId_phone: { schoolId: school.id, phone: '9876543213' } },
    update: {},
    create: {
      schoolId: school.id,
      roleId: roleRecords.STUDENT,
      phone: '9876543213',
      pinOrPasswordHash: defaultPinHash,
      fullName: 'Aarav Ramesh',
      isPreRegistered: true,
      isActive: true,
    },
  });

  const teacherProfile = await prisma.staffProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      schoolId: school.id,
      userId: teacherUser.id,
      employeeCode: 'TCH-001',
      designation: 'Senior Mathematics Teacher',
      qualification: 'M.Sc., B.Ed.',
      isTeacher: true,
    },
  });

  // Classes & Sections
  const class5 = await prisma.schoolClass.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Grade 5' } },
    update: {},
    create: { schoolId: school.id, name: 'Grade 5', displayOrder: 5 },
  });
  const class3 = await prisma.schoolClass.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Grade 3' } },
    update: {},
    create: { schoolId: school.id, name: 'Grade 3', displayOrder: 3 },
  });

  const section5A = await prisma.section.upsert({
    where: {
      schoolId_classId_academicYearId_name: {
        schoolId: school.id,
        classId: class5.id,
        academicYearId: academicYear.id,
        name: 'A',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      classId: class5.id,
      academicYearId: academicYear.id,
      name: 'A',
      classTeacherId: teacherProfile.id,
    },
  });

  const section3B = await prisma.section.upsert({
    where: {
      schoolId_classId_academicYearId_name: {
        schoolId: school.id,
        classId: class3.id,
        academicYearId: academicYear.id,
        name: 'B',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      classId: class3.id,
      academicYearId: academicYear.id,
      name: 'B',
      classTeacherId: teacherProfile.id,
    },
  });

  // Subjects
  const math = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'MATH' } },
    update: {},
    create: { schoolId: school.id, name: 'Mathematics', code: 'MATH' },
  });
  const science = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'SCI' } },
    update: {},
    create: { schoolId: school.id, name: 'Science', code: 'SCI' },
  });
  const english = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'ENG' } },
    update: {},
    create: { schoolId: school.id, name: 'English', code: 'ENG' },
  });

  // Staff assignments
  for (const [sec, subj, isCt] of [
    [section5A.id, math.id, true],
    [section5A.id, science.id, false],
    [section3B.id, english.id, false],
  ] as const) {
    await prisma.staffAssignment.upsert({
      where: {
        academicYearId_staffId_sectionId_subjectId: {
          academicYearId: academicYear.id,
          staffId: teacherProfile.id,
          sectionId: sec,
          subjectId: subj,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        staffId: teacherProfile.id,
        sectionId: sec,
        subjectId: subj,
        isClassTeacher: isCt,
      },
    });
  }

  // Two siblings linked to the same parent
  const student1 = await prisma.studentProfile.upsert({
    where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'GV2026-001' } },
    update: {},
    create: {
      schoolId: school.id,
      userId: studentUser.id,
      admissionNo: 'GV2026-001',
      fullName: 'Aarav Ramesh',
      rollNo: '01',
      gender: 'Male',
      bloodGroup: 'O+',
      sectionId: section5A.id,
      academicYearId: academicYear.id,
      guardianPhone: '9876543212',
    },
  });

  const student2 = await prisma.studentProfile.upsert({
    where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'GV2026-002' } },
    update: {},
    create: {
      schoolId: school.id,
      admissionNo: 'GV2026-002',
      fullName: 'Diya Ramesh',
      rollNo: '08',
      gender: 'Female',
      bloodGroup: 'A+',
      sectionId: section3B.id,
      academicYearId: academicYear.id,
      guardianPhone: '9876543212',
    },
  });

  for (const stu of [student1, student2]) {
    await prisma.parentStudentLink.upsert({
      where: { parentUserId_studentId: { parentUserId: parentUser.id, studentId: stu.id } },
      update: {},
      create: {
        schoolId: school.id,
        parentUserId: parentUser.id,
        studentId: stu.id,
        relationship: RelationshipType.FATHER,
        isPrimary: true,
      },
    });
  }

  // Timetable sample
  const timetableSeed = [
    { dayOfWeek: DayOfWeek.MON, periodNo: 1, startTime: '09:00', endTime: '09:45', subjectId: math.id },
    { dayOfWeek: DayOfWeek.MON, periodNo: 2, startTime: '09:45', endTime: '10:30', subjectId: science.id },
    { dayOfWeek: DayOfWeek.TUE, periodNo: 1, startTime: '09:00', endTime: '09:45', subjectId: english.id },
  ];
  for (const tt of timetableSeed) {
    await prisma.timetableEntry.upsert({
      where: {
        academicYearId_sectionId_dayOfWeek_periodNo: {
          academicYearId: academicYear.id,
          sectionId: section5A.id,
          dayOfWeek: tt.dayOfWeek,
          periodNo: tt.periodNo,
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        sectionId: section5A.id,
        teacherStaffId: teacherProfile.id,
        ...tt,
      },
    });
  }

  // Sample announcement, event, homework, exam term
  const existingAnnouncements = await prisma.announcement.count({ where: { schoolId: school.id } });
  if (existingAnnouncements === 0) {
    const ann = await prisma.announcement.create({
      data: {
        schoolId: school.id,
        createdById: schoolAdminUser.id,
        title: 'Welcome to Academic Year 2026-2027',
        body: 'School reopens on June 1st. Uniform and book distribution schedules are posted in Circulars.',
        kind: AnnouncementKind.ANNOUNCEMENT,
        priority: PriorityLevel.NORMAL,
        targetScope: TargetScope.ENTIRE_SCHOOL,
      },
    });
    await prisma.notification.create({
      data: {
        schoolId: school.id,
        recipientUserId: parentUser.id,
        title: ann.title,
        body: ann.body,
        category: 'ANNOUNCEMENT',
        priority: PriorityLevel.NORMAL,
        referenceType: 'ANNOUNCEMENT',
        referenceId: ann.id,
      },
    });
  }

  const existingEvents = await prisma.event.count({ where: { schoolId: school.id } });
  if (existingEvents === 0) {
    await prisma.event.createMany({
      data: [
        {
          schoolId: school.id,
          academicYearId: academicYear.id,
          title: 'Parent-Teacher Meeting (Term 1)',
          description: 'Review first-unit academic progress and attendance.',
          eventType: EventType.PTM,
          eventDate: new Date(Date.now() + 7 * 86400000),
          targetScope: TargetScope.ENTIRE_SCHOOL,
          createdById: schoolAdminUser.id,
        },
        {
          schoolId: school.id,
          academicYearId: academicYear.id,
          title: 'Annual Science Exhibition',
          description: 'Interactive student science models in the Main Auditorium.',
          eventType: EventType.EVENT,
          eventDate: new Date(Date.now() + 14 * 86400000),
          targetScope: TargetScope.ENTIRE_SCHOOL,
          createdById: schoolAdminUser.id,
        },
      ],
    });
  }

  const existingHw = await prisma.homework.count({ where: { schoolId: school.id } });
  if (existingHw === 0) {
    await prisma.homework.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        sectionId: section5A.id,
        subjectId: math.id,
        teacherId: teacherProfile.id,
        title: 'Fractions & Decimals Practice Sheet',
        instructions: 'Complete exercises 3.1 and 3.2 in your math notebook.',
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 2 * 86400000),
        externalLinks: [{ label: 'Khan Academy Fractions', url: 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic' }],
      },
    });
  }

  const existingAtt = await prisma.attendanceRecord.count({ where: { schoolId: school.id } });
  if (existingAtt === 0) {
    await prisma.attendanceRecord.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        sectionId: section5A.id,
        studentId: student1.id,
        date: new Date(),
        status: AttendanceStatus.PRESENT,
        markedById: teacherUser.id,
      },
    });
  }

  const term = await prisma.examTerm.upsert({
    where: {
      schoolId_academicYearId_termType_name: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        termType: ExamTermType.UNIT_TEST,
        name: 'Unit Test 1',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: 'Unit Test 1',
      termType: ExamTermType.UNIT_TEST,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-07-22'),
    },
  });

  const assessment = await prisma.assessment.upsert({
    where: {
      examTermId_sectionId_subjectId_title: {
        examTermId: term.id,
        sectionId: section5A.id,
        subjectId: math.id,
        title: 'Unit Test 1 - Mathematics',
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      examTermId: term.id,
      sectionId: section5A.id,
      subjectId: math.id,
      title: 'Unit Test 1 - Mathematics',
      maxMarks: 100,
      passMarks: 35,
      examDate: new Date('2026-07-16'),
    },
  });

  await prisma.examMark.upsert({
    where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: student1.id } },
    update: {},
    create: {
      schoolId: school.id,
      assessmentId: assessment.id,
      studentId: student1.id,
      marksObtained: 92,
      percentage: 92,
      grade: 'A+',
      isPassed: true,
      remarks: 'Consistent problem-solving skills.',
      enteredById: teacherUser.id,
    },
  });

  console.log('Seed completed cleanly.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
