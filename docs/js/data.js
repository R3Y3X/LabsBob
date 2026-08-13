export const siteData = {
  topNav: [
    { label: 'Inicio', href: '#/' },
    { label: 'Laboratorios', href: '#available-workshops' },
    { label: 'Equipo', href: '#nosotros' },
    { label: 'Acerca de', href: '#acerca-de' }
  ],
  hero: {
    eyebrow: 'IBM Bob · habilitación práctica',
    title: 'Bienvenido a IBM Bob:<br>Tu Socio de Desarrollo Potenciado por IA',
    description: '¡Hola, soy Bob! Estoy aquí para trabajar junto a ti en tu código y ayudarte a construir software de calidad más rápido.',
    ctaLabel: 'Explorar laboratorios'
  },
  highlights: [
    { value: '', label: 'modos de trabajo' },
    { value: '', label: 'laboratorios prácticos' },
    { value: '', label: 'ciclo completo de desarrollo' }
  ],
  sections: [
    {
      id: 'basic',
      title: 'Primeros Pasos',
      eyebrow: 'Desarrollo asistido',
      label: 'Fundamentos de Bob',
      bobMode: 'Modos agénticos',
      description: 'Construye una base sólida para trabajar con Bob: configura el entorno, entiende sus modos y recorre el ciclo de vida del software con una guía clara y práctica.',
      actionLabel: 'Explorar Primeros Pasos',
      labs: [
        {
          slug: 'hands-on-inicial',
          title: 'Primeros pasos con Bob: Construye una base sólida para trabajar con IBM Bob',
          description: 'Configura tu workspace, conoce Ask Mode, Plan Mode y Agent Mode, y completa tu primera tarea agéntica con controles claros.',
          supporting: 'Workshop base',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/basic/hands-on-inicial/overview.html', tags: ['Modos agénticos'] },
            { slug: 'lab1', label: 'Ask Mode', file: './content/basic/hands-on-inicial/lab1-ask-mode.html', tags: ['Ask Mode'], bobcoinCost: { min: 2, max: 4 } },
            { slug: 'lab2', label: 'Plan y Agent Mode', file: './content/basic/hands-on-inicial/lab2-modos.html', tags: ['Plan · Agent'], bobcoinCost: { min: 4, max: 8 } },
            { slug: 'lab3', label: 'Seguridad', file: './content/basic/hands-on-inicial/lab3-seguridad.html', tags: ['Seguridad · ASVS'], bobcoinCost: { min: 5, max: 10 } },
            { slug: 'lab4', label: 'Modo personalizado', file: './content/basic/hands-on-inicial/lab4-modo-personalizado.html', tags: ['Modo personalizado'], bobcoinCost: { min: 2, max: 5 } },
            { slug: 'lab5', label: 'MCP con Tavily', file: './content/basic/hands-on-inicial/lab5-mcp-tavily.html', tags: ['MCP · Tavily'], bobcoinCost: { min: 3, max: 6 } }
          ]
        },
        {
          slug: 'software-development-lifecycle',
          title: 'Ciclo de vida del software: de plan a producción',
          description: 'Construye Bob\'s Beans, una tostaduría de café: planifica, implementa tres pantallas a partir de mockups, anima, revisa y documenta el resultado con Bob.',
          supporting: 'React · Vite · Tailwind',
          customOverview: true,
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/basic/software-development-lifecycle/overview.html', tags: ['SDLC completo'] },
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
      label: 'Integración externa',
      bobMode: 'Eventos y agentes',
      description: 'Construye un caso retail de extremo a extremo: streaming de inventario en Confluent Kafka, agentes de IA en watsonx Orchestrate y una tienda que consume datos en tiempo real.',
      actionLabel: 'Explorar integración de plataforma',
      labs: [
        {
          slug: 'agentic-retail-confluent',
          title: 'Inventario en tiempo real con streaming de eventos',
          description: 'Construye la capa de datos operacionales en tiempo real de Voltia: tópicos de Kafka, procesamiento de streams con ksqlDB y cálculo de disponibilidad.',
          supporting: 'Confluent',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/integraciones/agentic-retail-confluent/overview.html', tags: ['Confluent Kafka'] },
            { slug: 'topics', label: 'Tópicos Kafka', file: './content/integraciones/agentic-retail-confluent/topics.html', tags: ['ksqlDB'], bobcoinCost: { min: 4, max: 8 } },
            { slug: 'publish', label: 'Publicar eventos', file: './content/integraciones/agentic-retail-confluent/publish.html', tags: ['Productores'], bobcoinCost: { min: 2, max: 5 } }
          ]
        },
        {
          slug: 'agentic-retail-wxo',
          title: 'Agentes Inteligentes para la Gestión de Inventario',
          description: 'Despliega agentes especializados en watsonx Orchestrate que utilizan herramientas MCP para interactuar con la base de datos de inventario en tiempo real.',
          supporting: 'watsonx Orchestrate',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/integraciones/agentic-retail-wxo/overview.html', tags: ['watsonx Orchestrate'] },
            { slug: 'create', label: 'Crear agentes', file: './content/integraciones/agentic-retail-wxo/create.html', tags: ['Multiagente'], bobcoinCost: { min: 5, max: 10 } },
            { slug: 'integration', label: 'Integración MCP', file: './content/integraciones/agentic-retail-wxo/integration.html', tags: ['Herramientas MCP'], bobcoinCost: { min: 4, max: 8 } }
          ]
        },
        {
          slug: 'agentic-retail-voltia',
          title: 'Retail Inteligente en Acción',
          description: 'Crea una interfaz en local para interactuar con los agentes de Orchestrate junto con Confluent de manera más visual integrando todo el sistema.',
          supporting: 'Voltia',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/integraciones/agentic-retail-voltia/overview.html', tags: ['Storefront React'] },
            { slug: 'deploy', label: 'Desplegar tienda', file: './content/integraciones/agentic-retail-voltia/deploy.html', tags: ['Asistente embebido'], bobcoinCost: { min: 3, max: 7 } }
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
      description: 'Moderniza aplicaciones y sistemas empresariales con análisis profundo, cambios trazables y validación continua usando Ask, Plan y Agent Mode.',
      actionLabel: 'Explorar Modernización de aplicaciones empresariales',
      labs: [
        {
          slug: 'java-modernization-v2',
          title: 'Modernización de aplicaciones Java',
          description: 'Moderniza una aplicación Java legacy con Bob: replatforming a Liberty, upgrade a Java 21, UI con React, tests unitarios y remediación de CVEs.',
          supporting: 'Java legacy',
          overviewLabsOnly: true,
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/premium/java-modernization-v2/overview.html' },
            { slug: 'lab1', label: 'Replatforming Liberty', file: './content/premium/java-modernization-v2/lab1-replatforming.html', description: 'Migra de Traditional WebSphere a Open Liberty manteniendo el comportamiento de la app.', tags: ['Open Liberty'], bobcoinCost: { min: 4, max: 6 } },
            { slug: 'lab2', label: 'Upgrade Java 21', file: './content/premium/java-modernization-v2/lab2-java-upgrade.html', description: 'Java 8 → 21, Jakarta EE 10, escaneo CVE y refactor Struts 2→7.', tags: ['Java 21'], bobcoinCost: { min: 5, max: 8 } },
            { slug: 'lab3', label: 'UI con React', file: './content/premium/java-modernization-v2/lab3-ui-modernization.html', description: 'Struts/JSP → React + Material UI sobre backend JAX-RS; backend, frontend y contenedores.', tags: ['React · JAX-RS'], bobcoinCost: { min: 10, max: 20 } },
            { slug: 'lab4', label: 'Tests unitarios', file: './content/premium/java-modernization-v2/lab4-unit-tests.html', description: 'UNITTEST.md, JaCoCo, JUnit 5 + Mockito + AssertJ en lotes por capa.', tags: ['JUnit 5'], bobcoinCost: { min: 8, max: 15 } },
            { slug: 'lab-alt4', label: 'Lab 4 alternativo', file: './content/premium/java-modernization-v2/lab-alt4-tdd.html', description: 'Ruta TDD OpenAPI-first: tests primero, implementación después (Red-Green-Refactor).', tags: ['TDD'], bobcoinCost: { min: 8, max: 15 } },
            { slug: 'lab5', label: 'Seguridad', file: './content/premium/java-modernization-v2/lab5-security.html', description: 'Detecta y remedia CVEs críticos en dependencias antes de la entrega.', tags: ['CVEs'], bobcoinCost: { min: 6, max: 12 } }
          ]
        },
        {
          slug: 'ibm-i-rpg-development',
          title: 'Modernización de aplicaciones RPG en IBM i',
          description: 'Descubre SAMCO, moderniza RPG de formato fijo a libre, construye una UI React + Carbon y convierte RLA a SQL con archivos locales.',
          supporting: 'IBM i · SAMCO',
          overviewLabsOnly: true,
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/premium/ibm-i-rpg-development/overview.html', tags: ['RPG legacy'] },
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



// Content guidance used by the shared workshop shell. Route and step data stay
// above; this layer gives every overview the same briefing, preparation, and
// learning-outcome structure without duplicating technical instructions.
export const workshopGuides = {
  'hands-on-inicial': {
    duration: '90 min',
    outcome: 'Configurarás un workspace, usarás Ask, Plan y Agent Mode con controles de aprobación claros, y ejecutarás una auditoría de seguridad con skills y reportes SARIF/OSCAL.',
    requirements: [
      ['Acceso', 'IBM Bob IDE v2.x o posterior con una cuenta habilitada.'],
      ['Entorno', 'Un workspace local donde puedas crear y revisar archivos.'],
      ['Herramientas', 'Node.js 18+ para los Labs 1, 2 y 5.'],
      ['Conocimiento', 'Manejo básico de editor, terminal y control de cambios.']
    ],
    materials: ['Bundle LabHandsOnBob.zip con los 5 labs (incluye Galaxium Travels para el Lab 3).', 'Los prompts y capturas incluidos en cada etapa.', 'El resumen de Bob para revisar cada cambio antes de aprobarlo.'],
    path: 'Completa los cinco labs en orden: primero consulta, luego planifica, audita con skills, personaliza e integra una herramienta MCP.',
    learning: [
      ['Modos de Bob', 'Elegir Ask, Plan o Agent según el tipo de tarea.'],
      ['Gobernanza', 'Revisar cambios, comandos y aprobaciones antes de ejecutarlos.'],
      ['Auditoría de seguridad', 'Crear skills reutilizables y generar reportes SARIF y OSCAL POA&M.'],
      ['Extensibilidad', 'Usar configuraciones y MCP para especializar el flujo de trabajo.']
    ]
  },
  'software-development-lifecycle': {
    duration: '2–3 h',
    outcome: 'Construirás Bob\'s Beans: tres pantallas a partir de mockups, conectadas a una API hospedada, con animaciones, revisión visual y un sitio MkDocs.',
    requirements: [
      ['Acceso', 'IBM Bob IDE con Ask, Plan y Agent Mode disponibles.'],
      ['Herramientas', 'Node.js 18+, npm y Python 3 (para MkDocs en el Lab 07).'],
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
    path: 'Completa la configuración del asistente en watsonx Orchestrate y ejecuta las pruebas de extremo a extremo.',
    learning: [
      ['Orquestación', 'Definir flujos multiagente autónomos.'],
      ['MCP Integración', 'Vincular herramientas externas a watsonx Orchestrate.'],
      ['Gobernanza', 'Validar respuestas y trazabilidad de agentes.']
    ]
  },
  'agentic-retail-confluent': {
    duration: '60–90 min',
    outcome: 'Construirás un pipeline de inventario en tiempo real sobre Confluent Cloud integrado con Bob.',
    requirements: [
      ['Acceso', 'IBM Bob IDE y cuenta activa en Confluent Cloud.'],
      ['CLI', 'Confluent CLI y Python 3.10+ instalados.'],
      ['Kafka', 'Conceptos de topics, productores y consumidores.']
    ],
    materials: ['Credenciales de Confluent Cloud y cluster Kafka.', 'Scripts productores/consumidores de eventos.', 'Diagramas de arquitectura de eventos.'],
    path: 'Revisa la arquitectura de eventos y construye el pipeline de streaming de inventario.',
    learning: [
      ['Event Streaming', 'Publicar y consumir eventos de inventario en Confluent Kafka.'],
      ['Automatización', 'Asistir la configuración de conectores con Bob.'],
      ['Monitoreo', 'Validar flujo de datos y esquema de mensajes en tiempo real.']
    ]
  },
  'java-modernization-v2': {
    duration: '~90 min',
    outcome: 'Modernizarás una aplicación Java hacia Java 21 y Liberty, validando UI, tests y seguridad.',
    requirements: [
      ['Entorno', 'IBM Bob IDE con Agent Mode y el repositorio Simple Pharmacy.'],
      ['Java', 'Java 8 para el Lab 1; Java 21 a partir del Lab 2. Configura JAVA_HOME antes de cada lab (ver Lab 1 y Lab 2). Verifica java -version y mvn --version.'],
      ['Herramientas', 'Maven 3.8+; Node.js solo para el Lab 3 de React.'],
      ['Carpetas', 'Abre solo la carpeta snap* del lab en curso (File → Open Folder). No abras el bundle completo.'],
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
