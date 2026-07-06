# Horas de Trabajo ⏱️

App web premium y responsive para registrar y consultar horas trabajadas. Creada con React, Tailwind CSS y Supabase.

## Stack

- **Frontend:** React 19 + Vite
- **Estilos:** Tailwind CSS 3
- **Base de datos y Auth:** Supabase
- **Gráficas:** Recharts
- **Ruteo:** React Router DOM

## Requisitos

- Node.js 18+
- Una cuenta en [Supabase](https://supabase.com) (plan gratuito)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd horas-de-trabajo

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env
```

## Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase-migration.sql` para crear la tabla `work_shifts` y las políticas RLS.
3. Ve a **Project Settings > API** y copia tu `URL` y `anon key`.
4. Pega esos valores en tu archivo `.env`:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

5. (Opcional) En **Authentication > Settings**, deshabilita "Confirm email" si quieres que los usuarios puedan registrarse sin verificar correo.

## Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`.

## Build para producción

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
src/
├── components/
│   ├── auth/          # Login y registro
│   ├── dashboard/     # Resumen con tarjetas
│   ├── history/       # Historial con filtros
│   ├── shifts/        # Formulario y tarjeta de turno
│   ├── stats/         # Estadísticas con gráfica
│   └── ui/            # Componentes reutilizables
├── contexts/          # AuthContext (estado global de sesión)
├── lib/               # Cliente Supabase, utilerías
├── App.jsx            # Configuración de rutas
├── main.jsx           # Entry point
└── index.css          # Estilos globales Tailwind
```

## Funcionalidades

- **Autenticación:** Login, registro, sesión persistente, cierre de sesión.
- **Dashboard:** Resumen de horas de hoy, semana, mes y total acumulado en tarjetas premium.
- **Registro de jornada:** Formulario con fecha, hora inicio/fin, descanso y notas. Cálculo automático de horas netas.
- **Historial:** Lista completa con filtros por semana, mes y rango de fechas. Editar y eliminar registros.
- **Estadísticas:** Gráfica de barras por semana/mes, promedio de horas y mejor período.

## Diseño

- Mobile-first, responsive.
- Paleta ivory/gold con tarjetas blancas translúcidas.
- Animaciones suaves, sombras premium y microinteracciones.
- Optimizado para iPhone y Android.
