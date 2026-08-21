#!/usr/bin/env python3
"""Import, localize and normalize the premium workshop content.

The upstream Workshop Hub is the source of truth for premium workflow prose
and screenshots.  This tool fetches that public source, stores its images
locally, translates visible prose to Spanish, and emits SPA fragments using
the same semantic components as the standard labs.

Run from any directory:
  python3 scripts/rebuild_premium_workflows.py rebuild
  python3 scripts/rebuild_premium_workflows.py verify
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import struct
import sys
import time
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.parse import urlencode, urljoin, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
CONTENT_ROOT = DOCS / "content" / "premium-workflows"
ASSET_ROOT = DOCS / "assets" / "images" / "labs"
MANIFEST_PATH = CONTENT_ROOT / "asset-manifest.json"
SOURCE = "https://workshop-hub.2akfv5yaq586.us-south.codeengine.appdomain.cloud/ibm-bob/"
TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
USER_AGENT = "LabsBob premium-content importer/1.0"


@dataclass(frozen=True)
class LabSpec:
    track: str
    key: str
    remote: str
    target: str
    title: str
    summary: str
    tags: tuple[str, ...]
    duration: str
    bobcoins: str
    metric: tuple[str, str]
    overview: bool = False
    banner: str | None = None


JAVA = "java-modernization-v2"
IBMI = "ibm-i-rpg-development"

LABS: tuple[LabSpec, ...] = (
    LabSpec(
        JAVA, "overview", "java-modernization-v2/", "overview.html",
        "Moderniza Java a la velocidad del negocio",
        "Moderniza Simple Pharmacy con los workflows nativos de IBM Bob: replatforming a Liberty, actualización a Java 21, modernización de UI, pruebas unitarias y remediación de vulnerabilidades.",
        ("Premium", "Workflows de Bob", "Java"), "~90", "40–48", ("6", "etapas prácticas"), True,
        "ibm-bob-java-banner.png",
    ),
    LabSpec(
        JAVA, "lab1", "java-modernization-v2/lab-01-liberty-replatforming/", "lab1-replatforming.html",
        "Lab 1 — Replatforming Liberty",
        "Usa el flujo de trabajo Java Modernization para migrar Traditional WebSphere a Open Liberty sin modificar todavía la versión de Java ni la interfaz.",
        ("Premium", "Flujo Liberty"), "~20", "4–5", ("Flujo", "Java Modernization"),
    ),
    LabSpec(
        JAVA, "lab2", "java-modernization-v2/lab-02-java-upgrade/", "lab2-java-upgrade.html",
        "Lab 2 — Upgrade Java 21",
        "Ejecuta el flujo de trabajo Java Upgrade para pasar a Java 21, Jakarta EE 10 y dependencias compatibles.",
        ("Premium", "Actualización Java"), "~20", "8–9", ("Objetivo", "Java 21"),
    ),
    LabSpec(
        JAVA, "lab3", "java-modernization-v2/lab-03-ui-modernization/", "lab3-ui-modernization.html",
        "Lab 3 — UI con React",
        "Transforma la interfaz Struts/JSP en React con Material UI mediante el flujo de trabajo UI Modernization.",
        ("Premium", "Flujo de interfaz"), "~25", "14–16", ("Objetivo", "React + JAX-RS"),
    ),
    LabSpec(
        JAVA, "lab4", "java-modernization-v2/lab-04-unit-test-generation/", "lab4-unit-tests.html",
        "Lab 4 — Tests unitarios",
        "Genera pruebas, cobertura y validaciones con el flujo de trabajo Java Unit Testing.",
        ("Premium", "Pruebas unitarias"), "~20", "10–12", ("Objetivo", "JUnit 5"),
    ),
    LabSpec(
        JAVA, "lab-alt4", "java-modernization-v2/lab-04-alt-tdd/", "lab-alt4-tdd.html",
        "Lab 4 alternativo",
        "Ruta independiente OpenAPI-first: crea primero las pruebas y luego la implementación con el ciclo Red-Green-Refactor.",
        ("Premium", "TDD", "Alternativo"), "~25", "5–7", ("Método", "Red-Green-Refactor"),
    ),
    LabSpec(
        JAVA, "lab5", "java-modernization-v2/lab-05-vulnerabilities-detection/", "lab5-security.html",
        "Lab 5 — Seguridad",
        "Usa el flujo de trabajo Vulnerabilities Detection para identificar y corregir dependencias vulnerables antes de la entrega.",
        ("Premium", "Vulnerabilidades"), "~20", "4–6", ("Objetivo", "CVEs críticos"),
    ),
    LabSpec(
        IBMI, "overview", "ibm-i-rpg-development/", "overview.html",
        "Del RPG al futuro: moderniza IBM i",
        "Descubre SAMCO, moderniza RPG y amplía el recorrido con IBM i Agent, MCP, Bob Shell y automatización Ansible para PTF.",
        ("Premium", "IBM i", "RPG"), "~120", "22–48", ("6", "laboratorios"), True,
        "ibm-bob-ibmi-rpg-banner.png",
    ),
    LabSpec(
        IBMI, "lab0", "ibm-i-rpg-development/lab-00-discover-samco/", "lab0-discover-samco.html",
        "Lab 0 — Descubrir SAMCO",
        "Explora las reglas de negocio, los paneles y el flujo de pedidos de SAMCO antes de iniciar la modernización.",
        ("Premium", "Descubrimiento"), "~30", "3–8", ("Modo", "Ask"),
    ),
    LabSpec(
        IBMI, "lab1", "ibm-i-rpg-development/lab-01-fixed-to-free/", "lab1-fixed-to-free.html",
        "Lab 1 — Fixed-to-Free RPG",
        "Convierte lógica RPG de formato fijo a formato libre con procedimientos y constantes nombradas.",
        ("Premium", "RPGLE libre"), "~20", "3–6", ("Objetivo", "Dcl-Proc"),
    ),
    LabSpec(
        IBMI, "lab2", "ibm-i-rpg-development/lab-02-react-carbon-ui/", "lab2-react-carbon-ui.html",
        "Lab 2 — React + Carbon UI",
        "Construye una lista web moderna con React y Carbon a partir de datos de artículos.",
        ("Premium", "React + Carbon"), "~30", "4–10", ("Objetivo", "Interfaz web"),
    ),
    LabSpec(
        IBMI, "lab3", "ibm-i-rpg-development/lab-03-rla-to-sql/", "lab3-rla-to-sql.html",
        "Lab 3 — RLA a SQL",
        "Sustituye una operación RLA por SQL embebido y añade datos relacionados mediante JOIN.",
        ("Premium", "SQL embebido"), "~20", "2–4", ("Objetivo", "SELECT + JOIN"),
    ),
    LabSpec(
        IBMI, "lab4", "ibm-i-rpg-development/lab-04-ibmi-mcp/", "lab4-ibmi-mcp.html",
        "Lab 4 — IBM i MCP (opcional)",
        "Conecta Bob con IBM i Agent y MCP para consultar el sistema y explorar objetos mediante lenguaje natural.",
        ("Premium", "IBM i MCP", "Opcional"), "~30", "5–10", ("Requiere", "IBM i aprovisionado"),
    ),
    LabSpec(
        IBMI, "lab5", "ibm-i-rpg-development/lab-05-ansible-ptf/", "lab5-ansible-ptf.html",
        "Lab 5 — Ansible PTF (opcional)",
        "Crea un asistente Ansible para comprobar, informar y automatizar la gestión de PTF en IBM i.",
        ("Premium", "Ansible + PTF", "Opcional"), "~30", "5–10", ("Requiere", "IBM i aprovisionado"),
    ),
)

VOID_ELEMENTS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
TONE_BY_ADMONITION = {"tip": "tip", "success": "success", "warning": "warning", "danger": "danger", "note": "note", "info": "note"}
TRANSLATABLE_BLOCKS = {"p", "li", "h2", "h3", "h4", "summary", "figcaption", "label", "span", "strong", "em", "a", "td", "th", "caption", "dt", "dd"}
DOWNLOADS = {
    "simple-pharmacy-workshop-v2.zip": "./downloads/simple-pharmacy-workshop-v2.zip",
    "samco-workshop.zip": "./downloads/samco-workshop.zip",
    "simple-pharmacy.war_migrationPlan.zip": "./downloads/premium/java-modernization-v2/simple-pharmacy.war_migrationPlan.zip",
    "jars.zip": "./downloads/premium/java-modernization-v2/jars.zip",
}
LITERAL_TERMS = (
    "Simple Pharmacy Management System", "WebSphere Application Server",
    "Traditional WebSphere Application Server", "Liberty Application Server",
    "Traditional WebSphere", "Java Modernization", "Java Upgrade",
    "UI Modernization", "Java Unit Testing", "Vulnerabilities Detection",
    "IBM Bob IDE", "IBM Bob", "Open Liberty", "WebSphere", "Liberty",
    "IBM i Agent", "IBM i MCP", "Bob Shell", "Material UI", "Jakarta EE",
    "SDKMAN!", "Simple Pharmacy", "Red-Green-Refactor", "Agent Mode",
    "Ask Mode", "Node.js", "OpenAPI", "JAX-RS", "JUnit", "Maven",
    "Struts", "React", "Carbon", "Ansible", "RPGLE", "SAMCO", "TWas",
    "macOS", "Windows", "Linux", "CVEs", "PTF", "MCP", "RLA", "SQL", "POM",
    "Cucumber",
    "Premium", "Bob V2", "Bob v2", "bob v2",
)


@dataclass
class Node:
    tag: str | None = None
    attrs: list[tuple[str, str | None]] = field(default_factory=list)
    children: list["Node"] = field(default_factory=list)
    data: str = ""


class TreeBuilder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag.lower(), list(attrs))
        self.stack[-1].children.append(node)
        if node.tag not in VOID_ELEMENTS:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.stack[-1].children.append(Node(tag.lower(), list(attrs)))

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        if data:
            self.stack[-1].children.append(Node(data=data))


def element(tag: str, attrs: Iterable[tuple[str, str | None]] | None = None, children: Iterable[Node] | None = None) -> Node:
    return Node(tag, list(attrs or []), list(children or []))


def text(value: str) -> Node:
    return Node(data=value)


def class_names(node: Node) -> set[str]:
    value = get_attr(node, "class") or ""
    return set(value.split())


def get_attr(node: Node, name: str) -> str | None:
    for key, value in node.attrs:
        if key == name:
            return value
    return None


def set_attr(node: Node, name: str, value: str | None) -> None:
    node.attrs = [(key, old) for key, old in node.attrs if key != name]
    node.attrs.append((name, value))


def remove_attr(node: Node, name: str) -> None:
    node.attrs = [(key, value) for key, value in node.attrs if key != name]


def set_classes(node: Node, classes: Iterable[str]) -> None:
    classes = [item for item in classes if item]
    if classes:
        set_attr(node, "class", " ".join(dict.fromkeys(classes)))
    else:
        remove_attr(node, "class")


def is_text(node: Node) -> bool:
    return node.tag is None


def text_content(node: Node) -> str:
    if is_text(node):
        return node.data
    return "".join(text_content(child) for child in node.children)


def element_children(node: Node) -> list[Node]:
    return [child for child in node.children if not is_text(child)]


def is_whitespace(node: Node) -> bool:
    return is_text(node) and not node.data.strip()


def find_first(node: Node, predicate) -> Node | None:
    if not is_text(node) and predicate(node):
        return node
    for child in node.children:
        match = find_first(child, predicate)
        if match:
            return match
    return None


def walk(node: Node) -> Iterable[Node]:
    yield node
    for child in node.children:
        yield from walk(child)


def walk_with_context(node: Node, in_code: bool = False) -> Iterable[tuple[Node, bool]]:
    """Walk a tree while retaining whether a node belongs to literal code."""
    current_in_code = in_code or node.tag in {"code", "pre"}
    yield node, current_in_code
    for child in node.children:
        yield from walk_with_context(child, current_in_code)


def remove_matching(node: Node, predicate) -> None:
    kept: list[Node] = []
    for child in node.children:
        if not is_text(child) and predicate(child):
            continue
        if not is_text(child):
            remove_matching(child, predicate)
        kept.append(child)
    node.children = kept


def request_bytes(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(3):
        try:
            with urlopen(request, timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1 + attempt)
    raise RuntimeError("unreachable")


def fetch_article(spec: LabSpec) -> str:
    source_url = urljoin(SOURCE, spec.remote)
    page = request_bytes(source_url).decode("utf-8")
    match = re.search(r'<article[^>]*class="[^"]*md-content__inner[^"]*"[^>]*>(.*?)</article>', page, re.S)
    if not match:
        raise RuntimeError(f"No se encontró el artículo de Workshop Hub: {source_url}")
    return match.group(1)


def parse_fragment(fragment: str) -> Node:
    parser = TreeBuilder()
    parser.feed(fragment)
    parser.close()
    return parser.root


def serialize(node: Node, indent: int = 0) -> str:
    if is_text(node):
        return html.escape(node.data, quote=False)
    if node.tag == "root":
        return "\n".join(serialize(child, indent) for child in node.children if not (is_text(child) and not child.data.strip()))
    attrs = "".join(
        f' {"viewBox" if node.tag == "svg" and key == "viewbox" else key}' if value is None else f' {"viewBox" if node.tag == "svg" and key == "viewbox" else key}="{html.escape(value, quote=True)}"'
        for key, value in node.attrs
    )
    if node.tag in VOID_ELEMENTS:
        return f"{'  ' * indent}<{node.tag}{attrs} />"
    has_element_child = any(not is_text(child) for child in node.children)
    if not node.children:
        return f"{'  ' * indent}<{node.tag}{attrs}></{node.tag}>"
    if not has_element_child:
        value = "".join(serialize(child) for child in node.children)
        return f"{'  ' * indent}<{node.tag}{attrs}>{value}</{node.tag}>"
    lines = [f"{'  ' * indent}<{node.tag}{attrs}>"]
    for child in node.children:
        if is_whitespace(child):
            continue
        lines.append(serialize(child, indent + 1))
    lines.append(f"{'  ' * indent}</{node.tag}>")
    return "\n".join(lines)


def source_url_for(spec: LabSpec) -> str:
    return urljoin(SOURCE, spec.remote)


def local_image_path(spec: LabSpec, source_ref: str) -> str:
    filename = Path(urlparse(source_ref).path).name
    return f"./assets/images/labs/{spec.track}/premium/{filename}"


def normalized_ref(spec: LabSpec, ref: str | None) -> str | None:
    if not ref or ref.startswith(("#", "mailto:", "tel:", "data:")):
        return ref
    route = local_lab_route(spec, ref)
    if route:
        return route
    parsed = urlparse(ref)
    filename = Path(parsed.path).name
    if Path(filename).suffix.lower() in IMAGE_SUFFIXES:
        return local_image_path(spec, ref)
    if filename in DOWNLOADS:
        return DOWNLOADS[filename]
    return ref


def local_lab_route(spec: LabSpec, ref: str) -> str | None:
    """Map an upstream workshop-to-workshop link onto this SPA's route."""
    parsed = urlparse(ref)
    if parsed.scheme or parsed.netloc:
        return None
    absolute = urljoin(source_url_for(spec), ref)
    path = urlparse(absolute).path.rstrip("/")
    for candidate in LABS:
        if path != urlparse(source_url_for(candidate)).path.rstrip("/"):
            continue
        suffix = f"#{parsed.fragment}" if parsed.fragment else ""
        return f"#/lab/{candidate.track}/{candidate.key}{suffix}"
    return None


