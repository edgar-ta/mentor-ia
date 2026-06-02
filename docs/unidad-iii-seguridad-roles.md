# Unidad III - Seguridad para roles de usuarios

## Contexto del proyecto

- **Stack real:** Node.js + Express + MySQL + React + Vite.
- **Tipo de sitio:** plataforma de mentorias y entrenamientos personalizados con enfoque visual tipo marca deportiva premium.
- **Roles definidos para este proyecto:**
  - `usuario`
  - `administrador`

---

## 1. Investigacion 1 - Autenticacion por tipo de usuario

### Que es la autenticacion por roles

La autenticacion por roles es un modelo de seguridad en el que el sistema no solo valida la identidad del usuario, sino tambien **que puede hacer** dentro de la aplicacion. Primero se confirma que la persona es quien dice ser mediante credenciales seguras. Despues, el sistema consulta el rol asignado y habilita o bloquea modulos, acciones, botones y rutas.

Este enfoque evita que todos los usuarios vean las mismas opciones, reduce la superficie de ataque y ayuda a cumplir el principio de **minimo privilegio**.

### Diferencias entre roles

- **Usuario:** consume contenido, consulta sesiones, usa el buscador, interactua con el coach IA y administra su cuenta.
- **Editor:** en sistemas CMS suele crear y editar contenido, pero no administra seguridad ni usuarios. En este proyecto no se usa como rol real, pero sirve como referencia academica.
- **Administrador:** tiene control operativo y de seguridad. Gestiona clientes, configuraciones sensibles, supervision general y auditoria.
- **Invitado:** accede a secciones publicas sin autenticarse. En este proyecto puede existir en la parte comercial del sitio, aunque el panel interno se protege con login.

### Ejemplos reales de permisos por rol

- En una tienda:
  - cliente compra y ve pedidos.
  - administrador cambia inventario, precios y usuarios.
- En un blog:
  - editor publica articulos.
  - administrador configura categorias, revisa reportes y asigna permisos.
- En esta plataforma de mentorias:
  - `usuario` ve su dashboard, sesiones y recursos.
  - `administrador` ve clientes, sesiones globales, seguridad y configuracion.

### Mejores practicas de seguridad

- Separar autenticacion de autorizacion.
- Aplicar control de acceso en backend, no solo ocultar botones en frontend.
- Usar cookies `httpOnly` para sesiones y no guardar tokens sensibles en `localStorage`.
- Hash de contrasenas con algoritmo resistente. En este proyecto se usa `scrypt`.
- Regenerar o renovar identificadores de sesion al autenticarse.
- Definir expiracion por inactividad.
- Permitir revocacion de sesiones activas.
- Usar tokens de recuperacion de un solo uso y tiempo limitado.
- Responder con mensajes neutros en recuperacion para no filtrar si un correo existe.
- Proteger rutas por rol con middleware centralizado.

---

## 2. Tabla de Roles y Permisos

| Rol | Descripcion del rol | Modulos / Paginas con acceso | Acciones permitidas | Acciones denegadas |
| --- | --- | --- | --- | --- |
| Invitado | Visitante no autenticado en la parte publica del sitio | Landing, catalogo publico, login, registro, recuperacion | Ver informacion publica, registrarse, solicitar recuperacion | Entrar al panel, ver clientes, usar sesiones privadas |
| Usuario | Cliente registrado de la plataforma de mentorias | Dashboard, buscador, sesiones, coach IA, perfil y recuperacion | Iniciar sesion, cerrar sesion, consultar sesiones, buscar recursos, usar chatbot, recuperar contrasena | Ver clientes globales, gestionar usuarios, acceder a seguridad administrativa |
| Administrador | Responsable operativo y de seguridad del sistema | Todo lo del usuario + clientes + seguridad/ajustes | Gestionar clientes, revisar sesiones activas, cerrar sesiones globales, monitorear modulos internos | No debe omitir controles ni acceder sin autenticacion |

