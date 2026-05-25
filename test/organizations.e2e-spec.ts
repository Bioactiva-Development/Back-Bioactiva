import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService, PRISMA_SERVICE } from '@/modules/common/prisma/prisma.service';

describe('OrganizationController (e2e)', () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    let testUser: any;
    let createdOrgId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                disableErrorMessages: false,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );
        
        await app.init();
        
        prisma = app.get<PrismaService>(PRISMA_SERVICE);

        // Ensure there is at least one author/user in the DB.
        testUser = await prisma.usuario.findFirst();
        if (!testUser) {
            testUser = await prisma.usuario.create({
                data: {
                    nombres: 'Test',
                    apellidos: 'User',
                    correo: 'test.user.e2e@example.com',
                    password: 'Password123!',
                    rol: 'ADMINISTRADOR',
                    estado: 'ACTIVO',
                },
            });
        }
    });

    afterAll(async () => {
        // Clean up created records
        if (createdOrgId) {
            await prisma.organizacion.deleteMany({
                where: { id: createdOrgId }
            });
        }
        if (testUser && testUser.correo === 'test.user.e2e@example.com') {
            await prisma.usuario.deleteMany({
                where: { id: testUser.id }
            });
        }
        await app.close();
    });

    it('POST /organizations - should create an organization', async () => {
        const res = await request(app.getHttpServer())
            .post('/organizations')
            .send({
                codigoCliente: 'E2E-ORG-100',
                nombre: 'E2E Organization Inc',
                nombreComercial: 'E2E Org Inc',
                tipo: 'EMPRESA_NACIONAL',
                tamano: 'PEQUENO',
                ruc: '20123456789',
                idAuthor: testUser.id
            })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.nombre).toBe('E2E Organization Inc');
        createdOrgId = res.body.id;
    });

    it('GET /organizations - should return all organizations', async () => {
        const res = await request(app.getHttpServer())
            .get('/organizations')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((o: any) => o.id === createdOrgId)).toBe(true);
    });

    it('GET /organizations/:id - should return organization details', async () => {
        const res = await request(app.getHttpServer())
            .get(`/organizations/${createdOrgId}`)
            .expect(200);

        expect(res.body.id).toBe(createdOrgId);
        expect(res.body.nombre).toBe('E2E Organization Inc');
    });

    it('PATCH /organizations/:id - should update organization details', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/organizations/${createdOrgId}`)
            .send({
                nombreComercial: 'E2E Org Inc Updated',
                tamano: 'MEDIANO'
            })
            .expect(200);

        expect(res.body.nombreComercial).toBe('E2E Org Inc Updated');
        expect(res.body.tamano).toBe('MEDIANO');
    });
});
