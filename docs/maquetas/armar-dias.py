# Maquetas para corregir comidas de días anteriores: franja de días en
# Comidas, registros con Editar/Borrar visibles y edición completa.
src31 = open("armar-31.py", encoding="utf-8").read().split("# ---------- 3.1.1")[0]
exec(src31)

def chips_comida(activa):
    out = []
    for c in ["Antes", "Durante", "Desayuno", "Media mañana", "Almuerzo", "Media tarde", "Cena", "Extra"]:
        st = f"border: 1px solid {C['texto']}; background: {C['texto']}; color: {C['fondo']}; font-weight: 700;" if c == activa else f"border: 1px solid {C['borde']}; background: transparent; color: {C['tenue']};"
        out.append(f'<span style="font-size: 12px; padding: 6px 9px; border-radius: 99px; white-space: nowrap; {st}">{c}</span>')
    return f'<div style="display: flex; flex-wrap: wrap; gap: 5px">{"".join(out)}</div>'

def franja(activo):
    dias = [("Lun", "2"), ("Mar", "3"), ("Mié", "4"), ("Jue", "5"), ("Vie", "6"), ("Sáb", "7"), ("Dom", "8"), ("Hoy", "9")]
    out = []
    for d, n in dias:
        act = n == activo
        st = f"background: {C['texto']}; color: {C['fondo']}; border-color: {C['texto']};" if act else f"background: transparent; color: {C['suave']}; border-color: {C['borde']};"
        out.append(f'<button type="button" style="font: inherit; flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 6px 0; border-radius: 10px; border: 1px solid; {st}"><span style="font-size: 11px; font-weight: 700">{d}</span><span style="{D}; font-size: 17px; font-weight: 700">{n}</span></button>')
    return f'<div style="display: flex; gap: 4px">{"".join(out)}</div>'

def registro(momento, detalle, kcal_txt, items, ultimo=False):
    b = "" if ultimo else f" border-bottom: 1px solid {C['linea']};"
    lis = "".join(f'<li style="display: flex; justify-content: space-between; gap: 10px; font-size: 13px"><span>{n} <span style="color: {C["tenue"]}">· {g}</span></span>{macros(c, p, gg, 13)}</li>' for n, g, c, p, gg in items)
    return f'''<section style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0;{b}">
<div style="display: flex; justify-content: space-between; align-items: baseline"><strong>{momento} <span style="font-weight: 400; font-size: 13px; color: {C["tenue"]}">· {detalle}</span></strong><span style="{D}; font-size: 20px; font-weight: 600">{kcal_txt}</span></div>
<ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px">{lis}</ul>
<div style="display: flex; gap: 8px"><a href="EditarComida.dc.html" style="flex: 1; text-align: center; padding: 8px; border-radius: 10px; border: 1px solid {C["borde"]}; color: {C["texto"]}; font-weight: 700; text-decoration: none">Editar</a><span style="flex: 1; text-align: center; padding: 8px; border-radius: 10px; border: 1px solid {C["borde"]}; color: {C["tenue"]}; font-weight: 600">Borrar</span></div>
</section>'''

# ---------- Comidas en un día anterior ----------
comidas = "\n".join([
 f'<header style="display: flex; justify-content: space-between; align-items: flex-end"><div style="display: flex; flex-direction: column"><span style="font-size: 13px; font-weight: 700; color: {C["carbo"]}">Domingo 8 nov · día suave</span><h1 style="margin: 0; {D}; font-size: 28px; font-weight: 700; letter-spacing: 0.04em">COMIDAS</h1></div><span style="font-weight: 700; color: {C["marca"]}; padding-bottom: 4px">+ Registrar</span></header>',
 franja("8"),
 nota("Toca un día para ver y corregir sus comidas. Hasta 7 días atrás."),
 f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="{D}; font-size: 44px; font-weight: 700; line-height: 1">2.518</span><span style="{D}; font-size: 20px; color: {C["tenue"]}">/ 2.530 kcal</span></div>',
 '<section style="display: flex; flex-direction: column">',
 etiqueta("REGISTROS DEL DOMINGO 8"),
 registro("Desayuno", "foto", "776", [("Huevos revueltos", "120 g", 2, 15, 12), ("Pan de agua", "2 panes", 36, 6, 4), ("Jugo de naranja", "1 vaso", 26, 1, 0)]),
 registro("Almuerzo", "texto", "913", [("Pulled pork", "150 g", 15, 33, 15), ("Pie", "120 g", 45, 3, 15), ("Helado", "1 bola", 17, 3, 7), ("Cerveza", "2 latas", 26, 3, 0)]),
 registro("Cena", "texto", "307", [("Yogurt natural", "200 g", 9, 7, 7), ("Granola", "50 g", 16, 3, 4), ("Miel", "1 cda", 17, 0, 0)], ultimo=True),
 '</section>',
])

