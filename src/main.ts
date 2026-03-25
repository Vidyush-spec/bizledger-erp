// ═══════════════════════════════════════════════════════════
// MAIN.TS — The front door of your ERP backend
// Plain English: This is what starts everything when the
// server turns on. It sets up all the security locks before
// opening the door to any requests.
// ═══════════════════════════════════════════════════════════

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security headers ──────────────────────────────────
  // Plain English: Puts a security sticker on every response
  // that tells browsers to be extra careful. Prevents
  // common web attacks automatically.
  app.use(helmet());

  // ── Cookie parser ─────────────────────────────────────
  // Plain English: Allows the server to read secure cookies
  // where login tokens are stored.
  app.use(cookieParser());

  // ── CORS — who can talk to this API ───────────────────
  // Plain English: Only your ERP frontend is allowed to
  // talk to this backend. Rejects requests from anywhere else.
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,          // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // ── Input validation ──────────────────────────────────
  // Plain English: Every piece of data coming in is checked
  // before it's processed. Bad data is rejected immediately
  // with a clear error message.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Strip out any unexpected fields
    forbidNonWhitelisted: true, // Reject requests with unexpected fields
    transform: true,            // Auto-convert types (string → number etc.)
    transformOptions: { enableImplicitConversion: true },
  }));

  // ── API prefix ────────────────────────────────────────
  // Plain English: All API routes start with /api
  // e.g. /api/auth/login, /api/invoices, /api/employees
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 8080;
  await app.listen(port);

  console.log(`
  ╔════════════════════════════════════════╗
  ║  BizLedger ERP Backend is running!    ║
  ║  Port: ${port}                             ║
  ║  Environment: ${process.env.NODE_ENV}           ║
  ╚════════════════════════════════════════╝
  `);
}

bootstrap();
