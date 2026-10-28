import type { PrivacyContent } from '../privacy-content';

export const es: PrivacyContent = {
  lang: 'es',
  meta: {
    title: 'Política de privacidad — Locry',
    description:
      'Locry guarda tus notas y tareas cifradas en tu dispositivo. Sin servidor, sin cuenta, sin rastreo. Qué guarda Locry, qué implican Google Drive y los modelos de IA, y cómo mantienes el control.',
  },
  title: 'Política de privacidad',
  updated: 'Última actualización',
  intro:
    'Locry es una app de notas y tareas gratuita y de código abierto que funciona por completo en tu navegador. Esta política explica qué datos maneja. En resumen: tus notas nunca llegan al desarrollador, no hay ningún servidor que las guarde, ni cuenta, ni rastreo.',
  sections: [
    {
      heading: 'Qué guarda Locry y dónde',
      body: [
        'Tus notas, tareas, listas y ajustes se guardan solo en tu dispositivo, en el almacenamiento de tu navegador (IndexedDB), cifrados con AES-256-GCM. La clave se deriva de tu passkey (o de tu clave de recuperación) y solo existe en la memoria de tu dispositivo mientras la bóveda está abierta. El desarrollador no tiene acceso a tus datos ni guarda ninguna copia.',
        'Para poder mostrar la pantalla de bloqueo antes de desbloquear, algunos datos se guardan sin cifrar en el dispositivo: los nombres y colores de las bóvedas y las preferencias de la app, como el idioma y el tema.',
      ],
    },
    {
      heading: 'Sin cuenta, anuncios ni rastreo',
      body: [
        'Locry no tiene registro ni cuentas de usuario. No usa publicidad, cookies de rastreo ni rastreadores de terceros. La aplicación en sí (tus bóvedas, notas, tareas y preguntas) nunca se cuenta ni se mide.',
        'Solo las páginas públicas de este sitio (la página de inicio, esta política y los términos) cuentan las visitas con [GoatCounter](https://www.goatcounter.com), una herramienta de analítica de código abierto que respeta la privacidad: sin cookies, sin guardar nada en tu dispositivo y sin datos personales. Registra la dirección de la página, el sitio del que vienes, el tamaño de la pantalla y el navegador, el sistema operativo y el país deducidos de la solicitud; tu dirección IP no se guarda. Las visitas no se cuentan si tu navegador envía Do Not Track o Global Privacy Control.',
      ],
    },
    {
      heading: 'Google Drive (opcional)',
      body: [
        'Si conectas Google Drive para copias de seguridad o sincronización, Locry solo pide el permiso drive.appdata: una carpeta oculta de tu Drive a la que solo Locry puede acceder. No puede ver, leer ni modificar ningún otro archivo de tu Drive.',
        'Todo se cifra en tu dispositivo antes de subirse, así que Google solo guarda datos cifrados, junto con nombres, tamaños y fechas de los archivos y una etiqueta del dispositivo (por ejemplo «iPhone · Safari»). El token de acceso que emite Google (válido durante una hora) y la dirección de correo de tu cuenta de Google se guardan en la bóveda, cifrados como tus notas y solo en este dispositivo, para que Drive siga funcionando después de bloquear la bóveda; nunca se sincronizan ni se incluyen en las copias, y al desconectar se eliminan. Puedes desconectarte cuando quieras en Ajustes o en los [permisos de tu cuenta de Google](https://myaccount.google.com/permissions).',
        'El uso y la transferencia por parte de Locry de la información recibida de las API de Google cumplen la [Política de datos de usuario de los servicios de API de Google](https://developers.google.com/terms/api-services-user-data-policy), incluidos los requisitos de uso limitado (Limited Use). Esa información solo se usa para guardar y leer tus propias copias de seguridad y de sincronización cifradas; no se comparte con nadie, no se usa para publicidad y no la leen personas.',
      ],
    },
    {
      heading: 'Funciones de IA (opcionales)',
      body: [
        'Si activas la búsqueda inteligente o «Pregunta a tus notas», los archivos del modelo de IA se descargan una vez desde Hugging Face (huggingface.co). Como en cualquier descarga, Hugging Face puede ver tu dirección IP y qué archivos se pidieron. Tus notas y preguntas se procesan solo en tu dispositivo y nunca se envían a ningún servicio de IA.',
        'Si usas el dictado, el micrófono solo graba mientras dictas; la grabación se convierte en texto en tu dispositivo con un modelo de voz (Whisper, descargado una vez de Hugging Face) y después se descarta: nunca se guarda ni se envía. La lectura en voz alta usa solo voces instaladas en tu dispositivo, así que el texto de tus notas no se envía a ningún servicio de voz.',
      ],
    },
    {
      heading: 'Alojamiento',
      body: [
        'Este sitio se sirve con GitHub Pages. Como cualquier servicio de alojamiento, GitHub puede registrar datos técnicos como direcciones IP por motivos de seguridad; consulta la [Declaración de privacidad de GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). Si usas Locry en el servidor de otra persona, a ese servidor se le aplican las políticas de quien lo gestiona.',
      ],
    },
    {
      heading: 'Donaciones',
      body: [
        'Los enlaces de donación llevan a plataformas externas (como GitHub Sponsors o Ko-fi), con sus propias políticas de privacidad. Locry no recibe ningún dato de ellas.',
      ],
    },
    {
      heading: 'Tú tienes el control',
      body: [
        'Puedes borrar tus datos cuando quieras: elimina una bóveda en Ajustes o borra los datos de este sitio en tu navegador. Las copias en Google Drive se pueden borrar en Ajustes y el acceso de Locry se puede revocar en tu cuenta de Google. Como el desarrollador no tiene datos tuyos, no hay nada que solicitar ni borrar por nuestra parte.',
      ],
    },
    {
      heading: 'Cambios',
      body: ['Si esta política cambia, la nueva versión se publicará en esta página con una nueva fecha.'],
    },
    {
      heading: 'Contacto',
      body: ['Preguntas sobre esta política: abre una issue en [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Volver a Locry',
};
