export const siteData = {
  topNav: [
    { label: 'Inicio', href: '#/' },
    { label: 'Tu recorrido', href: '#roadshow-planner' },
    { label: 'Laboratorios', href: '#available-workshops' },
    { label: 'Equipo', href: '#nosotros' },
    { label: 'Recursos', href: '#recursos' },
    { label: 'Acerca de', href: '#acerca-de' }
  ],
  hero: {
    eyebrow: 'IBM Bob · habilitación práctica',
    title: 'Bienvenido a IBM Bob:<br>Tu Socio de Desarrollo Potenciado por IA',
    description: '¡Hola, soy Bob! Estoy aquí para trabajar junto a ti en tu código y ayudarte a construir software de calidad más rápido.',
    ctaLabel: 'Explorar laboratorios'
  },
  sections: [
    {
      id: 'basic',
      title: 'Primeros Pasos',
      eyebrow: 'Desarrollo asistido',
      label: 'Fundamentos de Bob',
      bobMode: 'Modos · Skills · SDLC',
      description: 'Usa los modos de Bob, especialízalo con skills y rules para auditar y generar código seguro, y construye una tienda de café de punta a punta.',
      actionLabel: 'Explorar Primeros Pasos',
      labs: [
        {
          slug: 'hands-on-inicial',
          title: 'De la idea al código: planifica, valida y ejecuta con IBM Bob',
          description: 'Analiza una app en Ask, diseña e implementa un carrito en Plan y Agent, crea un modo de Product Manager y conecta búsqueda web en tiempo real con MCP y Tavily.',
          supporting: 'Ask · Plan · Agent · MCP',
          featured: true,
          banner: './assets/images/labs/hands-on-inicial/banner_bob.png',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Introducción', file: './content/basic/hands-on-inicial/overview.html', tags: ['Modos agénticos'] },
            { slug: 'lab1', label: 'Ask Mode', file: './content/basic/hands-on-inicial/lab1-ask-mode.html', tags: ['Ask Mode'], bobcoinCost: { min: 1, max: 2 } },
            { slug: 'lab2', label: 'Plan y Agent', file: './content/basic/hands-on-inicial/lab2-modos.html', tags: ['Plan · Agent'], bobcoinCost: { min: 4, max: 8 } },
            { slug: 'lab3', label: 'Modo personalizado', file: './content/basic/hands-on-inicial/lab4-modo-personalizado.html', tags: ['Modo personalizado'], bobcoinCost: { min: 2, max: 5 } },
            { slug: 'lab4', label: 'MCP', file: './content/basic/entendiendo-bob/lab3-mcp-tavily.html', tags: ['MCP · Tavily'], bobcoinCost: { min: 3, max: 6 } }
          ]
        },
        {
          slug: 'entendiendo-bob',
          title: '¿Tu código es seguro? Detecta vulnerabilidades antes de producción',
          description: 'Define rules persistentes para el equipo, audita Galaxium Travels con un skill ASVS (SARIF y OSCAL) y genera un endpoint seguro con un flujo actor-critic aislado.',
          supporting: 'Skills · Rules · Actor-critic',
          featured: true,
          banner: './assets/images/labs/entendiendo-bob/banner_seguridad_bob.png',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Introducción', file: './content/basic/entendiendo-bob/overview.html', tags: ['Skills · Rules'] },
            { slug: 'lab1', label: 'Rules', file: './content/basic/entendiendo-bob/lab2-rules.html', tags: ['Rules'], bobcoinCost: { min: 2, max: 4 } },
            { slug: 'lab2', label: 'Auditoría', file: './content/basic/entendiendo-bob/lab1-seguridad.html', tags: ['Seguridad · ASVS'], bobcoinCost: { min: 5, max: 10 } },
            { slug: 'lab3', label: 'Código seguro', file: './content/basic/entendiendo-bob/lab3-codigo-seguro.html', tags: ['Actor-critic'], bobcoinCost: { min: 8, max: 15 } }
          ]
        },
        {
          slug: 'software-development-lifecycle',
          title: 'Construye una tienda de café de punta a punta',
          description: 'Recorre el ciclo completo en Bob\'s Beans: planifica desde mockups, implementa tienda, producto y carrito en React, anima con Framer Motion, revisa el diseño y documenta con MkDocs.',
          supporting: 'React · Vite · Tailwind',
          customOverview: true,
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Introducción', file: './content/basic/software-development-lifecycle/overview.html', tags: ['SDLC completo'] },
            { slug: 'plan', label: 'Planificación', file: './content/basic/software-development-lifecycle/plan.html', tags: ['Plan Mode'], bobcoinCost: { min: 3, max: 6 } },
            { slug: 'storefront', label: 'Tienda', file: './content/basic/software-development-lifecycle/lab2-storefront.html', tags: ['Agent Mode'], bobcoinCost: { min: 6, max: 12 } },
            { slug: 'product', label: 'Producto', file: './content/basic/software-development-lifecycle/lab3-product.html', tags: ['Agent Mode'], bobcoinCost: { min: 6, max: 12 } },
            { slug: 'cart', label: 'Carrito', file: './content/basic/software-development-lifecycle/lab4-cart.html', tags: ['Agent Mode'], bobcoinCost: { min: 6, max: 12 } },
            { slug: 'animations', label: 'Animaciones', file: './content/basic/software-development-lifecycle/lab5-animations.html', tags: ['Framer Motion'], bobcoinCost: { min: 4, max: 8 } },
            { slug: 'review', label: 'Revisión', file: './content/basic/software-development-lifecycle/lab6-review.html', tags: ['Plan · Agent'], bobcoinCost: { min: 4, max: 8 } },
            { slug: 'docs', label: 'Documentar', file: './content/basic/software-development-lifecycle/lab7-docs.html', tags: ['MkDocs'], bobcoinCost: { min: 4, max: 8 } }
          ]
        }
      ]
    },
    {
      id: 'integraciones',
      title: 'Integra tu plataforma fácilmente con IBM Bob',
      eyebrow: 'Automatización',
      label: 'Integración de plataforma',
      bobMode: 'Eventos y agentes',
      description: 'Kafka + watsonx Orchestrate + storefront React — un pipeline retail agéntico de extremo a extremo.',
      actionLabel: 'Explorar integración de plataforma',
      labs: [
        {
          slug: 'agentic-retail-confluent',
          title: 'Conecta tus agentes con tus datos en tiempo real',
          description: 'Crea tópicos Kafka de inventario para Voltia, deriva disponibilidad por SKU y sucursal con ksqlDB y publica eventos listos para que los consuman los agentes.',
          supporting: 'Confluent',
          featured: true,
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Introducción', file: './content/integraciones/agentic-retail-confluent/overview.html', tags: ['Confluent Kafka'] },
            { slug: 'topics', label: 'Tópico Kafka', file: './content/integraciones/agentic-retail-confluent/topics.html', tags: ['Topics'], bobcoinCost: { min: 2, max: 4 } },
            { slug: 'ksqldb', label: 'ksqlDB', file: './content/integraciones/agentic-retail-confluent/ksqldb.html', tags: ['ksqlDB'], bobcoinCost: { min: 2, max: 4 } },
            { slug: 'publish', label: 'Publicar eventos', file: './content/integraciones/agentic-retail-confluent/publish.html', tags: ['Productores'], bobcoinCost: { min: 2, max: 5 } }
          ]
        },
        {
          slug: 'agentic-retail-wxo',
          title: 'De agentes aislados a una fuerza de trabajo inteligente',
          description: 'Construye un sistema multiagente en watsonx Orchestrate: disponibilidad vía MCP sobre Kafka, sustitutos con RAG, un supervisor de tienda y un asistente de compra para el cliente.',
          supporting: 'watsonx Orchestrate',
          featured: true,
          audience: ['client', 'partner'],
          banner: './assets/images/labs/agentic-retail-wxo/banner_bob.png',
          steps: [
            { slug: 'overview', label: 'Introducción', file: './content/integraciones/agentic-retail-wxo/overview.html', tags: ['watsonx Orchestrate'] },
            { slug: 'create', label: 'Disponibilidad MCP', file: './content/integraciones/agentic-retail-wxo/create.html', tags: ['MCP'], bobcoinCost: { min: 3, max: 5 } },
            { slug: 'rag', label: 'Sustitutos RAG', file: './content/integraciones/agentic-retail-wxo/rag.html', tags: ['RAG'], bobcoinCost: { min: 2, max: 5 } },
            { slug: 'integration', label: 'Supervisor', file: './content/integraciones/agentic-retail-wxo/integration.html', tags: ['Supervisor'], bobcoinCost: { min: 2, max: 4 } },
            { slug: 'shopping', label: 'Asistente cliente', file: './content/integraciones/agentic-retail-wxo/shopping.html', tags: ['Embedded'], bobcoinCost: { min: 2, max: 4 } }
          ]
        },
        {
          slug: 'agentic-retail-voltia',
          title: 'La tienda web que habla con tus agentes',
          description: 'Implementa el storefront React de Voltia: planifica las pantallas, embebe el Asistente de Compra de Orchestrate y documenta el resultado con MkDocs.',
          supporting: 'Voltia · React',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Introducción', file: './content/integraciones/agentic-retail-voltia/overview.html', tags: ['Storefront React'] },
            { slug: 'deploy', label: 'Planificar', file: './content/integraciones/agentic-retail-voltia/deploy.html', tags: ['Plan Mode'], bobcoinCost: { min: 2, max: 4 } },
            { slug: 'build', label: 'Pantallas', file: './content/integraciones/agentic-retail-voltia/build.html', tags: ['Agent Mode'], bobcoinCost: { min: 6, max: 12 } },
            { slug: 'embed', label: 'Asistente', file: './content/integraciones/agentic-retail-voltia/embed.html', tags: ['Asistente embebido'], bobcoinCost: { min: 3, max: 7 } },
            { slug: 'polish', label: 'Pulir y docs', file: './content/integraciones/agentic-retail-voltia/polish.html', tags: ['MkDocs'], bobcoinCost: { min: 3, max: 6 } }
          ]
        }
      ]
    },
    {
      id: 'premium',
      title: 'Modernización de aplicaciones empresariales',
      eyebrow: 'Modernización',
      label: 'Modernización de aplicaciones',
      bobMode: 'Sistemas legacy',
      description: 'Java 8 → 21, Liberty, React y RPG Fixed-to-Free sobre IBM i — modernización guiada por IA de punta a punta.',
      actionLabel: 'Explorar Modernización de aplicaciones empresariales',
      labs: [
        {
          slug: 'java-modernization-v2',
          title: 'Moderniza Java a la velocidad del negocio',
          description: 'Moderniza Simple Pharmacy de WebSphere y Java 8 a Open Liberty y Java 21: UI React, tests (o TDD) y remediación de CVEs, sin reescribir la app desde cero.',
          supporting: 'Java legacy',
          featured: true,
          overviewLabsOnly: true,
          banner: './assets/images/labs/java-modernization-v2/banner_bob.png',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Introducción', file: './content/premium/java-modernization-v2/overview.html' },
            { slug: 'lab1', label: 'Replatforming Liberty', file: './content/premium/java-modernization-v2/lab1-replatforming.html', description: 'Migra de Traditional WebSphere a Open Liberty manteniendo el comportamiento de la app.', tags: ['Open Liberty'], bobcoinCost: { min: 4, max: 5 } },
            { slug: 'lab2', label: 'Upgrade Java 21', file: './content/premium/java-modernization-v2/lab2-java-upgrade.html', description: 'Java 8 → 21, Jakarta EE 10, escaneo CVE y refactor Struts 2→7.', tags: ['Java 21'], bobcoinCost: { min: 8, max: 9 } },
            { slug: 'lab3', label: 'UI con React', file: './content/premium/java-modernization-v2/lab3-ui-modernization.html', description: 'Struts/JSP → React + Material UI sobre backend JAX-RS; backend, frontend y contenedores.', tags: ['React · JAX-RS'], bobcoinCost: { min: 14, max: 16 } },
            { slug: 'lab4', label: 'Tests unitarios', file: './content/premium/java-modernization-v2/lab4-unit-tests.html', description: 'UNITTEST.md, JaCoCo, JUnit 5 + Mockito + AssertJ en lotes por capa.', tags: ['JUnit 5'], bobcoinCost: { min: 10, max: 12 } },
            { slug: 'lab-alt4', label: 'Lab 4 alternativo', file: './content/premium/java-modernization-v2/lab-alt4-tdd.html', description: 'Ruta TDD OpenAPI-first: tests primero, implementación después (Red-Green-Refactor).', tags: ['TDD'], alternative: true, bobcoinCost: { min: 5, max: 7 } },
            { slug: 'lab5', label: 'Seguridad', file: './content/premium/java-modernization-v2/lab5-security.html', description: 'Detecta y remedia CVEs críticos en dependencias antes de la entrega.', tags: ['CVEs'], bobcoinCost: { min: 4, max: 6 } }
          ]
        },
        {
          slug: 'ibm-i-rpg-development',
          title: 'Del RPG al futuro: moderniza IBM i',
          description: 'Descubre las reglas de negocio de SAMCO, convierte RPG de formato fijo a libre, construye una UI React + Carbon y reemplaza CHAIN por SQL embebido.',
          supporting: 'IBM i · SAMCO',
          featured: true,
          overviewLabsOnly: true,
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Introducción', file: './content/premium/ibm-i-rpg-development/overview.html', tags: ['RPG legacy'] },
            { slug: 'lab0', label: 'Descubrir SAMCO', file: './content/premium/ibm-i-rpg-development/lab0-discover-samco.html', description: 'Reglas de negocio, patrón panel-step y flujo de pedidos con Ask Mode.', tags: ['Ask Mode'], bobcoinCost: { min: 3, max: 8 } },
            { slug: 'lab1', label: 'Fixed-to-Free RPG', file: './content/premium/ibm-i-rpg-development/lab1-fixed-to-free.html', description: 'Convierte una subrutina a formato libre con Dcl-Proc y constantes nombradas.', tags: ['RPGLE libre'], bobcoinCost: { min: 3, max: 6 } },
            { slug: 'lab2', label: 'React + Carbon UI', file: './content/premium/ibm-i-rpg-development/lab2-react-carbon-ui.html', description: 'Tabla web moderna con datos de muestra — sin sistema IBM i.', tags: ['React · Carbon'], bobcoinCost: { min: 4, max: 10 } },
            { slug: 'lab3', label: 'RLA a SQL', file: './content/premium/ibm-i-rpg-development/lab3-rla-to-sql.html', description: 'Reemplaza un CHAIN por SELECT y añade un JOIN.', tags: ['SQL embebido'], bobcoinCost: { min: 2, max: 4 } }
          ]
        }
      ]
    }
  ]
};

