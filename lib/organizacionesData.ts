export interface OrganizacionCultural {
  slug: string;
  nombre: string;
  categoria: "danza" | "teatro" | "musica" | "circo-social";
  disciplinas: string[];
  representante: string;
  direccion: string;
  telefonos: string[];
  whatsappPrincipal: string | null;
  sitioWeb: string | null;
  redes: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    x?: string;
    linktree?: string;
  };
  descripcionCorta: string;
  biografiaTrayectoria: string;
  ofertaFormativa: string[];
  anoFundacion?: number;
  terminosBusqueda: string[]; // para relacionar eventos de la BD en Agenda Cultural
}

export const ORGANIZACIONES_CULTURALES: Record<string, OrganizacionCultural> = {
  "lojadanza-ballet-escuela": {
    slug: "lojadanza-ballet-escuela",
    nombre: "Lojadanza Ballet Escuela",
    categoria: "danza",
    disciplinas: ["Ballet Clásico", "Danza Contemporánea", "Jazz", "Baile Moderno"],
    representante: "Aura Ocampo Jaramillo (Directora)",
    direccion: "Sede 1: Casa de la Cultura Ecuatoriana Núcleo de Loja | Sede 2: Sector Parque Infantil, Edificio Senda, 3er piso (Olmedo y González Suárez)",
    telefonos: ["0992872619", "0994601778"],
    whatsappPrincipal: "593992872619",
    sitioWeb: "https://linktr.ee/lojadanza",
    redes: {
      instagram: "https://www.instagram.com/lojadanza/",
      facebook: "https://www.facebook.com/lojadanzaescuela/",
      linktree: "https://linktr.ee/lojadanza",
    },
    descripcionCorta: "Escuela referente de ballet y formación dancística profesional en Loja desde 1995.",
    biografiaTrayectoria: "Fundada en 1995 bajo la dirección de la maestra Aura Ocampo Jaramillo, Lojadanza es una de las instituciones formativas de danza más prestigiosas del sur del Ecuador. Con más de 30 años de trayectoria ininterrumpida, ha formado a generaciones de bailarines desde los 3 años de edad hasta niveles avanzados en ballet clásico, jazz y danza contemporánea, participando activamente en festivales nacionales e internacionales y en la programación anual de la Casa de la Cultura de Loja.",
    ofertaFormativa: [
      "Iniciación al ballet (desde 3 años)",
      "Ballet clásico intermedio y avanzado",
      "Danza contemporánea y jazz",
      "Talleres vacacionales de expresión corporal",
      "Preparación técnica para audiciones profesionales"
    ],
    anoFundacion: 1995,
    terminosBusqueda: ["lojadanza", "loja danza", "aura ocampo"],
  },
  "cano-artes-escenicas": {
    slug: "cano-artes-escenicas",
    nombre: "CANO Artes Escénicas",
    categoria: "teatro",
    disciplinas: ["Teatro", "Musicales", "Producción Escénica", "Formación Actoral"],
    representante: "Santiago Carpio Rodríguez (Director General)",
    direccion: "Loja, Ecuador (Producciones itinerantes en Teatros Bolívar y Benjamín Carrión)",
    telefonos: [],
    whatsappPrincipal: null,
    sitioWeb: null,
    redes: {
      instagram: "https://www.instagram.com/canoartescenicas/",
      facebook: "https://www.facebook.com/CanoArtesEscenicas/",
    },
    descripcionCorta: "Productora líder de espectáculos teatrales, musicales de gran formato y formación actoral en Loja.",
    biografiaTrayectoria: "Dirigida por el reconocido actor y director lojano Santiago Carpio Rodríguez, CANO Artes Escénicas celebra más de una década impulsando las artes escénicas de gran nivel en el país. Creadores de éxitos de taquilla como 'El Cura Sin Cabeza', 'Pinocho el Musical', 'La Leyenda del Padre Almeida' y numerosas obras formativas y didácticas. Su equipo combina actuación, canto y danza en producciones que llenan los teatros más importantes del sur del Ecuador.",
    ofertaFormativa: [
      "Talleres de actuación para niños y jóvenes",
      "Laboratorios de teatro musical",
      "Dirección escénica y expresión vocal",
      "Montajes teatrales didácticos para colegios"
    ],
    anoFundacion: 2016,
    terminosBusqueda: ["cano artes escénicas", "cano artes escenicas", "santiago carpio", "el cura sin cabeza"],
  },
  "reysodance-academia": {
    slug: "reysodance-academia",
    nombre: "ReysoDance Centro de Formación Dancística",
    categoria: "danza",
    disciplinas: ["Ballet Aymara", "Danza Moderna", "Ritmos Latinos", "K-Pop", "Acondicionamiento"],
    representante: "Dirección Artística ReysoDance",
    direccion: "Calle 18 de Noviembre y Lourdes (frente a La Reforma, altos de Gráficas Santiago)",
    telefonos: ["072582306", "072588018", "0980074261"],
    whatsappPrincipal: "593980074261",
    sitioWeb: "https://www.reysodance.com/",
    redes: {
      instagram: "https://www.instagram.com/reysodance/",
      facebook: "https://www.facebook.com/REYSODANCE/",
      x: "https://x.com/REYSODANCE",
    },
    descripcionCorta: "Centro dancístico integral en Loja con elencos representativos y talleres permanentes para todas las edades.",
    biografiaTrayectoria: "ReysoDance es un centro de danza y producción artística consolidado en Loja, reconocido por albergar elencos infantiles y juveniles como el Ballet Aymara Infantil y Aspirantes Aymara. Su propuesta combina la rigurosidad técnica de la danza clásica con ritmos modernos, latinos y danzas urbanas, participando activamente en galas, certámenes y eventos cívicos y culturales en los principales escenarios de la provincia.",
    ofertaFormativa: [
      "Ballet infantil para principiantes",
      "Elencos de formación Aymara",
      "Ritmos latinos (salsa, bachata, merengue)",
      "Talleres anuales (Septiembre a Julio)",
      "Cursos vacacionales recreativos y artísticos"
    ],
    terminosBusqueda: ["reysodance", "reyso dance", "ballet aymara"],
  },
  "cache-dance-studio": {
    slug: "cache-dance-studio",
    nombre: "Caché Dance Studio",
    categoria: "danza",
    disciplinas: ["Hip Hop", "Urbano", "Dancehall", "Commercial Dance", "Ritmos Latinos"],
    representante: "Chino Novillo (Director)",
    direccion: "Calle Azuay entre Juan José Peña y Olmedo, Loja",
    telefonos: ["0998669744"],
    whatsappPrincipal: "593998669744",
    sitioWeb: null,
    redes: {
      instagram: "https://www.instagram.com/cachedancestudio.ec/",
      facebook: "https://www.facebook.com/chinonovillo84/",
      tiktok: "https://www.tiktok.com/@cachedancestudio.ec",
    },
    descripcionCorta: "Academia especializada en danzas urbanas, coreografías comerciales y ritmos latinos en Loja.",
    biografiaTrayectoria: "Caché Dance Studio se ha posicionado como el punto de encuentro de las danzas urbanas en Loja. Con categorías adaptadas para Mini Kids, Kids, Big Kids y Teens, el estudio promueve el movimiento, la disciplina y el trabajo en equipo a través del hip hop, dancehall y estilos urbanos contemporáneos. Participan constantemente en festivales de danza de la Casa de la Cultura y producciones audiovisuales locales.",
    ofertaFormativa: [
      "Mini Kids & Kids Dance (desde 4 años)",
      "Hip Hop y Commercial Dance para jóvenes",
      "Dancehall y Reguetón coreográfico",
      "Cursos vacacionales con actividades artísticas y audiovisuales"
    ],
    terminosBusqueda: ["caché dance", "cache dance", "chino novillo"],
  },
  "maktub-estudio-arte": {
    slug: "maktub-estudio-arte",
    nombre: "Maktub Estudio de Arte",
    categoria: "danza",
    disciplinas: ["Danza Árabe", "Ballet", "Pilates", "Heels", "Street Dance", "K-Pop"],
    representante: "Dirección Artística Maktub",
    direccion: "Av. 24 de Mayo #205-23 entre Rocafuerte y Riofrío, Loja",
    telefonos: ["0993413108"],
    whatsappPrincipal: "593993413108",
    sitioWeb: null,
    redes: {
      instagram: "https://www.instagram.com/maktub__loja/",
      facebook: "https://www.facebook.com/maktubestudiodedanza/",
    },
    descripcionCorta: "Estudio de danza y bienestar enfocado en danza árabe, ballet, expresión corporal femenina y danza moderna.",
    biografiaTrayectoria: "Maktub Estudio de Arte es un espacio multidisciplinario creado para explorar la sensualidad, técnica y expresión de la danza en Loja. Es pionero en la enseñanza técnica de danza árabe y bellydance en la ciudad, combinando su oferta con clases de ballet clásico, heels, pilates para acondicionamiento postural y danza urbana para jóvenes y adultas.",
    ofertaFormativa: [
      "Danza Oriental / Bellydance (técnica y coreografía)",
      "Ballet clásico para niñas y adultas",
      "Clases de Heels (tacones) y Street Dance",
      "Pilates y flexibilidad postural",
      "Vacacionales de baile moderno y K-pop"
    ],
    terminosBusqueda: ["maktub", "maktub estudio", "danza arabe loja"],
  },
  "loxa-dance-escuela": {
    slug: "loxa-dance-escuela",
    nombre: "Loxa Dance Escuela de Baile",
    categoria: "danza",
    disciplinas: ["Baile Urbano", "Ritmos Latinos", "Preparación Coreográfica", "Competencia Internacional"],
    representante: "Paul Landy Correa & Ángel Maldonado (Fundadores)",
    direccion: "Calle Segundo Cueva Celi 110108, Loja",
    telefonos: [],
    whatsappPrincipal: null,
    sitioWeb: "https://linktr.ee/loxa.ec",
    redes: {
      instagram: "https://www.instagram.com/loxadance/",
      facebook: "https://www.facebook.com/loxa.dance/",
      youtube: "https://www.youtube.com/@pauldancer1",
      linktree: "https://linktr.ee/loxa.ec",
    },
    descripcionCorta: "Escuela de baile deportivo y alta competencia, campeones internacionales en All Dance.",
    biografiaTrayectoria: "Loxa Dance ha dejado en alto el nombre de Loja a nivel nacional e internacional. Con múltiples títulos en certámenes globales como All Dance International en Orlando y presentaciones destacadas en el Festival Internacional de Artes Vivas de Loja, esta academia destaca por su fuerza escénica, preparación física de precisión y creatividad en ritmos urbanos y latinos.",
    ofertaFormativa: [
      "Formación para elencos de competencia",
      "Urban Mix y coreografía contemporánea",
      "Baile para eventos y preparación para certámenes",
      "Clases grupales e intensivas"
    ],
    terminosBusqueda: ["loxa dance", "paul landy", "all dance loja"],
  },
  "ballet-ciudaddeloja": {
    slug: "ballet-ciudaddeloja",
    nombre: "Ballet Folclórico Internacional Ciudad de Loja",
    categoria: "danza",
    disciplinas: ["Folclore Andino", "Danza Tradicional Ecuatoriana", "Danzas Latinoamericanas"],
    representante: "Eddy Chininín (Director)",
    direccion: "Loja, Ecuador (Ensayos y presentaciones en recintos culturales del Centro Histórico)",
    telefonos: [],
    whatsappPrincipal: null,
    sitioWeb: null,
    redes: {
      instagram: "https://www.instagram.com/ballet_ciudaddeloja/",
      facebook: "https://www.facebook.com/p/Ballet-Folkl%C3%B3rico-Internacional-Ciudad-de-Loja-100089650351335/",
      tiktok: "https://www.tiktok.com/@balletciudaddeloja",
    },
    descripcionCorta: "Más de 21 años difundiendo la riqueza del folclore y las tradiciones dancísticas del Ecuador.",
    biografiaTrayectoria: "Con más de dos décadas de trayectoria continua, el Ballet Folclórico Internacional Ciudad de Loja es uno de los máximos exponentes del patrimonio inmaterial andino en el sur del Ecuador. Sus puestas en escena rescatan las fiestas andinas, trajes típicos e identidad de las comunidades lojanas y ecuatorianas, presentándose habitualmente en el tradicional ciclo 'Martes de Folklore' del Teatro Bolívar y en festivales internacionales de Sudamérica.",
    ofertaFormativa: [
      "Elenco oficial y semillero de danza folclórica",
      "Talleres vacacionales de tradiciones andinas",
      "Montajes coreográficos para festividades cívicas",
      "Investigación y preservación de vestuario patrimonial"
    ],
    anoFundacion: 2004,
    terminosBusqueda: ["ballet folclórico ciudad de loja", "ballet folklorico loja", "eddy chininin"],
  },
  "la-septima-produccion": {
    slug: "la-septima-produccion",
    nombre: "La Séptima Producción Cultural",
    categoria: "teatro",
    disciplinas: ["Producción Escénica", "Teatro Histórico", "Audiovisual Cultural"],
    representante: "George Gualán, Gina Ordóñez y Emilia Soto (Productores)",
    direccion: "Loja, Ecuador",
    telefonos: [],
    whatsappPrincipal: null,
    sitioWeb: null,
    redes: {
      instagram: "https://www.instagram.com/laseptima.ec/",
      facebook: "https://www.facebook.com/p/la-S%C3%A9ptima-61582749695858/",
    },
    descripcionCorta: "Colectivo de producción teatral y cultural, ganadores del concurso nacional IFAIC.",
    biografiaTrayectoria: "La Séptima es una productora cultural lojana que destaca por sus investigaciones históricas llevadas a las tablas con rigor y belleza artística. Creadores de la aclamada obra 'Las Manuelas: alma femenina de la libertad', ganadora del concurso nacional IFAIC de Producción de Obras de Artes Escénicas, estrenada a teatro lleno en el Teatro Benjamín Carrión Mora integrando música en vivo, teatro y danza.",
    ofertaFormativa: [
      "Producción integral de proyectos escénicos",
      "Gestión de fondos concursables de arte",
      "Investigación histórica para dramaturgia",
      "Talleres interdisciplinarios de creación"
    ],
    terminosBusqueda: ["la séptima", "la septima produccion", "las manuelas", "george gualan"],
  },
  "fundacion-mundos-opuestos": {
    slug: "fundacion-mundos-opuestos",
    nombre: "Fundación Cultural Mundos Opuestos",
    categoria: "circo-social",
    disciplinas: ["Teatro Social", "Artes Circenses", "Caravanas de Lectura", "Mimo y Malabares"],
    representante: "Jorge Israel Jiménez Quezada y Carlos Israel Jiménez Quezada (Fundadores)",
    direccion: "Loja, Ecuador (Proyectos comunitarios en barrios urbanos y parroquias rurales)",
    telefonos: [],
    whatsappPrincipal: null,
    sitioWeb: null,
    redes: {
      instagram: "https://www.instagram.com/fmundos_opuestos/",
      facebook: "https://www.facebook.com/vuelocolectivo17/",
    },
    descripcionCorta: "Organización cultural comunitaria que transforma realidades mediante circo, libros y teatro social.",
    biografiaTrayectoria: "Nacida en 2014 en Loja, la Fundación Cultural Mundos Opuestos utiliza las artes escénicas como una herramienta de transformación social y reconciliación comunitaria. Llevan espectáculos de circo, zancos, títeres y caravanas de lectura a centros de rehabilitación social, parroquias rurales y sectores vulnerables de la provincia. Galardonados por el Municipio de Loja por su aporte cívico y artístico.",
    ofertaFormativa: [
      "Talleres de circo social y malabares",
      "Caravanas de fomento a la lectura infantil",
      "Teatro comunitario e inclusión",
      "Presentaciones familiares para ferias y festivales"
    ],
    anoFundacion: 2014,
    terminosBusqueda: ["mundos opuestos", "fundación mundos opuestos", "circo loja", "israel jimenez"],
  },
  "conservatorio-salvador-bustamante": {
    slug: "conservatorio-salvador-bustamante",
    nombre: "Conservatorio Superior Salvador Bustamante Celi",
    categoria: "musica",
    disciplinas: ["Formación Musical Profesional", "Instrumentos Sinfónicos", "Canto Lírico", "Composición"],
    representante: "Mgs. Wilman René Palacios Jaramillo (Rector)",
    direccion: "Av. Salvador Bustamante Celi y Av. Orillas de Zamora (frente al Parque Jipiro)",
    telefonos: ["0993071765"],
    whatsappPrincipal: null,
    sitioWeb: "https://conservatoriosuperiorsbc.edu.ec/",
    redes: {
      instagram: "https://www.instagram.com/conservatorio_sbc/",
      facebook: "https://www.facebook.com/CSSBC/",
    },
    descripcionCorta: "Institución de educación musical superior con más de 82 años formando a los músicos de Loja y el país.",
    biografiaTrayectoria: "Fundado en honor al insigne músico lojano Salvador Bustamante Celi, este conservatorio es el alma máter de la 'Capital Musical del Ecuador'. Con más de 80 años de vida institucional, cerca de 700 estudiantes y 80 docentes especializados, ofrece formación académica de tercer nivel en violín, piano, vientos, percusión, guitarra clásica y canto, nutriendo permanentemente a orquestas sinfónicas y ensambles de prestigio continental.",
    ofertaFormativa: [
      "Carreras de tecnología superior en música",
      "Formación instrumental sinfónica (cuerdas, maderas, metales)",
      "Piano clásico y guitarra acústica",
      "Canto coral y lírico",
      "Conciertos de temporada y recitales de grado"
    ],
    anoFundacion: 1944,
    terminosBusqueda: ["conservatorio salvador bustamante", "conservatorio loja", "salvador bustamante celi"],
  },
};