def collect_images(root: Node, spec: LabSpec) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    for node in walk(root):
        if node.tag != "img":
            continue
        source_ref = get_attr(node, "src")
        if not source_ref:
            continue
        absolute = urljoin(source_url_for(spec), source_ref)
        entries.append({
            "source_url": absolute,
            "local": local_image_path(spec, absolute),
            "file": Path(urlparse(absolute).path).name,
            "track": spec.track,
            "stage": spec.key,
        })
    return entries


def image_dimensions(payload: bytes) -> dict[str, int] | None:
    if payload.startswith(b"\x89PNG\r\n\x1a\n") and len(payload) >= 24:
        return {"width": struct.unpack(">I", payload[16:20])[0], "height": struct.unpack(">I", payload[20:24])[0]}
    if payload[:2] == b"\xff\xd8":
        index = 2
        while index + 9 < len(payload):
            if payload[index] != 0xFF:
                index += 1
                continue
            marker = payload[index + 1]
            index += 2
            if marker in {0xD8, 0xD9}:
                continue
            size = struct.unpack(">H", payload[index:index + 2])[0]
            if marker in set(range(0xC0, 0xC4)) | set(range(0xC5, 0xC8)) | set(range(0xC9, 0xCC)) | set(range(0xCD, 0xD0)):
                return {"height": struct.unpack(">H", payload[index + 3:index + 5])[0], "width": struct.unpack(">H", payload[index + 5:index + 7])[0]}
            index += size
    return None


