import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel('Notification') private readonly model: Model<any>) {}

  async createForMember(input: { memberId: string; title: string; description: string; group: string; authorId?: string; bookingId?: string; serviceId?: string }) {
    return this.model.create({
      notificationType: 'MESSAGE', notificationStatus: 'UNREAD',
      notificationGroup: input.group, notificationTitle: input.title,
      notificationDesc: input.description,
      authorId: input.authorId ? new Types.ObjectId(input.authorId) : new Types.ObjectId(input.memberId),
      receiverId: new Types.ObjectId(input.memberId),
      ...(input.bookingId ? { bookingId: new Types.ObjectId(input.bookingId) } : {}),
      ...(input.serviceId ? { serviceId: new Types.ObjectId(input.serviceId) } : {}),
    });
  }

  async createGlobal(dedupeKey: string, title: string, description: string) {
    try {
      return await this.model.create({
        notificationType: 'ANNOUNCEMENT', notificationStatus: 'UNREAD',
        notificationGroup: 'ATELIER_HOURS', notificationTitle: title,
        notificationDesc: description, authorId: null, receiverId: null,
        isGlobal: true, dedupeKey, readBy: [],
      });
    } catch (error) {
      if ((error as any)?.code === 11000) return null;
      throw error;
    }
  }

  async listForMember(memberId: string, page: number, limit: number) {
    const receiverId = new Types.ObjectId(memberId);
    const [personal, global, personalTotal, personalUnread, globalTotal, globalUnread] = await Promise.all([
      this.model.find({ receiverId }).sort({ createdAt: -1 }).limit(page * limit).lean().exec(),
      this.model.find({ isGlobal: true }).sort({ createdAt: -1 }).limit(page * limit).lean().exec(),
      this.model.countDocuments({ receiverId }).exec(),
      this.model.countDocuments({ receiverId, notificationStatus: 'UNREAD' }).exec(),
      this.model.countDocuments({ isGlobal: true }).exec(),
      this.model.countDocuments({ isGlobal: true, readBy: { $ne: receiverId } }).exec(),
    ]);
    const merged = [...personal, ...global.map((item: any) => ({
      ...item,
      notificationStatus: (item.readBy ?? []).some((id: any) => String(id) === memberId) ? 'READ' : 'UNREAD',
    }))].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const list = merged.slice((page - 1) * limit, page * limit);
    return { list, metaCounter: [{ total: personalTotal + globalTotal }], unreadCount: personalUnread + globalUnread };
  }

  async markRead(memberId: string, notificationId: string) {
    const receiverId = new Types.ObjectId(memberId);
    const personal = await this.model.findOneAndUpdate(
      { _id: notificationId, receiverId }, { $set: { notificationStatus: 'READ' } }, { new: true },
    ).lean().exec();
    if (personal) return personal;
    return this.model.findOneAndUpdate(
      { _id: notificationId, isGlobal: true }, { $addToSet: { readBy: receiverId } }, { new: true },
    ).lean().exec();
  }
}
