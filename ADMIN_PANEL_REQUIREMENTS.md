# Panel de Administración - Requerimientos y Diseño

## Resumen Ejecutivo

El Panel de Administración es una aplicación web que permite a los administradores gestionar usuarios del sistema Driver Panic Button, incluyendo la activación/desactivación de cuentas, visualización de estadísticas y gestión de permisos.

## Objetivos

1. **Simplificar la gestión de usuarios** sin necesidad de acceder directamente a la base de datos
2. **Visualizar solicitudes de registro** pendientes de aprobación
3. **Activar/desactivar usuarios** con un solo clic
4. **Monitorear actividad** del sistema y usuarios
5. **Gestionar roles** y permisos de usuarios

## Alcance

### Fase 1 (MVP - Mínimo Producto Viable)
- Autenticación de administradores
- Lista de usuarios con filtros
- Activación/desactivación de usuarios
- Vista de detalles de usuario
- Dashboard con estadísticas básicas

### Fase 2 (Futuro)
- Gestión de roles avanzada
- Historial de actividad detallado
- Notificaciones automáticas
- Exportación de reportes
- Búsqueda avanzada y filtros complejos

## Usuarios del Sistema

### Administrador Principal
- Acceso completo al panel
- Puede activar/desactivar usuarios
- Puede crear otros administradores
- Visualiza todas las estadísticas

### Administrador de Soporte
- Puede ver usuarios
- Puede activar/desactivar usuarios
- No puede crear otros administradores
- Acceso limitado a estadísticas

## Requerimientos Funcionales

### RF-01: Autenticación de Administradores
**Prioridad:** Alta  
**Descripción:** Los administradores deben autenticarse para acceder al panel.

**Criterios de aceptación:**
- Login con username y PIN (igual que la app móvil)
- Solo usuarios con role='admin' pueden acceder
- Sesión persistente con cookie/token
- Logout seguro
- Redirección automática si no está autenticado

### RF-02: Dashboard Principal
**Prioridad:** Alta  
**Descripción:** Vista general con estadísticas clave del sistema.

**Criterios de aceptación:**
- Mostrar total de usuarios registrados
- Mostrar usuarios activos vs inactivos
- Mostrar usuarios pendientes de activación (isActive=0)
- Mostrar registros recientes (últimos 7 días)
- Gráficos visuales de estadísticas
- Actualización en tiempo real o con botón de refresh

### RF-03: Lista de Usuarios
**Prioridad:** Alta  
**Descripción:** Tabla con todos los usuarios del sistema.

**Criterios de aceptación:**
- Mostrar: username, nombre, estado (activo/inactivo), fecha de registro, último acceso
- Paginación (20 usuarios por página)
- Ordenamiento por columnas
- Filtros: estado (todos/activos/inactivos/pendientes), fecha de registro
- Búsqueda por username o nombre
- Indicador visual de usuarios pendientes (badge o color)

### RF-04: Activar/Desactivar Usuario
**Prioridad:** Alta  
**Descripción:** Cambiar el estado de activación de un usuario.

**Criterios de aceptación:**
- Toggle switch o botón en cada fila de la tabla
- Confirmación antes de desactivar usuario activo
- Actualización inmediata en la UI
- Mensaje de éxito/error
- Log de la acción (quién y cuándo)

### RF-05: Vista de Detalles de Usuario
**Prioridad:** Media  
**Descripción:** Ver información completa de un usuario específico.

**Criterios de aceptación:**
- Mostrar todos los campos del usuario
- Mostrar historial de actividad (logins, cambios de estado)
- Mostrar contactos de emergencia asociados
- Mostrar fecha de último pago de suscripción
- Indicador visual de estado de pago (al día, próximo a vencer, vencido)
- Botón para activar/desactivar
- Botón para registrar pago de suscripción
- Botón para resetear PIN (futuro)

### RF-08: Gestión de Pagos de Suscripción
**Prioridad:** Alta  
**Descripción:** Registrar y monitorear pagos de suscripción de usuarios.

**Criterios de aceptación:**
- Registrar fecha de último pago manualmente
- Calcular días desde último pago
- Alertas visuales para suscripciones próximas a vencer (< 7 días)
- Lista de usuarios con pagos vencidos
- Filtro en lista de usuarios por estado de pago
- Notificación en dashboard de pagos vencidos

### RF-06: Notificaciones de Nuevos Registros
**Prioridad:** Media  
**Descripción:** Alertar a los administradores sobre nuevos registros.

