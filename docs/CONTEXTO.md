# FXB Performance: contexto y decisiones

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

## Maquetas (19-oct-2026)

Hoja de pantallas (formato de presentación, como en finanzas): https://claude.ai/artifact/7K9ftsWgZahRoq1srhpjq1 (`docs/maquetas/pantallas.html`). Lienzo editable: https://claude.ai/artifact/FBpH6vnaFWs6FZeamzAj4Q. Mostrar siempre la hoja, no el lienzo.

## Nombre, estilo y recálculo (20-oct-2026)

- Nombre: **FXB Performance** (elegido entre varias opciones).
- Estilo: oscuro tipo reloj deportivo (referencias Garmin Connect y Strava). Grafito #0E1113, acento naranja #FF6A1A
  solo para marca y acciones; carbohidratos #FFB020, proteína #4C9DFF, grasa #B98CFF, recuperación #3DDC84.
  Saira Condensed (números) + Archivo (texto). Las 9 pantallas rehechas en este estilo (20-oct); pendiente aprobación final.
  Motivo: el primer diseño "se notaba hecho por IA" (tarjetas blancas, recuadros pastel, píldoras).
- Recálculo: plan la noche anterior → ajuste por entreno real (umbral ~150 kcal o 15 %) → rebalanceo por comidas.
  Compensación moderada (máx. 30 % de las comidas pendientes, sin arrastre al día siguiente). Nunca quitar comidas,
  nunca bajar proteína, nunca recortar carbohidratos antes de entreno duro. Aviso solo si cambia la siguiente comida.

## Etapa 0 (20-oct-2026): construida, falta configuración de Francisco

- Proyecto Next.js 16.3.5 (mismas versiones que finanzas), Tailwind 4 con los tokens del tema oscuro, fuentes
  Saira Condensed + Archivo, login con Supabase (correo y clave), protección de todas las rutas (`proxy.ts`),
  manifiesto PWA e íconos FXB, pruebas con Vitest (`lib/perfil/edad.ts`, 4 pruebas).
- Inicio provisional (`app/page.tsx`) con 3 verificaciones: publicada, sesión, Supabase.
- Pendiente de Francisco: crear proyecto Supabase nuevo (región East US), desactivar registro público, crear su usuario,
  importar el repo en Vercel con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable key).
- Instructivo etapa 0: `docs/instructivo-etapa0.html`, https://claude.ai/artifact/3LnrSxQfuijvhVB1TrBhd1
- PR fxburneo/App-Deporte-y-Alimentacion#1 fusionado a main (20-oct).

## Conector Supabase (20-oct-2026)

- Francisco aprobó conectar el conector oficial de Supabase en claude.ai para que Claude cree el proyecto y, en cada etapa,
  las tablas y cambios (sin scripts SQL manuales). Aceptó que el conector también ve el proyecto de finanzas:
  **regla: solo se trabaja sobre el proyecto "FXB Performance"; el de finanzas no se lee ni se modifica.**
- Al crear el proyecto: nombre "FXB Performance", región East US (us-east-1), plan Free. Entregar a Francisco el Project URL y la
  publishable key para Vercel.
- Francisco hace él mismo: desactivar "Allow new users to sign up", crear su usuario (Auto Confirm) y el import en Vercel
  (el conector de Vercel es solo de lectura). Instructivo vigente: partes 2 y 3 de `docs/instructivo-etapa0.html`.

## Etapa 0 CERRADA (20-oct-2026)

- Supabase: proyecto "FXB Performance", ref `vufjxebehmfgtafwnwac`, us-east-1, URL https://vufjxebehmfgtafwnwac.supabase.co.
  Registro público desactivado. Usuario único: xavierburneo@hotmail.com (confirmado).
- Vercel: https://app-deporte-y-alimentacion.vercel.app (publica desde `main`). Variables: NEXT_PUBLIC_SUPABASE_URL y
  NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable key).
- Francisco ingresó desde el iPhone: las 3 verificaciones en OK.
- Pendiente para la etapa 1: en Supabase, Authentication > URL Configuration, poner Site URL = la dirección de Vercel
  (hoy es localhost:3000; afecta los correos de recuperación de clave).

## Etapa 1 (21-oct-2026): construida, falta prueba de Francisco en la vista previa

