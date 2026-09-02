# LA FÁBRICA DE MODELOS (Blender 5.1.2 por API — regalo de SER, 19-ago).
# Genera los .glb artesanos de la casa: cuchara tallada, tetera, taza y tarro de cristal.
# Uso headless:  blender -b --python fabrica_blender.py
# Uso EN DIRECTO (SER mirando):  blender --python fabrica_blender.py -- --show
import bpy, bmesh, math, sys, os

SALIDA = "/home/ser/Documentos/PETRA-WEBSITE-TÉ/web/public/modelos"
SHOW = "--show" in sys.argv

def limpiar():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

def mat(nombre, color, rough=0.6, metal=0.0, transmission=0.0, ior=1.45):
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    bsdf.inputs["IOR"].default_value = ior
    return m

MADERA_CEREZO = (0.42, 0.22, 0.12)
MADERA_CLARA  = (0.62, 0.45, 0.28)
BARRO         = (0.55, 0.25, 0.15)
CRISTAL       = (0.92, 0.97, 0.94)
CORCHO        = (0.72, 0.55, 0.35)

def suavizar(obj, subsurf=2):
    m = obj.modifiers.new("sub", "SUBSURF"); m.levels = subsurf; m.render_levels = subsurf
    bpy.ops.object.shade_smooth()

def exportar(nombre):
    for o in bpy.context.scene.objects: o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(SALIDA, f"{nombre}.glb"),
        export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
    )
    print(f"[FÁBRICA] {nombre}.glb exportado")

# ── CUCHARA TALLADA (la artesanía de Erik) ────────────────────────────
def _cuchara_piezas(escala=1.0, largo=1.0, prof=1.0, curva_lat=0.0,
                    segmentos=24, anillos=14, sub_cazo=2, bevel_res=6,
                    nombre_mat="cerezo", color=MADERA_CEREZO, rough=0.55):
    """Geometría de la cuchara, parametrizada. Devuelve [cazo, mango].
    Con los valores por defecto sale EXACTAMENTE la cuchara original."""
    e = escala
    # cazo: media esfera ahuecada
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075 * e, segments=segmentos,
                                         ring_count=anillos, location=(0, 0, 0))
    cazo = bpy.context.object; cazo.name = f"cazo_{nombre_mat}"
    bm = bmesh.new(); bm.from_mesh(cazo.data)
    for v in list(bm.verts):
        if v.co.z > 0.018 * e: bm.verts.remove(v)
    bm.to_mesh(cazo.data); bm.free()
    cazo.scale = (1.0, 1.35, 0.55 * prof)
    sol = cazo.modifiers.new("sol", "SOLIDIFY"); sol.thickness = 0.012 * e
    suavizar(cazo, sub_cazo)
    # mango: curva Bézier con caída natural y bevel
    curva = bpy.data.curves.new("mango", "CURVE"); curva.dimensions = "3D"
    sp = curva.splines.new("BEZIER"); sp.bezier_points.add(3)
    pts = [(0, 0.09, 0.012), (0, 0.19, 0.035), (0, 0.30, 0.028), (0, 0.40, 0.045)]
    for i, (bp, co) in enumerate(zip(sp.bezier_points, pts)):
        t = i / (len(pts) - 1)
        bp.co = (curva_lat * (t ** 2) * e, co[1] * largo * e, co[2] * e)
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    curva.bevel_depth = 0.011 * e; curva.bevel_resolution = bevel_res
    mango = bpy.data.objects.new("mango", curva)
    bpy.context.collection.objects.link(mango)
    bpy.context.view_layer.objects.active = mango; mango.select_set(True)
    bpy.ops.object.convert(target="MESH")
    mango = bpy.context.object; mango.name = f"mango_{nombre_mat}"
    suavizar(mango, 1)
    m = mat(nombre_mat, color, rough)
    for o in (cazo, mango): o.data.materials.append(m)
    return [cazo, mango]

def cuchara():
    limpiar()
    _cuchara_piezas()
    exportar("cuchara")