**Criterios de aceptación:**
- Badge con número de usuarios pendientes
- Notificación visual en el dashboard
- Opción de email automático (configurable)

### RF-07: Historial de Actividad
**Prioridad:** Baja  
**Descripción:** Registro de todas las acciones administrativas.

**Criterios de aceptación:**
- Log de activaciones/desactivaciones
- Mostrar quién realizó la acción y cuándo
- Filtros por tipo de acción y fecha
- Exportación a CSV

## Requerimientos No Funcionales

### RNF-01: Seguridad
- Autenticación obligatoria para todas las rutas
- Validación de rol de administrador en el backend
- Protección contra CSRF
- Rate limiting en endpoints sensibles
- Logs de auditoría de todas las acciones

### RNF-02: Performance
- Carga inicial del dashboard < 2 segundos
- Paginación para listas grandes
- Caché de estadísticas (actualización cada 5 minutos)
- Lazy loading de componentes pesados

### RNF-03: Usabilidad
- Interfaz responsive (desktop, tablet)
- Diseño consistente con la app móvil
- Feedback visual inmediato en todas las acciones
- Mensajes de error claros en español
- Accesibilidad básica (contraste, tamaño de fuente)

### RNF-04: Compatibilidad
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Resoluciones mínimas: 1024x768
- No requiere instalación (web app)

## Arquitectura Técnica

### Stack Tecnológico Recomendado
- **Frontend:** React + TypeScript + TailwindCSS (consistente con el proyecto)
- **Backend:** Express.js existente (agregar rutas de admin)
- **Base de datos:** MySQL existente
- **Autenticación:** JWT o sesiones con cookies
- **Despliegue:** Mismo servidor que la API

### Estructura de Rutas

**Frontend (Web App):**
```
/admin/login          - Login de administradores
/admin/dashboard      - Dashboard principal
/admin/users          - Lista de usuarios
/admin/users/:id      - Detalles de usuario
/admin/activity       - Historial de actividad
/admin/settings       - Configuración del panel
```

**Backend (API):**
```
POST   /api/admin/login              - Login de admin
GET    /api/admin/stats              - Estadísticas del dashboard
GET    /api/admin/users              - Lista de usuarios (con filtros)
GET    /api/admin/users/:id          - Detalles de usuario
PATCH  /api/admin/users/:id/activate - Activar usuario
PATCH  /api/admin/users/:id/deactivate - Desactivar usuario
GET    /api/admin/activity           - Historial de actividad
POST   /api/admin/logout             - Logout
```

## Modelos de Datos

### Usuario (existente, extendido)
```typescript
interface User {
  id: number;
  deviceId: string;
  username: string;
  name: string | null;
  isActive: 0 | 1;
  lastPaymentDate: Date | null;  // NUEVO
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

interface UserWithPaymentStatus extends User {
  paymentStatus: 'current' | 'expiring_soon' | 'expired' | 'never_paid';
  daysSincePayment: number | null;
}
```

### Actividad de Admin (nuevo)
```typescript
interface AdminActivity {
  id: number;
  adminId: number;          // ID del admin que realizó la acción
  adminUsername: string;    // Username del admin
  action: 'activate' | 'deactivate' | 'create' | 'update' | 'delete';
  targetUserId: number;     // ID del usuario afectado
  targetUsername: string;   // Username del usuario afectado
  details: string | null;   // Detalles adicionales
  timestamp: Date;
}
```

### Estadísticas del Dashboard
```typescript
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  recentRegistrations: number;     // Últimos 7 días
  recentLogins: number;            // Últimos 24 horas
  expiredPayments: number;         // NUEVO: Pagos vencidos (>30 días)
  expiringSoonPayments: number;    // NUEVO: Próximos a vencer (<7 días)
}
```

## Wireframes y Diseño de UI

