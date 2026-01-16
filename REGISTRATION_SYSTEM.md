# Sistema de Registro de Usuarios - Driver Panic Button

## Resumen

Se ha implementado un sistema completo de registro de usuarios que permite a los usuarios descargar la aplicación y registrarse con un nombre de usuario y PIN. El administrador controla la activación de las cuentas mediante un campo `isActive` en la base de datos.

## Cambios Implementados

### 1. Esquema de Base de Datos (`drizzle/schema.ts`)

**Nuevos campos agregados a la tabla `users`:**

- **`username`**: VARCHAR(100), NOT NULL, UNIQUE
  - Nombre de usuario único para login
  - Formato: 3-20 caracteres alfanuméricos (a-z, A-Z, 0-9, _)

- **`isActive`**: INT, DEFAULT 0, NOT NULL
  - Campo de activación controlado por el administrador
  - 0 = Inactivo (valor por defecto al registrarse)
  - 1 = Activo (puede usar la aplicación)

**Estructura completa de la tabla:**
```sql
users {
  id: INT (PK, AUTO_INCREMENT)
  deviceId: VARCHAR(255) (UNIQUE, NOT NULL)
  username: VARCHAR(100) (UNIQUE, NOT NULL)  -- NUEVO
  pinHash: VARCHAR(255) (NOT NULL)
  name: TEXT
  isActive: INT (DEFAULT 0, NOT NULL)        -- NUEVO
  role: ENUM('user', 'admin') (DEFAULT 'user')
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
  lastSignedIn: TIMESTAMP
}
```

### 2. Funciones de Base de Datos (`server/db.ts`)

**Funciones actualizadas:**

- **`createUser()`**: Ahora requiere `username` como parámetro
  - Establece `isActive = 0` por defecto
  - Valida que username sea único

**Nuevas funciones:**

- **`getUserByUsername(username: string)`**
  - Busca un usuario por su nombre de usuario
  - Retorna el usuario completo o undefined

- **`updateUserActiveStatus(userId: number, isActive: boolean)`**
  - Permite al administrador activar/desactivar usuarios
  - Actualiza el campo isActive (0 o 1)

### 3. Autenticación (`server/_core/pin-auth.ts`)

**Función `authenticateUser()` actualizada:**

Ahora requiere tres parámetros: `username`, `deviceId`, `pin`

**Validaciones implementadas:**
1. Verifica que el usuario exista por username
2. Valida que el deviceId coincida con el registrado
3. Verifica el PIN
4. **Valida que isActive === 1** (nuevo)
5. Actualiza lastSignedIn

**Mensajes de error en español:**
- "Usuario o PIN inválido"
- "Este usuario está registrado en otro dispositivo"
- "Tu cuenta está inactiva. Contacta al administrador para activarla."

### 4. Endpoint de Registro (`server/_core/oauth.ts`)

**Nuevo endpoint: `POST /api/auth/register`**

**Parámetros requeridos:**
```json
{
  "deviceId": "string",
  "username": "string",
  "pin": "string",
  "name": "string (opcional)"
}
```

