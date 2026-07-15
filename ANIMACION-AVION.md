# Animación del avioncito que vuela con el scroll

> **Documento de handoff**: escrito para que cualquier persona o IA pueda
> entender, continuar y terminar esta funcionalidad SIN contexto previo.
> Estado al 15-jul-2026: **aprobada por el dueño tras verla en su navegador,
> commiteada y publicada en producción** (rifa.fly.dev).

## Qué se pidió (requisito original del dueño)

En la página principal de la rifa hay un avioncito de papel decorativo
(`RutaAvion`). Se quiere que:

1. Al hacer **scroll hacia abajo**, el avión "vuele" página abajo acompañando
   a la persona.
2. Al hacer **scroll hacia arriba**, se devuelva por la misma ruta.
3. Pueda **pasar por detrás de los componentes** (tarjetas, tablero), como un
   3D simulado.
4. Que quede **muy bien hecho** (fluido, sin romper nada, accesible).

## Decisión técnica: GSAP

Se usa **GSAP 3 + ScrollTrigger + MotionPathPlugin** (`npm i gsap`, ya está en
`package.json`). Razones:

- `ScrollTrigger` con `scrub` es el estándar para animación ligada al scroll
  con suavizado (el avión "persigue" el scroll con inercia, se siente vivo).
- `MotionPathPlugin` mueve un elemento por una curva que pasa por puntos
  arbitrarios (`curviness`) y lo **auto-rota** siguiendo la tangente.
- GSAP es gratis (incluidos todos los plugins) desde la versión 3.13.
- Alternativas descartadas: CSS `animation-timeline: scroll()` + `offset-path`
  (sin soporte confiable en iOS/WebKit viejo, y el público objetivo entra por
  WhatsApp en el celular) y framer-motion (peor encaje para "seguir ruta").

## Arquitectura (cómo funciona)

Todo el código nuevo vive en
[`src/components/decoracion/AvionVolador.tsx`](src/components/decoracion/AvionVolador.tsx)
(componente cliente montado al final de [`src/app/page.tsx`](src/app/page.tsx)).

### 1. Dos capas absolutas sobre TODO el documento

Dentro del `div.relative` raíz del home (que envuelve todas las secciones):

- **Capa estela** (`z-0`): un `<svg>` del tamaño del documento con la ruta
  punteada dorada. Se va **dibujando** a medida que el avión avanza (y se
  des-dibuja al devolverse) con la técnica de máscara: un trazo sólido en un
  `<mask>` anima su `stroke-dashoffset` de `L → 0`, revelando la ruta punteada
  de abajo. Siempre queda DETRÁS de las secciones.
- **Capa avión** (`z-30` o `z-0`): contiene el avioncito (mismo path SVG del
  glifo de `RutaAvion`). Su `z-index` **salta** entre 30 (al frente) y 0
  (al fondo) según el tramo de la ruta — ese es el truco del "3D simulado".

Ambas con `pointer-events: none` y `aria-hidden` (decorativas).

### 2. El "3D simulado" (oclusión real por z-index)

Las secciones que pueden tapar el avión llevan `relative z-10`:

- Destinos → [`src/components/rifa/Destinos.tsx`](src/components/rifa/Destinos.tsx)
- Tablero (`#numeros`) y footer → [`src/app/page.tsx`](src/app/page.tsx)
- Cómo funciona → [`src/components/rifa/ComoFunciona.tsx`](src/components/rifa/ComoFunciona.tsx)

Con el avión "al fondo" (`z-0` < `z-10`) las tarjetas lo tapan de verdad;
como las tarjetas tienen fondos semitransparentes (`bg-noche-900/40`…70),
se le ve pasar tenuemente por detrás — ayuda muchísimo a la ilusión.
Además, al pasar al fondo el avión se **encoge** (scale 0.5) y **atenúa**
(opacity 0.45): profundidad vendida. El salto de z-index ocurre a MITAD del
tramo de transición, cuando el avión está pequeño, para que no se note.

Jerarquía z completa: estela `0` → avión-fondo `0` → secciones `10` →
avión-frente `30` → barra de selección fija `50` → diálogos (top layer).

### 3. La ruta se MIDE, no está dibujada a mano

`medirRuta()` calcula ~11 waypoints en coordenadas de documento a partir de
los elementos reales:

