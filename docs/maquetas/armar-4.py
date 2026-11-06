# Genera las maquetas de la etapa 4 (carreras): Mis carreras, nueva carrera,
# camino a la carrera, plan del día de carrera y Hoy en día de carga.
# Reutiliza los ayudantes de armar-31.py (solo la parte de funciones).
src31 = open("armar-31.py", encoding="utf-8").read().split("# ---------- 3.1.1")[0]
exec(src31)

def stepper(txt):
    b = f"width: 34px; height: 34px; border-radius: 50%; border: 1px solid {C['borde']}; background: {C['sup']}; color: {C['texto']}; font-size: 18px; display: flex; align-items: center; justify-content: center"
    return f'<div style="display: flex; align-items: center; gap: 8px"><span style="{b}">−</span><span style="{D}; font-size: 18px; font-weight: 600; min-width: 44px; text-align: center">{txt}</span><span style="{b}">+</span></div>'

def pill(t, color):
    return f'<span style="font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: {color}; border: 1px solid {color}; border-radius: 99px; padding: 1px 8px; white-space: nowrap">{t}</span>'

def campo(etq, valor, sub=""):
    s = f'<span style="font-size: 12px; color: {C["tenue"]}">{sub}</span>' if sub else ""
    return f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 600; color: {C["suave"]}">{etq}</span><div style="border: 1px solid {C["borde"]}; border-radius: 10px; background: {C["sup"]}; padding: 11px 12px; font-weight: 600">{valor}</div>{s}</div>'

def grande(valor, unidad, sub):
    return f'<div style="display: flex; flex-direction: column; gap: 2px"><div style="display: flex; align-items: baseline; gap: 6px"><span style="{D}; font-size: 48px; font-weight: 700; line-height: 1">{valor}</span><span style="{D}; font-size: 20px; color: {C["tenue"]}">{unidad}</span></div><span style="font-size: 13px; color: {C["tenue"]}">{sub}</span></div>'

def fase(fecha, titulo, texto, color, ultimo=False, actual=False):
    punto = f'<span style="width: 12px; height: 12px; border-radius: 50%; background: {color if actual else C["fondo"]}; border: 2px solid {color}; flex: none; margin-top: 4px"></span>'
    linea = "" if ultimo else f'<span style="position: absolute; left: 5px; top: 18px; bottom: -4px; width: 2px; background: {C["linea"]}"></span>'
    hoy = f' {pill("AHORA", color)}' if actual else ""
    return f'''<div style="position: relative; display: flex; gap: 12px; padding-bottom: 16px">{linea}{punto}<div style="display: flex; flex-direction: column; gap: 3px; min-width: 0">
<span style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: {color}">{fecha}</span>
<strong>{titulo}{hoy}</strong><span style="font-size: 13px; color: {C["suave"]}">{texto}</span></div></div>'''

def hora(h, que, carbo, ultimo=False):
    b = "" if ultimo else f" border-bottom: 1px solid {C['linea']};"
    return f'<div style="display: grid; grid-template-columns: 46px 1fr 56px; gap: 8px; align-items: center; padding: 9px 0;{b}"><span style="{D}; font-size: 17px; font-weight: 600; color: {C["tenue"]}">{h}</span><span style="font-size: 13px">{que}</span><span style="text-align: right; {D}; font-size: 17px; font-weight: 600; color: {C["carbo"]}">{carbo} g</span></div>'

# ---------- 4.1 Mis carreras ----------
carreras = "\n".join([
 header("‹ Más", "MIS CARRERAS", "+ Agregar", "Mas.dc.html"),
 caja("\n".join([
   f'<div style="display: flex; justify-content: space-between; align-items: center">{pill("OBJETIVO A", C["marca"])}<span style="font-size: 12px; color: {C["tenue"]}">evento en TrainingPeaks</span></div>',
   f'<span style="{D}; font-size: 30px; font-weight: 700; line-height: 1.05">Petzl 50K</span>',
   f'<span style="color: {C["suave"]}">Sábado 3 de abril de 2027 · Trail 50 km · 8 a 10 h</span>',
   grande("21", "semanas", "faltan 148 días"),
   boton("VER EL CAMINO A LA CARRERA", "CaminoCarrera.dc.html"),
 ])),
 aviso("TRAININGPEAKS", '<span>El calendario solo comparte 2 semanas hacia adelante. Si la carrera aparece ahí, se une a esta y no se duplica.</span>', C['prot']),
 '<section style="display: flex; flex-direction: column">',
 etiqueta("PASADAS"),
 fila("Sin carreras registradas", "Aquí quedan con lo que comiste y cómo te fue", "", ultimo=True),
 '</section>',
])