def sync_images(entries: list[dict[str, str]]) -> list[dict[str, object]]:
    deduplicated: dict[str, dict[str, str]] = {}
    for entry in entries:
        deduplicated.setdefault(entry["local"], entry)
    manifest: list[dict[str, object]] = []
    for local, entry in sorted(deduplicated.items()):
        payload = request_bytes(entry["source_url"])
        destination = DOCS / local.removeprefix("./")
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists() or hashlib.sha256(destination.read_bytes()).digest() != hashlib.sha256(payload).digest():
            destination.write_bytes(payload)
        dimensions = image_dimensions(payload) or {}
        used_in = sorted({item["stage"] for item in entries if item["local"] == local})
        manifest.append({
            "file": local,
            "source": entry["source_url"],
            "sha256": hashlib.sha256(payload).hexdigest(),
            "usedIn": used_in,
            **dimensions,
        })
    return manifest


def translate_payload(payload: str) -> str:
    query = urlencode({"client": "gtx", "sl": "en", "tl": "es", "dt": "t", "q": payload})
    response = request_bytes(f"{TRANSLATE_URL}?{query}")
    decoded = json.loads(response.decode("utf-8"))
    return "".join(piece[0] for piece in decoded[0])


def translate_many(values: list[str]) -> list[str]:
    normalized = [value.strip() for value in values]
    unique = list(dict.fromkeys(value for value in normalized if value and re.search(r"[A-Za-z]{2}", value)))
    translated: dict[str, str] = {}
    batches: list[list[str]] = []
    current: list[str] = []
    current_size = 0
    for value in unique:
        if len(value) > 3600:
            batches.append([value])
            continue
        extra = len(value) + 48
        if current and current_size + extra > 3600:
            batches.append(current)
            current, current_size = [], 0
        current.append(value)
        current_size += extra
    if current:
        batches.append(current)
    for batch_number, batch in enumerate(batches):
        markers = [f"⟦PREMIUM_SPLIT_{batch_number}_{index}⟧" for index in range(len(batch) - 1)]
        payload_parts: list[str] = []
        for index, value in enumerate(batch):
            payload_parts.append(value)
            if index < len(markers):
                payload_parts.append(markers[index])
        payload = "\n".join(payload_parts)
        result = translate_payload(payload)
        parts = result.split("\n")
        rebuilt: list[str] = []
        buffer: list[str] = []
        marker_index = 0
        for part in parts:
            if marker_index < len(markers) and part.strip() == markers[marker_index]:
                rebuilt.append("\n".join(buffer).strip())
                buffer = []
                marker_index += 1
            else:
                buffer.append(part)
        rebuilt.append("\n".join(buffer).strip())
        if len(rebuilt) != len(batch):
            rebuilt = [translate_payload(value).strip() for value in batch]
        translated.update(dict(zip(batch, rebuilt)))
    output: list[str] = []
    for original, stripped in zip(values, normalized):
        if not stripped or stripped not in translated:
            output.append(original)
            continue
        prefix = original[:len(original) - len(original.lstrip())]
        suffix = original[len(original.rstrip()):]
        output.append(f"{prefix}{translated[stripped]}{suffix}")
    return output


