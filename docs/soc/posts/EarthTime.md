---
date: 2026-09-18
---
# From EarthTime to MSBuild: Anatomy of a Three-Gang Ransomware Intrusion + Static Malware Analysis

<!-- more -->

[🇪🇬 اقرأ بالعربي](../EarthTime-ar.md){ .md-button }

A simplified breakdown of a complex DFIR-reported attack chain — from trojanized EarthTime and MSBuild injection to SectopRAT, SystemBC, and Betruger — plus static malware analysis notes.

![](https://miro.medium.com/v2/resize:fit:875/1*Gvk3OjsB59OIjqIwzQMUHQ.png)

> بسم الله :)

An article I read about a complex attack on DFIR Report. It took me five days just to understand it, and multiples of that to explain the report — so focus with me :)

It’s not an Investigation as much as it is understanding how the attack chain actually happened.

## The Beginning: A Suspicious Download

In September 2024, there was an attack on some company, and they called DFIR Report as a third party because they found unusual behavior they couldn’t understand. But the report wasn’t clear about exactly what made the company call or suspect an attack. Still, it mentioned a few things that could be the reason: a couple of Sysmon event logs showing process access and create remote thread, a few Suricata alert rules for external connection, some Sigma rules that detected RDP to a machine not belonging to the company, tools, Active Directory access, and a whole messy story — telling you, if I were on their IT and Security team, I’d go ahead and resign.

Anyway, what happened is there’s a program called **EarthTime** — just a normal program. The IT admin found it in the download folder (the article didn’t mention anything about the delivery step). It’s a program that calculates time differences between countries — companies know it. So the admin opened the program normally. How did we know? Like the last “crime” we explained, its parent process was `explorer.exe`, so I knew an employee opened it; it didn't run by itself.

A bit later, a child process for `cmd.exe` showed up. In the name of God, I look into its Sysmon logs — and I don't find a command.

Meaning what?

## Sysmon Event ID 8 (CreateRemoteThread)

And it’s also not tied to compiler DLL files.

*(Because some antiviruses create threads normally, but the idea is they’re tied to a known DLL — unlike this one without a DLL.)*

So it’s just `cmd` with no command — nothing actually ran.

```
Event ID: 8
SourceImage: C:\Users\...\EarthTime.exe
TargetImage: C:\Windows\SysWOW64\cmd.exe
NewThreadId: [...]
StartAddress: [a memory address not associated with any known DLL on disk]
```

After that, a child process (I’m tracing all this by process ID) named `MSBuild.exe` — also without command or arguments.

It’s a legit tool used by Visual Studio to compile code.

So this child is `cmd` without a command, and this tool MSBuild — the child of the child — also without code... hmmm.

```
EventID: 10
SourceImage: C:\Windows\System32\cmd.exe
TargetImage: C:\Windows\Microsoft.NET\Framework\v4.0.30319\MSBuild.exe
GrantedAccess: 0x1FFFFF          ← full privileges
CallTrace: ... UNKNOWN ...   ← a strong indicator of Injection
```

## Why MSBuild? A Genius Piece of Misdirection

Now, Reem, I know that MSBuild running with `cmd` is normal because it's tied to a compiler that runs code from the terminal.

And I also know it’s fine to run without a compiler because it is a compiler by itself… so why did you assume it’s suspicious?

You’re right.

But that’s exactly why the attacker used it — and it’s got a technique in MITRE too.

> ***T1127.001 — Trusted Developer Utilities Proxy Execution: MSBuild***

The idea is that MSBuild supports something called **inline tasks** — you can write C# code inside the project XML file itself, so MSBuild will compile and run that code in RAM directly. Unlike the usual behavior where a compiler generates a separate .exe file on disk and then runs it.

A sample command for MSBuild:

```
MSBuild.exe MyProject.csproj /p:Configuration=Release
```

Meaning it runs with the project file name as an argument — it has to know exactly what to build.

But what happened in this incident is that MSBuild.exe ran with **no arguments at all**.

The only explanation is it didn’t just run some malware code — no, **it was the malware itself!**

And the attacker specifically used this tool so the SOC team would think it’s usual behavior — normal, since of course an IT admin’s machine has inline tools they use.

## Recap: The Injection Chain

From EarthTime → `cmd` an injection happens.

And also from `cmd` → MSBuild another injection happens.

Exactly like what popped into your head. They’re passing code between them.

**EarthTime.exe executes these steps:**

1. Calls `CreateProcess()` to run `cmd.exe` in SUSPENDED mode
2. Uses `VirtualAllocEx()` to reserve space inside `cmd.exe`'s memory
3. Uses `WriteProcessMemory()` to write the malware code (SectopRAT) into that space
4. Uses `CreateRemoteThread()` or `SetThreadContext()` + `ResumeThread()` to run the planted code inside `cmd.exe`

**Then** `<strong class="og hx">cmd.exe</strong>` **(the one we just injected) executes:**

