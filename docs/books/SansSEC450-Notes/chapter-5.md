---
date: 2026-07-18
---
# Fifth Book

<!-- more -->

## Enhancing SOC Operations

### Key Elements:

* Finally tuned process
* Full network visibility
* Good tools for accurate detection
* Diagrams - monitors
* Tuning for much false positive
* Enrichment for tools

### Feature Addition Through Enrichment:

* Domain rank
* Domain category
* Domain creation date
* "Have you seen that domain before?"
* Reputation - File/Domain
* GeoIP information
* Autonomous System Number
* Randomness measure
* Vulnerability information
* User context
* Filename and hash
* Field length
* Sources visiting same destination

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/GXwU_p4mwXcr3iDIA1kwSDMNaw6hFsEeN7M91WKNxEo=.png)

### Threat Intel (MISP):

* Matches for specific field value
* If exists in bad list → alert

### Matching of Multi-Attribute:

* **Positive feature** → add specific detail you want
* **False attribute** → info you don't want

---

## Enrichment Methods and Analytic Capabilities

### Metadata Pattern Based Analytics:

* Field count
* Age of domain
* Field content length
* Field content randomness

### Pattern Regular Expression:

\\w+@[^microsoft|gmail|yahoo]+.com

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/lF2npXpfxYG-eaOu9Mb82RH9zKhHd1vX_2NqCNUdBYQ=.png)

### Regex Tools:

* [regexer.com](https://regexer.com/)
* [regex101.com](https://regex101.com/)

### Rule Logic Types:

* Allowed/not allowed
* Threshold
* Field value sequence of events

### New Term Rules:

* Search for all previously seen values in X amount of time
* Load into a pseudo "allow list"
* Alert any time something happens that isn't on the list
* Add newly spotted items to the list
* **Effect:** Self-managing "allow list" without management overhead

### Sequence Based Rules:

* 10 failed then 1 success
* Overspecific → false negative!

### Sigma Rules:

* Share across all tools and systems
* YAML format
* Metadata - log source - detection + condition

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/U4UTC32ifITDJ1-VI0QiMvcdTHyvgnOL_O798owEdkE=.png)

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/E1jj65y5kXJiebF7lvgTSDNBepcooUI0PZ6zef2jB94=.png)

### MISP supports Sigma rules

---

## Developing & Validating New Detection Logic / Reducing False Positives

### Tuning Rules:

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/0IUdQu7fv2cNjwkGfh31hyShDUuzRc6NuDNNd3kyjCY=.png)

### Taming Alerts:

* Disable unimportant rules
* Policies get true positive
* Tune default rules (down from default) or build from scratch (up from zero)

### Types of Alerts Analysts Hate Most:

**Low fidelity : **Cannot identify the condition uniquely

**Low priority : **Minor issues that waste your time

**Not actionable : **No clear reason to alert on that event

**High volume : **Right or wrong, it's overwhelming

> Only if we can't fix the true cause should we "band-aid" it

### Pareto Distribution:

* 80% legit alerts from PT activity → exclude IP

## Security Automation & Workflow Orchestration

### What is SOAR?

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/Tp1_6Kr5jnUXE0GILQ_jKSg4GPhhnspgdgzgiKXYn1g=.png)

### Typical Categories for SOAR:

**Enumeration & Enrichment : **IP/Hostname/Hash lookup via internal tool APIs or external data

**Incident Response : **[Automated actions]

**Blocking actions : **[Containment]

**Sample gathering : **[Collect malware]

**Cleanup : **[Remove persistence]

**Alert and case management : **[Create/update tickets]

### Enrichment and Enumeration (SOAR performing info lookups):

* Utilize local tools, external APIs, or perform the lookup
* Reputation checks: IP, domain, URL, hash
* Threat intelligence matches
* Send file samples to sandbox
* User attribute resolution (name, position, groups)
* Device info resolution (network scan, vulnerabilities)
* SIEM search

### Response: Blocking Actions

* Great for containment stage
* Must be used with care
* Examples:
* C2 to malicious domain → Push proxy block
* Callback to IP address → Push local/network block
* Virus infection → Push host isolation, user lock script
* Spam email wave → Push rule to block incoming mail

### Response: Sample and Info Gathering

* Grabbing virus samples/performing hash lookup
* Unlikely to disturb machine, can fully orchestrate after detection

### Forensics Tasks via SOAR:

* Memory images
* Registry snapshots
* Running processes/services
* Netstat
* DNS cache
* Windows log download

### Kansa:

* PowerShell-based incident response framework
* Written by Dave Hull ([https://github.com/davehull/Kansa](https://github.com/davehull/Kansa))
* Modular scripts run remotely via SOAR orchestration
* Returns information in well-formatted PowerShell objects
* Modules for: Netstat, autoruns, DNS cache, ARP, processes, services, users, prefetch, userassist, WMI, handles, and other advanced data

### Alert and Case Management:

**Input : **Creating new alerts in IMS from tool/SIEM alerts. All custom fields filled out for you

**Investigation : **Enrichment of host, user, and attacker data. Adding observables to cases (pushed from TIP when new observables found)

**Output : **Taking action based on closure codes: Re-image ticket, removal of observable from threat intel

### Micro-Automation:

* Search engine → edit site search
* Threat analytical search - cache

## Handling and Restricting Active Intrusions

### Containment:

* Trust for Tier 1? → well detect + analysis

### Consider the Network Stack:

**Physical : **Find and unplug device (which location? which port? which switch?)

**Link : **Disable switch port. Use isolated VLANs. Easy way to securely contain infected machine: Disable switch port → Move into isolated VLAN → Create DHCP reservation for MAC as non-routable IP. Use port security - strong protocols

**Network : **Block the IP/Domain (C2 domain or IP → get attack source → not just blocking)

**Transport : **Block a port or other transport item (firewall - ACLs - WAF)

**Application : **Stop a specific protocol or items within it. Which is most appropriate depends on situation

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/Pc1hlNvJVJoY5-XZSJlIZgSIMflNTTcixArTTlYdtrA=.png)

### Response Policy Zone (RPZ):

* Fake response (FakeNet tool - fake connection)

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/E_MinAS9VCeQ4r7Jqm0sIfhI3rKm_O-fB9-_HGzB8PA=.png)

### Dynamic DNS Sites:

* Map any IP to a hostname without personal info or purchasing a domain name
* Deny all DynDNS

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/JaDfwBz8dSM41UU5CCuqmYi2jSF0OKtOOGGuK-cvDmo=.png)

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/f13fa934-3a1b-4fb9-a6cb-882730ea5461/-Br-TYHaAHmjWaPZOTj47Z96nhjkw0MvtUNPtb9ILh8=.png)
