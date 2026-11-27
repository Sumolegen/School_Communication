import { Module } from '@nestjs/common';
import { AcademicUpdatesController } from './academic-updates/academic-updates.controller';
import { AcademicUpdatesService } from './academic-updates/academic-updates.service';
import { AssessmentsController } from './assessments/assessments.controller';
import { AssessmentsService } from './assessments/assessments.service';
import { ExamsController } from './exams/exams.controller';
import { ExamsService } from './exams/exams.service';
import { GradesController } from './grades/grades.controller';
import { GradesService } from './grades/grades.service';
import { MarksController } from './marks/marks.controller';
import { MarksService } from './marks/marks.service';
import { PerformanceController } from './performance/performance.controller';
import { PerformanceService } from './performance/performance.service';
import { ReportCardsController } from './report-cards/report-cards.controller';
import { ReportCardsService } from './report-cards/report-cards.service';
import { SubjectsController } from './subjects/subjects.controller';
import { SubjectsService } from './subjects/subjects.service';

@Module({
  controllers: [
    SubjectsController,
    ExamsController,
    AssessmentsController,
    GradesController,
    MarksController,
    AcademicUpdatesController,
    ReportCardsController,
    PerformanceController,
  ],
  providers: [
    SubjectsService,
    ExamsService,
    AssessmentsService,
    GradesService,
    MarksService,
    AcademicUpdatesService,
    ReportCardsService,
    PerformanceService,
  ],
  exports: [
    SubjectsService,
    ExamsService,
    AssessmentsService,
    GradesService,
    MarksService,
    AcademicUpdatesService,
    ReportCardsService,
    PerformanceService,
  ],
})
export class AcademicsModule {}