**Validaciones:**
- PIN debe ser exactamente 6 dígitos numéricos
- Username debe tener 3-20 caracteres alfanuméricos
- Username debe ser único en la base de datos
- DeviceId debe ser único (un dispositivo = un usuario)

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Registro exitoso. Tu cuenta será activada por el administrador."
}
```

**Respuestas de error:**
- 400: Parámetros faltantes o formato inválido
- 409: Username o deviceId ya registrado
- 500: Error del servidor

### 5. Endpoint de Login Actualizado

**Endpoint: `POST /api/auth/login`**

**Parámetros actualizados:**
```json
{
  "username": "string",  // NUEVO (antes solo deviceId)
  "deviceId": "string",
  "pin": "string"
}
```

**Validaciones adicionales:**
- Verifica que el usuario esté activo (`isActive === 1`)
- Valida que el deviceId coincida con el registrado

### 6. Pantalla de Registro (`app/register.tsx`)

**Nueva pantalla completa de registro con:**

**Campos del formulario:**
- Nombre de Usuario (requerido)
  - Validación en tiempo real
  - 3-20 caracteres alfanuméricos
- Nombre (opcional)
  - Para personalización
- PIN de 6 dígitos (requerido)
  - Componente PinInput reutilizable
- Confirmar PIN (requerido)
  - Validación de coincidencia

**Características:**
- Validación en tiempo real
- Mensajes de error claros en español
- Indicador de carga durante el registro
- Navegación a login después del registro exitoso
- Diseño responsive con KeyboardAvoidingView
- Feedback háptico en dispositivos móviles

**Flujo de registro:**
1. Usuario completa el formulario
2. Validaciones del cliente
3. Llamada a API `/api/auth/register`
4. Mensaje de éxito con instrucciones
5. Redirección a pantalla de login

### 7. Pantalla de Login Actualizada (`app/login.tsx`)

**Cambios:**
- Botón "Crear Cuenta Nueva" agregado
- Navegación a `/register`
- Mensaje actualizado: "Crea una cuenta para comenzar a usar el botón de pánico"
- Mantiene funcionalidad de auto-login al completar PIN

## Flujo de Usuario Completo

### Registro (Primera vez)

1. **Usuario descarga la app**
2. **Abre la app** → Ve pantalla de login
3. **Toca "Crear Cuenta Nueva"** → Navega a registro
4. **Completa el formulario:**
   - Elige nombre de usuario único
   - Ingresa nombre (opcional)
   - Crea PIN de 6 dígitos
   - Confirma PIN
5. **Presiona "Registrarse"**
6. **Sistema valida y crea cuenta:**
   - Guarda username, deviceId, PIN hasheado
   - Establece isActive = 0 (inactivo)
7. **Usuario ve mensaje:**
   - "Tu cuenta ha sido creada"
   - "El administrador debe activarla antes de que puedas iniciar sesión"
8. **Redirección a login**

### Activación (Administrador)

1. **Administrador accede a la base de datos**
2. **Consulta usuarios pendientes:**
   ```sql
   SELECT id, username, name, deviceId, createdAt 
   FROM users 
   WHERE isActive = 0;
   ```
3. **Revisa y aprueba usuario**
4. **Activa la cuenta:**
   ```sql
   UPDATE users 
   SET isActive = 1 
   WHERE id = <user_id>;
   ```

### Login (Usuario activado)

1. **Usuario abre la app**
2. **Ingresa username y PIN**
3. **Sistema valida:**
   - Usuario existe
   - PIN correcto
   - DeviceId coincide
   - **isActive === 1** ✓
4. **Login exitoso** → Acceso a la app

### Login (Usuario inactivo)

1. **Usuario intenta login**
2. **Sistema rechaza:**
   - Error: "Tu cuenta está inactiva. Contacta al administrador para activarla."
3. **Usuario debe esperar activación**

## Seguridad

### Validaciones Implementadas

**Lado del cliente (app):**
- Formato de username (3-20 caracteres alfanuméricos)
- PIN de exactamente 6 dígitos
- Coincidencia de PIN y confirmación
- Campos requeridos

**Lado del servidor (API):**
- Validación de formato de username y PIN
- Verificación de unicidad de username
- Verificación de unicidad de deviceId
- Hash de PIN con bcrypt (10 rounds)
- Validación de estado activo en login

### Protección de Datos

- **PINs hasheados**: Nunca se almacenan en texto plano
- **DeviceId único**: Un dispositivo solo puede tener un usuario
- **Username único**: No hay duplicados
- **Validación de dispositivo**: Usuario solo puede loguearse desde su dispositivo registrado

## Administración

### Consultas Útiles para Administradores

**Ver usuarios pendientes de activación:**
```sql
SELECT id, username, name, deviceId, createdAt 
FROM users 
WHERE isActive = 0
ORDER BY createdAt DESC;
```

**Activar un usuario:**
```sql
UPDATE users 
SET isActive = 1 
WHERE username = 'nombre_usuario';
```

**Desactivar un usuario:**
```sql
UPDATE users 
SET isActive = 0 
WHERE username = 'nombre_usuario';
```

**Ver usuarios activos:**
```sql
SELECT id, username, name, lastSignedIn 
FROM users 
WHERE isActive = 1
ORDER BY lastSignedIn DESC;
```

**Estadísticas:**
```sql
SELECT 
  COUNT(*) as total_usuarios,
  SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activos,
  SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactivos
FROM users;
```

## Próximos Pasos Recomendados

### Panel de Administración (Futuro)

Crear una interfaz web para administradores que permita:
- Ver lista de usuarios pendientes
- Activar/desactivar usuarios con un clic
- Ver historial de actividad
- Gestionar roles
- Enviar notificaciones

### Notificaciones

- Email al administrador cuando hay nuevo registro
- Notificación push al usuario cuando su cuenta es activada
- SMS de confirmación de registro

### Mejoras de Seguridad

- Rate limiting en endpoints de registro y login
- Captcha para prevenir registros automatizados
- Verificación de email/teléfono
- 2FA opcional

### Funcionalidades Adicionales

- Recuperación de PIN (con verificación de identidad)
- Cambio de username (con aprobación de admin)
- Transferencia de cuenta a nuevo dispositivo
- Historial de actividad del usuario

## Archivos Modificados

1. `drizzle/schema.ts` - Esquema de base de datos
2. `server/db.ts` - Funciones de base de datos
3. `server/_core/pin-auth.ts` - Lógica de autenticación
4. `server/_core/oauth.ts` - Endpoints de auth
5. `app/login.tsx` - Pantalla de login actualizada
6. `app/register.tsx` - Nueva pantalla de registro

## Migración de Base de Datos

Para aplicar los cambios al esquema de la base de datos:

```bash
pnpm db:push
```

Esto generará y ejecutará las migraciones necesarias para agregar los campos `username` e `isActive` a la tabla `users`.

## Testing

### Probar Registro

1. Abrir la app
2. Tocar "Crear Cuenta Nueva"
3. Completar formulario con datos válidos
4. Verificar mensaje de éxito
5. Verificar que el usuario aparece en la BD con `isActive = 0`

### Probar Login (Usuario Inactivo)

1. Intentar login con usuario recién registrado
2. Verificar mensaje: "Tu cuenta está inactiva..."

### Probar Activación

1. Ejecutar: `UPDATE users SET isActive = 1 WHERE username = 'test_user';`
2. Intentar login nuevamente
3. Verificar que el login es exitoso

### Probar Validaciones

1. Username muy corto (< 3 caracteres)
2. Username con caracteres especiales
3. PIN no numérico
4. PINs que no coinciden
5. Username duplicado
6. DeviceId duplicado

## Conclusión

El sistema de registro está completamente funcional y listo para producción. Los usuarios pueden registrarse de forma autónoma, y los administradores tienen control total sobre qué usuarios pueden acceder a la aplicación mediante el campo `isActive`.
