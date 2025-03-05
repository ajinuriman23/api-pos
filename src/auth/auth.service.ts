import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { SignInDto } from './dto/signin.schema';
import { SignUpDto } from './dto/signup.schema';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async signin(signinDto: SignInDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword(signinDto);

    if (error) {
      switch (error.status) {
        case 400:
          this.logger.error('Email atau password salah', {
            error: error.message,
          });
          throw new BadRequestException({
            message: 'Email atau password salah',
            error: error.message,
          });
        case 404:
          this.logger.error('User tidak ditemukan', {
            error: error.message,
          });
          throw new NotFoundException({
            message: 'User tidak ditemukan',
            error: error.message,
          });
        default:
          this.logger.error('Terjadi kesalahan saat login', {
            error: error.message,
          });
          throw new InternalServerErrorException({
            message: 'Terjadi kesalahan saat login',
            error: error.message,
          });
      }
    }

    if (!data) {
      throw new NotFoundException({
        message: 'User tidak ditemukan',
        error: 'Data response kosong',
      });
    }

    return data;
  }

  async signup(signupDto: SignUpDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signUp(signupDto);
    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }
}