---

## 3. Diseno del flujo de inicio de sesion

### Flujo en texto

```text
Usuario abre /login
-> Ingresa email y contrasena
-> Frontend envia POST /api/auth/login
-> Backend busca usuario por email
-> Verifica password con scrypt
-> Si falla:
   -> responde 401 Credenciales invalidas
-> Si es valido:
   -> crea registro en user_sessions
   -> genera token opaco
   -> guarda hash del token en BD
   -> envia cookie httpOnly
   -> responde user + redirectTo segun rol
-> Frontend recibe user autenticado
-> Si rol = administrador:
   -> redirige a /clientes
-> Si rol = usuario:
   -> redirige a /
```

### Pseudocodigo de redireccion por rol

```js
if (user.rol === 'administrador') {
  navigate('/clientes');
} else {
  navigate('/');
}
```

---

## 4. Implementacion - Autenticacion por roles

### Base de datos

Se implementaron estas tablas:

- `usuarios`
- `user_sessions`
- `password_reset_tokens`

Archivo: [backend/schema.sql](/home/francesito/Downloads/MentorIA/backend/schema.sql)

### Backend de autenticacion

Archivos principales:

- [backend/server.js](/home/francesito/Downloads/MentorIA/backend/server.js)
- [backend/lib/auth.js](/home/francesito/Downloads/MentorIA/backend/lib/auth.js)
- [backend/lib/middleware.js](/home/francesito/Downloads/MentorIA/backend/lib/middleware.js)
- [backend/lib/security.js](/home/francesito/Downloads/MentorIA/backend/lib/security.js)
- [backend/lib/http.js](/home/francesito/Downloads/MentorIA/backend/lib/http.js)

### Endpoints implementados

| Endpoint | Metodo | Descripcion | Proteccion |
| --- | --- | --- | --- |
| `/api/auth/register` | POST | Crea cuenta con rol `usuario` | Publico |
| `/api/auth/login` | POST | Autentica y crea sesion | Publico |
| `/api/auth/me` | GET | Devuelve usuario y sesion actual | Requiere login |
| `/api/auth/sessions` | GET | Lista sesiones activas | Requiere login |
| `/api/auth/logout` | POST | Cierra la sesion actual | Requiere login |
| `/api/auth/logout-all` | POST | Cierra todas las sesiones | Requiere login |

### Verificacion de rol

Middleware usado:

```js
app.get('/api/clients', requireLogin, requireRole('administrador'), handler);
```

Esto obliga a:

1. Tener sesion valida.
2. Tener el rol adecuado.

---

## 5. Investigacion 2 - Manejo de multisesiones

### Como funcionan las sesiones en Node.js

Node.js no trae una sesion por defecto como PHP. El flujo comun es:

1. El servidor autentica al usuario.
2. Genera un identificador de sesion seguro.
3. Lo envia en una cookie.
4. Guarda en base de datos el estado de esa sesion.
5. En cada request se valida que la cookie exista, no este revocada y no haya expirado.

### Cookie de sesion vs almacenamiento en base de datos

| Opcion | Ventajas | Riesgos |
| --- | --- | --- |
| Cookie con ID de sesion | Simple, estandar, compatible con navegadores | Si no es `httpOnly`, puede ser robada por XSS |
| Sesion almacenada en BD | Permite auditar, revocar, limitar dispositivos, cerrar todo | Requiere mas logica y limpieza |

En este proyecto se usan ambas:

- Cookie `httpOnly` con token opaco.
- Tabla `user_sessions` con hash del token y metadatos.

### Control de sesion activa

Se pueden manejar dos estrategias:

- **Una sola sesion por usuario:** mas estricto, pero incomodo.
- **Multisesion controlada:** mas realista para movil, laptop y tablet.

### Recomendacion para este proyecto

