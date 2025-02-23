import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { SignInDto } from './dto/signin.schema';
import { SignUpDto } from './dto/signup.schema';

@Injectable()
export class AuthService {

    constructor(private readonly supabaseService: SupabaseService) {}

    async signin(signinDto: SignInDto) {
        try {
            const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword(signinDto);
            if (error) {
                throw new Error(error.message);
            }
            return data;
        } catch (error) {
            throw new Error(error.message);
        }
    }  
    
    async signup(signupDto: SignUpDto) {
        try {
            const { data, error } = await this.supabaseService.getClient().auth.signUp(signupDto);
            if (error) {
                throw new Error(error.message);
            }
            return data;
        } catch (error) {
            throw new Error(error.message);
        }
    }
}
