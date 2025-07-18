/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './schemas/post.schema';
import { User } from 'src/users/schemas/user.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const createdPost = new this.postModel({
      ...createPostDto,
      author: userId,
    });
    return createdPost.save();
  }

  async getTimeline(currentUserId: string) {
    // 1. Find the current user to get their 'following' list
    const currentUser = await this.userModel.findById(currentUserId);
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // ✅ FIX: Include the user's own ID in the list
    const followingIds = [...currentUser.following, currentUserId];

    // 2. Find all posts where the author is in the 'following' + self list
    return this.postModel
      .find({ author: { $in: followingIds } })
      .populate('author', 'username email') // ⬅️ You can customize this further
      .sort({ createdAt: -1 }) // 3. Sort by newest first
      .exec();
  }
}
