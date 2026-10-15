---
date: 2026-10-14
---
<!-- more -->

<div class="rtl-content" markdown>

## Linux Soc Investigation : How Can YOu rEach Host From The Container

### بسم الله — حوار أو جريمة جديدة في الـ Cyber Security

![1791997108698](images/ArchonCTF-ar/1791997108698.png)

أغلبنا كـ SOC Analyst أول حاجة بندور عليها هي الـ investigations على ويندوز — والـ AD وإلخ، لأن دا الشائع.. بس اللي متأكدين منه إن عدد مش قليل من السيرفرات أساسها لينكس.

دا مش هوك وربنا دا بكلمكم بأمانة أنا معرفش ولا قرأت أي حاجة قبل كدا لسيناريوهات على لينكس وبقالي فترة بدور على سيناريوهات كويسة شاملة أغلب الـ Cyber Kill Chain.

فأنا من يومين كنت شاركت في CTF SOC Investigation لشركة Archon Vanguard، وفعلاً الـ CTF كانت قريبة جداً جداً من الواقع وحتى اقرب من منصات ال Labs

وكان الـ Challenge Linux واستفدت جداً وحبيت أشارك معاكوا السيناريو.

للأمانة أنا استعنت في بعض المعلومات من الـ AI في الحل، عشان زي ما قلت معرفش أي حاجة عن اللينكس.

طولت عليكم، بسم الله والتشالنج كان بيقول:

</div>

```
Alert Source: Wazuh
Severity: HIGH
Time: September 22, 2026 — 07:14:50 UTC
Alert Message:
Multiple suspicious Linux account and command events observed.
The alert is only the starting point. Your job is to uncover the full incident using the available logs.
```

<div class="rtl-content" markdown>
وحل التشالنج ريبورت الـ investigation بالأقسام دي:

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

بس إحنا هنشرح المايندسيت للحل عادي، وفي الآخر نشوف اللي ناقصنا.

لو دخلنا على التشالنج هنلاقي ماب بكل الـ Machines اللي عندنا في النتورك.
---------------------------------------------------------------------------------------------------------------------------

### تحليل الـ Alert

نبدأ أول حاجة نحلل الـ Alert، وتحت كل سطر نكتب شرحه.

### Alert Source: Wazuh

Wazuh هو نظام SIEM + HIDS

* SIEM: بيجمع اللوجز من كل الأجهزة ويحللها.
* HIDS: بيراقب كل جهاز لوحده (ملفات، حسابات، عمليات).

وهتلاقي في الماب WAZUH-MGR-01 اللي هو Wazuh Agent.

### Severity: HIGH

### Time: September 22, 2026–07:14:50 UTC

دا أول حاجة مهمة معانا عشان نبدأ نحدد الـ Scope.

### Alert Message

> Multiple suspicious Linux account and command events observed.

يعني فيه حسابات اتغيرت (useradd, usermod, group\_add) — فيه أوامر اتنفذت (commands) كدا يعني، أو دا المتوقع سبب الـ Alert.

> The alert is only the starting point. Your job is to uncover the full incident using the available logs.

مفيش أي IOCs تانية، فهنبدأ باللي معانا وإننا نشوف اللوجز في سكوب الوقت اللي معانا.

