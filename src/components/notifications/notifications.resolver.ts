import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { OrdinaryInquiry } from '../../libs/dto/product/product.input';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { AdminProductReviewMessageInput } from '../../libs/dto/notification/notification.input';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Resolver()
export class NotificationsResolver {
  constructor(
    @InjectModel('Notification') private readonly notificationModel: Model<any>,
    @InjectModel('Product') private readonly productModel: Model<any>,
    @InjectModel('Member') private readonly memberModel: Model<any>,
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Notification)
  async sendProductReviewMessage(
    @Args('input') input: AdminProductReviewMessageInput,
    @AuthMember('_id') adminId: string,
  ): Promise<Notification> {
    if (!Types.ObjectId.isValid(input.productId)) throw new BadRequestException('Invalid product.');
    const product = await this.productModel.findById(input.productId).select('_id memberId productTitle').lean().exec() as any;
    if (!product) throw new BadRequestException('Product not found.');
    const seller = await this.memberModel.findById(product.memberId).select('_id memberType').lean().exec() as any;
    if (!seller || seller.memberType !== MemberType.SELLER) throw new BadRequestException('The product owner is not an active seller account.');
    const notification = await this.notificationModel.create({
      notificationType: 'MESSAGE',
      notificationStatus: 'UNREAD',
      notificationGroup: 'PRODUCT_REVIEW',
      notificationTitle: 'Product authenticity review',
      notificationDesc: input.message.trim(),
      authorId: new Types.ObjectId(adminId),
      receiverId: seller._id,
      productId: product._id,
    });
    await this.gateway.emitMember(String(seller._id), notification);
    return notification;
  }

  @UseGuards(AuthGuard)
  @Query(() => Notifications)
  async getMyNotifications(
    @Args('input') input: OrdinaryInquiry,
    @AuthMember('_id') memberId: string,
  ): Promise<Notifications> {
    return this.notifications.listForMember(memberId, Math.max(1, input.page || 1), Math.min(100, Math.max(1, input.limit || 20))) as any;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Notification)
  async markMyNotificationRead(
    @Args('notificationId') notificationId: string,
    @AuthMember('_id') memberId: string,
  ): Promise<Notification> {
    if (!Types.ObjectId.isValid(notificationId)) throw new BadRequestException('Invalid message.');
    const notification = await this.notifications.markRead(memberId, notificationId);
    if (!notification) throw new BadRequestException('Message not found.');
    return notification as unknown as Notification;
  }
}
