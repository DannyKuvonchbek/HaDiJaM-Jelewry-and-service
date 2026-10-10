import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AIConciergeMessageInput } from "../../../libs/dto/ai/concierge/ai-concierge.input";
import { SiteConciergeAnswerService } from "./site-concierge-answer.service";

const stopWords = new Set([
  "the", "and", "for", "with", "what", "show", "find", "want", "have", "from", "about", "price", "cost", "all", "list", "collection", "catalog", "catalogue", "products", "product", "items", "pieces", "piece", "offer", "available", "please",
  "please", "tell", "me", "you", "your", "our", "need", "looking", "are", "is", "can",
  "uchun", "qanday", "qaysi", "narxi", "narx", "haqida", "kerak", "menga", "bor", "bormi", "top", "ber", "iltimos",
  "как", "что", "покажи", "найди", "цена", "стоимость", "мне", "нужно", "есть", "подскажите",
  "제품", "가격", "보여", "찾아", "주세요", "무엇", "서비스", "어떤",
]);
const categoryAliases: Array<[RegExp, string[]]> = [
  [/(rings?|uzuk|uzuklar|반지|кольц)/i, ["ring", "rings", "uzuk"]],
  [/(necklace|chain|marjon|zanjir|sepochka|목걸이|ожерел|цеп)/i, ["necklace", "chain", "marjon", "zanjir"]],
  [/(bracelet|bilakuzuk|bilaguzuk|팔찌|браслет)/i, ["bracelet", "bilakuzuk"]],
  [/(earring|halqa|sirga|귀걸이|серьг)/i, ["earring", "earrings", "halqa"]],
  [/(watch|timepiece|soat|시계|час)/i, ["watch", "timepiece", "soat"]],
  [/(service|xizmat|ustaxona|atelier|수리|서비스|услуг)/i, ["service", "atelier", "xizmat"]],
];

function queryPattern(message: string): string | null {
  const normalized = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const aliases = categoryAliases.filter(([pattern]) => pattern.test(message.toLowerCase()) || pattern.test(normalized)).flatMap(([, values]) => values);
  const words = normalized.match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  const useful = words.filter((word) => !stopWords.has(word));
  const terms = [...new Set([...aliases, ...useful])].slice(0, 10);
  return terms.length ? terms.join("|") : null;
}

@Injectable()
export class AIConciergeService {
  constructor(
    @InjectModel("AIConversation") private readonly conversationModel: Model<any>,
    @InjectModel("AIConversationMessage") private readonly messageModel: Model<any>,
    @InjectModel("Product") private readonly productModel: Model<any>,
    @InjectModel("Service") private readonly serviceModel: Model<any>,
    @InjectModel("Member") private readonly memberModel: Model<any>,
    private readonly answerBuilder: SiteConciergeAnswerService,
  ) {}

  public async send(memberId: string | undefined, input: AIConciergeMessageInput) {
    const message = input.message.trim();
    if (!message || message.length > 2000)
      throw new BadRequestException("Message must be between 1 and 2,000 characters.");
    if (memberId && !(await this.memberModel.exists({ _id: memberId, memberStatus: "ACTIVE" }).exec()))
      throw new UnauthorizedException("Sign in with an active account to use saved conversations.");

    let conversation: any = null;
    if (memberId && input.conversationId) {
      conversation = await this.conversationModel.findOne({ _id: input.conversationId, memberId }).lean().exec();
      if (!conversation) throw new NotFoundException("Conversation not found.");
    }

    const serviceGuidance = this.answerBuilder.isServiceGuidanceQuestion(message);
    const purchaseIntent = !serviceGuidance && this.answerBuilder.isPurchaseQuestion(message);
    const skipCatalogSearch = serviceGuidance || purchaseIntent;
    const pattern = skipCatalogSearch ? null : queryPattern(message);
    const productSearch = pattern ? { $or: [
      { productTitle: { $regex: pattern, $options: "i" } },
      { productDesc: { $regex: pattern, $options: "i" } },
      { productType: { $regex: pattern, $options: "i" } },
    ] } : {};
    const serviceSearch = pattern ? { $or: [
      { serviceTitle: { $regex: pattern, $options: "i" } },
      { serviceDesc: { $regex: pattern, $options: "i" } },
      { serviceCategory: { $regex: pattern, $options: "i" } },
    ] } : {};

    const [products, services] = skipCatalogSearch ? [[], []] : await Promise.all([
      this.productModel.find({ productStatus: "ACTIVE", deletedAt: null, ...productSearch })
        .select("_id productTitle productType productPrice productImages productDesc")
        .sort({ productRank: -1, productViews: -1 }).limit(5).lean().exec(),
      this.serviceModel.find({ serviceStatus: "ACTIVE", deletedAt: null, ...serviceSearch })
        .select("_id serviceTitle serviceCategory servicePrice serviceDuration serviceDesc")
        .sort({ serviceRank: -1, serviceViews: -1 }).limit(4).lean().exec(),
    ]);

    const answer = this.answerBuilder.answer(input.locale, message, products, services).trim();
    if (!answer) throw new BadRequestException("The catalog concierge returned an empty response.");

    const action = serviceGuidance ? this.answerBuilder.serviceAction(input.locale) : null;
    let conversationId: string | undefined;
    if (memberId) {
      if (!conversation)
        conversation = await this.conversationModel.create({
          memberId,
          conversationTitle: message.slice(0, 120),
          lastMessageAt: new Date(),
        });
      conversationId = String(conversation._id);
      await this.messageModel.create([
        { conversationId, memberId, role: "USER", content: message, locale: input.locale },
        { conversationId, memberId, role: "ASSISTANT", content: answer, locale: input.locale, action },
      ]);
      await this.conversationModel.updateOne(
        { _id: conversation._id, memberId },
        { $set: { lastMessageAt: new Date() } },
      ).exec();
    }
    return { answer, conversationId, recommendedProducts: skipCatalogSearch ? [] : products, action };
  }

  public conversations(memberId: string) {
    return this.conversationModel.find({ memberId }).sort({ lastMessageAt: -1 }).limit(50).lean().exec();
  }

  public async messages(memberId: string, conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) throw new BadRequestException("Invalid conversation.");
    if (!(await this.conversationModel.exists({ _id: conversationId, memberId }).exec()))
      throw new NotFoundException("Conversation not found.");
    return this.messageModel.find({ conversationId, memberId }).sort({ createdAt: 1 }).limit(100).lean().exec();
  }
}
