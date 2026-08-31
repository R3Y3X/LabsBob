# Voltia inventory MCP

This service is the single tool used by the participant's Orchestrate agents.
It runs as Streamable HTTP on `127.0.0.1:8000/mcp`; Nginx publishes it as
`https://<vm>/retail-mcp/mcp`. The tool validates `workshop_id` against the
VM's mesa and only reads the namespaced ksqlDB table configured in the env
file. There is deliberately no credential in this directory.

## Install on a VM

Copy this directory to the VM, edit `/etc/retail-mcp/retail-mcp.env`, then run:

```bash
sudo ./install.sh
```

From the repository, the same operation can be automated per VM (the env file
is local and must contain that VM's ksqlDB credentials):

```bash
./deploy_vm.sh root@<vm-host> ./cflt-vsi-key.pem 1 ./mesa-1-retail-mcp.env
```

Run it once for each Mesa/VM, changing the host, table number and env file.

Add `nginx-retail-mcp.conf` inside the existing HTTPS `server` block and run
`sudo nginx -t && sudo systemctl reload nginx`. Verify with
`curl -k https://<vm>/retail-mcp/health`.

The public endpoint is intentionally unauthenticated for the workshop because
the VM's HTTPS boundary is the access control. Restrict the VM/network to the
lab audience and add an API gateway token before using this pattern outside a
controlled lab.
