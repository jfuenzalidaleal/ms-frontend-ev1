# ms-frontend-ev1

Frontend de la tienda de videojuegos. Es una aplicación React (Vite) que permite a los clientes navegar el catálogo, armar un carrito y hacer pedidos, y que ofrece paneles de gestión para administradores y operadores. La autenticación se hace con Microsoft Entra ID (MSAL) y toda la comunicación con el backend pasa por un BFF.

## Tecnologías

| Área | Herramienta |
| --- | --- |
| UI | React 19 |
| Build / dev server | Vite 8 |
| Enrutamiento | React Router 7 |
| Estilos | Tailwind CSS 4 + estilos en línea en los dashboards |
| HTTP | Axios con interceptor de token |
| Autenticación | `@azure/msal-browser` y `@azure/msal-react` (Microsoft Entra ID) |
| Linter | Oxlint |

## Requisitos previos

- Node.js 20.19 o superior (requerido por Vite 8) y npm.
- El BFF corriendo y accesible (por defecto se consume en la URL definida en `VITE_API_URL`).
- Una cuenta en el tenant de Entra ID configurado, con uno de los roles de la aplicación asignado.

## Instalación y ejecución

```bash
git clone <url-del-repositorio>
cd ms-frontend-ev1
npm install
```

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8080
```

Luego levanta el servidor de desarrollo:

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`. Ese puerto importa, porque es el `redirectUri` registrado en Entra ID (ver [Autenticación](#autenticación-y-roles)).

### Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente el contenido de `dist/` |
| `npm run lint` | Ejecuta Oxlint sobre el proyecto |

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base del BFF. Los servicios le agregan `/api/bff/productos` y `/api/bff/pedidos`. | `http://localhost:8080` |

Vite solo expone al navegador las variables que empiezan con `VITE_`. Si cambias el `.env`, reinicia `npm run dev`.

## Autenticación y roles

La configuración de MSAL está en `src/authConfig.js`:

- `clientId` y `authority`: identifican la aplicación y el tenant en Entra ID.
- `redirectUri`: `http://localhost:5173`. Si despliegas en otra URL, debes cambiarlo aquí y registrarlo en el portal de Azure.
- `loginRequest.scopes`: el scope `access_as_user` de la API del backend.
- La sesión se guarda en `sessionStorage`, así que se cierra al cerrar la pestaña.

El flujo es el siguiente:

1. El usuario inicia sesión desde el Navbar (`loginRedirect`).
2. El hook `useUserRole` (`src/hooks/userRole.js`) obtiene un access token en silencio y lee el claim `roles`.
3. Según el rol, la aplicación muestra una u otra vista.
4. `src/services/axiosClient.js` agrega automáticamente el header `Authorization: Bearer <token>` a cada petición. Si el token no se puede renovar en silencio, redirige al login.

| Rol en Entra ID | Rol en la app | Acceso |
| --- | --- | --- |
| `ROLE_ADMIN` | ADMIN | Catálogo y panel de administración completo |
| `ROLE_OPERADOR` | OPERADOR | Catálogo y panel de operación |
| `ROLE_CLIENTE` | CLIENTE | Catálogo, carrito y sus propios pedidos |
| (sin sesión) | — | Solo el catálogo |

## Rutas

| Ruta | Qué muestra |
| --- | --- |
| `/` | Catálogo de juegos, con buscador por nombre y filtro por formato |
| `/dashboard` | `AdminDashboard` u `OperadorDashboard` según el rol. Otros usuarios son redirigidos a `/` |
| `/pedidos` | Admin y operador ven su panel; el cliente ve `MisPedidosPage` con su historial |
| `*` | Redirige a `/` |

## Usuarios:
1. Administrador: administrador@probandololaso.onmicrosoft.com / Probando123
2. Operador: operador@probandololaso.onmicrosoft.com / Probando123
3. Cliente: cliente@probandololaso.onmicrosoft.com / Probando123


## Funcionalidades por rol

**Cliente**
- Agregar juegos al carrito, con validación de stock disponible.
- Confirmar el pedido desde el carrito. El pedido se asocia al usuario autenticado.
- Revisar el estado de sus pedidos en `/pedidos`.

**Operador** (`OperadorDashboard`)
- Ver todos los pedidos, filtrarlos por estado y expandir el detalle de cada uno.
- Avanzar el estado de un pedido: `CREADO → ACEPTADO → EN_PREPARACION → DESPACHADO → ENTREGADO`.
- Cancelar un pedido en cualquier etapa previa a la entrega, con confirmación previa.
- Crear pedidos manualmente y agregar productos nuevos al catálogo (sin editar ni eliminar).

**Administrador** (`AdminDashboard`)
- Pestaña **Resumen**: desglose de pedidos por estado, total de productos, productos con bajo stock (menos de 5 unidades) y último pedido registrado.
- Pestaña **Pedidos**: lo mismo que el operador. La cancelación usa el endpoint `cancelar-admin`.
- Pestaña **Inventario**: CRUD completo de productos (crear, editar y eliminar juegos). La eliminación pide confirmación.

Las acciones irreversibles (cancelar un pedido y eliminar un juego) muestran el modal reutilizable `ConfirmModal` antes de ejecutarse.

## Estructura del proyecto

```
src/
├── App.jsx                 # Rutas, controladores por rol y estado global del carrito
├── main.jsx                # Punto de entrada: inicializa MSAL y monta la app
├── authConfig.js           # Configuración de MSAL (clientId, tenant, scopes)
├── msalInstance.js         # Instancia única de MSAL y cuenta activa
├── hooks/
│   └── userRole.js         # Obtiene el rol del usuario desde el token
├── services/
│   ├── axiosClient.js      # Axios con interceptor que agrega el token
│   ├── catalogoService.js  # Endpoints de productos
│   └── pedidosService.js   # Endpoints de pedidos
├── components/
│   ├── Navbar.jsx
│   ├── AdminDashboard.jsx
│   ├── OperadorDashboard.jsx
│   ├── CarritoModal.jsx
│   ├── CrearPedidoModal.jsx
│   ├── ConfirmModal.jsx    # Modal de confirmación reutilizable
│   ├── PedidosList.jsx
│   ├── ProtectedRoute.jsx
│   └── authButtons.jsx
└── pages/
    ├── CatalogoPage.jsx
    └── MisPedidosPage.jsx
```

## Endpoints consumidos

Todos se llaman sobre `VITE_API_URL` y requieren token.

| Método | Endpoint | Uso |
| --- | --- | --- |
| GET | `/api/bff/productos` | Listar productos |
| POST | `/api/bff/productos` | Crear producto |
| PUT | `/api/bff/productos/{id}` | Editar producto |
| DELETE | `/api/bff/productos/{id}` | Eliminar producto |
| GET | `/api/bff/pedidos` | Listar todos los pedidos |
| POST | `/api/bff/pedidos` | Crear pedido |
| PATCH | `/api/bff/pedidos/{id}/status?status=...` | Cambiar estado de un pedido |
| PATCH | `/api/bff/pedidos/{id}/cancelar-admin` | Cancelar pedido (administrador) |
| GET | `/api/bff/pedidos/client/{clienteId}` | Pedidos de un cliente |
| GET | `/api/bff/pedidos/metricas` | Métricas de ventas |

## Problemas comunes

- **La app queda en "Cargando..." o no detecta el rol:** revisa que el usuario tenga un rol asignado en la aplicación empresarial de Entra ID y que el token incluya el claim `roles`.
- **Error de redirección al iniciar sesión (`AADSTS50011`):** la URL desde la que abres la app no coincide con el `redirectUri`. Usa `http://localhost:5173` o registra la nueva URL.
- **Errores de CORS o `undefined/api/bff/...` en las peticiones:** falta `VITE_API_URL` en el `.env` o el BFF no está corriendo.