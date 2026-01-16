# Gestión de Pagos de Suscripción - Driver Panic Button

## Resumen

Se ha implementado un sistema de seguimiento de pagos de suscripción que permite a los administradores registrar y monitorear las fechas de pago de cada usuario. Este sistema ayuda a identificar usuarios con pagos vencidos o próximos a vencer.

## Campo de Base de Datos

### Tabla `users` - Campo Agregado

**Campo:** `lastPaymentDate`  
**Tipo:** TIMESTAMP  
**Nullable:** Sí (NULL por defecto)  
**Descripción:** Fecha del último pago de suscripción registrado por el administrador

```sql
ALTER TABLE users 
ADD COLUMN lastPaymentDate TIMESTAMP NULL 
AFTER isActive;
```

## Funcionalidades Implementadas

### 1. Registro de Pago

El administrador puede registrar manualmente la fecha de pago de un usuario. Esto actualiza el campo `lastPaymentDate` en la base de datos.

**Función:** `updateUserPaymentDate(userId: number, paymentDate: Date)`

**Uso:**
```typescript
import { updateUserPaymentDate } from './server/db';

// Registrar pago de hoy
await updateUserPaymentDate(userId, new Date());

// Registrar pago de fecha específica
await updateUserPaymentDate(userId, new Date('2026-01-15'));
```

### 2. Consulta de Pagos Vencidos

Obtiene lista de usuarios activos cuyo último pago fue hace más de X días (por defecto 30 días).

**Función:** `getUsersWithExpiredPayments(daysThreshold: number = 30)`

**Uso:**
```typescript
import { getUsersWithExpiredPayments } from './server/db';

// Usuarios con pagos vencidos (>30 días)
const expiredUsers = await getUsersWithExpiredPayments(30);

// Usuarios con pagos próximos a vencer (>23 días)
const expiringSoon = await getUsersWithExpiredPayments(23);
```

### 3. Cálculo de Estado de Pago

El sistema calcula automáticamente el estado de pago de cada usuario:

**Estados posibles:**
- **`never_paid`**: Usuario nunca ha registrado un pago (lastPaymentDate es NULL)
- **`current`**: Pago al día (último pago hace menos de 23 días)
- **`expiring_soon`**: Próximo a vencer (último pago hace 23-30 días)
- **`expired`**: Vencido (último pago hace más de 30 días)

**Lógica de cálculo:**
```typescript
function getPaymentStatus(lastPaymentDate: Date | null): PaymentStatus {
  if (!lastPaymentDate) return 'never_paid';
  
  const daysSincePayment = Math.floor(
    (Date.now() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSincePayment <= 23) return 'current';
  if (daysSincePayment <= 30) return 'expiring_soon';
  return 'expired';
}
```

## Consultas SQL Útiles

### Ver usuarios con pagos vencidos

```sql
SELECT 
  id,
  username,
  name,
  lastPaymentDate,
  DATEDIFF(NOW(), lastPaymentDate) as dias_desde_pago,
  isActive
FROM users
WHERE isActive = 1
  AND (
    lastPaymentDate IS NULL 
    OR DATEDIFF(NOW(), lastPaymentDate) > 30
  )
ORDER BY lastPaymentDate ASC;
```

### Ver usuarios con pagos próximos a vencer

```sql
SELECT 
  id,
  username,
  name,
  lastPaymentDate,
  DATEDIFF(NOW(), lastPaymentDate) as dias_desde_pago,
  30 - DATEDIFF(NOW(), lastPaymentDate) as dias_restantes
FROM users
WHERE isActive = 1
  AND lastPaymentDate IS NOT NULL
  AND DATEDIFF(NOW(), lastPaymentDate) BETWEEN 23 AND 30
ORDER BY lastPaymentDate ASC;
```

### Registrar pago para un usuario

```sql
UPDATE users 
SET lastPaymentDate = NOW() 
WHERE username = 'driver_juan';
```

### Registrar pago con fecha específica

```sql
UPDATE users 
SET lastPaymentDate = '2026-01-15 10:00:00' 
WHERE username = 'driver_juan';
```

### Estadísticas de pagos