def should_translate_prompt(value: str) -> bool:
    stripped = value.strip()
    if not re.search(r"[A-Za-z]{3}", stripped):
        return False
    if re.fullmatch(r"[~@./A-Za-z0-9_{}*:\-]+", stripped):
        return False
    if re.match(r"^(curl|sdk|mvn|npm|node|python|pip|git|docker|kubectl|ansible|winget|wsl|java|source|export|cd|ls)\b", stripped, re.I):
        return False
    return True


def mask_technical_tokens(value: str) -> tuple[str, dict[str, str]]:
    protected: dict[str, str] = {}
    pattern = re.compile(r"https?://[^\s]+|(?:[A-Za-z0-9_.-]+/[A-Za-z0-9_./{}@*:\-]+)|(?:[A-Za-z_][\w.-]*\.[A-Za-z0-9_-]+)|(?:--?[\w-]+)|(?:\$[A-Za-z_][\w]*)")

    def replace(match: re.Match[str]) -> str:
        token = f"⟦T{len(protected)}⟧"
        protected[token] = match.group(0)
        return token

    return pattern.sub(replace, value), protected


def mask_literal_terms(value: str) -> tuple[str, dict[str, str]]:
    """Protect product, UI and technology names from literal translation."""
    protected: dict[str, str] = {}
    expression = re.compile(
        "|".join(re.escape(term) for term in sorted(LITERAL_TERMS, key=len, reverse=True)),
        re.IGNORECASE,
    )

    def replace(match: re.Match[str]) -> str:
        token = f"⟦L{len(protected)}⟧"
        protected[token] = match.group(0)
        return token

    return expression.sub(replace, value), protected


