import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/config/prisma.service';
import { createGlobalValidationPipe } from '../../src/shared/pipes/validation.pipe';

describe('School Communication API E2E (with mocked Prisma layer)', () => {
  let app: INestApplication;

  const prismaStub = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    school: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'school-demo',
        schoolCode: 'DEMO01',
        name: 'Green Valley Public School',
        logoUrl: null,
        primaryColor: '#0F294A',
        accentColor: '#D97706',
        contactPhone: '9940877778',
        contactEmail: 'office@greenvalley.edu.in',
        address: 'Chennai',
        subscriptionStatus: 'ACTIVE',
        messagingBroadcastOnly: false,
        messagingStartHour: 7,
        messagingEndHour: 20,
      }),
    },
  };

  beforeAll(async () => {
    process.env.SKIP_DB_CONNECT = 'true';
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/school_communication';
    process.env.JWT_SECRET = 'test-secret-key-min-32-chars-for-e2e';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns service health payload', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /api/v1/school/config?schoolCode=DEMO01 returns school white-label branding', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/school/config?schoolCode=DEMO01')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.schoolCode).toBe('DEMO01');
    expect(res.body.data.primaryColor).toBe('#0F294A');
  });

  it('rejects unauthenticated requests to protected routes with 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/dashboard').expect(401);
  });

  it('validates DTOs strictly on POST /api/v1/auth/login', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone: '123', pinOrPassword: '' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});
