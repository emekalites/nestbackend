import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilityModule } from './modules/utility/utility.module';
import databaseConfig from './config/database.config';
import { DataSource } from 'typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import * as path from 'path';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';
import { StoresModule } from './modules/stores/stores.module';

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

@Module({
  imports: [
    ConfigModule.forRoot({ load: [databaseConfig], isGlobal: true, expandVariables: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        ...configService.get<DatabaseConfig>('database'),
        migrationsTableName: 'migrations',
        entities: [path.resolve(__dirname + '/../dist/**/*.entity{.ts,.js}')],
        migrations: [path.resolve(__dirname + '/../dist/database/migration/*{.ts,.js}')],
        synchronize: false,
        logging: configService.get<string>('MODE') === 'development',
        uuidExtension: 'pgcrypto',
      }),
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
    UtilityModule,
    UserModule,
    AuthModule,
    StoresModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