```sql
SELECT 
  COUNT(*) as total_activos,
  SUM(CASE 
    WHEN lastPaymentDate IS NULL THEN 1 
    ELSE 0 
  END) as sin_pago,
  SUM(CASE 
    WHEN lastPaymentDate IS NOT NULL 
      AND DATEDIFF(NOW(), lastPaymentDate) <= 23 THEN 1 
    ELSE 0 
  END) as al_dia,
  SUM(CASE 
    WHEN lastPaymentDate IS NOT NULL 
      AND DATEDIFF(NOW(), lastPaymentDate) BETWEEN 23 AND 30 THEN 1 
    ELSE 0 
  END) as por_vencer,
  SUM(CASE 
    WHEN lastPaymentDate IS NOT NULL 
      AND DATEDIFF(NOW(), lastPaymentDate) > 30 THEN 1 
    ELSE 0 
  END) as vencidos
FROM users
WHERE isActive = 1;
```

## Integración con Panel de Administración

### Dashboard

El dashboard mostrará dos nuevas tarjetas de estadísticas:

**Pagos Vencidos (⚠️):**
- Muestra el número de usuarios con pagos vencidos (>30 días)
- Color de alerta (rojo/naranja)
- Clic lleva a lista filtrada de usuarios con pagos vencidos

**Pagos por Vencer (🔔):**
- Muestra el número de usuarios con pagos próximos a vencer (23-30 días)
- Color de advertencia (amarillo)
- Clic lleva a lista filtrada de usuarios por vencer

### Lista de Usuarios

**Columna adicional:** "Estado de Pago"
- 🟢 Al día (verde)
- 🟡 Por vencer (amarillo)
- 🔴 Vencido (rojo)
- ⚪ Sin pago (gris)

**Filtros adicionales:**
- Todos
- Al día
- Por vencer
- Vencidos
- Sin pago registrado

### Vista de Detalles de Usuario

**Sección de Pago:**
```
┌─────────────────────────────────────────────────┐
│ Estado de Suscripción                           │
├─────────────────────────────────────────────────┤
│                                                 │
│  Estado:           🟢 Al día                    │
│  Último Pago:      15/01/2026                   │
│  Días desde pago:  2 días                       │
│  Próximo pago:     14/02/2026 (en 28 días)     │
│                                                 │
│  [  Registrar Nuevo Pago  ]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Modal de Registro de Pago:**
```
┌─────────────────────────────────────────────────┐
│ Registrar Pago de Suscripción                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Usuario: driver_juan                           │
│                                                 │
│  Fecha de Pago:                                 │
│  [15/01/2026] [📅]                              │
│                                                 │
│  ○ Usar fecha de hoy                            │
│  ○ Usar fecha personalizada                     │
│                                                 │
│  [ Cancelar ]  [ Registrar Pago ]              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Endpoints de API

### PATCH /api/admin/users/:id/payment

Registra o actualiza la fecha de pago de un usuario.

**Request:**
```json
{
  "paymentDate": "2026-01-15T10:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Pago registrado correctamente para driver_juan",
  "user": {
    "id": 1,
    "username": "driver_juan",
    "lastPaymentDate": "2026-01-15T10:00:00Z",
    "paymentStatus": "current",
    "daysSincePayment": 0
  }
}
```

### GET /api/admin/users/expired-payments

Obtiene lista de usuarios con pagos vencidos.

**Query Parameters:**
- `daysThreshold`: número de días para considerar vencido (default: 30)

**Response (200):**
```json
{
  "users": [
    {
      "id": 5,
      "username": "driver_005",
      "name": "Carlos R.",
      "lastPaymentDate": "2025-12-10T00:00:00Z",
      "daysSincePayment": 36,
      "paymentStatus": "expired"
    }
  ],
  "total": 8
}
```

### GET /api/admin/stats

Actualizado para incluir estadísticas de pagos.

**Response (200):**
```json
{
  "totalUsers": 156,
  "activeUsers": 142,
  "inactiveUsers": 11,
  "pendingUsers": 3,
  "recentRegistrations": 8,
  "recentLogins": 45,
  "expiredPayments": 8,
  "expiringSoonPayments": 12
}
```

## Flujos de Usuario

### Flujo 1: Registrar Pago desde Dashboard

1. Admin ve dashboard con "8 Pagos Vencidos"
2. Hace clic en la tarjeta de pagos vencidos
3. Ve lista de usuarios con pagos vencidos
4. Selecciona usuario "driver_005"
5. Hace clic en "Ver detalles"
6. En la sección de suscripción, hace clic en "Registrar Nuevo Pago"
7. Modal se abre con fecha de hoy pre-seleccionada
8. Confirma "Registrar Pago"
9. Sistema actualiza lastPaymentDate a hoy
10. Estado cambia a 🟢 "Al día"
11. Contador de pagos vencidos se reduce a 7

### Flujo 2: Registrar Pago con Fecha Personalizada

