import type { LandingContent } from '../landing-content';

export const es: LandingContent = {
  lang: 'es',
  meta: {
    title: 'Locry — Notas y tareas cifradas de extremo a extremo, con passkey',
    description:
      'Locry es una app de notas y tareas de código abierto y sin servidor que funciona en el navegador: Markdown, tareas, acceso con passkey, AES-256, sincronización cifrada y búsqueda con IA privada.',
    ogImageAlt: 'El editor de notas de Locry: una nota Markdown con vista previa en vivo, notas y tareas en la barra lateral',
  },
  nav: {
    features: 'Funciones',
    security: 'Seguridad',
    sync: 'Sincronización',
    selfHost: 'Autoalojar',
    faq: 'Preguntas',
    open: 'Abrir Locry',
    skip: 'Saltar al contenido',
  },
  sections: {
    overview: 'Resumen',
    features: 'Funciones',
    tasks: 'Tareas',
    security: 'Seguridad',
    vaults: 'Bóvedas',
    sync: 'Sincronización',
    search: 'Búsqueda inteligente',
    compare: 'Comparación',
    selfHost: 'Autoalojamiento',
    faq: 'Preguntas',
  },
  ui: {
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    language: 'Idioma',
    flow: 'Flujo de desbloqueo',
    terminal: 'Terminal',
  },
  hero: {
    eyebrow: 'Código abierto · Sin servidor · Funciona sin conexión',
    title: 'Tus notas y tareas,',
    accent: 'cerradas solo con tu llave.',
    lead:
      'Locry es una app de notas y tareas cifrada de extremo a extremo que funciona en tu navegador. Sin cuenta, sin contraseña, sin servidor: tu bóveda se abre con tu huella, tu rostro o el PIN del dispositivo — con una passkey.',
    start: 'Empezar gratis',
    resume: 'Abrir tu bóveda',
    github: 'Ver en GitHub',
    badges: ['AES-256-GCM', 'Passkeys (WebAuthn PRF)', 'Markdown', 'PWA', '11 idiomas'],
    screenshotAlt: 'El editor Markdown de Locry: lista de notas a la izquierda, editor y vista previa en vivo a la derecha',
    phoneAlt: 'Locry en un teléfono: la lista de notas',
  },
  summary: {
    title: 'Locry de un vistazo',
    text:
      'Locry es una app web gratuita y de código abierto que guarda tus notas y tareas en tu dispositivo, cifradas con una llave que solo tú puedes abrir. No se envía nada a ningún servidor; si quieres, hace copias y se sincroniza con tus otros dispositivos a través de Google Drive, siempre cifrada.',
    facts: [
      { term: 'Qué es', detail: 'Notas Markdown y listas de tareas en una sola app' },
      { term: 'Precio', detail: 'Gratis y de código abierto' },
      { term: 'Cuenta', detail: 'Ninguna; entras con una passkey' },
      { term: 'Cifrado', detail: 'AES-256-GCM por registro; la llave se deriva de tu passkey' },
      { term: 'Dónde están los datos', detail: 'En tu dispositivo, en el almacenamiento cifrado del navegador' },
      { term: 'Sincronización', detail: 'Opcional, cifrada de extremo a extremo mediante Google Drive' },
      { term: 'Plataformas', detail: 'Navegadores modernos; instalable en macOS, Windows, Linux, iOS y Android (PWA)' },
      { term: 'Idiomas', detail: 'Inglés, turco, chino, español, árabe, portugués, indonesio, francés, japonés, ruso y alemán' },
    ],
  },
  features: {
    title: 'Todo lo que necesitas para tomar notas, sin renunciar a tu privacidad',
    lead: 'Locry parece sencilla, pero está completa para el día a día. Cada función trabaja dentro de tu bóveda cifrada.',
    items: [
      {
        icon: 'lucideNotebookPen',
        title: 'Notas Markdown',
        text: 'Modos de edición, dividido y vista previa; barra de herramientas y atajos, etiquetas, fijado, archivo y listas de tareas marcables.',
      },
      {
        icon: 'lucideListTodo',
        title: 'Tareas',
        text: 'Vistas Bandeja de entrada, Hoy, Próximas y Completadas; listas de colores, subtareas, prioridades, fechas límite y arrastrar y soltar.',
      },
      {
        icon: 'lucideFingerprint',
        title: 'Acceso con passkey',
        text: 'Sin contraseña. La bóveda se descifra con una passkey que desbloqueas con tu huella, tu rostro o el PIN del dispositivo; una clave de recuperación es tu respaldo.',
      },
      {
        icon: 'lucideLayers',
        title: 'Varias bóvedas',
        text: 'Bóvedas totalmente separadas, como Personal y Trabajo, cada una con sus passkeys, clave de recuperación, copias de seguridad y ajustes.',
      },
      {
        icon: 'lucideRefreshCw',
        title: 'Teléfono y ordenador',
        text: 'Sincronización cifrada de extremo a extremo mediante Google Drive. Los borrados se trasladan y las ediciones en conflicto nunca se pierden.',
      },
      {
        icon: 'lucideSparkles',
        title: 'Búsqueda inteligente',
        text: 'Busca por significado, no solo por palabras. El modelo de IA funciona en tu navegador; tus notas nunca se envían a un servicio de IA.',
      },
      {
        icon: 'lucideArchive',
        title: 'Copias cifradas',
        text: 'Copias .locry en un solo archivo, comprimidas y cifradas, a un archivo o a Google Drive, automáticamente si quieres.',
      },
      {
        icon: 'lucideWifiOff',
        title: 'Sin conexión e instalable',
        text: 'Se abre sin internet. Instálala en el escritorio o en la pantalla de inicio como una app.',
      },
      {
        icon: 'lucideCommand',
        title: 'Pensada para el teclado',
        text: 'Paleta de comandos ⌘K, «/» para buscar, N para una nota nueva, T para una tarea nueva y atajos G para navegar.',
      },
    ],
  },
  security: {
    title: '¿Cómo funciona el cifrado?',
    lead:
      'En Locry la confianza se apoya en las matemáticas, no en un servidor. La llave solo existe en tu dispositivo, y solo en memoria mientras la bóveda está abierta.',
    steps: [
      {
        title: '1. Passkey',
        text: 'Al desbloquear, tu dispositivo usa la extensión WebAuthn PRF para generar un secreto exclusivo de tu passkey. Nunca sale del dispositivo.',
      },
      {
        title: '2. Llave',
        text: 'HKDF-SHA-256 deriva de ese secreto una llave que abre la llave aleatoria de 256 bits de tu bóveda.',
      },
      {
        title: '3. Registros',
        text: 'Cada nota y cada tarea se cifra por separado con AES-256-GCM, vinculada a su tipo y a su id.',
      },
    ],
    tableTitle: 'Modelo de seguridad',
    rows: [
      ['Llave de la bóveda', '256 bits aleatorios; solo en memoria, no exportable'],
      ['Acceso', 'Passkey (WebAuthn PRF) → HKDF-SHA-256'],
      ['Recuperación', 'Clave de recuperación de 256 bits en una ranura de llave aparte'],
      ['Datos', 'AES-256-GCM por registro, con contexto autenticado (AAD)'],
      ['Copias y sincronización', 'gzip + AES-256-GCM; cabecera autenticada'],
      ['Vista previa', 'Saneada con DOMPurify, imágenes remotas bloqueadas, Content Security Policy'],
      ['Bloqueo automático', 'La llave se borra de la memoria tras el tiempo de inactividad que elijas'],
    ],
    note: 'Si pierdes tus passkeys y tu clave de recuperación, nadie — ni siquiera Locry — puede acceder a tus datos. No es un fallo: es el diseño.',
  },
  vaults: {
    title: 'Lo personal y el trabajo, en bóvedas separadas',
    text:
      'Cada bóveda es independiente: su propia llave de cifrado, passkeys, clave de recuperación, copias y ajustes. Cambiar de bóveda bloquea la que está abierta; los datos de una bóveda nunca se ven desde otra.',
    bullets: [
      'Elige la bóveda en la pantalla de bloqueo; se recuerda la última',
      'Pon nombre y color a cada bóveda; cambia desde la barra lateral con un clic',
      'Al restaurar una copia se fusiona en la misma bóveda o se añade como una nueva',
    ],
    alt: 'La pantalla de bloqueo de Locry: elegir una bóveda y desbloquear con passkey',
  },
  sync: {
    title: 'La misma bóveda en tu teléfono y tu ordenador',
    lead:
      'No hay un servidor de Locry para sincronizar. Cada dispositivo escribe su propia copia cifrada de la bóveda en una carpeta de app oculta de tu Google Drive y fusiona las copias de tus otros dispositivos.',
    bullets: [
      'Google solo ve archivos cifrados; nunca contenido, títulos ni etiquetas',
      'Las notas y tareas que borras también se borran en tus otros dispositivos',
      'Si una nota cambió en dos dispositivos, la versión más antigua se guarda como nota «(conflicto)»',
      'Las passkeys añadidas y el nombre y color de la bóveda también se sincronizan',
      'Funciona con la app abierta: al desbloquear, al volver a la pestaña y tras los cambios',
    ],
    stepsTitle: 'Cómo configurarla',
    steps: [
      'En el ordenador: Ajustes → Sincronización entre dispositivos → Activar sincronización.',
      'En el teléfono, abre Locry en la misma dirección y añádela a la pantalla de inicio.',
      'Restaurar desde una copia → Google Drive → elige tu bóveda en Bóvedas sincronizadas.',
      'Desbloquea con tu passkey sincronizada o tu clave de recuperación; la sincronización empieza sola.',
    ],
    alt: 'La sincronización entre dispositivos en los ajustes de Locry, con los dispositivos que sincronizan la bóveda',
  },
  search: {
    title: 'IA que busca por significado y protege tu privacidad',
    text:
      'Busca «planes de vacaciones» y encuentra también tu nota «Reserva de hotel en Lisboa». El modelo predeterminado es EmbeddingGemma de Google, y en Ajustes puedes elegir entre cinco modelos multilingües. El modelo se descarga una vez y funciona por completo en tu navegador.',
    bullets: [
      'Búsqueda por palabras y semántica a la vez, en cualquiera de los idiomas de la app',
      'Los vectores se guardan cifrados y quedan fuera de las copias y la sincronización',
      'Sugerencias de «notas similares»; ⌘K para buscar desde cualquier parte',
      'Opcional: no se descarga nada si no la activas',
    ],
    alt: 'La página de búsqueda de Locry: resultados semánticos en notas y tareas',
  },
  tasks: {
    title: 'Tareas, justo al lado de tus notas',
    text: 'Mira qué hacer en la vista Hoy, no se te pasa nada atrasado y vincula las tareas con sus notas.',
    bullets: [
      'Vistas inteligentes: Bandeja de entrada, Hoy, Próximas, Completadas',
      'Listas de colores, subtareas, prioridades y fechas límite',
      'Orden con arrastrar y soltar, alta rápida con T',
    ],
    alt: 'Tareas en Locry: la vista Hoy con prioridades y fechas límite',
  },
  selfHost: {
    title: 'Ejecútala en tu propio servidor',
    lead:
      'Locry es de código abierto y solo consta de archivos estáticos. Se ejecuta en Docker con un comando y puede servir tu propio dominio con HTTPS automático.',
    code: 'git clone https://github.com/emreerkangames/locry.git\ncd locry\ncp .env.example .env\ndocker compose up -d --build',
    notes: [
      'El contenedor no guarda datos: las notas siguen cifradas en el navegador; borrar el contenedor no cambia nada.',
      'Usuario sin privilegios de root, sistema de archivos de solo lectura, capacidades eliminadas.',
      'Con COMPOSE_PROFILES=https y LOCRY_DOMAIN, Caddy obtiene el certificado automáticamente.',
    ],
    github: 'Código fuente y guía de instalación',
  },
  compare: {
    title: 'Locry frente a las apps de notas en la nube habituales',
    lead: 'La mayoría de las apps de notas guardan tus datos en sus servidores y pueden leerlos. Locry lo hace imposible desde el principio.',
    headers: ['', 'App de notas en la nube habitual', 'Locry'],
    rows: [
      ['Dónde están tus datos', 'En los servidores de la empresa', 'En tu dispositivo, cifrados'],
      ['Quién puede leerlos', 'El proveedor del servicio', 'Solo tú'],
      ['Acceso', 'Correo y contraseña', 'Passkey, sin contraseña'],
      ['Cuenta', 'Obligatoria', 'No hace falta'],
      ['Sin conexión', 'Limitado', 'Completo'],
      ['Búsqueda con IA', 'Las notas van a un servidor', 'Funciona en tu navegador'],
      ['Código fuente', 'Cerrado', 'Abierto'],
    ],
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [
      {
        q: '¿Qué es Locry?',
        a: 'Locry es una app gratuita y de código abierto que funciona en tu navegador y guarda notas Markdown y tareas cifradas de extremo a extremo. No necesita cuenta ni contraseña; la bóveda se abre con una passkey.',
      },
      {
        q: '¿Dónde se guardan mis datos?',
        a: 'En tu dispositivo, cifrados, en el almacenamiento IndexedDB del navegador. Locry no tiene un servidor que guarde tus datos. Si activas las copias en Google Drive o la sincronización, a Drive solo llegan archivos cifrados.',
      },
      {
        q: '¿Locry es gratis?',
        a: 'Sí. Locry es gratuita y de código abierto; el código está en GitHub. También puedes ejecutarla en tu propio servidor con Docker.',
      },
      {
        q: '¿Qué es una passkey y por qué no hay contraseña?',
        a: 'Una passkey es una forma de acceso resistente al phishing que usa tu huella, tu rostro o el PIN del dispositivo. Locry deriva su llave de cifrado de la passkey mediante la extensión WebAuthn PRF, así que no hay contraseña que adivinar ni filtrar.',
      },
      {
        q: '¿Qué pasa si pierdo mi passkey?',
        a: 'Abres la bóveda con la clave de recuperación de 256 bits que guardaste al configurarla y añades una passkey nueva. Si pierdes tus passkeys y la clave de recuperación, nadie puede acceder a los datos.',
      },
      {
        q: '¿Cómo sincronizo el teléfono y el ordenador?',
        a: 'Activa la Sincronización entre dispositivos en Ajustes; en el teléfono, abre Locry en la misma dirección y elige Restaurar desde una copia → Google Drive → tu bóveda en Bóvedas sincronizadas. Cada dispositivo escribe su propia copia cifrada en Drive y fusiona las demás.',
      },
      {
        q: '¿Puede Google leer mis notas?',
        a: 'No. Los archivos de copia y sincronización se cifran con AES-256-GCM en tu dispositivo antes de llegar a Drive. Locry solo accede a su propia carpeta de app oculta (drive.appdata) y no ve tus otros archivos de Drive.',
      },
      {
        q: '¿La búsqueda con IA envía mis notas a algún sitio?',
        a: 'No. El modelo de lenguaje multilingüe se descarga una vez y funciona en un Web Worker de tu navegador. Tus notas nunca se envían a un servicio de IA.',
      },
      {
        q: '¿Funciona sin conexión?',
        a: 'Sí. Locry es una app web instalable (PWA) y funciona sin conexión tras la primera visita. Solo la sincronización con Drive y la primera descarga del modelo necesitan internet.',
      },
      {
        q: '¿Qué navegadores y dispositivos son compatibles?',
        a: 'Los navegadores compatibles con passkeys con la extensión PRF: Chrome y Edge 118+, Safari 18+. Sirven el Llavero de iCloud, el Gestor de contraseñas de Google, 1Password o una llave de seguridad física.',
      },
      {
        q: '¿Puedo exportar mis datos?',
        a: 'Sí. Descarga desde Ajustes una copia .locry cifrada en un solo archivo; se abre en otro dispositivo o dirección con una passkey o la clave de recuperación.',
      },
    ],
  },
  cta: {
    title: 'Que tus notas sigan siendo tuyas.',
    text: 'Configurarla lleva un minuto: ponle nombre a tu bóveda, crea una passkey y guarda tu clave de recuperación.',
    start: 'Usar Locry gratis',
    github: 'Ver el código fuente',
  },
  footer: {
    tagline: 'Notas y tareas cifradas de extremo a extremo.',
    openSource: 'Código abierto',
    madeWith: 'Hecha con Angular, Web Crypto y WebAuthn, sin servidor.',
    links: 'Enlaces',
  },
  support: {
    title: 'Apoya a Locry',
    text: 'Locry es gratis, de código abierto y sin anuncios ni rastreo. Si te resulta útil, puedes apoyar su desarrollo.',
    crypto: 'Cripto',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  howTo: {
    name: 'Crear una bóveda cifrada en Locry',
    description: 'Pasos para crear en Locry una bóveda de notas y tareas cifrada de extremo a extremo que se abre con una passkey.',
    steps: [
      { name: 'Abrir Locry', text: 'Abre Locry en tu navegador y pulsa «Empezar gratis».' },
      { name: 'Nombrar la bóveda', text: 'Elige un nombre y un color para la bóveda, por ejemplo «Personal».' },
      { name: 'Crear una passkey', text: 'Crea una passkey con tu huella, tu rostro o el PIN del dispositivo.' },
      { name: 'Guardar la clave de recuperación', text: 'Guarda la clave de recuperación en tu gestor de contraseñas y confirma uno de sus grupos.' },
    ],
  },
};
