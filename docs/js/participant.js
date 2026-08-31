/* Participant assignment and browser-generated workshop bundle. */

const STORAGE_KEY = 'labsBob.participant.v1';
const BASE_BUNDLE = './downloads/agentic-retail-workshop.zip';
const BUNDLE_ROOT = 'RoadShowBobStreamingIntegration';
const PARTICIPANT_LABS = new Set([
  'agentic-retail-confluent',
  'agentic-retail-wxo',
  'agentic-retail-voltia'
]);
const TRACK_INFO = {
  'agentic-retail-confluent': { number: 1, code: 'D', name: 'confluent', folder: 'trackD' },
  'agentic-retail-wxo': { number: 2, code: 'F', name: 'orchestrate', folder: 'trackF' },
  'agentic-retail-voltia': { number: 3, code: 'V', name: 'voltia', folder: 'voltia' }
};

function pad(value, width) {
  return String(value).padStart(width, '0');
}

export function readParticipantContext() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!value || ![1, 2, 3].includes(value.table) || !Number.isInteger(value.number) || value.number < 1 || value.number > 100) return null;
    return normalizeContext(value.table, value.number);
  } catch {
    return null;
  }
}

export function normalizeContext(table, number) {
  const tableId = pad(table, 2);
  const participantId = pad(number, 3);
  return {
    table: Number(table),
    number: Number(number),
    tableId,
    participantId,
    label: `M${tableId}-P${participantId}`,
    workspaceId: `m${tableId}_p${participantId}`,
    topicTransactions: `inventory.transactions.m${tableId}_p${participantId}`,
    topicAvailability: `inventory.availability.m${tableId}_p${participantId}`,
    topicFlink: `inventory.availability.flink.m${tableId}_p${participantId}`,
    stream: `INVENTORY_TRANSACTIONS_M${tableId}_P${participantId}`,
    tableName: `INVENTORY_AVAILABILITY_M${tableId}_P${participantId}`,
    agentSuffix: `M${tableId}_P${participantId}`,
    knowledgeBase: `enterprise_documents_m${tableId}_p${participantId}`
  };
}

