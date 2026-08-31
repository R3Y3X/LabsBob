#!/usr/bin/env python3
"""Rebuild the canonical Voltia workshop bundle with participant-safe pipeline files.

The browser customizer adds participant-config.env at download time. This
build step keeps the base archive itself consistent with that configuration:
JSON Schema/JSON_SR is used end to end and cleanup is namespaced.
"""
from __future__ import annotations

import argparse
import copy
import shutil
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BUNDLE = ROOT / "docs/downloads/agentic-retail-workshop.zip"
OVERLAY = ROOT / "workshop/participant-overlay"
ROOT_PREFIX = "RoadShowBobStreamingIntegration/"
OLD_ROOT_PREFIX = "Labs-tech-summit/"
PREFIX = f"{ROOT_PREFIX}trackD/inventory-pipeline/"
AGENT_PREFIX = f"{ROOT_PREFIX}trackF/confluent_agents/"


def archive_name(name: str) -> str:
    """Return the canonical extracted path, also migrating old archives."""
    migrations = (
        (f"{OLD_ROOT_PREFIX}Lab1/", f"{ROOT_PREFIX}trackD/"),
        (f"{OLD_ROOT_PREFIX}Lab2/", f"{ROOT_PREFIX}trackF/"),
        (f"{OLD_ROOT_PREFIX}Lab3/", f"{ROOT_PREFIX}voltia/"),
        (OLD_ROOT_PREFIX, ROOT_PREFIX),
    )
    for old_prefix, new_prefix in migrations:
        if name.startswith(old_prefix):
            return new_prefix + name[len(old_prefix):]
    return name


def rewrite_text(data: bytes) -> bytes:
    """Keep instructions aligned with the folder names users actually extract."""
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return data
    replacements = (
        ("Labs-tech-summit", "RoadShowBobStreamingIntegration"),
        ("Lab1", "trackD"),
        ("Lab2", "trackF"),
        ("Lab3", "voltia"),
        ("Lab 1", "Track D"),
        ("Lab 2", "Track F"),
        ("Lab 3", "Voltia"),
    )
    for old, new in replacements:
        text = text.replace(old, new)
    # Avoid awkward duplication in the original README phrase "Lab 3 (Voltia)".
    text = text.replace("Voltia (Voltia)", "Voltia")
    return text.encode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    args = parser.parse_args()
    bundle = args.bundle.resolve()
    pipeline_files = {
        "create_topic.py",
        "register_schema.py",
        "create_derived_topic.py",
        "produce_messages.py",
        "setup.sh",
        "delete_topics.py",
        "run_in_cluster.sh",
        "run_in_cluster_remote.sh",
    }
    replacements = {
        f"{PREFIX}{path.name}": path.read_bytes()
        for path in OVERLAY.iterdir()
        if path.is_file() and path.name in pipeline_files
    }
    for name in ("personalize_agents.py", "register_shared_toolkit.sh", "workshop-config.env.example"):
        replacements[f"{AGENT_PREFIX}{name}"] = (OVERLAY / name).read_bytes()
    if not replacements:
        raise SystemExit(f"No overlay files found in {OVERLAY}")

    with tempfile.NamedTemporaryFile(dir=bundle.parent, suffix=".zip", delete=False) as temp:
        temp_path = Path(temp.name)
    try:
        with zipfile.ZipFile(bundle, "r") as source, zipfile.ZipFile(temp_path, "w") as target:
            written = set()
            for info in source.infolist():
                target_name = archive_name(info.filename)
                if target_name in replacements:
                    if target_name in written:
                        continue
                    target_info = copy.copy(info)
                    target_info.filename = target_name
                    target.writestr(target_info, replacements[target_name])
                    written.add(target_name)
                else:
                    target_info = copy.copy(info)
                    target_info.filename = target_name
                    target.writestr(target_info, rewrite_text(source.read(info)))
                    written.add(target_name)
            missing = set(replacements) - written
            for name in sorted(missing):
                target.writestr(name, replacements[name])
        shutil.move(temp_path, bundle)
    finally:
        temp_path.unlink(missing_ok=True)
    print(f"Updated {bundle} with {len(replacements)} participant-safe files")


if __name__ == "__main__":
    main()
