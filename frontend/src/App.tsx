import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from '@/components/common/ToastContainer';
import { AppLayout } from '@/components/layout/AppLayout';
import { RoleGuard } from '@/components/navigation/RoleGuard';
import { ROUTES } from '@/constants';
import { AcademicsProvider } from '@/state/academics/AcademicsContext';
import { AttendanceProvider } from '@/state/attendance/AttendanceContext';
import { AuthProvider } from '@/state/auth/AuthContext';
import { CommunicationProvider } from '@/state/communication/CommunicationContext';
import { NotificationsProvider } from '@/state/notifications/NotificationsContext';

import { AcademicUpdatesPage } from './app/academics/academic-updates/AcademicUpdatesPage';
import { AssessmentsPage } from './app/academics/assessments/AssessmentsPage';
import { ExamsPage } from './app/academics/exams/ExamsPage';
import { GradesPage } from './app/academics/grades/GradesPage';
import { MarksPage } from './app/academics/marks/MarksPage';
import { PerformancePage } from './app/academics/performance/PerformancePage';
import { ReportCardsPage } from './app/academics/report-cards/ReportCardsPage';
import { SubjectsPage } from './app/academics/subjects/SubjectsPage';
import { AttendancePerformancePage } from './app/analytics/attendance-performance/AttendancePerformancePage';
import { ClassPerformancePage } from './app/analytics/class-performance/ClassPerformancePage';
import { StudentPerformancePage } from './app/analytics/student-performance/StudentPerformancePage';
import { SubjectPerformancePage } from './app/analytics/subject-performance/SubjectPerformancePage';
import { AttendancePage } from './app/attendance/AttendancePage';
import { AlertsPage } from './app/communication/alerts/AlertsPage';
import { AnnouncementsPage } from './app/communication/announcements/AnnouncementsPage';
import { CircularsPage } from './app/communication/circulars/CircularsPage';
import { ClassUpdatesPage } from './app/communication/class-updates/ClassUpdatesPage';
import { EventsPage } from './app/communication/events/EventsPage';
import { HomeworkPage } from './app/communication/homework/HomeworkPage';
import { NotificationsPage } from './app/communication/notifications/NotificationsPage';
import { ParentCommunicationPage } from './app/communication/parent-communication/ParentCommunicationPage';
import { PhotosPage } from './app/communication/photos/PhotosPage';
import { DashboardPage } from './app/dashboard/DashboardPage';
import { LoginPage } from './app/login/LoginPage';
import { ProfilePage } from './app/profile/ProfilePage';
import { StaffPage } from './app/staff/StaffPage';
import { StudentsPage } from './app/students/StudentsPage';
import { TimetablePage } from './app/timetable/TimetablePage';

export const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationsProvider>
        <CommunicationProvider>
          <AttendanceProvider>
            <AcademicsProvider>
              <Routes>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route
                  element={
                    <RoleGuard>
                      <AppLayout />
                    </RoleGuard>
                  }
                >
                  <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                  <Route path={ROUTES.ANNOUNCEMENTS} element={<AnnouncementsPage />} />
                  <Route path={ROUTES.ALERTS} element={<AlertsPage />} />
                  <Route path={ROUTES.HOMEWORK} element={<HomeworkPage />} />
                  <Route path={ROUTES.EVENTS} element={<EventsPage />} />
                  <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                  <Route path={ROUTES.CLASS_UPDATES} element={<ClassUpdatesPage />} />
                  <Route path={ROUTES.CIRCULARS} element={<CircularsPage />} />
                  <Route path={ROUTES.PHOTOS} element={<PhotosPage />} />
                  <Route path={ROUTES.PARENT_COMMUNICATION} element={<ParentCommunicationPage />} />
                  <Route path={ROUTES.ATTENDANCE} element={<AttendancePage />} />
                  <Route path={ROUTES.TIMETABLE} element={<TimetablePage />} />
                  <Route path={ROUTES.SUBJECTS} element={<SubjectsPage />} />
                  <Route path={ROUTES.EXAMS} element={<ExamsPage />} />
                  <Route path={ROUTES.ASSESSMENTS} element={<AssessmentsPage />} />
                  <Route path={ROUTES.MARKS} element={<MarksPage />} />
                  <Route path={ROUTES.GRADES} element={<GradesPage />} />
                  <Route path={ROUTES.ACADEMIC_UPDATES} element={<AcademicUpdatesPage />} />
                  <Route path={ROUTES.REPORT_CARDS} element={<ReportCardsPage />} />
                  <Route path={ROUTES.PERFORMANCE} element={<PerformancePage />} />
                  <Route path={ROUTES.ANALYTICS_STUDENT} element={<StudentPerformancePage />} />
                  <Route path={ROUTES.ANALYTICS_SUBJECT} element={<SubjectPerformancePage />} />
                  <Route path={ROUTES.ANALYTICS_CLASS} element={<ClassPerformancePage />} />
                  <Route path={ROUTES.ANALYTICS_ATTENDANCE} element={<AttendancePerformancePage />} />
                  <Route path={ROUTES.STUDENTS} element={<StudentsPage />} />
                  <Route path={ROUTES.STAFF} element={<StaffPage />} />
                  <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                </Route>
                <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              </Routes>
              <ToastContainer />
            </AcademicsProvider>
          </AttendanceProvider>
        </CommunicationProvider>
      </NotificationsProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