# ── TETERA DE BARRO (revolución + pico + asa) ─────────────────────────
def tetera():
    limpiar()
    perfil = [(0.0, 0.0), (0.16, 0.0), (0.21, 0.05), (0.23, 0.14), (0.19, 0.24), (0.10, 0.285), (0.065, 0.30)]
    me = bpy.data.meshes.new("perfil"); verts = [(x, 0, z) for x, z in perfil]
    me.from_pydata(verts, [(i, i + 1) for i in range(len(verts) - 1)], [])
    cuerpo = bpy.data.objects.new("tetera", me); bpy.context.collection.objects.link(cuerpo)
    bpy.context.view_layer.objects.active = cuerpo; cuerpo.select_set(True)
    scr = cuerpo.modifiers.new("screw", "SCREW"); scr.axis = "Z"; scr.steps = 32
    sol = cuerpo.modifiers.new("sol", "SOLIDIFY"); sol.thickness = 0.012
    suavizar(cuerpo, 1)
    # pico
    c = bpy.data.curves.new("pico", "CURVE"); c.dimensions = "3D"
    sp = c.splines.new("BEZIER"); sp.bezier_points.add(2)
    for bp, co in zip(sp.bezier_points, [(0.20, 0, 0.12), (0.30, 0, 0.20), (0.34, 0, 0.30)]):
        bp.co = co; bp.handle_left_type = bp.handle_right_type = "AUTO"
    c.bevel_depth = 0.028; c.bevel_resolution = 5
    c.bevel_factor_mapping_end = "SPLINE"; 
    pico = bpy.data.objects.new("pico", c); bpy.context.collection.objects.link(pico)
    bpy.context.view_layer.objects.active = pico; pico.select_set(True)
    bpy.ops.object.convert(target="MESH"); suavizar(bpy.context.object, 1)
    # asa
    c2 = bpy.data.curves.new("asa", "CURVE"); c2.dimensions = "3D"
    sp2 = c2.splines.new("BEZIER"); sp2.bezier_points.add(2)
    for bp, co in zip(sp2.bezier_points, [(-0.21, 0, 0.24), (-0.33, 0, 0.17), (-0.20, 0, 0.06)]):
        bp.co = co; bp.handle_left_type = bp.handle_right_type = "AUTO"
    c2.bevel_depth = 0.016; c2.bevel_resolution = 5
    asa = bpy.data.objects.new("asa", c2); bpy.context.collection.objects.link(asa)
    bpy.context.view_layer.objects.active = asa; asa.select_set(True)
    bpy.ops.object.convert(target="MESH"); suavizar(bpy.context.object, 1)
    # tapa
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075, location=(0, 0, 0.305)); tapa = bpy.context.object
    tapa.scale = (1, 1, 0.55); suavizar(tapa, 1)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.024, location=(0, 0, 0.345)); suavizar(bpy.context.object, 1)
    for o in bpy.context.scene.objects: o.data.materials.append(mat("barro", BARRO, 0.42))
    exportar("tetera")

# ── TAZA ──────────────────────────────────────────────────────────────
def _taza_piezas(escala=1.0, pasos=28, bevel_res=4, sufijo="",
                 nombre_mat="salvia", color=(0.44, 0.50, 0.33)):
    """Geometría de la taza, parametrizada. Devuelve [cuerpo, asa].
    Con los valores por defecto sale EXACTAMENTE la taza original."""
    e = escala
    perfil = [(0.0, 0.0), (0.055, 0.0), (0.068, 0.02), (0.075, 0.09), (0.078, 0.115)]
    me = bpy.data.meshes.new("perfilTaza" + sufijo)
    verts = [(x * e, 0, z * e) for x, z in perfil]
    me.from_pydata(verts, [(i, i + 1) for i in range(len(verts) - 1)], [])
    cuerpo = bpy.data.objects.new("taza" + sufijo, me); bpy.context.collection.objects.link(cuerpo)
    bpy.context.view_layer.objects.active = cuerpo; cuerpo.select_set(True)
    scr = cuerpo.modifiers.new("screw", "SCREW"); scr.axis = "Z"; scr.steps = pasos
    sol = cuerpo.modifiers.new("sol", "SOLIDIFY"); sol.thickness = 0.007 * e
    suavizar(cuerpo, 1)
    c = bpy.data.curves.new("asaT" + sufijo, "CURVE"); c.dimensions = "3D"
    sp = c.splines.new("BEZIER"); sp.bezier_points.add(2)
    for bp, co in zip(sp.bezier_points, [(0.072, 0, 0.095), (0.115, 0, 0.065), (0.068, 0, 0.028)]):
        bp.co = (co[0] * e, co[1] * e, co[2] * e)
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    c.bevel_depth = 0.009 * e; c.bevel_resolution = bevel_res
    asa = bpy.data.objects.new("asaT" + sufijo, c); bpy.context.collection.objects.link(asa)
    bpy.context.view_layer.objects.active = asa; asa.select_set(True)
    bpy.ops.object.convert(target="MESH"); asa = bpy.context.object
    suavizar(asa, 1)
    m = mat(nombre_mat, color, 0.5)
    for o in (cuerpo, asa): o.data.materials.append(m)
    return [cuerpo, asa]

