---
date: 2026-07-18
---
# Fourth Book

<!-- more -->


## Prioritizing Security Alerts

### Triage Questions:

* Is there a scan or data exfil?
* Decide what is first to investigate

### Critical Situations:

* Attack near completion → critical
* Service is stopped → critical
* Ransomware - data exfil - access assets - access admin
* Install [of malware] - C2 - objective from Cyber Kill Chain is critical

### Spotting Data Exfiltration:

* DNS tunneling
* Unusual traffic long connection
* CLI used and compress (7zip)
* Multiple port firewall denies outbound from single source
* DLP alerts
* UEBA alerts
* URLs with encoded data

### Spotting Data Destruction Attempt:

* Compromise of patching servers
* Compromise of high privilege accounts
* Unrecognized GPO changes
* Use of secure deletion or raw disk access
* `sdelete`, `cipher` (Windows)
* `shred`, `wipe`, `srm` (Linux)
* Known wiper family malware spotted

### Spotting Sensitive Hosts, Users, and Data:

* Critical sensitive → auto-updated review
* Enrichment → more details

### Targeted Attacks Identification Opportunities:

* Specific IOCs → APT
* New files → AV no signature → malware analysis
* Email → phishing
* Actions: zero day - lateral move

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/uMknu3OL-tvrAQ2PfJlV3DaFdPxlAftoIzAucc3tQJ0=.png)

### Alert Prioritization Factors:

* Persistence or not?
* Asset type: internal(2) external(4) server(1) desktop(3)?
* Assets: sensitive or normal in network?
* User compromise?: data access - user - admin

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/PQeYyOCQ-2Or1AdgGSwokB4igzagmGVEGzh5bcOyQig=.png)

### Unique Alerts:

* Suspicious → focus

### Lower Priority Alerts (don't get too excited about):

* External port scanning
* Most policy violations
* Failed logins (unless clearly excessive)
* Unauthorized access attempts
* "Malicious" IP address matches

**General rule:** If it happens all the time (scanning, policy), or by accident (failed login/access attempt), or involves low fidelity data (IP scanning) → do not prioritize

---

## Cognitive Processes in Digital Investigations

### Psychology of Intelligence Analysis:

* Less confident of you because lack of details and logs
* Bias toward a scenario
* See all sides of alert → all details
* Separate the task into small tasks and investigate
* Trees and mind map

---

## Conceptual Models for Cybersecurity Analysis

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/TDPwXMBCWe7cJP2_3WOcyhurkeXhQ6xB22icWsYs-Rk=.png)

### Encapsulation:

* OSI model attacks for all layers → decide where the attack is
* Files too

### OODA Loop:

* **Observe** (IOCs) → **Orient** (map this IOCs) → **Decide** (decide action) → **Act** (take action)

### Cyber Kill Chain:

* Decide what is the step to decide the priority and if you want to defend more for specific step

### Campaign Analysis:

1. Track all IOCs across incidents
2. Identify commonalities across multiple intrusion chains
3. Arrange actions from each actor into attack campaigns
4. Attribution may be a bonus
5. **Goal:** Define attacker TTPs and intent, disrupt with best courses of action

### Defense-in-Depth:

* **Prevent:** Stop all attacks possible before they can start
* **Detect:** Everything that bypasses the preventions (investigate)
* **Respond:** Quickly and decisively address the problem (action)

### NIST Framework:

**Identify : **Make your environment visible, monitored, defensible (make sure all tools defend)

**Prevent : **Controlled access to prevent incidents and reduce noise

**Detect : **Quickly identify incidents

**Respond : **Act immediately to contain the impact

**Recover : **Plan and test recovery capability

### Incident Response Cycle (PICERL):

1. **Prepare** → be ready
2. **Identify** → IOCs analysis
3. **Contain** → [stop spread]
4. **Eradicate** → remove
5. **Recover** → [restore operations]
6. **Monitor** → [watch for reinfection]
7. **Lessons learned** → [improve for next time]

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/41gBy_Dwwq27H0XYNzhrHFBAvxhgLAEgt864mk1iKP0=.png)

## Structured Analytical Approaches

### Levels of Threat Intel:

**Strategic -> **CEO/Executives -> Invest in security

**Operational -> **Senior responders -> Objectives of attackers

