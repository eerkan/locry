import type { LegalContent } from '../privacy-content';

export const es: LegalContent = {
  lang: 'es',
  meta: {
    title: 'Términos del servicio — Locry',
    description:
      'Los términos de uso de Locry, la app gratuita y de código abierto de notas y tareas cifradas: tus datos y claves, uso aceptable, servicios de terceros, respuestas de IA y ausencia de garantía.',
  },
  title: 'Términos del servicio',
  updated: 'Última actualización',
  intro:
    'Estos términos se aplican cuando usas Locry en esta dirección. Locry es una app de notas y tareas gratuita y de código abierto que funciona por completo en tu navegador; no hay cuenta ni nada que comprar.',
  sections: [
    {
      heading: 'Uso de Locry',
      body: ['Al usar Locry aceptas estos términos. Si no estás de acuerdo, por favor no lo uses.'],
    },
    {
      heading: 'Código abierto',
      body: [
        'El código fuente de Locry está disponible bajo la [licencia MIT](https://github.com/eerkan/locry/blob/main/LICENSE). Puedes usarlo, copiarlo, modificarlo y distribuirlo según esa licencia; estos términos cubren el sitio en esta dirección.',
      ],
    },
    {
      heading: 'Tus datos y tus claves',
      body: [
        'Tus notas y tareas se cifran en tu dispositivo, y solo tus passkeys y tu clave de recuperación pueden abrirlas. Eres responsable de guardarlas bien: si pierdes ambas, nadie, ni siquiera el desarrollador, podrá recuperar tus datos.',
        'Haz copias de seguridad con regularidad. Los navegadores pueden borrar los datos de un sitio, por ejemplo cuando falta espacio o cuando borras tus datos de navegación.',
      ],
    },
    {
      heading: 'Uso aceptable',
      body: [
        'Usa Locry solo de forma lícita. No intentes interrumpir el sitio ni lo uses para hacer un mal uso de los servicios de terceros a los que se conecta.',
      ],
    },
    {
      heading: 'Servicios de terceros',
      body: [
        'Las funciones opcionales dependen de Google Drive, Hugging Face y GitHub Pages, cuyos propios términos se aplican cuando los usas, como los [Términos del Servicio de Google](https://policies.google.com/terms) y los [Términos del Servicio de GitHub](https://docs.github.com/site-policy/github-terms/github-terms-of-service).',
      ],
    },
    {
      heading: 'Respuestas de IA',
      body: [
        'Los resultados de la búsqueda inteligente y las respuestas de «Pregunta a tus notas» vienen de pequeños modelos de IA que funcionan en tu dispositivo. Pueden ser incompletos o incorrectos; revisa las fuentes antes de fiarte de ellos.',
      ],
    },
    {
      heading: 'Sin garantía',
      body: [
        'Locry se ofrece «tal cual», sin garantía de ningún tipo, expresa o implícita, incluida la idoneidad para un fin concreto y la disponibilidad ininterrumpida.',
        'En la medida en que lo permita la ley, el desarrollador no es responsable de ninguna pérdida de datos ni de otros daños derivados del uso de Locry.',
      ],
    },
    {
      heading: 'Cambios',
      body: [
        'Estos términos pueden cambiar. La nueva versión se publicará en esta página con una nueva fecha; seguir usando Locry después significa que la aceptas.',
      ],
    },
    {
      heading: 'Contacto',
      body: ['Preguntas sobre estos términos: abre una issue en [github.com/eerkan/locry](https://github.com/eerkan/locry/issues).'],
    },
  ],
  back: 'Volver a Locry',
};