def taza():
    limpiar()
    _taza_piezas()
    exportar("taza")

# ── TARRO DE CRISTAL (con transmisión real → three la lee) ────────────
def tarro():
    limpiar()
    perfil = [(0.0, 0.0), (0.145, 0.0), (0.165, 0.03), (0.165, 0.30), (0.145, 0.355), (0.120, 0.375), (0.118, 0.40)]
    me = bpy.data.meshes.new("perfilTarro"); verts = [(x, 0, z) for x, z in perfil]
    me.from_pydata(verts, [(i, i + 1) for i in range(len(verts) - 1)], [])
    cuerpo = bpy.data.objects.new("tarro", me); bpy.context.collection.objects.link(cuerpo)
    bpy.context.view_layer.objects.active = cuerpo; cuerpo.select_set(True)
    scr = cuerpo.modifiers.new("screw", "SCREW"); scr.axis = "Z"; scr.steps = 32
    sol = cuerpo.modifiers.new("sol", "SOLIDIFY"); sol.thickness = 0.006
    suavizar(cuerpo, 1)
    cuerpo.data.materials.append(mat("cristal", CRISTAL, 0.05, transmission=1.0, ior=1.45))
    bpy.ops.mesh.primitive_cylinder_add(radius=0.112, depth=0.05, location=(0, 0, 0.415)); corcho = bpy.context.object
    suavizar(corcho, 1); corcho.data.materials.append(mat("corcho", CORCHO, 0.9))
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.045, location=(0, 0, 0.462)); tapa = bpy.context.object
    suavizar(tapa, 1); tapa.data.materials.append(mat("cerezo", MADERA_CEREZO, 0.5))
    exportar("tarro")

# ── FUNCIONES ABSORBIDAS DE LA COMUNIDAD (informe deepseek 19-ago, en informes/) ──
# 1) drop-to-floor con raycast — patrón de hannesdelbeke/drop-it (GPL-3), reescrito.
def apoyar_en_suelo(obj, suelo_z=0.0):
    """Baja el objeto hasta que su vértice más bajo toca el suelo (o la malla de debajo)."""
    import mathutils
    dg = bpy.context.evaluated_depsgraph_get()
    origen = mathutils.Vector(obj.location)
    hit, loc, normal, *_ = bpy.context.scene.ray_cast(dg, origen, mathutils.Vector((0, 0, -1)), distance=1000)
    minz = min((obj.matrix_world @ v.co).z for v in obj.data.vertices)
    destino = loc.z if hit else suelo_z
    obj.location.z += destino - minz
    return obj

# 2) colocación 2D sin solapes con gap — patrón de roomicon core/placement.py (GPL-3), reescrito.
def colocar_sin_solape(huella, colocados, area, gap=0.06, max_intentos=60, rng=None):
    """huella=(w,d); area=(x0,z0,x1,z1). Devuelve (x,z) libre o None. AABB 2D + gap."""
    import random
    rng = rng or random
    w, d = huella
    def choca(x, z):
        for (cx, cz, cw, cd) in colocados:
            if abs(x - cx) < (w + cw) / 2 + gap and abs(z - cz) < (d + cd) / 2 + gap:
                return True
        return False
    for _ in range(max_intentos):
        x = rng.uniform(area[0] + w / 2, area[2] - w / 2)
        z = rng.uniform(area[1] + d / 2, area[3] - d / 2)
        if not choca(x, z):
            colocados.append((x, z, w, d))
            return (x, z)
    return None

