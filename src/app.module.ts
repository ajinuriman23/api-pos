import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase/supabase.service';
import { UserModule } from './user/user.module';
import { AuthMiddleware } from './common/middleware/auth/auth.middleware';
import { OutletModule } from './outlet/outlet.module';
import { ProfileModule } from './profile/profile.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [AuthModule,ConfigModule.forRoot({
    isGlobal: true,
  }), UserModule, OutletModule, ProfileModule, ProductModule, CategoryModule, CartModule],
  controllers: [AppController],
  providers: [AppService, SupabaseService],  
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*'); // Terapkan middleware ke semua route
  }
}
