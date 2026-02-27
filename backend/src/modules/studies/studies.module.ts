import { Module } from '@nestjs/common';
import { PlansModule } from './plans/plans.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TopicsModule } from './topics/topics.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [
    PlansModule,
    SubjectsModule,
    TopicsModule,
    ReviewsModule, // Debe ir antes de SessionsModule (dependencia)
    SessionsModule,
  ],
})
export class StudiesModule {}