1. `CreateProcess()` to run `MSBuild.exe` in SUSPENDED mode
2. `VirtualAllocEx()` on MSBuild's memory
3. `WriteProcessMemory()` to write the same malware code, SectopRAT (or a copy of it), into MSBuild
4. Runs the planted code — the malware, that is

## So What Is This Malware They’re Shuttling Around?

The DFIR team says they looked up the hash reputation of EarthTime and found it’s a malware called **SectopRAT**.

You said above it’s a normal program people download.

No no — focus, because I got stuck here for two days.

**The malware is named after the normal program.**

And we know malware has been named after legit programs forever — but it’s not the original program.

A fact the report mentioned that surprised me: **this wasn’t random at all** — the original program actually had a critical vulnerability.

When the program installs, it requests downloading a few libraries to work. So it comes with a `requirements.txt` file that has the library names. So when you run the program, it automatically downloads those libraries.

**The vulnerability** is that the program doesn’t just download the requirements — it downloads *anything* that can be downloaded into its current directory :))

Like if there’s a game named FitGirl and it has a command in the file, it’ll download it just fine.

Okay, and what’s that got to do with our malware?

The idea is the attacker exploited the name of a program that already had a vulnerability to throw the security team off during investigation — so by the time they think, like you did at first, that the attacker exploited the vuln…

Nope, that didn’t happen — it’s not the original program at all; it’s malware just using its name.

So by the time they figure it out, the attack chain is done.

Two-hundred IQ, I’m telling you.

## Back to the Story: Custom Packing

Anyway, back to our story now that we know it’s injection into this into that.

They say the malware content inside EarthTime — SectopRAT — was packed to begin with, and used **custom packers** specifically built by the malware author himself (which is most likely in the case of SectopRAT, because the packer is built to integrate with the injection technique into MSBuild specifically — you’ll see below what that means). *(Packed meaning encrypted/obfuscated so you can’t tell what the malware code is.)*

And it keeps passing it among these processes still packed as well.

## So Then How Did It Even Run?

They say as soon as EarthTime ran, it took part of the malware and injected it into `cmd.exe` as we explained above, and took a copy of it to `%AppData%\Local\Temp` with the filename `\bhnwcwgaphpge`.

## Why All These Copies Then?

This is a common pattern in newer malware — a technique on MITRE:

> ***T1027.002 — Obfuscated Files or Information: Software Packing***

When MSBuild runs, it goes and unpacks the packed `bhnwcwgaphpge` to run it :)) *(we said the malware is packed)*

Now you see why custom packed?

## The Real Attack Kicks Off: Dead Drop Resolver

And here, in the name of God, the actual attack kicks off: it connects to [**https://pastebin.com/raw/XK7ARdVw**](https://pastebin.com/raw/XK7ARdVw) to fetch the C2 configuration.

Meaning MSBuild.exe doesn’t connect directly to the C2 at the first moment — it first goes to a page on Pastebin (a legit, unblocked site), takes the real C2 configuration from there, then connects to the C2 `45.141.87.55`.

**Benefit:** if the C2 IP changes, the attacker just edits the Pastebin page content instead of changing the malware code itself — this technique is called **Dead Drop Resolver**.

Again, what happens is MSBuild.exe reads the file `bhnwcwgaphpge` from Temp, unpacks the packer in memory, then connects to Pastebin to get the C2 configuration, then connects to the real C2 (`45.141.87.55`).

You’re exhausted, of course. So am I.

All of this to pull off solid evasion of the EDR & antivirus — and it actually worked.

## Persistence: Building a New Identity

The article also says for persistence, this same program (EarthTime, which we agreed is malware), after all those copies it made, also took a fifth copy into `C:\Users\<username>\AppData\Roaming\QuickAgent2` named **ChromeAlt\_dbg.exe**.

Like, “Google” vibes and all that.

So how did it copy and move between the directories? Weren’t we in Downloads?

By using a service called **BITS (Background Intelligent Transfer Service)**.

BITS is a 100% legitimate Windows service that Microsoft itself uses to download updates in the background. The attacker used it to move files without showing up as normal copies in the logs.

And he also used it to make a sixth copy as well in a startup shortcut, exactly so that when the machine boots it runs right away — named **ChromeAlt\_dbg.lnk**.

Proper hacker work, honestly.

What happened after that is expected; the report went into it in a super complicated way — I’ll try to simplify it.

## Back to MSBuild.exe: Discovery and a New Admin

Let’s go back to the last point in our path, which is MSBuild.exe.

After the C2, MSBuild.exe first executed **discovery**: `hostname`, `ipconfig`, `nslookup`. Recon, basically.

Then it executed:

```
net user Admon Qwerty12345! /add
```

Remember when we said the victim was an IT admin, meaning they have permissions to add and delete users.

So he made himself an admin account and added it to the local admins:

```
C:\Windows\system32\net1  user Admon Qwerty12345! /add
C:\Windows\system32\net1  localgroup Administrators Admon /add
```

He named it “Admon” — an artful choice of names.

And he wrote a file named **WakeWordEngine.dll** at the path `C:\Users\Public\Music\WakeWordEngine.dll`.

The article didn’t show any logs in this part, but it did say there was a File Creation event.

After the file was written, the attacker ran it with this command:

```
rundll32.exe C:\Users\Public\Music\WakeWordEngine.dll,Reset
```

It loaded the DLL in memory and called the `Reset` function with a tool called `rundll32.exe` — a normal, legit tool that runs DLLs in general.

## A Second Malware: SystemBC

So what’s this `Reset`?

It’s a function in the second malware we’ve got.

Another malware? Yeah, they said its name is **SystemBC**, hiding under the name `WakeWordEngine.dll`.

It showed up to the investigators after they ran YARA rules scan on memory, and it turned out to be malware called SystemBC.

As soon as `rundll32` called the `Reset` function, SystemBC started running and did the following:

* It connected to its second C2: `149.28.101.219:443`
* And from the new “Admon” account, it opened a **proxy/tunnel** between his machine (the attacker’s external machine) and the infected machines inside the network

The attacker could now RDP to any internal machine as if he’s sitting inside the network, without appearing as a direct external connection.

That’s what made the log pattern look like this:

> *Logon Type 3 (Network) followed immediately by Logon Type 10 (Remote Interactive)*

## The Attacker’s Mistake

But there was a nasty mistake, unfortunately, in this proxy.

Every time someone makes an RDP connection to another machine, the RDP session carries with it a piece of information called **“Client Name”** — meaning the name of the machine where the connection originates, i.e., the attacker’s machine itself (not the target machine). And that’s normal behavior in the RDP protocol; it’s designed primarily for administrative purposes (like knowing who’s connecting to your machine remotely).

**The problem** (from the attacker’s perspective): since the connection passes through the SystemBC proxy tunnel, the attacker thought (or didn’t notice) that his real machine name (his personal machine or the VM he’s working on) was leaking with every connection, even though he’s using a proxy to hide his geographic/network location.

So what happened then — the attacker’s machine name showed up, and all the machines that took part in this attack over its course:

* `DESCTOP-QPITRY` (the main and first machine in the attack)
* `DESKTOP-A1HRTMJ`
* `DESKTOP-PGD76HT`
* `WIN-FLGU1CC210K`

But the thing is, you could easily not notice and think these are just normal logins from company employees.

If you yourself didn’t notice… of what?

It’s not normal for an IT admin to make a typo in a company.

Misspell what? .. Malware?

No no, actual writing… he wrote the machine name as **DESCTOP-QPITRY** :))

