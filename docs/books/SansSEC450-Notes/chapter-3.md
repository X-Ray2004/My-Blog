---
date: 2026-07-18
---
# Third Book

<!-- more -->

## Endpoint Attack Tactics


### User → Privilege?

* Service side and client side?

### Service Side:

* Port open → RDP, SMB
* Versions → CVE
* Patched & firewall & updates

### Client Side:

* Macros & mail phishing
* Presence [of attacker after initial compromise]

### Post-Exploit Tactics:

* EXE - Persistence - Priv[ilege escalation]

#### EXE (Execution):

* Command shell: Meterpreter - cmd → download files

#### Persistence:

* Backdoor? → [Bypass] AV or EDR → should [use] another signature

#### Shell [after execution]:

* Discovery → users & AD [Active Directory]
* Running services + app configs

#### Privilege Escalation:

* Misconfig[ured] files - features or services misconfig[ured]
* Hijacking startup items
* Modify service "——"
* Automated tools: PowerUp → [runs] in memory level
* Kernel exploit → Dirty Pipe [CVE-2022-0847]

#### Credential Access:

* Mimikatz → [dumps] memory passwords

### Lateral Movement:

1. Scan network → active connect to host & passive: not connect [active = direct connection attempts, passive = traffic inspection]
2. Vuln scan: unauth & auth
3. Patching [to close discovered holes]
4. Anti-exploit → awareness → EMET & Exploit Guard

---

## Endpoint Defense In Depth

### Enterprise E5 [Microsoft features]:

* **Credential Guard**: clean credentials from memory
* **LSASS** → isolate [prevents credential dumping]
* **Defender Guard** → [hardens Windows Defender]
* **Host firewall** → block [traffic] inside + save in logged
* **Antivirus** → signature + behavior detection
* **App control** → [by] name - hash - signature - path

#### App Control Bypass:

* `rundll32.exe` → DLL or LOLBin [Living Off the Land Binary]
* Code injection

### File Integrity Monitor → HIDS + HIPS

* Permission - owner - new files - file hash

### Catching Persistence:

* Scheduled task - browser extension - malicious services - autorun items
* **Prevent by**: free Sysinternals Autoruns tool

### PAWs [Privileged Access Workstations]:

* Separate user and admins

### Windows Permissions and Priv → AD [Active Directory]

### EDR [Endpoint Detection and Response]:

* Process - services - DLL - files - registry - network

### XDR [Extended Detection and Response]:

* Network data and more

### DLP [Data Loss Prevention]:

* Prevent move data or use USB or steal data → packet size → alerts

### UBA/UEBA [User Behavior Analytics]:

* Changed behavior of user → alerts

---

## Windows Event Logging

### Audit Policies and Logging:

* Records everything but get the VIP only [using] Event Viewer or Syslog

### Log Analysis:

* Channel → store logs → folders → XML format
* Event Viewer - Get-WinEvent (PowerShell)
* Windows Event Log service → Event Viewer
* Not all logs are stored → Windows Audit Policies
* **Sysmon** → more logs [System Monitor - Microsoft tool]

### Windows Log Breakdown:

* Level - Source - EventID - Task Categories

### PowerShell Event View Commands:

```powershell
Get-WinEvent -LogName Security | where {$_.Id -eq 4624}
```

### Security Mitigation (Kernel & User Mode): EMET [Enhanced Mitigation Experience Toolkit]

### Code Integrity/Operational

### AppLocker: (EXE, DLL, MSI, and script)

## Linux System Logging

### Linux Format: SYSLOG

* Plain text → journal service systemd
* No event ID
* Severity + Facility
* Port 514 → UDP sends logs [default, max] 1KB

### Syslog Format:

<priority>timestamp hostname process[pid]: message

### Syslog Daemon → rsyslog → sent to tools/server

* Formats: .csv - kv - JSON

### Priority Calculation:

`priority = facility * 8 + severity`

### System Journal → be similar to evtx [Windows Event Log]

journalctl -u ssh

### auditd → [logs] all system calls

bahs : aureport

## Understanding and Assessing Key System Events

### Windows Event IDs:

4624 : Login success

4625 : Login failure

4648 : Login by another user [run as → pivoting]

4688 : Process creation

4657 : Registry value modified

4663 : Object accessed

4697 : Service creation

4698 : Scheduled task creation

4720 : New user creation

4732/4728 : Group creation

4768 : Kerberos TGT requested

4769 : Kerberos service ticket requested

4770 : Kerberos ticket renewed

5156 : Connection allowed

5157 : Connection blocked

5152 : Packet blocked

5154 : Listening port

6416 : Plug and Play event (USB)

1116 : Windows Defender warning

### Login Types:

2 -> Normal (interactive)

3 -> Network (SMB)

5 -> Service

10 -> RDP

* **Account\$** → not important [machine account, not user]

### Linux Login Failures:

Bad Username: Dec 29 17:15:36 ubuntu sshd

[[14771]]

: Invalid user pi from 174.194.132.127Bad password over SSH: Dec 29 09:13:23 ubuntu sshd

[[54117]]

: Failed password for root from 174.194.132.127 port 55646 ssh2Bad password on desktop: Dec 29 09:19:19 ubuntu lightdm: pam\_unix(lightdm:auth): authentication failure; logname= uid=0 euid=0 tty=:0 ruser= rhost= user=student