def restore_technical_tokens(value: str, protected: dict[str, str]) -> str:
    for token, original in protected.items():
        value = value.replace(token, original)
    return value


def repair_localized_copy(root: Node) -> None:
    """Apply deterministic fixes for short strings where machine translation lacks context."""
    repairs = {
        "lo que lograrás": "Lo que lograrás",
        "Obtenga el código fuente primero": "Obtén primero el código fuente",
        "Obtener ayuda durante el laboratorio": "Obtén ayuda durante el laboratorio",
        "iniciar el laboratorio": "Iniciar el laboratorio",
        "laboratorio 1": "Laboratorio 1",
        "laboratorio 2": "Laboratorio 2",
        "laboratorio 3": "Laboratorio 3",
        "laboratorio 4": "Laboratorio 4",
        "laboratorio 5": "Laboratorio 5",
        "pompón": "POM",
        "Frontal": "Interfaz",
        "Frontend": "Interfaz",
        "que hace": "Qué hace",
        "one-paragraph": "de un párrafo",
        "Lab 1 usa Java 8.": "El Laboratorio 1 usa Java 8.",
    }
    for node, in_code in walk_with_context(root):
        if not is_text(node) or in_code:
            continue
        for source, replacement in repairs.items():
            node.data = node.data.replace(source, replacement)


def normalize_highlight_blocks(node: Node) -> None:
    for index, child in list(enumerate(node.children)):
        if is_text(child):
            continue
        normalize_highlight_blocks(child)
        if child.tag != "div" or "highlight" not in class_names(child):
            continue
        pre = find_first(child, lambda candidate: candidate.tag == "pre")
        if not pre:
            continue
        classes = class_names(child)
        language = next((item.removeprefix("language-") for item in classes if item.startswith("language-")), "text")
        code = find_first(pre, lambda candidate: candidate.tag == "code") or pre
        raw = text_content(code).strip("\n")
        replacement = element("div", [("class", "code-block premium-code-block"), ("data-language", language)], [
            element("pre", children=[element("code", children=[text(raw)])])
        ])
        node.children[index] = replacement


def normalize_markup(node: Node, spec: LabSpec) -> None:
    for child in node.children:
        if not is_text(child):
            normalize_markup(child, spec)
    if is_text(node):
        return
    if node.tag == "a" and "headerlink" in class_names(node):
        node.children = []
        set_attr(node, "hidden", "hidden")
        return
    for attr in ("src", "href"):
        value = get_attr(node, attr)
        normalized = normalized_ref(spec, value)
        if normalized != value and normalized is not None:
            set_attr(node, attr, normalized)
    classes = class_names(node)
    if "admonition" in classes:
        tone = next((TONE_BY_ADMONITION[item] for item in classes if item in TONE_BY_ADMONITION), "note")
        set_classes(node, ["callout"])
        set_attr(node, "data-tone", tone)
    elif node.tag == "p" and "admonition-title" in classes:
        set_classes(node, ["callout__title"])
    elif node.tag == "details":
        set_classes(node, ["premium-details"])
    elif "tabbed-set" in classes:
        set_classes(node, ["premium-platform-options"])
    elif "tabbed-labels" in classes:
        set_classes(node, ["premium-platform-options__labels"])
    elif "tabbed-content" in classes:
        set_classes(node, ["premium-platform-options__content"])
    elif "tabbed-block" in classes:
        set_classes(node, ["premium-platform-option"])
    elif "wh-roadmap-steps" in classes:
        set_classes(node, ["premium-roadmap"])
    elif "keys" in classes:
        set_classes(node, ["premium-keys"])
    elif "key" in classes:
        set_classes(node, ["premium-key"])
    elif "task-list-control" in classes:
        set_classes(node, ["premium-checklist__control"])
    elif "task-list-indicator" in classes:
        set_classes(node, ["premium-checklist__indicator"])
    elif "twemoji" in classes:
        set_classes(node, ["premium-button-icon"])
    elif node.tag == "table":
        set_classes(node, ["lab-table"])
    elif node.tag == "ul":
        set_classes(node, ["cds--list--unordered"])
    elif node.tag == "ol":
        set_classes(node, ["cds--list--ordered"])
    elif node.tag == "li":
        set_classes(node, ["cds--list__item"])
    elif node.tag == "a" and "md-button" in classes:
        set_classes(node, ["cds--btn", "cds--btn--primary"])
    elif node.tag == "h3":
        set_classes(node, ["cds--productive-heading-02", "lab-step__title"])
    elif node.tag == "h4":
        set_classes(node, ["cds--productive-heading-01", "lab-step__title"])
    else:
        # The source is MkDocs. Source-only utility classes must not leak into
        # SPA fragments, which use the local workshop component system instead.
        retained = [
            item for item in class_names(node)
            if not item.startswith("md-")
            and item not in {"glightbox", "admonition", "highlight"}
        ]
        set_classes(node, retained)


