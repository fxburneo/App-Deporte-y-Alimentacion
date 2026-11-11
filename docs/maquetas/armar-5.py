# Maquetas de la etapa 5: menú de la semana con el menú tipo de Francisco
# (cantidades de carbohidrato por tipo de día) y lista de compras.
src31 = open("armar-31.py", encoding="utf-8").read().split("# ---------- 3.1.1")[0]
exec(src31)

COL = {"Descanso": C["tenue"], "Z2": C["prot"], "Intenso": C["marca"], "Largo": "#FF5A5F"}

def pill(t):
    c = COL[t]
    return f'<span style="font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: {c}; border: 1px solid {c}; border-radius: 99px; padding: 1px 8px; white-space: nowrap">{t.upper()}</span>'

def var(t):  # lo que cambia según el día, resaltado
    return f'<span style="color: {C["carbo"]}; font-weight: 700">{t}</span>'

def dia_fila(dia, tipo, entreno, cambios, kcal, ultimo=False):
    b = "" if ultimo else f" border-bottom: 1px solid {C['linea']};"
    return f'''<a href="MenuDia.dc.html" style="display: flex; flex-direction: column; gap: 4px; padding: 11px 0;{b} color: {C["texto"]}; text-decoration: none">
<div style="display: flex; justify-content: space-between; align-items: center"><strong>{dia} <span style="font-weight: 400; font-size: 13px; color: {C["tenue"]}">· {entreno}</span></strong>{pill(tipo)}</div>
<span style="font-size: 13px; color: {C["suave"]}">{cambios}</span>
<span style="font-size: 12px; color: {C["tenue"]}">{kcal}</span></a>'''

semana = "\n".join([
 f'<header style="display: flex; justify-content: space-between; align-items: flex-end"><div style="display: flex; flex-direction: column"><span style="font-size: 13px; color: {C["tenue"]}">Lun 16 → Dom 22 nov · plan de TrainingPeaks</span><h1 style="margin: 0; {D}; font-size: 28px; font-weight: 700; letter-spacing: 0.04em">MENÚ DE LA SEMANA</h1></div></header>',
 seg(["7 días", "14 días"], "7 días"),
 nota("Tu menú tipo es fijo. Cada día cambia solo lo que está en amarillo: panes, arroz, fruta y tortillas."),
 '<section style="display: flex; flex-direction: column">',
 dia_fila("Lun 16", "Descanso", "descanso total", f'Desayuno {var("1 pan")} · almuerzo {var("¾ taza arroz integral")} · cena {var("1 tortilla")}', "1.880 kcal · 160 g C"),
 dia_fila("Mar 17", "Intenso", "cuestas 1 h", f'Antes {var("1 pan con miel")} · almuerzo {var("1½ taza arroz blanco")} · tarde {var("+ banano")} · cena {var("2 tortillas")}', "2.480 kcal · 310 g C"),
 dia_fila("Mié 18", "Z2", "rodillo Z2 1 h", f'Desayuno {var("2 panes")} · almuerzo {var("1¼ taza arroz integral")} · tarde {var("+ banano")}', "2.130 kcal · 225 g C"),
 dia_fila("Jue 19", "Intenso", "test de FTP", f'Antes {var("1 pan con miel")} · almuerzo {var("1½ taza arroz blanco")} · cena {var("2 tortillas")}', "2.480 kcal · 310 g C"),
 dia_fila("Vie 20", "Z2", "rodillo 1:15", f'Desayuno {var("2 panes")} · almuerzo {var("1¼ taza arroz integral")} · tarde {var("+ banano")}', "2.150 kcal · 230 g C"),
 dia_fila("Sáb 21", "Largo", "MTB 4 h", f'Antes {var("2 panes con miel")} · bici {var("60 g/h: 4 geles, 2 isotónicas")} · almuerzo {var("1½ taza arroz blanco")}', "3.380 kcal · 535 g C"),
 dia_fila("Dom 22", "Z2", "trote 1:15", f'Desayuno {var("2 panes")} · almuerzo {var("1¼ taza arroz integral")}', "2.140 kcal · 228 g C", ultimo=True),
 '</section>',
 boton("LISTA DE COMPRAS", "Compras.dc.html"),
 nota("Si el coach cambia un entreno, el menú del día se recalcula solo."),
])

def comida(hora, nombre, fijos, cambia, macros_txt, ultimo=False):
    b = "" if ultimo else f" border-bottom: 1px solid {C['linea']};"
    return f'''<div style="display: flex; flex-direction: column; gap: 3px; padding: 11px 0;{b}">
<div style="display: flex; justify-content: space-between"><strong>{nombre} <span style="font-weight: 400; font-size: 13px; color: {C["tenue"]}">{hora}</span></strong><span style="font-size: 12px; color: {C["tenue"]}">{macros_txt}</span></div>
<span style="font-size: 13px">{fijos}</span>{f'<span style="font-size: 13px">{cambia}</span>' if cambia else ""}</div>'''