export const roadshowConfig = {
  eyebrow: 'Roadshow · 3 bloques',
  title: 'Planifica tu recorrido',
  lead: 'Elige tu lab inicial y el camino que seguirás. Te armamos el plan completo del evento.',
  storageKey: 'roadshow-plan',
  blocks: [
    { id: 1, label: 'Bloque 1', subtitle: 'Fundamentos' },
    { id: 2, label: 'Bloque 2', subtitle: 'Especialización' },
    { id: 3, label: 'Bloque 3', subtitle: 'Cierre del camino' }
  ],
  initialTracks: [
    {
      id: 'A',
      slug: 'hands-on-inicial',
      label: 'Track A',
      title: 'De la idea al código',
      summary: 'Planifica, valida y ejecuta con IBM Bob: Ask, Plan, Agent, modo personalizado y MCP.',
      accent: 'core'
    },
    {
      id: 'B',
      slug: 'entendiendo-bob',
      label: 'Track B',
      title: '¿Tu código es seguro?',
      summary: 'Detecta vulnerabilidades antes de producción con rules, skills ASVS y flujo actor-critic.',
      accent: 'core'
    }
  ],
  paths: [
    {
      id: 'integration',
      label: 'Integración en tiempo real y agentes',
      summary: 'Conecta agentes con datos en streaming y construye un sistema multiagente con watsonx Orchestrate.',
      topics: ['Confluent Kafka y ksqlDB', 'Eventos en tiempo real', 'MCP sobre Kafka', 'RAG y sustitutos', 'Supervisor y asistente embebido'],
      accent: 'integration',
      tracks: [
        {
          id: 'D',
          slug: 'agentic-retail-confluent',
          block: 2,
          label: 'Track D',
          title: 'Conecta tus agentes con tus datos en tiempo real',
          accent: 'integration'
        },
        {
          id: 'F',
          slug: 'agentic-retail-wxo',
          block: 3,
          label: 'Track F',
          title: 'De agentes aislados a una fuerza de trabajo inteligente',
          accent: 'integration'
        }
      ]
    },
    {
      id: 'modernization',
      label: 'Modernización de aplicaciones legacy',
      summary: 'Moderniza stacks Java y RPG sobre IBM i con IA guiada: replatforming, UI React y código libre.',
      topics: ['Open Liberty y Java 21', 'UI React sobre JAX-RS', 'Tests y remediación CVE', 'RPG Fixed-to-Free', 'SQL embebido en IBM i'],
      accent: 'premium',
      tracks: [
        {
          id: 'C',
          slug: 'java-modernization-v2',
          block: 2,
          label: 'Track C',
          title: 'Moderniza Java a la velocidad del negocio',
          accent: 'premium'
        },
        {
          id: 'E',
          slug: 'ibm-i-rpg-development',
          block: 3,
          label: 'Track E',
          title: 'Del RPG al futuro: moderniza IBM i',
          accent: 'premium'
        }
      ]
    }
  ]
};

