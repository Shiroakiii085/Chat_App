import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string; // Stored in name or we'd need to add it to schema, schema has no description. We can store it somewhere or just omit. We'll omit for now since Prisma schema only has name and avatarUrl.
}
