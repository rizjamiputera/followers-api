import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppService } from './app.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // APP VERSIONING
    app.enableVersioning({
        type: VersioningType.URI,
    });

    // SWAGGER DOCUMENTATION
    const config = new DocumentBuilder()
        .setTitle('API Doc - The Followers Bicara')
        .setDescription('The Followers Bicara API Documentation')
        .setVersion('1.0')
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
    await appService.createPath('./public')
    await appService.createPath('./public/avatar');;
    await appService.createPath('./public/article');;

    // RUN APP
    const port = process.env.PORT ?? 5555;
    await app.listen(port);
    console.log(`App is running at http://localhost:${port}`);
}
bootstrap();
