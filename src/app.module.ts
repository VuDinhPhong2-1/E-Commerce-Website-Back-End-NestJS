import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { softDeletePlugin } from 'soft-delete-plugin-mongoose';
import { FilesModule } from './files/files.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { DatabasesModule } from './databases/databases.module';
// import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],  // Thêm ConfigModule vào đây
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          connection.plugin(softDeletePlugin);
          return connection;
        }
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({ isGlobal: true }),// Cấu hình toàn cục, truy cập từ bất kỳ module nào trong ứng dụng mà không cần phải import lại ConfigModule
    UsersModule,
    AuthModule,
    FilesModule,
    PermissionsModule,
    RolesModule,
    DatabasesModule,
    //MailModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService,

  ],
})
export class AppModule { }