# ---------- 4.2 Nueva carrera ----------
nueva = "\n".join([
 header("Cancelar", "NUEVA CARRERA", "", "Carreras.dc.html"),
 campo("Nombre", "Petzl 50K"),
 campo("Fecha", "Sábado 3 abr 2027"),
 f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 600; color: {C["suave"]}">Deporte</span>{seg(["Trail", "Ciclismo", "Aventura"], "Trail")}</div>',
 campo("Distancia", "50 km", "Agrega el desnivel si lo sabes: ayuda a estimar el gasto."),
 f'<div style="display: flex; flex-direction: column; gap: 8px"><span style="font-size: 12px; font-weight: 600; color: {C["suave"]}">¿Cuántas horas estimas?</span><div style="display: flex; justify-content: space-between; align-items: center"><span style="color: {C["tenue"]}">Entre</span>{stepper("8 h")}<span style="color: {C["tenue"]}">y</span>{stepper("10 h")}</div><span style="font-size: 12px; color: {C["tenue"]}">La duración decide la carga: 3–5 h, 5–12 h o 24–48 h. Se usa el punto medio (9 h).</span></div>',
 f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 600; color: {C["suave"]}">Prioridad</span>{seg(["A · objetivo", "B · preparación"], "A · objetivo")}</div>',
 aviso("QUÉ CAMBIA CON UNA CARRERA A", '<span>Test de sudoración antes de los fondos largos, sin déficit las últimas 3 semanas y carga de carbohidratos los 2 días previos.</span>', C['carbo']),
 boton("GUARDAR CARRERA", "Carreras.dc.html"),
])

# ---------- 4.3 Camino a la carrera ----------
camino = "\n".join([
 header("‹ Carreras", "CAMINO A PETZL", "", "Carreras.dc.html"),
 f'<span style="color: {C["suave"]}">Trail 50 km · 8 a 10 h · 21 semanas</span>',
 '<section style="display: flex; flex-direction: column">',
 fase("HOY → 12 MAR", "Bajar de peso", "Déficit de 600 kcal como hasta ahora. Meta: llegar a 72–73 kg antes del 13 de marzo.", C['bien'], actual=True),
 fase("DICIEMBRE · 2 FONDOS", "Test de sudoración", "Te pesas antes y después de un fondo de más de 1 h, sin ropa mojada, y anotas lo que tomaste. La app calcula cuánto líquido pierdes por hora. Se repite con calor.", C['prot']),
 fase("DESDE FEBRERO", "Ensayo en los fondos largos", "Comes como en carrera (70 g/h, como el año pasado) con lo que vas a llevar y la bebida según tu sudoración.", C['prot']),
 fase("13 MAR → 31 MAR · 3 SEMANAS", "Sin déficit", "Comes lo que gastas. Bajar peso en la recta final quita reservas y fuerza.", C['carbo']),
 fase("JUE 1 Y VIE 2 ABR", "Carga de carbohidratos", "8–10 g/kg al día: unos 600–730 g. Poca fibra y poca grasa. Cena del viernes temprano.", C['marca']),
 fase("SÁB 3 ABR", "Día de carrera", "Desayuno 3–4 h antes con 75–150 g de carbohidrato. En carrera 70 g/h, líquido y sodio según tu test.", C['marca'], ultimo=True),
 '</section>',
 boton("PLAN DEL DÍA DE CARRERA", "DiaCarrera.dc.html", sec=True),
 nota("Las fechas se mueven solas si cambias la carrera. Petzl 50K está en TrainingPeaks: si tu coach la mueve, se actualiza."),
])

# ---------- 4.4 Plan del día de carrera ----------
dia = "\n".join([
 header("‹ Camino", "DÍA DE CARRERA", "", "CaminoCarrera.dc.html"),
 caja("\n".join([
   etiqueta("TOTAL PARA 9 HORAS"),
   f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">'
   f'<div style="display: flex; flex-direction: column"><span style="{D}; font-size: 26px; font-weight: 700; color: {C["carbo"]}">630 g</span><span style="font-size: 12px; color: {C["tenue"]}">carbohidrato · 70 g/h</span></div>'
   f'<div style="display: flex; flex-direction: column"><span style="{D}; font-size: 26px; font-weight: 700; color: {C["prot"]}">5,4 L</span><span style="font-size: 12px; color: {C["tenue"]}">líquido · 600 ml/h</span></div>'
   f'<div style="display: flex; flex-direction: column"><span style="{D}; font-size: 26px; font-weight: 700">6,3 g</span><span style="font-size: 12px; color: {C["tenue"]}">sodio · 700 mg/h</span></div></div>',
 ])),
 '<section style="display: flex; flex-direction: column">',
 etiqueta("ANTES", "05:00 si la largada es 08:00"),
 hora("−3 h", "Desayuno: 3 panes de agua con mermelada y miel, banano, café", "120"),
 hora("−30′", "1 gel con agua", "25", ultimo=True),
 '</section>',
 '<section style="display: flex; flex-direction: column">',
 etiqueta("EN CARRERA", "se repite cada hora"),
 hora("H1–2", "Bebida isotónica 500 ml + 1 gel + ½ barra", "70"),
 hora("H3–6", "Sólidos: papa con sal o sánduche de mermelada + bebida + gel", "70"),
 hora("H7–9", "Lo que tolere mejor: gel, bebida, gomitas. Cafeína en la h7", "70", ultimo=True),
 '</section>',
 aviso("PROVISIONAMIENTOS", '<span>Cuando sepas dónde están los puestos de la carrera, los cargas y el plan se arma por tramos.</span>', C['prot']),
 nota("Líquido y sodio son estimados hasta el test de sudoración. El carbohidrato parte de tus 70 g/h del año pasado."),
])

