import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import {
  BoardArticle,
  BoardArticles,
} from "../../libs/dto/board-article/board-article";
import {
  BoardArticleInput,
  BoardArticleUpdate,
  BoardArticlesInquiry,
} from "../../libs/dto/board-article/board-article.input";
import { MemberType } from "../../libs/enums/member.enum";
import { AuthMember } from "../auth/decorators/authMember.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { WithoutGuard } from "../auth/guards/without.guard";
import { BoardArticleService } from "./board-article.service";

@Resolver()
export class BoardArticleResolver {
  constructor(private readonly boardArticleService: BoardArticleService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => BoardArticle)
  public async createBoardArticle(
    @Args("input") input: BoardArticleInput,
    @AuthMember("_id") memberId: string,
  ): Promise<BoardArticle> {
    return await this.boardArticleService.createBoardArticle(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => BoardArticle)
  public async getBoardArticle(
    @Args("articleId") articleId: string,
    @AuthMember("_id") memberId: string,
  ): Promise<BoardArticle> {
    return this.boardArticleService.getBoardArticle(articleId, memberId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => BoardArticle)
  public async updateBoardArticle(
    @Args("input") input: BoardArticleUpdate,
    @AuthMember("_id") memberId: string,
  ): Promise<BoardArticle> {
    return this.boardArticleService.updateBoardArticle(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => BoardArticles)
  public async getBoardArticles(
    @Args("input") input: BoardArticlesInquiry,
  ): Promise<BoardArticles> {
    return this.boardArticleService.getBoardArticles(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => BoardArticle)
  public async likeTargetBoardArticle(
    @Args("articleId") articleId: string,
    @AuthMember("_id") memberId: string,
  ): Promise<BoardArticle> {
    return this.boardArticleService.likeTargetBoardArticle(memberId, articleId);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => BoardArticles)
  public async getAllBoardArticlesByAdmin(
    @Args("input") input: BoardArticlesInquiry,
  ): Promise<BoardArticles> {
    return this.boardArticleService.getAllBoardArticlesByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => BoardArticle)
  public async updateBoardArticleByAdmin(
    @Args("input") input: BoardArticleUpdate,
  ): Promise<BoardArticle> {
    return this.boardArticleService.updateBoardArticleByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => BoardArticle)
  public async removeBoardArticleByAdmin(
    @Args("articleId") articleId: string,
  ): Promise<BoardArticle> {
    return this.boardArticleService.removeBoardArticleByAdmin(articleId);
  }
}
