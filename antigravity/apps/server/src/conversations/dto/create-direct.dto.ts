import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectDto {
  @IsString()
  @IsNotEmpty()
  targetUserId: string;
}
