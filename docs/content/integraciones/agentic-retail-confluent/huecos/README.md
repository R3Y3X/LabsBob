# Huecos Track D — dry-run TZ1-P099 (2026-09-08)

Notas de facilitador / agente. **No** se renderizan en el hub (`data.js` no las lista). Cero secretos.

Dry-run contra TechZone TZ1, participante **99** (`tz1_p099`), IP `163.66.83.162`. Bundle: ZIP base + `participant-config.env` del hub. Workspace Bob = raíz `RoadShowBobStreamingIntegration`.

**Estado producto (misma fecha, segunda pasada):** los huecos de este folder ya están parcheados en overlay + HTML + ZIP. Usar el bundle regenerado (`python3 scripts/build_agentic_bundle.py`). Los `.md` de aquí quedan como auditoría del dry-run, no como runbook del evento.

| Lab del hub | Archivo | Resultado en el dry-run | Parche producto |
|---|---|---|---|
| Introducción (Paso 0) | [00-overview-paso0.md](00-overview-paso0.md) | SSH ok; tres passwords en los tres `.env` | `FLINK_*` en `participant.js`; cheatsheet sin `credentials.json` |
| Tópico Kafka (lab 1) | [01-topics.md](01-topics.md) | `-s 1` y `-s 2` ok; schema **no** corría en `-s 1` | `setup.sh -s 1` = tópico + `register_schema`; SR interno |
| ksqlDB + Flink (lab 2) | [02-ksqldb-flink.md](02-ksqldb-flink.md) | ksqlDB ok; **Flink no quedaba RUNNING** | `setup.sh -s 4` + `submit_flink.py` (confluent, timeout broker) |
| Publicar eventos (lab 3) | [03-publish.md](03-publish.md) | `-s 3` **fallaba** con el ZIP tal cual | pin `confluent-kafka==2.6.1`, `to_dict`, `title`, stdout 20/20 |