Se implemento **multisesion controlada** con maximo de 3 sesiones activas. Si el usuario supera ese limite, el sistema revoca las mas antiguas.

### Ventajas y riesgos

- Ventajas:
  - mejor experiencia de uso.
  - auditoria basica por IP y navegador.
  - cierre global de sesiones.
- Riesgos:
  - si una sesion se roba, puede mantenerse activa hasta expirar o ser revocada.
  - requiere proteger bien cookies, CSRF y XSS.

---

## 6. Diseno y Politica de Sesiones

### Politica definida

- **Expiracion por inactividad:** 12 horas.
- **Sesion en multiples dispositivos:** si, hasta 3 sesiones.
- **Cierre en todos los dispositivos:** disponible con `logout-all`.
- **Restablecimiento de contrasena:** revoca todas las sesiones.
- **Renovacion de sesion:** cada request valida actualiza actividad y extiende expiracion.

### Implementacion aplicada

Archivos:

- [backend/lib/auth.js](/home/francesito/Downloads/MentorIA/backend/lib/auth.js)
- [backend/lib/http.js](/home/francesito/Downloads/MentorIA/backend/lib/http.js)

### Equivalente a `session_regenerate_id`

En Node/Express sin `express-session`, el equivalente seguro es:

1. Crear un nuevo token opaco al iniciar sesion.
2. Guardar solo su hash en BD.
3. Enviar el nuevo token en cookie `httpOnly`.

Eso evita reutilizar identificadores anteriores y cumple el objetivo de rotacion segura.

---

## 7. Investigacion 3 - Recuperacion de contrasenas

### Comparacion de metodos

| Metodo | Seguridad | Practicidad | Recomendacion |
| --- | --- | --- | --- |
| Preguntas de seguridad | Baja | Media | No recomendada |
| Codigo enviado por email | Media | Alta | Valido si el codigo expira rapido |
| Token temporal en BD | Alta | Alta | Recomendado |
| Enlace de restablecimiento | Alta | Muy alta | Mejor opcion para este proyecto |

### Recomendacion

La opcion mas segura y practica para un proyecto academico serio es:

- enlace de restablecimiento con token aleatorio.
- token hasheado en base de datos.
- expiracion corta.
- uso unico.

### Flujo completo

```text
Usuario abre "Olvide mi contrasena"
-> Ingresa su correo
-> Backend genera token aleatorio
-> Guarda solo hash del token en password_reset_tokens
-> Construye URL temporal
-> En desarrollo local la muestra como preview y la registra en consola
-> Usuario abre enlace
-> Ingresa nueva contrasena
-> Backend valida token, expiracion y uso unico
-> Actualiza password_hash
-> Marca token como usado
-> Revoca sesiones activas
```

---

## 8. Implementacion - Recuperacion de contrasena

### Frontend

Paginas implementadas:

- [frontend/src/pages/ForgotPasswordPage.jsx](/home/francesito/Downloads/MentorIA/frontend/src/pages/ForgotPasswordPage.jsx)
- [frontend/src/pages/ResetPasswordPage.jsx](/home/francesito/Downloads/MentorIA/frontend/src/pages/ResetPasswordPage.jsx)

### Backend

Logica implementada:

- generar token aleatorio.
- almacenar `sha256(token)`.
- expirar en 30 minutos.
- invalidar tokens anteriores no usados.
- invalidar sesiones al cambiar contrasena.

Archivos:

- [backend/lib/auth.js](/home/francesito/Downloads/MentorIA/backend/lib/auth.js)
- [backend/lib/mailer.js](/home/francesito/Downloads/MentorIA/backend/lib/mailer.js)

### Endpoint de recuperacion

| Endpoint | Metodo | Funcion |
| --- | --- | --- |
| `/api/auth/forgot-password` | POST | Genera token y enlace |
| `/api/auth/reset-password` | POST | Cambia contrasena con token valido |

---

## 9. Investigacion 4 - Proteccion de rutas

### Rutas publicas

