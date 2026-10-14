---
date: 2026-10-14
---
# Linux Soc Investigation : How Can YOu rEach Host From The Container

<!-- more -->

[🇪🇬 اقرأ بالعربي](../ArchonCTF-ar.md){ .md-button }

Archon Vanguard CTF

> بسم الله :)

## A New Case in Cyber Security

Most of us as SOC analysts look first for investigations on Windows, AD, and so on, because that’s the common stuff.. but what we’re sure of is that a good number of servers are Linux-based.

I’m not messing around, I swear to God, I’m being honest with you: I hadn’t read or known anything about Linux scenarios before, and for a while I’d been looking for good scenarios that cover most of the Cyber Kill Chain.

A couple of days ago I took part in a SOC Investigation CTF by Archon Vanguard, and it was really, really close to real life, even closer than the lab platforms.

The challenge was Linux, I learned a lot from it, and I wanted to share the scenario with you.

To be honest, I used AI for some of the information in the solution, because like I said, I don’t know anything about Linux.

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*vyiVitpa9iCoMI2Mg6NjxQ.png)

Sorry for the long intro, bismillah, and the challenge said:

```
Alert Source: Wazuh
Severity: HIGH
Time: September 22, 2026 — 07:14:50 UTC
Alert Message:
Multiple suspicious Linux account and command events observed.
The alert is only the starting point. Your job is to uncover the full incident using the available logs.
```

And the challenge’s investigation report was solved with these sections:

* Incident Identification
* Executive Summary
* Initial Detection
* Attack Timeline
* Attack Chain Analysis
* Technical Investigation
* Affected Assets & Scope
* Indicators of Compromise
* MITRE ATT&CK Mapping
* Decoy / Benign Activity Assessment
* Root Cause Analysis
* Impact Assessment
* Containment, Eradication & Recovery
* Detection Gaps & Recommendations
* Final Assessment

But we’ll walk through the mindset of the solution normally, and at the end we’ll see what we’re missing.

If we go into the challenge, we’ll find a map of all the machines in the network.

## Analyzing the Alert

First thing, we analyze the alert, and under each line we write its explanation.

## Alert Source: Wazuh

Wazuh is a SIEM + HIDS system.

* **SIEM:** collects logs from all devices and analyzes them.
* **HIDS:** monitors each device on its own (files, accounts, processes).

And in the map you’ll find WAZUH-MGR-01, which is the Wazuh agent.

## Severity: HIGH

## Time: September 22, 2026–07:14:50 UTC

This is the first important thing we have, so we can start defining the scope.

## Alert Message

> *Multiple suspicious Linux account and command events observed.*

Meaning accounts were changed (useradd, usermod, group\_add) and commands were executed — or at least, that’s the expected reason for the alert.

> *The alert is only the starting point. Your job is to uncover the full incident using the available logs.*

There are no other IOCs, so we start with what we have and look at the logs within the time scope we’ve got.

