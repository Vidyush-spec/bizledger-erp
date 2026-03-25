import { Controller, Post, Get, Body, UseGuards, Request, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() req) {
    return this.authService.getMe(req.user.sub);
  }

  @Post('logout')
  @HttpCode(200)
  logout() {
    return { message: 'Logged out successfully' };
  }
}