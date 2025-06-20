import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FORGE API',
      version: '1.0.0',
      description: 'API for managing FORGE',
    },
    servers: [{
      url: `http://localhost:${process.env.PORT || 3001}`,
      description: 'Development server'
    }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: [
    path.join(__dirname, '../routes/*.routes.ts'),
    path.join(__dirname, '../routes/*.routes.js')
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default function setupSwagger(app: Express): void {
  // Serve Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Serve Swagger JSON
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`Swagger UI: http://localhost:${process.env.PORT || 3001}/docs`);
}