![](https://cdn-images-1.medium.com/max/1000/1*wdPVIgFgx63voYc7vJA88Q.png)

طبعاً التشالنج كان موضح إن في لوجز كتير جداً Noise، فأكيد هنلاقي لوجز كتير يهيأ لنا إنها Suspicious، لكن هنروح للخمس دقايق بتوع الـ Alert الأول ونفهم الـ SIEM شاف إيه عشان يـ Fire Alert قبل أي حاجة، وبعدين نكمل.

هتلاقي كتير جداً لوجز بالشكل دا:

![](https://cdn-images-1.medium.com/max/1000/1*9gw0ae4eG1lT7KorcDoHzA.png)

بس لو ركزت هتلاقي إن src ip 0.0.0.0 ودا بيحصل لما تكون الأوامر على نفس الجهاز، فدي مش مشكلتنا دلوقتي إننا نقرأ 100 ألف لوج، فنشوف المهم ويتم تجاهل دول دلوقتي.

---

### أول لوج منطقي ومريب (الدقيقة 14)

مع أول لوج منطقي هيقابلك في الدقيقة 14 ومريب، نبدأ نفهم ونأخد IOCs.


![](https://cdn-images-1.medium.com/max/1000/1*9ewVMMQgIoesmO0k8zFktQ.png)

* الهوست اسمه “JUMP-01 Bastion” وال IP بتاعه اللي هو الـ dst\_ip 10.20.40.10
* اللي خد اللوجاية: auditd ودا نظام لوجز Linux بيسجل كل حاجة تخص الـ syscalls
* الإيفنت EXECVE تنفيذ أمر (syscall)
</div>
* user: deploy — المستخدم اللي نفذ.
* process: sudo — الكوماند اللي استُخدمت.
* parent\_process: sshd — الأب، يعني العملية اتنفذت من جلسة SSH.
* src\_ip: 10.20.20.10 = منعرفوش
* dst\_ip: 10.20.40.10 = JUMP-01.
* command: sudo usermod -aG sudo svc\_sync — بيضيف مستخدم svc\_sync لـ sudo.
* msg: نفس الأمر.

<div class="rtl-content" markdown>
عندنا دلوقتي أهم اتنين IOCs محتاجين نفهمهم:

1. مين الـ src host؟ لأن واضح إن الـ IP داخلي — ما ممكن يكون حد من IT.
2. إيه المستخدم دا ودنيته إيه؟ عشان اسمه غريب، وإيه اللي حصل بعد كدا على الهوست دا.

### أولاً: نسيرش عن الـ IP 10.20.20.10

![](https://cdn-images-1.medium.com/max/1000/1*HfzGrqvwcLllMKB1G7fLwQ.png)

هتلاقي إنه DOCKER-01 (ملناش دعوة باللوج لأنها خارج سكوب الوقت).

تمام، يعني ممكن Legit وممكن لا.

إيه تاني؟ (نحاول منتوسعش بدون فايدة ونخلص اللي في إيدينا ونكتفي الآن إننا عرفنا اسم الهوست)

### ثانياً: نسيرش إيه المستخدم دا وعمل إيه svc\_sync

نسيرش بيه، طلعلنا أربع لوجات، فنبدأ نفهم بقا.

![](https://cdn-images-1.medium.com/max/1000/1*racgym2PtDi8NSWTNOVGGw.png)

![](https://cdn-images-1.medium.com/max/1000/1*k2U-yJYO1WCO-3jvjPjDFA.png)

أول لوجاية حللناها، خلينا نشوف الباقي

#### تاني لوجاية عندي

</div>

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

* USER\_CREATE: حدث = إنشاء مستخدم.
* user: root — منفذ الأمر كـ root.
* process: useradd — الأداة.
* dst\_ip: JUMP

<div class="rtl-content" markdown>

طيب useradd يعني بيضيف يوزر 1042 يوزر عادي (لما الـ UID في لينكس يبقى أكبر من 1000 يبقى يوزر عادي مش أدمن).

فين بقا؟ home=/opt/svc\_sync, shell=/bin/bash — إيه اللي جابه في opt؟ اليوزرز بيبقوا في /home.

دي أول حاجة تثبت إن الموضوع Suspicious.

تاني حاجة: إزاي بيضيف بيكريت يوزر جديد والمفروض في اللوجاية اللي قبل كدا كان بيضيفه لجروب (يعني المفروض موجود عشان يضيفه)؟؟

الفكرة إن نظام اللوجات بتاع الـ syscall اللي اسمه auditd مبيسجلش نواتج (يعني نجح الكوماند ولا لا)، فهننقل اللوجاية التالتة يمكن نفهم.

#### اللوجاية التالتة

</div>

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

<div class="rtl-content" markdown>

يعني انقلي اليوزر اللي كريتناه sudo.

طيب هيعمل كدا ليه إلا لو أصلاً مكنش اول لوجاية اشتغلت؟ يبقى اول كوماند خالص مكنش اشتغل

التفسير اللي كتبته إن دا حاجة مش مفهومة، لكن المحتمل الاتاكر غلط مش أكتر.

#### اللوجاية الرابعة

</div>

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

* src\_ip: 203.0.113.120 → IOC IP External
* dst\_ip / dst\_port: JUMP

<div class="rtl-content" markdown>
الـ msg بتقول إن في SSH Connection حصل على بورت 51112 لـ IP External بـ publickey.

طبعاً إن يوزر يتكريت حالاً وبعدين يطلع IP خارجي، كدا تم إثبات إن الحوار Suspicious.

طبعاً بتحط الـ IP على CTI بس طلع Clean، ودا منطقي عشان دا مجرد Simulation Attack لتشالنج مش حقيقي.

---

### الـ IOCs الحالية

عندنا دلوقتي 2 IPs كـ IOCs مهمين لازم نفهم الدنيا حواليهم:

1. 10.20.20.10 اللي بدأ منه كريت اليوزر وعرفنا إنه DOCKER-01
2. 203.0.113.120 اللي بدأنا نشك بيه لأن اليوزر اللي اتكريت طلع عليه Connection

وكمان نسيرش عن JUMP دا نشوف اللوجز عليه والتتابع عامل إزاي.

---

### نبدأ بـ JUMP-01 (10.20.40.10)

نبدأ بـ 10.20.40.10 ونأخده كـ src ip عشان نفهم هو وصله الاتاكر من الأول إزاي، ونسيرش في نفس سكوب الـ Alert في الدقيقتين 14–15 (وبالذات قبل وقت كريت اليوزر عشان نفهم إيه اللي حصل قبلها، بس منخرجش من السكوب).

هتلاقي لوجات كتير، ولكن لو ركزنا على السكوب بتاع الوقت

![](https://cdn-images-1.medium.com/max/1000/1*ga_an40hYO5cjw0uWBRa7w.png)

![](https://cdn-images-1.medium.com/max/1000/1*v0O2br6j0cjh4WAbzJOrdw.png)

![](https://cdn-images-1.medium.com/max/1000/1*YxgFH1KvLyd6b2NdFBsvaQ.png)

![](https://cdn-images-1.medium.com/max/1000/1*wFV9XQTwXCA4xSfGp2dAeg.png)

قبل كريت اليوزر علطول.

![](https://cdn-images-1.medium.com/max/1000/1*ga_an40hYO5cjw0uWBRa7w.png)

منطقي الجهاز DOCKER-01 هيكريت كونكشن الأول ونجح فعلاً، أمال كريت اليوزر بعد كدا إزاي؟

بعد كدا اللوجات بتاعة كريت اليوزر اللي شرحناهم.

![](https://cdn-images-1.medium.com/max/1000/1*0UVbQdfrTsh_DRnkvqBK9A.png)

بعد كدا هنلاقي كام واحدة مهمين بعد كريت اليوزر الجديد علطول.

### اللوج الأول: إنشاء الخدمة
</div>

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

* src\_ip: 0.0.0.0 → معناها كوماند على نفس الجهاز
* dst\_ip: 10.20.40.10 → JUMP-01

<div class="rtl-content" markdown>
و Created symlink يعني اعملي خدمة باسم system-update.service وحطها في ملف /etc/systemd/system.

### اللوج التاني: كتابة ملف الخدمة
</div>

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

<div class="rtl-content" markdown>
تمت كتابة ملف الخدمة.

طيب يا ريم ممكن خدمة عادية؟

لا، الخدمات العادية للنظام بتكون في باث /lib/systemd/system/.

طيب يا ريم ممكن أدمن كريت خدمة.. ممكن.

بعدها بثواني..

### اللوجاية التالتة: DNS Query
</div>

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

* src\_ip: 10.20.40.10 = JUMP-01. اللي عرفناه قبل كدا
* dst\_ip: 10.20.40.53 مين دا؟
* status: NOERROR تم بنجاح

<div class="rtl-content" markdown>
اللوجاية بتقول إن 10.20.40.53 خلا الجهاز بتاع JUMP-01 يطلع DNS Query على cdn-sync-update.com.

نسيرش باللينك اللي طلع عليه على VT مثلاً

![](https://cdn-images-1.medium.com/max/1000/1*RvveWJDY-Z53i7eRGwbaKg.png)

ملقيناش حاجة ودا طبيعي زي ما قلنا عشان Simulation، لكن دا اللي المفروض يتعمل في الحقيقة، ولو طلع Malicious بنعمل Containment فوراً.

طب مين 10.20.40.53؟ نسيرش بيه كأنه src ip عشان نفهم (هو Internal يعني معانا في الشركة فنقدر نعرف مين دا).

![](https://cdn-images-1.medium.com/max/1000/1*Z3Iz8pd_B7JKj40xx1ghzQ.png)

بالظبط دا DNS Server الشركة (ملناش دعوة باللوج، ركز في الوقت الله يباركلك).

طيب معانا cdn-sync-update.com كـ IOC أكيد، فلما نجرب نسيرش بيه في الـ SIEM عشان نعرف هل في أجهزة تانية طلعت على الـ URL دا تتعمل لها Containment لو تم تأكيد إنها Malicious.

---

### السيرش عن 203.0.113.120

طيب معانا كان IOC تاني، فاكره؟ الـ External IP. نسيرش بيه 203.0.113.120،

![](https://cdn-images-1.medium.com/max/1000/1*HLKK_WgB8EJA5nd6g3CWVg.png)

طلعلي 3 لوجات، نشوفهم.

### اللوج الأول: Zeek
</div>

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

* source: zeek — أداة مراقبة الشبكة.
* event: CONN — حدث = اتصال شبكي.
* process: systemd — مدير النظام والخدمات في لينكس
* src\_ip: 10.20.40.10 — JUMP-01.
* dst\_ip: 203.0.113.120 — خارجي
* dst\_port: 443 — HTTPS.
* status: SF — Success + Finished

<div class="rtl-content" markdown>
اللوجاية بتقول فتح اتصال TLS مع cnd-sync-update.com، أيوه بالظبط هو اللي كان معانا فوق، واستخدم systemd عشان يطلع بيها على الـ C2.

هو استخدم الـ DNS الشركة بعدين طلع Public على الـ IP.

### اللوج التاني: Firewall

طب إيه تاني log؟
</div>

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
<div class="rtl-content" markdown>

* nftables: أداة Firewall في Linux.

الفاير وول وافق الكونيكشن C2 attack.

### اللوج التالت

واللوجاية التالتة كانت

![](https://cdn-images-1.medium.com/max/1000/1*hb88vAGFeHuK06MQ9-e1Cg.png)

أيوه بالظبط دي اللي شوفناها في الأول خالص مع اليوزر الجديد.

---

### سؤال جديد: جاب الـ Public Key منين؟

بس في سؤال جديد هنا: طيب اتأكدنا دلوقتي إن اللي بيحصل دا ممكن احتمال كبير Attack (متأكدناش عشان مفيش Reputation واضحة للـ IOCs).

هو لما هو اتاكر و External IP وبتاع، جاب منين الـ Public Key عشان يعمل الكونيكشن؟ (أه موجود Public للكل بس للـ Internal Network بس).

فاكر في الأول خالص أول لوج كانت الـ src ip إيه؟ كان 10.20.20.10 وسرشنا عليه وطلع DOCKER-01.

ما نسيرش بيه تاني نفهم أكتر المرادي؟ في سكوب الوقت برضو يعني خمس دقايق قبل وبعد.

فنكمل سيرش مثلاً من قبل في وقت الكونيكشن على الجهاز JUMP اللي كان في حدود الدقيقة 13 اللي كان في الأول اللي كانت بالـ Public Key

![](https://cdn-images-1.medium.com/max/1000/1*4ad0iWdQhjAZHgPlpA4_tg.png)

اللي هي اللوجاية دي، نبدأ من هنا نشوف اللوجز اللي قبله إيه اللي حصل واحدة واحدة.

هكتبلكم الماسدج بتاعة اللوجز بس:
</div>

```
"msg": "query packages.ubuntu.com A 10.20.40.53"
"msg": "audit: write /var/lib/app/config.json"
"msg": "container create name=debugger image=alpine:3.20"
"msg": "Notice A Privileged Container Was Started"
"msg": "Notice container mounted host filesystem"
"msg": "type=EXECVE nsenter -t 1 -m -u -i -n -p /bin/bash"
"msg": "type=PATH name=/etc/shadow"
```

<div class="rtl-content" markdown>
طيب أول واحدة وهي:

“msg”: “query packages.ubuntu.com A 10.20.40.53”

ودي حاجة Legit بيبحث عن تحديثات والموقع صحيح فعلاً، يبقى دي برا السكوب اللي شاكين فيه، نشوف اللي بعد كدا.

طب بعد كدا؟ أكدب عليكم؟ أنا حطيتهم على Gemini لأن معنديش خبرة أوي في الدوكر ولينكس، بص كدا قال إيه:

![](https://cdn-images-1.medium.com/max/1000/1*PGSdoTtqBtlcVXGpxYTjGw.png)

طب بص قال إيه في الآخر :))

![](https://cdn-images-1.medium.com/max/1000/1*eJFhZZs6VBlq7bNtmt9JyQ.png)

وبعدها علطول لوجاية الكونكشن فاكرها؟

طيب ما تيجي نفهم التكنيك دا أكتر؟

### تفسير التكنيك (Container Escape)

“msg”: “audit: write /var/lib/app/config.json”

ليه يوزر عادي هيعدل أو يكتب ملف Configurations؟

“msg”: “container create name=debugger image=alpine:3.20”

وبعدين كريت كونتينر باسم debugger مش غريب شوية؟

“msg”: “Notice A Privileged Container Was Started”

وعملها Privileged لكل حاجة يعني روت من الآخر.

“msg”: “Notice container mounted host filesystem”

وقامت عاملة Mount يعني التسلط على الفايل سيستم الأساسي للجهاز الهوست نفسه!

“msg”: “type=EXECVE nsenter -t 1 -m -u -i -n -p /bin/bash”

* -t 1 يعني العملية المستهدفة PID 1 يعني من عمليات الروت
* -m يعني بياخد أكسيس على بروسيس اسمه namespace اللي مسؤول عن توزيع الـ Virtual Address للبروسيس على الهوست نفسه، يعني شايفه كل حاجة على الهوست وغير الهوست حرفياً، يعني أكسيس على الميموري وكل حاجة من الآخر
* -n يعني بيأكسس على نظام الشبكة، يعني النتورك الأساسية للجهاز
* -p يعني بيشوف كل البروسيسز الموجودة حرفياً على الهوست
* /bin/bash يعني Terminal Shell دي الوحيدة اللي عارفنها

“msg”: “type=PATH name=/etc/shadow”

طبعاً بيأكسس على ملف هاش باسوردات كل اليوزرز.

التكنيك برقم T1611 على MITRE.

والتول الي كشفت اللوجات دي كانت falco اداه لمراقبه شبكه الكونتينرز على دوكر

وطبعاً هنا عرفنا جاب منين الـ Public Key وكل حاجة عموماً لانه خلاص وصل للميموري من خلال namespaces operation

---

### طب ازاي دخل Docker؟

طب ماشي بس إزاي برضو دخل لـ Docker؟

مين اليوزر اللي عمل الكومندات دي طيب؟ هتلاقي كلهم بعد عمل الكونتينر اليوزر في اللوجز اسمه root، بس مين اللي في وقت عمل الكونتينر

![](https://cdn-images-1.medium.com/max/1000/1*mgl1BCnYoOGPPGd3fvDFaA.png)

اليوزر كان اي ؟ www-data نسيرش بيه ممكن نوصل لحاجة؟

![](https://cdn-images-1.medium.com/max/1000/1*GNysw5Qo9lvQv21knvyP_w.png)

لسه يدوب بجيب سكوب الوقت لقيت worker.py وليلة سعتك.. ليه فيه سكربت بايثون مخفي؟

مخفي إزاي عرفتي منين؟

```
"msg": "type=EXECVE python3 /tmp/.cache/worker.py"
```

و.cache دا ملف الكاش المخفي في لينكس والنقطة يعني الملف مخفي

فليه حد هيخبي سكربت هناك؟

```
</div>

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

* event: FILE\_WRITE — اكتب فايل
* process: python3 — سكربت بايثون
* parent\_process: nginx — سيرفر الويب اللي عمل كدا (الكونتينر)
* dst\_ip: 10.20.10.20 — هوست جديد هنسيرش عنه بعدين
* status: success — نجح

و health.php,O\_CREAT|O\_WRONLY يعني كريتلي ملف اسمه health.php وافتحه اكتب فيه.

/var/www/html/uploads/.cache/health.php ودا المسار في ملف الهاش المخفي.


<div class="rtl-content" markdown>
هنا اتاكدنا ان دا اتاك صريح فا بنعمل كونتينمنت لكل ال hosts الي عدينا عليها لحد دلوقتي (لو بنتكتلم في الواقع وملقيناش reputation لاي حاجه)

---

### السيرش عن الهوست 10.20.10.20

طب هل في حاجة تانية؟ نسيرش بالهوست يمكن نفهم؟ 10.20.10.20

قبل اللوجاية بتاعة worker.py اللي فوق لقيت لوجاية.

الـ IP دا 203.0.113.77 عمل طلب تحميل برنامج حجم 18433 بايت يعني 18 كيلو ودا طلب كبير شوية يكفي لسكريبت، وحمله من خلال سكريبت بايثون.

بس لقيت بعدها علطول:
</div>

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
  "uri": "/uploads/.cache/health.php?cmd=id"شغله,
  "http_method": "GET",
  "http_status": "200",
  "protocol": "tcp",
  "msg": "method=GET host=web01 uri=/uploads/.cache/health.php?cmd=id status=200"
}
```

* src\_ip: 203.0.113.77 — External IP الجديد

<div class="rtl-content" markdown>
من الآخر الاتاكر هنا رفع ملف الـ PHP في فولدر ال uploads في الكاش المخفي وشغله بـ cmd.

واللوجاية اللي قبلها وآخر لوج منطقية معانا وهي:

![](https://cdn-images-1.medium.com/max/1000/1*aTJ4XimJlcAlCOo-oou9qg.png)

قدر يعمل كونيكشن من خلال HTTPS ونجح.

---

### آخر IOC: 203.0.113.77

فاضل بس آخر IOC عشان نكون عملنا اللي علينا، نسيرش عن 203.0.113.77.

لقينا محاولات Access على أجهزة شبكة الشركة

![](https://cdn-images-1.medium.com/max/1000/1*255kfOjh2hptJ-bsunoavw.png)

بس كلها محاولات قديمة جداً فواضح إنها Noise.

وكدا الخط اتسد بعد ما سرشنا عن كل حاجة.

---

### طيب إيه التايم لاين بتاع الأتاك بعد التوهة دي كلها؟

### 07:13:04 اتصال المهاجم بـ WEB-01

المهاجم (عنوانه 203.0.113.77) فتح اتصال HTTPS مع السيرفر WEB-01 الي هو 10.20.10.20 على البورت 443. ده أول اتصال في السلسلة، وده اللي بدأ كل حاجة. لسه مفيش حاجة غلط، مجرد اتصال عادي من بره.

### 07:13:08 رفع ملف خبيث عبر /api/v1/upload

بعدين المهاجم بعت طلب POST على مسار /api/v1/upload وده معناه إنه رفع ملف. الملف حجمه 18,433 بايت، والـ User-Agent بتاعه python-requests/2.31.0 يعني مش متصفح عادي، ده برنامج بيشتغل أوتوماتيك. الرد كان 200 يعني الرفع نجح. ده أول مؤشر على استغلال ثغرة في خاصية رفع الملفات.

### 07:13:11 تشغيل worker.py

بعد الرفع بـ 3 ثواني، nginx (سيرفر الويب) شغّل ملف اسمه worker.py موجود في /tmp/.cache/. ده مش طبيعي لأن nginx عادةً مابيشغلش Python مباشرة. ده معناه إن الملف اللي اترفع خلّى nginx ينفذ كود.

### 07:13:13 إنشاء Web Shell (health.php)

و worker.py (اللي اشتغل) كتب ملف جديد اسمه health.php في المسار /var/www/html/uploads/.cache/. لاحظ إنه في مجلد مخفي .cache جوه مجلد uploads وده مكان مش طبيعي لملفات PHP. الملف ده هو الـ Web Shell اللي هيسمح للمهاجم ينفذ أوامر.

### 07:13:19 تنفيذ أمر id عبر Web Shell

بعدين المهاجم طلب الملف health.php وحط معاه parameter اسمه cmd=id. ده معناه إنه عايز ينفذ أمر id على السيرفر. الرد كان 200 وحجمه 512 بايت، يعني الأمر اتنفذ ورجع نتيجة. ده تأكيد إن الـ Web Shell شغال.

### 07:13:30 إنشاء حاوية Docker مميزة على DOCKER-01

هنا بقى على جهاز تاني اسمه DOCKER-01، المستخدم www-data (نفس اللي كان على WEB-01) أنشأ حاوية Docker اسمها debugger باستخدام صورة alpine:3.20. الأمر كان: docker run -d — privileged -v /:/host alpine:3.20. كلمة — privileged معناها الحاوية دي عندها صلاحيات كاملة، و -v /:/host معناها إن نظام ملفات الجهاز الأصلي (الهوست) مربوط جوه الكونتينر

### 07:13:35 يكشف ربط نظام ملفات المضيف

اداه Falco كمان كشفت إن الحاوية ربطت نظام ملفات الهوست. الأمر اللي اتنفذ جوا الكونتينر كان mount -t proc proc /host/proc وده معناه إنها بتحضر عشان تدخل على الهوست.

### 07:13:40 الهروب من الحاوية عبر nsenter

بعدها المهاجم استخدم أمر nsenter عشان يدخل على namespaces بتاعت العملية رقم 1 (PID 1) على المضيف. الأمر: nsenter -t 1 -m -u -i -n -p /bin/bash. ده معناه إنه خرج من الكونتينر ودخل على الجهاز الأصلي نفسه. بقى عنده shell على اللهوست.

### 07:13:45 قراءة /etc/shadow

بعد ما هرب من الكونتينر، المهاجم قرأ ملف /etc/shadow اللي فيه كلمات المرور المشفرة لكل المستخدمين على الجهاز. ده خطر كبير لأن أي حد يقدر ياخد الملف ده ويفك التشفير بعدين.

### 07:13:56 SSH ناجح للمستخدم deploy إلى JUMP-01

بعد كدا المهاجم دخل على جهاز تالت اسمه JUMP-01 (وهو الباستيون — بوابة الدخول للشبكة) باستخدام حساب اسمه deploy. الدخول كان من عنوان DOCKER-01 (10.20.20.10) باستخدام مفتاح SSH (publickey). ده معناه إنه قدر يتحرك جانبيًا من DOCKER-01 للباستيون.

### 07:14:01 محاولة usermod (فشلت)

المهاجم (بحساب deploy) حاول ينفذ أمر sudo usermod -aG sudo svc\_sync عشان يضيف مستخدم اسمه svc\_sync لمجموعة sudo. بس المحاولة فشلت لأن المستخدم svc\_sync لسه ما اتعملش. عرفنا إنها فشلت لأن مفيش حدث GROUP\_CHANGE في الوقت ده، وكمان لأن بعدها بـ 3 ثواني حصل useradd.

### 07:14:04 إنشاء svc\_sync

بعدها المهاجم أنشأ المستخدم svc\_sync بأمر useradd. المستخدم ده له UID 1042 و home directory في /opt/svc\_sync (مش /home). ده تمويه عشان يبان كأنه خدمة نظام مش مستخدم عادي.

### 07:14:08 إضافة svc\_sync إلى sudo

المرة دي نجح الأمر usermod -aG sudo svc\_sync و svc\_sync بقى عضو في مجموعة sudo. ده معناه إن المستخدم ده بقى عنده صلاحيات إدارية (يقدر يعمل كل حاجة كأنه root).

### 07:14:13 تفعيل system-update.service

بعد كده المهاجم فعّل خدمة systemd اسمها system-update.service باستخدام systemctl enable. ده عمل symlink عشان الخدمة تشتغل تلقائيًا مع كل مرة الجهاز يعمل boot. ده نوع من أنواع الـ Persistence

### 07:14:16 كتابة ملف الخدمة

المهاجم كتب ملف الخدمة نفسه في /etc/systemd/system/system-update.service باستخدام cat >. الملف ده فيه تعليمات الخدمة، وأهم حاجة فيه ExecStart اللي بيقول الخدمة هتنفذ إيه. للأسف محتوى الملف مش موجود في اللوجز.

### 07:14:28 استعلام DNS لـ cdn-sync-update.com

جهاز JUMP-01 سأل الـ DNS عن عنوان النطاق cdn-sync-update.com. ده نطاق غريب ومش معروف، ومش نطاق داخلي. ده أول مؤشر على إن فيه اتصال بـ C2 (سيرفر تحكم) هيحصل.

### 07:14:34 اتصال C2 بـ 203.0.113.120:443

بعدين جهاز JUMP-01 فتح اتصال TLS مع العنوان 203.0.113.120 على البورت 443. العملية اللي فتحت الاتصال هي systemd، يعني الخدمة اللي اتعملت قبلها بـ 18 ثانية هي اللي بتعمل الاتصال. الـ SNI كان cnd-sync-update.com. ده تأكيد إن الخدمة دي هي C2 beacon.

### 07:14:42 جدار الحماية يسمح بالاتصال

جدار الحماية (nftables) سجل إنه سمح بالاتصال الصادر ده. ده تأكيد إضافي إن الاتصال حصل فعلاً ووصل.

### 07:14:50 Wazuh يطلق التنبيه

وبعدها نظام Wazuh أطلق تنبيه بخطورة عالية (HIGH) برقم 5712. التنبيه ده جه بعد 106 ثانية من بداية الهجوم، وده متأخر يعتبر

### 07:15:02 SSH ناجح لـ svc\_sync من 203.0.113.120

بعدها المهاجم دخل على JUMP-01 باستخدام الحساب svc\_sync من العنوان الخارجي 203.0.113.120 (نفس عنوان الـ C2). ده معناه إنه نجح في إنه يعمل backdoor ويدخل من بره. وده آخر حدث في السلسلة المسجلة.

وبس كدا !

ان اصبت فهو من عند الله وان اخطات فهو من نفسي والشيطان :)

</div>