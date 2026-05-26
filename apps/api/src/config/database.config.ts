import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export function getDatabaseConfig(config: ConfigService): DataSourceOptions {
  return {
    type: 'postgres',
    host: config.get('DB_HOST', 'localhost'),
    port: config.get('DB_PORT', 5432),
    username: config.get('DB_USER', 'corecon'),
    password: config.get('DB_PASSWORD', 'changeme'),
    database: config.get('DB_NAME', 'corecon'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: false,
  };
}

const configService = new ConfigService();
export const AppDataSource = new DataSource(getDatabaseConfig(configService));