### PAM [Pluggable Authentication Modules] in Linux

### Process Creation Logs:

* **Windows**: audit policy - sysmon - EDR
* **Linux**: snoopy - sysdig - auditbeat - auditd
* Details: path - name - hash - size - details

### Auditd Process Creation Rule:

auditctl -a exit,always -F arch=b64 -S execve -k proc\_create

### Snoopy → more detailed logs

### Windows Firewall Log:

* 5156: allowed connection
* 5157: connection block
* 5152: packet block
* 5154: listening
* Includes process info - 32MB limit - one per file

### iptables (Linux firewall)

### Syslog Header Components:

* Timestamp
* Policy?
* Interface IN/OUT
* IP Source/Dest
* Length
* Protocol (TCP, UDP, ICMP)
* Source/Dest Port

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/idOsnP2xfp7t_Khr0Eg20a0DKArB64CxXv3xK0fINRw=.png)

### Service Creation (Persistence):

* 4697 → enable auditing
* `tmp/shh` → not logical → malicious

### Scheduled Task (Persistence):

* 4698 → create scheduled task

### USB Plug and Play:

* 6416 → audit PnP activity → enable
* Vendor and product ID → normal USB or rubber ducky?

### Kerberos Authentication:

* 3 parts: clients - server - Key Distribution Center (domain controller)
* Authentication Service → [client] requests TGT
* Ticket Granting Service → checks ACL
* Go to service

### Old Package: NTLM

## Log Collection, Parsing, and Normalization

### Hosts → Log Aggregator → (parsing - indexing - searching/reporting - alerting)

### How?

Log source → push to SIEM (Splunk by Universal Forwarder) → third party or built-in OS as service (agent)

QRadar -> WinCollect

Third party -> NXLog, Fluentd, Snare

Windows built-in -> GPO-controlled WEF (Windows Event Forwarding)

Agentless -> PowerShell (not encrypted)

Linux -> rsyslog, syslog-ng, syslogd

Linux third party -> NXLog, NiFi, Fluentd

Linux agentless -> bash

### Unstructured Logs:

* Each device type has unique structure
* Parsing → regular expressions

### Structured Logs:

* Comma-separated values: `192.168.1.1,8.8.8.8,55001,53,udp`
* Key-value pairs: `var=value`
* JSON: easy parsing - least efficient

### SIEM-Centric Formats:

* **CEF** (Common Event Format): `time-data-source-data|...`
* **LEEF** (Log Event Extended Format - QRadar): syslog header - time - source name 0 version - log aggregator

### Why VIP? [Important because]:

* Parsing your log in have many details

### Log Enrichment and Correlation:

* Less data but get more details

### Log Field Normalization:

* Many formats for device type → Common Information Model → `source_ip`

### Categorization Example:

Search login → Windows 4625, Linux "started session" + "usr mike" + "process sshd", cloud logs, app logs → normalize to one category

### Log Storage:

* Old and misconfiguration → delete
* IPS → store [for] weeks - IDS → 1 month
* IoT → delete by period
* New logs → SSD → when get older → spinning disk (slow search) → archive → eventual deletion

### SIEM Engineer → data collection [responsibility]

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/m4sFIn18GT22fCdbRy1qbSkdmkzlNQ6TYW_flTf7E6k=.png)

## File Structure, Metadata, and Classification

### File Content - Hexdump:

25 50 44 46

* Magic bytes → signature in hex

### Identify File Methods:

* `file` command
* Magic bytes
* Sandbox

### Nested File:

* File inside file
* In middle of file hex, byte string tool → `PK` [ZIP signature]

### Polyglots:

* File as photo, if change some bytes → get another file

### Unicode (UTF):

* All signs of chars of languages
* ASCII is not all chars in world

### Strings Command:

* Anything printable
* `strings -n 6 .\app.exe` → [shows] what is above 6 readable chars
* `strings -e l` → what encoded as ASCII
* Get IOCs [from output]

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/9f38cd69-e0a6-43e8-833d-b9cae4d1bfe1/6K1Ma4sEXRA7GeJq09dfnvJ6Mg2_aKulDeo_1T_kk7w=.png)

## Detecting and Investigating Suspicious Files

### Handling and Investigating Suspicious Files:

* Malware analysis → VM (snapshot)
* Moving malicious (without removal by antivirus) → make it zip file with password "infected" and move

### Executable Extensions:

* MSI, MSP, CPL, AX, ACM, DRV, MUI
* .elf, .jar
* Could be scripts or Office [documents]

### Microsoft Office Docs:

* Macros (hidden)
* Binary format - XML format: .docx, .xlsx
* Block macros by default
* Rich Text Format: .rtf → magic byte → embedded file

### PDF Files:

* Embedded - JavaScript → autorun actions
* Strings command without opening

### PE [Portable Executable] → get hash

### Miscellaneous File (PNG, font, shortcut) or CVE:

* Reader has vulnerability
* Get hash and signature → strings

cmd : sigcheck -a -h -v .\\app.exe

* Analysis for signature - certificate
* Some malware take fake certificate
* Hash collision: like MD5 (weak) but appears safe

### Malicious Script → obfuscated → bypass

### C2 [Detection]:

* Search for PNG in another domain → download it and it makes encryption for the malware and payload