![](https://miro.medium.com/v2/1*wdPVIgFgx63voYc7vJA88Q.png)

Of course the challenge made it clear that there are a lot of noisy logs, so we’ll surely find plenty of logs that look suspicious, but we’ll go to the five minutes around the alert first and understand what the SIEM saw to fire the alert, before anything else, and then we continue.

You’ll find tons of logs that look like this:

![](https://miro.medium.com/v2/1*9gw0ae4eG1lT7KorcDoHzA.png)

But if you focus, you’ll notice the src ip is 0.0.0.0, and that happens when the commands are run on the same machine, so that’s not our problem right now. We’re not going to read 100 thousand logs, we’ll look at what matters and ignore these for now.

## The First Logical and Suspicious Log (Minute 14)

With the first logical log you’ll run into at minute 14, which is suspicious, we start to understand and collect IOCs.

![](https://miro.medium.com/v2/1*9ewVMMQgIoesmO0k8zFktQ.png)

* The host is named **“JUMP-01 Bastion”** and its IP is the dst\_ip `10.20.40.10`
* The one that collected the log: **auditd**, which is a Linux logging system that records everything related to syscalls
* The event **EXECVE** is a command execution (syscall)
* **user: deploy** — the user who ran it.
* **process: sudo** — the command that was used.
* **parent\_process: sshd** — the parent, meaning the process was executed from an SSH session.
* **src\_ip: 10.20.20.10** = we don’t know it
* **dst\_ip: 10.20.40.10** = JUMP-01.
* **command:**`sudo usermod -aG sudo svc_sync` — adds the user svc\_sync to sudo.
* **msg:** same command.

We now have the two most important IOCs that we need to understand:

1. Who is the src host? Because the IP is clearly internal — it could be someone from IT.
2. What is this user, and what’s its story? Because its name is strange, and what happened after that on this host.

## First: Searching for the IP `10.20.20.10`

![](https://miro.medium.com/v2/1*HfzGrqvwcLllMKB1G7fLwQ.png)

You’ll find that it’s **DOCKER-01** (we’re not dealing with its logs because they’re outside the time scope).

OK, so it could be legit and it could be not.

What else? (Let’s try not to expand for no reason — we finish what’s in our hands and settle for now with knowing the host’s name.)

## Second: Searching for what this user `svc_sync` did

We search for it, and four logs come up, so let’s start understanding.

![](https://miro.medium.com/v2/1*racgym2PtDi8NSWTNOVGGw.png)

![](https://miro.medium.com/v2/1*k2U-yJYO1WCO-3jvjPjDFA.png)

We’ve already analyzed the first log, so let’s look at the rest.

### The second log I have

```
{
  "time": "2026-09-22 07:14:04.000 UTC",
  "host": "JUMP-01 Bastion",
  "source": "auth.log",
  "severity": "INFO",
  "event": "USER_CREATE",
  "user": "root",
  "process": "useradd",
  "src_ip": "10.20.20.10",
  "dst_ip": "10.20.40.10",
  "action": "create_account",
  "status": "success",
  "program": "useradd",
  "msg": "useradd: new user: name=svc_sync, UID=1042, GID=1042, home=/opt/svc_sync, shell=/bin/bash"
}
```

* **USER\_CREATE:** event = user creation.
* **user: root** — ran the command as root.
* **process: useradd** — the tool.
* **dst\_ip:** JUMP

So useradd means it’s adding user 1042, a regular user (when the UID on Linux is above 1000, it’s a regular user, not an admin).

Now where? `home=/opt/svc_sync, shell=/bin/bash` — what brought it to opt? Users normally live in `/home`.

This is the first thing proving the matter is suspicious.

Second thing: how is it creating a new user when, in the previous log, it was adding it to a group (meaning it should already exist in order to add it)??

The thing is, the syscall logging system called auditd doesn’t record outcomes (meaning whether the command succeeded or not), so let’s move to the third log, maybe we’ll understand.

### The third log

```
{
  "time": "2026-09-22 07:14:08.000 UTC",
  "host": "JUMP-01 Bastion",
  "source": "auditd",
  "severity": "INFO",
  "event": "GROUP_CHANGE",
  "user": "root",
  "process": "usermod",
  "parent_process": "sudo",
  "command": "usermod -aG sudo svc_sync",
  "program": "usermod",
  "msg": "group membership changed: svc_sync -> sudo"
}
```

Meaning, it moved the user we just created into sudo.

So why would it do that, unless the first log never actually worked? Meaning the very first command didn’t work at all.

The explanation I wrote was that this is something that isn’t clear, but the attacker most likely made a mistake, nothing more.

### The fourth log

```
{
  "time": "2026-09-22 07:15:02.000 UTC",
  "host": "JUMP-01 Bastion",
  "source": "auth.log",
  "event": "SSH_SUCCESS",
  "user": "svc_sync",
  "process": "sshd",
  "src_ip": "203.0.113.120",
  "src_port": "51112",
  "dst_ip": "10.20.40.10",
  "dst_port": "22",
  "msg": "sshd: Accepted publickey for svc_sync from 203.0.113.120 port 51112 ssh2"
}
```

* **src\_ip: 203.0.113.120** → IOC, external IP
* **dst\_ip / dst\_port:** JUMP

The msg says there was an SSH connection on port 51112 from an external IP using a publickey.

Of course, a user gets created just now and then a connection comes in from an external IP — that proves the whole thing is suspicious.

Of course you’d put the IP on CTI, but it came back clean, and that makes sense since this is just a simulated attack for a challenge, not a real one.

## The Current IOCs

We now have 2 important IPs as IOCs, and we need to understand what’s around them:

1. `10.20.20.10`, which the user creation started from, and we found out it's DOCKER-01
2. `203.0.113.120`, which we started to suspect because a connection came in from it to the user that was created

And let’s also search JUMP, to see the logs on it and how the sequence goes.

## Starting with JUMP-01 (`10.20.40.10`)

We start with `10.20.40.10` and take it as the src ip, to understand how the attacker reached it in the first place, and we search within the same scope of the alert, in minutes 14–15 (especially before the time the user was created, to understand what happened before it, but without leaving the scope).

You’ll find lots of logs, but if we focus on the scope

![](https://miro.medium.com/v2/1*ga_an40hYO5cjw0uWBRa7w.png)

![](https://miro.medium.com/v2/1*v0O2br6j0cjh4WAbzJOrdw.png)

![](https://miro.medium.com/v2/1*YxgFH1KvLyd6b2NdFBsvaQ.png)

![](https://miro.medium.com/v2/1*wFV9XQTwXCA4xSfGp2dAeg.png)

![](https://miro.medium.com/v2/1*ga_an40hYO5cjw0uWBRa7w.png)

right before the user creation.

Logically, the DOCKER-01 machine would create the connection first and it did succeed, so then how did it create the user after that?

After that come the user creation logs that we already explained.

![](https://miro.medium.com/v2/1*0UVbQdfrTsh_DRnkvqBK9A.png)

After that, we’ll find a few important ones right after the new user was created.

## The first log: service creation

```
{
  "time": "2026-09-22 07:14:13.000 UTC",
  "host": "JUMP-01 Bastion",
  "source": "journal",
  "severity": "UNIT_CREATED",
  "event": "INFO",
  "user": "root",
  "process": "systemctl",
  "src_ip": "0.0.0.0",
  "dst_ip": "10.20.40.10",
  "facility": "syslog",
  "action": "install",
  "status": "success",
  "service": "system-update.service",
  "command": "systemctl enable system-update.service",
  "program": "systemctl",
  "msg": "Created symlink /etc/systemd/system/multi-user.target.wants/system-update.service"
}
```

* **src\_ip: 0.0.0.0** → means the command ran on the same machine
* **dst\_ip: 10.20.40.10** → JUMP-01

And Created symlink means: make me a service named system-update.service and put it in `/etc/systemd/system`.

## The second log: writing the service file

```
{
  "time": "2026-09-22 07:14:16.000 UTC",
  "host": "JUMP-01 Bastion",
  "source": "auditd",
  "severity": "INFO",
  "event": "FILE_WRITE",
  "user": "root",
  "process": "bash",
  "src_ip": "0.0.0.0",
  "dst_ip": "10.20.40.10",
  "facility": "security",
  "action": "write",
  "status": "success",
  "command": "cat > /etc/systemd/system/system-update.service",
  "program": "bash",
  "msg": "type=PATH name=/etc/systemd/system/system-update.service"
}
```

The service file was written.

So Reem, could it be a normal service? No, normal system services live in the `/lib/systemd/system/` path.

So Reem, could it be an admin who created a service? Maybe.. possible.

A few seconds later..

## The third log: DNS Query

```
{
  "time": "2026-09-22 07:14:28.000 UTC",
  "host": "JUMP-01 Bastion",
  "source": "dns",
  "severity": "INFO",
  "event": "DNS_QUERY",
  "user": "unknown",
  "process": "systemd-resolved",
  "src_ip": "10.20.40.10",
  "dst_ip": "10.20.40.53",
  "dst_port": "53",
  "facility": "network",
  "action": "query",
  "status": "NOERROR",
  "query": "cdn-sync-update.com",
  "program": "systemd-resolved",
  "protocol": "udp",
  "msg": "query cdn-sync-update.com A 10.20.40.53"
}
```

* **src\_ip: 10.20.40.10** = JUMP-01, which we already know
* **dst\_ip: 10.20.40.53** who’s this?
* **status: NOERROR** completed successfully

The log says JUMP-01 sent a DNS query for cdn-sync-update.com to 10.20.40.53.

We search the link it reached out to on VT

![](https://miro.medium.com/v2/1*RvveWJDY-Z53i7eRGwbaKg.png)

for example, and found nothing, which is normal like we said because it’s a simulation, but this is what should be done in real life, and if it came back malicious we’d do containment immediately.

So who’s `10.20.40.53`? We search it as if it were a src ip to understand (it's internal, meaning it's with us in the company, so we can find out who this is).

![](https://miro.medium.com/v2/1*Z3Iz8pd_B7JKj40xx1ghzQ.png)

Exactly, it's the company's DNS server (we're not dealing with its logs, focus on the time, God bless you).

So we have `cdn-sync-update.com` as an IOC for sure, so when we try searching for it in the SIEM, we can find out whether other devices reached out to this URL, and do containment for them if it's confirmed malicious.

## Searching for `203.0.113.120`

We had another IOC, remember? The external IP. We search for it `203.0.113.120`

![](https://miro.medium.com/v2/1*HLKK_WgB8EJA5nd6g3CWVg.png)

and 3 logs came up, let's look at them.

## The first log: Zeek

```
{
  "time": "2026-09-22 07:14:34.000 UTC",
  "host": "JUMP-01 Bastion",
  "source": "zeek",
  "severity": "INFO",
  "event": "CONN",
  "user": "unknown",
  "process": "systemd",
  "src_ip": "10.20.40.10",
  "src_port": "43512",
  "dst_ip": "203.0.113.120",
  "dst_port": "443",
  "facility": "network",
  "action": "connection",
  "status": "SF",
  "protocol": "tcp",
  "msg": "service=https tls=sni=cnd-sync-update.com"
}
```

* **source: zeek** — a network monitoring tool.
* **event: CONN** — event = network connection.
* **process: systemd** — the system and service manager on Linux
* **src\_ip: 10.20.40.10** — JUMP-01.
* **dst\_ip: 203.0.113.120** — external
* **dst\_port: 443** — HTTPS.
* **status: SF** — Success + Finished

The log says it opened a TLS connection with cnd-sync-update.com. Yes, exactly, it’s the same one we had above, and it used systemd to reach out to the C2.

It used the company’s DNS, then went out publicly to the IP.

## The second log: Firewall

So what’s another log?

```
{
  "time": "2026-09-22 07:14:42.000 UTC",
  "host": "JUMP-01 Bastion",
  "source": "firewall",
  "event": "FLOW",
  "process": "nftables",
  "src_ip": "10.20.40.10",
  "src_port": "43512",
  "dst_ip": "203.0.113.120",
  "dst_port": "443",
  "action": "accept",
  "protocol": "tcp",
  "msg": "nftables: accept outbound tcp to 203.0.113.120:443"
}
```

* **nftables:** a firewall tool in Linux.

The firewall approved the C2 attack connection.

## The third log

And the third log was

![](https://miro.medium.com/v2/1*hb88vAGFeHuK06MQ9-e1Cg.png)

yes exactly, the one we saw at the very beginning with the new user.

## A New Question: Where Did It Get the Public Key From?

But there’s a new question here: so we’re now sure that what’s happening is most likely an attack (not 100% sure because there’s no clear reputation for the IOCs).

When the attacker is external, where did he get the public key from to make the connection? (Yes, a public key is public to everyone, but only within the internal network.)

Remember at the very beginning, what was the src ip in the first log?

It was `10.20.20.10`, we searched for it and it turned out to be DOCKER-01.

Let’s search it again to understand more this time? Within the time scope again, meaning five minutes before and after.

So we continue searching, say, from before the time of the connection on the JUMP machine, the one around minute 13 that we had at the beginning, the one with the public key

![](https://miro.medium.com/v2/1*4ad0iWdQhjAZHgPlpA4_tg.png)

that’s this log. We start from here and see the logs before it, what happened, one by one.

I’ll write just the messages of the logs for you:

```
"msg": "query packages.ubuntu.com A 10.20.40.53"
"msg": "audit: write /var/lib/app/config.json"
"msg": "container create name=debugger image=alpine:3.20"
"msg": "Notice A Privileged Container Was Started"
"msg": "Notice container mounted host filesystem"
"msg": "type=EXECVE nsenter -t 1 -m -u -i -n -p /bin/bash"
"msg": "type=PATH name=/etc/shadow"
```

So the first one is:

`"msg": "query packages.ubuntu.com A 10.20.40.53"`

And this is legit, it’s checking for updates and the site is a genuine one, so this is outside the scope we’re suspicious of, let’s see what comes after.

So what’s next? Should I lie to you? I put them in Gemini because I don’t have much experience in Docker and Linux. Check out what it said:

![](https://miro.medium.com/v2/1*PGSdoTtqBtlcVXGpxYTjGw.png)

Now check out what it said at the end :))

![](https://miro.medium.com/v2/1*eJFhZZs6VBlq7bNtmt9JyQ.png)

And right after that comes the connection log, remember it?

So how about we understand this technique more?

## Explaining the Technique (Container Escape)

`"msg": "audit: write /var/lib/app/config.json"`

Why would a regular user modify or write a configuration file?

`"msg": "container create name=debugger image=alpine:3.20"`

And then creating a container named debugger, isn’t that a bit strange?

`"msg": "Notice A Privileged Container Was Started"`

And it made it privileged, meaning basically root, in short.

`"msg": "Notice container mounted host filesystem"`

And it did a mount, meaning taking control of the host machine’s main file system itself!

`"msg": "type=EXECVE nsenter -t 1 -m -u -i -n -p /bin/bash"`

* `-t 1` means the target process is PID 1, meaning one of the root processes
* `-m` means it gets access to the namespace, which is responsible for distributing the virtual address space of processes on the host itself, meaning it sees everything on the host and beyond the host, literally, meaning access to memory and everything, in short
* `-n` means it accesses the network stack, meaning the machine's main network
* `-p` means it sees all the processes literally present on the host
* `/bin/bash` means the Terminal Shell, which is the only one we know

`"msg": "type=PATH name=/etc/shadow"`

Of course it’s accessing the file that holds the password hashes of all users.

The technique is number **T1611** on MITRE.

And the tool that detected these logs was Falco, a tool for monitoring container networks on Docker.

And of course here we found out where it got the public key from, and everything in general, because he’d already reached the memory through the namespaces operation.

## So How Did It Get Into Docker?

OK, but how did it get into Docker anyway?

Who’s the user who ran these commands? You’ll find that after the container was created, the user in the logs is named root, but who was the user at the time the container was created?

![](https://miro.medium.com/v2/1*mgl1BCnYoOGPPGd3fvDFaA.png)

www-data. Can we search for it and maybe get somewhere?

![](https://miro.medium.com/v2/1*GNysw5Qo9lvQv21knvyP_w.png)

I’d barely gotten the time scope when I found `worker.py`, oh my.. why is there a hidden Python script?

Hidden how, how did you know?

```
"msg": "type=EXECVE python3 /tmp/.cache/worker.py"
```

`.cache` is the hidden cache folder in Linux, and the dot means the file is hidden.

So why would someone hide a script there?

```
{
  "time": "2026-09-22 07:13:13.000 UTC",
  "host": "WEB-01 Ubuntu 24.04",
  "source": "auditd",
  "severity": "INFO",
  "event": "FILE_WRITE",
  "user": "www-data",
  "process": "python3",
  "parent_process": "nginx",
  "src_ip": "0.0.0.0",
  "dst_ip": "10.20.10.20",
  "facility": "security",
  "action": "write",
  "status": "success",
  "command": "open(/var/www/html/uploads/.cache/health.php,O_CREAT|O_WRONLY)",
  "program": "python3",
  "msg": "type=PATH item=/var/www/html/uploads/.cache/health.php"
}
```

* **event: FILE\_WRITE** — write a file
* **process: python3** — a Python script
* **parent\_process: nginx** — the web server that did this (the container)
* **dst\_ip: 10.20.10.20** — a new host we’ll search for later
* **status: success** — it worked

And `health.php,O_CREAT|O_WRONLY` means create me a file named health.php and open it to write in it.

`/var/www/html/uploads/.cache/health.php` and this is the path inside the hidden cache folder.

Here we confirmed that this is a clear attack, so we do containment for all the hosts we’ve gone through so far (if we’re talking real life and didn’t find a reputation for anything).

## Searching for the Host `10.20.10.20`

So is there anything else? Let’s search for the host, maybe we’ll understand? `10.20.10.20`

Before the worker.py log above, I found a log.

The IP `203.0.113.77` made a request to download a program of 18433 bytes, meaning 18 KB, which is a fairly big request, enough for a script, and it downloaded it through a Python script.

But right after it, I found:

```
{
  "time": "2026-09-22 07:13:23.000 UTC",
  "host": "WEB-01 Ubuntu 24.04",
  "source": "zeek",
  "severity": "INFO",
  "event": "HTTP",
  "user": "unknown",
  "process": "systemd",
  "src_ip": "203.0.113.77",
  "src_port": "50102",
  "dst_ip": "10.20.10.20",
  "dst_port": "443",
  "facility": "network",
  "action": "http",
  "status": "200",
  "uri": "/uploads/.cache/health.php?cmd=id",
  "http_method": "GET",
  "http_status": "200",
  "protocol": "tcp",
  "msg": "method=GET host=web01 uri=/uploads/.cache/health.php?cmd=id status=200"
}
```

* **src\_ip: 203.0.113.77** — the new external IP

In short, the attacker here uploaded the PHP file in the uploads folder inside the hidden cache, and ran it with cmd.

And the log before it, and the last logical log we have, is:

![](https://miro.medium.com/v2/1*aTJ4XimJlcAlCOo-oou9qg.png)

he was able to make a connection over HTTPS and it worked.

## The Last IOC: `203.0.113.77`

Only the last IOC remains so that we’ve done our part, we search for `203.0.113.77`.

We found access attempts on the company’s network devices, but all of them are very old attempts, so it’s clearly noise.

And that’s it, the line is closed after we searched everything.

## So What Does the Attack Timeline Look Like After All This Wandering?

## 07:13:04 Attacker connects to WEB-01

The attacker (address 203.0.113.77) opened an HTTPS connection with the WEB-01 server, which is 10.20.10.20, on port 443. This is the first connection in the chain, and it’s what started everything. Nothing wrong yet, just a normal connection from the outside.

## 07:13:08 Malicious file uploaded via /api/v1/upload

Then the attacker sent a POST request to the path /api/v1/upload, which means he uploaded a file. The file size is 18,433 bytes, and his User-Agent is python-requests/2.31.0, meaning it’s not a normal browser, it’s a program running automatically. The response was 200, meaning the upload succeeded. This is the first indicator of exploiting a vulnerability in the file upload feature.

## 07:13:11 worker.py executed

3 seconds after the upload, nginx (the web server) ran a file named worker.py located in /tmp/.cache/. This isn’t normal because nginx usually doesn’t run Python directly. This means the uploaded file made nginx execute code.

## 07:13:13 Web Shell created (health.php)

And worker.py (which ran) wrote a new file named health.php in the path /var/www/html/uploads/.cache/. Notice that it’s in a hidden .cache folder inside the uploads folder, which is not a normal place for PHP files. This file is the Web Shell that will let the attacker execute commands.

## 07:13:19 id command executed via the Web Shell

Then the attacker requested the file health.php with a parameter named cmd=id. This means he wants to run the id command on the server. The response was 200 with a size of 512 bytes, meaning the command was executed and returned a result. This confirms that the Web Shell works.

## 07:13:30 Privileged Docker container created on DOCKER-01

Here, on another machine named DOCKER-01, the user www-data (the same one that was on WEB-01) created a Docker container named debugger using the image alpine:3.20. The command was: docker run -d — privileged -v /:/host alpine:3.20. The word — privileged means this container has full privileges, and -v /:/host means the original machine’s (host’s) file system is mounted inside the container.

## 07:13:35 Host file system mount detected

The Falco tool also detected that the container mounted the host’s file system. The command executed inside the container was mount -t proc proc /host/proc, which means it’s preparing to get into the host.

## 07:13:40 Container escape via nsenter

Then the attacker used the nsenter command to enter the namespaces of process number 1 (PID 1) on the host. The command: nsenter -t 1 -m -u -i -n -p /bin/bash. This means he got out of the container and into the original machine itself. He now has a shell on the host.

## 07:13:45 /etc/shadow read

After escaping the container, the attacker read the file /etc/shadow, which contains the hashed passwords of all users on the machine. This is a big risk because anyone who gets this file can crack the hashes later.

## 07:13:56 Successful SSH as user deploy to JUMP-01

After that the attacker got into a third machine named JUMP-01 (which is the bastion — the entry gate to the network) using an account named deploy. The login came from the DOCKER-01 address (10.20.20.10) using an SSH key (publickey). This means he was able to move laterally from DOCKER-01 to the bastion.

## 07:14:01 usermod attempt (failed)

The attacker (with the deploy account) tried to run the command sudo usermod -aG sudo svc\_sync to add a user named svc\_sync to the sudo group. But the attempt failed because the user svc\_sync hadn’t been created yet. We know it failed because there’s no GROUP\_CHANGE event at that time, and also because 3 seconds later the useradd happened.

## 07:14:04 svc\_sync created

After that the attacker created the user svc\_sync with the useradd command. This user has UID 1042 and a home directory in /opt/svc\_sync (not /home). This is camouflage so it looks like a system service rather than a regular user.

## 07:14:08 svc\_sync added to sudo

This time the command usermod -aG sudo svc\_sync succeeded and svc\_sync became a member of the sudo group. This means this user now has administrative privileges (can do everything as if he were root).

## 07:14:13 system-update.service enabled

After that the attacker enabled a systemd service named system-update.service using systemctl enable. This created a symlink so the service runs automatically every time the machine boots. This is a type of Persistence.

## 07:14:16 Service file written

The attacker wrote the service file itself in /etc/systemd/system/system-update.service using cat >. This file contains the service’s instructions, and the most important thing in it is ExecStart, which says what the service will execute. Unfortunately, the file’s content isn’t in the logs.

## 07:14:28 DNS query for cdn-sync-update.com

The JUMP-01 machine asked the DNS for the address of the domain cdn-sync-update.com. This is a strange, unknown domain, and not an internal one. This is the first indicator that a connection to a C2 (command and control server) is about to happen.

## 07:14:34 C2 connection to 203.0.113.120:443

Then the JUMP-01 machine opened a TLS connection with the address 203.0.113.120 on port 443. The process that opened the connection is systemd, meaning the service that was created 18 seconds earlier is the one making the connection. The SNI was cnd-sync-update.com. This confirms that this service is a C2 beacon.

## 07:14:42 Firewall allows the connection

The firewall (nftables) logged that it allowed this outbound connection. This is additional confirmation that the connection actually happened and went through.

## 07:14:50 Wazuh fires the alert

And then the Wazuh system fired a high-severity (HIGH) alert numbered 5712. This alert came 106 seconds after the start of the attack, which is considered late.

## 07:15:02 Successful SSH for svc\_sync from 203.0.113.120

After that the attacker got into JUMP-01 using the svc\_sync account from the external address 203.0.113.120 (the same address as the C2). This means he succeeded in creating a backdoor and getting in from the outside. And this is the last event in the recorded chain.

That’s it!

If I got it right, it’s from Allah, and if I got it wrong, it’s from myself and the devil :)
