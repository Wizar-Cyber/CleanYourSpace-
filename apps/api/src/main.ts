import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PaymentDataInterceptor } from './common/interceptors/payment-data.interceptor';
import { JsonLogger } from './common/logger/json-logger.service';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api/v1');

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.enableShutdownHooks();

  app.enableCors({
    origin: [
      configService.get('CLEANER_APP_URL', 'http://localhost:5173'),
      configService.get('ADMIN_PANEL_URL', 'http://localhost:5174'),
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useLogger(new JsonLogger());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new PaymentDataInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  const port = configService.get('API_PORT', 4000);
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
