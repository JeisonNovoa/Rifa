/** Contenido editorial de la rifa (textos del flyer oficial "Gran Rifa"). */

export interface Destino {
  nombre: string;
  descripcion: string;
  detalle: string;
  /** Lo más destacado del lugar */
  atractivos: readonly string[];
  /** Itinerario día a día (referencia; el operador final puede variar) */
  itinerario: ReadonlyArray<{ dia: string; plan: string }>;
}

export const DESTINOS: readonly Destino[] = [
  {
    nombre: 'Norcasia, Caldas',
    descripcion:
      'Embalse Amaní, río La Miel y cascadas esmeralda: lancha, body rafting y pozos naturales.',
    detalle: 'Plan para 2 personas · 2 días, 1 noche',
    atractivos: [
      'Paseo en lancha por el Embalse Amaní',
      'Cascada La Clara',
      'Body rafting en el cañón del río La Miel',
      'Pozos cristalinos del río Manso',
    ],
    itinerario: [
      {
        dia: 'Día 1',
        plan: 'Caminata a la Cascada La Clara, recorrido en lancha por el cañón del río La Miel, body rafting y almuerzo típico. Noche en hotel o cabaña.',
      },
      {
        dia: 'Día 2',
        plan: 'Navegación por el Embalse Amaní hasta la presa, baño en los pozos naturales del río Manso y almuerzo antes del regreso.',
      },
    ],
  },
  {
    nombre: 'Cañón del Río Güejar',
    descripcion:
      'Rafting de 17 km entre cañones, cascadas y valles escondidos en Mesetas, Meta.',
    detalle: 'Plan para 2 personas · 2 días, 1 noche',
    atractivos: [
      'Rafting de 17 km (nivel III)',
      'Cañón con rocas de más de 30 metros',
      'Valle de las Hadas y cascadas',
      'Jacuzzis y toboganes naturales',
    ],
    itinerario: [
      {
        dia: 'Día 1',
        plan: 'Traslado al punto de embarque, charla de seguridad y descenso de 17 km por el cañón con paradas en cascadas y zonas para nadar. Almuerzo en finca ecoturística y noche en cabaña.',
      },
      {
        dia: 'Día 2',
        plan: 'Senderismo y baño en cascada (o tubing en el río Cafre), visita a jacuzzis naturales y almuerzo antes del regreso.',
      },
    ],
  },
] as const;

/** Sellos del flyer: qué incluye el premio */
export const INCLUYE_PREMIO = [
  'Planes turísticos confiables',
  'Alojamiento confortable',
  'Alimentación incluida',
  'Experiencias inolvidables',
] as const;

export const AVISOS_SEGURIDAD = [
  'Nunca te pediremos claves ni datos de tu banco.',
  'El pago se hace directo al Nequi del organizador; guarda tu comprobante.',
  'Si no completas el primer pago, tu número se libera solo y otra persona puede tomarlo.',
] as const;

/** WhatsApp de contacto del flyer (300 758 3856) */
export const WHATSAPP_CONTACTO = '3007583856';

export const FRASE_FOOTER = 'Viajar es vivir, y cada destino deja una historia ♡';

export const TEXTO_LEGAL =
  'Premios no canjeables por dinero · Aplica reglamento · Autoriza: Viaja por Colombia';