**Tactical -> **SOC analysts -> Analysis and escalation

### Intelligence Cycle:

1. **Direction** → goals and threats
2. **Collection** → [gather data]
3. **Processing** → [format & organize]
4. **Analysis** → weak points
5. **Dissemination** → tell seniors
6. **Feedback** → [improve cycle]

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/i2rqa-8j0s9HSveuJLuNUZ93Y5kv0qaDy0koOTSAgds=.png)

### F3EAD Cycle (IR and Threat Intel Loop):

**Find : **Identify threat and tool used

**Fix  : **Identify adversary on network

**Finish : **Action containment and recovery

**Exploit : **Gather all info to threat intel team

**Analyze : **Creating actionable intel, develop attack profile

**Disseminate : **Give info to interested parties, feedback to start

### Events → Threats → APT:

* **Event**: attacker + tool + victim
* Many events → **Threats**
* Many threats → **APT**

### Threat Intelligence Process Models:

**F3EAD : **Integrating threat intel with incident response, constant feedback

**Formal Intelligence Cycle : **Formal intelligence "products", be specific with scope

**Diamond Model : **Connecting incidents (no dedicated TI team), more specific than kill chain

### Attack Trees and Graph Thinking:

* Attacker has objectives
* Has many paths → takes easiest path (mindset of attacker)

### Threat Modeling:

* How can I defend myself well? → ask many questions
* Who is attacker? - What is defended? - What are possible threats?

### Pyramid of Pain:

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/noy5jeVqsnUVuS_rou_rHUGca-2HbfLfoPEAu3oGXhc=.png)

* [Harder for attacker at the top: TTPs > Tools > Network/Host Indicators > Domain/IP > Hash]

### MITRE ATT&CK:

* Techniques and tactics

### When to Use Each Model:

Triage: Which alert is most important? : Kill Chain, MAC

Incident Response: What do I do next? : Incident Response Process

What indicator to block? How to block? : Pyramid of Pain

Defense Strategy/Audit : Threat Models and Attack Trees

Hunt Team/Analytic Development : MITRE ATT&CK

Threat Intelligence : 3 levels, F3EAD

Operations Tempo : OODA Loop

### Perception Issue:

* **System 1** → fast [intuitive]
* **System 2** → slow but more details [analytical]

## Key Questions and Strategies for Deep Analysis

### Hypothesis:

* Reverse engineer your goal

### Structured Analysis Techniques - Hypothesis Generation Rules:

* No group think
* Long discussions
* If we have way to analysis (no judge it)
* Quantity leads to quality
* No self-imposed constraints
* Idea mixing
* Not the first idea heard should be true
* Brainstorm
* Hypothesis → not should be your idea true

### Confirmation Bias:

* Limits your mind in a zone
* If APT from X → proof it is APT and it is from that country
* Should proof it is wrong!

### ACH Mindset (Analysis of Competing Hypotheses):

1. Identify many hypotheses
2. List all evidence
3. Analyze evidence
4. Give strong proof and disprove the proof
5. Percentage the proofs

* Not should be daily, it's just lifestyle mindset

### Link Analysis:

* Maltego [tool]

### Event Matrix Chart:

* By days and months

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/TCV2Ms9Ob71cRZuFiRCvfGfF5au5XFadfwaiFfPs7Ds=.png)

### Track Investigations:

* CrowdStrike → Excel data should be analyzed

### Start Investigation Questions (rearrange your mind):

* **Phishing mail** → many hosts? - attachment? - guarantee? - clicked? - reached?
* **Authentication** → login - how many true?
* **Trojan** → what registries are changed?

### Host Logs → process

### NetFlow → metadata logs → proxy

### Beaconing → IP malicious

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/bj8gnJhNbwMZg5lVB7aXieXchuSE9T6aOOs3xFliETM=.png)

### Alternative Data Sources:

* AV → EDR
* Proxy active → passive
* IPS, DHCP

### OSINT:

* External IP - more info - APT? - IP abuse

### Extract Data → Interpretation:

#### Network Interactions - Assess each layer:

- Layer 3 (IP) : IP reputation - APT - who tries connections with this domain? Many? → APT → campaign
- Layer 4 (Port) : SSH on 80? → malicious. 8080, 8000? 4444 → Metasploit. 6667 → IRC. Any port not usual
- Layer 5 (TLS) : SNI field check? Missing fields in certificate? Authorized signature? Check JA3/JA3S hashes for bad values. Mismatch of cert data and DNS/IP/HTTP data may indicate domain masquerading or domain fronting
- Layer 7 (Application) : 1 - Metadata → SIEM Zeek, Suricata. 2 - C

### Email-Based Attack Methods:

* EXE file attachment
* Compressed file
* Macros
* Social engineering
* Read header carefully

### Assessing Links:

* Text file → redirect domain
* Spoof domain
* Clone for some pages
* Open redirect → another domain
* Hacked website (third party)
* Shadowing URL
* Can be safe host but bad download

### Shortened Links Investigation:

tinyurl : preview.tinyurl

[bit.ly](https://bit.ly/) : add `+` to end

[is.gd](https://is.gd/) : add `-` to end

[tiny.cc](https://tiny.cc/) : add `~` to end

### argeted or Not?

* Tracking clicks → proxy → tells if link safe or not, who clicked, what post, methods, hosts name

### BEC (Business Email Compromise) Attempt Emails:

* External mail - VPN service IP - apps added

## OPSEC for Analysts

* **Person (private)**
* **Attacker:** keep attack without noise
* **Analyst:** keep investigation hidden

### Intel Sharing (TLP - Traffic Light Protocol):

**White : **Anyone can see

**Green : **Attackers' IOCs known in community (attackers can't get this data)

**Amber : **Shared only with .org → just within company

**Red : **No sharing

### PAP (Permissible Action Protocol):

**White : **No restriction to use any IOC

**Green : **Active action with attacker IOCs

**Amber : **Passive action → hash in VirusTotal only

**Red : **No actions to any IOCs

### Passive Searching (Don't alert attacker):

* No direct upload of your malware to VirusTotal → attacker will know
* Take hash first
* Use history, not active action
* Use VPN/Tor

## Techniques for Identifying Intrusions

### Discovery Questions:

* How long have they been there?
* Nature of the intrusion?
* Risk present?
* TTP type?
* Dwell time?

### Intrusion Type:

* Specific item and run

### Persistence Access → Data Exfil

### Backdoor Types:

**Short term : **Frequent comms, easy to detect

**Long haul : **Change and persistent long → services - backdoor

### Attacker Objective:

* Infrastructure
* Tactical (DDoS)
* Strategic (persist in system: monitor)

### Business Risk:

* ICS equipment (cameras, domain controller)

### Knowledge About the Attacker:

* Know the level of attacker → choose a response
* Options: ignore - disrupt - engage - clean all - nuke from orbit (start from scratch)

### Reacting to Attacks:

**Opportunistic : **Random victims → easy to detect

**Targeted : **Collect all evidence - IOC blocking - try to know mindset of attacker

### Communication:

* Out mail to communicate with SOC team → not use sensitive
* Not block anything based on one hypothesis

## Finalizing Incident Reports and Quality Checks

### Good Documentation:

What is "good enough documentation" to your team?

* Are all observables documented?
* Is the event classified?
* Are all investigative questions sufficiently answered?
* Did you explain how the situation was remediated?
* Did you attempt to find all possible stages of attack from recon to objectives?
* Did you make sure no other hosts have the same problem? If so, did you link the cases for tracking?
* Were the steps you took documented well enough to be followed by someone else in the future?
* Did you provide feedback or new blocks/analytics to prevent this from happening again?

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/HFvjwDeTknW3-efYsK90X_zJ5YMMNJuMplU6QpK-eg0=.png)

### Closed Case Classification (Metrics worth collecting):

**Disposition : **True/false positive, indeterminate

**Incident Type : **Malware, Hacking, Insider Threat, etc.

**Time : **To detect (dwell), assign, contain, remediate

**Initial Detection Source : **FW, AV, IDS, external, etc.

**Device Types Affected : **User Laptop, Server, ICS, etc.

**Attribution/Motivation : **Group name/type, objective

**Summary : **Bullet point style executive summary

### Premortem Analysis:

* Fail in investigation → think on another side
* Overconfident → planning worse
* Critical thinking → more data

### "What If?" → impacts suggestions