def only_image_wrapper(node: Node) -> tuple[Node, Node] | None:
    children = [child for child in node.children if not is_whitespace(child)]
    if len(children) != 1 or children[0].tag != "a":
        return None
    anchor = children[0]
    image = find_first(anchor, lambda candidate: candidate.tag == "img")
    if not image:
        return None
    return anchor, image


def figure_for(anchor: Node, image: Node, *, hero: bool = False) -> Node:
    src = get_attr(image, "src") or ""
    alt = get_attr(image, "alt") or "Captura del laboratorio"
    set_classes(anchor, ["lab-figure__link"])
    for attribute in ("data-type", "data-width", "data-height", "data-desc-position"):
        remove_attr(anchor, attribute)
    set_attr(anchor, "href", src)
    set_attr(anchor, "target", "_blank")
    set_attr(anchor, "rel", "noopener")
    set_classes(image, ["lab-figure__img"])
    if hero:
        set_classes(image, ["lab-hero-image__img"])
        return element("div", [("class", "lab-hero-image")], [image])
    return element("figure", [("class", "lab-figure premium-workflow__figure")], [anchor])


def normalize_images(node: Node, spec: LabSpec) -> None:
    for child in node.children:
        if not is_text(child):
            normalize_images(child, spec)
    rebuilt: list[Node] = []
    for child in node.children:
        if not is_text(child) and child.tag == "p":
            wrapped = only_image_wrapper(child)
            if wrapped:
                rebuilt.append(figure_for(*wrapped))
                continue
        if not is_text(child) and child.tag == "figure":
            wrapped = only_image_wrapper(child)
            if wrapped:
                _, image = wrapped
                basename = Path(get_attr(image, "src") or "").name
                rebuilt.append(figure_for(*wrapped, hero=spec.overview and basename == spec.banner))
                continue
        rebuilt.append(child)
    node.children = rebuilt


def translate_markup_blocks(root: Node) -> None:
    """Translate complete visible blocks so inline terms retain their grammar.

    Translating every text node separately loses the relation between prose and
    adjacent ``strong``/``code`` elements. Google preserves simple HTML, so we
    send each semantic block as markup while temporarily replacing code with
    opaque tokens. Commands and source snippets therefore remain byte-for-byte
    intact, whereas the surrounding sentence receives full context.
    """
    blocks: list[Node] = []

    def collect(node: Node, in_code: bool = False) -> None:
        if is_text(node):
            return
        current_in_code = in_code or node.tag in {"code", "pre"}
        if current_in_code:
            return
        if node.tag in TRANSLATABLE_BLOCKS:
            blocks.append(node)
            return
        for child in node.children:
            collect(child, current_in_code)

    collect(root)
    prepared: list[tuple[Node, str, dict[str, str], dict[str, str]]] = []
    for block in blocks:
        markup_tokens: dict[str, str] = {}

        def token_for(source: str) -> str:
            token = f"⟦M{len(markup_tokens)}⟧"
            markup_tokens[token] = source
            return token

        def template_for(node: Node) -> str:
            if is_text(node):
                return html.escape(node.data, quote=False)
            # Code can contain shell commands, source, paths and prompts. It
            # is restored verbatim here, then text-only prompt blocks receive
            # their own controlled translation below.
            if node.tag == "code":
                return token_for(serialize(node))
            attrs = "".join(
                f' {"viewBox" if node.tag == "svg" and key == "viewbox" else key}' if value is None else f' {"viewBox" if node.tag == "svg" and key == "viewbox" else key}="{html.escape(value, quote=True)}"'
                for key, value in node.attrs
            )
            if node.tag in VOID_ELEMENTS:
                return token_for(f"<{node.tag}{attrs} />")
            opening = token_for(f"<{node.tag}{attrs}>")
            closing = token_for(f"</{node.tag}>")
            return f"{opening}{''.join(template_for(child) for child in node.children)}{closing}"

        markup = "".join(template_for(child) for child in block.children)
        masked, literals = mask_literal_terms(markup)
        prepared.append((block, masked, literals, markup_tokens))

    translated = translate_many([markup for _, markup, _, _ in prepared])
    for (block, _, literals, markup_tokens), value in zip(prepared, translated):
        value = restore_technical_tokens(value, literals)
        value = restore_technical_tokens(value, markup_tokens)
        localized = parse_fragment(value)
        if localized.children:
            block.children = localized.children


