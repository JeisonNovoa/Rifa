"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/* ============================================================================
   AVIÓN VOLADOR — animación de scroll de la página principal
   (documentación completa en ANIMACION-AVION.md, en la raíz del repo)

   Qué hace:
   - El avioncito "despega" de la pista punteada del hero y vuela página
     abajo siguiendo una ruta curva, EMPUJADO POR EL SCROLL (scrub): si
     bajas, avanza; si subes, se devuelve por la misma ruta.
   - La ruta se CONSTRUYE MIDIENDO el layout real (hero, tarjetas de
     destinos, tablero, cómo funciona, footer), así se adapta sola a
     móvil/desktop y a cambios de contenido.
   - "3D simulado": en tramos marcados como 'fondo' el avión pasa POR
     DETRÁS de las secciones (z-index) mientras se encoge y se atenúa;
     en tramos 'frente' vuela por encima a tamaño completo.
   - Deja una estela punteada (la ruta se va dibujando/borrando con el
     scroll, con la técnica de máscara + stroke-dashoffset).
   - Aterriza en la pista punteada del footer.

   Piezas que tocan otras partes del código:
   - Las 2 pistas estáticas (hero y footer) llevan data-avion-pista; al
     activarse el vuelo se les oculta SU avioncito estático vía la clase
     global `vuelo-avion-activo` (ver globals.css) para que solo exista
     el avión que vuela.
   - Las secciones que pueden taparlo llevan `relative z-10` (ver
     page.tsx / Destinos.tsx / ComoFunciona.tsx).
   ========================================================================== */

/* ----------------------------- Ajustes ---------------------------------- */
const CONFIG = {
  /** Suavizado del scrub: segundos que tarda en "alcanzar" el scroll. */
  scrub: 1.2,
  /** Qué tan curvas salen las rutas entre puntos (GSAP curviness). */
  curvatura: 1.3,
  /** El glifo del avión apunta ~22° hacia arriba; esto lo alinea con la tangente. */
  offsetRotacion: 22,
  /** z-index de la capa del avión en cada profundidad (secciones = z-10, barra fija = z-50). */
  zFrente: 30,
  zFondo: 0,
  /** Escala/opacidad cuando vuela "por detrás" de los componentes. */
  escalaFondo: 0.5,
  opacidadFondo: 0.45,
  /** Tamaño del avión en px (ancho del svg). */
  tamano: 44,
  /** Mostrar la estela punteada que se dibuja con el vuelo. */
  mostrarEstela: true,
  /** Voltear el glifo al hacer scroll hacia arriba (mira hacia donde viaja). */
  voltearAlSubir: true,
  /** Margen mínimo con los bordes del documento al trazar la ruta. */
  margenBorde: 24,
} as const;

/** Un punto de la ruta con su puesta en escena. */
interface PuntoRuta {
  x: number;
  y: number;
  profundidad: "frente" | "fondo";
  escala: number;
  opacidad: number;
}

