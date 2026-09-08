# Voltia inventory MCP

This service is the single tool used by the participant's Orchestrate agents.
It runs as Streamable HTTP on `127.0.0.1:8000/mcp`. Nginx publishes it on
**HTTP** `:80` as `http://<vm>/retail-mcp/mcp` (and also on `:443`). watsonx
Orchestrate on IBM Cloud rejects the VM certificate, so the toolkit **must**
use HTTP.

The tool is `get_sku_availability(table_number, participant_number, sku, branch)`.
`table_number` is the TechZone from the hub (`1`–`3`), **not** the physical mesa
(4–6) and **not** which Business Partner owns the Orchestrate instance. This
process reads `inventory.availability.tz{n}_p{xxx}` from **this VM's Kafka**;
it does not reject a call because `n` differs from `WORKSHOP_TABLE`.
There is deliberately no credential in this directory.

## Install on a VM

Copy this directory to the VM, edit `/etc/retail-mcp/retail-mcp.env`, then run:

```bash
sudo ./install.sh
```

From the repository, the same operation can be automated per VM (the env file
is local and must contain that VM's Kafka + Schema Registry credentials):

```bash
./deploy_vm.sh root@<vm-host> ./cflt-vsi-key.pem 1 ./tz1-retail-mcp.env
```

Run it once for each TechZone/VM, changing the host, table number and env file.

Keep `nginx-retail-mcp.conf` inside **both** the HTTP (`:80`) and HTTPS
(`:443`) `server` blocks so `/retail-mcp/` is not redirected to HTTPS. Verify
with `curl -sS http://<vm>/retail-mcp/health`.

The public endpoint is intentionally unauthenticated for the workshop.
Restrict the VM/network to the lab audience and add an API gateway token
before using this pattern outside a controlled lab.
