# Maquetas de la etapa 6 (v2, con datos reales de Garmin): Cómo vas e informe
# semanal. Reemplazan a Entreno/Informe de octubre (sin esfuerzo percibido:
# la app lee Garmin directo, no Intervals).
src31 = open("armar-31.py", encoding="utf-8").read().split("# ---------- 3.1.1")[0]
exec(src31)

def indicador(nombre, valor, sub, color):
    return f'<div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: {C["tenue"]}">{nombre}</span><span style="{D}; font-size: 30px; font-weight: 700; color: {color}; line-height: 1">{valor}</span><span style="font-size: 12px; color: {C["suave"]}">{sub}</span></div>'

# Serie real (domingos, 30-ago → 13-nov): base y cansancio.
base = [5, 14, 21, 18, 15, 13, 11, 13, 17, 24, 31, 31]
cans = [27, 60, 60, 21, 7, 2, 3, 19, 33, 56, 68, 47]
def grafico():
    w, h = 340, 110
    x = lambda i: 10 + i * (w - 20) / (len(base) - 1)
    y = lambda v: h - 10 - v * (h - 25) / 70
    pb = " ".join(f"{x(i):.0f},{y(v):.0f}" for i, v in enumerate(base))
    pc = " ".join(f"{x(i):.0f},{y(v):.0f}" for i, v in enumerate(cans))
    banda = f'<rect x="{x(2):.0f}" y="5" width="{x(5) - x(2):.0f}" height="{h - 15}" fill="#22282E" />'
    return f'''<svg viewBox="0 0 {w} {h}" width="100%" height="{h}" role="img" aria-label="Base y cansancio, últimas 12 semanas">{banda}
<text x="{(x(2) + x(5)) / 2:.0f}" y="18" fill="{C["tenue"]}" font-size="10" text-anchor="middle">lesión</text>
<polyline points="{pc}" fill="none" stroke="{C["marca"]}" stroke-width="2" stroke-dasharray="4 3" />
<polyline points="{pb}" fill="none" stroke="{C["prot"]}" stroke-width="3" /></svg>'''

def dia(d, plan, hecho, estado, ultimo=False):
    b = "" if ultimo else f" border-bottom: 1px solid {C['linea']};"
    col = {"ok": C["bien"], "falta": C["carbo"], "hoy": C["marca"], "luego": C["tenue"]}[estado]
    marca = {"ok": "✓", "falta": "—", "hoy": "HOY", "luego": ""}[estado]
    return f'<div style="display: grid; grid-template-columns: 38px 1fr auto; gap: 8px; padding: 8px 0;{b} font-size: 13px"><strong style="color: {C["tenue"]}">{d}</strong><span>{plan}<span style="color: {C["tenue"]}">{(" → " + hecho) if hecho else ""}</span></span><span style="font-weight: 700; color: {col}">{marca}</span></div>'

def barra_int(s, m, f):
    return f'''<div style="display: flex; height: 14px; border-radius: 7px; overflow: hidden"><span style="width: {s}%; background: {C["prot"]}"></span><span style="width: {m}%; background: {C["carbo"]}"></span><span style="width: {f}%; background: {C["marca"]}"></span></div>
<div style="display: flex; justify-content: space-between; font-size: 12px"><span style="color: {C["prot"]}">Suave {s} %</span><span style="color: {C["carbo"]}">Media {m} %</span><span style="color: {C["marca"]}">Fuerte {f} %</span></div>'''