So yeah, that was suspicious enough, you know.

## DCSync: Taking All the Credentials

Anyway, after he opened a tunnel on the company network, he did a **DCSync Attack** on the domain controller to get all the remaining credentials.

```
Event ID: 4662
Access Mask: 0x100
Object ID: {1131f6ad-9c07-11d1-f79f-00c04fc2dcd2} = DS-Replication-Get-Changes
```

And this replication is one of the most important features of the domain controller that synchronizes copies with the other domain controllers of the company in the same domain.

So this attack lets you pretend you’re a domain controller on the network and use this feature, so he took all the credentials.

And of course that gave him access to literally everything. So, to get persistence, he took a copy of SystemBC — the one that was on the initial infected machine as `WakeWordEngine.dll`, remember? — and put it on the DC named **conhost.dll**.

## How Did It Move?

Using the **PsExec.exe** tool, which is also a legit tool for running remote commands. And with it he also opened a connection like its buddy above to C2: `149.28.101.219:443`.

## Network Discovery With Modified Legit Tools

And that’s it, engineer — he pulled down some tools and got to work.

First thing he used **netscan.exe**.

Isn’t that a legit tool that scans the network?

Yeah, but the attacker tweaked a few things. He made a custom config file for this tool with a feature called **checkwrite**, which checks the IPs and which of the users have write permission.

And that’s a normal thing in the standard file anyway, but the idea is that in the config file `netscan.xml`, when this option is enabled, the tool tries to write a test file named **delete.me** on the `C$` share of the machines it's scanning.

It checks “Can I write files to this machine or not?” So it creates this file as a test and places it on the `C$` share (the administrative folder C\$).

If it succeeds in writing the file, that means it has write permission on that machine.

And that generates the **Event ID 5145** log where it’s requesting access, and that’s normal because we said it writes a file to a shared folder.

And it actually showed up on the first machine we started with, remember?

And of course, in that same config file, too, he tied it with PsExec + scripts (`newuser.bat`, `openrdp.bat`, `start.bat`).

So the tool doesn’t just stop at the scan, but also executes commands automatically on the machines it finds.

That’s a common approach among the Ransomware Affiliates: they take legit tools and modify them to fit their work.

The forensics team says after the attack, when they looked at the tool’s output, they found an old file with another company’s name in the output files that the attackers forgot by mistake, so they knew these folks are experienced and this isn’t their first time :))

## Mapping the Whole Network

Anyway, what else was executed on the DC?

**sh.exe** — or what we later learned is a tool used by APTs called **SharpHound**. And that’s what the hash reputation confirmed later when we checked it through threat intel platforms.

