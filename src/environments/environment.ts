/**
 * Configuración de entorno.
 * La API se sirve por el Apache de WAMP (concurrente, igual que bo_cgr_hostinger),
 * desplegada en C:\wamp64\www\cgrapi → http://127.0.0.1:8080/api
 * En producción, apuntar apiBase a la URL real de la API.
 */
export const environment = {
  production: false,
  apiBase: 'http://127.0.0.1:8080/api',
  legacyBase: 'http://cgrbolivia.local',
};
