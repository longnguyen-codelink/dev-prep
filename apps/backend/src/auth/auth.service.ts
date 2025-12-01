import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  // In-memory store for auth codes (Production should use Redis/DB)
  private authCodes = new Map<string, { userId: number; codeChallenge: string }>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async generateAuthCode(user: any, codeChallenge: string) {
    const code = crypto.randomBytes(16).toString('hex');
    this.authCodes.set(code, { userId: user.id, codeChallenge });
    // Code expires in 5 minutes
    setTimeout(() => this.authCodes.delete(code), 5 * 60 * 1000);
    return code;
  }

  async exchangeCode(code: string, codeVerifier: string) {
    const authData = this.authCodes.get(code);
    if (!authData) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }

    // Verify PKCE
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    if (hash !== authData.codeChallenge) {
      throw new UnauthorizedException('Invalid code verifier');
    }

    this.authCodes.delete(code); // Consume code

    const user = await this.usersService.findOneById(authData.userId);
    return this.generateTokens(user);
  }

  async generateTokens(user: any) {
    const payload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m', secret: 'access-secret' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d', secret: 'refresh-secret' });

    await this.usersService.updateRefreshToken(user.id, await bcrypt.hash(refreshToken, 10));

    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.refreshToken) throw new UnauthorizedException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');

    const tokens = await this.generateTokens(user);
    return tokens;
  }

  async logout(userId: number) {
    return this.usersService.updateRefreshToken(userId, null);
  }
}
