import { Controller, Get, Param, Post, UseGuards, Request, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post(':id/request-follow') // Changed from /follow
  sendFollowRequest(@Param('id') id: string, @Request() req) {
    const currentUserId = req.user.userId;
    return this.usersService.sendFollowRequest(id, currentUserId);
  }

  // --- NEW ENDPOINT ---
  @Post(':id/accept-follow')
  acceptFollowRequest(@Param('id') id: string, @Request() req) {
    const currentUserId = req.user.userId;
    return this.usersService.acceptFollowRequest(id, currentUserId);
  }

  // --- NEW ENDPOINT ---
  @Delete(':id/cancel-follow') // For canceling a request you sent
  cancelFollowRequest(@Param('id') id: string, @Request() req) {
    const currentUserId = req.user.userId;
    return this.usersService.cancelFollowRequest(id, currentUserId);
  }

  // The original unfollow endpoint remains the same
  @Delete(':id/unfollow') // Changed from /follow for clarity
  unfollow(@Param('id') id: string, @Request() req) {
    const currentUserId = req.user.userId;
    return this.usersService.unfollow(id, currentUserId);
  }
}