def translate_tree(root: Node) -> None:
    translate_markup_blocks(root)
    targets: list[tuple[Node, str, str]] = []
    for node, in_code in walk_with_context(root):
        if is_text(node):
            continue
        if in_code:
            continue
        for attribute in ("alt", "aria-label", "title"):
            value = get_attr(node, attribute)
            if value and re.search(r"[A-Za-z]{2}", value):
                targets.append((node, attribute, value))
    masked_values: list[str] = []
    literal_masks: list[dict[str, str]] = []
    for _, _, value in targets:
        masked, protected = mask_literal_terms(value)
        masked_values.append(masked)
        literal_masks.append(protected)
    translated = translate_many(masked_values)
    for (node, attribute, _), value, protected in zip(targets, translated, literal_masks):
        value = restore_technical_tokens(value, protected)
        if attribute == "data":
            node.data = value
        else:
            set_attr(node, attribute, value)

    prompt_nodes: list[Node] = []
    masked_values: list[str] = []
    masks: list[dict[str, str]] = []
    for node in walk(root):
        if node.tag != "div" or get_attr(node, "data-language") != "text":
            continue
        code = find_first(node, lambda candidate: candidate.tag == "code")
        if not code or len(code.children) != 1 or not is_text(code.children[0]):
            continue
        value = code.children[0].data
        if not should_translate_prompt(value):
            continue
        masked, protected = mask_technical_tokens(value)
        masked, literals = mask_literal_terms(masked)
        protected.update(literals)
        prompt_nodes.append(code.children[0])
        masked_values.append(masked)
        masks.append(protected)
    for node, translated, protected in zip(prompt_nodes, translate_many(masked_values), masks):
        node.data = restore_technical_tokens(translated, protected)
    repair_localized_copy(root)


def add_figure_captions(node: Node) -> None:
    for child in node.children:
        if not is_text(child):
            add_figure_captions(child)
    if node.tag != "figure" or "lab-figure" not in class_names(node):
        return
    if find_first(node, lambda candidate: candidate.tag == "figcaption"):
        return
    image = find_first(node, lambda candidate: candidate.tag == "img")
    if not image:
        return
    alt = (get_attr(image, "alt") or "Captura de referencia").rstrip(".")
    node.children.append(element("figcaption", [("class", "lab-figure__caption")], [
        text(f"Referencia visual — {alt}. Verifica este estado antes de continuar.")
    ]))


def heading_id(node: Node, fallback: str) -> str:
    current = get_attr(node, "id")
    if current:
        return current
    normalized = re.sub(r"[^a-z0-9]+", "-", text_content(node).lower()).strip("-")
    return normalized or fallback


def section_heading(label: str, identifier: str) -> Node:
    return element("h2", [("class", "cds--productive-heading-03"), ("id", identifier)], [text(label)])


def build_banner(spec: LabSpec) -> Node:
    tag_nodes = [element("span", [("class", "cds--tag cds--tag--green")], [text(spec.tags[0])])]
    tag_nodes.extend(element("span", [("class", "cds--tag cds--tag--cool-gray")], [text(tag)]) for tag in spec.tags[1:])
    metric_items = [spec.metric, (spec.duration, "minutos"), (spec.bobcoins, "BobCoins estimados"), ("Premium", "acceso requerido")]
    children: list[Node] = [
        element("div", [("class", "lab-banner__tags")], tag_nodes),
        element("h1", [("class", "cds--productive-heading-05 lab-banner__title")], [text(spec.title)]),
    ]
    if spec.overview and spec.banner:
        children.append(element("div", [("class", "lab-hero-image")], [
            element("img", [
                ("class", "lab-hero-image__img"),
                ("src", f"./assets/images/labs/{spec.track}/premium/{spec.banner}"),
                ("alt", f"Portada del workshop: {spec.title}"),
            ])
        ]))
    children.extend([
        element("p", [("class", "cds--body-02 lab-banner__summary")], [text(spec.summary)]),
        element("div", [("class", "lab-banner__metrics")], [
            element("div", [("class", "lab-banner__metric")], [
                element("span", [("class", "lab-banner__metric-value")], [text(value)]),
                element("span", [("class", "lab-banner__metric-label")], [text(label)]),
            ]) for value, label in metric_items
        ]),
    ])
    return element("div", [("class", "lab-banner")], children)


def build_structured_fragment(root: Node, spec: LabSpec) -> Node:
    source_nodes = [child for child in root.children if not is_whitespace(child)]
    output = element("div", [("class", "content-panel lab-template premium-workflow")], [])
    if spec.overview:
        set_attr(output, "data-custom-overview", "true")
    output.children.append(build_banner(spec))
    current: Node | None = None
    introduction: list[Node] = []
    section_number = 0
    for child in source_nodes:
        if child.tag == "h1":
            continue
        # The local banner above is the overview cover. Keeping the original
        # image node would render the same imported source banner twice.
        if child.tag == "div" and "lab-hero-image" in class_names(child):
            continue
        if child.tag == "a" and get_attr(child, "hidden") == "hidden":
            continue
        if child.tag == "h2":
            if introduction:
                output.children.append(element("section", [("class", "lab-section"), ("aria-labelledby", f"{spec.key}-introduccion")], [
                    section_heading("Introducción", f"{spec.key}-introduccion"), *introduction
                ]))
                introduction = []
            if current:
                output.children.append(current)
            section_number += 1
            identifier = heading_id(child, f"{spec.key}-seccion-{section_number}")
            set_classes(child, ["cds--productive-heading-03"])
            set_attr(child, "id", identifier)
            current = element("section", [("class", "lab-section"), ("aria-labelledby", identifier)], [child])
            continue
        if current is None:
            introduction.append(child)
        else:
            current.children.append(child)
    if introduction:
        output.children.append(element("section", [("class", "lab-section"), ("aria-labelledby", f"{spec.key}-introduccion")], [
            section_heading("Introducción", f"{spec.key}-introduccion"), *introduction
        ]))
    if current:
        output.children.append(current)
    return output


