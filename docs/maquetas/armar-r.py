# Maquetas del rediseño (v2 de la app): Hoy con anillos, "Ahora toca" y "Lo
# comí" en un toque; botón + como menú rápido; pestañas Hoy · Plan · + ·
# Entreno · Yo; letra mínima 13 px y más contraste.
C = {"fondo":"#0E1113","sup":"#171B1F","sup2":"#1E2328","linea":"#262C33","borde":"#323A42","texto":"#F2F4F5","suave":"#DCE1E5","tenue":"#A9B3BC","marca":"#FF6A1A","carbo":"#FFB020","prot":"#4C9DFF","grasa":"#B98CFF","bien":"#3DDC84","mal":"#FF5A5F"}
D = "font-family: 'Saira Condensed', sans-serif"

ICON = {
 "hoy": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 "plan": '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
 "entreno": '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
 "yo": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
}
def nav(activa):
    def item(k, n):
        col = C["marca"] if k == activa else "#8C969F"
        return f'<a href="R{k.capitalize()}.dc.html" style="display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;font-weight:{700 if k==activa else 500};color:{col};text-decoration:none;min-width:56px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICON[k]}</svg>{n}</a>'
    mas = f'<a href="RMas.dc.html" aria-label="Registrar" style="width:58px;height:58px;border-radius:50%;background:{C["marca"]};display:flex;align-items:center;justify-content:center;margin-top:-22px;box-shadow:0 6px 18px rgba(255,106,26,.35)"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="{C["fondo"]}" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></a>'
    return f'<nav style="position:absolute;left:0;right:0;bottom:0;height:84px;background:rgba(14,17,19,.96);border-top:1px solid {C["linea"]};display:flex;justify-content:space-around;align-items:flex-start;padding-top:10px">{item("hoy","Hoy")}{item("plan","Plan")}{mas}{item("entreno","Entreno")}{item("yo","Yo")}</nav>'

def pagina(titulo, alto, cuerpo, activa="hoy", extra=""):
    return f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>{titulo} · FXB Performance</title><script src="./support.js"></script></head>
