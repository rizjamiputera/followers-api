import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppService } from './app.service';
import * as path from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // APP VERSIONING
    app.enableVersioning({
        type: VersioningType.URI,
    });

    // SWAGGER DOCUMENTATION
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = require(packageJsonPath);
    const config = new DocumentBuilder()
        .setTitle('API Doc - The Followers Bicara')
        .setDescription('The Followers Bicara API Documentation')
        .setVersion(packageJson.version)
        .addBearerAuth()
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    // CORS
    app.enableCors({
        origin: [process.env.WEB_URI],
        credentials: true,
    });

    const appService = app.get(AppService);
    await appService.createPath('./public');
    await appService.createPath('./public/avatar');
    await appService.createPath('./public/photo');

    // Tell Express to trust X-Forwarded-* headers
    app.getHttpAdapter().getInstance().set('trust proxy', true);

    // RUN APP
    const port = process.env.PORT ?? 5555;
    await app.listen(port);
    console.log(`App is running at http://localhost:${port}`);
}
bootstrap();
