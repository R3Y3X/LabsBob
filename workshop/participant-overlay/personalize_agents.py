#!/usr/bin/env python3
"""Apply TechZone + participant isolation to every Voltia agent and knowledge base."""
from __future__ import annotations

import argparse
from pathlib import Path


AGENT_NAMES = (
    "SKU_Availability_Agent",
    "Substitute_Finder_Agent",
    "Store_Associate_Agent",
    "Customer_Shopping_Assistant",
)


def load_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("\"'")
    return values


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=Path("../../participant-config.env"))
    args = parser.parse_args()
    values = load_env(args.config.resolve())
    workspace_id = values["WORKSHOP_ID"]
    table = str(int(values["WORKSHOP_TABLE"]))
    participant = str(int(values["PARTICIPANT_NUMBER"]))
    suffix = f"TZ{table}_P{int(participant):03d}"
    kb = values.get("KNOWLEDGE_BASE_NAME", f"enterprise_documents_{workspace_id}")
    root = Path(__file__).resolve().parent
    for yaml_path in root.glob("*.yaml"):
        content = yaml_path.read_text(encoding="utf-8")
        content = content.replace("{T}", table).replace("{P}", participant)
        for name in AGENT_NAMES:
            content = content.replace(name, f"{name}_{suffix}") if f"{name}_{suffix}" not in content else content
        content = content.replace("enterprise_documents", kb) if kb not in content else content
        yaml_path.write_text(content, encoding="utf-8")
    print(f"Agents personalized for {workspace_id} (table_number={table}, participant_number={participant}); knowledge base: {kb}")


if __name__ == "__main__":
    main()
