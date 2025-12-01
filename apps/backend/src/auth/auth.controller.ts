import { Controller, Post, Body, Res, Req, UseGuards, UnauthorizedException, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string; code_challenge: string }) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const code = await this.authService.generateAuthCode(user, body.code_challenge);
    return { code };
  }

  @Post('token')
  async token(@Body() body: { code: string; code_verifier: string }, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.exchangeCode(body.code, body.code_verifier);
    
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { access_token: tokens.accessToken };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    // Decode token to get user id (simplified, ideally verify first)
    // In a real app, use a guard or verify the token structure first
    // Here we rely on the service to verify the token signature via jwtService if we moved logic there,
    // but for now let's assume the service handles the full validation including db check.
    // We need to decode it to get the ID first.
    // Let's use a guard for refresh usually, but here manual:
    
    // A better approach is using the RefreshTokenStrategy guard
    // But for simplicity in this controller method:
    // We need to decode the token to get the sub (userId)
    // We'll let the service handle verification if we pass the token.
    // However, the service needs userId.
    // Let's assume the RefreshTokenStrategy adds user to request.
    // See below for route with guard.
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh-token')
  async refreshToken(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user['sub'];
    const refreshToken = req.cookies['refresh_token'];
    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: tokens.accessToken };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.userId);
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req: any) {
    return req.user;
  }
}