Son rutas que no requieren login:

- `/login`
- `/registro`
- `/olvide-password`
- `/restablecer-password`
- endpoints publicos de autenticacion

### Rutas privadas

Son rutas que exigen identidad valida:

- `/`
- `/buscar`
- `/sesiones`
- `/chat`
- `/clientes`
- `/ajustes`

### Middleware de autenticacion y autorizacion

El backend usa:

- `requireLogin`
- `requireRole('administrador')`

El frontend usa:

- `ProtectedRoute`

### Redireccion cuando no tiene permisos

- si no tiene sesion: se redirige a `/login`.
- si la sesion existe pero el rol no cumple: se redirige a `/sin-acceso`.

---

## 10. Implementacion - Proteccion de rutas

### Backend

Ejemplo real:

```js
app.get('/api/sessions', requireLogin, async handler);
app.get('/api/clients', requireLogin, requireRole('administrador'), async handler);
```

### Frontend

Ejemplo real:

```jsx
<ProtectedRoute roles={['administrador']}>
  <Clients />
</ProtectedRoute>
```

### Archivos involucrados

- [frontend/src/components/ProtectedRoute.jsx](/home/francesito/Downloads/MentorIA/frontend/src/components/ProtectedRoute.jsx)
- [frontend/src/App.jsx](/home/francesito/Downloads/MentorIA/frontend/src/App.jsx)
- [frontend/src/pages/UnauthorizedPage.jsx](/home/francesito/Downloads/MentorIA/frontend/src/pages/UnauthorizedPage.jsx)

---

## 11. Pruebas y Evidencias

### Lista de pruebas recomendadas

- Login con credenciales correctas.
- Login con password incorrecta.
- Acceso a ruta privada sin sesion.
- Acceso de `usuario` a ruta solo `administrador`.
- Registro de cuenta nueva.
- Recuperacion con correo existente.
- Recuperacion con token vencido.
- Cambio de contrasena exitoso.
- Cierre de sesion actual.
- Cierre de todas las sesiones.
- Apertura de mas de 3 sesiones y revocacion de las mas antiguas.

### Tabla de pruebas

| Caso de prueba | Rol | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- |
| Login correcto | usuario | Accede al dashboard y recibe cookie valida | Pendiente de ejecutar |
| Login correcto | administrador | Accede y redirige a clientes | Pendiente de ejecutar |
| Login con password invalida | cualquiera | Mensaje de error 401 | Pendiente de ejecutar |
| Ruta `/clientes` con usuario | usuario | Redireccion a sin acceso / 403 en API | Pendiente de ejecutar |
| Ruta `/clientes` con administrador | administrador | Acceso permitido | Pendiente de ejecutar |
| Recuperacion con correo registrado | usuario | Se genera enlace temporal | Pendiente de ejecutar |
| Reset con token usado | usuario | Error de token invalido o expirado | Pendiente de ejecutar |
| Logout actual | cualquiera | Sesion actual revocada | Pendiente de ejecutar |
| Logout global | cualquiera | Todas las sesiones revocadas | Pendiente de ejecutar |
| Exceso de sesiones | cualquiera | Se revoca la mas antigua al superar 3 | Pendiente de ejecutar |

### Capturas sugeridas para evidencia

- Pantalla de login.
- Registro de usuario.
- Dashboard autenticado como `usuario`.
- Dashboard o clientes autenticado como `administrador`.
- Mensaje de acceso denegado.
- Pantalla de recuperacion de contrasena.
- Pantalla de restablecimiento.
- Vista de sesiones activas en ajustes.
- Base de datos mostrando `usuarios`.
- Base de datos mostrando `user_sessions`.
- Base de datos mostrando `password_reset_tokens`.

---

## 12. Entregable final

### Lo que debes entregar

