import {
  Res,
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  UseGuards,
  Req,
  Get,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { GoogleGuard } from './guard/google.guard.js';
import { type Response } from 'express';
import { ZodValidationPipe } from '../../lib/pipes/zod.pipe.js';
import { RegisterSchema, LoginSchema } from '@repo/dto';
import { Public } from './decorator/public.decorator.js';

/** Opsi default untuk cookie autentikasi */
const COOKIE_NAME = 'cookie_token';
const COOKIE_SECURE =
  process.env.AUTH_COOKIE_SECURE === 'true' ||
  (process.env.AUTH_COOKIE_SECURE == null &&
    process.env.FRONTEND_URL?.startsWith('https://'));
const COOKIE_SAME_SITE = COOKIE_SECURE ? 'none' : 'lax';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE as 'none' | 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 1 hari (ms)
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint untuk mendaftarkan user baru menggunakan email dan password.
   */
  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 403, description: 'Email already in use' })
  @UsePipes(new ZodValidationPipe(RegisterSchema)) // <-- TAMBAHAN BARU: Terapkan Pipe di sini
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokenData = await this.authService.register(dto);
    res.cookie(COOKIE_NAME, tokenData.access_token, COOKIE_OPTIONS);
    return tokenData;
  }

  /**
   * Endpoint untuk login menggunakan email dan password. Mengembalikan JWT token.
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT' })
  @ApiResponse({ status: 403, description: 'Invalid credentials' })
  @UsePipes(new ZodValidationPipe(LoginSchema)) // <-- TAMBAHAN BARU: Terapkan Pipe di sini
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokenData = await this.authService.login(dto);
    res.cookie(COOKIE_NAME, tokenData.access_token, COOKIE_OPTIONS);
    return tokenData;
  }

  /**
   * Endpoint untuk logout.
   * Menghapus cookie autentikasi dan mengembalikan pesan sukses.
   */
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE as 'none' | 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Authenticated user returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.sub);
  }

  /**
   * Endpoint untuk memulai proses login via akun Google (OAuth2).
   */
  @Get('google')
  @Public()
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Login with Google OAuth2' })
  googleAuth() {
    // This endpoint will redirect the user to the Google login page.
  }

  /**
   * Callback endpoint setelah user berhasil login di halaman Google.
   * Set cookie autentikasi, lalu redirect user kembali ke frontend.
   */
  @Get('google/callback')
  @Public()
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Google OAuth2 callback URL' })
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const tokenData = await this.authService.googleLogin(req);
    const token = tokenData.access_token;

    // Set cookie sebelum redirect
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
}
