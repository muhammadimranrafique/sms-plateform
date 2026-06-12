import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

/**
 * Minimal OpenAPI 3 document. In a full build this is generated from the Zod
 * schemas via zod-to-openapi to guarantee contract/code parity.
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: { title: 'SMS API', version: '3.0.0', description: 'School Management System API' },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/students': {
      get: { summary: 'List students', responses: { '200': { description: 'OK' } } },
      post: { summary: 'Create student', responses: { '201': { description: 'Created' } } },
    },
    '/promotions': {
      post: { summary: 'Promote students (idempotent batch)', responses: { '201': { description: 'Created' } } },
    },
    '/vouchers': {
      post: { summary: 'Create voucher', responses: { '201': { description: 'Created' } } },
    },
  },
} as const;

export const swaggerRouter = Router();
swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get('/', swaggerUi.setup(openApiDocument));
