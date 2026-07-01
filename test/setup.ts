// Variables de entorno mínimas requeridas antes de que cualquier módulo se cargue.
// oauth-state.ts evalúa JWT_SECRET en una IIFE al importarse.
process.env.JWT_SECRET = 'test-jwt-secret-for-jest';