export function AvionVolador() {
  const capaEstela = useRef<HTMLDivElement>(null);
  const capaAvion = useRef<HTMLDivElement>(null);
  const avion = useRef<HTMLDivElement>(null);
  const glifo = useRef<SVGSVGElement>(null);
  const trazoEstela = useRef<SVGPathElement>(null);
  const trazoMascara = useRef<SVGPathElement>(null);

  useEffect(() => {
    // Accesibilidad: sin animación si la persona pidió menos movimiento.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: gsap.Context | null = null;

    const iniciar = () => {
      const puntos = medirRuta();
      // Menos de 4 puntos = el DOM esperado no está (p. ej. rifa cerrada
      // cambia secciones). Mejor no volar que volar mal.
      if (!puntos || puntos.length < 4) return;

      ctx = gsap.context(() => {
        construirVuelo(puntos, {
          capaAvion: capaAvion.current!,
          avion: avion.current!,
          glifo: glifo.current!,
          trazoEstela: trazoEstela.current,
          trazoMascara: trazoMascara.current,
        });
      });
      document.documentElement.classList.add("vuelo-avion-activo");
    };

    const reiniciar = () => {
      ctx?.revert();
      ctx = null;
      iniciar();
    };

    iniciar();

    // El layout cambia después del primer render (fuentes, MisBoletas que
    // aparece tras verificar, imágenes): al variar el tamaño del body se
    // reconstruye toda la ruta. El scrub repone el progreso solo, porque
    // depende únicamente de la posición del scroll.
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let tamanoPrevio = "";
    const observador = new ResizeObserver((entradas) => {
      const caja = entradas[0]?.contentRect;
      if (!caja) return;
      const tamano = `${Math.round(caja.width)}x${Math.round(caja.height)}`;
      if (tamano === tamanoPrevio) return;
      tamanoPrevio = tamano;
      clearTimeout(temporizador);
      temporizador = setTimeout(reiniciar, 300);
    });
    observador.observe(document.body);

    return () => {
      observador.disconnect();
      clearTimeout(temporizador);
      ctx?.revert();
      document.documentElement.classList.remove("vuelo-avion-activo");
    };
  }, []);

  return (
    <>
      {/* Estela: SIEMPRE detrás de las secciones (z-0), como mapa de ruta. */}
      {CONFIG.mostrarEstela && (
        <div
          ref={capaEstela}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 text-dorado-400"
        >
          <svg width="100%" height="100%" fill="none">
            <defs>
              {/* La máscara "revela" la ruta punteada a medida que el avión
                  avanza: un trazo sólido cuyo dashoffset va de L a 0. */}
              <mask id="mascara-estela-avion" maskUnits="userSpaceOnUse">
                <path
                  ref={trazoMascara}
                  stroke="white"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="none"
                />
              </mask>
            </defs>
            <path
              ref={trazoEstela}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="0.5 10"
              opacity="0.35"
              fill="none"
              mask="url(#mascara-estela-avion)"
            />
          </svg>
        </div>
      )}

      {/* El avión: su capa alterna z-30 (frente) / z-0 (detrás de secciones z-10). */}
      <div
        ref={capaAvion}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30"
      >
        <div
          ref={avion}
          className="absolute left-0 top-0 opacity-0 will-change-transform"
          style={{ width: CONFIG.tamano }}
        >
          {/* Mismo avioncito de papel de RutaAvion (apunta ~22° arriba-derecha) */}
          <svg
            ref={glifo}
            viewBox="-3 -3 28 24"
            fill="none"
            className="block w-full text-dorado-400"
            style={{ filter: "drop-shadow(0 0 6px rgba(245, 185, 20, 0.35))" }}
          >
            <path d="M0 9 L22 0 L9 11 L11 18 L6 13 L0 9 Z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </>
  );
}

/* ============================================================================
   Medición de la ruta: waypoints en coordenadas del DOCUMENTO, calculados
   a partir de los elementos reales de la página. Si cambias el orden de
   las secciones del home, ajusta aquí la coreografía.
   ========================================================================== */