function persist(context) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ table: context.table, number: context.number }));
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) { return new Uint8Array([value & 255, (value >>> 8) & 255]); }
function u32(value) { return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]); }
function concat(...chunks) {
  const result = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function localHeader(name, data, offset) {
  const nameBytes = new TextEncoder().encode(name);
  const crc = crc32(data);
  return {
    local: concat(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes),
    central: concat(new Uint8Array([0x50, 0x4b, 0x01, 0x02]), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes)
  };
}

function findEndOfCentralDirectory(bytes) {
  const start = Math.max(0, bytes.length - 0xffff - 22);
  for (let index = bytes.length - 22; index >= start; index -= 1) {
    if (bytes[index] === 0x50 && bytes[index + 1] === 0x4b && bytes[index + 2] === 0x05 && bytes[index + 3] === 0x06) return index;
  }
  throw new Error('El bundle base no tiene una tabla ZIP válida.');
}

async function appendEntries(baseBytes, entries) {
  const eocd = findEndOfCentralDirectory(baseBytes);
  const view = new DataView(baseBytes.buffer, baseBytes.byteOffset, baseBytes.byteLength);
  const centralOffset = view.getUint32(eocd + 16, true);
  const oldCentral = baseBytes.slice(centralOffset, eocd);
  const prefix = baseBytes.slice(0, centralOffset);
  const locals = [];
  const centrals = [];
  // The old central directory is removed from the output. New local headers
  // therefore start immediately after `prefix`, not at the end of the input
  // archive (which still included the old central directory).
  let offset = prefix.length;
  for (const entry of entries) {
    const data = new TextEncoder().encode(entry.content);
    const headers = localHeader(entry.name, data, offset);
    locals.push(headers.local, data);
    centrals.push(headers.central);
    offset += headers.local.length + data.length;
  }
  const newCentralOffset = offset;
  const central = concat(oldCentral, ...centrals);
  const end = concat(new Uint8Array([0x50, 0x4b, 0x05, 0x06]), u16(0), u16(0), u16(Math.min(0xffff, view.getUint16(eocd + 10, true) + entries.length)), u16(Math.min(0xffff, view.getUint16(eocd + 10, true) + entries.length)), u32(central.length), u32(newCentralOffset), u16(0));
  return concat(prefix, ...locals, central, end);
}

function configText(context) {
  return `# Generado por IBM Workshop Hub para ${context.label}.\n# Completa solo los valores marcados; nunca compartas este archivo.\nWORKSHOP_TABLE=${context.table}\nPARTICIPANT_NUMBER=${context.number}\nWORKSHOP_ID=${context.workspaceId}\nTOPIC_NAME=${context.topicTransactions}\nTOPIC_PARTITIONS=1\nTOPIC_REPLICATION_FACTOR=3\nTOPIC_RETENTION_MS=-1\nDERIVED_TOPIC_NAME=${context.topicAvailability}\nFLINK_TOPIC_NAME=${context.topicFlink}\nKSQL_STREAM_NAME=${context.stream}\nKSQL_TABLE_NAME=${context.tableName}\nSSH_HOST=root@<IP_PUBLICA_VM_MESA_${context.tableId}>\nSSH_KEY=cflt-vsi-key.pem\n# Los jobs se ejecutan dentro de Kubernetes; usa el endpoint interno para evitar hairpin por la IP pública.\nBOOTSTRAP_SERVERS=kafka.confluent.svc.cluster.local:9092\nBOOTSTRAP_SERVERS_EXTERNAL=<IP_PUBLICA_VM_MESA_${context.tableId}>:9094,<IP_PUBLICA_VM_MESA_${context.tableId}>:9095,<IP_PUBLICA_VM_MESA_${context.tableId}>:9096\nKSQLDB_ENDPOINT=http://ksqldb.confluent.svc.cluster.local:8088\nKSQLDB_ENDPOINT_EXTERNAL=https://<IP_PUBLICA_VM_MESA_${context.tableId}>/ksqldb\nKSQLDB_USERNAME=admin\nKSQLDB_PASSWORD=\nKSQLDB_API_KEY=\nKSQLDB_API_SECRET=\nKAFKA_SASL_USERNAME=kafka-admin\nKAFKA_SASL_PASSWORD=\nSCHEMA_REGISTRY_URL=https://<IP_PUBLICA_VM_MESA_${context.tableId}>/sr\nSCHEMA_REGISTRY_USERNAME=admin\nSCHEMA_REGISTRY_PASSWORD=\nORCHESTRATE_URL=<URL_ORCHESTRATE_MESA_${context.tableId}>\nORCHESTRATE_API_KEY=\nRETAIL_MCP_URL=https://<IP_PUBLICA_VM_MESA_${context.tableId}>/retail-mcp/mcp\nRETAIL_MCP_TOOLKIT_NAME=retail_availability_mcp\nKNOWLEDGE_BASE_NAME=${context.knowledgeBase}\n`;
}

function bootstrapText() {
  return `#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$ROOT/participant-config.env"
source "$CONFIG"
: "\${WORKSHOP_ID:?Falta WORKSHOP_ID}"
echo "Workspace: $WORKSHOP_ID"
echo "Completa SSH_HOST, SSH_KEY, BOOTSTRAP_SERVERS, KSQLDB_PASSWORD y KAFKA_SASL_PASSWORD en participant-config.env antes de continuar."
if [[ "\${1:-}" == "check" ]]; then exit 0; fi
[[ "$SSH_HOST" != *"<"* ]] || { echo "Falta SSH_HOST" >&2; exit 2; }
[[ -f "$ROOT/$SSH_KEY" ]] || { echo "No existe $ROOT/$SSH_KEY" >&2; exit 2; }
chmod 600 "$ROOT/$SSH_KEY"
cp "$ROOT/participant-config.env" "$ROOT/.env"
mkdir -p "$ROOT/trackD/inventory-pipeline"
cp "$ROOT/participant-config.env" "$ROOT/trackD/inventory-pipeline/.env"
chmod +x "$ROOT/trackD/inventory-pipeline/setup.sh" "$ROOT/trackD/inventory-pipeline/cleanup.sh" "$ROOT/trackD/inventory-pipeline/run_in_cluster.sh"
if [[ -d "$ROOT/trackF/confluent_agents" ]]; then
  cp "$ROOT/participant-config.env" "$ROOT/trackF/confluent_agents/workshop-config.env"
  chmod +x "$ROOT/trackF/confluent_agents/register_shared_toolkit.sh"
  python3 "$ROOT/trackF/confluent_agents/personalize_agents.py" --config "$ROOT/participant-config.env"
fi
echo "Configuración lista para $WORKSHOP_ID. Ejecuta: (cd trackD/inventory-pipeline && ./setup.sh)"
`;
}

function participantInfo(context, track) {
  return JSON.stringify({ version: 1, track: { number: track.number, code: track.code, name: track.name, folder: track.folder }, label: context.label, workspace_id: context.workspaceId, topics: { transactions: context.topicTransactions, availability: context.topicAvailability, flink: context.topicFlink }, ksql: { stream: context.stream, table: context.tableName }, agents: { availability: `SKU_Availability_Agent_${context.agentSuffix}`, substitutes: `Substitute_Finder_Agent_${context.agentSuffix}`, supervisor: `Store_Associate_Agent_${context.agentSuffix}`, shopping: `Customer_Shopping_Assistant_${context.agentSuffix}` }, knowledge_base: context.knowledgeBase }, null, 2);
}

function currentParticipantLabSlug() {
  const match = String(window.location.hash || '').match(/^#\/lab\/([^/]+)/);
  return match && PARTICIPANT_LABS.has(match[1]) ? match[1] : 'agentic-retail-confluent';
}

function trackInfo(labSlug) {
  return TRACK_INFO[labSlug] || TRACK_INFO['agentic-retail-confluent'];
}

export async function downloadParticipantBundle(context, labSlug = currentParticipantLabSlug()) {
  const track = trackInfo(labSlug);
  const response = await fetch(new URL(BASE_BUNDLE, document.baseURI));
  if (!response.ok) throw new Error(`No se pudo descargar el bundle base (${response.status}).`);
  const base = new Uint8Array(await response.arrayBuffer());
  const archive = await appendEntries(base, [
    { name: `${BUNDLE_ROOT}/participant-config.env`, content: configText(context) },
    { name: `${BUNDLE_ROOT}/participant-info.json`, content: participantInfo(context, track) },
    { name: `${BUNDLE_ROOT}/participant-bootstrap.sh`, content: bootstrapText() },
    { name: `${BUNDLE_ROOT}/README-PARTICIPANT.md`, content: `# Track ${track.number} (${track.code}) — ${track.name}\n\nWorkspace: **${context.label}**\n\nEste bundle fue generado para el **Track ${track.number} (${track.code}: ${track.name})**. Sus carpetas son \`trackD\` (Confluent), \`trackF\` (Orchestrate) y \`voltia\`. Usa siempre el mismo identificador mesa+número en todos los tracks. Completa participant-config.env y ejecuta participant-bootstrap.sh.\n` }
  ]);
  const blob = new Blob([archive], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `track-${track.number}-${track.name}-${context.workspaceId}.zip`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function injectStyles() {
  if (document.getElementById('participant-assignment-styles')) return;
  const style = document.createElement('style');
  style.id = 'participant-assignment-styles';
  style.textContent = `.participant-assignment{position:fixed;inset:0;z-index:10000;background:rgba(22,22,22,.72);display:grid;place-items:center;padding:1rem}.participant-assignment__dialog{width:min(34rem,100%);background:var(--cds-layer-01,#fff);color:var(--cds-text-primary,#161616);padding:2rem;box-shadow:0 0 0 1px var(--cds-border-subtle,#e0e0e0),0 1rem 3rem #0006}.participant-assignment__dialog h2{margin:0 0 .75rem}.participant-assignment__dialog p{line-height:1.5}.participant-assignment__fields{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0}.participant-assignment__fields label{display:grid;gap:.4rem;font-weight:600}.participant-assignment__fields select,.participant-assignment__fields input{font:inherit;padding:.75rem;border:1px solid var(--cds-border-strong,#8d8d8d);background:var(--cds-field-01,#f4f4f4);color:inherit}.participant-assignment__actions{display:flex;justify-content:flex-end;gap:.75rem}.participant-assignment__error{color:#da1e28;min-height:1.5rem;font-size:.875rem}`;
  document.head.append(style);
}

function showAssignmentDialog(existing = null, labSlug = currentParticipantLabSlug()) {
  injectStyles();
  return new Promise((resolve) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'participant-assignment';
    wrapper.innerHTML = `<div class="participant-assignment__dialog" role="dialog" aria-modal="true" aria-labelledby="participant-title"><h2 id="participant-title">Configura tu track</h2><p>Selecciona la mesa y el número que te asignó el facilitador. El mismo identificador se usará en Confluent y Orchestrate y generará tu bundle personalizado.</p><div class="participant-assignment__fields"><label>Mesa<select data-table><option value="1">Mesa 1</option><option value="2">Mesa 2</option><option value="3">Mesa 3</option></select></label><label>Número (1–100)<input data-number type="number" min="1" max="100" step="1" inputmode="numeric" /></label></div><div class="participant-assignment__error" role="alert"></div><div class="participant-assignment__actions"><button type="button" class="cds--btn cds--btn--secondary" data-cancel>Cancelar</button><button type="button" class="cds--btn cds--btn--primary" data-confirm>Confirmar y descargar bundle</button></div></div>`;
    document.body.append(wrapper);
    const table = wrapper.querySelector('[data-table]');
    const number = wrapper.querySelector('[data-number]');
    const error = wrapper.querySelector('.participant-assignment__error');
    const confirmButton = wrapper.querySelector('[data-confirm]');
    if (existing) { table.value = existing.table; number.value = existing.number; }
    wrapper.querySelector('[data-cancel]').addEventListener('click', () => { wrapper.remove(); resolve(null); });
    wrapper.querySelector('[data-confirm]').addEventListener('click', async () => {
      const tableValue = Number(table.value);
      const numberValue = Number(number.value);
      if (![1, 2, 3].includes(tableValue) || !Number.isInteger(numberValue) || numberValue < 1 || numberValue > 100) { error.textContent = 'Elige una mesa válida y un número entero entre 1 y 100.'; return; }
      const context = normalizeContext(tableValue, numberValue);
      error.textContent = 'Generando bundle…';
      confirmButton.disabled = true;
      try { await downloadParticipantBundle(context, labSlug); persist(context); wrapper.remove(); resolve(context); }
      catch (downloadError) { confirmButton.disabled = false; error.textContent = downloadError.message; }
    });
    number.focus();
  });
}

export async function ensureParticipantAssignment(labSlug) {
  if (!PARTICIPANT_LABS.has(labSlug)) return null;
  const existing = readParticipantContext();
  if (existing) return existing;
  return showAssignmentDialog(null, labSlug);
}

export function isParticipantLab(labSlug) {
  return PARTICIPANT_LABS.has(labSlug);
}

export function personalizeContent(content, context) {
  if (!context || !content) return content;
  const replacements = [
    ['inventory.availability.flink', context.topicFlink],
    ['inventory.transactions-value', `${context.topicTransactions}-value`],
    ['inventory.availability-value', `${context.topicAvailability}-value`],
    ['inventory.transactions', context.topicTransactions],
    ['inventory.availability', context.topicAvailability],
    ['INVENTORY_TRANSACTIONS', context.stream],
    ['INVENTORY_AVAILABILITY', context.tableName],
    ['SKU_Availability_Agent', `SKU_Availability_Agent_${context.agentSuffix}`],
    ['Substitute_Finder_Agent', `Substitute_Finder_Agent_${context.agentSuffix}`],
    ['Store_Associate_Agent', `Store_Associate_Agent_${context.agentSuffix}`],
    ['Customer_Shopping_Assistant', `Customer_Shopping_Assistant_${context.agentSuffix}`],
    ['enterprise_documents', context.knowledgeBase],
    ['RETAIL_MCP_SSE_URL', 'RETAIL_MCP_URL'],
    ['Endpoint SSE', 'Endpoint HTTPS (Streamable HTTP)'],
    ['vía SSE', 'vía HTTPS (Streamable HTTP)'],
    ['--transport sse', '--transport streamable_http'],
    ['workshop-config.env.example', 'participant-config.env'],
    ['workshop-config.env', 'participant-config.env']
  ];
  return replacements.reduce((value, [from, to]) => value.split(from).join(to), content);
}

export function participantBanner(context) {
  if (!context) return '';
  return `<div class="callout" data-tone="info" data-participant-banner="true"><p class="callout__title">Workspace activo: ${context.label}</p><p>Todos los tópicos, agentes y consultas de este recorrido usan <code>${context.workspaceId}</code>. <button type="button" class="cds--link" data-change-participant>Cambiar asignación</button></p></div>`;
}

document.addEventListener('click', async (event) => {
  const change = event.target.closest('[data-change-participant]');
  const downloadLink = event.target.closest('a[data-participant-download]');
  if (!change && !downloadLink) return;
  event.preventDefault();
  const current = readParticipantContext();
  if (downloadLink && current) {
    try { await downloadParticipantBundle(current, currentParticipantLabSlug()); } catch (error) { console.error(error); }
    return;
  }
  const selected = await showAssignmentDialog(current, currentParticipantLabSlug());
  if (selected) window.dispatchEvent(new Event('hashchange'));
});
