import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access_secret',
      expiresIn: '15m',
    });

    const rawRefreshString = randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(rawRefreshString, 10);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenDoc = await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenHash, // Store the hash
        userId,
        expiresAt,
      },
    });

    // We send back tokenId.rawString so we can look it up efficiently by ID
    const refreshToken = `${refreshTokenDoc.id}.${rawRefreshString}`;

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, displayName } = registerDto;
    
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await this.hashPassword(password);
    
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refresh(refreshTokenRaw: string) {
    const parts = refreshTokenRaw.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    const [tokenId, rawString] = parts;

    const refreshTokenDoc = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
      include: { user: true },
    });

    if (!refreshTokenDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshTokenDoc.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: tokenId } });
      throw new UnauthorizedException('Refresh token expired');
    }

    const isValid = await bcrypt.compare(rawString, refreshTokenDoc.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Delete old token (Rotation)
    await this.prisma.refreshToken.delete({ where: { id: tokenId } });

    // Generate new tokens
    return this.generateTokens(refreshTokenDoc.user.id, refreshTokenDoc.user.email);
  }

  async logout(refreshTokenRaw: string) {
    const parts = refreshTokenRaw.split('.');
    if (parts.length === 2) {
      const [tokenId] = parts;
      await this.prisma.refreshToken.deleteMany({
        where: { id: tokenId },
      });
    }
    return { success: true };
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from google');
    }

    const { email, firstName, lastName, picture } = req.user;
    const displayName = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          displayName,
          avatarUrl: picture,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