<body><x-dc><helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&amp;family=Archivo:wght@400;500;600;700&amp;display=swap">
<style>body{{margin:0;background:#0E1113}} a{{color:#FF6A1A}}</style></helmet>
<div style="width: 390px; height: {alto}px; position: relative; box-sizing: border-box; background: {C['fondo']}; color: {C['texto']}; font-family: 'Archivo', system-ui, sans-serif; font-size: 15px; line-height: 1.45; overflow: hidden">
<div style="padding: 18px 18px 110px; display: flex; flex-direction: column; gap: 18px">
{cuerpo}
</div>
{extra}
{nav(activa)}
</div></x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":{alto}}}}}'>
class Component extends DCLogic {{ renderVals() {{ return {{}}; }} }}
</script></body></html>
'''

def franja(activo="16"):
    dias = [("Lun","9"),("Mar","10"),("Mié","11"),("Jue","12"),("Vie","13"),("Sáb","14"),("Dom","15"),("Hoy","16")]
    out = []
    for d, n in dias:
        a = n == activo
        st = f"background:{C['texto']};color:{C['fondo']}" if a else f"color:{C['tenue']}"
        out.append(f'<span style="flex:1;display:flex;flex-direction:column;align-items:center;padding:5px 0;border-radius:10px;{st}"><span style="font-size:11px;font-weight:700">{d}</span><span style="{D};font-size:17px;font-weight:700">{n}</span></span>')
    return f'<div style="display:flex;gap:2px">{"".join(out)}</div>'

def anillo(cx, r, pct, color, ancho=11):
    import math
    L = 2 * math.pi * r
    return f'<circle cx="{cx}" cy="{cx}" r="{r}" fill="none" stroke="{color}" stroke-opacity=".18" stroke-width="{ancho}"/><circle cx="{cx}" cy="{cx}" r="{r}" fill="none" stroke="{color}" stroke-width="{ancho}" stroke-linecap="round" stroke-dasharray="{L*pct:.1f} {L:.1f}" transform="rotate(-90 {cx} {cx})"/>'

def anillos(c, p, g, quedan, sub):
    s = 170
    return f'''<div style="display:flex;align-items:center;gap:16px">
<div style="position:relative;width:{s}px;height:{s}px;flex:none"><svg width="{s}" height="{s}" viewBox="0 0 {s} {s}">{anillo(85,78,c,C["carbo"])}{anillo(85,63,p,C["prot"])}{anillo(85,48,g,C["grasa"])}</svg>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="{D};font-size:30px;font-weight:700;line-height:1">{quedan}</span><span style="font-size:12px;color:{C["tenue"]}">{sub}</span></div></div>
<div style="display:flex;flex-direction:column;gap:10px;flex:1">
{"".join(f'<div style="display:flex;flex-direction:column"><span style="font-size:13px;color:{C["tenue"]}"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:{col};margin-right:6px"></span>{n}</span><span style="{D};font-size:20px;font-weight:700">{v}</span></div>' for n,v,col in [("Carbohidrato","142 / 310 g",C["carbo"]),("Proteína","96 / 174 g",C["prot"]),("Grasa","31 / 60 g",C["grasa"])])}
</div></div>'''

def var(t): return f'<span style="color:{C["carbo"]};font-weight:700">{t}</span>'

def boton(t, sec=False, href="#"):
    if sec: return f'<a href="{href}" style="flex:1;text-align:center;padding:13px;border-radius:14px;border:1px solid {C["borde"]};color:{C["texto"]};font-weight:700;text-decoration:none">{t}</a>'
    return f'<a href="{href}" style="flex:1;text-align:center;padding:13px;border-radius:14px;background:{C["marca"]};color:{C["fondo"]};font-weight:800;text-decoration:none">{t}</a>'

def etiqueta(t, der=""):
    d = f'<span style="font-size:13px;color:{C["tenue"]}">{der}</span>' if der else ""
    return f'<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px;font-weight:700;letter-spacing:.1em;color:{C["tenue"]}">{t}</span>{d}</div>'

def linea_dia(hora, nombre, detalle, estado, kcal, ultimo=False):
    col = {"hecha": C["bien"], "ahora": C["marca"], "pend": C["borde"], "ajustada": C["carbo"]}[estado]
    punto = f'<span style="width:14px;height:14px;border-radius:50%;flex:none;margin-top:4px;{"background:"+col if estado=="hecha" else "border:2px solid "+col}"></span>'
    lin = "" if ultimo else f'<span style="position:absolute;left:6px;top:20px;bottom:-6px;width:2px;background:{C["linea"]}"></span>'
    chip = {"hecha": "✓", "ahora": "AHORA", "pend": "", "ajustada": "AJUSTADA"}[estado]
    chipc = f'<span style="font-size:11px;font-weight:800;color:{col};margin-left:6px">{chip}</span>' if chip and estado != "hecha" else ""
    return f'''<div style="position:relative;display:flex;gap:12px;padding-bottom:14px">{lin}{punto}
<div style="flex:1;display:flex;flex-direction:column;gap:1px"><div style="display:flex;justify-content:space-between"><strong style="font-size:15px">{nombre}{chipc}</strong><span style="{D};font-size:17px;font-weight:600;color:{C["bien"] if estado=="hecha" else C["suave"]}">{kcal}</span></div>
<span style="font-size:13px;color:{C["tenue"]}">{hora} · {detalle}</span></div></div>'''

# ---------- R1 · Hoy ----------
hoy = "\n".join([
 f'<header style="display:flex;justify-content:space-between;align-items:center"><span style="{D};font-size:16px;font-weight:800;letter-spacing:.1em;color:{C["marca"]}">FXB</span><span style="font-size:14px;color:{C["tenue"]}">Lunes 16 nov</span><a href="RInfo.dc.html" aria-label="Detalle del día" style="width:30px;height:30px;border-radius:50%;border:1px solid {C["borde"]};display:flex;align-items:center;justify-content:center;color:{C["tenue"]};font-weight:700;text-decoration:none">i</a></header>',
 franja(),
 f'<div style="display:flex;gap:8px"><div style="flex:1;background:{C["sup"]};border-radius:14px;padding:10px 12px;display:flex;align-items:center;gap:10px"><span style="{D};font-size:26px;font-weight:700;color:{C["bien"]}">82</span><span style="font-size:13px;line-height:1.25"><strong>Recuperado</strong><br><span style="color:{C["tenue"]}">7:40 h · HRV 55</span></span></div><div style="flex:1;background:{C["sup"]};border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;justify-content:center"><strong style="font-size:13px">Rodillo tempo 1:10</strong><span style="font-size:13px;color:{C["marca"]}">Día intenso · ✓ hecho</span></div></div>',
 anillos(.46, .55, .52, "1.240", "kcal te quedan"),
 f'<a href="RCumple.dc.html" style="display:flex;justify-content:center;gap:14px;font-size:14px;color:{C["suave"]};text-decoration:none;margin-top:-6px">Esta semana: <span>entreno <strong style="color:{C["bien"]}">86 %</strong></span><span>comida <strong style="color:{C["carbo"]}">71 %</strong></span></a>',
 f'''<section style="background:{C["sup"]};border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px;border:1px solid {C["marca"]}55">
<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px;font-weight:800;letter-spacing:.1em;color:{C["marca"]}">AHORA TOCA · 13:00</span><span style="{D};font-size:18px;font-weight:700">720 kcal</span></div>
<strong style="font-size:20px">Almuerzo</strong>
<span style="font-size:15px;line-height:1.5">Pollo 200 g · {var("1½ taza de arroz blanco")} · ensalada con 1 cdta de aceite</span>
<span style="font-size:13px;color:{C["tenue"]}">Día intenso: arroz blanco y un poco más de cantidad.</span>
<div style="display:flex;gap:10px">{boton("✓ Lo comí", href="RHecho.dc.html")}{boton("Comí otra cosa", sec=True, href="RMas.dc.html")}</div></section>''',
 etiqueta("TU DÍA", "3 de 6 registradas"),
 '<section style="display:flex;flex-direction:column">',
 linea_dia("05:00", "Antes de entrenar", "1 pan de agua con miel", "hecha", "126"),
 linea_dia("06:45", "Desayuno", "2 huevos, 2 panes, batido de papaya", "hecha", "612"),
 linea_dia("10:00", "Media mañana", "6 galletas integrales, 2 tajadas de queso", "hecha", "348"),
 linea_dia("13:00", "Almuerzo", "pollo, 1½ taza de arroz blanco, ensalada", "ahora", "720"),
 linea_dia("16:00", "Media tarde", "piña, almendras, banano", "pend", "310"),
 linea_dia("19:00", "Cena", "wrap de pollo con 2 tortillas", "ajustada", "590", ultimo=True),
 '</section>',
 f'<a href="#" style="font-size:14px;font-weight:700;color:{C["tenue"]};text-decoration:none">+ Algo fuera de horario</a>',
 f'<section style="border-left:3px solid {C["prot"]};padding:2px 0 2px 12px"><span style="font-size:13px;font-weight:700;letter-spacing:.1em;color:{C["prot"]}">MAÑANA</span><p style="margin:2px 0 0;font-size:14px;color:{C["suave"]}">Trail 1:20 a las 05:15 · día intenso. Toca para ver el menú.</p></section>',
])

# ---------- R1b · Después de "Lo comí" ----------
hecho_extra = f'<div style="position:absolute;left:18px;right:18px;bottom:100px;background:{C["sup2"]};border:1px solid {C["borde"]};border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,.5)"><span style="font-size:14px"><strong style="color:{C["bien"]}">✓ Almuerzo registrado</strong><br><span style="color:{C["tenue"]}">720 kcal · tu plato de siempre</span></span><a href="RHoy.dc.html" style="font-weight:800">Deshacer</a></div>'
hecho = "\n".join([
 f'<header style="display:flex;justify-content:space-between;align-items:center"><span style="{D};font-size:16px;font-weight:800;letter-spacing:.1em;color:{C["marca"]}">FXB</span><span style="font-size:14px;color:{C["tenue"]}">Lunes 16 nov</span><span style="width:30px"></span></header>',
 anillos(.69, .78, .69, "520", "kcal te quedan"),
 f'''<section style="background:{C["sup"]};border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px;font-weight:800;letter-spacing:.1em;color:{C["marca"]}">AHORA TOCA · 16:00</span><span style="{D};font-size:18px;font-weight:700">310 kcal</span></div>
<strong style="font-size:20px">Media tarde</strong>
<span style="font-size:15px">Piña 1 taza · 10 almendras · {var("1 banano")}</span>
<div style="display:flex;gap:10px">{boton("✓ Lo comí")}{boton("Comí otra cosa", sec=True)}</div></section>''',
 f'<p style="margin:0;font-size:14px;color:{C["tenue"]}">Un toque registra tu plato de siempre con las cantidades de hoy, sin IA. Si comiste distinto, "Comí otra cosa" abre foto, texto o tu despensa.</p>',
])

pesos = [76.0, 75.9, 75.7, 75.8, 75.5, 75.6, 75.4, 75.3]
def grafico_peso():
    w, h = 340, 120
    x = lambda i: 14 + i * (w - 28) / (len(pesos) - 1)
    y = lambda v: 14 + (76.4 - v) * (h - 28) / (76.4 - 72.6)
    pts = " ".join(f"{x(i):.0f},{y(v):.0f}" for i, v in enumerate(pesos))
    meta = f'<rect x="0" y="{y(73):.0f}" width="{w}" height="{y(72) - y(73):.0f}" fill="{C["bien"]}" fill-opacity=".12"/><text x="{w-6}" y="{y(72.5)+4:.0f}" text-anchor="end" font-size="11" fill="{C["bien"]}">objetivo 72–73</text>'
    return f'<svg viewBox="0 0 {w} {h}" width="100%" height="{h}">{meta}<polyline points="{pts}" fill="none" stroke="{C["texto"]}" stroke-width="3" stroke-linecap="round"/><circle cx="{x(len(pesos)-1):.0f}" cy="{y(pesos[-1]):.0f}" r="5" fill="{C["marca"]}"/></svg>'

# ---------- R1c · Hoja de detalle (i): visual ----------
def seg_barra(partes, total):
    out = []
    for n, v, col in partes:
        etiqueta_v = f"{v:,}".replace(",", ".") if v / total > .15 else ""
        out.append(f'<span style="width:{v/total*100:.1f}%;background:{col};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:{C["fondo"]}">{etiqueta_v}</span>')
    return f'<div style="display:flex;height:30px;border-radius:9px;overflow:hidden;gap:2px">{"".join(out)}</div>'
def leyenda(items):
    return '<div style="display:flex;flex-wrap:wrap;gap:6px 14px">' + "".join(f'<span style="font-size:13px;color:{C["suave"]}"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:{col};margin-right:6px"></span>{n} <strong>{v}</strong></span>' for n, v, col in items) + "</div>"
def macro(n, g, sub, col, pct):
    return (f'<div style="background:{C["sup"]};border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:6px;border-top:3px solid {col}">'
            f'<span style="font-size:12px;font-weight:800;letter-spacing:.08em;color:{col}">{n.upper()}</span>'
            f'<span style="{D};font-size:28px;font-weight:700;line-height:1">{g}<span style="font-size:15px;color:{C["tenue"]}"> g</span></span>'
            f'<div style="height:6px;border-radius:3px;background:{col}33"><div style="width:{pct}%;height:100%;border-radius:3px;background:{col}"></div></div>'
            f'<span style="font-size:12px;color:{C["tenue"]};line-height:1.3">{sub}</span></div>')
comido_pct = 1310 / 2900 * 100
queda_pct = (2550 - 1310) / 2900 * 100
obj_pct = 2550 / 2900 * 100
barra_comida = (
    f'<div style="position:relative;height:30px;border-radius:9px;background:{C["sup"]};overflow:hidden">'
    f'<div style="position:absolute;left:0;top:0;bottom:0;width:{comido_pct:.1f}%;background:{C["bien"]};display:flex;align-items:center;padding-left:10px;font-size:12px;font-weight:800;color:{C["fondo"]}">1.310 comido</div>'
    f'<div style="position:absolute;left:{comido_pct:.1f}%;top:0;bottom:0;width:{queda_pct:.1f}%;background:repeating-linear-gradient(45deg,{C["bien"]}33,{C["bien"]}33 6px,transparent 6px,transparent 12px);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:{C["bien"]}">te quedan 1.240</div>'
    f'<div style="position:absolute;left:{obj_pct:.1f}%;top:0;bottom:0;right:0;background:{C["mal"]}33;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:{C["mal"]}">−350</div></div>'
)
info = "\n".join([
 f'<div style="height:5px;width:44px;border-radius:3px;background:{C["borde"]};align-self:center"></div>',
 f'<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0;{D};font-size:26px;font-weight:700">Tu día en números</h2><span style="font-size:11px;font-weight:800;color:{C["marca"]};border:1px solid {C["marca"]};border-radius:99px;padding:2px 8px">DÍA INTENSO</span></div>',
 '<section style="display:flex;flex-direction:column;gap:8px">' + etiqueta("LO QUE GASTAS", "2.900 kcal")
 + seg_barra([("Reposo", 1680, "#5B6672"), ("Vida diaria", 500, "#8592A0"), ("Entreno", 720, C["marca"])], 2900)
 + leyenda([("Reposo", "1.680", "#5B6672"), ("Vida diaria", "500", "#8592A0"), ("Entreno", "720", C["marca"])]) + '</section>',
 '<section style="display:flex;flex-direction:column;gap:8px">' + etiqueta("LO QUE COMES", "objetivo 2.550") + barra_comida
 + f'<span style="font-size:13px;color:{C["suave"]}">El rojo es tu déficit: lo que dejas de comer para bajar de peso. En días intensos es chico (350) para que rindas.</span></section>',
 f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">{macro("Proteína", 174, "fija: 2,3 g por kilo", C["prot"], 55)}{macro("Grasa", 60, "fija: 0,8 g por kilo", C["grasa"], 52)}{macro("Carbo", 310, "sube y baja con el entreno", C["carbo"], 46)}</div>',
 f'<p style="margin:0;font-size:13px;color:{C["tenue"]}">Plan de tu nutricionista. Peso de referencia 75,5 kg (promedio de la semana).</p>',
 f'<div style="display:flex">{boton("Listo", href="RHoy.dc.html")}</div>',
])

# ---------- R8 · Pesarme ----------
def chip_peso(d, kg, ultimo=False):
    borde = "" if ultimo else "border-bottom:1px solid " + C["linea"]
    return f'<div style="display:flex;justify-content:space-between;padding:10px 0;{borde}"><span style="color:{C["suave"]}">{d}</span><span style="{D};font-size:18px;font-weight:700">{kg} kg</span></div>'
circulo = f'width:52px;height:52px;border-radius:50%;border:1px solid {C["borde"]};display:flex;align-items:center;justify-content:center;font-size:26px'
pesarme = "\n".join([
 f'<header style="display:flex;justify-content:space-between;align-items:center"><a href="RYo.dc.html" style="color:{C["tenue"]};font-weight:600;text-decoration:none">‹ Yo</a><h1 style="margin:0;{D};font-size:24px;font-weight:700;letter-spacing:.04em">PESARME</h1><span style="width:30px"></span></header>',
 f'<section style="background:{C["sup"]};border-radius:20px;padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:12px">'
 f'<span style="font-size:13px;font-weight:700;letter-spacing:.1em;color:{C["tenue"]}">HOY · EN AYUNAS</span>'
 f'<div style="display:flex;align-items:center;gap:18px"><span style="{circulo}">−</span><span style="{D};font-size:64px;font-weight:700;line-height:1">75,2<span style="font-size:22px;color:{C["tenue"]}"> kg</span></span><span style="{circulo}">+</span></div>'
 f'<span style="font-size:13px;color:{C["tenue"]};text-align:center">Empieza en tu último peso: ajusta de a 100 g o toca el número para escribirlo.</span>'
 f'<div style="display:flex;width:100%">{boton("GUARDAR PESO", href="RYo.dc.html")}</div></section>',
 '<section style="display:flex;flex-direction:column;gap:6px">' + etiqueta("TENDENCIA · 6 SEMANAS", "−0,7 kg") + grafico_peso()
 + f'<span style="font-size:14px;color:{C["suave"]}">Mira la tendencia, no el día: el peso sube y baja 0,5 a 1 kg por agua.</span></section>',
 '<section style="display:flex;flex-direction:column">' + etiqueta("ÚLTIMOS PESAJES"),
 chip_peso("Vie 13 nov", "75,3"), chip_peso("Mié 11 nov", "75,6"), chip_peso("Lun 9 nov", "75,5", ultimo=True),
 '</section>',
])


# ---------- R9 · Cumplimiento ----------
def semaforo(p):
    return C["bien"] if p >= 85 else C["carbo"] if p >= 70 else C["mal"]
def gauge(nombre, p, sub):
    import math
    r, cx = 52, 60
    L = math.pi * r  # semicírculo
    col = semaforo(p)
    return (f'<div style="flex:1;background:{C["sup"]};border-radius:18px;padding:14px 10px 12px;display:flex;flex-direction:column;align-items:center;gap:4px">'
            f'<span style="font-size:12px;font-weight:800;letter-spacing:.1em;color:{C["tenue"]}">{nombre}</span>'
            f'<div style="position:relative;width:120px;height:66px"><svg width="120" height="66" viewBox="0 0 120 66">'
            f'<path d="M8 60 A52 52 0 0 1 112 60" fill="none" stroke="{col}" stroke-opacity=".18" stroke-width="11" stroke-linecap="round"/>'
            f'<path d="M8 60 A52 52 0 0 1 112 60" fill="none" stroke="{col}" stroke-width="11" stroke-linecap="round" stroke-dasharray="{L*p/100:.1f} {L:.1f}"/></svg>'
            f'<span style="position:absolute;left:0;right:0;bottom:0;text-align:center;{D};font-size:30px;font-weight:700;line-height:1;color:{col}">{p}%</span></div>'
            f'<span style="font-size:13px;color:{C["suave"]};text-align:center">{sub}</span></div>')
def selector(activo):
    out = []
    for t in ["Día", "Semana", "Mes", "Año"]:
        st = f"background:{C['texto']};color:{C['fondo']};font-weight:800" if t == activo else f"color:{C['tenue']};font-weight:600"
        out.append(f'<span style="flex:1;text-align:center;padding:8px 0;border-radius:10px;{st}">{t}</span>')
    return f'<div style="display:flex;gap:4px;background:{C["sup"]};border-radius:12px;padding:4px">{"".join(out)}</div>'
def barras(titulo, etiquetas, ent, ali):
    w, h = 340, 120
    n = len(etiquetas)
    ancho = (w - 20) / n
    out = []
    for i, (e, a, lab) in enumerate(zip(ent, ali, etiquetas)):
        x = 10 + i * ancho
        bw = ancho * 0.32
        for j, v in enumerate([e, a]):
            if v is None: continue
            hh = (h - 30) * v / 100
            col = C["prot"] if j == 0 else C["carbo"]
            out.append(f'<rect x="{x + ancho*0.16 + j*(bw+3):.0f}" y="{h-20-hh:.0f}" width="{bw:.0f}" height="{hh:.0f}" rx="3" fill="{col}"/>')
        out.append(f'<text x="{x + ancho/2:.0f}" y="{h-5}" text-anchor="middle" font-size="11" fill="{C["tenue"]}">{lab}</text>')
    linea = f'<line x1="10" x2="{w-10}" y1="{h-20-(h-30)*0.85:.0f}" y2="{h-20-(h-30)*0.85:.0f}" stroke="{C["bien"]}" stroke-dasharray="4 3" stroke-width="1"/><text x="{w-10}" y="{h-24-(h-30)*0.85:.0f}" text-anchor="end" font-size="10" fill="{C["bien"]}">meta 85 %</text>'
    return (f'<section style="display:flex;flex-direction:column;gap:6px">' + etiqueta(titulo, "") +
            f'<svg viewBox="0 0 {w} {h}" width="100%" height="{h}">{linea}{"".join(out)}</svg>'
            f'<div style="display:flex;gap:14px;font-size:13px;color:{C["suave"]}"><span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:{C["prot"]};margin-right:6px"></span>Entreno</span><span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:{C["carbo"]};margin-right:6px"></span>Alimentación</span></div></section>')
def fila_c(n, sub, p, ultimo=False):
    borde = "" if ultimo else "border-bottom:1px solid " + C["linea"]
    txt = "—" if p is None else f"{p}%"
    col = C["tenue"] if p is None else semaforo(p)
    return f'<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;{borde}"><span style="display:flex;flex-direction:column"><span style="font-size:14px">{n}</span><span style="font-size:12px;color:{C["tenue"]}">{sub}</span></span><span style="{D};font-size:18px;font-weight:700;color:{col}">{txt}</span></div>'

cumple = "\n".join([
 f'<header style="display:flex;justify-content:space-between;align-items:center"><a href="RYo.dc.html" style="color:{C["tenue"]};font-weight:600;text-decoration:none">‹ Yo</a><h1 style="margin:0;{D};font-size:24px;font-weight:700;letter-spacing:.04em">CUMPLIMIENTO</h1><span style="width:30px"></span></header>',
 selector("Semana"),
 f'<span style="font-size:14px;color:{C["tenue"]};text-align:center;margin-top:-6px">‹ &nbsp; Semana 16 – 22 nov &nbsp; ›</span>',
 f'<div style="display:flex;gap:10px">{gauge("ENTRENO", 86, "4 de 5 sesiones del coach")}{gauge("ALIMENTACIÓN", 71, "proteína corta 3 días")}</div>',
 barras("DÍA POR DÍA", ["L", "M", "M", "J", "V", "S", "D"], [100, 79, None, 100, 0, 92, None], [82, 64, 75, 88, 41, 70, 76]),
 '<section style="display:flex;flex-direction:column">' + etiqueta("ENTRENO · SESIONES", "ponderado por duración"),
 fila_c("Mar · rodillo tempo 5×7", "70 de 70 min", 100),
 fila_c("Jue · trail cuestas 1:20", "1:28 de 1:20 (110 %)", 100),
 fila_c("Vie · trote aeróbico 1:00", "no hecho", 0),
 fila_c("Sáb · bici fondo 3:30", "4:16 de 3:30 (122 %)", 92, ultimo=True),
 '</section>',
 '<section style="display:flex;flex-direction:column">' + etiqueta("ALIMENTACIÓN · PROMEDIO", ""),
 fila_c("Calorías", "en objetivo (90–110 %) 4 de 7 días · pesa 40 %", 76),
 fila_c("Proteína", "promedio 148 de 174 g · pesa 35 %", 85),
 fila_c("Carbohidrato del día", "bajo en días intensos · pesa 25 %", 58, ultimo=True),
 '</section>',
 f'<p style="margin:0;font-size:13px;color:{C["tenue"]}">Verde desde 85 %, amarillo 70–84 %, rojo bajo 70 %. Un día sin registrar cuenta 0 % en alimentación.</p>',
])

def mini_mes(m, e, a):
    return f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="display:flex;gap:3px;align-items:flex-end;height:70px"><span style="width:10px;height:{0.7*e:.0f}px;background:{C["prot"]};border-radius:2px"></span><span style="width:10px;height:{0.7*a:.0f}px;background:{C["carbo"]};border-radius:2px"></span></div><span style="font-size:11px;color:{C["tenue"]}">{m}</span></div>'
anio = "\n".join([
 f'<header style="display:flex;justify-content:space-between;align-items:center"><a href="RYo.dc.html" style="color:{C["tenue"]};font-weight:600;text-decoration:none">‹ Yo</a><h1 style="margin:0;{D};font-size:24px;font-weight:700;letter-spacing:.04em">CUMPLIMIENTO</h1><span style="width:30px"></span></header>',
 selector("Año"),
 f'<span style="font-size:14px;color:{C["tenue"]};text-align:center;margin-top:-6px">‹ &nbsp; 2027 &nbsp; ›</span>',
 f'<div style="display:flex;gap:10px">{gauge("ENTRENO", 88, "212 de 236 sesiones")}{gauge("ALIMENTACIÓN", 79, "subiendo desde marzo")}</div>',
 '<section style="display:flex;flex-direction:column;gap:6px">' + etiqueta("MES A MES", "") +
 '<div style="display:flex;justify-content:space-between">' + "".join(mini_mes(m, e, a) for m, e, a in [("E", 84, 70), ("F", 86, 74), ("M", 90, 78), ("A", 93, 82), ("M", 85, 80), ("J", 88, 79), ("J", 82, 76), ("A", 89, 81), ("S", 91, 83), ("O", 87, 80), ("N", 90, 84), ("D", 86, 77)]) + '</div></section>',
 '<section style="display:flex;flex-direction:column">' + etiqueta("MEJOR Y PEOR", ""),
 fila_c("Mejor mes de entreno", "abril · antes de Petzl", 93),
 fila_c("Mejor mes de alimentación", "noviembre", 84),
 fila_c("Mes más bajo", "julio · vacaciones", 76, ultimo=True),
 '</section>',
 f'<p style="margin:0;font-size:13px;color:{C["tenue"]}">Ejemplo de cómo se verá a fin de 2027. Tus datos empiezan en noviembre de 2026.</p>',
])


# ---------- R2 · Menú del botón + ----------
def opcion(icono, t, sub, destacado=False):
    b = f"background:{C['marca']}22;border:1px solid {C['marca']}" if destacado else f"background:{C['sup']}"
    return f'<a href="#" style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:16px;{b};color:{C["texto"]};text-decoration:none"><span style="font-size:24px;width:32px;text-align:center">{icono}</span><span style="display:flex;flex-direction:column"><strong style="font-size:16px">{t}</strong><span style="font-size:13px;color:{C["tenue"]}">{sub}</span></span></a>'
mas = "\n".join([
 f'<div style="height:5px;width:44px;border-radius:3px;background:{C["borde"]};align-self:center"></div>',
 f'<h2 style="margin:0;{D};font-size:26px;font-weight:700">Registrar</h2>',
 opcion("✓", "Almuerzo · lo de siempre", "Pollo, 1½ taza de arroz blanco, ensalada · 720 kcal", True),
 '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">',
 opcion("📷", "Foto", "la IA la lee"), opcion("✍️", "Escribir", "\"pollo con arroz\""),
 opcion("🗂", "Mi despensa", "por unidades"), opcion("🍫", "Fuera de horario", "un extra"),
 '</div>',
 etiqueta("OTROS"),
 '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">',
 opcion("⚖️", "Peso", "hoy toca"), opcion("🚴", "Entreno a mano", "si no llegó de Garmin"),
 '</div>',
])

# ---------- R3 · Plan ----------
def tipo(t, col):
    return f'<span style="font-size:11px;font-weight:800;color:{col};border:1px solid {col};border-radius:99px;padding:1px 7px">{t}</span>'
def dia_plan(d, ent, t, col, cambia, hoy=False):
    b = f"border:1px solid {C['marca']}" if hoy else f"border:1px solid {C['linea']}"
    return f'<div style="display:flex;flex-direction:column;gap:3px;padding:12px;border-radius:14px;{b};background:{C["sup"] if hoy else "transparent"}"><div style="display:flex;justify-content:space-between;align-items:center"><strong>{d} <span style="font-weight:400;font-size:13px;color:{C["tenue"]}">· {ent}</span></strong>{tipo(t, col)}</div><span style="font-size:14px;color:{C["carbo"]}">{cambia}</span></div>'
plan = "\n".join([
 f'<header style="display:flex;justify-content:space-between;align-items:flex-end"><h1 style="margin:0;{D};font-size:30px;font-weight:700;letter-spacing:.03em">PLAN</h1><span style="font-size:14px;color:{C["tenue"]}">16 – 22 nov</span></header>',
 f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">{opcion("🛒", "Lista de compras", "7 días · 18 cosas", True)}{opcion("🍽", "Mis platos", "tu plato de siempre")}{opcion("🗂", "Despensa", "34 alimentos")}{opcion("⚖️", "¿Cuánto me sirvo?", "calculadora")}</div>',
 etiqueta("ESTA SEMANA", "toca un día para ver el menú"),
 dia_plan("Hoy", "rodillo tempo 1:10", "INTENSO", C["marca"], "Arroz blanco 1½ taza · 2 tortillas en la cena", True),
 dia_plan("Mar 17", "rodillo tempo 5×7", "INTENSO", C["marca"], "1 pan con miel antes · arroz blanco"),
 dia_plan("Mié 18", "descanso", "DESCANSO", C["tenue"], "1 pan · ¾ taza de arroz integral"),
 dia_plan("Jue 19", "trail cuestas 1:20", "INTENSO", C["marca"], "1 pan con miel antes · arroz blanco"),
 dia_plan("Vie 20", "trote 1:10", "Z2", C["prot"], "2 panes · 1¼ taza de arroz integral"),
 dia_plan("Sáb 21", "bici 3:30", "LARGO", C["mal"], "2 panes con queso antes · 7 geles en la bici"),
], ) 

# ---------- R4 · Entreno (letra más grande) ----------
def ind(n, v, sub, col):
    return f'<div style="display:flex;flex-direction:column;gap:2px;background:{C["sup"]};border-radius:14px;padding:12px"><span style="font-size:12px;font-weight:700;letter-spacing:.1em;color:{C["tenue"]}">{n}</span><span style="{D};font-size:34px;font-weight:700;color:{col};line-height:1">{v}</span><span style="font-size:13px;color:{C["suave"]}">{sub}</span></div>'
entreno = "\n".join([
 f'<header style="display:flex;justify-content:space-between;align-items:flex-end"><h1 style="margin:0;{D};font-size:30px;font-weight:700;letter-spacing:.03em">ENTRENO</h1><a href="#" style="font-weight:700;font-size:15px">Informe ›</a></header>',
 f'<section style="background:{C["sup"]};border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;font-weight:800;letter-spacing:.1em;color:{C["bien"]}">EN UNA FRASE</span><p style="margin:0;font-size:17px;line-height:1.45">Vas bien: ya superaste tu forma de antes de la lesión. Esta semana estás cansado, es normal; el miércoles descansa de verdad.</p></section>',
 f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">{ind("BASE","31","forma",C["prot"])}{ind("CANSANCIO","47","alto",C["marca"])}{ind("FRESCURA","−16","cansado",C["carbo"])}</div>',
 f'<section style="display:flex;flex-direction:column;gap:8px">{etiqueta("SEMANA DEL COACH", "4 de 5")}<div style="display:flex;gap:6px">{"".join(f"<span style=\"flex:1;text-align:center;padding:8px 0;border-radius:10px;background:{c}22;color:{c};font-weight:800;font-size:13px\">{d}<br>{m}</span>" for d,m,c in [("L","✓",C["bien"]),("M","✓",C["bien"]),("M","·",C["tenue"]),("J","✓",C["bien"]),("V","—",C["carbo"]),("S","✓",C["bien"]),("D","",C["tenue"])])}</div></section>',
 f'<section style="display:flex;flex-direction:column;gap:8px">{etiqueta("SUAVE / MEDIO / FUERTE", "4 semanas")}<div style="display:flex;height:16px;border-radius:8px;overflow:hidden"><span style="width:51%;background:{C["prot"]}"></span><span style="width:42%;background:{C["carbo"]}"></span><span style="width:7%;background:{C["marca"]}"></span></div><p style="margin:0;font-size:14px;color:{C["suave"]}">Mucho tiempo en zona media. Habla con tu coach de las cuestas y tus zonas de pulso.</p></section>',
])

# ---------- R5 · Yo ----------
def ajuste(n, v):
    return f'<a href="#" style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid {C["linea"]};color:{C["texto"]};text-decoration:none"><span>{n}</span><span style="color:{C["tenue"]}">{v} ›</span></a>'
yo = "\n".join([
 f'<header style="display:flex;justify-content:space-between;align-items:center"><h1 style="margin:0;{D};font-size:30px;font-weight:700;letter-spacing:.03em">YO</h1><span style="font-size:14px;color:{C["tenue"]}">Francisco</span></header>',
 f'''<section style="background:{C["sup"]};border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:6px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px;font-weight:800;letter-spacing:.1em;color:{C["tenue"]}">PESO · TENDENCIA</span><a href="RPeso.dc.html" style="font-weight:700;font-size:14px">+ Pesarme</a></div>
<div style="display:flex;align-items:baseline;gap:8px"><span style="{D};font-size:40px;font-weight:700">75,3</span><span style="color:{C["bien"]};font-weight:700">−0,7 kg en 4 semanas</span></div>
{grafico_peso()}<span style="font-size:14px;color:{C["suave"]}">A este ritmo llegas a 73 kg a fines de enero, antes de cortar el déficit (13-mar).</span></section>''',
 f'<a href="RCumple.dc.html" style="display:flex;flex-direction:column;gap:8px;text-decoration:none;color:{C["texto"]}"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px;font-weight:800;letter-spacing:.1em;color:{C["tenue"]}">CUMPLIMIENTO · ESTA SEMANA</span><span style="font-size:14px;font-weight:700;color:{C["marca"]}">Ver más ›</span></div><div style="display:flex;gap:10px">{gauge("ENTRENO", 86, "4 de 5 sesiones")}{gauge("ALIMENTACIÓN", 71, "proteína corta 3 días")}</div></a>',
 f'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">{ind("RACHA","9","días registrando",C["marca"])}{ind("PETZL","20","semanas",C["prot"])}</div>',
 '<section style="display:flex;flex-direction:column">', etiqueta("AJUSTES"),
 ajuste("Avisos", "6 activos"), ajuste("Plan de la nutricionista", "déficit 300 en descanso"), ajuste("Carreras", "Petzl 50K"), ajuste("Modo pausa", "apagado"), ajuste("Conexiones", "Garmin · TrainingPeaks"), ajuste("Mis datos", "estatura, nacimiento, horarios"),
 '</section>',
])

hoja = lambda contenido, alto: f'<div style="position:absolute;inset:0;background:rgba(0,0,0,.55)"></div><div style="position:absolute;left:0;right:0;bottom:0;height:{alto}px;background:{C["sup2"]};border-radius:24px 24px 0 0;padding:12px 18px 30px;display:flex;flex-direction:column;gap:14px;box-sizing:border-box">{contenido}</div>'

paginas = [
 ("RHoy", "Hoy", 1500, hoy, "hoy", ""),
 ("RPeso", "Pesarme", 1000, pesarme, "yo", ""),
 ("RHecho", "Lo comí", 760, hecho, "hoy", hecho_extra),
 ("RInfo", "Detalle del día", 820, f'<div style="opacity:.25">{anillos(.46,.55,.52,"1.240","kcal te quedan")}</div>', "hoy", hoja(info, 720)),
 ("RMas", "Registrar", 760, f'<div style="opacity:.25">{anillos(.46,.55,.52,"1.240","kcal te quedan")}</div>', "hoy", hoja(mas, 640)),
 ("RPlan", "Plan", 1060, plan, "plan", ""),
 ("REntreno", "Entreno", 900, entreno, "entreno", ""),
 ("RYo", "Yo", 1120, yo, "yo", ""),
 ("RCumple", "Cumplimiento", 1400, cumple, "yo", ""),
 ("RCumpleAnio", "Cumplimiento anual", 1000, anio, "yo", ""),
]
for k, t, h, cuerpo, act, extra in paginas:
    open(f"{k}.dc.html", "w", encoding="utf-8").write(pagina(t, h, cuerpo, act, extra))
print("ok")