function medirRuta(): PuntoRuta[] | null {
  const pistas = document.querySelectorAll<SVGSVGElement>("[data-avion-pista]");
  const destinos = document.querySelector<HTMLElement>(
    '[aria-labelledby="titulo-destinos"]'
  );
  const tarjetas = destinos?.querySelectorAll<HTMLElement>("ol > li");
  const numeros = document.querySelector<HTMLElement>("#numeros");
  const como = document.querySelector<HTMLElement>("#como-funciona");
  if (pistas.length < 2 || !destinos || !tarjetas || tarjetas.length < 2 || !numeros || !como) {
    return null;
  }

  const anchoDoc = document.documentElement.clientWidth;
  const enX = (x: number) =>
    Math.min(Math.max(x, CONFIG.margenBorde), anchoDoc - CONFIG.margenBorde);

  /** Rect en coordenadas de documento (no de viewport). */
  const rectDoc = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      izq: r.left + window.scrollX,
      der: r.right + window.scrollX,
      arriba: r.top + window.scrollY,
      abajo: r.bottom + window.scrollY,
      ancho: r.width,
      alto: r.height,
    };
  };

  const pistaHero = rectDoc(pistas[0]);
  const pistaFooter = rectDoc(pistas[pistas.length - 1]);
  // En desktop hay 2 tarjetas lado a lado (la 2ª queda a la derecha);
  // en móvil van apiladas (la 2ª queda abajo). Ambos casos funcionan.
  const tarjeta2 = rectDoc(tarjetas[1]);
  const tablero = rectDoc(numeros);
  const pasos = rectDoc(como);

  const frente = { profundidad: "frente" as const, escala: 1, opacidad: 1 };
  const fondo = {
    profundidad: "fondo" as const,
    escala: CONFIG.escalaFondo,
    opacidad: CONFIG.opacidadFondo,
  };

  return [
    // 1. Despegue: exactamente donde está el avioncito estático del hero.
    {
      x: enX(pistaHero.izq + pistaHero.ancho * 0.92),
      y: pistaHero.arriba + pistaHero.alto * 0.28,
      ...frente,
    },
    // 2. Se abre hacia el borde derecho bajando hacia los destinos.
    { x: enX(anchoDoc * 0.9), y: tarjeta2.arriba - 60, ...frente },
    // 3. SE CLAVA POR DETRÁS de la tarjeta del 2º destino (Güejar).
    {
      x: enX(tarjeta2.izq + tarjeta2.ancho * 0.55),
      y: tarjeta2.arriba + tarjeta2.alto * 0.45,
      ...fondo,
    },
    // 4. Reaparece saliendo por la esquina inferior izquierda de la tarjeta.
    { x: enX(tarjeta2.izq - 40), y: tarjeta2.abajo + 40, ...frente, escala: 1.05 },
    // 5. Planea por el borde izquierdo entre destinos y tablero.
    {
      x: enX(0),
      y: (tarjeta2.abajo + tablero.arriba) / 2 + 40,
      ...frente,
    },
    // 6. Entra al tablero y lo CRUZA EN DIAGONAL por detrás de las casillas.
    {
      x: enX(tablero.izq + tablero.ancho * 0.25),
      y: tablero.arriba + tablero.alto * 0.3,
      ...fondo,
    },
    {
      x: enX(tablero.izq + tablero.ancho * 0.75),
      y: tablero.arriba + tablero.alto * 0.72,
      ...fondo,
    },
    // 7. Sale por la derecha del tablero, de vuelta al frente.
    { x: enX(anchoDoc), y: tablero.abajo - 30, ...frente, escala: 1.05 },
    // 8. Acompaña el "paso a paso" por el costado derecho.
    {
      x: enX(pasos.der + 46),
      y: pasos.arriba + pasos.alto * 0.5,
      ...frente,
      escala: 0.95,
    },
    // 9. Aproximación final y ATERRIZAJE en la pista del footer.
    { x: enX(anchoDoc * 0.24), y: pistaFooter.arriba - 40, ...frente },
    {
      x: enX(pistaFooter.izq + pistaFooter.ancho * 0.92),
      y: pistaFooter.arriba + pistaFooter.alto * 0.28,
      ...frente,
      escala: 0.9,
    },
  ];
}

/* ============================================================================
   Construcción del vuelo: timeline única (duración normalizada 0→1)
   scrubbeada por un ScrollTrigger que abarca TODA la página.
   ========================================================================== */

interface ElementosVuelo {
  capaAvion: HTMLDivElement;
  avion: HTMLDivElement;
  glifo: SVGSVGElement;
  trazoEstela: SVGPathElement | null;
  trazoMascara: SVGPathElement | null;
}