# 3) apoyo sobre superficie con espaciado — patrón de BlenderProc OnSurfaceSampler (GPL-3), reescrito.
def colocar_en_superficie(obj, superficie, ya_puestos, min_dist=0.12, max_intentos=40, rng=None):
    """Coloca obj sobre el AABB superior de `superficie` sin acercarse a `ya_puestos`."""
    import random, mathutils
    rng = rng or random
    bb = [superficie.matrix_world @ mathutils.Vector(c) for c in superficie.bound_box]
    top = max(v.z for v in bb)
    xs = sorted(v.x for v in bb); zs = sorted(v.y for v in bb)
    for _ in range(max_intentos):
        x = rng.uniform(xs[0] + 0.05, xs[-1] - 0.05)
        y = rng.uniform(zs[0] + 0.05, zs[-1] - 0.05)
        if all((mathutils.Vector((x, y, 0)) - mathutils.Vector((px, py, 0))).length >= min_dist
               for (px, py) in ya_puestos):
            obj.location = (x, y, top)
            bpy.context.view_layer.update()   # bpy 5.1: sin esto matrix_world va OBSOLETA (medido, C3)
            minz = min((obj.matrix_world @ v.co).z for v in obj.data.vertices)
            obj.location.z += top - minz
            ya_puestos.append((x, y))
            return True
    return False

# ── UTILIDADES DE COMPOSICIÓN (para que las 3 funciones de arriba se usen de verdad) ──
SEMILLA = 20260819   # fija → misma escena en cada compilación

def _solo(obj):
    """Deja SOLO obj seleccionado y activo (bpy 5.x: los ops van por contexto)."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True); bpy.context.view_layer.objects.active = obj
    return obj

def _aplicar(obj):
    """Aplica los modificadores → la malla real. Sin esto, apoyar/medir mienten."""
    _solo(obj); bpy.ops.object.convert(target="MESH")
    o = bpy.context.object; bpy.context.view_layer.update()
    return o

def _unir(objs, nombre):
    """Funde varias piezas en un objeto (una malla = un nodo en el .glb)."""
    objs = [_aplicar(o) for o in objs]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.object; o.name = nombre; o.data.name = nombre
    bpy.context.view_layer.update()
    return o

def _aabb(obj):
    """(minx,miny,minz,maxx,maxy,maxz) en coordenadas de mundo."""
    import mathutils
    bpy.context.view_layer.update()
    pts = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    return (min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts),
            max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))

def _posar(obj, suelo_z=0.0, desde=0.60):
    """Llama a apoyar_en_suelo() ocultando el objeto del raycast.
    Medido en bpy 5.1: si no se oculta, el rayo golpea SU PROPIA malla y no cae nada."""
    obj.location.z = desde
    bpy.context.view_layer.update()
    obj.hide_viewport = True
    bpy.context.view_layer.update()
    apoyar_en_suelo(obj, suelo_z)          # ← función absorbida 1 (raycast a lo de debajo)
    obj.hide_viewport = False
    bpy.context.view_layer.update()
    return obj

def _revolucion(perfil, nombre, pasos, material, escala_y=1.0):
    """Sólido de revolución a partir de un perfil (x,z). Base en z=0."""
    me = bpy.data.meshes.new("perfil_" + nombre)
    me.from_pydata([(x, 0, z) for x, z in perfil],
                   [(i, i + 1) for i in range(len(perfil) - 1)], [])
    ob = bpy.data.objects.new(nombre, me); bpy.context.collection.objects.link(ob)
    _solo(ob)
    scr = ob.modifiers.new("screw", "SCREW"); scr.axis = "Z"; scr.steps = pasos
    suavizar(ob, 1)
    ob.data.materials.append(material)
    ob = _aplicar(ob)
    ob.scale = (1.0, escala_y, 1.0)
    _solo(ob); bpy.ops.object.transform_apply(scale=True)
    bpy.context.view_layer.update()
    return ob

def _zona_util(ancho, fondo, alto_top):
    """Caja auxiliar = rectángulo seguro de una superficie ovalada.
    Se le pasa a colocar_en_superficie() y se borra antes de exportar."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, alto_top - 0.005))
    z = bpy.context.object; z.name = "ZONA_UTIL"
    z.scale = (ancho, fondo, 0.01)
    _solo(z); bpy.ops.object.transform_apply(scale=True)
    bpy.context.view_layer.update()
    return z