export function getLabTrackMeta(slug) {
  for (const track of roadshowConfig.initialTracks) {
    if (track.slug === slug) {
      return { id: track.id, label: track.label, accent: track.accent };
    }
  }

  for (const path of roadshowConfig.paths) {
    for (const track of path.tracks) {
      if (track.slug === slug) {
        return { id: track.id, label: track.label, accent: track.accent };
      }
    }
  }

  return null;
}

export function getRoadshowPlan(initialId, pathId) {
  const initialTrack = roadshowConfig.initialTracks.find((track) => track.id === initialId)
    || roadshowConfig.initialTracks[0];
  const path = roadshowConfig.paths.find((item) => item.id === pathId)
    || roadshowConfig.paths[0];

  const initialLab = findLab(initialTrack.slug);
  const pathTracks = path.tracks.map((track) => {
    const resolved = findLab(track.slug);
    return {
      ...track,
      lab: resolved?.lab || null,
      section: resolved?.section || null,
      banner: resolved?.lab?.banner || `./assets/images/labs/${track.slug}/banner_bob.png`,
      stats: resolved?.lab ? getWorkshopStats(resolved.lab) : null
    };
  });

  return {
    initial: {
      ...initialTrack,
      lab: initialLab?.lab || null,
      section: initialLab?.section || null,
      banner: initialLab?.lab?.banner || `./assets/images/labs/${initialTrack.slug}/banner_bob.png`,
      stats: initialLab?.lab ? getWorkshopStats(initialLab.lab) : null
    },
    path: {
      ...path,
      tracks: pathTracks
    },
    blocks: [
      {
        ...roadshowConfig.blocks[0],
        track: {
          ...initialTrack,
          lab: initialLab?.lab || null,
          banner: initialLab?.lab?.banner || `./assets/images/labs/${initialTrack.slug}/banner_bob.png`
        }
      },
      {
        ...roadshowConfig.blocks[1],
        track: pathTracks.find((track) => track.block === 2) || pathTracks[0]
      },
      {
        ...roadshowConfig.blocks[2],
        track: pathTracks.find((track) => track.block === 3) || pathTracks[1]
      }
    ]
  };
}

