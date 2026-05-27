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

    it('GET /organizations/sunat/:query - should return company info by valid RUC', async () => {
        const res = await request(app.getHttpServer())
            .get('/organizations/sunat/20555444332')
            .expect(200);

        expect(res.body).toHaveProperty('ruc', '20555444332');
        expect(res.body).toHaveProperty('razonSocial', 'Organizacion General S.A.');
    });

    it('GET /organizations/sunat/:query - should return list of matches by Razón Social', async () => {
        const res = await request(app.getHttpServer())
            .get('/organizations/sunat/Bioactiva')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('ruc', '20999888777');
    });

    it('GET /organizations/sunat/:query - should return 404 for non-existent RUC', async () => {
        await request(app.getHttpServer())
            .get('/organizations/sunat/99999999999')
            .expect(404);
    });

    it('POST /organizations - should throw 400 when RUC format is invalid (not 11 digits)', async () => {
        const res = await request(app.getHttpServer())
            .post('/organizations')
            .send({
                codigoCliente: 'E2E-ORG-FAIL-1',
                nombre: 'Fail Org 1',
                nombreComercial: 'Fail 1',
                tipo: 'EMPRESA_NACIONAL',
                tamano: 'PEQUENO',
                ruc: '12345',
                idAuthor: testUser.id
            })
            .expect(400);

        expect(res.body.message).toContain('Ruc no cumple con 11 digitos');
    });

    it('POST /organizations - should throw 400 when RUC does not exist in SUNAT', async () => {
        const res = await request(app.getHttpServer())
            .post('/organizations')
            .send({
                codigoCliente: 'E2E-ORG-FAIL-2',
                nombre: 'Fail Org 2',
                nombreComercial: 'Fail 2',
                tipo: 'EMPRESA_NACIONAL',
                tamano: 'PEQUENO',
                ruc: '11111111111',
                idAuthor: testUser.id
            })
            .expect(400);

        expect(res.body.message).toContain('No se encontraron resultados en SUNAT para la organización consultada');
    });

    it('POST /organizations - should create organization with valid RUC', async () => {
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

    it('POST /organizations - should throw 409 when RUC already exists in local DB', async () => {
        const res = await request(app.getHttpServer())
            .post('/organizations')
            .send({
                codigoCliente: 'E2E-ORG-200',
                nombre: 'Another Org Name',
                nombreComercial: 'Another',
                tipo: 'EMPRESA_NACIONAL',
                tamano: 'PEQUENO',
                ruc: '20123456789',
                idAuthor: testUser.id
            })
            .expect(409);

        expect(res.body.message).toContain('La organización ya se encuentra registrada');
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
