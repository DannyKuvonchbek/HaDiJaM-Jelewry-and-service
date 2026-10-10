import { GovernanceModule } from './governance/governance.module';
import { Module } from '@nestjs/common';
import { MembersModule } from './members/members.module';
import { ProductsModule } from './products/products.module';
import { ServicesModule } from './services/services.module';
import { OrdersModule } from './orders/orders.module';
import { ServiceBookingsModule } from './service-bookings/service-bookings.module';
import { SalonReservationsModule } from './salon-reservations/salon-reservations.module';
import { ServiceSchedulesModule } from './service-schedules/service-schedules.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { ServiceDeliveriesModule } from './service-deliveries/service-deliveries.module';
import { ServiceReviewsModule } from './service-reviews/service-reviews.module';
import { LikesModule } from './likes/likes.module';
import { ViewsModule } from './views/views.module';
import { FollowsModule } from './follows/follows.module';
import { CommentsModule } from './comments/comments.module';
import { BoardArticlesModule } from './board-articles/board-articles.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AtelierChatModule } from './atelier-chat/atelier-chat.module';
import { AIModule } from './ai/ai.module';

@Module({
	imports: [
        GovernanceModule,
		MembersModule,
		ProductsModule,
		ServicesModule,
		OrdersModule,
		ServiceBookingsModule,
		SalonReservationsModule,
		ServiceSchedulesModule,
		ServiceRequestsModule,
		ServiceDeliveriesModule,
		ServiceReviewsModule,
		LikesModule,
		ViewsModule,
		FollowsModule,
		CommentsModule,
		BoardArticlesModule,
		AuthModule,
		NotificationsModule,
		AtelierChatModule,
		AIModule,
	],
})
export class ComponentsModule {}
