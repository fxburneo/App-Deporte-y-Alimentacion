<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FXB Performance: reglas del proyecto

Antes de tocar código, leer completo `docs/CONTEXTO.md` (decisiones y estado) y el blueprint `docs/blueprint.html`.

- Usuario: Francisco, ingeniero industrial, no programador. Responder en español, directo, sin emojis.
  Concepto primero, luego código. Preguntas múltiples en cuadros de diálogo, una por una.
- Comentarios del código en español; nombres de variables y funciones en inglés o español claro.
- Siempre con pruebas automáticas (`npm test`). Antes de subir: `npm test`, `npx tsc --noEmit`, `npx eslint`, `npm run build`.
- Regla de oro: ninguna pantalla se programa sin maqueta aprobada (`docs/maquetas/`, canvas
  https://claude.ai/artifact/FBpH6vnaFWs6FZeamzAj4Q).
- Instructivos para plataformas (Supabase, Vercel, Intervals, TrainingPeaks): paso a paso en español, publicados como página.
- Llaves nunca en el repositorio: van como variables de entorno en Vercel/Supabase.
- El Supabase conectado al entorno de la nube es el de FINANZAS (eneob…): no usarlo para esta app.
- Francisco trabaja desde un PC de oficina sin permisos de administrador: todo se construye y prueba en la nube;
  el login real se prueba en la vista previa de Vercel.