dia = "\n".join([
 header("‹ Semana", "MAR 17 NOV", "", "MenuSemana.dc.html"),
 f'<div style="display: flex; justify-content: space-between; align-items: center; margin-top: -8px"><span style="color: {C["suave"]}">Cuestas 1 h · 05:15</span>{pill("Intenso")}</div>',
 caja(f'<div style="display: flex; align-items: baseline; gap: 8px"><span style="{D}; font-size: 36px; font-weight: 700">2.480</span><span style="color: {C["tenue"]}">kcal</span></div>{macros(310, 174, 60, 18)}'),
 '<section style="display: flex; flex-direction: column">',
 comida("05:00", "Antes de entrenar", var("1 pan de agua con 1 cucharada de miel"), "", "35 C"),
 comida("06:45", "Desayuno", "2 huevos · 1 tajada de queso light · café pintado · batido: leche descremada 1 taza", f'{var("2 panes de agua")} · {var("papaya 1 taza")} en el batido', "70 C · 37 P · 17 G"),
 comida("10:00", "Media mañana", "2 tajadas de queso light", var("6 galletas integrales"), "33 C · 18 P · 10 G"),
 comida("13:00", "Almuerzo", "pollo 200 g (o lomo de cerdo / res) · ensalada con 1 cdta de aceite", f'{var("1½ taza de arroz BLANCO")} <span style="color: {C["tenue"]}">(día intenso: blanco)</span>', "70 C · 70 P · 14 G"),
 comida("16:00", "Media tarde", "piña 1 taza · 10 almendras", var("+ 1 banano"), "52 C · 4 P · 7 G"),
 comida("19:00", "Cena", "wrap: pollo asado 150 g · 1 tajada de queso light · tomate", var("2 tortillas"), "61 C · 58 P · 13 G", ultimo=True),
 '</section>',
 aviso("ARROZ", '<span>Integral en descanso y Z2 (llena más con menos carbohidrato). Blanco en días intensos, largos, víspera de salida larga y carga (más carbohidrato con menos fibra).</span>', C['carbo']),
])

def item(nombre, cant, detalle="", hecho=False, ultimo=False):
    b = "" if ultimo else f" border-bottom: 1px solid {C['linea']};"
    box = f'<span style="width: 20px; height: 20px; border-radius: 6px; border: 2px solid {C["bien"] if hecho else C["borde"]}; background: {C["bien"] if hecho else "transparent"}; flex: none"></span>'
    est = f"color: {C['tenue']}; text-decoration: line-through;" if hecho else ""
    d = f'<span style="font-size: 12px; color: {C["tenue"]}">{detalle}</span>' if detalle else ""
    return f'<div style="display: flex; align-items: center; gap: 10px; padding: 9px 0;{b}">{box}<div style="display: flex; flex-direction: column; flex: 1; {est}"><span>{nombre}</span>{d}</div><span style="{D}; font-size: 16px; font-weight: 600; {est}">{cant}</span></div>'

compras = "\n".join([
 header("‹ Semana", "COMPRAS", "", "MenuSemana.dc.html"),
 seg(["7 días", "14 días"], "7 días"),
 nota("Del lun 16 al dom 22 · 3 días Z2, 2 intensos, 1 largo y 1 de descanso. Peso en crudo, como lo compras."),
 '<section style="display: flex; flex-direction: column">', etiqueta("PROTEÍNA"),
 item("Pechuga de pollo", "2,6 kg", "almuerzos y wraps · o cambia parte por lomo de cerdo o res"),
 item("Huevos", "14"),
 item("Queso light", "850 g", "28 tajadas", ultimo=True), '</section>',
 '<section style="display: flex; flex-direction: column">', etiqueta("CARBOHIDRATOS"),
 item("Pan de agua precocido", "3 fundas", "18 panes"),
 item("Arroz integral", "300 g", "crudo · 4½ tazas cocido"),
 item("Arroz blanco", "350 g", "crudo · 5½ tazas cocido"),
 item("Tortillas de trigo", "10", "1 paquete de 10", hecho=True),
 item("Galletas integrales", "34", "≈ 2 paquetes"),
 item("Miel de abeja", "1 frasco", "", ultimo=True), '</section>',
 '<section style="display: flex; flex-direction: column">', etiqueta("FRUTAS, VERDURAS Y LÁCTEOS"),
 item("Leche descremada", "2,5 L"),
 item("Papaya", "1 mediana"),
 item("Piña", "1 grande"),
 item("Banano", "7"),
 item("Lechuga, tomate, pepino", "1 · 7 · 2"),
 item("Almendras", "100 g", "", ultimo=True), '</section>',
 '<section style="display: flex; flex-direction: column">', etiqueta("PARA LA SALIDA DEL SÁBADO"),
 item("Geles", "4"), item("Bebida isotónica", "2 botellas", "", ultimo=True), '</section>',
 nota("Marca lo que ya tienes en casa. La lista se arma con tu menú tipo y el plan del coach."),
])

ON = "font-weight: 700; text-decoration: none; color: #FF6A1A"
for k, t, h, cuerpo in [("MenuSemana", "Menú de la semana", 1080, semana), ("MenuDia", "Menú del día", 1100, dia), ("Compras", "Lista de compras", 1300, compras)]:
    open(f"{k}.dc.html", "w", encoding="utf-8").write(pagina(t, h, cuerpo, True, "Comidas"))
print("ok")