export const workshopGuides = {
  'hands-on-inicial': {
    duration: '~50 min',
    outcome: 'Usarás Ask, Plan y Agent Mode, crearás un modo personalizado y conectarás un servidor MCP.',
    requirements: [
      ['Acceso', 'IBM Bob IDE v2.x o posterior con una cuenta habilitada.'],
      ['Entorno', 'Un workspace local donde puedas crear y revisar archivos.'],
      ['Herramientas', 'Node.js 18+ para los Labs 1, 2 y 4. Una API key de Tavily para MCP.'],
      ['Conocimiento', 'Manejo básico de editor, terminal y control de cambios.']
    ],
    materials: ['Bundle LabHandsOnBob.zip (carpetas de Ask, Plan y Agent).', 'Los prompts y capturas incluidos en cada etapa.', 'Cuenta gratuita en tavily.com para el Lab 4 (MCP).'],
    path: 'Completa los cuatro labs en orden: Ask → Plan y Agent → modo personalizado → MCP.',
    learning: [
      ['Modos de Bob', 'Elegir Ask, Plan o Agent según el tipo de tarea.'],
      ['Gobernanza', 'Revisar cambios, comandos y aprobaciones antes de ejecutarlos.'],
      ['Personalización', 'Crear un modo con rol, instrucciones y herramientas propias.'],
      ['MCP', 'Conectar una herramienta externa y usarla desde Agent Mode.']
    ]
  },
  'entendiendo-bob': {
    duration: '~75 min',
    outcome: 'Fijarás rules de proyecto, auditarás Galaxium Travels y generarás un endpoint FastAPI con un flujo actor-critic antes de que llegue a SAST.',
    requirements: [
      ['Acceso', 'IBM Bob IDE v2.x o posterior con una cuenta habilitada.'],
      ['Entorno', 'Workspace con Galaxium Travels para los tres labs.'],
      ['Herramientas', 'Node.js 18+. Git si clonas el repo de ejemplo.'],
      ['Conocimiento', 'Haber completado el track de modos, o familiaridad con Ask y Agent Mode.']
    ],
    materials: ['Bundle LabHandsOnBob.zip (incluye Galaxium Travels).', 'Prompts y capturas de cada etapa.'],
    path: 'Completa los tres labs en orden: Rules → Auditoría → Código seguro (actor-critic).',
    learning: [
      ['Rules', 'Inyectar instrucciones persistentes, incluidas rules de seguridad de proyecto.'],
      ['Skills', 'Crear un skill reutilizable y generar reportes SARIF y OSCAL POA&M.'],
      ['Actor-critic', 'Generar código con un skill Actor y validarlo con un skill Critic en subagentes aislados.']
    ]
  },
  'software-development-lifecycle': {
    duration: '2–3 h',
    outcome: 'Construirás Bob\'s Beans: tres pantallas a partir de mockups, conectadas a una API hospedada, con animaciones, revisión visual y un sitio MkDocs.',
    requirements: [
      ['Acceso', 'IBM Bob IDE con Ask, Plan y Agent Mode disponibles.'],
      ['Herramientas', 'Node.js 18+, npm y Python 3 (para MkDocs en el Lab 7).'],
      ['Starter', 'Descarga bobs-beans-starter.zip desde el Inicio y ábrelo en Bob.'],
      ['Gobernanza', 'Auto-approve desactivado para revisar cada diff antes de aceptarlo.']
    ],
    materials: ['Starter bobs-beans-starter.zip (React + Vite + Tailwind).', 'Mockups en mockups/ (home, product, cart).', 'Prompts listos para copiar en cada lab.'],
    path: 'Avanza en orden: Planificación → Tienda → Producto → Carrito → Animaciones → Revisión → Documentar. Cada lab continúa la aplicación del anterior.',
    learning: [
      ['Planificación', 'Convertir mockups y un contrato de API en un plan pantalla por pantalla.'],
      ['Construcción', 'Implementar UI a partir de una captura, contra un cliente de API fijo.'],
      ['Cierre', 'Animar, revisar contra el diseño y documentar con MkDocs.']
    ]
  },
  'agentic-retail-wxo': {
    duration: '60–90 min',
    outcome: 'Desplegarás un sistema multiagente en watsonx Orchestrate conectado a herramientas MCP con Bob.',
    requirements: [
      ['Acceso', 'IBM Bob IDE e instancia activa de watsonx Orchestrate.'],
      ['Herramientas', 'Python 3.10+ y MCP Server configurado.'],
      ['Conocimiento', 'Modelado de agentes, intenciones y herramientas MCP.']
    ],
    materials: ['Prompts de configuración para watsonx Orchestrate.', 'Esquema MCP en JSON/YAML.', 'Capturas de flujo agéntico.'],
    path: 'Disponibilidad MCP → sustitutos RAG → supervisor de tienda → asistente embebible para el cliente.',
    learning: [
      ['Orquestación', 'Definir flujos multiagente autónomos.'],
      ['MCP Integración', 'Vincular herramientas externas a watsonx Orchestrate.'],
      ['Gobernanza', 'Validar respuestas y trazabilidad de agentes.']
    ]
  },
  'agentic-retail-confluent': {
    duration: '45–60 min',
    outcome: 'Construirás un pipeline de inventario en tiempo real sobre Confluent Platform (TechZone) con Bob como agente de infraestructura.',
    requirements: [],
    materials: [],
    path: 'Conecta Bob a la VM vía SSH, crea los tópicos, registra los schemas y publica los eventos de inventario.',
    learning: []
  },
  'agentic-retail-voltia': {
    duration: '45–60 min',
    outcome: 'Desplegarás una tienda local que consume inventario en tiempo real y el asistente de Orchestrate.',
    requirements: [
      ['Acceso', 'IBM Bob IDE y los labs de Confluent y Orchestrate completados o en curso.'],
      ['Herramientas', 'Node.js 18+ para el storefront React.']
    ],
    materials: ['Starter de Voltia y credenciales de los labs anteriores.'],
    path: 'Planifica → construye pantallas → embebe el asistente → pulir y documentar.',
    learning: [
      ['Integración', 'Conectar Confluent y Orchestrate en una UI local.'],
      ['Validación', 'Probar el flujo retail de extremo a extremo.']
    ]
  },
  'java-modernization-v2': {
    duration: '~90 min',
    outcome: 'Modernizarás una aplicación Java hacia Java 21 y Liberty, validando UI, tests y seguridad.',
    requirements: [
      ['Entorno', 'IBM Bob IDE con Agent Mode y el repositorio Simple Pharmacy.'],
      ['Java', 'Java 8 para el Lab 1; Java 21 a partir del Lab 2. Sigue la guía de setup del overview (SDKMAN! o winget). Verifica java -version y mvn --version.'],
      ['Herramientas', 'Maven 3.8+; Node.js solo para el Lab 3 de React.'],
      ['Carpetas', 'Abre solo la carpeta snap* del lab en curso (File → Open Folder). No abras el bundle completo.']
    ],
    materials: ['Repositorio Simple Pharmacy con snaps de inicio.', 'Prompts de modernización y capturas de referencia.', 'Resultados de Maven, tests y reportes de seguridad.'],
    path: 'Sigue Replatforming, Java 21, UI, tests y seguridad. El lab TDD es una alternativa al flujo de tests unitarios.',
    learning: [
      ['Modernización', 'Planificar y ejecutar replatforming y actualización de Java.'],
      ['Calidad', 'Usar TDD o tests unitarios para validar cambios.'],
      ['Seguridad', 'Detectar, corregir y documentar riesgos antes de la entrega.']
    ]
  },
  'ibm-i-rpg-development': {
    duration: '90 min',
    outcome: 'Entenderás SAMCO con Bob, modernizarás RPG localmente y construirás una UI web con React y Carbon.',
    requirements: [
      ['Acceso', 'IBM Bob IDE con Ask, Plan y Agent/Code Mode.'],
      ['Material', 'Bundle SAMCO descomprimido y abierto como carpeta raíz en Bob.'],
      ['Lab 2', 'Node.js 18+ solo para el lab de React + Carbon.']
    ],
    materials: ['Zip samco-workshop con carpeta SAMCO/.', 'Prompts de cada lab listos para copiar.'],
    path: 'Sigue Lab 0 → 1 → 2 → 3. Cada lab es independiente; puedes empezar por Lab 2 si prefieres la UI primero.',
    learning: [
      ['Descubrimiento', 'Extraer reglas de negocio y flujos de una app RPG legacy.'],
      ['Modernización RPG', 'Convertir subrutinas Fixed-to-Free con Dcl-Proc.'],
      ['UI', 'Crear una tabla web moderna con Carbon Design System.'],
      ['Datos', 'Migrar operaciones RLA a SQL con JOINs.']
    ]
  }
};

export function findLab(slug) {
  for (const section of siteData.sections) {
    for (const lab of section.labs) {
      if (lab.slug === slug) {
        return { section, lab };
      }
    }
  }

  return null;
}

export function getAllLabs() {
  return siteData.sections.flatMap((section) => section.labs.map((lab) => ({ section, lab })));
}

export function getNextLab(slug) {
  const all = getAllLabs();
  const index = all.findIndex((item) => item.lab.slug === slug);
  return index >= 0 && index < all.length - 1 ? all[index + 1] : null;
}

export function getWorkshopStats(lab) {
  const costs = (lab.steps || []).filter((step) => step.bobcoinCost && !step.alternative);
  const min = costs.reduce((sum, step) => sum + step.bobcoinCost.min, 0);
  const max = costs.reduce((sum, step) => sum + step.bobcoinCost.max, 0);
  const duration = workshopGuides[lab.slug]?.duration || '';
  return {
    duration,
    bobcoins: costs.length ? { min, max } : null
  };
}