entreno = "\n".join([
 f'<header style="display: flex; justify-content: space-between; align-items: flex-end"><div style="display: flex; flex-direction: column"><span style="font-size: 13px; color: {C["tenue"]}">Semana 9 – 15 nov</span><h1 style="margin: 0; {D}; font-size: 28px; font-weight: 700; letter-spacing: 0.04em">CÓMO VAS</h1></div><a href="Informe2.dc.html" style="font-weight: 700; padding-bottom: 4px">Informe semanal ›</a></header>',
 f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">{indicador("BASE FÍSICA", "31", "ya pasaste la de antes de la lesión (21)", C["prot"])}{indicador("CANSANCIO", "47", "alto para tu base", C["marca"])}{indicador("FRESCURA", "−16", "cansado, normal en semana de carga", C["carbo"])}</div>',
 caja("\n".join([etiqueta("ÚLTIMAS 12 SEMANAS", "— base  ‐‐ cansancio"), grafico(), f'<span style="font-size: 13px; color: {C["suave"]}">Volviste de la lesión hace 5 semanas y la base subió de 11 a 31. Para Petzl tu coach proyecta 83 en abril: vas al ritmo.</span>'])),
 '<section style="display: flex; flex-direction: column">', etiqueta("ESTA SEMANA · PLAN DEL COACH → LO HECHO"),
 dia("LUN", "Movilidad 40 min", "42 min", "ok"),
 dia("MAR", "Run aeróbico 1:00", "1:05", "ok"),
 dia("MIÉ", "—", "fuerza 45 min", "ok"),
 dia("JUE", "Trail cuestas tempo 1:20", "1:28", "ok"),
 dia("VIE", "Run aeróbico 1:00", "", "falta"),
 dia("SÁB", "Bici fondo medio 3:00", "", "hoy"),
 dia("DOM", "Run aeróbico 1:42", "", "luego", ultimo=True), '</section>',
 '<section style="display: flex; flex-direction: column; gap: 8px">', etiqueta("¿SUAVE LO SUAVE Y FUERTE LO FUERTE?", "últimas 4 semanas"),
 barra_int(51, 42, 7),
 f'<span style="font-size: 13px; color: {C["suave"]}">La zona media está alta: lo ideal en trail es cerca de 80 % suave. Tus trotes "aeróbicos" se van a zona 3 (el domingo 8, 60 de 87 min). Revisa con tu coach: caminar las cuestas, y que las zonas de pulso de Garmin sean las de TrainingPeaks.</span>',
 '</section>',
 '<section style="display: flex; flex-direction: column; gap: 6px">', etiqueta("SUEÑO Y RECUPERACIÓN", "4 semanas"),
 f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">{indicador("SUEÑO", "7:35", "promedio por noche", C["texto"])}{indicador("HRV SEMANAL", "50", "rango 49–67: en el borde bajo", C["carbo"])}</div>',
 f'<span style="font-size: 13px; color: {C["suave"]}">Las 3 noches con menos de 7 h fueron antes de los días de HRV más bajo.</span>',
 '</section>',
])

def lista(items):
    return "".join(f'<div style="display: flex; gap: 10px; padding: 6px 0"><span style="color: {C["tenue"]}">•</span><span style="font-size: 14px">{t}</span></div>' for t in items)

def tema(n, t):
    return f'<div style="display: flex; gap: 12px; padding: 8px 0; border-top: 1px solid {C["linea"]}"><span style="{D}; font-size: 22px; font-weight: 700; color: {C["marca"]}">{n}</span><span style="font-size: 14px">{t}</span></div>'

informe = "\n".join([
 header("‹ Entreno", "INFORME · 9–15 NOV", "", "Entreno2.dc.html"),
 f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">{indicador("ENTRENOS", "5/6", "uno sin hacer (viernes)", C["texto"])}{indicador("COMIDAS EN OBJETIVO", "4/7", "días entre 80 y 110 %", C["carbo"])}{indicador("SUEÑO PROMEDIO", "7:35", "por noche", C["texto"])}{indicador("PESO", "75,5", "−0,5 kg en 3 semanas", C["bien"])}</div>',
 '<section style="display: flex; flex-direction: column">', etiqueta("LO QUE MEJORÓ"),
 lista(["Tu base física ya pasó la de antes de la lesión: de 21 a 31 en 5 semanas.", "En el fondo largo comiste durante el entreno: 60 g de carbohidrato, el doble que antes."]), '</section>',
 '<section style="display: flex; flex-direction: column">', etiqueta("LO QUE FALTA"),
 lista(["Proteína corta 4 de 7 días (entre 112 y 135 g de 174). La media mañana y la cena son las más bajas.", "Los trotes suaves se van a zona media: 42 % del tiempo en las últimas 4 semanas.", "El HRV semanal está en el borde bajo de tu rango tras la semana más cargada."]), '</section>',
 '<section style="display: flex; flex-direction: column">', etiqueta("PARA HABLAR CON TU COACH"),
 tema(1, "Mis trotes aeróbicos se van 40 % a zona 3. ¿Camino las cuestas o revisamos mis zonas de pulso?"),
 tema(2, "Base 31 hoy y proyección de 83 para Petzl en abril. ¿Cómo ves la progresión después de la lesión?"),
 tema(3, "Esta semana el HRV bajó al borde de mi rango. ¿Ajustamos la carga de la próxima?"), '</section>',
 boton("COMPARTIR CON EL COACH", "Entreno2.dc.html"),
 nota("El texto lo arma Claude con tus datos de la semana; lo revisas y lo mandas por WhatsApp o correo."),
])

for k, t, h, cuerpo, act in [("Entreno2", "Cómo vas", 1250, entreno, "Entreno"), ("Informe2", "Informe semanal", 1150, informe, "Entreno")]:
    html = pagina(t, h, cuerpo, True)
    ON = "font-weight: 700; text-decoration: none; color: #FF6A1A"; OFF = "font-weight: 500; text-decoration: none; color: #8C969F"
    PRE = 'style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; '
    for dest in ["Main", "Comidas", "Entreno", "Mas"]:
        a = f'<a href="{dest}.dc.html" {PRE}'
        html = html.replace(a + ON, a + OFF)
        if dest == act: html = html.replace(a + OFF, a + ON)
    open(f"{k}.dc.html", "w", encoding="utf-8").write(html)
print("ok")