# ---------- Editar comida ----------
def fila_edit(nombre, medida, c, p, g, ultimo=False):
    b = "" if ultimo else f" border-bottom: 1px solid {C['linea']};"
    bt = f"width: 30px; height: 30px; border-radius: 50%; border: 1px solid {C['borde']}; background: {C['sup']}; display: flex; align-items: center; justify-content: center; flex: none"
    return f'''<div style="display: flex; align-items: center; gap: 10px; padding: 10px 0;{b}">
<div style="display: flex; flex-direction: column; flex: 1; min-width: 0"><strong>{nombre}</strong>{macros(c, p, g, 13)}</div>
<span style="{bt}">−</span><span style="{D}; font-size: 16px; font-weight: 600; min-width: 64px; text-align: center">{medida}</span><span style="{bt}">+</span>
<span style="color: {C["tenue"]}; font-size: 18px; padding-left: 4px">×</span></div>'''

editar = "\n".join([
 header("Cancelar", "EDITAR", "", "CorregirDia.dc.html"),
 f'<span style="text-align: center; font-size: 13px; font-weight: 700; color: {C["carbo"]}; margin-top: -10px">Domingo 8 nov</span>',
 f'<div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 600; color: {C["suave"]}">Es de</span>{chips_comida("Almuerzo")}<span style="font-size: 12px; color: {C["tenue"]}">Cámbiala si la guardaste en otra comida (ej. la recuperación como media mañana).</span></div>',
 '<section style="display: flex; flex-direction: column">',
 etiqueta("ALIMENTOS", "toca el nombre para cambiar gramos"),
 fila_edit("Pulled pork", "150 g", 15, 33, 15),
 fila_edit("Pie", "120 g", 45, 3, 15),
 fila_edit("Helado", "1 bola", 17, 3, 7),
 fila_edit("Cerveza", "2 latas", 26, 3, 0),
 fila_edit("Pan de hamburguesa", "1 pan", 26, 5, 3, ultimo=True),
 '</section>',
 caja("\n".join([
   etiqueta("+ AGREGAR ALIMENTO"),
   seg(["Escribir", "Mi despensa"], "Escribir"),
   f'<div style="display: flex; gap: 8px"><div style="flex: 1; border: 1px solid {C["borde"]}; border-radius: 10px; background: {C["fondo"]}; padding: 10px 12px">1 pan de hamburguesa</div><span style="padding: 10px 14px; border-radius: 10px; background: {C["marca"]}; color: {C["fondo"]}; font-weight: 800">Agregar</span></div>',
   nota("La IA calcula solo lo nuevo; lo demás no cambia."),
 ])),
 f'<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="color: {C["tenue"]}">Total</span><span style="{D}; font-size: 22px; font-weight: 700">1.043 kcal</span></div>',
 boton("GUARDAR CAMBIOS", "CorregirDia.dc.html"),
 f'<span style="text-align: center; color: {C["tenue"]}; text-decoration: underline">Borrar este registro</span>',
])

ON = "font-weight: 700; text-decoration: none; color: #FF6A1A"
OFF = "font-weight: 500; text-decoration: none; color: #8C969F"
for k, t, h, cuerpo, n in [("CorregirDia", "Comidas · día anterior", 1180, comidas, True), ("EditarComida", "Editar comida", 1100, editar, False)]:
    open(f"{k}.dc.html", "w", encoding="utf-8").write(pagina(t, h, cuerpo, n, "Comidas"))
print("ok")
