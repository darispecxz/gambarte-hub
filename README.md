# CGR Reports Platform (Angular)

Interfaz Angular 19 (standalone) que consume la **CGR Reports API**. No accede a la base de
datos ni reimplementa lógica: sólo presentación e interacción. La lógica de negocio vive en el
sistema PHP; la API la expone.

```
CGR Reports Platform (Angular)  →  CGR Reports API  →  Lógica/Datos PHP existentes
```

## Requisitos

- Node 20 LTS (probado con 20.18.1) · Angular CLI 19.
- La **API** corriendo (por defecto `http://127.0.0.1:8899`).

## Configuración

La URL de la API se define en `src/environments/environment.ts` (`apiBase`). En producción,
apuntar a la URL real de la API.

## Ejecutar (desarrollo)

```bash
# 1) Levantar la API (en el repo CgrReportsApi)
php -S 127.0.0.1:8899 -t public public/index.php

# 2) Levantar la app Angular
npm start          # o: npx ng serve
# Abrir http://localhost:4200
```

## Secciones

| Ruta | Descripción | API |
|---|---|---|
| `/tablero` | Tablero ejecutivo consolidado (semáforos + alertas) | `GET /api/risks/dashboard` |
| `/riesgos` | 6 informes; **visualiza y descarga el PDF** real del sistema | `GET /api/risks/{slug}` · `/pdf` |
| `/logs` | 7 reportes de auditoría; tabla + **Excel** + **ZIP mensual** | `GET /api/logs/{code}` · `/excel` · `/excel/zip` |
| `/operaciones` | Vistas operativas/comerciales | `GET /api/operations/{action}` |

## Estructura

```
src/environments/environment.ts   Configuración (apiBase)
src/app/core/models.ts            Tipos (envelope, informes, logs, tablero)
src/app/core/api.service.ts       Cliente HTTP de la API (único punto de acceso)
src/app/app.component.*            Shell (navegación + router-outlet)
src/app/app.routes.ts             Rutas (lazy standalone)
src/app/features/                 dashboard · risks · logs · operations
```

## Notas

- El **PDF** se muestra tal cual lo genera el sistema PHP (visor nativo del navegador en un
  `iframe`) y se descarga con `Descargar PDF`. No se reemplaza por otra representación.
- **Excel** y **ZIP** se descargan con el mismo formato/nombre del sistema actual.
- CORS: la API expone `Access-Control-Allow-Origin`; en dev se usa `*`.