It’s a tool that maps your whole network. It gathered massive information about Active Directory (users, groups, privileges, sessions…) and made **1,271 DNS requests** internally.

What else?

**Adfind.exe** — a query on `CN=Subnets,CN=Sites,CN=Configuration` that pulls network topology information.

And he wrote a few other scripts aimed at gathering information about:

* The trusts between domains
* A list of domain controllers
* Members of the Domain Admins group

Don’t forget we said we now have everything we need to go to any server.

## The Backup Server: Killing the Safety Net

So let’s move to what happened on the backup server to destroy any backups, because the goal is to deploy ransomware — or even if we’d settle for data exfiltration, we still need to hit it (the backup server).

After he got to it via RDP, of course, he executed a PowerShell script for **Event ID 4104** looking for a SQL server.

Because **Veeam** stores its passwords inside a SQL database.

## What’s Veeam?

Veeam (the backup system) saves the credentials it uses to reach servers and shares faster later on, in a database called `VeeamBackup`.

So this script is looking for the Veeam backup.

Obviously all the passwords are encrypted, so what did he do?

He used a decryption file on the same server before taking a copy. Meaning the encryption has to be undone on the same server because the key exists only on the server.

## Grixba: The “Chill” Recon Tool

After that he ran a tool called **Grixba (GT\_NET.exe)**.

It uses WMI and WinRM (both legit tools) to gather information about everything:

* Users on the network
* Connected devices (computers)
* Software installed on each machine
* Antivirus programs (so the attacker knows what protection is there before moving)
* Other backup tools (like the Veeam we saw, or others)
* Office programs (an indicator of valuable data/documents)

A chill tool, honestly.

And this tool is said to belong to the **Play Ransomware** APT in essence.

## Data Exfiltration

After that, they used a tool called **FS64.exe**, also custom-built by the attackers. It scoops files from one place to another, then spits out a txt file listing what it grabbed.

Of course the backup server already has active, ready-to-go privileges to access the shared folders on the file server, because it literally needs that to do backups in the first place. No RDP at all.

They ran the tool on both servers. It collected files with the extensions `.xls, .xlsx, .doc, .docx, .pdf` — very specific — and it made a txt summary of what it gathered on the backup server, and also dropped a copy on the file server in a folder named `Public\Music` on both.

They tell you that at this moment they found a file called **Cyber Insurance Policy**, which they wanted so they could learn the company’s policy — aka their ransomware budget — for when they finally roll out the ransomware.

Hacker work, I’m telling you.

Then they compressed those files and used a file transfer tool over the internet called **WinSCP** (also a legit tool) to send the files to the attacker’s own server.

But they made a rough mistake… **FTP protocol**.

Yeah, the file transfer protocol — what’s wrong with it, Reem?

It’s not secure or encrypted.

Meaning what?

Meaning if you open Wireshark you’ll see the attacker logging in with their account and password, their data, and your files all flying by in plain text :))

## Wait — There’s Another Path?!

Up to here, the attack path from this side is done. The report didn’t explain exactly how it wrapped up, but these were four out of six days of the attack. We’ve still got two days left where they took another path.

Wait, what? There’s another path?!!

What did you think?

Remember MSBuild.exe?

Nope, don’t remember.

I get it, but that was the legit compile tool they injected at the start alongside `cmd`, remember?

## Day Six: A Third Malware Emerges

