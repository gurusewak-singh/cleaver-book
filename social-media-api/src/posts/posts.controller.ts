/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard('jwt')) // This protects the endpoint
  @Post()
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    // req.user is attached by the JwtStrategy
    const userId = req.user.userId;
    return this.postsService.create(createPostDto, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('timeline')
  getTimeline(@Request() req) {
    const currentUserId = req.user.userId;
    return this.postsService.getTimeline(currentUserId);
  }
}
