# Genera las maquetas de la etapa 3.1 (Mi despensa, etiqueta, Mis comidas, calculadora, ajuste en alimentos).
import re
src = open("Comidas.dc.html", encoding="utf-8").read()
nav = re.search(r'<nav aria-label="Navegación principal".*?</nav>', src, re.S).group(0)

C = {"fondo":"#0E1113","sup":"#171B1F","linea":"#22282E","borde":"#2A3036","texto":"#F2F4F5","suave":"#D5DADE","tenue":"#9AA4AD","marca":"#FF6A1A","carbo":"#FFB020","prot":"#4C9DFF","grasa":"#B98CFF","bien":"#3DDC84"}
D = "font-family: 'Saira Condensed', sans-serif"
def pagina(titulo, alto, cuerpo, con_nav=True, activa="Comidas"):
    navx = nav if con_nav else ""
    if con_nav and activa == "Hoy":
        navx = navx.replace('font-weight: 700; text-decoration: none; color: #FF6A1A; min-width: 56px"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5">', 'font-weight: 500; text-decoration: none; color: #8C969F; min-width: 56px"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5">')
        navx = navx.replace('<a href="Main.dc.html" style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; font-weight: 500; text-decoration: none; color: #8C969F;', '<a href="Main.dc.html" style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; font-weight: 700; text-decoration: none; color: #FF6A1A;')
    pad = "18px 18px 110px" if con_nav else "18px 18px 24px"
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{titulo} · FXB Performance</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&amp;family=Archivo:wght@400;500;600;700&amp;display=swap">
<style>
body{{margin:0;background:#0E1113}}
a{{color:#FF6A1A}}a:hover{{color:#FF8A4A}}
</style>
</helmet>
<div style="width: 390px; height: {alto}px; position: relative; box-sizing: border-box; background: #0E1113; color: #F2F4F5; font-family: 'Archivo', system-ui, sans-serif; font-size: 14px; line-height: 1.45; overflow: hidden">
<div style="padding: {pad}; display: flex; flex-direction: column; gap: 18px">
{cuerpo}
</div>
{navx}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":{alto}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''

def header(izq, titulo, der="", href_izq="Comidas.dc.html"):
    return f'''<header style="display: flex; justify-content: space-between; align-items: center">
<a href="{href_izq}" style="font-weight: 600; text-decoration: none; padding: 10px 0; color: {C['tenue']}; min-width: 70px">{izq}</a>
<h1 style="margin: 0; {D}; font-size: 24px; font-weight: 700; letter-spacing: 0.04em">{titulo}</h1>
<span style="min-width: 70px; text-align: right; font-weight: 700; color: {C['marca']}">{der}</span>
</header>'''

def etiqueta(t, der=""):
    d = f'<span style="font-size: 12px; color: {C["tenue"]}">{der}</span>' if der else ""
    return f'<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: {C["tenue"]}">{t}</span>{d}</div>'

def macros(c, p, g, tam=15):
    return f'<span style="{D}; font-size: {tam}px; font-weight: 600; white-space: nowrap"><span style="color: {C["carbo"]}">{c} C</span>&nbsp;&nbsp;<span style="color: {C["prot"]}">{p} P</span>&nbsp;&nbsp;<span style="color: {C["grasa"]}">{g} G</span></span>'

def fila(nombre, sub, der, ultimo=False, chip=""):
    b = "" if ultimo else f" border-bottom: 1px solid {C['linea']};"
    ch = f' <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: {C["marca"]}; border: 1px solid #4a2a16; border-radius: 99px; padding: 1px 7px; margin-left: 4px; vertical-align: 2px">{chip}</span>' if chip else ""
    return f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 11px 0;{b}"><div style="display: flex; flex-direction: column; min-width: 0"><strong>{nombre}{ch}</strong><span style="font-size: 12px; color: {C["tenue"]}">{sub}</span></div>{der}</div>'

def seg(opciones, activo):
    out = []
    for i, o in enumerate(opciones):
        act = o == activo
        st = f"font-weight: 700; background: {C['texto']}; color: {C['fondo']};" if act else f"font-weight: 600; background: {C['sup']}; color: {C['suave']};"
        bl = "" if i == 0 else f" border-left: 1px solid {C['borde']};"
        out.append(f'<button type="button" style="font: inherit; padding: 10px 6px; border: 0;{bl} {st}">{o}</button>')
    return f'<div style="display: grid; grid-template-columns: repeat({len(opciones)}, minmax(0, 1fr)); border: 1px solid {C["borde"]}; border-radius: 10px; overflow: hidden">{"".join(out)}</div>'

def buscador(valor="", ph="Buscar"):
    txt = f'<span style="color: {C["texto"]}">{valor}</span>' if valor else f'<span style="color: {C["tenue"]}">{ph}</span>'
    return f'<div style="display: flex; align-items: center; gap: 8px; border: 1px solid {C["borde"]}; border-radius: 10px; background: {C["sup"]}; padding: 10px 12px"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{C["tenue"]}" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>{txt}</div>'

def boton(t, href="Main.dc.html", sec=False):
    if sec:
        return f'<a href="{href}" style="display: block; text-align: center; padding: 13px; border-radius: 12px; border: 1px solid {C["marca"]}; color: {C["marca"]}; font-weight: 800; letter-spacing: 0.04em; text-decoration: none">{t}</a>'
    return f'<a href="{href}" style="display: block; text-align: center; padding: 15px; border-radius: 12px; background: {C["marca"]}; color: {C["fondo"]}; font-weight: 800; letter-spacing: 0.04em; text-decoration: none">{t}</a>'

def nota(t): return f'<span style="font-size: 12px; color: {C["tenue"]}">{t}</span>'
def caja(contenido, borde=False):
    b = f"border: 1px solid {C['borde']};" if borde else f"background: {C['sup']};"
    return f'<section style="display: flex; flex-direction: column; gap: 10px; border-radius: 14px; {b} padding: 14px 16px">{contenido}</section>'
def aviso(titulo, contenido, color="#FF6A1A"):
    return f'<section style="border-left: 3px solid {color}; padding: 2px 0 2px 12px; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: {color}">{titulo}</span>{contenido}</section>'
def kcal(n, sub="kcal"): return f'<span style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15"><span style="{D}; font-size: 18px; font-weight: 600">{n}</span><span style="font-size: 11px; color: {C["tenue"]}">{sub}</span></span>'

# ---------- 3.1.1 Mi despensa ----------
despensa = "\n".join([
 header("‹ Comidas", "MI DESPENSA", "+ Agregar"),
 seg(["Alimentos (14)", "Platos (5)"], "Alimentos (14)"),
 buscador(ph="Buscar alimento o marca"),
 '<section style="display: flex; flex-direction: column">',
 etiqueta("CON MARCA · DE LA ETIQUETA"),
 fila("Galletas Amor", "Nestlé · porción 3 unid. (28 g)", kcal("130", "19 C · 2 P · 5 G")),
 fila("Yogur griego natural", "Toni · 1 vaso (150 g)", kcal("120", "6 C · 15 P · 4 G")),
 fila("Pan integral", "Supan · 1 rebanada (30 g)", kcal("75", "13 C · 3 P · 1 G")),
 fila("Avena en hojuelas", "Quaker · ½ taza (40 g)", kcal("150", "27 C · 5 P · 3 G"), ultimo=True),
 '</section>',
 '<section style="display: flex; flex-direction: column">',
 etiqueta("GENÉRICOS · TABLAS DE NUTRICIÓN"),
 fila("Pechuga de pollo cocida", "por 100 g · 1 pechuga mediana ≈ 150 g", kcal("165", "0 C · 31 P · 4 G")),
 fila("Arroz blanco cocido", "por 100 g · 1 taza ≈ 160 g", kcal("130", "28 C · 3 P · 0 G")),
 fila("Aguacate", "por 100 g · ½ unidad ≈ 70 g", kcal("160", "9 C · 2 P · 15 G"), ultimo=True),
 '</section>',
 aviso("AGREGAR", f'<span>Foto de la etiqueta (la IA la lee una vez, ~4 centavos) · escribir a mano · guardar un alimento desde un registro.</span>'),
])

# ---------- 3.1.2 Leer etiqueta ----------
def tabla_etq():
    filas = [("Energía","130 kcal","464 kcal",C['texto']),("Carbohidrato","19 g","68 g",C['carbo']),("Proteína","2 g","7 g",C['prot']),("Grasa","5 g","18 g",C['grasa'])]
    out = [f'<div style="display: grid; grid-template-columns: 1fr 90px 90px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: {C["tenue"]}; padding-bottom: 6px"><span></span><span style="text-align: right">PORCIÓN</span><span style="text-align: right">100 G</span></div>']
    for n, a, b, col in filas:
        out.append(f'<div style="display: grid; grid-template-columns: 1fr 90px 90px; padding: 8px 0; border-top: 1px solid {C["linea"]}"><span>{n}</span><span style="text-align: right; {D}; font-size: 17px; font-weight: 600; color: {col}">{a}</span><span style="text-align: right; {D}; font-size: 17px; font-weight: 600; color: {C["tenue"]}">{b}</span></div>')
    return "".join(out)
etiq = "\n".join([
 header("Cancelar", "ETIQUETA", "", "Despensa.dc.html"),
 f'<div style="height: 140px; border-radius: 14px; background: repeating-linear-gradient(45deg, #171B1F, #171B1F 10px, #1C2126 10px, #1C2126 20px); display: flex; align-items: center; justify-content: center; color: {C["tenue"]}; font-weight: 600">[Foto de la tabla nutricional]</div>',
 etiqueta("LO QUE LEYÓ LA IA", "toca para corregir"),
 fila("Galletas Amor", "Nombre", ""),
 fila("Nestlé", "Marca", ""),
 fila("3 galletas · 28 g", "Porción de la etiqueta", "", ultimo=True),
 caja(tabla_etq()),
 aviso("CÓMO LO VAS A REGISTRAR", '<span>Por unidad (1 galleta = 9 g) o por gramos. La etiqueta no traía los valores por 100 g: los calculé desde la porción.</span>', C['carbo']),
 boton("GUARDAR EN MI DESPENSA", "Despensa.dc.html"),
 nota("Revisa que los números coincidan con la etiqueta antes de guardar. Después ya no se usa la IA para este alimento."),
])

# ---------- 3.1.3 Registrar · Mis comidas ----------
def chips_comida(activa):
    out = []
    for c in ["Desayuno","Media mañana","Almuerzo","Media tarde","Cena"]:
        if c == activa:
            out.append(f'<button type="button" style="font: inherit; font-size: 12px; font-weight: 700; padding: 7px 9px; border-radius: 99px; border: 1px solid {C["texto"]}; background: {C["texto"]}; color: {C["fondo"]}; white-space: nowrap; flex: none">{c}</button>')
        else:
            out.append(f'<button type="button" style="font: inherit; font-size: 12px; padding: 7px 9px; border-radius: 99px; border: 1px solid {C["borde"]}; background: transparent; color: {C["tenue"]}; white-space: nowrap; flex: none">{c}</button>')
    return f'<div style="display: flex; gap: 5px; overflow: hidden">{"".join(out)}</div>'
def stepper(txt):
    b = f"width: 34px; height: 34px; border-radius: 50%; border: 1px solid {C['borde']}; background: {C['sup']}; color: {C['texto']}; font-size: 18px; display: flex; align-items: center; justify-content: center"
    return f'<div style="display: flex; align-items: center; gap: 10px"><span style="{b}">−</span><span style="{D}; font-size: 18px; font-weight: 600; min-width: 92px; text-align: center">{txt}</span><span style="{b}">+</span></div>'
miscomidas = "\n".join([
 header("Cancelar", "REGISTRAR", "", "Main.dc.html"),
 chips_comida("Media tarde"),
 seg(["Foto", "Escribir", "Mis comidas"], "Mis comidas"),
 buscador("yog"),
 '<section style="display: flex; flex-direction: column">',
 etiqueta("DESPENSA"),
 fila("Yogur griego natural", "Toni · 1 vaso (150 g)", kcal("120", "15 g P"), chip="MARCA"),
 fila("Yogur con granola", "plato · yogur Toni + 30 g granola", kcal("250", "15 g P"), ultimo=True, chip="PLATO"),
 '</section>',
 etiqueta("LO QUE VAS A REGISTRAR"),
 caja("\n".join([
   f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px"><div style="display: flex; flex-direction: column"><strong>Yogur griego natural</strong><span style="font-size: 12px; color: {C["tenue"]}">Toni · 150 g por vaso</span></div>{stepper("1 vaso")}</div>',
   f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px solid {C["linea"]}; padding-top: 10px"><div style="display: flex; flex-direction: column"><strong>Galletas Amor</strong><span style="font-size: 12px; color: {C["tenue"]}">Nestlé · 9 g por unidad</span></div>{stepper("3 unid.")}</div>',
   f'<span style="font-size: 12px; color: {C["tenue"]}">Cambia entre unidades y gramos tocando la cantidad.</span>',
 ])),
 caja("\n".join([
   f'<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: {C["tenue"]}">MEDIA TARDE VS OBJETIVO</span><span style="{D}; font-size: 18px; font-weight: 700">250 <span style="font-size: 13px; color: {C["tenue"]}">/ 300 kcal</span></span></div>',
   macros("25 / 23", "17 / 30", "9 / 10", 17),
 ])),
 boton("GUARDAR MEDIA TARDE", "Comidas.dc.html"),
 nota("Desde la despensa no se usa la IA: los macros son los de la etiqueta. Nada se guarda hasta que pulses Guardar."),
])

# ---------- 3.1.4 Calculadora ----------
calc = "\n".join([
 header("‹ Volver", "¿CUÁNTO ME SIRVO?", "", "Main.dc.html"),
 chips_comida("Almuerzo"),
 caja("\n".join([
   etiqueta("OBJETIVO DEL ALMUERZO", "ya ajustado por lo de la mañana"),
   f'<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="{D}; font-size: 30px; font-weight: 700">440 <span style="font-size: 15px; color: {C["tenue"]}">kcal</span></span>{macros("57", "30", "10", 17)}</div>',
 ])),
 etiqueta("¿QUÉ HAY EN EL PLATO?", "de tu despensa o escrito"),
 buscador(ph="Agregar alimento"),
 '<section style="display: flex; flex-direction: column">',
 fila("Pechuga de pollo", "cubre la proteína", f'<span style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15"><span style="{D}; font-size: 22px; font-weight: 700; color: {C["prot"]}">75 g</span><span style="font-size: 11px; color: {C["tenue"]}">½ pechuga</span></span>'),
 fila("Arroz blanco", "cubre el carbohidrato", f'<span style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15"><span style="{D}; font-size: 22px; font-weight: 700; color: {C["carbo"]}">185 g</span><span style="font-size: 11px; color: {C["tenue"]}">1 taza + 2 cdas</span></span>'),
 fila("Aguacate", "completa la grasa", f'<span style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15"><span style="{D}; font-size: 22px; font-weight: 700; color: {C["grasa"]}">45 g</span><span style="font-size: 11px; color: {C["tenue"]}">⅓ de unidad</span></span>'),
 fila("Ensalada verde", "libre: casi no suma", f'<span style="{D}; font-size: 18px; color: {C["tenue"]}">a gusto</span>', ultimo=True),
 '</section>',
 aviso("ASÍ SE ARMA EL PLATO", '<span>El arroz cubre el carbohidrato, el pollo completa la proteína que falta (el arroz ya aporta un poco) y el aguacate completa la grasa. Total: 432 kcal · 56 C · 30 P · 10 G.</span>', C['bien']),
 boton("LO COMÍ: REGISTRAR", "Comidas.dc.html"),
 boton("SOLO ERA PARA SABER", "Main.dc.html", sec=True),
])

# ---------- 3.1.5 Ajuste en alimentos (Hoy) ----------
ajuste = "\n".join([
 f'<header style="display: flex; align-items: center; justify-content: space-between"><span style="{D}; font-size: 16px; font-weight: 800; letter-spacing: 0.1em; color: {C["marca"]}">FXB PERFORMANCE</span><span style="font-size: 13px; color: {C["tenue"]}">Hoy · 31 oct</span></header>',
 aviso("AJUSTE · ALMUERZO 13:00", "\n".join([
   '<span>En el desayuno te faltaron 20 g de proteína y te pasaste 25 g de carbohidrato. Tu almuerzo de siempre queda así:</span>',
   f'<div style="display: flex; flex-direction: column; gap: 4px; {D}; font-size: 17px; font-weight: 600"><span><span style="color: {C["prot"]}">Pollo</span> 150 → <strong>215 g</strong> <span style="font-size: 13px; color: {C["tenue"]}">(+65 g · 1 pechuga y media)</span></span><span><span style="color: {C["carbo"]}">Arroz</span> 160 → <strong>110 g</strong> <span style="font-size: 13px; color: {C["tenue"]}">(¾ de taza)</span></span><span><span style="color: {C["grasa"]}">Aguacate</span> sin cambio <span style="font-size: 13px; color: {C["tenue"]}">(½ unidad)</span></span></div>',
 ])),
 '<section style="display: flex; flex-direction: column">',
 etiqueta("COMIDAS · MENÚ TIPO", "2.230 / 2.270 kcal"),
 fila("Desayuno", "Comiste 93 C · 10 P · 12 G", kcal("520", "de 470 kcal")),
 fila("Media mañana", "Yogur con granola · 25 C · 15 P · 9 G", kcal("250", "kcal · +")),
 fila("Almuerzo <span style=\"font-size: 11px; font-weight: 700; color: #FF6A1A\">AJUSTADO</span>", "Pollo 215 g · arroz 110 g · ensalada · ½ aguacate", kcal("590", "kcal · +")),
 fila("Media tarde", "Fruta + 1 yogur griego", kcal("230", "kcal · +")),
 fila("Cena", "Menú tipo · 46 C · 30 P · 10 G", kcal("440", "kcal · +"), ultimo=True),
 '</section>',
 nota("Cada comida usa tu plato habitual de la despensa (menú tipo). Lo cambias en Mi despensa › Platos."),
])

paginas = {"Despensa": ("Mi despensa", 1060, despensa, True), "Etiqueta": ("Leer etiqueta", 1060, etiq, False), "MisComidas": ("Mis comidas", 900, miscomidas, False), "Calculadora": ("Calculadora", 1120, calc, False), "AjusteAlimentos": ("Ajuste en alimentos", 900, ajuste, True)}
for k, (t, h, cuerpo, n) in paginas.items():
    open(f"{k}.dc.html", "w", encoding="utf-8").write(pagina(t, h, cuerpo, n, "Hoy" if k == "AjusteAlimentos" else "Comidas"))
print("ok")