- Tablas `perfil`, `pesos`, `entrenos` con RLS (script `supabase/migrations/20261020_etapa1_perfil.sql`, aplicado con el
  conector). Prueba de RLS hecha con transacción y rollback: el otro usuario ve 0 filas; pesaje del mismo día se reemplaza.
- Motor `lib/nutricion/motor.ts` (Mifflin/Katch, MET, tipo de día, rangos de carbo por día, proteína 2 g/kg, grasa
  0,6–1,0 g/kg que completa calorías, extra de cena 0,5 g/kg si mañana es duro, snack previo, lo hecho reemplaza al plan,
  modo pausa sin déficit). Tendencia de peso `lib/nutricion/peso.ts` (regresión 28 días, ≥4 pesajes en ≥10 días).
  Fechas en hora de Ecuador `lib/fecha.ts` (Vercel corre en UTC).
- Pantallas: `/bienvenida` (1.1 + 1.2, también edita el perfil), `/` Hoy (2.1 sin recuperación ni consumo: llegan en
  etapas 2 y 3; muestra objetivo por comida), `/entreno/nuevo` (2.2 con vista previa en vivo), `/peso` (4.2), `/mas` (4.1
  con modo pausa). `/comidas`, `/registrar`, `/entreno` dicen en qué etapa llegan.
- 56 pruebas (incluye prueba de pantalla del formulario de entreno con jsdom).
- Pendiente de Francisco: Supabase › Authentication › URL Configuration › Site URL = https://app-deporte-y-alimentacion.vercel.app

## Etapa 1 CERRADA (21-oct-2026)

- Francisco probó la vista previa y aprobó. PR fxburneo/App-Deporte-y-Alimentacion#2 fusionado a main.

## Pedidos de Francisco para el menú (etapa 5, 21-oct-2026)

- **Cantidades siempre explícitas:** cada alimento del menú con su peso en gramos y su medida casera. Aclarar si el
  peso es en crudo o cocido (los cereales y carnes cambian mucho: 75 g de arroz crudo ≈ 1 taza cocida).
- **Armar los menús juntos:** además de la propuesta automática, una conversación dentro de la app donde Francisco
  propone platos y Claude ajusta cantidades a su objetivo del día y valida macros. La maqueta 2.5 debe rehacerse con
  esto antes de programar la etapa 5.

## Etapa 2 (21-oct-2026): instructivo entregado

- Instructivo Intervals.icu: `docs/instructivo-etapa2-intervals.html`, https://claude.ai/artifact/HTLKctEp57RNJde5ACY85D
- Riesgo Garmin sin cambios al 21-oct (conversaciones abiertas, sin fecha de bloqueo). Se sigue con Intervals.
- La API key de Intervals NO va por el chat: se carga como secreto de Supabase (Edge Function secret) que Francisco pega en el dashboard. El Athlete ID sí puede ir por chat.
- Sincronización: función en Supabase programada (pg_cron), no en Vercel.

## Cambio de fuente de Garmin (25-oct-2026)

- Garmin abrió el 21-oct-2026 la **Garmin Connect Personal API** (gratis, sin aprobación). Francisco eligió usarla como
  fuente principal; Intervals.icu queda como respaldo opcional.
- Llave: se crea en https://connect.garmin.com/app/settings/personalApiToken (vence a 30/90/180/365 días; elegir 1 año;
  avisar 1 mes antes). Se canjea por un token de 24 h: `POST https://personal.connectapi.garmin.com/personalapitoken-service/personal-api/personal-api-key/token`
  con cabecera `Authorization: ApiKey <llave>`; la respuesta es el JWT en texto plano. Sin refresh token: se pide uno nuevo.
- Endpoints (cliente oficial github.com/garmin/connect-personal-api-python, todos GET con `Authorization: Bearer`):
  sueño `/sleep-service/sleep/dailySleepSummariesByDate?startDate&endDate` y `/sleep-service/sleep/dailySleep?date`;
  HRV `/hrv-service/hrv/daily/{ini}/{fin}`; Body Battery `/wellness-service/wellness/bodyBattery/reports/daily?startDate&endDate`;
  estrés `/usersummary-service/stats/stress/daily/{ini}/{fin}`; resumen diario `/usersummary-service/v2/dailysummaries?startDate&endDate`;
  pulso `/wellness-service/wellness/dailyHeartRate?date`; peso `/weight-service/weight/range/{ini}/{fin}?includeAll=true`;
  actividades `/activitylist-service/activities/search/activities?start&limit&startDate&endDate`; detalle `/activity-service/activity/{id}`;
  FIT `/download-service/files/activity/{id}`. Solo lectura (no envía entrenos al reloj).
