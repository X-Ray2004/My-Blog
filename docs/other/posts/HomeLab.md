---
date: 2026-04-20
---
# Building a Security Monitoring Stack: Integrating Any Tool with Elasticsearch Using Docker

<!-- more -->

*A practical guide to connecting security tools like Suricata to Elasticsearch for unified monitoring*

> وما توفيقي إلا بالله :)

![](https://miro.medium.com/v2/resize:fit:875/0*1AQ0k_MN2f-PXJkf.jpg)

## The Universal Integration Pattern

After integrating multiple security tools (Suricata, Packetbeat, OSQuery, and more) into my Elasticsearch stack, I noticed a repeating pattern. Here’s the framework that works for almost any tool:

## The 5-Step Integration Recipe

```
1. Tool Container    → Generates security data
2. Log Storage       → Persists the data (Docker volume)
3. Filebeat Shipper  → Reads logs and ships to Elasticsearch
4. Elasticsearch     → Indexes and stores events
5. Kibana Discover   → Visualizes and analyzes data
```

Let’s break down each step.

## Step 1: Understanding Docker Networking

**The Foundation: Bridge Network**

Before connecting any tools, you need a shared network where all containers can communicate.

```
# docker-compose.yml
networks:
  security-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.19.0.0/16
```

**What this does:**

* Creates an isolated network for your security stack
* Assigns IPs automatically (172.19.0.2, 172.19.0.3, etc.)
* Containers can reach each other by name (e.g., `elasticsearch:9200`)
* Your monitoring tools can see each other’s traffic (important for network sensors!)

**Key Insight:** All your containers must be on the same network to communicate. This seems obvious but is the #1 issue I see beginners face.

## Step 2: Persistent Storage with Volumes

**The Problem:** Containers are ephemeral. When they restart, data is lost.

**The Solution:** Docker volumes provide persistent storage that survives container restarts.

```
volumes:
  elasticsearch-data:   # Stores your security events (critical!)
  suricata-logs:       # Stores Suricata's raw logs
  tool-logs:           # Generic pattern for any tool
```

**Volume Types You’ll Use:**

1. **Data Volumes** (for Elasticsearch):

* Stores indexed events
* Location: Docker manages this (usually `/var/lib/docker/volumes/`)
* **Critical:** Deleting this = losing all your data!

**2. Log Volumes** (for tools):

* Temporary storage for raw logs
* Filebeat reads from here
* Can be safely deleted (Elasticsearch has the data)

**Best Practice:** Always mount tool logs to a volume, even if you think you don’t need it. You’ll thank yourself during debugging.

## Step 3: The Tool Container — Common Patterns

Every security tool container needs:

## A. Basic Container Configuration

```
your-tool:
  image: vendor/tool:version
  container_name: descriptive-name
  networks:
    - security-net
  volumes:
    - tool-logs:/var/log/tool
  restart: unless-stopped
```

## B. Tool-Specific Configurations

Some tools need special permissions or network modes:

**Network Sensors (Suricata, Packetbeat):**

```
cap_add:
  - NET_ADMIN    # Modify network configuration
  - NET_RAW      # Access raw packets
network_mode: "container:target"  # Share another container's network
```

**Endpoint Agents (OSQuery):**

```
volumes:
  - ./config.conf:/etc/tool/config.conf:ro  # Mount configuration
  - tool-logs:/var/log/tool                 # Log output
command: ["tool", "--config", "/etc/tool/config.conf"]
```

## C. Critical Configuration Requirements

Your tool MUST:

1. **Write logs to a known location** (e.g., `/var/log/tool/events.log`)
2. **Use JSON format** (Elasticsearch’s native format)
3. **Include timestamps** in each event
4. **Flush logs immediately** (don’t buffer for too long)

**Example OSQuery Configuration:**

```
{
  "options": {
    "logger_path": "/var/log/osquery",
    "logger_plugin": "filesystem",
    "log_result_events": "true"
  }
}
```

## Step 4: Filebeat — The Universal Shipper

**Why Filebeat?**

* Lightweight (low resource usage)
* Guaranteed delivery (retries on failure)
* Handles backpressure (won’t overwhelm Elasticsearch)
* Works with any log file

## The Generic Filebeat Pattern

```
tool-filebeat:
  image: docker.elastic.co/beats/filebeat:8.15.0
  container_name: tool-filebeat
  user: root
  volumes:
    - tool-logs:/var/log/tool:ro    # Read-only mount!
  networks:
    - security-net
  command: >
    bash -c "
      cat > /usr/share/filebeat/filebeat.yml <<'EOF'
      filebeat.inputs:
        - type: log
          enabled: true
          paths:
            - /var/log/tool/*.log
          json.keys_under_root: true
          json.add_error_key: true
  
      output.elasticsearch:
        hosts: ['elasticsearch:9200']
        index: 'tool-events-%{+yyyy.MM.dd}'
  
      setup.ilm.enabled: false
      setup.template.enabled: false
      EOF
  
      filebeat -e
    "
  depends_on:
    - elasticsearch
  restart: unless-stopped
```

## Key Filebeat Settings Explained

**Input Configuration:**

```
paths:
  - /var/log/tool/*.log    # Where to find logs
```

```
json.keys_under_root: true  # Flatten JSON (important!)
# Without this:
#   {"message": {"timestamp": "...", "alert": "..."}}
# With this:
#   {"timestamp": "...", "alert": "..."}json.add_error_key: true    # Track parsing errors
```

**Output Configuration:**

```
hosts: ['elasticsearch:9200']           # Container name + port
index: 'tool-events-%{+yyyy.MM.dd}'    # Daily indices
# Creates: tool-events-2024.01.30, tool-events-2024.01.31, etc.
```

**Why daily indices?**

* Easier to delete old data
* Better query performance
* Simpler lifecycle management

## Step 5: Elasticsearch & Kibana Setup

**Elasticsearch (The Storage Engine):**

```
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.15.0
  container_name: elasticsearch
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false    # ⚠️ Dev only!
    - "ES_JAVA_OPTS=-Xms4g -Xmx4g"   # 4GB RAM
  ports:
    - "9200:9200"
  volumes:
    - elasticsearch-data:/usr/share/elasticsearch/data
  networks:
    - security-net
  restart: unless-stopped
```

**Important Notes:**

* `xpack.security.enabled=false` is for development only
* For production: Enable authentication, use HTTPS
* RAM allocation: Set to 50% of available memory (max 32GB)

**Kibana (The Interface):**

```
kibana:
  image: docker.elastic.co/kibana/kibana:8.15.0
  container_name: kibana
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  ports:
    - "5601:5601"
  networks:
    - security-net
  depends_on:
    - elasticsearch
  restart: unless-stopped
```

## Step 6: Kibana Data View & Discover Setup

This is where many people get stuck. Here’s the correct process:

## Creating a Data View

1. **Open Kibana:**[http://localhost:5601](http://localhost:5601/)
2. **Navigate:** Menu → Stack Management → Data Views
3. **Create Data View:**

```
Name: Tool Events
   Index pattern: tool-events-*
   Timestamp field: @timestamp
```

1. **Common Issues:Problem:** “No matching indices found”

```
# Check if data exists:
   curl http://localhost:9200/tool-events-*/_count
   
   # If count > 0 but Kibana doesn't see it:
   # Refresh the page and try again
```

**Problem:** “Could not locate time field”

```
Cause: Your logs don't have @timestamp field
   
   Solution: Add to Filebeat config:
     json.keys_under_root: true
     json.overwrite_keys: true
   
   Or add explicit timestamp processing
```

## Using Discover

**Select Data View:** Choose “Tool Events” from dropdown

**Set Time Range:**

* Top right corner
* Start with “Last 7 days”
* Adjust based on your data

**Add Useful Columns:**

```
Common columns for security tools:
   - @timestamp
   - event.type
   - source.ip
   - destination.ip
   - alert.signature (for IDS)
   - message
```

**Filter Data:**

```
KQL Examples:
   - event.type: "alert"
   - source.ip: "192.168.1.50"
   - alert.severity: "high"
   - message: *SQL*injection*
```

## Common Integration Challenges & Solutions

## Challenge 1: Timestamp Issues

**Problem:** Events appear at wrong time or Kibana shows “No results”

**Root Causes:**

1. Tool doesn’t include timestamp
2. Timestamp format not recognized
3. Timezone mismatch

**Solutions:**

```
# Filebeat: Add timestamp processing
processors:
  - timestamp:
      field: custom_timestamp
      target_field: "@timestamp"
      layouts:
        - '2006-01-02T15:04:05Z'
        - 'UNIX'
```

Or configure tool to use ISO 8601 format:

```
2024-01-30T15:23:45.123Z  ✅ Good
1706626425                ✅ Unix timestamp (also good)
30/01/2024 15:23:45       ❌ Ambiguous
```

## Challenge 2: Data Not Appearing

**Debugging Checklist:**

```
# 1. Check if tool is running
docker ps | grep tool-name
```

```
# 2. Check if logs are being written
docker exec tool-container ls -lh /var/log/tool/# 3. Check if Filebeat sees the logs
docker logs tool-filebeat | grep "Harvester started"# 4. Check if Elasticsearch received data
curl http://localhost:9200/tool-events-*/_count# 5. Check Filebeat registry
docker exec tool-filebeat cat /usr/share/filebeat/data/registry/filebeat/log.json
```

## Challenge 3: Container Communication Failures

**Problem:** Filebeat can’t reach Elasticsearch

**Common Causes:**

```
# ❌ Wrong: Using localhost
hosts: ['localhost:9200']
```

```
# ❌ Wrong: Using host IP in container
hosts: ['192.168.1.100:9200']# ✅ Correct: Using container name
hosts: ['elasticsearch:9200']
```

**How to verify connectivity:**

```
# From inside Filebeat container:
docker exec tool-filebeat curl http://elasticsearch:9200
```

```
# Should return Elasticsearch version info
```

## Real-World Example: Integrating Suricata IDS

Now let’s see the complete pattern in action with Suricata, a popular network intrusion detection system.

## Step 1: Suricata Container

```
suricata:
  image: jasonish/suricata:latest
  container_name: suricata-ids
  cap_add:
    - NET_ADMIN
    - NET_RAW
  network_mode: "container:target-container"
  volumes:
    - suricata-logs:/var/log/suricata
  restart: unless-stopped
```

**Key Points:**

* `cap_add`: Required for packet capture
* `network_mode`: Attaches to another container's network interface
* Logs written to: `/var/log/suricata/eve.json`

## Step 2: Suricata Filebeat

```
suricata-filebeat:
  image: docker.elastic.co/beats/filebeat:8.15.0
  container_name: suricata-filebeat
  user: root
  volumes:
    - suricata-logs:/var/log/suricata:ro
  networks:
    - security-net
  command: >
    bash -c "
      cat > /usr/share/filebeat/filebeat.yml <<'EOF'
      filebeat.inputs:
        - type: log
          enabled: true
          paths:
            - /var/log/suricata/eve.json
          json.keys_under_root: true
          json.add_error_key: true
          fields:
            log_type: suricata
            sensor: ids-001
          fields_under_root: true
  
      output.elasticsearch:
        hosts: ['elasticsearch:9200']
        index: 'suricata-%{+yyyy.MM.dd}'
  
      setup.ilm.enabled: false
      setup.template.enabled: false
  
      logging.level: info
      logging.to_stderr: true
      EOF
  
      filebeat -e
    "
  depends_on:
    - elasticsearch
  restart: unless-stopped
```

**Additional Fields Explained:**

```
fields:
  log_type: suricata    # Identify source
  sensor: ids-001       # Identify specific sensor
fields_under_root: true  # Don't nest under "fields"
```

## Step 3: Elasticsearch & Kibana (Same as before)

```
elasticsearch:
  # ... (same configuration as shown earlier)
```

```
kibana:
  # ... (same configuration as shown earlier)
```

## Step 4: Verification

**Check Suricata Logs:**

```
# View raw logs
docker exec suricata-ids tail -f /var/log/suricata/eve.json
```

```
# Should see JSON events like:
{
  "timestamp": "2024-01-30T15:23:45.123456+0000",
  "event_type": "alert",
  "src_ip": "192.168.1.50",
  "dest_ip": "172.19.0.5",
  "alert": {
    "signature": "ET EXPLOIT SQL Injection Attempt",
    "severity": 1
  }
}
```

**Check Filebeat Shipping:**

```
docker logs suricata-filebeat
```

```
# Look for:
# "Harvester started for file: /var/log/suricata/eve.json"
# "Non-zero metrics in the last period"
```

**Query Elasticsearch:**

```
# Count events
curl http://localhost:9200/suricata-*/_count
```

```
# Get sample event
curl http://localhost:9200/suricata-*/_search?size=1 | jq
```

## Step 5: Kibana Data View

**Create Data View:**

```
Name: Suricata IDS Events
Index pattern: suricata-*
Timestamp: @timestamp
```

**Essential Columns in Discover:**

* @timestamp
* event\_type
* src\_ip
* dest\_ip
* alert.signature
* alert.severity

**Useful Queries:**

```
# High severity alerts
alert.severity: 1
```

```
# Specific attack type
alert.signature: *SQL*injection*# Source IP
src_ip: "192.168.1.50"# Time range + filter
@timestamp >= "2024-01-30" AND event_type: "alert"
```

## Step 6: Results

After everything is running, you should see:

**In Elasticsearch:**

```
$ curl http://localhost:9200/suricata-*/_count
{"count": 45519}  # My actual results!
```

**In Kibana Discover:**

```
2,471 documents found
(showing events from last 7 days)
```

```
Sample event:
@timestamp: Jan 30, 2024 @ 19:05:29.622
src_ip: 172.19.0.8
dest_ip: 172.19.0.5
alert.signature: ET EXPLOIT SQL Injection SELECT FROM
alert.severity: 1
event_type: alert
```

## Troubleshooting Flowchart

```
Data not appearing in Kibana?
    │
    ├─> Is tool container running?
    │   └─> No: Check docker logs, fix configuration
    │   └─> Yes: Continue
    │
    ├─> Are logs being written?
    │   └─> docker exec tool ls -lh /var/log/tool/
    │   └─> No: Check tool configuration
    │   └─> Yes: Continue
    │
    ├─> Is Filebeat reading logs?
    │   └─> docker logs filebeat | grep "Harvester started"
    │   └─> No: Check paths, permissions
    │   └─> Yes: Continue
    │
    ├─> Is data in Elasticsearch?
    │   └─> curl http://localhost:9200/index-*/_count
    │   └─> No: Check Filebeat connection, credentials
    │   └─> Yes: Continue
    │
    └─> Data view configured correctly?
        └─> Check index pattern, timestamp field
        └─> Refresh field list
```

## Conclusion

Integrating security tools with Elasticsearch via Docker follows a consistent pattern:

1. **Network**: Shared bridge network for communication
2. **Volumes**: Persistent storage for data and logs
3. **Tool Container**: Generates security events
4. **Filebeat**: Ships logs reliably to Elasticsearch
5. **Data View**: Makes data visible in Kibana

Once you understand this pattern, you can integrate almost any security tool in 30–60 minutes.

> وبس كدا ان اصبت فهو من عند الله وان اخطأت فهو من نفسي والشيطان :)
