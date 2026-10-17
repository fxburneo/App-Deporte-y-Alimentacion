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

## Perfil (16-oct-2026)

- Nació el 5-jul-1984 (42 años), 181 cm, 76 kg, IMC 23,2. Sin % de grasa.
- Objetivo elegido: 72–73 kg (IMC ~22). Piso: no bajar de 72 kg sin medir % de grasa. Se le señaló que ya está en rango saludable.
- Metabolismo en reposo ~1.690 kcal (Mifflin-St Jeor); ~2.280 kcal sin entreno con factor 1,35.
- No come: pescado, mariscos, vísceras.
- Quito (~2.800 m): hidratación por reloj, no por sed.
- Entreno L-V 05:00–06:30 (a veces 19:00). Sábado MTB/ruta ~4 h desde 06:30; domingo trail ~2 h desde 06:30; desayuna antes en ambos.
- Comidas L-V: desayuno 06:45, almuerzo 13:00, cena 19:00 (+ 2 snacks, horas supuestas ~10:00 y ~16:00).
- Pesaje lunes, miércoles y viernes (aviso principal el viernes).
- Procesos ajustados: cálculo del día la noche anterior; sincronización 06:35 con reintentos 07:30 y 12:00; aviso de la mañana 06:40;
  plan de mañana 19:30. Sin semáforo antes del entreno de las 05:00 (el reloj puede no haber sincronizado).

## Flujo de datos y funciones extra (17-oct-2026)

- Todo nace en el reloj Garmin → Garmin Connect, que envía lo hecho a TrainingPeaks (coach) y a Intervals.icu.
  TrainingPeaks manda lo planificado al reloj. La app lee lo planificado del iCal de TP y lo hecho + bienestar de Intervals.
- Sensaciones (esfuerzo percibido y "cómo te sentiste") las carga en el reloj: leerlas desde Intervals, no pedirlas en la app.
- Versión 1 incluye: hora de dormir (aviso 21:00, acostarse 21:30, cruce sueño-rendimiento), test de sudoración,
  resumen semanal para el coach, menú pensado para cocina por lotes el domingo (propuesta el sábado), modo enfermo/pausa.
- Descartado en v1: modo comer fuera, entrenar el estómago, lista a Tipti.
- Después de v1: plan de carrera, exámenes de sangre (ferritina, vit. D, hemoglobina), alcohol y café.

## Pendiente de Francisco

- Aprobar el blueprint v2.
- Instalar la app de Claude en GitHub para este repo (el push dio 403 el 15-oct).
