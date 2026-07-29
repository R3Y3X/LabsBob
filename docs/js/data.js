export const siteData = {
  topNav: [
    { label: 'Inicio', href: '#/' },
    { label: 'Capacidades', href: '#available-workshops' },
    { label: 'Laboratorios', href: '#available-workshops' },
    { label: 'Acerca de', href: '#available-workshops' }
  ],
  hero: {
    eyebrow: 'IBM BOB · HABILITACIÓN PRÁCTICA',
    title: 'Acelera con Bob',
    description: 'IBM Bob es tu copiloto de IA — planea, codifica, prueba y despliega para que tu equipo pase de la idea a producción más rápido. Estos workshops prácticos muestran a Bob en acción en escenarios reales de empresa.',
    ctaLabel: 'Explorar workshops'
  },
  highlights: [
    { value: '3', label: 'modos de Bob' },
    { value: '4', label: 'laboratorios guiados' },
    { value: 'Listo para usar', label: 'rutas de workshop' }
  ],
  sections: [
    {
      id: 'basic',
      title: 'Habilitación Core',
      eyebrow: 'Desarrollo',
      label: 'Fundamentos de IBM Bob',
      level: 'Básico',
      bobMode: 'Bob CLI',
      description: 'Bob actúa como tu partner de desarrollo desde el primer día — instala, configura y ejecuta tus primeros flujos de trabajo agénticos a través del ciclo de vida completo del software.',
      actionLabel: 'Explorar Habilitación Core',
      labs: [
        {
          slug: 'hands-on-inicial',
          title: 'Hands-on Inicial',
          description: 'Bob te guía por la configuración del IDE, la selección de modos y tu primera tarea agéntica — desde la creación del workspace hasta el resultado ejecutado.',
          supporting: 'Lab 1',
          level: 'Básico',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview',  label: 'Inicio',    file: './content/basic/hands-on-inicial/overview.html' },
            { slug: 'lab1',      label: 'Lab 1 · Ask Mode',      file: './content/basic/hands-on-inicial/lab1-ask-mode.html' },
            { slug: 'lab2',      label: 'Lab 2 · Modos',         file: './content/basic/hands-on-inicial/lab2-modos.html' },
            { slug: 'lab3',      label: 'Lab 3 · Seguridad',     file: './content/basic/hands-on-inicial/lab3-seguridad.html' },
            { slug: 'lab4',      label: 'Lab 4 · Modo Custom',   file: './content/basic/hands-on-inicial/lab4-modo-personalizado.html' },
            { slug: 'lab5',      label: 'Lab 5 · MCP Tavily',    file: './content/basic/hands-on-inicial/lab5-mcp-tavily.html' }
          ]
        },
        {
          slug: 'software-development-lifecycle',
          title: 'Ciclo de Vida del Software',
          description: 'Bob dirige el ciclo SDLC completo — planea, implementa, prueba, corrige automáticamente y documenta un proyecto funcional con mínimo esfuerzo manual.',
          supporting: 'Lab 2',
          level: 'Básico',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/basic/software-development-lifecycle/overview.html' },
            { slug: 'walkthrough', label: 'Recorrido', file: './content/basic/software-development-lifecycle/walkthrough.html' }
          ]
        }
      ]
    },
    {
      id: 'integraciones',
      title: 'Expansión del Ecosistema',
      eyebrow: 'Automatización',
      label: 'Bob + Orchestrate',
      level: 'Integración',
      bobMode: 'Bob ADK MCP',
      description: 'Bob conecta tus flujos de eventos en tiempo real con agentes de IA. Usando el ADK MCP de watsonx Orchestrate, Bob configura topics de Kafka, construye herramientas MCP y despliega sistemas multi-agente sin codificación manual.',
      actionLabel: 'Explorar Expansión del Ecosistema',
      labs: [
        {
          slug: 'agentic-retail',
          title: 'Retail Agéntico',
          description: 'Bob configura un pipeline Kafka en Confluent Cloud, construye una herramienta MCP y despliega un sistema multi-agente en watsonx Orchestrate que responde preguntas de inventario en tiempo real con sustitutos potenciados por RAG.',
          supporting: 'Lab 1',
          level: 'Intermedio',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/integraciones/agentic-retail/overview.html' },
            { slug: 'architecture', label: 'Arquitectura', file: './content/integraciones/agentic-retail/architecture.html' },
            { slug: 'assistant', label: 'Asistente', file: './content/integraciones/agentic-retail/assistant.html' }
          ]
        }
      ]
    },
    {
      id: 'premium',
      title: 'Modernización Empresarial',
      eyebrow: 'IA Generativa',
      label: 'Bob Premium',
      level: 'Premium',
      bobMode: 'Bob Premium',
      description: 'Bob Premium impulsa la modernización empresarial a gran escala — actualiza aplicaciones Java legacy, reemplataforma a Liberty y convierte programas RPG de IBM i a RPGLE moderno de formato libre con conectividad nativa al sistema.',
      actionLabel: 'Explorar Modernización Empresarial',
      labs: [
        {
          slug: 'java-modernization-v2',
          title: 'Modernización Java v2',
          description: 'Bob Premium analiza tu código Java, actualiza de Java 8/11 a Java 21 LTS, reemplataforma a Liberty, ejecuta el ciclo build-test-fix y genera documentación — convirtiendo un proyecto de 2 meses en 2 días.',
          supporting: 'Lab 1',
          level: 'Avanzado',
          audience: ['client', 'partner'],
          steps: [
            { slug: 'overview',    label: 'Inicio',             file: './content/premium/java-modernization-v2/overview.html' },
            { slug: 'lab1',        label: 'Lab 1 · Replatforming',  file: './content/premium/java-modernization-v2/lab1-replatforming.html' },
            { slug: 'lab2',        label: 'Lab 2 · Java 21 Upgrade', file: './content/premium/java-modernization-v2/lab2-java-upgrade.html' },
            { slug: 'lab3',        label: 'Lab 3 · UI Modernization', file: './content/premium/java-modernization-v2/lab3-ui-modernization.html' },
            { slug: 'lab4',        label: 'Lab 4 · Unit Tests',   file: './content/premium/java-modernization-v2/lab4-unit-tests.html' },
            { slug: 'lab-alt4',    label: 'Alt-Lab 4 · TDD',      file: './content/premium/java-modernization-v2/lab-alt4-tdd.html' },
            { slug: 'lab5',        label: 'Lab 5 · Security',     file: './content/premium/java-modernization-v2/lab5-security.html' }
          ]
        },
        {
          slug: 'ibm-i-rpg-development',
          title: 'Desarrollo RPG en IBM i',
          description: 'Bob Premium se conecta nativamente a IBM i, explica el RPG de Formato Fijo legado en español claro, lo convierte a RPGLE de Formato Libre con anotaciones completas, compila y valida — todo desde el IDE de Bob.',
          supporting: 'Lab 2',
          level: 'Avanzado',
          audience: ['partner'],
          steps: [
            { slug: 'overview', label: 'Inicio', file: './content/premium/ibm-i-rpg-development/overview.html' },
            { slug: 'delivery', label: 'Entrega', file: './content/premium/ibm-i-rpg-development/delivery.html' }
          ]
        }
      ]
    }
  ]
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
