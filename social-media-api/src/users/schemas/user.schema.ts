import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  // We add these now to prepare for Day 3
  @Prop({ type: [{ type: 'ObjectId', ref: 'User' }] })
  followers: User[];

  @Prop({ type: [{ type: 'ObjectId', ref: 'User' }] })
  following: User[];
  @Prop({ type: [{ type: 'ObjectId', ref: 'User' }] })
  sentFollowRequests: User[]; // Users that I have sent a request to

  @Prop({ type: [{ type: 'ObjectId', ref: 'User' }] })
  receivedFollowRequests: User[]; // Users that have sent a request to me
}

export const UserSchema = SchemaFactory.createForClass(User);

// Best Practice: Use a pre-save hook in the schema to automatically hash the password.
// This ensures that no matter where a user is created from, the password is secure.
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
