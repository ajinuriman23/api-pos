import { Body, Controller, Post } from '@nestjs/common';
import { SignInDto, SignInSchema } from './dto/signin.schema';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.schema';
import { SignUpSchema } from './dto/signup.schema';
import { ZodValidationPipe } from '../common/pipes/zod-validation/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  signin(@Body(new ZodValidationPipe(SignInSchema)) signinDto: SignInDto) {
    return this.authService.signin(signinDto);
  }

  @Post('signup')
  signup(@Body(new ZodValidationPipe(SignUpSchema)) signupDto: SignUpDto) {
    return this.authService.signup(signupDto);
  }
}
