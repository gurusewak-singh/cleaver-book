import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel
      .findById(id)
      .populate('receivedFollowRequests', 'username') // <-- POPULATE HERE
      .exec();
  }

  async findAll() {
    return this.userModel.find().select('-password').exec();
  }

  // --- Replacing 'follow' with 'sendFollowRequest' ---
  async sendFollowRequest(userIdToSendRequestTo: string, currentUserId: string) {
    if (userIdToSendRequestTo === currentUserId) {
      throw new Error('You cannot send a follow request to yourself.');
    }

    await this.userModel.updateOne(
      { _id: currentUserId, sentFollowRequests: { $ne: userIdToSendRequestTo } },
      { $push: { sentFollowRequests: userIdToSendRequestTo } }
    );

    await this.userModel.updateOne(
      { _id: userIdToSendRequestTo, receivedFollowRequests: { $ne: currentUserId } },
      { $push: { receivedFollowRequests: currentUserId } }
    );

    return { message: 'Follow request sent.' };
  }

  // --- Accept a follow request ---
  async acceptFollowRequest(userIdWhoSentRequest: string, currentUserId: string) {
    await this.userModel.updateOne(
      { _id: currentUserId },
      { $pull: { receivedFollowRequests: userIdWhoSentRequest } }
    );

    await this.userModel.updateOne(
      { _id: userIdWhoSentRequest },
      { $pull: { sentFollowRequests: currentUserId } }
    );

    await this.userModel.updateOne(
      { _id: currentUserId, followers: { $ne: userIdWhoSentRequest } },
      { $push: { followers: userIdWhoSentRequest } }
    );

    await this.userModel.updateOne(
      { _id: userIdWhoSentRequest, following: { $ne: currentUserId } },
      { $push: { following: currentUserId } }
    );

    return { message: 'Follow request accepted.' };
  }

  // --- Cancel a sent follow request ---
  async cancelFollowRequest(userIdToCancel: string, currentUserId: string) {
    await this.userModel.updateOne(
      { _id: currentUserId },
      { $pull: { sentFollowRequests: userIdToCancel } }
    );

    await this.userModel.updateOne(
      { _id: userIdToCancel },
      { $pull: { receivedFollowRequests: currentUserId } }
    );

    return { message: 'Follow request canceled.' };
  }

  // --- Unfollow a user ---
  async unfollow(userIdToUnfollow: string, currentUserId: string) {
    await this.userModel.updateOne(
      { _id: currentUserId },
      { $pull: { following: userIdToUnfollow } }
    );

    await this.userModel.updateOne(
      { _id: userIdToUnfollow },
      { $pull: { followers: currentUserId } }
    );

    return { message: 'Successfully unfollowed user.' };
  }
}
