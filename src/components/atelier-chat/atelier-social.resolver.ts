import { BadRequestException, Injectable, UseGuards } from '@nestjs/common';
import { Args, Field, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ATELIER_SLUGS } from './atelier-chat.service';

@ObjectType()
class AtelierSocial {
  @Field() atelier: string;
  @Field(() => Int) likes: number;
  @Field(() => Int) followers: number;
  @Field() liked: boolean;
  @Field() followed: boolean;
}

@Injectable()
export class AtelierSocialService {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  private indexReady: Promise<string>;
  private async collection(atelier: string) {
    if (!ATELIER_SLUGS.includes(atelier)) throw new BadRequestException('Unknown atelier.');
    const collection = this.connection.collection('atelierReactions');
    this.indexReady ??= collection.createIndex({ atelier: 1, memberId: 1 }, { unique: true });
    await this.indexReady;
    return collection;
  }
  async get(atelier: string, memberId?: string): Promise<AtelierSocial> {
    const collection = await this.collection(atelier);
    const [summary] = await collection.aggregate([
      { $match: { atelier } },
      { $group: { _id: null, likes: { $sum: { $cond: ['$liked', 1, 0] } }, followers: { $sum: { $cond: ['$followed', 1, 0] } } } },
    ]).toArray();
    const own = memberId && Types.ObjectId.isValid(String(memberId))
      ? await collection.findOne({ atelier, memberId: new Types.ObjectId(String(memberId)) }) : null;
    return { atelier, likes: summary?.likes ?? 0, followers: summary?.followers ?? 0, liked: own?.liked === true, followed: own?.followed === true };
  }
  async set(atelier: string, memberId: string, field: 'liked' | 'followed', value: boolean) {
    const collection = await this.collection(atelier);
    const filter = { atelier, memberId: new Types.ObjectId(String(memberId)) };
    // Explicit desired state makes retries idempotent; each member has one record per atelier.
    try {
      await collection.updateOne(filter, { $set: { [field]: value, updatedAt: new Date() } }, { upsert: true });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      await collection.updateOne(filter, { $set: { [field]: value, updatedAt: new Date() } });
    }
    return this.get(atelier, memberId);
  }
}

@Resolver()
export class AtelierSocialResolver {
  constructor(private readonly social: AtelierSocialService) {}
  @UseGuards(WithoutGuard)
  @Query(() => AtelierSocial)
  getAtelierSocial(@Args('atelier') atelier: string, @AuthMember('_id') memberId?: string) {
    return this.social.get(atelier, memberId);
  }
  @UseGuards(AuthGuard)
  @Mutation(() => AtelierSocial)
  setAtelierLike(@Args('atelier') atelier: string, @Args('liked') liked: boolean, @AuthMember('_id') memberId: string) {
    return this.social.set(atelier, memberId, 'liked', liked);
  }
  @UseGuards(AuthGuard)
  @Mutation(() => AtelierSocial)
  setAtelierFollow(@Args('atelier') atelier: string, @Args('followed') followed: boolean, @AuthMember('_id') memberId: string) {
    return this.social.set(atelier, memberId, 'followed', followed);
  }
}