function construirVuelo(puntos: PuntoRuta[], el: ElementosVuelo) {
  // Fracción de avance (0→1) de cada waypoint, aproximada por la longitud
  // de los tramos rectos entre puntos. Suficiente para sincronizar la
  // puesta en escena (escala/z/opacidad) con la posición sobre la curva.
  const fracciones = calcularFracciones(puntos);

  // Estado inicial: centrado sobre su punto, tamaño/opacidad del punto 0.
  gsap.set(el.avion, {
    xPercent: -50,
    yPercent: -50,
    x: puntos[0].x,
    y: puntos[0].y,
    scale: puntos[0].escala,
    opacity: 1,
    transformOrigin: "50% 50%",
  });
  gsap.set(el.glifo, { transformOrigin: "50% 50%" });
  gsap.set(el.capaAvion, { zIndex: CONFIG.zFrente });

  // Vida propia: un bamboleo sutil independiente del scroll.
  gsap.to(el.glifo, {
    y: 4,
    duration: 1.4,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });

  let direccionPrevia = 1;
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: CONFIG.scrub,
      // Al cambiar el sentido del scroll, el glifo se voltea para "mirar"
      // hacia donde viaja (el espejo se combina con la autorrotación).
      onUpdate: (self) => {
        if (!CONFIG.voltearAlSubir || self.direction === direccionPrevia) return;
        direccionPrevia = self.direction;
        gsap.to(el.glifo, {
          scaleX: self.direction < 0 ? -1 : 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      },
    },
  });

  // 1) El avión recorre la curva que pasa por todos los waypoints.
  tl.to(
    el.avion,
    {
      motionPath: {
        path: puntos.map((p) => ({ x: p.x, y: p.y })),
        curviness: CONFIG.curvatura,
        autoRotate: CONFIG.offsetRotacion,
      },
      duration: 1,
    },
    0
  );

  // 2) Puesta en escena por tramos: escala/opacidad fluyen entre puntos y
  //    el z-index salta a mitad del tramo donde cambia la profundidad
  //    (ahí el avión está pequeño y el corte no se nota).
  for (let i = 1; i < puntos.length; i++) {
    const desde = fracciones[i - 1];
    const tramo = fracciones[i] - desde;
    const punto = puntos[i];
    const anterior = puntos[i - 1];

    if (punto.escala !== anterior.escala || punto.opacidad !== anterior.opacidad) {
      tl.to(
        el.avion,
        { scale: punto.escala, opacity: punto.opacidad, duration: tramo },
        desde
      );
    }
    if (punto.profundidad !== anterior.profundidad) {
      tl.set(
        el.capaAvion,
        { zIndex: punto.profundidad === "fondo" ? CONFIG.zFondo : CONFIG.zFrente },
        desde + tramo * 0.5
      );
    }
  }

  // 3) La estela punteada se dibuja al mismo ritmo del vuelo.
  if (el.trazoEstela && el.trazoMascara) {
    const d = MotionPathPlugin.rawPathToString(
      MotionPathPlugin.arrayToRawPath(
        puntos.map((p) => ({ x: p.x, y: p.y })),
        { curviness: CONFIG.curvatura }
      )
    );
    el.trazoEstela.setAttribute("d", d);
    el.trazoMascara.setAttribute("d", d);
    const largo = el.trazoMascara.getTotalLength();
    gsap.set(el.trazoMascara, {
      strokeDasharray: largo,
      strokeDashoffset: largo,
    });
    tl.to(el.trazoMascara, { strokeDashoffset: 0, duration: 1 }, 0);
  }
}

/** Avance acumulado (0→1) de cada punto según distancias en línea recta. */
function calcularFracciones(puntos: PuntoRuta[]): number[] {
  const distancias = [0];
  let total = 0;
  for (let i = 1; i < puntos.length; i++) {
    total += Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y);
    distancias.push(total);
  }
  return distancias.map((d) => (total === 0 ? 0 : d / total));
}