| # | Ancla (selector) | Escena |
|---|------------------|--------|
| 1 | `[data-avion-pista]` del hero (svg `RutaAvion`) | **Despegue** exacto sobre el avioncito estático |
| 2 | borde derecho de la página | vuelo abierto, frente |
| 3 | 2ª tarjeta de destinos (`[aria-labelledby="titulo-destinos"] ol > li:nth(2)`) | **se clava POR DETRÁS** de la tarjeta |
| 4–5 | esquina de la tarjeta y borde izquierdo | reaparece al frente y planea |
| 6–7 | `#numeros` (tablero) | **cruza el tablero en diagonal por el fondo** |
| 8 | sale por la derecha del tablero | frente |
| 9 | costado derecho de `#como-funciona` | acompaña el paso a paso |
| 10–11 | `[data-avion-pista]` del footer | aproximación y **aterrizaje** |

Por eso se adapta sola a móvil/desktop (las X se limitan a los bordes con
`margenBorde`). Si se reordena el home hay que ajustar esta tabla/función.

### 4. Sincronización scroll ⇄ vuelo

Una única `gsap.timeline` (duración normalizada `0→1`) con
`scrollTrigger: { trigger: body, start: 'top top', end: 'bottom bottom', scrub: 1.2 }`.
En paralelo dentro de la timeline:

- `motionPath` por los waypoints (`curviness: 1.3`, `autoRotate: 22` — el
  glifo apunta ~22° arriba-derecha en su viewBox, ese offset lo alinea con la
  tangente).
- Tweens de `scale`/`opacity` por tramo + `set` de `zIndex` (posicionados con
  fracciones de avance aproximadas por distancias en línea recta entre
  waypoints — `calcularFracciones`).
- `stroke-dashoffset` de la máscara de la estela (mismo ritmo del avión).

El scrub hace que **subir el scroll = reproducir la timeline al revés**
(requisito 2 gratis). Extra: al cambiar el sentido, el glifo se voltea
(`scaleX: -1` con tween corto) para mirar hacia donde viaja
(`CONFIG.voltearAlSubir`).

### 5. Pistas de despegue/aterrizaje

`RutaAvion` ahora acepta la prop `pista` → pone `data-avion-pista` en su svg.
La usan el hero ([`HeroRifa.tsx`](src/components/rifa/HeroRifa.tsx)) y el
footer ([`page.tsx`](src/app/page.tsx)). Al iniciar el vuelo, el componente
agrega la clase `vuelo-avion-activo` al `<html>` y
[`globals.css`](src/app/globals.css) oculta el **avioncito estático** de ambas
pistas (las rutas punteadas quedan): el avión animado despega/aterriza
exactamente en esos puntos, así que visualmente es "el mismo" avión.

### 6. Robustez

- **Reduced motion**: si `prefers-reduced-motion: reduce`, NO se inicializa
  nada; quedan los avioncitos estáticos de siempre.
- **Layout cambiante** (fuentes, tarjeta "MisBoletas" que aparece tras
  verificar contra el servidor, imágenes): un `ResizeObserver` sobre `body`
  detecta cambios de tamaño del documento y **reconstruye todo** (debounce
  300 ms). El progreso no se pierde: depende solo del scroll.
- **Rifa cerrada**: si faltan anclas (`medirRuta()` devuelve null o <4
  puntos), no vuela nada y no rompe.
- **Limpieza**: `gsap.context().revert()` al desmontar + se quita la clase.
- Solo se animan `transform`/`opacity` (+ `stroke-dashoffset` en svg):
  compositor-friendly. `will-change: transform` en el avión.

## Perillas de ajuste (todas en `CONFIG` del componente)

| Perilla | Valor | Qué controla |
|---|---|---|
| `scrub` | `1.2` | Segundos de "persecución" del scroll. Más = más flotado |
| `curvatura` | `1.3` | Qué tan curvas son las trayectorias entre puntos |
| `offsetRotacion` | `22` | Alineación del glifo con la tangente (no tocar salvo cambiar el glifo) |
| `zFrente` / `zFondo` | `30` / `0` | Capas del truco 3D (secciones están en 10) |
| `escalaFondo` / `opacidadFondo` | `0.5` / `0.45` | Cuánto se "aleja" al pasar por detrás |
| `tamano` | `44` px | Tamaño del avión |
| `mostrarEstela` | `true` | Apagar la ruta punteada si distrae o pesa |
| `voltearAlSubir` | `true` | Espejo del glifo al invertir el scroll |
| `margenBorde` | `24` px | Distancia mínima de la ruta a los bordes |