def clean_source_tree(root: Node) -> None:
    remove_matching(root, lambda node: node.tag == "h1")
    remove_matching(root, lambda node: "headerlink" in class_names(node))
    remove_matching(root, lambda node: "md-footnote" in class_names(node))
    remove_matching(root, lambda node: node.tag == "script")


def rebuild() -> None:
    all_entries: list[dict[str, str]] = []
    prepared: list[tuple[LabSpec, Node]] = []
    for spec in LABS:
        tree = parse_fragment(fetch_article(spec))
        clean_source_tree(tree)
        all_entries.extend(collect_images(tree, spec))
        normalize_highlight_blocks(tree)
        normalize_markup(tree, spec)
        normalize_images(tree, spec)
        translate_tree(tree)
        structured = build_structured_fragment(tree, spec)
        add_figure_captions(structured)
        prepared.append((spec, structured))
    manifest = sync_images(all_entries)
    if len(manifest) != 42:
        raise RuntimeError(f"La fuente debería aportar 42 capturas, pero aportó {len(manifest)}")
    for spec, structured in prepared:
        destination = CONTENT_ROOT / spec.track / spec.target
        destination.parent.mkdir(parents=True, exist_ok=True)
        # The two overview pages are curated to mirror the local standard
        # workshop outline. Rebuild their upstream assets and stage fragments,
        # but do not replace that local structure on a later import.
        if spec.overview and destination.exists():
            continue
        destination.write_text(serialize(structured) + "\n", encoding="utf-8")
    MANIFEST_PATH.write_text(json.dumps({"source": SOURCE, "assets": manifest}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Reconstruidos {len(prepared)} fragmentos y verificados {len(manifest)} recursos visuales.")


def verify() -> None:
    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    assets = data.get("assets", [])
    if len(assets) != 42:
        raise RuntimeError(f"El manifest contiene {len(assets)} recursos, no 42")
    missing: list[str] = []
    mismatched: list[str] = []
    for asset in assets:
        file = DOCS / str(asset["file"]).removeprefix("./")
        if not file.exists():
            missing.append(str(asset["file"]))
            continue
        actual = hashlib.sha256(file.read_bytes()).hexdigest()
        if actual != asset["sha256"]:
            mismatched.append(str(asset["file"]))
    fragments = sorted(CONTENT_ROOT.glob("*/*.html"))
    invalid: list[str] = []
    unresolved_links: list[str] = []
    unused_assets: list[str] = []
    unresolved_tokens: list[str] = []
    manifest_by_stage = {
        (spec.track, spec.key): spec
        for spec in LABS
    }
    for fragment in fragments:
        content = fragment.read_text(encoding="utf-8")
        spec = next((candidate for candidate in LABS if CONTENT_ROOT / candidate.track / candidate.target == fragment), None)
        stage_assets = [
            asset for asset in assets
            if spec and spec.key in asset.get("usedIn", []) and str(asset["file"]) in content
        ]
        checks = [
            'content-panel lab-template premium-workflow' in content,
            content.count('class="lab-banner"') == 1,
            '<h1 class="cds--productive-heading-05 lab-banner__title">' in content,
            'class="admonition' not in content,
            'class="glightbox' not in content,
            'class="md-' not in content,
            'wh-roadmap' not in content,
            'tabbed-block' not in content,
            (not stage_assets or '<figure class="lab-figure premium-workflow__figure"' in content or fragment.name == 'overview.html'),
        ]
        if not all(checks):
            invalid.append(str(fragment.relative_to(ROOT)))
        if re.search(r"⟦[TLM]\d+⟧|__PREMIUM_(?:TOKEN|LITERAL|MARKUP)_", content):
            unresolved_tokens.append(str(fragment.relative_to(ROOT)))
        for href in re.findall(r'href="([^"]+)"', content):
            if not href.startswith(("#", "./", "http://", "https://", "mailto:", "tel:")):
                unresolved_links.append(f"{fragment.relative_to(ROOT)}: {href}")
    for asset in assets:
        for stage in asset.get("usedIn", []):
            spec = manifest_by_stage.get((str(asset["file"]).split("/")[-3], stage))
            if not spec:
                continue
            fragment = CONTENT_ROOT / spec.track / spec.target
            if str(asset["file"]) not in fragment.read_text(encoding="utf-8"):
                unused_assets.append(f"{fragment.relative_to(ROOT)}: {asset['file']}")
    if missing or mismatched or invalid or unresolved_links or unused_assets or unresolved_tokens:
        raise RuntimeError(json.dumps({"missing": missing, "mismatched": mismatched, "invalid": invalid, "unresolvedLinks": unresolved_links, "unusedAssets": unused_assets, "unresolvedTokens": unresolved_tokens}, ensure_ascii=False))
    print(f"Verificados {len(fragments)} fragmentos y {len(assets)} recursos visuales.")


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "rebuild"
    if command == "rebuild":
        rebuild()
    elif command == "verify":
        verify()
    else:
        raise SystemExit("Uso: rebuild_premium_workflows.py [rebuild|verify]")