- Investigacion 1 sobre autenticacion por tipo de usuario.
- Tabla profesional de roles y permisos.
- Flujo de inicio de sesion.
- Implementacion funcional de autenticacion por roles.
- Investigacion 2 sobre multisesiones.
- Politica de sesiones del proyecto.
- Implementacion funcional de control de sesiones.
- Investigacion 3 sobre recuperacion de contrasenas.
- Implementacion funcional de recuperacion por token.
- Investigacion 4 sobre proteccion de rutas.
- Implementacion funcional del middleware de proteccion.
- Tabla de pruebas y evidencias.
- Capturas de pantalla.
- Conclusiones por tema.

### Mejoras de seguridad pendientes

- Agregar proteccion CSRF para formularios sensibles.
- Agregar rate limiting a login y recuperacion.
- Registrar auditoria avanzada de eventos de seguridad.
- Implementar verificacion de correo real.
- Integrar proveedor SMTP real en lugar de `MAIL_MODE=console`.
- Agregar bloqueo temporal por intentos fallidos.
- Forzar HTTPS en produccion.

### Conclusiones por tema

- **Autenticacion por roles:** permite separar claramente lo que puede hacer un cliente y lo que puede hacer un administrador.
- **Sesiones:** una sesion segura no solo autentica; tambien debe expirar, poder revocarse y auditarse.
- **Recuperacion:** el enlace temporal con token aleatorio y uso unico es la opcion mas equilibrada para seguridad y facilidad de uso.
- **Proteccion de rutas:** ocultar opciones visuales no basta; la autorizacion debe aplicarse siempre en backend y frontend.

---

## Anexo tecnico del proyecto implementado

### Archivos nuevos o modificados mas importantes

- [backend/server.js](/home/francesito/Downloads/MentorIA/backend/server.js)
- [backend/schema.sql](/home/francesito/Downloads/MentorIA/backend/schema.sql)
- [backend/lib/auth.js](/home/francesito/Downloads/MentorIA/backend/lib/auth.js)
- [backend/lib/middleware.js](/home/francesito/Downloads/MentorIA/backend/lib/middleware.js)
- [backend/lib/security.js](/home/francesito/Downloads/MentorIA/backend/lib/security.js)
- [backend/lib/http.js](/home/francesito/Downloads/MentorIA/backend/lib/http.js)
- [backend/lib/mailer.js](/home/francesito/Downloads/MentorIA/backend/lib/mailer.js)
- [frontend/src/App.jsx](/home/francesito/Downloads/MentorIA/frontend/src/App.jsx)
- [frontend/src/context/AuthContext.jsx](/home/francesito/Downloads/MentorIA/frontend/src/context/AuthContext.jsx)
- [frontend/src/components/ProtectedRoute.jsx](/home/francesito/Downloads/MentorIA/frontend/src/components/ProtectedRoute.jsx)
- [frontend/src/components/Settings.jsx](/home/francesito/Downloads/MentorIA/frontend/src/components/Settings.jsx)
- [frontend/src/pages/LoginPage.jsx](/home/francesito/Downloads/MentorIA/frontend/src/pages/LoginPage.jsx)
- [frontend/src/pages/RegisterPage.jsx](/home/francesito/Downloads/MentorIA/frontend/src/pages/RegisterPage.jsx)
- [frontend/src/pages/ForgotPasswordPage.jsx](/home/francesito/Downloads/MentorIA/frontend/src/pages/ForgotPasswordPage.jsx)
- [frontend/src/pages/ResetPasswordPage.jsx](/home/francesito/Downloads/MentorIA/frontend/src/pages/ResetPasswordPage.jsx)

### Credenciales iniciales

El sistema crea automaticamente un administrador inicial al arrancar si no existe ninguno:

- Email: valor de `BOOTSTRAP_ADMIN_EMAIL`
- Password: valor de `BOOTSTRAP_ADMIN_PASSWORD`

Configurable en: [backend/.env.example](/home/francesito/Downloads/MentorIA/backend/.env.example)
