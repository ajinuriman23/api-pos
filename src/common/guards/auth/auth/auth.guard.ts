import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import RequestWithUser from 'src/interfaces/request.interface';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    constructor(private supabaseService: SupabaseService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const token = this.extractTokenFromHeader(request);


        if (!token) {
            throw new UnauthorizedException('Token not found');
        }

        try {
            const user = await this.supabaseService.verifyToken(token);
            const { data: userData, error: userError } = await this.supabaseService
              .getClient()  
              .from('users').select('*').eq('account_id', user.id).single();
              
            if (userError || !userData) {
              throw new UnauthorizedException('Data pengguna tidak ditemukan');
            }

            request.user = userData; // Menyimpan data pengguna ke request
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}