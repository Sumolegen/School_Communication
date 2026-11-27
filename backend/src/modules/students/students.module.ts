import { Module } from '@nestjs/common';
import { ClassesController } from './classes/classes.controller';
import { ClassesService } from './classes/classes.service';
import { ProfilesController } from './profiles/profiles.controller';
import { ProfilesService } from './profiles/profiles.service';

@Module({
  controllers: [ClassesController, ProfilesController],
  providers: [ClassesService, ProfilesService],
  exports: [ClassesService, ProfilesService],
})
export class StudentsModule {}