def _borrar(obj):
    _solo(obj); bpy.ops.object.delete()

# ── BANDEJA SERVIDA (composición por algoritmo, no a mano) ────────────
def bandeja_servida():
    import random
    rnd = random.Random(SEMILLA)
    limpiar()
    puestos, huellas = [], []          # centros (colocar_en_superficie) · AABB 2D (colocar_sin_solape)

    # 1· la tabla ovalada de madera (perfil revolucionado + aplastado en Y)
    bandeja = _revolucion(
        [(0.0, 0.0), (0.30, 0.0), (0.315, 0.006), (0.315, 0.018), (0.30, 0.024), (0.0, 0.024)],
        "bandeja", 40, mat("nogal", MADERA_CLARA, 0.55), escala_y=0.72)
    _posar(bandeja)                                   # ABSORBIDA 1: la bandeja al suelo
    top = _aabb(bandeja)[5]
    zona = _zona_util(0.42, 0.30, top)                # rectángulo inscrito en el óvalo

    # 2· dos tazas — colocadas por ABSORBIDA 3 (apoyo sobre superficie con distancia mínima)
    # min_dist medido, no a ojo: cuerpo r=0.078*0.85=0.066 y asa hasta 0.106 desde el eje;
    # con las asas mirando hacia fuera, 0.17 entre orígenes ya no deja que se toquen.
    for i in range(2):
        t = _unir(_taza_piezas(escala=0.85, pasos=22, bevel_res=3, sufijo=f"_b{i}"), f"taza_{i+1}")
        if colocar_en_superficie(t, zona, puestos, min_dist=0.17, max_intentos=400, rng=rnd):
            t.rotation_euler[2] = math.atan2(t.location.y, t.location.x)  # el asa, hacia fuera
            bpy.context.view_layer.update()
        else:
            print(f"[FÁBRICA] AVISO: no cupo la taza {i+1} — la poso donde esté")
            _posar(t)
        a = _aabb(t); huellas.append(((a[0] + a[3]) / 2, (a[1] + a[4]) / 2, a[3] - a[0], a[4] - a[1]))

    # 3· cucharilla y terrones — sitio por ABSORBIDA 2 (AABB 2D + gap, esquiva las tazas)
    area = (-0.16, -0.10, 0.16, 0.10)
    menudencias = [("cucharilla", None), ("terron_1", 0.024), ("terron_2", 0.024)]
    for nombre, lado in menudencias:
        if lado is None:
            ob = _unir(_cuchara_piezas(escala=0.30, largo=0.80, prof=0.9, segmentos=16,
                                       anillos=10, sub_cazo=1, bevel_res=4,
                                       nombre_mat="cerezo_cucharilla", color=MADERA_CEREZO),
                       "cucharilla")
        else:
            bpy.ops.mesh.primitive_cube_add(size=lado, location=(0, 0, 0))
            ob = bpy.context.object; ob.name = nombre
            bv = ob.modifiers.new("bev", "BEVEL"); bv.width = 0.0035; bv.segments = 2
            _solo(ob); suavizar(ob, 0)
            ob.data.materials.append(mat("azucar", (0.93, 0.91, 0.86), 0.85))
            ob = _aplicar(ob); ob.name = nombre; ob.data.name = nombre
        a = _aabb(ob); w, d = a[3] - a[0], a[4] - a[1]
        sitio = colocar_sin_solape((w, d), huellas, area, gap=0.012, max_intentos=400, rng=rnd)
        if sitio is None:
            print(f"[FÁBRICA] AVISO: sin hueco para {nombre}"); continue
        cx, cy = (a[0] + a[3]) / 2, (a[1] + a[4]) / 2   # el origen no es el centro del AABB
        ob.location.x += sitio[0] - cx; ob.location.y += sitio[1] - cy
        bpy.context.view_layer.update()
        _posar(ob)                                     # ABSORBIDA 1: cae sobre la tabla, sin flotar

    _borrar(zona)
    for o in bpy.context.scene.objects:
        a = _aabb(o); print(f"[BANDEJA] {o.name:14s} z=[{a[2]:+.4f} .. {a[5]:+.4f}]  top_tabla={top:.4f}")
    exportar("bandeja_servida")

