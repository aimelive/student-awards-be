import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const PORT = configService.get<string | undefined>('PORT') || 3000;

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://mcsa-dashboard.vercel.app',
    ],
  });

  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  /**
   * Setting up global prefix
   */
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  /**
   * Enabling api versioning
   */
  app.enableVersioning({ type: VersioningType.URI });

  // Swagger Doc configuration
  const config = new DocumentBuilder()
    .setTitle('MCSA - Student Awards')
    .setDescription('Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  //Starting server
  await app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🔥`);
    console.log(`Docs: http://localhost:${PORT}/api/v1/docs ⌁`);
  });
}
bootstrap();
