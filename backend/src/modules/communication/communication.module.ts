import { Module } from '@nestjs/common';
import { AlertsController } from './alerts/alerts.controller';
import { AlertsService } from './alerts/alerts.service';
import { AnnouncementsController } from './announcements/announcements.controller';
import { AnnouncementsService } from './announcements/announcements.service';
import { CircularsController } from './circulars/circulars.controller';
import { CircularsService } from './circulars/circulars.service';
import { ClassUpdatesController } from './class-updates/class-updates.controller';
import { ClassUpdatesService } from './class-updates/class-updates.service';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { HomeworkSharingController } from './homework-sharing/homework-sharing.controller';
import { HomeworkSharingService } from './homework-sharing/homework-sharing.service';
import { CommunicationNotificationsController } from './notifications/communication-notifications.controller';
import { CommunicationNotificationsService } from './notifications/communication-notifications.service';
import { ParentCommunicationController } from './parent-communication/parent-communication.controller';
import { ParentCommunicationService } from './parent-communication/parent-communication.service';
import { PhotosController } from './photos/photos.controller';
import { PhotosService } from './photos/photos.service';

@Module({
  controllers: [
    AnnouncementsController,
    AlertsController,
    CommunicationNotificationsController,
    HomeworkSharingController,
    EventsController,
    CircularsController,
    PhotosController,
    ClassUpdatesController,
    ParentCommunicationController,
  ],
  providers: [
    AnnouncementsService,
    AlertsService,
    CommunicationNotificationsService,
    HomeworkSharingService,
    EventsService,
    CircularsService,
    PhotosService,
    ClassUpdatesService,
    ParentCommunicationService,
  ],
  exports: [
    AnnouncementsService,
    AlertsService,
    CommunicationNotificationsService,
    HomeworkSharingService,
    EventsService,
    CircularsService,
    PhotosService,
    ClassUpdatesService,
    ParentCommunicationService,
  ],
})
export class CommunicationModule {}
