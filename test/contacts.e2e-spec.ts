import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService, PRISMA_SERVICE } from '@/modules/common/prisma/prisma.service';

describe('ContactController (e2e)', () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    let testUser: any;
    let testOrg: any;
    let createdContactId: number;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        
        // Add same pipes as main.ts
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

        // Create a test organization
        testOrg = await prisma.organizacion.create({
            data: {
                codigoCliente: 'E2E-ORG-999',
                nombre: 'E2E Test Organization',
                nombreComercial: 'E2E Org',
                tipo: 'EMPRESA_NACIONAL',
                tamano: 'PEQUENO',
                idAuthor: testUser.id,
            },
        });
    });

    afterAll(async () => {
        // Clean up created records
        if (createdContactId) {
            await prisma.contacto.deleteMany({
                where: { id: createdContactId }
            });
        }
        if (testOrg) {
            await prisma.organizacion.deleteMany({
                where: { id: testOrg.id }
            });
        }
        if (testUser && testUser.correo === 'test.user.e2e@example.com') {
            await prisma.usuario.deleteMany({
                where: { id: testUser.id }
            });
        }
        await app.close();
    });

    it('POST /contacts - should create a contact', async () => {
        const res = await request(app.getHttpServer())
            .post('/contacts')
            .send({
                nombres: 'Contacto E2E',
                apellidos: 'De Prueba',
                vocativo: 'SR',
                cargo: 'Ingeniero',
                correo: 'contacto.e2e@example.com',
                telefono: '123456789',
                correo2: 'contacto.e2e.alt@example.com',
                comentarios: 'Comentario de prueba',
                idOrganizacion: testOrg.id,
                idAuthor: testUser.id
            })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.nombres).toBe('Contacto E2E');
        createdContactId = res.body.id;
    });

    it('GET /contacts - should return all contacts', async () => {
        const res = await request(app.getHttpServer())
            .get('/contacts')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((c: any) => c.id === createdContactId)).toBe(true);
    });

    it('GET /contacts/:id - should return contact details', async () => {
        const res = await request(app.getHttpServer())
            .get(`/contacts/${createdContactId}`)
            .expect(200);

        expect(res.body.id).toBe(createdContactId);
        expect(res.body.nombres).toBe('Contacto E2E');
    });

    it('GET /contacts/organization/:idOrganizacion - should return contacts by org ID', async () => {
        const res = await request(app.getHttpServer())
            .get(`/contacts/organization/${testOrg.id}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].idOrganizacion).toBe(testOrg.id);
    });

    it('PATCH /contacts/:id - should update contact details', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/contacts/${createdContactId}`)
            .send({
                cargo: 'Ingeniero Principal',
                telefono: '987654321'
            })
            .expect(200);

        expect(res.body.cargo).toBe('Ingeniero Principal');
        expect(res.body.telefono).toBe('987654321');
    });
});