### 1. Pantalla de Login

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    [SOS Logo]                       │
│                                                     │
│              Panel de Administración                │
│           Driver Panic Button Admin                 │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Nombre de Usuario                             │ │
│  │ [___________________________________]         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ PIN de Administrador                          │ │
│  │ [_] [_] [_] [_] [_] [_]                       │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│         [    Iniciar Sesión como Admin    ]         │
│                                                     │
│         Solo para administradores autorizados       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2. Dashboard Principal

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [SOS] Driver Panic Button Admin    [Notificaciones: 3]  [Admin] [Salir]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Dashboard                                                              │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Total      │  │   Activos    │  │  Inactivos   │  │ Pendientes │ │
│  │              │  │              │  │              │  │            │ │
│  │     156      │  │     142      │  │      11      │  │     3      │ │
│  │   usuarios   │  │   usuarios   │  │   usuarios   │  │  nuevos    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐                                   │
│  │ ⚠️ Pagos     │  │ 🔔 Por Vencer│                                   │
│  │   Vencidos   │  │   (<7 días)  │                                   │
│  │      8       │  │      12      │                                   │
│  │  usuarios    │  │  usuarios    │                                   │
│  └──────────────┘  └──────────────┘                                   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Usuarios Pendientes de Activación                              │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Username      Nombre         Fecha Registro      Acciones      │   │
│  │ ─────────────────────────────────────────────────────────────  │   │
│  │ driver_juan   Juan Pérez     15/01/2026 10:30   [Activar]     │   │
│  │ conductor_42  María López    15/01/2026 11:15   [Activar]     │   │
│  │ chofer_123    Pedro García   15/01/2026 12:00   [Activar]     │   │
│  │                                                                 │   │
│  │                                    [Ver Todos los Usuarios]    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────┐  ┌────────────────────────────────┐   │
│  │ Registros Recientes        │  │ Actividad del Sistema          │   │
│  │                            │  │                                │   │
│  │ [Gráfico de barras]        │  │ • 15/01 10:30 - driver_juan    │   │
│  │ Últimos 7 días             │  │   registrado                   │   │
│  │                            │  │ • 15/01 11:15 - conductor_42   │   │
│  │ Lun Mar Mié Jue Vie Sáb Dom│  │   registrado                   │   │
│  │  5   3   7   4   2   1   3 │  │ • 14/01 16:45 - admin activó   │   │
│  │                            │  │   usuario chofer_88            │   │
│  └────────────────────────────┘  └────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Lista de Usuarios

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [SOS] Driver Panic Button Admin    [Notificaciones: 3]  [Admin] [Salir]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Gestión de Usuarios                                                    │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Buscar: [___________________] [🔍]                              │   │
│  │                                                                 │   │
│  │ Filtrar por: [Todos ▼] [Fecha: Más recientes ▼]  [Actualizar] │   │
│  │              • Todos                                            │   │
│  │              • Activos                                          │   │
│  │              • Inactivos                                        │   │
│  │              • Pendientes                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 156 usuarios encontrados                                        │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Username      Nombre      Estado    Registro    Último Acceso  │   │
│  │ ─────────────────────────────────────────────────────────────  │   │
│  │ 🔴 driver_juan  Juan P.   Inactivo  15/01/2026  Nunca   [👁][✓]│   │
│  │ 🟢 driver_001   Ana M.    Activo    10/01/2026  15/01   [👁][✗]│   │
│  │ 🟢 conductor_42 María L.  Activo    12/01/2026  15/01   [👁][✗]│   │
│  │ 🔴 chofer_123   Pedro G.  Inactivo  15/01/2026  Nunca   [👁][✓]│   │
│  │ 🟢 driver_005   Carlos R. Activo    08/01/2026  14/01   [👁][✗]│   │
│  │ 🟢 conductor_88 Luis S.   Activo    05/01/2026  15/01   [👁][✗]│   │
│  │                                                                 │   │
│  │ ─────────────────────────────────────────────────────────────  │   │
│  │                    [<] 1 2 3 4 5 [>]                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Leyenda: 🟢 Activo  🔴 Inactivo  [👁] Ver detalles  [✓] Activar      │
│           [✗] Desactivar                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. Detalles de Usuario

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [SOS] Driver Panic Button Admin    [Notificaciones: 3]  [Admin] [Salir]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [← Volver]  Detalles de Usuario                                       │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Información General                                             │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                 │   │
│  │  Username:         driver_juan                                  │   │
│  │  Nombre:           Juan Pérez                                   │   │
│  │  Device ID:        abc123-def456-ghi789                         │   │
│  │  Estado:           🔴 Inactivo                                  │   │
│  │  Rol:              Usuario                                      │   │
│  │  Fecha de Registro: 15/01/2026 10:30:45                        │   │
│  │  Último Acceso:    Nunca                                        │   │
│  │                                                                 │   │
│  │  [     Activar Usuario     ]  [  Resetear PIN (futuro)  ]     │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Contactos de Emergencia                                         │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                 │   │
│  │  No hay contactos configurados                                  │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Historial de Actividad                                          │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                 │   │
│  │  • 15/01/2026 10:30 - Usuario registrado                        │   │
│  │  • Esperando activación por administrador                       │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5. Modal de Confirmación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                                                                         │
│         ┌───────────────────────────────────────────────┐              │
│         │                                               │              │
│         │  Confirmar Activación                         │              │
│         │  ═══════════════════════════════════════      │              │
│         │                                               │              │
│         │  ¿Estás seguro que deseas activar al         │              │
│         │  usuario "driver_juan"?                       │              │
│         │                                               │              │
│         │  Una vez activado, el usuario podrá          │              │
│         │  iniciar sesión y usar la aplicación.        │              │
│         │                                               │              │
│         │                                               │              │
│         │      [  Cancelar  ]    [  Activar  ]         │              │
│         │                                               │              │
│         └───────────────────────────────────────────────┘              │
│                                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Flujos de Usuario

