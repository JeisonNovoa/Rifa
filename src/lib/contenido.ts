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
      'Ríos cristalinos, cascadas y montañas: body rafting y senderismo por el río La Miel, la Cascada La Clara y los ríos Amaní y Manso.',
    detalle: 'Plan para 2 personas · 2 días, 2 noches · Todo incluido',
    atractivos: [
      'Body rafting en el río La Miel',
      'Cascada La Clara',
      'Senderismo por la ribera del río Amaní',
      'Body rafting en el río Manso',
    ],
    itinerario: [
      {
        dia: 'Noche 1 · Llegada',
        plan: 'Llegada a Norcasia, check-in en el hospedaje, cena y descanso.',
      },
      {
        dia: 'Día 1 · Río La Miel + Cascada La Clara',
        plan: 'Desayuno, caminata ecológica y body rafting por el río La Miel, almuerzo tipo fiambre y visita a la Cascada La Clara. Regreso al hotel, cena y noche libre.',
      },
      {
        dia: 'Día 2 · Río Amaní + Río Manso',
        plan: 'Desayuno, senderismo por la ribera del río Amaní y body rafting en el río Manso. Almuerzo y cierre del plan al mediodía.',
      },
    ],
  },
  {
    nombre: 'Güejar + Paraíso, Meta',
    descripcion:
      'Aventura entre ríos, senderos y cascadas: senderismo por el Paraíso de Cascadas y rafting por el cañón del río Güejar, saliendo desde Mesetas.',
    detalle: 'Plan para 2 personas · 2 días, 1 noche · Todo incluido',
    atractivos: [
      'Senderismo y baño recreativo en el Paraíso de Cascadas',
      'Rafting recreativo por el cañón del río Güejar',
      'Cascadas y pozas naturales',
    ],
    itinerario: [
      {
        dia: 'Día 1 · Paraíso de Cascadas',
        plan: 'Encuentro y desayuno a las 7:30 a. m., senderismo con visita a cascadas y pozas, y almuerzo. Al regreso, ingreso al hospedaje, descanso y cena. Dificultad media (2/5).',
      },
      {
        dia: 'Día 2 · Cañón del Güejar',
        plan: 'Desayuno, inducción y rafting recreativo por el cañón del río Güejar. Almuerzo y regreso; el plan cierra hacia las 4:00 p. m. Dificultad media (3/5).',
      },
    ],
  },
] as const;

/** Sellos del premio: lo que incluyen ambos planes del operador */
export const INCLUYE_PREMIO = [
  'Todo incluido: hospedaje y alimentación',
  'Transporte local a las actividades',
  'Guías certificados',
  'Seguro de asistencia médica',
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
