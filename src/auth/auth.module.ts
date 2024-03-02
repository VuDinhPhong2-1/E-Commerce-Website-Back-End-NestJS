import { Module } from '@nestjs/common';
import { AuthService } from './auth.service'; // Module dịch vụ xác thực và quản lý người dùng trong ứng dụng
import { UsersModule } from 'src/users/users.module';
import { LocalStrategy } from './passport/local.strategy'; // Chiến lược xác thực cục bộ
import { PassportModule } from '@nestjs/passport'; // Mô-đun hỗ trợ xác thực và xác autorization
import { JwtModule } from '@nestjs/jwt'; // Thư viện hỗ trợ xác thực và quản lý JSON Web Tokens (JWT) trong NestJS
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './passport/jwt.strategy'; // Chiến lược xác minh và giải mã JWT trong ứng dụng
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import ms from 'ms';
import { RolesService } from 'src/roles/roles.service';
import { RolesModule } from 'src/roles/roles.module';
import { Role, RoleSchema } from 'src/roles/schemas/role.schema';
@Module({
  imports: [
    UsersModule,
    PassportModule,
    RolesModule,
    // Cấu hình configModule và configService cho JwtModule
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: ms(configService.get<string>('JWT_ACCESS_EXPIRE')) / 1000,
        },
      }),
      inject: [ConfigService],
      
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy], //LocalStrategy sẽ được hệ thống biết khi tạo AuthModule
})
export class AuthModule {

}