### Flujo 1: Activar Usuario Pendiente

1. Admin inicia sesión en el panel
2. Ve el dashboard con badge "3 usuarios pendientes"
3. Hace clic en "Ver Todos los Usuarios" o en la sección de pendientes
4. Ve la lista filtrada por usuarios inactivos
5. Identifica el usuario "driver_juan" con estado 🔴 Inactivo
6. Hace clic en el botón [✓] Activar
7. Aparece modal de confirmación
8. Confirma la activación
9. Sistema actualiza isActive=1 en la base de datos
10. UI muestra mensaje de éxito: "Usuario driver_juan activado correctamente"
11. Estado cambia a 🟢 Activo en la tabla
12. Badge de pendientes se actualiza a "2"

### Flujo 2: Ver Detalles de Usuario

1. Admin está en la lista de usuarios
2. Hace clic en el icono [👁] Ver detalles
3. Navega a /admin/users/:id
4. Ve información completa del usuario
5. Ve contactos de emergencia (si los tiene)
6. Ve historial de actividad
7. Puede activar/desactivar desde esta pantalla
8. Hace clic en "Volver" para regresar a la lista

### Flujo 3: Desactivar Usuario Activo

1. Admin busca un usuario específico
2. Encuentra usuario con estado 🟢 Activo
3. Hace clic en el botón [✗] Desactivar
4. Aparece modal de confirmación con advertencia
5. Confirma la desactivación
6. Sistema actualiza isActive=0
7. Usuario ya no puede iniciar sesión
8. Estado cambia a 🔴 Inactivo

## Componentes Reutilizables

### UserStatusBadge
```typescript
interface UserStatusBadgeProps {
  isActive: boolean;
}
// Muestra: 🟢 Activo o 🔴 Inactivo
```

### UserTable
```typescript
interface UserTableProps {
  users: User[];
  onActivate: (userId: number) => void;
  onDeactivate: (userId: number) => void;
  onViewDetails: (userId: number) => void;
}
```

### StatsCard
```typescript
interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}
```

### ConfirmModal
```typescript
interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}
```

## Endpoints de API Detallados

### POST /api/admin/login
**Request:**
```json
{
  "username": "admin",
  "pin": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "sessionToken": "jwt-token-here",
  "admin": {
    "id": 1,
    "username": "admin",
    "name": "Administrador Principal",
    "role": "admin"
  }
}
```

**Response (401):**
```json
{
  "error": "Credenciales inválidas o no tienes permisos de administrador"
}
```

### GET /api/admin/stats
**Response (200):**
```json
{
  "totalUsers": 156,
  "activeUsers": 142,
  "inactiveUsers": 11,
  "pendingUsers": 3,
  "recentRegistrations": 8,
  "recentLogins": 45
}
```

### GET /api/admin/users
**Query Parameters:**
- `page`: número de página (default: 1)
- `limit`: usuarios por página (default: 20)
- `status`: 'all' | 'active' | 'inactive' | 'pending'
- `search`: término de búsqueda
- `sortBy`: 'createdAt' | 'lastSignedIn' | 'username'
- `sortOrder`: 'asc' | 'desc'

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "driver_juan",
      "name": "Juan Pérez",
      "deviceId": "abc123",
      "isActive": 0,
      "role": "user",
      "createdAt": "2026-01-15T10:30:00Z",
      "lastSignedIn": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### GET /api/admin/users/:id