# ── TRES CUCHARAS VARIADAS SOBRE UN PAÑO (variación procedural) ───────
def cucharas_variadas():
    import random
    rnd = random.Random(SEMILLA + 7)
    limpiar()
    # el paño: plano subdividido con arrugas suaves (el raycast se apoyará en ellas)
    ancho, fondo = 0.72, 0.46
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    pano = bpy.context.object; pano.name = "pano"
    pano.scale = (ancho, fondo, 1); _solo(pano); bpy.ops.object.transform_apply(scale=True)
    bm = bmesh.new(); bm.from_mesh(pano.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=7, use_grid_fill=True)
    for v in bm.verts:
        borde = abs(abs(v.co.x) - ancho / 2) < 1e-4 or abs(abs(v.co.y) - fondo / 2) < 1e-4
        v.co.z += rnd.uniform(-0.0008, 0.0008) if borde else rnd.uniform(0.0, 0.0065)
    bm.to_mesh(pano.data); bm.free()
    sol = pano.modifiers.new("sol", "SOLIDIFY"); sol.thickness = 0.004
    _solo(pano); suavizar(pano, 1)
    pano.data.materials.append(mat("lino", (0.80, 0.76, 0.66), 0.92))
    pano = _aplicar(pano); pano.name = "pano"; pano.data.name = "pano"

    # tres cucharas de Erik: ninguna igual a otra (semilla → largo, cazo, curvatura, tono)
    huellas = []
    banda = (-0.23, -0.005, 0.23, 0.005)      # fila: la Y queda clavada, la separación es en X
    for i in range(3):
        # muestreo estratificado: cada cuchara saca su rango → nunca salen dos gemelas
        largo = 0.85 + (i + rnd.random()) * 0.10                    # mango ±15 %
        prof  = 0.80 + ((i + 2) % 3 + rnd.random()) * 0.1333        # cazo, sin correlacionar
        lat   = rnd.uniform(-0.028, 0.028)                 # curvatura lateral
        tono  = tuple(max(0.0, c * rnd.uniform(0.72, 1.30)) for c in MADERA_CEREZO)
        cu = _unir(_cuchara_piezas(escala=0.62, largo=largo, prof=prof, curva_lat=lat,
                                   segmentos=18, anillos=11, sub_cazo=1, bevel_res=4,
                                   nombre_mat=f"cerezo_{i+1}", color=tono,
                                   rough=rnd.uniform(0.42, 0.66)),
                   f"cuchara_{i+1}")
        cu.rotation_euler[2] = rnd.uniform(-0.10, 0.10)    # ligero giro, natural
        bpy.context.view_layer.update()
        a = _aabb(cu); w = a[3] - a[0]
        sitio = colocar_sin_solape((w, 0.02), huellas, banda, gap=0.022,
                                   max_intentos=500, rng=rnd)   # ABSORBIDA 2: la fila sin solape en X
        if sitio is None:
            print(f"[FÁBRICA] AVISO: sin hueco para cuchara_{i+1}"); continue
        cx, cy = (a[0] + a[3]) / 2, (a[1] + a[4]) / 2
        cu.location.x += sitio[0] - cx; cu.location.y += -cy      # centrada en el paño
        bpy.context.view_layer.update()
        _posar(cu)                                              # ABSORBIDA 1: apoyo real en la tela
        b = _aabb(cu)
        print(f"[CUCHARAS] cuchara_{i+1} largo={largo:.2f} prof={prof:.2f} curva={lat:+.3f} "
              f"x=[{b[0]:+.3f} .. {b[3]:+.3f}] z_min={b[2]:+.4f}")
    exportar("cucharas_variadas")

if SHOW:
    # EN DIRECTO: construir pieza a pieza con pausas para que SER lo vea
    piezas = [cuchara, tetera, taza, tarro, bandeja_servida, cucharas_variadas]
    def paso():
        if piezas:
            piezas.pop(0)()
            return 3.5
        print("[FÁBRICA] fin del directo — los .glb están exportados")
        return None
    bpy.app.timers.register(paso, first_interval=2.0)
else:
    cuchara(); tetera(); taza(); tarro()
    bandeja_servida(); cucharas_variadas()
    print("[FÁBRICA] 6 modelos exportados a", SALIDA)
