import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import NotificationSchema from '../../schemas/Notification.model';
import ProductSchema from '../../schemas/Product.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { NotificationsResolver } from './notifications.resolver';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Member', schema: MemberSchema },
    ]),
  ],
  providers: [NotificationsResolver],
})
export class NotificationsModule {}