# ---------- 4.5 Hoy en día de carga ----------
hoycarga = "\n".join([
 f'<header style="display: flex; justify-content: space-between; align-items: center"><span style="{D}; font-size: 24px; font-weight: 700; letter-spacing: 0.04em">HOY</span><span style="color: {C["tenue"]}">Viernes 2 abr</span></header>',
 aviso("CARGA DE CARBOHIDRATOS · DÍA 2 DE 2 · PETZL MAÑANA", '<span>Hoy comes más carbohidrato y menos fibra y grasa. Cena temprano. Sin déficit. Es normal subir 1–2 kg por agua: no es grasa.</span>', C['marca']),
 '<section style="display: flex; flex-direction: column; gap: 10px">',
 etiqueta("ENERGÍA DEL DÍA", "CARGA"),
 f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="{D}; font-size: 52px; font-weight: 700; line-height: 1">3.570</span><span style="{D}; font-size: 22px; color: {C["tenue"]}">kcal</span></div>',
 f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px"><div><span style="{D}; font-size: 24px; font-weight: 700; color: {C["carbo"]}">660 g</span><br><span style="font-size: 12px; color: {C["tenue"]}">Carbohidratos · 9 g/kg</span></div><div><span style="{D}; font-size: 24px; font-weight: 700; color: {C["prot"]}">120 g</span><br><span style="font-size: 12px; color: {C["tenue"]}">Proteína</span></div><div><span style="{D}; font-size: 24px; font-weight: 700; color: {C["grasa"]}">50 g</span><br><span style="font-size: 12px; color: {C["tenue"]}">Grasa</span></div></div>',
 '</section>',
 '<section style="display: flex; flex-direction: column">',
 etiqueta("COMIDAS"),
 fila("Desayuno 06:45", "Sugerido: 4 panes de agua, mermelada, jugo, yogur", kcal("640", "120 C")),
 fila("Media mañana 10:00", "Sugerido: banano, galletas de arroz, bebida", kcal("470", "100 C")),
 fila("Almuerzo 13:00", "Sugerido: arroz blanco 2 tazas, pollo, papa", kcal("900", "160 C")),
 fila("Media tarde 16:00", "Sugerido: pan con miel, jugo", kcal("600", "120 C")),
 fila("Cena 18:30", "Sugerido: fideos con salsa de tomate, pollo", kcal("960", "160 C"), ultimo=True),
 '</section>',
 nota("Evita: ensaladas grandes, granos integrales, fritos y comida nueva."),
])

import json
paginas = [
 ("Carreras", "Mis carreras", 900, carreras, True),
 ("NuevaCarrera", "Nueva carrera", 980, nueva, False),
 ("CaminoCarrera", "Camino a la carrera", 1060, camino, True),
 ("DiaCarrera", "Día de carrera", 1100, dia, True),
 ("HoyCarga", "Hoy en día de carga", 1000, hoycarga, True),
]
ON = "font-weight: 700; text-decoration: none; color: #FF6A1A"
OFF = "font-weight: 500; text-decoration: none; color: #8C969F"
PRE = 'style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; '
for k, t, h, cuerpo, n in paginas:
    html = pagina(t, h, cuerpo, n)
    activa = "Main" if k == "HoyCarga" else "Mas"
    for dest in ["Main", "Comidas", "Entreno", "Mas"]:
        a = f'<a href="{dest}.dc.html" {PRE}'
        html = html.replace(a + ON, a + OFF)
        if dest == activa:
            html = html.replace(a + OFF, a + ON)
    open(f"{k}.dc.html", "w", encoding="utf-8").write(html)
print("ok")
