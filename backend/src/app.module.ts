import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import appConfig from '@config/app.config';
import authConfig from '@config/auth.config';
import databaseConfig from '@config/database.config';
import { PrismaModule } from '@config/prisma.module';
import { validateEnvironment } from '@config/validation';
import { AcademicYearsModule } from '@core/academic-years/academic-years.module';
import { AuthModule } from '@core/auth/auth.module';
import { FilesModule } from '@core/files/files.module';
import { CoreNotificationsModule } from '@core/notifications/notifications.module';
import { PermissionsModule } from '@core/permissions/permissions.module';
import { RolesModule } from '@core/roles/roles.module';
import { SchoolModule } from '@core/school/school.module';
import { UsersModule } from '@core/users/users.module';
import { AcademicsModule } from '@modules/academics/academics.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { AttendanceModule } from '@modules/attendance/attendance.module';
import { CommunicationModule } from '@modules/communication/communication.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { StaffModule } from '@modules/staff/staff.module';
import { StudentsModule } from '@modules/students/students.module';
import { TimetableModule } from '@modules/timetable/timetable.module';
import { ApiModule } from '@api/api.module';
import { HttpExceptionFilter } from '@shared/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@shared/filters/prisma-exception.filter';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { TenantGuard } from '@shared/guards/tenant.guard';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { ResponseInterceptor } from '@shared/interceptors/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
      validate: validateEnvironment,
    }),
    PrismaModule,
    CoreNotificationsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SchoolModule,
    AcademicYearsModule,
    FilesModule,
    StudentsModule,
    StaffModule,
    CommunicationModule,
    AttendanceModule,
    TimetableModule,
    AcademicsModule,
    AnalyticsModule,
    DashboardModule,
    ApiModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
