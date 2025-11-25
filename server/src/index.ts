import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let app;

export default async function handler(req, res) {
    if (!app) {
        app = await NestFactory.create(AppModule);
        app.enableCors(); // Enable CORS
        await app.init();
    }
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
}