## Estado actual y pendientes

**Verificado programáticamente** (dev server local, 15-jul-2026):

- [x] El vuelo se inicializa: clase `vuelo-avion-activo` puesta, 2 capas
      montadas, avión posicionado EXACTO sobre la pista del hero
      (transform coincide con el punto 0 de la ruta medida)
- [x] Estela: `d` generado por MotionPathPlugin, `dashoffset` = largo total
      (ruta sin dibujar en scroll 0, correcto)
- [x] Regla CSS de las pistas correcta (ver nota del entorno abajo)
- [x] Reduced motion, reconstrucción por resize, teardown limpio (por código)
- [x] `tsc` y `eslint` en verde; consola y servidor sin errores
- [x] `npm run build` de producción compila con GSAP

**Validación visual**: hecha por el dueño en su navegador (15-jul-2026) y
aprobada para publicar.

### ⚠️ Nota sobre el entorno de preview embebido (para quien depure con IA)

El panel de navegador embebido de Claude Code corría con
`document.visibilityState === "hidden"`. Chromium en pestañas ocultas
**pausa `requestAnimationFrame`** (GSAP no tickea), **congela las
transiciones del compositor** (una `transition` de `opacity` se queda
eternamente en su valor inicial → parece que el CSS "no aplica" aunque
esté perfecto) y los screenshots salen negros o dan timeout. Se comprobó
inyectando `transition: none !important`: la opacidad computó `0` al
instante, o sea la regla siempre estuvo bien. Moraleja: **no depurar
"CSS que no aplica" en ese panel sin revisar antes `visibilityState`**;
validar visualmente en un navegador de verdad.

**Pendiente / ideas si se quiere pulir más** (no bloqueante):

- [ ] Probar en un celular REAL vía la URL de red del dev server (el tramo
      del tablero en pantallas muy angostas es el más sensible; ajustar
      waypoints 6–7 si se ve apretado).
- [ ] Ajuste fino de la coreografía al gusto del dueño (dónde se clava,
      cuánto tiempo va al fondo). Todo está en `medirRuta()`.
- [ ] Posible mejora: desvanecer la estela vieja (hoy queda dibujada toda la
      ruta recorrida; con gradiente a lo largo del path es complejo en SVG,
      se decidió dejarla — combina con la estética "mapa de ruta" del flyer).
- [ ] Detalle conocido (menor): las secciones con `.revelar` entran con
      `translateY(16px)`; si la ruta se mide antes de que se revelen, los
      waypoints quedan ~16 px corridos (≈0.4% de la ruta, imperceptible).
      Si molestara, la solución es medir descontando el transform actual
      del ancla o re-medir tras el primer scroll completo.
- [ ] Si algún día se quiere en la página de boleta, extraer `medirRuta()` a
      un archivo de "coreografías" por página.

## Cómo probar

```bash
npm run dev   # http://localhost:3000
```

Scrollear despacio y rápido, subir y bajar, redimensionar la ventana, probar
con "reducir movimiento" activado en el sistema (no debe volar), y con la
rifa cerrada (no debe romper).

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/components/decoracion/AvionVolador.tsx` | **NUEVO** — toda la lógica |
| `src/app/page.tsx` | monta `<AvionVolador />`, `pista` en RutaAvion del footer, `relative z-10` en `#numeros` y footer |
| `src/components/decoracion/RutaAvion.tsx` | prop `pista` (`data-avion-pista`) |
| `src/components/rifa/HeroRifa.tsx` | `pista` en su RutaAvion |
| `src/components/rifa/Destinos.tsx` | `relative z-10` en la sección |
| `src/components/rifa/ComoFunciona.tsx` | `relative z-10` en la sección |
| `src/app/globals.css` | regla `.vuelo-avion-activo [data-avion-pista] g` |
| `package.json` / `package-lock.json` | dependencia `gsap` |

> **Para quien continúe**: la animación ya está en producción. Cualquier
> ajuste fino se hace en `CONFIG` o `medirRuta()` de `AvionVolador.tsx`,
> se prueba con `npm run dev` y se publica con `fly deploy --app rifa`.