1. Admin está en detalles de usuario
2. Hace clic en "Registrar Nuevo Pago"
3. Selecciona "Usar fecha personalizada"
4. Ingresa fecha: 10/01/2026
5. Confirma "Registrar Pago"
6. Sistema actualiza lastPaymentDate a 10/01/2026
7. Calcula días desde pago: 5 días
8. Estado muestra 🟢 "Al día"

### Flujo 3: Monitoreo de Pagos por Vencer

1. Admin abre dashboard cada mañana
2. Ve "12 Pagos por Vencer"
3. Hace clic en la tarjeta
4. Ve lista de usuarios con pagos entre 23-30 días
5. Puede contactar a estos usuarios para recordar pago
6. Una vez confirmado el pago, registra la fecha

## Automatización Futura

### Notificaciones Automáticas

**Emails automáticos:**
- 7 días antes del vencimiento: "Tu suscripción vence pronto"
- Día del vencimiento: "Tu suscripción vence hoy"
- 3 días después del vencimiento: "Tu suscripción ha vencido"
- 7 días después del vencimiento: "Última advertencia"

**Desactivación automática:**
- Opción de desactivar automáticamente usuarios con >30 días de mora
- Configurable por el administrador

### Integración con Pasarelas de Pago

**Futuro:**
- Integración con Mercado Pago / Stripe
- Registro automático de pagos al confirmar transacción
- Webhooks para actualizar lastPaymentDate
- Generación de links de pago

## Reportes

### Reporte Mensual de Pagos

```sql
SELECT 
  DATE_FORMAT(lastPaymentDate, '%Y-%m') as mes,
  COUNT(*) as pagos_registrados,
  SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as usuarios_activos
FROM users
WHERE lastPaymentDate IS NOT NULL
  AND lastPaymentDate >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(lastPaymentDate, '%Y-%m')
ORDER BY mes DESC;
```

### Reporte de Morosidad

```sql
SELECT 
  CASE 
    WHEN lastPaymentDate IS NULL THEN 'Sin pago'
    WHEN DATEDIFF(NOW(), lastPaymentDate) <= 23 THEN 'Al día'
    WHEN DATEDIFF(NOW(), lastPaymentDate) <= 30 THEN 'Por vencer'
    ELSE 'Vencido'
  END as estado_pago,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE isActive = 1), 2) as porcentaje
FROM users
WHERE isActive = 1
GROUP BY estado_pago;
```

## Consideraciones

### Política de Pagos

**Recomendaciones:**
- Ciclo de pago: mensual (30 días)
- Período de gracia: 7 días después del vencimiento
- Desactivación: después de 37 días sin pago
- Reactivación: inmediata al registrar pago

### Privacidad

- No se almacenan datos de tarjetas de crédito
- Solo se registra la fecha de pago
- No se almacenan montos (todos pagan lo mismo)
- Logs de auditoría de cambios en pagos

### Migración de Datos Existentes

Para usuarios existentes sin fecha de pago:

```sql
-- Opción 1: Establecer fecha de registro como primer pago
UPDATE users 
SET lastPaymentDate = createdAt 
WHERE lastPaymentDate IS NULL 
  AND isActive = 1;

-- Opción 2: Establecer fecha de hoy para todos
UPDATE users 
SET lastPaymentDate = NOW() 
WHERE lastPaymentDate IS NULL 
  AND isActive = 1;

-- Opción 3: Dejar NULL y requerir primer pago
-- No hacer nada, usuarios aparecerán como "Sin pago"
```

## Próximos Pasos

1. **Aplicar migración de base de datos**: `pnpm db:push`
2. **Implementar endpoints de API** para gestión de pagos
3. **Actualizar panel de administración** con UI de pagos
4. **Definir política de pagos** con el equipo
5. **Configurar notificaciones** automáticas (futuro)
6. **Integrar pasarela de pago** (futuro)

## Archivos Modificados

1. `drizzle/schema.ts` - Campo lastPaymentDate agregado
2. `server/db.ts` - Funciones de gestión de pagos
3. `ADMIN_PANEL_REQUIREMENTS.md` - Documentación actualizada
4. `PAYMENT_MANAGEMENT.md` - Este documento

## Conclusión

El sistema de gestión de pagos proporciona al administrador visibilidad completa sobre el estado de las suscripciones de los usuarios. Con este sistema, es fácil identificar usuarios con pagos vencidos, próximos a vencer, o que nunca han registrado un pago, permitiendo una gestión proactiva de las suscripciones.
