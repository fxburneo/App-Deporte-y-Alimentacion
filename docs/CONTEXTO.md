# Fondo y Plato (nombre de trabajo): contexto y decisiones

Documento de traspaso. Cualquier sesión nueva debe leerlo completo antes de tocar código.
Blueprint publicado: https://claude.ai/artifact/K5mr2PvweSDvwdkMrSh3hL (`docs/blueprint.html`). **Estado: pendiente de aprobación.**

## Cómo trabajar con Francisco

- Mismas reglas que en App-Finanzas-BPs (`docs/CONTEXTO.md` de ese repo): español, directo, sin emojis,
  concepto primero y luego código, pruebas automáticas, crítica honesta, preguntas en cuadros de diálogo (una por una).
- No es programador: lenguaje simple; instructivos paso a paso en español para cualquier plataforma.
- **Regla de oro:** maqueta publicada como página y aprobación explícita antes de programar cada pantalla.
- PC de oficina sin permisos de administrador: no instala Node.js. Todo se construye en la nube.

## Lecciones heredadas de finanzas

- Procesos programados en Supabase (pg_cron / funciones), no en Vercel (plan Hobby: 1 cron al día).
- El login real se prueba en la vista previa de Vercel (el proxy de la nube reemplaza la sesión).
- Cambios de base de datos: script SQL + instructivo; Francisco los corre en Supabase.
- Llaves nunca en el repo: variables privadas en Vercel/Supabase.
- Supabase Free se pausa tras 7 días sin actividad.

## Decisiones (15-oct-2026)

- Usuario único: Francisco. iPhone, PWA (Next.js en Vercel), avisos Web Push.
- **Proyecto Supabase nuevo**, separado del de finanzas (el conectado hoy en la nube, eneob…, es el de FINANZAS: no usarlo para esta app).
- Garmin: vía **Intervals.icu** (API con llave personal) + plan B manual (archivo o captura). Capa de fuentes intercambiable.
  Riesgo: el 9-oct-2026 Intervals avisó que probablemente bloqueará datos de Garmin en su API (sin fecha); Garmin
  reabrirá su programa de desarrolladores con acceso más fácil para personas. Alertar si pasan 48 h sin datos.
- Entrenos planificados: **calendario iCal de TrainingPeaks** (Premium; Francisco lo reactiva el 1-nov-2026). 14 días adelante, retraso hasta 24 h.
- Deportes: ciclismo ruta/MTB, rodillo (con potencia), trail/running, fuerza. Banda de pecho y reloj. Sin báscula Garmin.
- Sin carreras con fecha por ahora; las cargará en TrainingPeaks.
- Nutrición: ritmo moderado (0,3–0,5 kg/semana), 3 comidas + 2 snacks, tiene alimentos que no le gustan (pendiente lista).
  Periodización de carbohidratos por tipo de día; proteína 1,8–2,2 g/kg; grasa 0,8–1,0 g/kg; ajuste semanal por peso promedio.
- Peso objetivo: no lo sabe; la app propone un rango.
- Registro de comidas: foto o texto libre + IA, el usuario confirma.
- Menú: rotativo semanal por IA con lista de compras; opciones aceptar / mantener anterior / pedir cambio validado.
- Intra-entreno: sí; recomendar g/h de carbohidrato y ml/h, y validar lo que Francisco dice que lleva.
- Coach: segunda opinión en lenguaje SIN tecnicismos; no modifica el plan del entrenador; alimenta la nutrición.
  Análisis diario corto + informe semanal (domingo).
- Avisos: viernes peso, plan de comidas de mañana, recordar registrar comidas, alertas de fatiga.

## Pendiente de Francisco

- Edad, estatura, peso, % grasa; alimentos que no le gustan; horarios; ciudad de entreno.
- Decidir pesaje 3 veces por semana (recomendado) o solo viernes.
- Aprobar el blueprint.
