import { Request, Response } from 'express';

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ClaimPilot India API Specification',
    version: '1.0.0',
    description: 'Production-ready REST API for AI-assisted hospital insurance claims automation in India.',
    contact: {
      name: 'ClaimPilot Engineering Team',
      email: 'support@claimpilot.in',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local Development Backend Server',
    },
    {
      url: 'https://api.claimpilot.in',
      description: 'Production API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System Health Check',
        description: 'Returns operational status, database health, uptime, and request ID.',
        responses: {
          200: { description: 'System healthy' },
        },
      },
    },
    '/ready': {
      get: {
        summary: 'System Readiness Probe',
        description: 'Verifies database and Redis infrastructure readiness.',
        responses: {
          200: { description: 'Ready to accept traffic' },
        },
      },
    },
    '/metrics': {
      get: {
        summary: 'Observability Telemetry Metrics',
        description: 'Returns HTTP request telemetry, memory usage, and error metrics.',
        responses: {
          200: { description: 'Telemetry metrics' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register Hospital User Account',
        responses: { 201: { description: 'User created successfully' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Authenticate User Credentials',
        responses: { 200: { description: 'JWT Access token issued' } },
      },
    },
    '/api/claims': {
      get: {
        summary: 'List Hospital Claims',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Claims list' } },
      },
      post: {
        summary: 'Create New Insurance Claim',
        responses: { 201: { description: 'Claim created' } },
      },
    },
    '/api/claims/{id}/clinical-extract': {
      post: {
        summary: 'Structure Clinical Data via Gemini LLM',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Clinical extraction complete' } },
      },
    },
    '/api/claims/{id}/coding': {
      post: {
        summary: 'Auto-Code Diagnosis & Procedures (ICD-10 / CPT)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Medical coding complete' } },
      },
    },
    '/api/claims/{id}/validate': {
      post: {
        summary: 'Evaluate Claim Policy Rules',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Claim validation complete' } },
      },
    },
    '/api/review/pending': {
      get: {
        summary: 'List Claims Pending Human Review',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Pending review list' } },
      },
    },
    '/api/claims/{id}/submit': {
      post: {
        summary: 'Submit Approved Claim to Insurer Portal (Playwright)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Submitted to portal' } },
      },
    },
    '/api/webhooks/claim-event': {
      post: {
        summary: 'n8n Workflow Trigger Webhook',
        responses: { 200: { description: 'Workflow executed' } },
      },
    },
  },
};

export const serveSwaggerUi = (_req: Request, res: Response): void => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ClaimPilot India - Swagger API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; background: #0f172a; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ]
      });
    };
  </script>
</body>
</html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