On day six of the attack, MSBuild.exe found itself with free time — or rather, the attacker wasn’t satisfied with the above — so it wrote a new file in the `Music\` folder named **ccs.exe**, and ran it.

The parent process of `ccs.exe` was MSBuild.exe, yep.

Anyway, when we check the file’s metadata, we find it claiming to be **Avast Antivirus**… meaning what, sir?

The metadata was written with Avast file names.

Couldn’t it actually be from Avast?

No, man — the digital signature isn’t real. Also, what’s it even doing in the music folder?

A signature rule named Symantec tagged it as malware called **Betruger**, which is a backdoor for an APT called **RansomHub affiliates**.

So that’s a third piece of malware? Yep. Betruger is a multi-function backdoor that does whatever you want: screenshotting, keylogging, file exfiltration, network reconnaissance, privilege escalation, credential harvesting.

As soon as `ccs.exe` ran, it connected to its C2:

* `504e1c95.host.njalla.net`
* `80.78.28.149`

Which has a reputation as a phishing domain.

And it performed large-scale **process injection** — injecting itself into **172 running processes** on the machine for persistence.

And it did process access on `lsass.exe`:

```
GrantedAccess: 0x1410
0x1410 = PROCESS_VM_READ + PROCESS_QUERY_INFORMATION
```

After Betruger ran, we also saw **Windows Event ID 4776** (credential validation). The source was a machine named `WIN-FLGU1CC210K` — a new hostname that hadn't shown up before in the attack, but still attacker-controlled. It's even said that, since the tools belong to different APTs, there's a chance more than one APT took part in this attack.

## A Password-Protected Payload

Anyway, while still in the same music folder, the attacker pulled down two files:

* `data.dat`: Malware, packed
* `vhd.dll`: it has a password; if you enter it correctly, it will unpack the packer `data.dat` above

So who runs DLL files, as we said earlier? `rundll32.exe`.

But if we write it like this:

```
rundll32.exe C:\Users\Public\Music\vhd.dll
```

It’ll look malicious and it will actually show up that way in the logs.

So what did the attacker do?

They changed the **working directory** of `rundll32.exe` and moved it into `Music` with the malware, so the command becomes:

```
rundll32.exe vhd.dll
```

Like this, it’s a bit more reasonable, yeah.

As for what the malware actually is, the investigators didn’t know because they didn’t have the key to decrypt `data.dat`.

They also say that this `ccs.exe` — aka the Betruger backdoor — created a `cmd` process too, which in turn created hidden files in the Downloads folder.

The report described them as “suspicious hidden files indicative of discovery,” meaning they’re most likely outputs from discovery commands (like results of `net user` or `nltest`) saved as hidden so they don't stand out.

## The Final Push — And a Failed Ending

Anyway, after all that — what happened?

The attacker opened a new RDP session from the last C2 we mentioned onto the main machine (`504e1c95.host.njalla.net` / `80.78.28.149` — remember? the one we started from, where `ccs.exe` is still active).

From there, while on the backup server, they used **Impacket wmiexec** on the domain controller to run remote discovery commands one last time.

How do we know? A process appeared on the domain controller: `WmiPrvSE.exe` launching `cmd.exe` (that's how the tool works):

```
ParentImage:  C:\Windows\System32\wbem\WmiPrvSE.exe
Image:        C:\Windows\System32\cmd.exe
CommandLine:  cmd.exe /Q /c [command] 1> \\127.0.0.1\ADMIN$\__[random] 2>&1
```

The report said the attacker unfortunately didn’t manage to deploy the ransomware (made me sad) and got kicked off the network :(

## Further Reading

I found some really solid dynamic analysis reports on ANY.RUN:

* **Betruger Backdoor Malware**: [any.run/report/ae7c31d4547dd293ba3fd3982b715c65d731ee07a9c1cc402234d8705c01dfca](https://any.run/report/ae7c31d4547dd293ba3fd3982b715c65d731ee07a9c1cc402234d8705c01dfca/ca432fcb-b5f7-4ed4-8143-55fd1875ff40)
* **SectopRAT Malware (EarthTime.exe)**: [any.run/report/bcff246f0739ed98f8aa615d256e7e00bc1cb24c8cabaea609b25c3f050c7805](https://any.run/report/bcff246f0739ed98f8aa615d256e7e00bc1cb24c8cabaea609b25c3f050c7805/2f79f6ae-f8ca-400b-b8a8-f67353b20ab6#i-table-processes-fa2e16fe-ba9d-4fb5-8bc8-3467ddba8928)

And here’s the original report link:

* **DFIR Report**: [Blurring the Lines: Intrusion Shows Connection with Three Major Ransomware Gangs](https://thedfirreport.com/2025/09/08/blurring-the-lines-intrusion-shows-connection-with-three-major-ransomware-gangs/#detections)

Unfortunately I couldn’t find static analysis for the code (understandable since it’s custom packed). But out of curiosity, I did a very simple static analysis for them without going deep.

## Static Malware Analysis Report

**Samples:** EarthTime.exe (trojanized), a third .NET sample (Sample 2, file name not recorded yet), and ccs.exe (referenced as Betruger)

**Naming context:** DFIR Report, “Blurring the Lines: Intrusion Shows Connection with Three Major Ransomware Gangs” (Sept 2025). Used only for sample naming, not as technical evidence.

**Method:** Static analysis only. Neither sample was ever run. Tools: DIE, PEiD, PEStudio, PE-bear, IDA Pro, de4dot, dnSpy (on Sample 2, the .NET sample).

**Neutrality:** This report only records what was proven by direct evidence. It also states which ideas were tested and rejected, and which evidence is still unclear. Nothing is called “certain” unless the code or file structure shows it directly.

## Sample 1: EarthTime.exe

## 1. Basic Information

Property Value Source File name EarthTime.exe Metadata Type / Arch PE32, I386 (32-bit) DIE, PEiD, PE-bear Compiler C++ (MSVC, Linker 14.37, VS 2022 v17.6) DIE Size 8.74 MiB (9,165,112 bytes) PEStudio Overall entropy 5.649 PEStudio Overlay Yes, offset 0x008BB000, size 0x2938 DIE, PE-bear Entry point 0x000DD593 (.text) DIE, IDA Packer (heuristic) Obfuscation / compressed or packed data (high entropy in .text) DIE PEiD “Nothing found [Overlay]” (no known packer) PEiD Sections .text, .rdata, .data, .rsrc, .reloc + overlay (normal layout) PE-bear Internal metadata Description “EarthTime Application”, Company “DeskSoft”, Comments “www.desksoft.com” PEStudio (checked manually)

![](https://miro.medium.com/v2/resize:fit:656/1*RczCZ_QKhjEwJcGatrnnTw.png)

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*_XRW7EJvi7LClCOguyLUAA.png)

## 2. First Idea and How It Was Tested

**Starting idea:** SectopRAT/ArechClient2 is usually written in .NET, so I assumed EarthTime.exe was a C++ loader hiding a real .NET payload.

**Tests, in order:**

1. de4dot returned “Unknown Obfuscator” and then failed. This proves nothing by itself, because de4dot only supports known .NET obfuscators.

![](https://miro.medium.com/v2/resize:fit:533/1*fSxpGMWvwD8Xgr5-4gUDEg.png)

1. Imports (369 functions, checked page by page): no `mscoree.dll`, `CorBindToRuntimeEx`, or `CLRCreateInstance` (the normal ways to host .NET in a native app).
2. IDA text search for `BSJB` (the .NET metadata signature): not found.
3. Strings search for `mscorlib`, `System.Reflection`, `Assembly.Load`, `GetManifestResourceStream`, `CLRCreateInstance`: none found.
4. Resources (PEStudio): two large resources under type “JPG” (\~988 KB and \~422 KB).
   I extracted them and checked the first bytes: `FF D8 FF E0`, the real JPEG/JFIF header. They are real images, not a hidden payload. This is a false lead that was ruled out.

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*vTCQgUepU5rC9v52O2DrNA.png)

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*f8_Kz6bclYYPL1WvQmRfcQ.png)

1. PE-bear: 5 normal sections, no extra sections, small overlay.

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*-2DF6I2IY5_tBEcRnB1Z1A.png)

**Result:** The “.NET loader” idea has no supporting evidence and was rejected. There are no .NET traces in the imports, strings, or metadata. The hypothesis was corrected based on evidence.

## 3. Revised Conclusion

The 369 imports show an unusual mix of features in one file:

Category Example functions Library Crypto / signature checks CryptCreateHash, CryptHashData, CryptImportKey, CryptAcquireContextA, CryptVerifySignatureA ADVAPI32 Raw network sockets socket, connect, send, recv, select, gethostbyname, WSAStartup WSOCK32 Registry RegOpenKeyExA, RegQueryValueExA, RegCloseKey ADVAPI32 Process control CreateMutexA, OpenProcess, ImpersonateLoggedOnUser, GetTokenInformation, OpenProcessToken KERNEL32 / ADVAPI32 External execution ShellExecuteA, WinExec (not every import name was checked to the last line) SHELL32 User identity GetUserNameA, ImpersonateLoggedOnUser ADVAPI32

Crypto + raw sockets + registry + impersonation is not normal for a simple desktop app like a world clock. It is a common pattern in RATs and stealers written fully in native C++ (instead of .NET).

**Not done yet:** I did not trace the real calls to the network or crypto functions (which address/port `connect` uses, or which key `CryptImportKey` uses). This needs another session.

## 4. Suspicion Indicators

# Indicator Evidence Confidence Note 1 Masquerading as a real program Name, icon, and metadata match real EarthTime, but the imports do not match a world-clock tool High Confirmed by direct comparison 2 Custom / heuristic packing DIE heuristic; PEiD found nothing Medium No named packer, heuristic only 3 Unusual import mix (network + crypto + registry + impersonation) Full import table (369 functions) High A behavior pattern only; real calls not traced 4 Overlay data 0x2938 bytes (\~10 KB) — Low Small; content not checked 5 “.NET loader” idea None Rejected No mscoree.dll, BSJB, or .NET strings 6 Disguised “JPG” resources None Rejected Magic bytes show real JPEGs 7 Hash match on VirusTotal / MalwareBazaar SHA256 checked manually with Get-FileHash; matches the value listed as Arechclient2/SectopRAT on public sample sites Medium-High Only the hash was checked, no AV report or dynamic analysis

**Verdict:** Medium-to-high confidence that this is a disguised program with network and crypto features that do not fit its stated name. There is no direct static proof (explicit C2 code or an unpacked payload), so it cannot be called malicious with 100% certainty from this analysis alone. The conclusion rests on strong structural indicators, not on watching the payload run.

this is beacuase : Custom Packers, The encrypted blob may be wrapped in a custom packer that encrypts the .NET metadata, strings, and IL code.
That is why de4dot fails — it cannot unpack it — and DIE only reports “Obfuscation / compressed or packed data” without identifying it as .NET.

## Sample 2: Obfuscated .NET Sample (file name not recorded)

## 1. Basic Information

Property Value Source File name / hashes Not recorded yet (see Known Gaps) n/a Type / Arch PE64, AMD64, GUI, little endian DIE Size 1.86 MiB DIE Linker / Tool Microsoft Linker, Visual Studio DIE Language / Library C#, .NET Framework v4.8 (CLR v4.0.30319) DIE PE “OS” field Windows (Server 2003) (only the header’s minimum-OS field, not meaningful) DIE Heuristic protection Obfuscation [Modified EP + CLR constructor + Virtualization + Calls encrypted] DIE Heuristic packer Compressed or packed data [High entropy + Section 0 (“.text”) compressed] DIE

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*aEiLEMx8ht-5S4kR1K8D9g.png)

## 2. What Was Tested and Found

DIE confirms this is a real .NET (C#) file, unlike Sample 1. The two heuristic lines above point to obfuscation and packing, but heuristics are guesses, not proof.

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*mEEF4WtnWgIA60iAMdPIcQ.png)

de4dot returned “Unknown Obfuscator” and then failed. This only means de4dot does not recognize the protection. It does not prove the protector is custom-made.

**dnSpy (opened directly, without cleaning):**

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*zFghear0DPy6IxzIFpi2bg.png)

* **Name obfuscation:** namespaces look like random Cyrillic-style text (for example `йДШиОЩМСrxx.Properties`), and many classes and methods use private-use Unicode characters (`\uE000`, `\uE010`, `\uE03C`, and similar) as names. This is directly visible in the code.
* **Normal generated classes:**`Settings` and `Resources` are standard Visual Studio classes (app settings and embedded resources). Nothing malicious is visible in them, only renamed.
* **Loader-style class** `<strong class="og hx">Cnox...</strong>`**:** the constructor (seen in two separate classes with the same pattern) holds three delegates:

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*TIU-Rjb5SifTPIYFWI7Axw.png)

* `Func<byte[], byte[]>`: takes raw bytes and returns bytes (typically decrypt or decompress)
* `Func<byte[], Assembly>`: turns bytes into a .NET Assembly in memory
* `Action<Assembly>`: does something with that assembly (most likely runs it)

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*TkYCBILiFgIzW3lL6cU6MQ.png)

* **Control flow obfuscation:** nested `for(;;)` loops with XOR (`^=`) on integer variables, and calls like `uE036.uE006(57)`. This looks like control flow flattening (a state machine that replaces normal if/else logic), which makes the real logic very hard to read.
* **Other classes:** simple structure (properties, Dispose, constants), just renamed.

## 3. Conclusion

The three delegate types match the classic in-memory unpacking pattern: decode bytes, load them as an assembly, run it. This is the most likely place where a hidden payload is loaded. However, this is based on the delegate signatures only. I have not yet seen the delegate bodies, where the input `byte[]` comes from (a resource, or hardcoded bytes), or what the loaded assembly does.

**About the label “Virtualization”:** DIE’s word is a heuristic label. The control flow flattening above is real and visible, but it does not prove a custom virtual machine. Do not claim a custom VM without direct evidence.

**About identity:** This sample is expected to be SectopRAT/ArechClient2 (from the naming context), but that is not confirmed here. No hash match has been checked yet.

## 4. Suspicion Indicators

# Indicator Evidence Confidence Note 1 .NET (C#) Framework 4.8 file DIE High Confirmed; opens as .NET in dnSpy 2 Name obfuscation (Unicode / Cyrillic-style names) dnSpy, seen directly High Also blocks de4dot 3 Control flow flattening (nested for(;;) + XOR state variables) dnSpy pseudocode High Seen in code 4 In-memory loader pattern (Cnox… delegates: bytes → Assembly → action) dnSpy, delegate types Medium Signatures only; bodies and byte source not traced 5 Packing (.text high entropy) DIE heuristic Medium Exact entropy not measured 6 “Virtualization” / custom VM DIE label only Low / unproven No direct evidence of a VM 7 Hash match on VirusTotal / MalwareBazaar Not done Incomplete Needs hash first

**Verdict:** High confidence this is a heavily obfuscated .NET sample with a likely in-memory loader. The hidden payload and the malware family are not confirmed by static evidence yet.

## Sample 3: ccs.exe (Betruger)

## 1. Basic Information

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*mZ9hbWufW-RZAIQRVpe9OA.png)

## 2. Confirmed Suspicious Indicators

**High entropy in** `<strong class="og hx">.rsrc</strong>` **(possible packing / encryption)**

* **Evidence:** DIE heuristic: `Compressed or packed data [High entropy + Section 5 (".rsrc") compressed]`
* **Why it matters:** A normal `.rsrc` holds icons, UI text, and version info, which have fairly low entropy. High entropy suggests compressed or encrypted data.

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*FkBv-6-NuoxKKWiREVW4jA.png)

* **Limits:** Heuristic only. I did not measure the exact entropy value (e.g., PE-bear per-section view). My last extraction attempt returned the standard CRT `__security_init_cookie` code, so I picked the wrong item. This is still open and needs to be redone.

**Hidden API calls (lazy, cached, encrypted resolution)**

Evidence — function `sub_1400A4B80`:

![](https://miro.medium.com/v2/resize:fit:750/1*TBzUMaQ2yxuHRquNygOjAA.png)

* **Explanation:** This is lazy API resolution with an encrypted (XOR/ROR) cache. The table `qword_140129770[30]` holds 30 slots (64-bit each) for API addresses. Writes use `_InterlockedExchange64`, which is an atomic, thread-safe write. A compiler does not add this by accident, so the design looks deliberate.
* **Why it matters:** It explains why sensitive functions (`CreateProcess`, `VirtualAlloc`, `WriteProcessMemory`) are missing from the imports and strings. A normal program has no reason to hide them this carefully. I also found `sub_14009E3FC`, a hand-written copy of `wcsncmp`, used instead of the CRT version. This is a small extra evasion trick that makes plain string searches for API names less reliable.
* **Limits:** I have not decrypted the table, so I do not know which 30 APIs are hidden. That needs the real `_security_cookie` value, or a simulation of the XOR/ROR formula outside IDA. The current conclusion is based on the hiding mechanism itself, not on any specific dangerous API.

**Persistence through a Windows service + registry (strongest, unhidden evidence)**

![](https://miro.medium.com/v2/resize:fit:758/1*KmSgtPXJpk1oBkqIVUslZA.png)

* **Evidence:**`CreateServiceW` and `RegCreateKeyExW` (both ADVAPI32) appear openly in the imports, with no hiding.
* **Why it matters:** This is a classic persistence pair: a service that starts with Windows (often as SYSTEM) plus related registry data.
* **Odd detail:** These two functions are fully visible while others (`CreateProcess`, `VirtualAlloc`) are hidden. This difference is unexplained. The author may have thought some functions were "less risky," or the hiding may only cover part of the calls.
* **Not done yet:** I did not check the arguments passed to `CreateServiceW` (service name, description, binary path). This would give a direct IOC (likely a fake service name).

**Other possibly meaningful functions (not conclusive alone)**

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*9NTcC_hD1O164wXa5z7Qcg.png)

* `InitializeProcThreadAttributeList` / `UpdateProcThreadAttribute`: used in PPID spoofing and some injection techniques, but their presence alone does not prove that use. Context not traced yet.
* `CreateProcessW`, `CreateThread`: generic; meaning depends on arguments and flags, which are not checked.

## 3. Indicator Reviewed and Found Inconclusive (Honest Correction)

`<strong class="og hx">IsDebuggerPresent</strong>`

At first it looked like an anti-debugging technique. After tracing its calls (Ctrl+X in IDA) and reading the surrounding pseudocode in two places:

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*ch-rEl2xBPa3nKy3e03fMg.png)

* `sub_140082711`: nearby code has `GetLastError()` and `OutputDebugStringW("ERROR: Unable to initialize critical...")`. This is the normal CRT error handling for failed initialization.

**Press enter or click to view image in full size**![](https://miro.medium.com/v2/resize:fit:875/1*jmccZ9Bo0herkjn95wv0Gg.png)

* `sub_1400832DC` and its callers: nearby code has `ExceptionInfo`, `ContextRecord.Rip/Rsp`, `UnhandledExceptionFilter`, and `SetUnhandledExceptionFilter`. This is the standard MSVC unhandled-exception handler, present in any MSVC program.

**Conclusion:** There is not enough evidence to call this intentional anti-debugging. It is most likely inherited from the CRT, so I removed it from the key indicators. It is included on purpose to show that being neutral also means dropping an early conclusion when the full context does not support it.

## 4. Evidence Summary

# Indicator Confidence Status 1 High entropy in .rsrc Medium Heuristic only; exact value and extraction not finished 2 Lazy, cached, thread-safe API resolution High Confirmed from decompiled code, strengthened by `_InterlockedExchange64` 3 CreateServiceW + RegCreateKeyExW (persistence) Very high Confirmed; visible, unhidden imports 4 Different hiding levels between functions Low-Medium Observation only, not explained 5 InitializeProcThreadAttributeList (possible PPID spoofing) Low Function present only; context not traced 6 IsDebuggerPresent (anti-debugging) Rejected Turned out to be standard CRT code 7 Hash match on VirusTotal / MalwareBazaar Incomplete Hash came from a tool window title; not re-checked

## Overall Verdict (Per Sample, Evidence Not Mixed)

**EarthTime.exe:** Medium-to-high confidence suspicious. It impersonates a known legitimate program, combines network, crypto, registry, and impersonation functions unusually, and shows heuristic packing with no known signature. A firm “malicious” label needs the real network/crypto calls traced, plus dynamic analysis or a detailed AV report (neither was done here).

**Sample 2 (.NET sample):** High confidence heavily obfuscated (Unicode names, control flow flattening, heuristic packing) with a likely in-memory loader class. The payload source and the malware family are not confirmed yet.

**ccs.exe (Betruger):** The strongest evidence is the open persistence pair (`CreateServiceW` + `RegCreateKeyExW`), together with careful, thread-safe hiding of other API calls and packing signs in `.rsrc`. Selective hiding of some functions but not others, with an encrypted, thread-safe cache, is a strong sign of deliberate design to avoid detection. This holds even without decrypting the full hidden API table or getting a final VirusTotal confirmation.

## All Samples

* Compute the ImpHash by hand from the import order (PEStudio/IDA) and compare it with public databases, without downloading any external report. Different malware families sometimes share the same import order, so this is a classification hint independent of SHA256.

> وبس كدا ان اصبت فهو من عند الله وان اخطأت فهو من نفسي والشيطان :)

</div>