- La llave va como secreto de Supabase `GARMIN_PERSONAL_API_KEY` (Edge Function secret), nunca por chat.
- La red del entorno de Claude bloquea los dominios de Garmin: las pruebas reales se hacen desde una Edge Function de Supabase.
- Instructivo actualizado: `docs/instructivo-etapa2-garmin.html` (misma URL https://claude.ai/artifact/HTLKctEp57RNJde5ACY85D).

## Etapa 2 (26/27-oct-2026): construida, falta prueba de Francisco

- Llave personal de Garmin creada (vence 2027-10-26) y guardada como secreto de Supabase `GARMIN_PERSONAL_API_KEY`.
  El formulario automático del conector (create_edge_function_secret) no le llegó a Francisco: lo hizo a mano en
  Edge Functions › Secrets. Las migraciones "destructivas" (drop/update) piden confirmación que tampoco le llega:
  diseñar migraciones solo aditivas.
- Script `supabase/migrations/20261026_etapa2_garmin.sql` + restricción `entrenos_user_garmin_unico (user_id, garmin_id)`.
  Tablas: `bienestar_diario`, `sincronizaciones`, `app_config` (token interno de las tareas programadas, sin acceso
  desde la app), columnas Garmin en `entrenos`, `perfil.garmin_llave_vence`.
- Edge Function `garmin-sync` (código en `supabase/functions/garmin-sync/`, verify_jwt=false con autenticación propia:
  `x-sync-token` de app_config o JWT del usuario). Lógica pura en `mapeo.ts` con pruebas en `lib/garmin/mapeo.test.ts`.
  Tareas pg_cron: 06:35, 07:30, 12:00 y 20:00 Ecuador (`lanzar_sync_garmin(3)`). Carga inicial de 60 días OK:
  60 días de bienestar y 20 entrenos.
- Semáforo `lib/recuperacion.ts`: sueño 40 %, HRV contra su rango normal 40 % (−8 por ms bajo el rango), pulso en
  reposo contra los 7 días previos 20 %. Verde ≥70, ámbar 50–69, rojo <50.
- Pantallas: Hoy con anillo de recuperación, aviso si pasan 48 h sin datos y botón Actualizar; entrenos de Garmin
  con su nombre (no se pueden borrar); Más › Conexiones con última sincronización y vencimiento de la llave.
- 77 pruebas. La red de Claude bloquea los dominios de Garmin; Supabase sí llega.

## Revisión de datos con Francisco (27-oct-2026)

- Hueco 13-sep a 9-oct: estuvo LESIONADO. En el análisis de coach (etapa 6) tratarlo como lesión y vuelta
  progresiva, no como falta de constancia.
- Las 10,2 h de sueño del domingo 26-oct son reales.
- Rodillo con potenciómetro: la intensidad se mide por POTENCIA, no por pulso (en intervalos cortos el pulso no sube).
  Regla `intensidadPorPotencia` en `mapeo.ts`: IF ≥0,85 o ≥20 % en zonas de potencia 5-7 = fuerte; IF ≥0,75 o
  ≥60 s en zonas 6-7 (sprints) = moderado; si no, suave. Sin potencia se usa el pulso como antes.
  Columnas nuevas en `entrenos` (migración aditiva `20261027_etapa2_potencia.sql`): potencia_norm,
  factor_intensidad, tss, zonas_potencia_seg. Resultado: "Sprint" 23-oct pasó de suave a moderado; el resto sigue suave.
- FTP en Garmin = 221 W. Las zonas de potencia de Garmin parecen mal configuradas (un "Aeróbico Z2" con IF 0,73
  marca 1759 s en zona 4; rodajes con IF 0,64 caen en zona 3). Por eso la regla usa el IF y solo las zonas 5-7.
  Pedido a Francisco: revisar las zonas de potencia en Garmin Connect.
- Función temporal `garmin-prueba` neutralizada (responde 410); borrarla desde el panel cuando se pueda.
