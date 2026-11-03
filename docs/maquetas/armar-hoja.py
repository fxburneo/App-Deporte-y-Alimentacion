# Arma docs/maquetas/pantallas.html (hoja de presentación con iPhones) a partir de los .dc.html del lienzo.
# Uso: python3 docs/maquetas/armar-hoja.py docs/maquetas docs/maquetas/pantallas.html
import re, sys, html
src, out = sys.argv[1], sys.argv[2]
secciones = [
 ("1 · Primer uso", "Lo que ves la primera vez que entras. Se completa una sola vez y se puede cambiar después en Más.", [
   ("Bienvenida1","1.1 · Tus datos","Datos para calcular tu gasto, peso objetivo y ritmo. Abajo ves el resultado al instante.",True),
   ("Bienvenida2","1.2 · Comidas y horarios","Alimentos excluidos, horas de comida y de entreno, y días de pesaje.",True)]),
 ("2 · Día a día", "Lo que usas todos los días: el plan del día, registrar lo que comes y el menú de la semana.", [
   ("Main","2.1 · Hoy","Recuperación, entreno, energía del día y comidas. El recuadro naranja aparece cuando el plan se ajusta.",False),
   ("EntrenoManual","2.2 · Cargar entreno","Plan o real, a mano, mientras no llega la conexión con Garmin. Muestra cómo queda el día antes de guardar.",True),
   ("Registrar","2.3 · Registrar comida","Foto, texto o repetir una comida. La IA desglosa en gramos y medida casera, pregunta lo que no ve y ajusta el resto del día.",True),
   ("Comidas","2.4 · Comidas del día","Objetivo contra lo real, dónde ajustar y la semana.",False),
   ("Menu","2.5 · Menú semanal","Menú rotativo con la porción de carbohidrato según el día, cocina del domingo y cambios validados.",False)]),
 ("2b · Mi despensa y calculadora (etapa 3.1)", "Tus alimentos con marca y tus platos habituales: registrar sin IA, calcular cuánto servirte y recibir el ajuste en gramos de comida.", [
   ("Despensa","2b.1 · Mi despensa","Alimentos con marca (leídos de la etiqueta) y genéricos, más tus platos habituales.",True),
   ("Etiqueta","2b.2 · Leer etiqueta","La IA lee la tabla nutricional una sola vez; revisas y guardas. Registro por unidad o por gramos.",True),
   ("MisComidas","2b.3 · Registrar · Mis comidas","Reemplaza a Repetir: buscas en tu despensa, eliges cantidad y guardas sin usar IA.",True),
   ("Calculadora","2b.4 · ¿Cuánto me sirvo?","Eliges qué hay en el plato y te dice los gramos de cada alimento para cumplir el objetivo de la comida.",True),
   ("AjusteAlimentos","2b.5 · Ajuste en alimentos","Si te pasaste o te faltó, la siguiente comida se ajusta en gramos de tu menú tipo: pollo, arroz, aguacate.",True)]),
 ("3 · Entreno", "El análisis de entrenador en lenguaje simple y la comida de las salidas largas.", [
   ("Entreno","3.1 · Cómo vas","Base física, cansancio y frescura, la semana del coach y cuánto entrenas suave y fuerte.",False),
   ("SalidaLarga","3.2 · Salida larga","Carbohidrato y líquido por hora con tu test de sudoración, y validación de lo que llevas.",False),
   ("Informe","3.3 · Informe semanal","Lo que mejoró, lo que falta y 3 temas para hablar con tu coach.",False)]),
 ("4 · Perfil y ajustes", "Tus datos, avisos, conexiones y el seguimiento del peso.", [
   ("Mas","4.1 · Más","Perfil, modo pausa, test de sudoración, avisos y conexiones.",False),
   ("Peso","4.2 · Peso","Promedio de la semana, tendencia de 6 semanas y objetivo.",False)]),
]
def pantalla(nombre):
    t = open(f"{src}/{nombre}.dc.html", encoding="utf-8").read()
    t = t.split("<x-dc>",1)[1].split("</x-dc>",1)[0]
    t = re.sub(r"<helmet>.*?</helmet>", "", t, flags=re.S)
    # La raíz pasa de alto fijo a llenar la pantalla del iPhone, que se desplaza por dentro
    t = re.sub(r'width: 390px; height: \d+px; position: relative;', 'width: 100%; min-height: 100%; position: relative; display: flex; flex-direction: column;', t, count=1)
    t = t.replace("overflow: hidden\">", "\">", 1)
    t = re.sub(r"padding: (\d+)px 18px 110px", r"padding: \1px 18px 24px", t)
    t = t.replace("position: absolute; left: 0; right: 0; bottom: 0; height: 84px;", "position: sticky; bottom: 0; margin-top: auto; height: 84px; flex: none;")
    # Los enlaces entre pantallas llevan al iPhone correspondiente en esta misma hoja
    t = re.sub(r'href="([A-Za-z0-9]+)\.dc\.html"', r'href="#p-\1"', t)
    # Ids únicos por pantalla
    t = re.sub(r'\bid="([^"]+)"', rf'id="{nombre}-\1"', t)
    t = re.sub(r'\bfor="([^"]+)"', rf'for="{nombre}-\1"', t)
    return t.strip()
partes = []
for titulo, desc, pantallas in secciones:
    figs = []
    for nombre, cap, texto, nueva in pantallas:
        chip = '<em class="nueva">Nueva · por aprobar</em>' if nueva else ''
        figs.append(f'''<figure class="shot" id="p-{nombre}">
<div class="phone"><div class="screen"><div class="island"></div><div class="sbar"><span>6:40</span><i>4G</i></div><div class="scroll">{pantalla(nombre)}</div></div></div>
<figcaption>{chip}<b>{html.escape(cap)}</b><span>{html.escape(texto)}</span></figcaption>
</figure>''')
    partes.append(f'<section class="grupo"><header class="gh"><h2>{html.escape(titulo)}</h2><p>{html.escape(desc)}</p></header><div class="stage">{"".join(figs)}</div></section>')
pagina = open(f"{out}.plantilla", encoding="utf-8").read().replace("<!--PANTALLAS-->", "\n".join(partes))
open(out, "w", encoding="utf-8").write(pagina)
print("ok", len(pagina))
