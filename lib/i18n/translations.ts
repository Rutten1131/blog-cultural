export type Locale = "es" | "en" | "fr" | "de" | "pt";

export const LOCALES: { code: Locale; name: string; flag: string; nativeName: string }[] = [
  { code: "es", name: "Español", flag: "🇪🇸", nativeName: "Español" },
  { code: "en", name: "Inglés", flag: "🇺🇸", nativeName: "English" },
  { code: "fr", name: "Francés", flag: "🇫🇷", nativeName: "Français" },
  { code: "de", name: "Alemán", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "pt", name: "Portugués", flag: "🇧🇷", nativeName: "Português" },
];

export const UI_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  es: {
    // Navbar
    "nav.inicio": "Inicio",
    "nav.arte": "Arte",
    "nav.teatro": "Teatro",
    "nav.musica": "Música",
    "nav.ferias": "Ferias",
    "nav.artes_vivas": "Artes Vivas",
    "nav.sobre_proyecto": "Sobre el proyecto",
    "nav.publicar": "+ Publicar evento",
    "nav.menu": "Menú",
    "nav.idioma": "Idioma",

    // Hero Principal Home
    "hero.eyebrow": "Descubre qué está pasando en Loja",
    "hero.h1_prefix": "¿Qué hacer",
    "hero.h1_suffix": "en Loja?",
    "hero.subtitulo": "Eventos, arte y actividades culturales en la ciudad",
    "hero.btn_ver_todos": "Ver todos los eventos",
    "hero.btn_publicar": "Publicar evento",
    "hero.destacado": "Destacado",
    "hero.ver_calendario": "Ver el calendario",

    // Secciones Home
    "section.ultimos_eyebrow": "Recientemente agregados",
    "section.ultimos_titulo": "Últimos Eventos Artísticos Publicados en Loja",
    "section.buscar_placeholder": "Buscar eventos por nombre, lugar o artista...",
    "section.proximos_titulo": "Próximos Eventos en Cartelera",
    "section.ver_mas": "Ver más eventos",
    "section.agenda_fecha": "Agenda por fecha",
    "section.eventos_encontrados": "eventos encontrados",

    // Chatbot Widget
    "chat.tooltip": "¿Buscas qué hacer u hospedaje en Loja?",
    "chat.btn_label": "¿Qué hacer en Loja?",
    "chat.title": "¿Qué hacer en Loja?",
    "chat.subtitle": "Turismo, Cartelera Cultural & Aliados",
    "chat.welcome": "¡Hola! 👋 Te doy la bienvenida a Loja. Pregúntame qué hacer en la ciudad, lugares culturales, rutas de naturaleza o dónde hospedarte con nuestros aliados recomendados.",
    "chat.placeholder": "Escribe tu pregunta sobre qué hacer u hospedaje...",
    "chat.sug_hospedaje": "🏨 ¿Dónde me puedo hospedar en Loja?",
    "chat.sug_naturaleza": "🌿 Lugares de naturaleza cerca",
    "chat.sug_hoy": "🎭 ¿Qué hacer hoy en la ciudad?",
    "chat.sug_cafe": "☕ ¿Dónde tomar un buen café lojano?",

    // Evento Detalle & Comunes
    "common.ver_evento": "Ver evento",
    "common.ver_mas": "Ver más",
    "common.hoy": "Hoy",
    "common.este_fin_de_semana": "Este fin de semana",
    "common.gratis": "Gratis / Acceso libre",
    "common.como_llegar": "Cómo llegar",
    "common.compartir": "Compartir evento",
    "common.copiado": "¡Enlace copiado!",
    "common.organizador": "Organizador / Gestor",
    "common.lugar": "Lugar / Recinto",
    "common.fecha": "Fecha y Hora",
    "common.fecha_inicio": "Fecha de Inicio",
    "common.fecha_fin": "Fecha de Finalización",
    "common.categoria": "Categoría",
    "common.zona": "Ubicación Parroquial",
    "common.cargando_traduccion": "Traduciendo con IA...",
    "common.original_es": "Ver original en español",
    "common.traducido_por_ia": "Traducción cultural con IA",
    "common.volver": "Volver",
    "common.contacto_whatsapp": "Contactar por WhatsApp",
    "common.recomendar": "Buzón de sugerencias",
    "common.sin_eventos": "No hay eventos disponibles en esta sección por ahora.",

    // Ticker marquee
    "ticker.arte": "Arte y Exposiciones",
    "ticker.teatro": "Teatro",
    "ticker.musica": "Música",
    "ticker.ferias": "Ferias y Festivales",
    "ticker.artes_vivas": "Artes Vivas",
    "ticker.danza": "Danza",
    "ticker.cine": "Cine",
    "ticker.literatura": "Literatura",
    "ticker.patrimonio": "Patrimonio",
    "ticker.talleres": "Talleres Culturales",

    // Explorar por Categorías
    "home.explorar_disciplinas": "Disciplinas y Espacios",
    "home.explorar_titulo": "Explorar por Categorías",
    "home.ver_agenda": "Ver agenda",
    "home.descubre_loja": "Descubre qué está pasando en Loja",
    "home.eventos_actividades": "Eventos, arte y actividades culturales en la ciudad",

    // Nombres de categorías
    "cat.arte": "Arte y Exposiciones",
    "cat.teatro": "Teatro",
    "cat.musica": "Música",
    "cat.ferias": "Ferias",
    "cat.artes_vivas": "Artes Vivas",

    // SeccionCategoria — preguntas H2 SEO
    "scat.h2.arte": "¿Qué eventos artísticos y exposiciones de arte existen en Loja?",
    "scat.h2.teatro": "¿Qué obras de teatro y eventos teatrales se presentan en Loja?",
    "scat.h2.musica": "¿Qué conciertos y eventos musicales hay en Loja?",
    "scat.h2.ferias": "¿Qué ferias culturales y festivales se realizan en Loja?",
    "scat.h2.artes_vivas": "¿Qué eventos de Artes Vivas y expresiones escénicas hay en Loja?",

    // SeccionCategoria — respuestas SEO
    "scat.seo.arte": "Explorá exposiciones de pintura, fotografía, escultura y galerías de arte abiertas al público en Loja.",
    "scat.seo.teatro": "Encontrá cartelera de obras teatrales, microteatro, dramaturgia y presentaciones escénicas en los teatros de Loja.",
    "scat.seo.musica": "Descubrí conciertos en vivo, recitales sinfónicos, festivales musicales y presentaciones acústicas en Loja.",
    "scat.seo.ferias": "Descubrí ferias artesanales, emprendimientos culturales, festivales gastronómicos y mercados tradicionales en Loja.",
    "scat.seo.artes_vivas": "Viví los festivales internacionales y locales de artes vivas, danza, mimo y espectáculos callejeros en Loja.",
    "scat.ver_todo": "Ver todo en",
    "scat.sin_eventos": "No hay eventos registrados en esta categoría por el momento.",

    // Footer
    "footer.descripcion": "El directorio oficial de eventos culturales de Loja. Arte, teatro, música, ferias y artes vivas en un solo lugar.",
    "footer.categorias": "Categorías",
    "footer.info": "Agenda Cultural",
    "footer.info_desc": "Descubre las mejores actividades, exposiciones, obras y conciertos en Loja, Ecuador.",
    "footer.sobre": "Sobre el proyecto",
    "footer.publicar": "Publicar un Evento",
    "footer.creditos": "Iniciativa tecnológica creada y desarrollada por",

    // Buzón de Recomendaciones
    "buzon.badge": "✨ Etapa de validación comunitaria",
    "buzon.titulo": "¿Tienes una recomendación para mejorar la Agenda Cultural de Loja?",
    "buzon.desc": "Estamos en etapa de validación. Tu aporte nos ayuda a construir una mejor plataforma para nuestra ciudad.",
    "buzon.btn_abrir": "✍️ Dejar una recomendación",
    "buzon.label_mensaje": "¿Qué te gustaría ver, mejorar o añadir en la plataforma?",
    "buzon.placeholder_mensaje": "Ej: Me gustaría que avisen eventos en Malacatos, o que agreguen teatro infantil...",
    "buzon.label_contacto": "Tu contacto o nombre",
    "buzon.opcional": "(Opcional)",
    "buzon.placeholder_contacto": "Nombre, WhatsApp o email",
    "buzon.btn_enviar": "Enviar aporte",
    "buzon.enviando": "Enviando...",
    "buzon.cancelar": "Cancelar",
    // Categoría y navegación
    "cat.header_badge": "Categoría Cultural",
    "cat.proximos": "próximos",
    "cat.total": "en total",
    "section.proximos_cartelera": "Próximos Eventos en Cartelera (Hoy y siguientes días)",
    "cat.ver_todas_categorias": "Ver todas las categorías",
    "buzon.gracias": "¡Muchas gracias por tu aporte! Tu recomendación fue registrada para el equipo.",

    // Detalle de evento
    "nav.todos_eventos": "Eventos",
    "zona.urbana": "URBANA",
    "zona.rural": "RURAL",
    "evento.varios_dias": "Evento de varios días",
    "evento.fecha_hora": "Fecha y Hora",
    "evento.fecha_inicio": "Fecha de Inicio",
    "evento.fecha_fin": "Fecha de Finalización",
    "evento.lugar": "Lugar / Recinto",
    "evento.organizador": "Organizador / Gestor",
    "evento.zona_parroquial": "Ubicación Parroquial",
    "evento.sobre_este_evento": "Sobre este evento",
    "evento.ubicacion_titulo": "Ubicación del evento",
    "evento.abrir_maps": "Abrir en Google Maps",
    "evento.otros_interesar": "Otros eventos que te pueden interesar",

    // Archivo cultural / EventosPasadosList
    "archivo.eyebrow": "Archivo Cultural",
    "archivo.item": "archivo",
    "archivo.item_plural_suffix": "s",
    "archivo.buscar_placeholder": "Buscar en el archivo...",
    "archivo.sin_resultados": "No se encontraron eventos anteriores con ese término.",
    "archivo.mostrar_menos": "Mostrar menos",

    // Página /eventos
    "eventos_page.breadcrumb_todos": "Todos los eventos",
    "eventos_page.titulo": "Cartelera y Calendario Cultural",
    "eventos_page.proximos_desc": "Explora los {n} eventos próximos en agenda o toca un día en el calendario interactivo.",
    "eventos_page.sin_proximos": "No hay eventos próximos en este momento.",
    "eventos_page.seccion_proximos": "Eventos Próximos (Hoy y siguientes fechas)",
    "eventos_page.sin_proximos_msg": "No hay eventos próximos programados para hoy o los siguientes días.",
    "eventos_page.pasados_titulo": "Eventos Realizados Anteriormente en Loja",
    "eventos_page.pasados_subtitulo": "Registro histórico de presentaciones, talleres y festivales concluidos en la ciudad.",

    // Zona page
    "zona.parroquia_urbana": "Parroquia Urbana",
    "zona.parroquia_rural": "Parroquia Rural",

    // Common
    "common.volver_inicio": "Volver al inicio",
  },

  en: {
    // Navbar
    "nav.inicio": "Home",
    "nav.arte": "Art",
    "nav.teatro": "Theater",
    "nav.musica": "Music",
    "nav.ferias": "Fairs & Markets",
    "nav.artes_vivas": "Living Arts",
    "nav.sobre_proyecto": "About the Project",
    "nav.publicar": "+ Post an Event",
    "nav.menu": "Menu",
    "nav.idioma": "Language",

    // Hero Principal Home
    "hero.eyebrow": "Discover what's happening in Loja",
    "hero.h1_prefix": "What to do",
    "hero.h1_suffix": "in Loja?",
    "hero.subtitulo": "Events, art, and cultural activities in the city",
    "hero.btn_ver_todos": "View all events",
    "hero.btn_publicar": "Post an event",
    "hero.destacado": "Featured",
    "hero.ver_calendario": "View calendar",

    // Secciones Home
    "section.ultimos_eyebrow": "Recently added",
    "section.ultimos_titulo": "Latest Cultural Events Published in Loja",
    "section.buscar_placeholder": "Search events by name, venue, or artist...",
    "section.proximos_titulo": "Upcoming Events on Schedule",
    "section.ver_mas": "View more events",
    "section.agenda_fecha": "Schedule by date",
    "section.eventos_encontrados": "events found",

    // Chatbot Widget
    "chat.tooltip": "Looking for things to do or lodging in Loja?",
    "chat.btn_label": "What to do in Loja?",
    "chat.title": "What to do in Loja?",
    "chat.subtitle": "Tourism, Cultural Guide & Partners",
    "chat.welcome": "Hello! 👋 Welcome to Loja. Ask me about things to do in the city, cultural spots, nature trails, or recommended partner hotels and stays.",
    "chat.placeholder": "Type your question about activities or hotels...",
    "chat.sug_hospedaje": "🏨 Where can I stay in Loja?",
    "chat.sug_naturaleza": "🌿 Nature spots nearby",
    "chat.sug_hoy": "🎭 What's happening today in the city?",
    "chat.sug_cafe": "☕ Best spots for local Loja coffee?",

    // Evento Detalle & Comunes
    "common.ver_evento": "View Event",
    "common.ver_mas": "View More",
    "common.hoy": "Today",
    "common.este_fin_de_semana": "This Weekend",
    "common.gratis": "Free Admission",
    "common.como_llegar": "Get Directions",
    "common.compartir": "Share Event",
    "common.copiado": "Link copied!",
    "common.organizador": "Organizer",
    "common.lugar": "Venue / Location",
    "common.fecha": "Date & Time",
    "common.fecha_inicio": "Start Date",
    "common.fecha_fin": "End Date",
    "common.categoria": "Category",
    "common.zona": "Parish / District",
    "common.cargando_traduccion": "Translating with AI...",
    "common.original_es": "View original in Spanish",
    "common.traducido_por_ia": "AI Cultural Translation",
    "common.volver": "Back",
    "common.contacto_whatsapp": "Chat on WhatsApp",
    "common.recomendar": "Suggestions & Feedback",
    "common.sin_eventos": "No events available in this section right now.",

    // Ticker marquee
    "ticker.arte": "Art & Exhibitions",
    "ticker.teatro": "Theater",
    "ticker.musica": "Music",
    "ticker.ferias": "Fairs & Festivals",
    "ticker.artes_vivas": "Living Arts",
    "ticker.danza": "Dance",
    "ticker.cine": "Cinema",
    "ticker.literatura": "Literature",
    "ticker.patrimonio": "Heritage",
    "ticker.talleres": "Cultural Workshops",

    // Explorar por Categorías
    "home.explorar_disciplinas": "Disciplines & Venues",
    "home.explorar_titulo": "Explore by Category",
    "home.ver_agenda": "View schedule",
    "home.descubre_loja": "Discover what's happening in Loja",
    "home.eventos_actividades": "Events, art, and cultural activities in the city",

    // Nombres de categorías
    "cat.arte": "Art & Exhibitions",
    "cat.teatro": "Theater",
    "cat.musica": "Music",
    "cat.ferias": "Fairs",
    "cat.artes_vivas": "Living Arts",

    // SeccionCategoria — preguntas H2 SEO
    "scat.h2.arte": "What art events and exhibitions are there in Loja?",
    "scat.h2.teatro": "What theater shows and performances are in Loja?",
    "scat.h2.musica": "What concerts and music events are happening in Loja?",
    "scat.h2.ferias": "What cultural fairs and festivals take place in Loja?",
    "scat.h2.artes_vivas": "What Living Arts events and performances are in Loja?",

    // SeccionCategoria — respuestas SEO
    "scat.seo.arte": "Explore painting, photography, sculpture exhibitions and open art galleries in Loja.",
    "scat.seo.teatro": "Find theater shows, micro-theater, playwriting and stage performances at Loja's theaters.",
    "scat.seo.musica": "Discover live concerts, symphonic recitals, music festivals and acoustic performances in Loja.",
    "scat.seo.ferias": "Discover craft fairs, cultural entrepreneurs, food festivals and traditional markets in Loja.",
    "scat.seo.artes_vivas": "Experience international and local living arts festivals, dance, mime and street performances in Loja.",
    "scat.ver_todo": "See all in",
    "scat.sin_eventos": "No events registered in this category at the moment.",

    // Footer
    "footer.descripcion": "The official cultural events directory of Loja. Art, theater, music, fairs and living arts all in one place.",
    "footer.categorias": "Categories",
    "footer.info": "Cultural Agenda",
    "footer.info_desc": "Discover the best activities, exhibitions, performances and concerts in Loja, Ecuador.",
    "footer.sobre": "About the project",
    "footer.publicar": "Post an Event",
    "footer.creditos": "Technology initiative created and developed by",

    // Buzón de Recomendaciones
    "buzon.badge": "✨ Community validation stage",
    "buzon.titulo": "Do you have a recommendation to improve the Cultural Agenda of Loja?",
    "buzon.desc": "We are in a validation stage. Your input helps us build a better platform for our city.",
    "buzon.btn_abrir": "✍️ Leave a recommendation",
    "buzon.label_mensaje": "What would you like to see, improve or add to the platform?",
    "buzon.placeholder_mensaje": "E.g.: I'd like events from nearby parishes, or children's theater added...",
    "buzon.label_contacto": "Your contact or name",
    "buzon.opcional": "(Optional)",
    "buzon.placeholder_contacto": "Name, WhatsApp or email",
    "buzon.btn_enviar": "Send feedback",
    "buzon.enviando": "Sending...",
    "buzon.cancelar": "Cancel",
    // Categoría y navegación
    "cat.header_badge": "Cultural Category",
    "cat.proximos": "upcoming",
    "cat.total": "total",
    "section.proximos_cartelera": "Upcoming Events on Schedule (Today and future dates)",
    "cat.ver_todas_categorias": "View all categories",
    "buzon.gracias": "Thank you so much for your input! Your recommendation has been recorded for the team.",

    // Detalle de evento
    "nav.todos_eventos": "Events",
    "zona.urbana": "URBAN",
    "zona.rural": "RURAL",
    "evento.varios_dias": "Multi-day event",
    "evento.fecha_hora": "Date & Time",
    "evento.fecha_inicio": "Start Date",
    "evento.fecha_fin": "End Date",
    "evento.lugar": "Venue / Location",
    "evento.organizador": "Organizer / Host",
    "evento.zona_parroquial": "Parish / District",
    "evento.sobre_este_evento": "About this event",
    "evento.ubicacion_titulo": "Event Location",
    "evento.abrir_maps": "Open in Google Maps",
    "evento.otros_interesar": "Other events you might like",

    // Archivo cultural / EventosPasadosList
    "archivo.eyebrow": "Cultural Archive",
    "archivo.item": "event",
    "archivo.item_plural_suffix": "s",
    "archivo.buscar_placeholder": "Search in the archive...",
    "archivo.sin_resultados": "No past events found with that term.",
    "archivo.mostrar_menos": "Show less",

    // Página /eventos
    "eventos_page.breadcrumb_todos": "All events",
    "eventos_page.titulo": "Cultural Calendar & Schedule",
    "eventos_page.proximos_desc": "Explore {n} upcoming events or tap a day in the interactive calendar.",
    "eventos_page.sin_proximos": "No upcoming events at the moment.",
    "eventos_page.seccion_proximos": "Upcoming Events (Today and following dates)",
    "eventos_page.sin_proximos_msg": "No upcoming events scheduled for today or the following days.",
    "eventos_page.pasados_titulo": "Previously Held Events in Loja",
    "eventos_page.pasados_subtitulo": "Historical record of past performances, workshops and festivals in the city.",

    // Zona page
    "zona.parroquia_urbana": "Urban Parish",
    "zona.parroquia_rural": "Rural Parish",

    // Common
    "common.volver_inicio": "Back to home",
  },

  fr: {
    // Navbar
    "nav.inicio": "Accueil",
    "nav.arte": "Art",
    "nav.teatro": "Théâtre",
    "nav.musica": "Musique",
    "nav.ferias": "Foires & Salons",
    "nav.artes_vivas": "Arts Vivants",
    "nav.sobre_proyecto": "À propos",
    "nav.publicar": "+ Publier un événement",
    "nav.menu": "Menu",
    "nav.idioma": "Langue",

    // Hero Principal Home
    "hero.eyebrow": "Découvrez ce qui se passe à Loja",
    "hero.h1_prefix": "Que faire",
    "hero.h1_suffix": "à Loja ?",
    "hero.subtitulo": "Événements, art et activités culturelles dans la ville",
    "hero.btn_ver_todos": "Voir tous les événements",
    "hero.btn_publicar": "Publier un événement",
    "hero.destacado": "En vedette",
    "hero.ver_calendario": "Voir le calendrier",

    // Secciones Home
    "section.ultimos_eyebrow": "Récemment ajoutés",
    "section.ultimos_titulo": "Derniers événements culturels publiés à Loja",
    "section.buscar_placeholder": "Rechercher par nom, lieu ou artiste...",
    "section.proximos_titulo": "Prochains événements à l'affiche",
    "section.ver_mas": "Voir plus d'événements",
    "section.agenda_fecha": "Agenda par date",
    "section.eventos_encontrados": "événements trouvés",

    // Chatbot Widget
    "chat.tooltip": "Vous cherchez quoi faire ou un hébergement à Loja ?",
    "chat.btn_label": "Que faire à Loja ?",
    "chat.title": "Que faire à Loja ?",
    "chat.subtitle": "Tourisme, Guide Culturel & Partenaires",
    "chat.welcome": "Bonjour ! 👋 Bienvenue à Loja. Demandez-moi quoi faire en ville, les lieux culturels, sentiers nature ou nos hôtels partenaires recommandés.",
    "chat.placeholder": "Posez votre question sur les activités ou hôtels...",
    "chat.sug_hospedaje": "🏨 Où loger à Loja ?",
    "chat.sug_naturaleza": "🌿 Espaces naturels à proximité",
    "chat.sug_hoy": "🎭 Que faire aujourd'hui en ville ?",
    "chat.sug_cafe": "☕ Où déguster un bon café de Loja ?",

    // Evento Detalle & Comunes
    "common.ver_evento": "Voir l'événement",
    "common.ver_mas": "Voir plus",
    "common.hoy": "Aujourd'hui",
    "common.este_fin_de_semana": "Ce week-end",
    "common.gratis": "Entrée libre",
    "common.como_llegar": "Comment y aller",
    "common.compartir": "Partager l'événement",
    "common.copiado": "Lien copié !",
    "common.organizador": "Organisateur",
    "common.lugar": "Lieu / Salle",
    "common.fecha": "Date & Heure",
    "common.fecha_inicio": "Date de début",
    "common.fecha_fin": "Date de fin",
    "common.categoria": "Catégorie",
    "common.zona": "Paroisse / Quartier",
    "common.cargando_traduccion": "Traduction par IA...",
    "common.original_es": "Voir l'original en espagnol",
    "common.traducido_por_ia": "Traduction culturelle par IA",
    "common.volver": "Retour",
    "common.contacto_whatsapp": "Contacter sur WhatsApp",
    "common.recomendar": "Boîte à suggestions",
    "common.sin_eventos": "Aucun événement disponible dans cette section pour le moment.",

    // Ticker marquee
    "ticker.arte": "Art & Expositions",
    "ticker.teatro": "Théâtre",
    "ticker.musica": "Musique",
    "ticker.ferias": "Foires & Festivals",
    "ticker.artes_vivas": "Arts Vivants",
    "ticker.danza": "Danse",
    "ticker.cine": "Cinéma",
    "ticker.literatura": "Littérature",
    "ticker.patrimonio": "Patrimoine",
    "ticker.talleres": "Ateliers Culturels",

    // Explorar por Categorías
    "home.explorar_disciplinas": "Disciplines & Espaces",
    "home.explorar_titulo": "Explorer par catégorie",
    "home.ver_agenda": "Voir le programme",
    "home.descubre_loja": "Découvrez ce qui se passe à Loja",
    "home.eventos_actividades": "Événements, art et activités culturelles dans la ville",

    // Nombres de categorías
    "cat.arte": "Art & Expositions",
    "cat.teatro": "Théâtre",
    "cat.musica": "Musique",
    "cat.ferias": "Foires",
    "cat.artes_vivas": "Arts Vivants",

    // SeccionCategoria — H2 SEO
    "scat.h2.arte": "Quels événements artistiques et expositions existe-t-il à Loja ?",
    "scat.h2.teatro": "Quelles pièces de théâtre et spectacles sont présentés à Loja ?",
    "scat.h2.musica": "Quels concerts et événements musicaux ont lieu à Loja ?",
    "scat.h2.ferias": "Quelles foires culturelles et festivals se déroulent à Loja ?",
    "scat.h2.artes_vivas": "Quels événements d'Arts Vivants et expressions scéniques y a-t-il à Loja ?",

    // SeccionCategoria — SEO
    "scat.seo.arte": "Explorez des expositions de peinture, photographie, sculpture et galeries d'art ouvertes au public à Loja.",
    "scat.seo.teatro": "Retrouvez les affiches de pièces de théâtre, micro-théâtre et mises en scène dans les théâtres de Loja.",
    "scat.seo.musica": "Découvrez des concerts live, récitals symphoniques, festivals de musique et prestations acoustiques à Loja.",
    "scat.seo.ferias": "Découvrez les foires artisanales, marchés culturels, festivals gastronomiques et marchés traditionnels à Loja.",
    "scat.seo.artes_vivas": "Vivez les festivals internationaux et locaux d'arts vivants, danse, mime et spectacles de rue à Loja.",
    "scat.ver_todo": "Tout voir dans",
    "scat.sin_eventos": "Aucun événement enregistré dans cette catégorie pour le moment.",

    // Footer
    "footer.descripcion": "Le répertoire officiel des événements culturels de Loja. Art, théâtre, musique, foires et arts vivants en un seul endroit.",
    "footer.categorias": "Catégories",
    "footer.info": "Agenda Culturel",
    "footer.info_desc": "Découvrez les meilleures activités, expositions, spectacles et concerts à Loja, Équateur.",
    "footer.sobre": "À propos du projet",
    "footer.publicar": "Publier un événement",
    "footer.creditos": "Initiative technologique créée et développée par",

    // Buzón
    "buzon.badge": "✨ Phase de validation communautaire",
    "buzon.titulo": "Avez-vous une recommandation pour améliorer l'Agenda Culturel de Loja ?",
    "buzon.desc": "Nous sommes en phase de validation. Votre contribution nous aide à construire une meilleure plateforme pour notre ville.",
    "buzon.btn_abrir": "✍️ Laisser une recommandation",
    "buzon.label_mensaje": "Que souhaiteriez-vous voir, améliorer ou ajouter à la plateforme ?",
    "buzon.placeholder_mensaje": "Ex : J'aimerais des événements des paroisses proches, ou du théâtre pour enfants...",
    "buzon.label_contacto": "Votre contact ou nom",
    "buzon.opcional": "(Optionnel)",
    "buzon.placeholder_contacto": "Nom, WhatsApp ou email",
    "buzon.btn_enviar": "Envoyer",
    "buzon.enviando": "Envoi en cours...",
    "buzon.cancelar": "Annuler",
    "cat.header_badge": "Catégorie culturelle",
    "cat.proximos": "à venir",
    "cat.total": "au total",
    "section.proximos_cartelera": "Prochains événements à l'affiche (Aujourd'hui et dates suivantes)",
    "cat.ver_todas_categorias": "Voir toutes les catégories",
    "buzon.gracias": "Merci beaucoup pour votre contribution ! Votre recommandation a été enregistrée pour l'équipe.",

    // Detalle de evento
    "nav.todos_eventos": "Événements",
    "zona.urbana": "URBAINE",
    "zona.rural": "RURALE",
    "evento.varios_dias": "Événement sur plusieurs jours",
    "evento.fecha_hora": "Date et Heure",
    "evento.fecha_inicio": "Date de Début",
    "evento.fecha_fin": "Date de Fin",
    "evento.lugar": "Lieu / Salle",
    "evento.organizador": "Organisateur / Gestionnaire",
    "evento.zona_parroquial": "Paroisse / District",
    "evento.sobre_este_evento": "À propos de cet événement",
    "evento.ubicacion_titulo": "Emplacement de l'événement",
    "evento.abrir_maps": "Ouvrir dans Google Maps",
    "evento.otros_interesar": "Autres événements susceptibles de vous intéresser",

    // Archivo cultural / EventosPasadosList
    "archivo.eyebrow": "Archives Culturelles",
    "archivo.item": "événement",
    "archivo.item_plural_suffix": "s",
    "archivo.buscar_placeholder": "Rechercher dans les archives...",
    "archivo.sin_resultados": "Aucun événement antérieur trouvé avec ce terme.",
    "archivo.mostrar_menos": "Afficher moins",

    // Página /eventos
    "eventos_page.breadcrumb_todos": "Tous les événements",
    "eventos_page.titulo": "Agenda et Calendrier Culturel",
    "eventos_page.proximos_desc": "Parcourez {n} événements à venir ou tapez un jour dans le calendrier interactif.",
    "eventos_page.sin_proximos": "Aucun événement à venir pour le moment.",
    "eventos_page.seccion_proximos": "Événements à venir (Aujourd'hui et jours suivants)",
    "eventos_page.sin_proximos_msg": "Aucun événement à venir programmé pour aujourd'hui ou les jours suivants.",
    "eventos_page.pasados_titulo": "Événements passés à Loja",
    "eventos_page.pasados_subtitulo": "Archive historique des spectacles, ateliers et festivals dans la ville.",

    // Zona page
    "zona.parroquia_urbana": "Paroisse Urbaine",
    "zona.parroquia_rural": "Paroisse Rurale",

    // Common
    "common.volver_inicio": "Retour à l'accueil",
  },

  de: {
    // Navbar
    "nav.inicio": "Startseite",
    "nav.arte": "Kunst",
    "nav.teatro": "Theater",
    "nav.musica": "Musik",
    "nav.ferias": "Märkte & Messen",
    "nav.artes_vivas": "Darstellende Kunst",
    "nav.sobre_proyecto": "Über das Projekt",
    "nav.publicar": "+ Event eintragen",
    "nav.menu": "Menü",
    "nav.idioma": "Sprache",

    // Hero Principal Home
    "hero.eyebrow": "Entdecken Sie das Geschehen in Loja",
    "hero.h1_prefix": "Was tun",
    "hero.h1_suffix": "in Loja?",
    "hero.subtitulo": "Veranstaltungen, Kunst und Kultur in der Stadt",
    "hero.btn_ver_todos": "Alle Events ansehen",
    "hero.btn_publicar": "Event eintragen",
    "hero.destacado": "Highlight",
    "hero.ver_calendario": "Kalender ansehen",

    // Secciones Home
    "section.ultimos_eyebrow": "Kürzlich hinzugefügt",
    "section.ultimos_titulo": "Neueste Kulturveranstaltungen in Loja",
    "section.buscar_placeholder": "Events nach Name, Ort oder Künstler suchen...",
    "section.proximos_titulo": "Kommende Veranstaltungen",
    "section.ver_mas": "Mehr Events ansehen",
    "section.agenda_fecha": "Termine nach Datum",
    "section.eventos_encontrados": "Events gefunden",

    // Chatbot Widget
    "chat.tooltip": "Suchen Sie Unternehmungen oder Unterkünfte in Loja?",
    "chat.btn_label": "Was tun in Loja?",
    "chat.title": "Was tun in Loja?",
    "chat.subtitle": "Tourismus, Kulturkalender & Partner",
    "chat.welcome": "Hallo! 👋 Willkommen in Loja. Fragen Sie mich nach Aktivitäten in der Stadt, Kulturstätten, Naturpfaden oder empfohlenen Partner-Hotels.",
    "chat.placeholder": "Frage zu Aktivitäten oder Unterkünften stellen...",
    "chat.sug_hospedaje": "🏨 Wo kann man in Loja übernachten?",
    "chat.sug_naturaleza": "🌿 Naturziele in der Nähe",
    "chat.sug_hoy": "🎭 Was kann man heute in der Stadt tun?",
    "chat.sug_cafe": "☕ Wo gibt es guten Loja-Kaffee?",

    // Evento Detalle & Comunes
    "common.ver_evento": "Event ansehen",
    "common.ver_mas": "Mehr sehen",
    "common.hoy": "Heute",
    "common.este_fin_de_semana": "Dieses Wochenende",
    "common.gratis": "Freier Eintritt",
    "common.como_llegar": "Route planen",
    "common.compartir": "Event teilen",
    "common.copiado": "Link kopiert!",
    "common.organizador": "Veranstalter",
    "common.lugar": "Veranstaltungsort",
    "common.fecha": "Datum & Uhrzeit",
    "common.fecha_inicio": "Startdatum",
    "common.fecha_fin": "Enddatum",
    "common.categoria": "Kategorie",
    "common.zona": "Bezirk / Pfarrei",
    "common.cargando_traduccion": "Übersetzung mit KI...",
    "common.original_es": "Original auf Spanisch anzeigen",
    "common.traducido_por_ia": "Kulturelle KI-Übersetzung",
    "common.volver": "Zurück",
    "common.contacto_whatsapp": "Per WhatsApp kontaktieren",
    "common.recomendar": "Vorschläge & Feedback",
    "common.sin_eventos": "Derzeit sind in diesem Bereich keine Events verfügbar.",

    // Ticker marquee
    "ticker.arte": "Kunst & Ausstellungen",
    "ticker.teatro": "Theater",
    "ticker.musica": "Musik",
    "ticker.ferias": "Messen & Festivals",
    "ticker.artes_vivas": "Darstellende Kunst",
    "ticker.danza": "Tanz",
    "ticker.cine": "Kino",
    "ticker.literatura": "Literatur",
    "ticker.patrimonio": "Kulturerbe",
    "ticker.talleres": "Kulturelle Workshops",

    // Explorar por Categorías
    "home.explorar_disciplinas": "Disziplinen & Orte",
    "home.explorar_titulo": "Nach Kategorie erkunden",
    "home.ver_agenda": "Programm ansehen",
    "home.descubre_loja": "Entdecken Sie das Geschehen in Loja",
    "home.eventos_actividades": "Veranstaltungen, Kunst und Kulturaktivitäten in der Stadt",

    // Nombres de categorías
    "cat.arte": "Kunst & Ausstellungen",
    "cat.teatro": "Theater",
    "cat.musica": "Musik",
    "cat.ferias": "Messen",
    "cat.artes_vivas": "Darstellende Kunst",

    // SeccionCategoria — H2 SEO
    "scat.h2.arte": "Welche Kunstevents und Ausstellungen gibt es in Loja?",
    "scat.h2.teatro": "Welche Theateraufführungen finden in Loja statt?",
    "scat.h2.musica": "Welche Konzerte und Musikevents gibt es in Loja?",
    "scat.h2.ferias": "Welche Kulturmessen und Festivals finden in Loja statt?",
    "scat.h2.artes_vivas": "Welche Darstellende Kunst Events gibt es in Loja?",

    // SeccionCategoria — SEO
    "scat.seo.arte": "Entdecken Sie Gemälde-, Foto- und Skulpturausstellungen sowie offene Kunstgalerien in Loja.",
    "scat.seo.teatro": "Finden Sie Theatervorstellungen, Mikro-Theater und Bühnenaufführungen in den Theatern Lojas.",
    "scat.seo.musica": "Entdecken Sie Live-Konzerte, Sinfoniekonzerte, Musikfestivals und Akustikauftritte in Loja.",
    "scat.seo.ferias": "Entdecken Sie Kunsthandwerksmessen, Kulturfestivals, Gastronomiefestivals und traditionelle Märkte in Loja.",
    "scat.seo.artes_vivas": "Erleben Sie internationale und lokale Festivals der Darstellenden Kunst, Tanz, Pantomime und Straßenshows in Loja.",
    "scat.ver_todo": "Alle anzeigen in",
    "scat.sin_eventos": "Derzeit sind in dieser Kategorie keine Events registriert.",

    // Footer
    "footer.descripcion": "Das offizielle Kulturveranstaltungsverzeichnis von Loja. Kunst, Theater, Musik, Messen und Darstellende Kunst an einem Ort.",
    "footer.categorias": "Kategorien",
    "footer.info": "Kulturagenda",
    "footer.info_desc": "Entdecken Sie die besten Aktivitäten, Ausstellungen, Aufführungen und Konzerte in Loja, Ecuador.",
    "footer.sobre": "Über das Projekt",
    "footer.publicar": "Event veröffentlichen",
    "footer.creditos": "Technologieinitiative erstellt und entwickelt von",

    // Buzón
    "buzon.badge": "✨ Community-Validierungsphase",
    "buzon.titulo": "Haben Sie eine Empfehlung zur Verbesserung der Kulturagenda von Loja?",
    "buzon.desc": "Wir befinden uns in der Validierungsphase. Ihr Beitrag hilft uns, eine bessere Plattform für unsere Stadt aufzubauen.",
    "buzon.btn_abrir": "✍️ Empfehlung hinterlassen",
    "buzon.label_mensaje": "Was möchten Sie auf der Plattform sehen, verbessern oder hinzufügen?",
    "buzon.placeholder_mensaje": "Bsp.: Ich hätte gerne Events aus umliegenden Gemeinden oder Kindertheater...",
    "buzon.label_contacto": "Ihr Kontakt oder Name",
    "buzon.opcional": "(Optional)",
    "buzon.placeholder_contacto": "Name, WhatsApp oder E-Mail",
    "buzon.btn_enviar": "Feedback senden",
    "buzon.enviando": "Wird gesendet...",
    "buzon.cancelar": "Abbrechen",
    "cat.header_badge": "Kulturkategorie",
    "cat.proximos": "kommende",
    "cat.total": "insgesamt",
    "section.proximos_cartelera": "Kommende Veranstaltungen im Programm (Heute und Folgetage)",
    "cat.ver_todas_categorias": "Alle Kategorien ansehen",
    "buzon.gracias": "Herzlichen Dank für Ihren Beitrag! Ihre Empfehlung wurde für das Team registriert.",

    // Detalle de evento
    "nav.todos_eventos": "Veranstaltungen",
    "zona.urbana": "STÄDTISCH",
    "zona.rural": "LÄNDLICH",
    "evento.varios_dias": "Mehrtägige Veranstaltung",
    "evento.fecha_hora": "Datum & Uhrzeit",
    "evento.fecha_inicio": "Startdatum",
    "evento.fecha_fin": "Enddatum",
    "evento.lugar": "Veranstaltungsort",
    "evento.organizador": "Veranstalter / Gastgeber",
    "evento.zona_parroquial": "Stadtbezirk / Gemeinde",
    "evento.sobre_este_evento": "Über dieses Event",
    "evento.ubicacion_titulo": "Veranstaltungsort auf der Karte",
    "evento.abrir_maps": "In Google Maps öffnen",
    "evento.otros_interesar": "Weitere Events, die Sie interessieren könnten",

    // Archivo cultural / EventosPasadosList
    "archivo.eyebrow": "Kulturarchiv",
    "archivo.item": "Eintrag",
    "archivo.item_plural_suffix": "",
    "archivo.buscar_placeholder": "Im Archiv suchen...",
    "archivo.sin_resultados": "Keine vergangenen Events mit diesem Begriff gefunden.",
    "archivo.mostrar_menos": "Weniger anzeigen",

    // Página /eventos
    "eventos_page.breadcrumb_todos": "Alle Veranstaltungen",
    "eventos_page.titulo": "Kulturkalender & Programm",
    "eventos_page.proximos_desc": "{n} kommende Events erkunden oder einen Tag im interaktiven Kalender antippen.",
    "eventos_page.sin_proximos": "Keine kommenden Veranstaltungen im Moment.",
    "eventos_page.seccion_proximos": "Kommende Events (Heute und folgende Tage)",
    "eventos_page.sin_proximos_msg": "Keine kommenden Events für heute oder die nächsten Tage geplant.",
    "eventos_page.pasados_titulo": "Frühere Veranstaltungen in Loja",
    "eventos_page.pasados_subtitulo": "Historische Aufzeichnungen vergangener Aufführungen, Workshops und Festivals in der Stadt.",

    // Zona page
    "zona.parroquia_urbana": "Stadtbezirk",
    "zona.parroquia_rural": "Ländlicher Bezirk",

    // Common
    "common.volver_inicio": "Zur Startseite",
  },

  pt: {
    // Navbar
    "nav.inicio": "Início",
    "nav.arte": "Arte",
    "nav.teatro": "Teatro",
    "nav.musica": "Música",
    "nav.ferias": "Feiras & Mercados",
    "nav.artes_vivas": "Artes Vivas",
    "nav.sobre_proyecto": "Sobre o Projeto",
    "nav.publicar": "+ Publicar evento",
    "nav.menu": "Menu",
    "nav.idioma": "Idioma",

    // Hero Principal Home
    "hero.eyebrow": "Descubra o que está acontecendo em Loja",
    "hero.h1_prefix": "O que fazer",
    "hero.h1_suffix": "em Loja?",
    "hero.subtitulo": "Eventos, arte e atividades culturais na cidade",
    "hero.btn_ver_todos": "Ver todos os eventos",
    "hero.btn_publicar": "Publicar evento",
    "hero.destacado": "Destaque",
    "hero.ver_calendario": "Ver o calendário",

    // Secciones Home
    "section.ultimos_eyebrow": "Adicionados recentemente",
    "section.ultimos_titulo": "Últimos eventos artísticos publicados em Loja",
    "section.buscar_placeholder": "Buscar eventos por nome, local ou artista...",
    "section.proximos_titulo": "Próximos eventos na programação",
    "section.ver_mas": "Ver mais eventos",
    "section.agenda_fecha": "Agenda por data",
    "section.eventos_encontrados": "eventos encontrados",

    // Chatbot Widget
    "chat.tooltip": "Procurando o que fazer ou onde se hospedar em Loja?",
    "chat.btn_label": "O que fazer em Loja?",
    "chat.title": "O que fazer em Loja?",
    "chat.subtitle": "Turismo, Agenda Cultural & Parceiros",
    "chat.welcome": "Olá! 👋 Bem-vindo a Loja. Pergunte-me sobre atividades na cidade, locais culturais, rotas ecológicas ou onde se hospedar com nossos parceiros.",
    "chat.placeholder": "Digite sua pergunta sobre atividades ou hotéis...",
    "chat.sug_hospedaje": "🏨 Onde posso me hospedar em Loja?",
    "chat.sug_naturaleza": "🌿 Lugares de natureza próximos",
    "chat.sug_hoy": "🎭 O que fazer hoje na cidade?",
    "chat.sug_cafe": "☕ Onde tomar um bom café de Loja?",

    // Evento Detalle & Comunes
    "common.ver_evento": "Ver evento",
    "common.ver_mas": "Ver mais",
    "common.hoy": "Hoje",
    "common.este_fin_de_semana": "Este fim de semana",
    "common.gratis": "Entrada gratuita",
    "common.como_llegar": "Como chegar",
    "common.compartir": "Compartilhar evento",
    "common.copiado": "Link copiado!",
    "common.organizador": "Organizador",
    "common.lugar": "Local / Espaço",
    "common.fecha": "Data & Hora",
    "common.fecha_inicio": "Data de Início",
    "common.fecha_fin": "Data de Término",
    "common.categoria": "Categoria",
    "common.zona": "Distrito / Paróquia",
    "common.cargando_traduccion": "Traduzindo com IA...",
    "common.original_es": "Ver original em espanhol",
    "common.traducido_por_ia": "Tradução cultural com IA",
    "common.volver": "Voltar",
    "common.contacto_whatsapp": "Contatar pelo WhatsApp",
    "common.recomendar": "Caixa de sugestões",
    "common.sin_eventos": "Nenhum evento disponível nesta seção no momento.",

    // Ticker marquee
    "ticker.arte": "Arte & Exposições",
    "ticker.teatro": "Teatro",
    "ticker.musica": "Música",
    "ticker.ferias": "Feiras & Festivais",
    "ticker.artes_vivas": "Artes Vivas",
    "ticker.danza": "Dança",
    "ticker.cine": "Cinema",
    "ticker.literatura": "Literatura",
    "ticker.patrimonio": "Patrimônio",
    "ticker.talleres": "Oficinas Culturais",

    // Explorar por Categorías
    "home.explorar_disciplinas": "Disciplinas & Espaços",
    "home.explorar_titulo": "Explorar por Categoria",
    "home.ver_agenda": "Ver programação",
    "home.descubre_loja": "Descubra o que está acontecendo em Loja",
    "home.eventos_actividades": "Eventos, arte e atividades culturais na cidade",

    // Nombres de categorías
    "cat.arte": "Arte & Exposições",
    "cat.teatro": "Teatro",
    "cat.musica": "Música",
    "cat.ferias": "Feiras",
    "cat.artes_vivas": "Artes Vivas",

    // SeccionCategoria — H2 SEO
    "scat.h2.arte": "Quais eventos artísticos e exposições de arte existem em Loja?",
    "scat.h2.teatro": "Quais peças de teatro e eventos teatrais são apresentados em Loja?",
    "scat.h2.musica": "Quais concertos e eventos musicais acontecem em Loja?",
    "scat.h2.ferias": "Quais feiras culturais e festivais são realizados em Loja?",
    "scat.h2.artes_vivas": "Quais eventos de Artes Vivas e expressões cênicas há em Loja?",

    // SeccionCategoria — SEO
    "scat.seo.arte": "Explore exposições de pintura, fotografia, escultura e galerias de arte abertas ao público em Loja.",
    "scat.seo.teatro": "Encontre cartaz de peças teatrais, micro-teatro, dramaturgia e apresentações cênicas nos teatros de Loja.",
    "scat.seo.musica": "Descubra shows ao vivo, recitais sinfônicos, festivais musicais e apresentações acústicas em Loja.",
    "scat.seo.ferias": "Descubra feiras artesanais, empreendimentos culturais, festivais gastronômicos e mercados tradicionais em Loja.",
    "scat.seo.artes_vivas": "Viva os festivais internacionais e locais de artes vivas, dança, mímica e espetáculos de rua em Loja.",
    "scat.ver_todo": "Ver tudo em",
    "scat.sin_eventos": "Nenhum evento registrado nesta categoria no momento.",

    // Footer
    "footer.descripcion": "O diretório oficial de eventos culturais de Loja. Arte, teatro, música, feiras e artes vivas em um só lugar.",
    "footer.categorias": "Categorias",
    "footer.info": "Agenda Cultural",
    "footer.info_desc": "Descubra as melhores atividades, exposições, peças e concertos em Loja, Equador.",
    "footer.sobre": "Sobre o projeto",
    "footer.publicar": "Publicar um Evento",
    "footer.creditos": "Iniciativa tecnológica criada e desenvolvida por",

    // Buzón
    "buzon.badge": "✨ Fase de validação comunitária",
    "buzon.titulo": "Você tem uma recomendação para melhorar a Agenda Cultural de Loja?",
    "buzon.desc": "Estamos em fase de validação. Sua contribuição nos ajuda a construir uma plataforma melhor para nossa cidade.",
    "buzon.btn_abrir": "✍️ Deixar uma recomendação",
    "buzon.label_mensaje": "O que você gostaria de ver, melhorar ou adicionar à plataforma?",
    "buzon.placeholder_mensaje": "Ex.: Gostaria de eventos de paróquias próximas, ou teatro infantil adicionado...",
    "buzon.label_contacto": "Seu contato ou nome",
    "buzon.opcional": "(Opcional)",
    "buzon.placeholder_contacto": "Nome, WhatsApp ou e-mail",
    "buzon.btn_enviar": "Enviar contribuição",
    "buzon.enviando": "Enviando...",
    "buzon.cancelar": "Cancelar",
    "cat.header_badge": "Categoria Cultural",
    "cat.proximos": "próximos",
    "cat.total": "no total",
    "section.proximos_cartelera": "Próximos eventos na programação (Hoje e datas seguintes)",
    "cat.ver_todas_categorias": "Ver todas as categorias",
    "buzon.gracias": "Muito obrigado pela sua contribuição! Sua recomendação foi registrada para a equipe.",

    // Detalle de evento
    "nav.todos_eventos": "Eventos",
    "zona.urbana": "URBANA",
    "zona.rural": "RURAL",
    "evento.varios_dias": "Evento de vários dias",
    "evento.fecha_hora": "Data e Hora",
    "evento.fecha_inicio": "Data de Início",
    "evento.fecha_fin": "Data de Término",
    "evento.lugar": "Local / Espaço",
    "evento.organizador": "Organizador / Gestor",
    "evento.zona_parroquial": "Localização Paroquial",
    "evento.sobre_este_evento": "Sobre este evento",
    "evento.ubicacion_titulo": "Localização do evento",
    "evento.abrir_maps": "Abrir no Google Maps",
    "evento.otros_interesar": "Outros eventos que podem lhe interessar",

    // Archivo cultural / EventosPasadosList
    "archivo.eyebrow": "Arquivo Cultural",
    "archivo.item": "evento",
    "archivo.item_plural_suffix": "s",
    "archivo.buscar_placeholder": "Buscar no arquivo...",
    "archivo.sin_resultados": "Nenhum evento anterior encontrado com esse termo.",
    "archivo.mostrar_menos": "Mostrar menos",

    // Página /eventos
    "eventos_page.breadcrumb_todos": "Todos os eventos",
    "eventos_page.titulo": "Agenda e Calendário Cultural",
    "eventos_page.proximos_desc": "Explore {n} eventos próximos ou toque em um dia no calendário interativo.",
    "eventos_page.sin_proximos": "Nenhum evento próximo no momento.",
    "eventos_page.seccion_proximos": "Próximos Eventos (Hoje e dias seguintes)",
    "eventos_page.sin_proximos_msg": "Nenhum evento próximo programado para hoje ou os dias seguintes.",
    "eventos_page.pasados_titulo": "Eventos Realizados Anteriormente em Loja",
    "eventos_page.pasados_subtitulo": "Registro histórico de apresentações, workshops e festivais concluídos na cidade.",

    // Zona page
    "zona.parroquia_urbana": "Parroéquia Urbana",
    "zona.parroquia_rural": "Parroéquia Rural",

    // Common
    "common.volver_inicio": "Voltar ao início",
  },
};