**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "driver_juan",
    "name": "Juan Pérez",
    "deviceId": "abc123",
    "isActive": 0,
    "role": "user",
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T10:30:00Z",
    "lastSignedIn": null
  },
  "emergencyContacts": [],
  "activityLog": [
    {
      "timestamp": "2026-01-15T10:30:00Z",
      "action": "registered",
      "details": "Usuario registrado desde dispositivo abc123"
    }
  ]
}
```

### PATCH /api/admin/users/:id/activate
**Response (200):**
```json
{
  "success": true,
  "message": "Usuario driver_juan activado correctamente",
  "user": {
    "id": 1,
    "username": "driver_juan",
    "isActive": 1
  }
}
```

### PATCH /api/admin/users/:id/deactivate
**Response (200):**
```json
{
  "success": true,
  "message": "Usuario driver_juan desactivado correctamente",
  "user": {
    "id": 1,
    "username": "driver_juan",
    "isActive": 0
  }
}
```

### PATCH /api/admin/users/:id/payment
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
    "lastPaymentDate": "2026-01-15T10:00:00Z"
  }
}
```

### GET /api/admin/users/expired-payments
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

### GET /api/admin/activity
**Query Parameters:**
- `page`: número de página
- `limit`: registros por página
- `action`: filtrar por tipo de acción

**Response (200):**
```json
{
  "activities": [
    {
      "id": 1,
      "adminUsername": "admin",
      "action": "activate",
      "targetUsername": "driver_juan",
      "details": "Usuario activado manualmente",
      "timestamp": "2026-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120
  }
}
```

## Tabla de Base de Datos Nueva

### admin_activity
```sql
CREATE TABLE admin_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  admin_username VARCHAR(100) NOT NULL,
  action ENUM('activate', 'deactivate', 'create', 'update', 'delete') NOT NULL,
  target_user_id INT NOT NULL,
  target_username VARCHAR(100) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_admin_id (admin_id),
  INDEX idx_target_user_id (target_user_id),
  INDEX idx_timestamp (timestamp),
  
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Plan de Implementación

### Sprint 1: Backend y Autenticación (1 semana)
- [ ] Crear endpoints de API para admin
- [ ] Implementar autenticación de administradores
- [ ] Crear tabla admin_activity
- [ ] Implementar funciones de activación/desactivación
- [ ] Testing de endpoints

### Sprint 2: Frontend Base (1 semana)
- [ ] Setup del proyecto web (React + TypeScript + TailwindCSS)
- [ ] Implementar login de admin
- [ ] Crear layout principal con navegación
- [ ] Implementar dashboard básico
- [ ] Conectar con API

### Sprint 3: Gestión de Usuarios (1 semana)
- [ ] Implementar lista de usuarios con filtros
- [ ] Implementar paginación
- [ ] Implementar búsqueda
- [ ] Implementar activación/desactivación
- [ ] Modales de confirmación

### Sprint 4: Detalles y Pulido (1 semana)
- [ ] Vista de detalles de usuario
- [ ] Historial de actividad
- [ ] Notificaciones visuales
- [ ] Responsive design
- [ ] Testing end-to-end

## Consideraciones de Seguridad

1. **Autenticación robusta:** Solo usuarios con role='admin' pueden acceder
2. **Validación en backend:** Todas las acciones se validan en el servidor
3. **Rate limiting:** Limitar intentos de login y acciones masivas
4. **Logs de auditoría:** Registrar todas las acciones administrativas
5. **HTTPS obligatorio:** En producción, solo HTTPS
6. **CSRF protection:** Tokens CSRF en todas las mutaciones
7. **Sanitización de inputs:** Prevenir XSS y SQL injection

## Métricas de Éxito

1. **Tiempo de activación:** < 30 segundos desde el dashboard
2. **Adopción:** 100% de administradores usan el panel (vs SQL directo)
3. **Errores:** < 1% de tasa de error en activaciones
4. **Satisfacción:** Feedback positivo de administradores
5. **Eficiencia:** Reducción del 80% en tiempo de gestión de usuarios

## Próximos Pasos

1. **Revisar y aprobar** estos requerimientos
2. **Priorizar features** para MVP
3. **Asignar recursos** (desarrolladores, diseñadores)
4. **Crear proyecto** en el repositorio
5. **Iniciar Sprint 1** con backend

## Notas Adicionales

- El panel debe ser consistente visualmente con la app móvil
- Considerar agregar modo oscuro en el futuro
- Evaluar agregar notificaciones push para administradores
- Considerar integración con sistemas de ticketing (Zendesk, etc.)
- Exportación de reportes en CSV/PDF para auditorías
