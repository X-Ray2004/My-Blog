---
date: 2026-09-18
---
<div class="rtl-content" markdown>
 
# من EarthTime إلى MSBuild: تشريح هجوم بثلاث عصابات فدية في ظل التخفي
<!-- more -->

DFIR Report، من برنامج EarthTime المزيّف وحقن MSBuild إلى SectopRAT وSystemBC وBetruger، مع ملاحظات تحليل ثابت للعينات.

---

بسم الله، حوار وجريمة في نفس الوقت — جديدة في الـ Cyber Security.

مقال قرأته لـ attack معقد على DFIR Report، خد مني خمس أيام عشان أفهمه بس، وأضعافهم عشان أشرح الريبورت. فا ركز معايا :)

مش Investigation على قد ما هو نفهم الـ attack chain حصل إزاي.

---


### البداية: برنامج مشبوه

![](https://miro.medium.com/v2/resize:fit:875/1*Gvk3OjsB59OIjqIwzQMUHQ.png)

في سبتمبر 2024 حصل attack لشركة ما، واتصلوا بـ DFIR Report كـ third party عشان لقوا unusual behavior مش فاهمينه. بس الريبورت مكنش موضح إيه اللي خلى الشركة تتصل بالظبط أو إنها تشك إن في attack، لكن في شوية حاجات الريبورت اتكلم عنها ممكن تكون هي السبب: زي إن كان في كام event log من Sysmon فيها process access على create remote thread، على كام alert rule Suricata لـ external connection، على كام Sigma rule اكتشفت RDP لجهاز مش من الشركة، وtools، وActive Directory access — وحوار كبير بيقولك أنا لو منهم بتوع الـ IT وال Security، الحق أستقيل.

المهم، اللي حصل إن في برنامج اسمه EarthTime — ده برنامج عادي. الـ IT admin لقاه في download folder (المقال مذكرش أي حاجة عن الـ delivery step). برنامج بيحسب فرق التوقيت بين الدول، والشركات تعرفه. فا الأدمن ده فتح البرنامج عادي. طب عرفنا منين؟ زي الجريمة اللي فاتت اللي شرحناها، كان الـ parent process لها explorer، فا عرفنا إن الموظف فتح البرنامج ومشتغلش لوحده.

شوية وظهر child process لـ cmd.exe. بسم الله، ببص في اللوجات بتاعته سيسمون، ملقيتش command.

يعني إيه؟

### Sysmon Event ID 8 (CreateRemoteThread)

وكمان مش مرتبط بملفات DLL لأي كومبايلر.

(لأن بعض الأنتي فايرس بيعملوا CreateRemoteThread عادي، بس الفكرة إنها مرتبطة بـ DLL معروف — مش زي دي، بدون DLL.)

يعني هو كده بس cmd بدون command، مفيش أي حاجة اشتغلت كده.

```
Event ID: 8
SourceImage: C:\Users\...\EarthTime.exe
TargetImage: C:\Windows\SysWOW64\cmd.exe
NewThreadId: [...]
StartAddress: [عنوان ذاكرة مش مرتبط بأي DLL معروف على القرص]
```

وبعدها child process (كل ده بنتتبعه بالـ process ID) اسمها MSBuild.exe — بدون command أو arguments هي كمان.

هي legit tool عادي بتستخدمها Visual Studio عشان تعمل compile للكود.

يعني الـ child ده cmd بدون command، والتول دي MSBuild اللي هي child الـ child، بدون كود كمان... ممم.

```
EventID: 10
SourceImage: C:\Windows\System32\cmd.exe
TargetImage: C:\Windows\Microsoft.NET\Framework\v4.0.30319\MSBuild.exe
GrantedAccess: 0x1FFFFF          ← صلاحيات كاملة
CallTrace: ... UNKNOWN ...   ← مؤشر قوي على Injection
```

---

### ليه MSBuild؟ عبقرية في التمويه

طب دلوقتي يا ريم، أنا عندي معلومة إن MSBuild بيشتغل مع cmd عادي، لأنه مربوط بكومبايلر بيرن الكود من terminal.

وكمان أعرف إنه عادي يشتغل بدون compiler كمان، لأنه بيشتغل compiler في ذات نفسه.. ليه فرضتِ إنه Suspicious؟

إنتِ صح.

بس أصلًا ده سبب استخدام الـ Attacker له، وكمان له technique في MITRE:

> T1127.001 – Trusted Developer Utilities Proxy Execution: MSBuild

الفكرة إن MSBuild بيدعم حاجة اسمها inline tasks — يعني تقدر تكتب كود C# جوه ملف الـ project XML نفسه، يعني MSBuild هيقوم بعمل compile ويشغل الكود ده في الـ RAM مباشرة، على عكس الطبيعي إن أي كومبايلر بيعمل ملف .exe منفصل على القرص وبعدين بيرنه.

شكل كوماند لـ MSBuild:

```
MSBuild.exe MyProject.csproj /p:Configuration=Release
```

يعني بيتنفذ مع اسم ملف المشروع (project file) كـ argument — لازم يكون عارف يبني إيه بالظبط.

بس الفكرة اللي حصلت في الحادثة دي إن MSBuild.exe اشتغل من غير أي arguments خالص.

التفسير الوحيد إنه ما رنش كود Malware — لا، ده هو أصلًا الـ Malware!

وهو استخدم التول دي بالذات عشان تيم السوك يفتكروا usual behavior عادي — لأن خلاص عادي جهاز IT admin عنده inline tool بيستخدمها.

---

### نعيد تاني: سلسلة الحقن

من EarthTime → cmd بيتم injection.

وبرضه cmd → MSBuild بيتم injection.

يعني بالظبط زي ما جه في بالك — في كود بينقلوه من بعض.

بينفذ EarthTime.exe الخطوات دي:

1. يستدعي CreateProcess() لتشغيل cmd.exe في وضع SUSPENDED
2. يستخدم VirtualAllocEx() يحجز مساحة جوه ذاكرة cmd.exe
3. يستخدم WriteProcessMemory() يكتب كود المالوير (SectopRAT) جوه المساحة دي
4. يستخدم CreateRemoteThread() أو SetThreadContext() + ResumeThread() عشان يشغّل الكود المزروع جوه cmd.exe

بعدين cmd.exe (اللي لسه حاقنينه) ينفذ:

1. CreateProcess() لتشغيل MSBuild.exe في وضع SUSPENDED
2. VirtualAllocEx() على ذاكرة MSBuild
3. WriteProcessMemory() يكتب نفس كود المالوير SectopRAT (أو نسخة منه) جوه MSBuild
4. يشغّل الكود المزروع — المالوير يعني

---

### طب هو إيه المالوير ده اللي بينقلوه؟

فريق الـ DFIR بيقولك إنه بحث عن reputation الـ hash بتاع EarthTime، لقوه مالوير اسمه SectopRAT.

إنتِ قولتِ فوق إنه برنامج عادي والناس بتحمله.

لا لا، ركز، عشان أنا فضلت هنا يومين.

المالوير متسمي باسم البرنامج العادي.

وإحنا عارفين إن الـ Malware بتتسمى بأسماء برامج من زمان، لكن مش هو البرنامج الأصلي.

معلومة الريبورت ذكرها فاجأتني: إن البرنامج ده مكنش عشوائي إطلاقًا — البرنامج أصلًا الأصلي كان فيه ثغرة خطيرة.

البرنامج لما بينزل بيطلب تحميل شوية مكتبات عشان يشتغل. فا بيجي معاه فايل الـ requirements.txt اللي فيه أسماء المكتبات. فا لما تشغل البرنامج بيحمل تلقائي المكتبات دي.

الثغرة إن البرنامج مش بيحمل الـ requirements بس — ده بيحمل أي حاجة ينفع تتحمل في الدايركتوري اللي هو فيه :))

يعني لو في اسم للعبة FitGirl وليها كوماند في الملف، هيحملها عادي.

طيب وده إيه علاقته بالمالوير بتاعنا؟

الفكرة إن الـ Attacker استغل اسم برنامج فيه ثغرة أصلًا عشان يتوه تيم السيكيورتي لما يعمل investigation. فا عقبال ياخدوا بالهم زي ما إنت فكرت يا صديقي في الأول إن الـ Attacker استغل الثغرة —

لا، ده محصلش. ده هو أصلًا مش البرنامج أساسًا، ده مالوير باسمه بس.

فا عقبال ما ياخدوا بالهم يكون خلص الـ attack chain.

توهاندرد آي كيو بقولك.

---

### نرجع لقصتنا: الـ Custom Packing

المهم، نرجع لقصتنا بعد ما عرفنا إن ده حقن في ده حقن في ده.

بيقولك إن محتوى المالوير اللي في EarthTime — اللي هو SectopRAT — كان packed أصلًا، وكان custom packers مبنية خصيصًا بواسطة كاتب الـ malware نفسه (وده الأرجح في حالة SectopRAT، لأن الـ packer المعمول مبني ليدمج مع تقنية الحقن في MSBuild تحديدًا — هتعرف تحت يعني إيه). (Packed يعني متشفر بطريقة متعرفش فيها كود المالوير إيه.)

وعمّال ينقله في الـ processes دي packed برضو.

### طب أمال اشتغل إزاي؟

بيقولك أول ما EarthTime ده اشتغل، خد جزء من المالوير عمله inject في cmd.exe اللي شرحناها فوق، وخد نسخة منه على %AppData%\\Local\\Temp ملف باسم \\bhnwcwgaphpge.

### طب ليه النسخ دي كلها؟

ده نمط شائع في المالوير الجديد — technique على MITRE:

> T1027.002 – Obfuscated Files or Information: Software Packing

إن لما MSBuild بيشتغل، بيروح يفك الـ packed بتاع bhnwcwgaphpge عشان يشغله :)) (إحنا قولنا إن المالوير packed)

عرفت ليه custom packed؟

---

### هنا يبدأ الاتاك الفعلي: Dead Drop Resolver

وهنا بسم الله يبدأ الاتاك الفعلي: بيتصل بـ https://pastebin.com/raw/XK7ARdVw عشان يجيب إعدادات الـ C2.

يعني MSBuild.exe مش بيتصل مباشرة بالـ C2 من أول لحظة — بيروح الأول لصفحة على Pastebin (موقع شرعي مش محجوب)، وياخد منها إعدادات الـ C2 الحقيقي، بعدين بيتصل بـ C2 45.141.87.55.

الفايدة: لو الـ C2 IP اتغير، المهاجم بس يعدل محتوى صفحة Pastebin بدل ما يعدل في كود الـ malware نفسه، وده تقنية اسمها Dead Drop Resolver.

تاني اللي بيحصل إن MSBuild.exe بيقرأ ملف bhnwcwgaphpge من الـ Temp، بيفك الـ packer في الميموري، بعدين بيتصل بـ Pastebin عشان يجيب إعدادات الـ C2، بعدين بيتصل بالـ C2 الحقيقي (45.141.87.55).

تعبت طبعًا. والله وأنا.

ده كله عشان يعمل evasion محترم للـ EDR والأنتي فايرس — وهو نجح فعلًا.

---

### الـ Persistence: هوية جديدة

بيقولك برضو المقال، عشان الـ persistence، البرنامج ده برضو (EarthTime، اللي اتفقنا إنه مالوير) — بعد كل النسخ اللي عملها دي، خد نسخة خامسة منه برضو في C:\\Users\\<اسم\_المستخدم>\\AppData\\Roaming\\QuickAgent2 باسم ChromeAlt\_dbg.exe.

قال يعني قوقل وكده يعني.

طب نسخ إزاي واتحرك ما بين الـ Directories؟ مش كنا في الـ Download؟

استخدام خدمة اسمها BITS (Background Intelligent Transfer Service).

BITS خدمة ويندوز شرعية 100% بتستخدمها مايكروسوفت نفسها عشان تنزل التحديثات في الخلفية. المهاجم استخدمها عشان ينقل الملفات من غير ما يبان كنسخ عادي في اللوجات.

واستخدمها كمان عشان يعمل نسخة سادسة برضو في startup shortcut، بالظبط لما الجهاز يفتح يشتغل على طول — باسم ChromeAlt\_dbg.lnk.

شغل هكر هكر يعني، بأمانة.

اللي حصل بعد كده متوقع أكيد، الريبورت استفاض فيه بشكل معقد جدًا جدًا، هحاول إني أبسطه.

---

### نرجع لـ MSBuild.exe: الاستكشاف وأدمن جديد

نرجع لآخر نقطة في الباث بتاعنا وهو MSBuild.exe.

بعد الـ C2، MSBuild.exe الأول نفذ discovery: hostname, ipconfig, nslookup. ريكون يعني.

بعدين نفذ:

```
net user Admon Qwerty12345! /add
```

فاكرين لما قولنا إن الضحية أصلًا كان IT admin، يعني له صلاحيات يضيف usr ويحذف usr.

هو بقا عمل لنفسه أكونت admin وضافه للـ local admin:

```
C:\Windows\system32\net1  user Admon Qwerty12345! /add
C:\Windows\system32\net1  localgroup Administrators Admon /add
```

سماه "Admon" — فن اختيار الأسماء.

وقام كتب ملف اسمه WakeWordEngine.dll على المسار C:\\Users\\Public\\Music\\WakeWordEngine.dll.

المقال موضحش أي logs في الجزء ده، بس قال إن كان في event File Creation.

بعد ما الملف اتكتب، المهاجم شغله بالكوماند ده:

```
rundll32.exe C:\Users\Public\Music\WakeWordEngine.dll,Reset
```

حمّل الـ DLL في الميموري ونادى على الدالة Reset بتول اسمها rundll32.exe — وهي تول شرعية عادي بتشغل الـ DLL عمومًا.

---

### مالوير تاني: SystemBC

طب Reset دي إيه؟

دي فانكشن في تاني مالوير معانا.

مالوير تاني؟ آه، قالوا اسمه SystemBC، مستخبي في اسم WakeWordEngine.dll.

ظهر مع المحققين بعد ما عملوا YARA rules scan على الميموري، واتضح إنه مالوير اسمه SystemBC.

بمجرد ما rundll32 نادى على دالة Reset، SystemBC بدأ يشتغل وعمل الآتي:

* اتصل بالـ C2 التاني بتاعه: 149.28.101.219:443
* ومن الأكونت الجديد بتاع "Admon"، فتح نفق Proxy/Tunnel بين جهازه (جهاز الاتاكر من برا) والأجهزة المصابة جوه الشبكة

الاتاكر بقى يقدر يعمل RDP على أي جهاز داخلي كأنه قاعد جوه الشبكة، من غير ما يظهر كاتصال خارجي مباشر.

ده اللي خلّى نمط اللوجات يظهر كده:

> Logon Type 3 (Network) وبعده مباشرة Logon Type 10 (Remote Interactive)

### غلطة المهاجم

بس كان في خطأ شنيع للأسف في الـ proxy ده.

كل مرة حد بيعمل اتصال RDP لجهاز تاني، جلسة الـ RDP بتنقل معاها معلومة اسمها "Client Name" — يعني اسم الجهاز اللي بيبدأ منه الاتصال، اللي هو جهاز الاتاكر نفسه (مش الجهاز المستهدف). وده سلوك طبيعي أصلًا في بروتوكول RDP، مصمم أساسًا لأغراض إدارية (زي معرفة مين بيتصل بجهازك عن بعد).

المشكلة (من منظور المهاجم): بما إن الاتصال بيعدي عبر الـ SystemBC proxy tunnel، المهاجم افتكر (أو مكنش واخد باله) إن اسم الجهاز الحقيقي بتاعه (جهازه الشخصي أو الـ VM اللي بيشتغل عليه) بيتسرب مع كل اتصال، رغم إنه بيستخدم proxy عشان يخبي مكانه الجغرافي/الشبكي.

فا إيه اللي حصل بقا — ظهر اسم جهاز الاتاكر، وكل الأجهزة اللي شاركوا في الاتاك ده على مدار الـ attacks:

* DESCTOP-QPITRY (الجهاز الأساسي والأول في الاتاك)
* DESKTOP-A1HRTMJ
* DESKTOP-PGD76HT
* WIN-FLGU1CC210K

بس الفكرة إن ممكن عادي متاخدش بالك، ودي كلها تسجيلات دخول عادية من موظفين الشركة.

إذا كان إنت نفسك مخدتش بالك... من إيه؟

مش عادي IT admin يغلط في شركة في الكتابة.

كتابة إيه؟.. كتابة مالوير؟

لا لا، الكتابة بجد.. كاتب اسم الجهاز DESCTOP-QPITRY :))

فا طبعًا كان الموضوع suspicious كفاية يعني.

---

### DCSync: أخذ كل الـ Credentials

المهم بعد ما فتح tunnel على شبكة الشركة، قام عامل DCSync Attack على الـ domain controller عشان يوصل لكل الـ credentials الباقية.

```
Event ID: 4662
Access Mask: 0x100
Object ID: {1131f6ad-9c07-11d1-f79f-00c04fc2dcd2} = DS-Replication-Get-Changes
```

والـ replication دي من أهم خصائص الـ domain controller اللي بتعمل تزامن نسخ مع باقي domain controllers الشركة في نفس الدومين.

فا الاتاك ده بيخليك إنك تمثل إنك دومين كونترولر في الشبكة، واستخدم الخاصية دي فا خد كل الـ credentials.

وطبعًا كده خد access على كل حاجة حرفيًا، فا عشان يعمل persistence خد نسخة من SystemBC اللي كان على الجهاز المصاب الأولاني باسم WakeWordEngine.dll — فاكرها؟ خد نسخة وحطها على الـ DC باسم conhost.dll.

### إزاي اتنقل؟

باستخدام تول الـ PsExec.exe اللي هي legit tool برضو بترن remote commands. وفتح بيه اتصال هو كمان زي أخوه فوق على C2: 149.28.101.219:443.

---

### استكشاف الشبكة بأدوات شرعية معدّلة

وبس يا بشمهندس، نزّل شوية تولز وبيشتغل الشغل يعني.

أول حاجة استخدم netscan.exe.

هي مش دي legit tool بتفحص النتورك؟

آه، بس الاتاكر عدّل حبة حاجات.

عمل ملف إعدادات للتول دي مخصوص، فيها خاصية اسمها checkwrite — ودي بتفحص وتشوف الـ IPs ومين من الـ usrs اللي عنده صلاحية الـ write.

ودي حاجة طبيعية في الملف العادي أصلًا، بس الفكرة إن في ملف الإعدادات netscan.xml لما الخيار ده بيكون متفعل، التول بتحاول تكتب ملف اختبار اسمه delete.me على الـ C\$ share بتاع الأجهزة اللي بتفحصها.

بتشوف: هل أقدر أكتب ملفات على الجهاز ده ولا لأ؟ فا بتعمل الملف ده تجربة يعني، وبتحطه على الـ C\$ share (المجلد الإداري C\$).

لو نجحت تكتب الملف، فا معناها إن عندها صلاحية كتابة على الجهاز ده.

وده بيعمل لوجاية Event ID 5145 اللي هو "أنا بطلب access" وده طبيعي لأن قولنا بيكتب ملف على فولدر الـ share. وظهرت فعلًا في أول جهاز ضحية بدأنا بيه — فاكره؟

وطبعًا في ملف الإعدادات ده برضو، ربطه بـ PsExec + سكريبتات (newuser.bat, openrdp.bat, start.bat).

عشان الأداة ما تكتفيش بالـ scan، لكن تنفذ أوامر تلقائيًا على الأجهزة اللي بتكتشفها.

ده أسلوب شائع عند الـ Ransomware Affiliates: بياخدوا أدوات شرعية ويعدلوها عشان تناسب شغلهم.

بيقولك فريق الـ forensics بعد الاتاك، لما جه يشوف Output التول دي، لقوا ملف قديم لاسم شركة تانية في ملفات الـ output — الاتاكرز ناسينه بالغلط. فا عرفوا إن الناس دي خبرة ودي مش أول مرة :))

---

### Map كامل للشبكة

المهم إيه تاني اتنفذ على الـ DC؟

sh.exe —
أو اللي المفروض عرفنا بعدين إنها تول بيستخدموها الـ APTs
، بس اسمها SharpHound.
وده اللي أثبته الـ hash reputation
بعد كده لما فحصناه من خلال منصات الـ threat intel.

ودي تول بتعملك map لكل النتورك بتاعتك. جمعت معلومات ضخمة عن الـ Active Directory (يوزرز، جروبات، صلاحيات، sessions...) وعملت 1271 request DNS داخلي.

إيه تاني؟

Adfind.exe — استعلام عن CN=Subnets,CN=Sites,CN=Configuration بيجيب معلومات topology الشبكة.

وكتب شوية سكريبتات تانية هدفها جمع معلومات عن:

* الـ Trusts بين الدومينز
* قائمة الـ Domain Controllers
* أعضاء مجموعة Domain Admins

متنساش إن إحنا قولنا إننا وصلنا لكل حاجة محتاجينها نروح فيها لأي سيرفر.

---

### الـ Backup Server: تدمير شبكة الأمان

فا ننقل على اللي حصل في الـ backup server عشان يدمر أي نسخ احتياطية — عشان المفروض إن الهدف ننفذ ransomware، أو حتى لو هنكتفي بـ data exfiltration، كده كده محتاجين نروحه (الـ backup server).

بعد ما وصله طبعًا بـ RDP، نفذ سكريبت PowerShell لـ Event ID 4104 بيدور على SQL server.

عشان Veeam بتخزن الباسوردات بتاعتها جوه قاعدة بيانات SQL.

### إيه Veeam دي؟

برنامج Veeam (نظام النسخ الاحتياطي) بيحفظ بيانات الدخول (Credentials) اللي بيستخدمها عشان يوصل للسيرفرات والـ shares أسرع بعد كده، في database اسمها VeeamBackup.

يعني السكريبت ده بيدور على Veeam backup.

طبعًا كل الـ passwords أصلًا encrypted، فعمل إيه؟

استخدم ملف فك تشفير نفس السيرفر قبل ما ياخد نسخة. يعني التشفير لازم يتفك على نفس السيرفر لأن الـ key موجود على السيرفر بس.

### Grixba: التول الرايقة

بعد كده شغل تول اسمها Grixba (GT\_NET.exe).

بتستخدم WMI وWinRM (هما legit tools) عشان تجمع معلومات عن كل حاجة:

* اليوزرز الموجودين على الشبكة
* الأجهزة (Computers) المتصلة
* البرامج المثبتة على كل جهاز
* برامج الـ Antivirus (عشان المهاجم يعرف إيه الحماية المتاحة قبل ما يتحرك)
* أدوات Backup تانية (زي Veeam اللي شفناه، أو غيرها)
* برامج Office (مؤشر على وجود بيانات/مستندات قيّمة)

تول رايقة بأمانة.

والتول دي يقال إنها تبع apt Play Ransomware في الأساس.

### تسريب البيانات

بعد كده استخدم تول اسمها FS64.exe — دي custom built برضو من الاتاكرز، بتجمع الملفات من مكان لمكان تاني، وبتعمل بعد كده ملف txt فيه الملفات اللي جمعتها.

طبعًا Backup Server عنده صلاحية جاهزة ومتفعلة للوصول للـ folders shares على File Server، لأنه محتاج الصلاحية دي أصلًا عشان يعمل backup. بدون أي RDP.

قام مستخدم التول على السيرفرين، وجمعتله الملفات اللي صيغتها .xls, .xlsx, .doc, .docx, .pdf — هو محدد يعني — وعملتله txt ملخص للي جمعته على الـ backup server، وحطت نسخة عند الـ file server في مجلد اسمه Public\\Music عند الاتنين.

بيقولك في اللحظة دي لقا file اسمه Cyber Insurance Policy، وده كان محتاجه عشان يعرف سياسة الشركة — أي البادجت بتاعهم في الفدية — عشان بعد كل ده لما يطبق الرانسوم وير.

شغل هكرز بقولك.

بعد كده قام ضاغط الملفات دي، واستخدم ناقل ملفات من خلال النت اسمه WinSCP (legit tool برضو) عشان يبعت الملفات على السيرفر بتاعه هو، الاتاكر.

بس غلط غلطة صعبة.. FTP protocol.

آه، protocol نقل ملفات ماله يا ريم؟

مش secure أو encrypted.

يعني إيه؟

يعني لو فتحت الـ Wireshark هتشوف الاتاكر وهو بيسجل بأكونته وباسورده، والداتا بتاعته، والملفات بتاعتك بتتنقل كلها plain text :))

---

### في path تاني؟!

لحد هنا، path الاتاك من الناحية دي خلص، والريبورت موضحش انتهى إزاي. بس دول كانوا أربع أيام من أصل ستة من الاتاك — فاضل معانا يومين من الاتاك سلكوا path تاني.

إيه ده؟

في path تاني!!

أمال إنت فاكر إيه؟

فاكر MSBuild.exe؟

لا مش فاكر.

فاهماك فعلًا، بس دي كانت الـ legit tool بتاعت الـ compile اللي اتعملها injection في الأول مع الـ cmd — فاكرها؟

---

### اليوم السادس: مالوير تالت يظهر

في اليوم السادس من الاتاك، MSBuild.exe لقت نفسها فاضية، أو الاتاكر يعني مكتفاش باللي فوق — فكتبت ملف جديد في فولدر Music\\ اسمه ccs.exe، وشغلته.

الـ parent process بتاع ccs.exe كان MSBuild.exe يعني.

المهم بنشوف الـ metadata بتاعت الملف ده، لقيناه بيقولنا إنه Avast Antivirus.. يعني إيه يفندم؟

الميتاداتا كانت مكتوبة باسم ملفات Avast.

طب مش ممكن هو أصلًا تبع Avast؟

يبني، الـ Digital Signature مش حقيقية. وكمان إيه اللي عمله في music folder؟

في signature rule اسمها Symantec حددته كمالوير اسمه Betruger، وده عبارة عن backdoor لـ APT اسمها RansomHub affiliates.

يعني ده Malware تالت؟ آه، Betruger multi-function backdoor بيعمل كل اللي نفسك فيه: screenshotting، keylogging، file exfiltration، network reconnaissance، privilege escalation، credential harvesting.

بمجرد ما ccs.exe اشتغل، اتصل بـ C2:

* 504e1c95.host.njalla.net
* 80.78.28.149

اللي الـ reputation بتاعته phishing domain.

وعمل Process Injection على نطاق واسع — حقن نفسه في 172 عملية شغالة على الجهاز عشان الـ persistence.

وعمل Process Access على lsass.exe:

```
GrantedAccess: 0x1410
0x1410 = PROCESS_VM_READ + PROCESS_QUERY_INFORMATION
```

بعد ما Betruger اشتغل، ظهرت كمان Windows Event ID 4776 (credential validation).

المصدر كان جهاز اسمه WIN-FLGU1CC210K، وده hostname جديد مكنش ظهر قبل كده في الاتاك، بس برضو تبع الاتاكرز يعني. بس يقال إن احتمال بما إن التولز تبع APTs مختلفة، إن أصلًا في أكتر من APT شاركت في الاتاك ده.

---

### Payload بباسورد

المهم، وإحنا في نفس الفولدر بتاع music، المهاجم حمّل ملفين:

* data.dat: مالوير Packed
* vhd.dll: ليه باسورد، لو كتبته صح هيفك packer data.dat اللي فوق

طيب مين اللي بيشغل الـ DLL files؟ قولنا فوق: rundll32.exe.

بس لو كتبنا كده:

```
rundll32.exe C:\Users\Public\Music\vhd.dll
```

هيكون شكلها malicious، وبايناه في اللوجات فعلًا.

طب الاتاكر عمل إيه؟

غيّر الـ Working Directory لـ rundll32.exe، ونقلها لـ Music مع المالوير، عشان يبقى الكوماند كده:

```
rundll32.exe vhd.dll
```

أهي كده معقولة شوية، آه.

المالوير بقا عبارة عن إيه؟ المحققين معرفوش، عشان مكانوش معاهم key فك تشفير المالوير ده data.dat.

بيقولك كمان إن الـ ccs.exe دي — يعني Betruger backdoor — كريتت cmd process برضو، اللي بدورها عملت create لملفات مخفية في مجلد الـ Downloads.

التقرير وصفها إنها "suspicious hidden files indicative of discovery"، يعني على الأغلب ملفات ناتجة عن أوامر استكشاف (زي نتائج net user أو nltest) واتخزت كـ hidden عشان ما تبانش بسهولة.

---

### الدفعة الأخيرة — ونهاية فاشلة

المهم، بعد كل ده إيه اللي حصل؟

الاتاكر فتح جلسة جديدة RDP من الـ C2 الأخير اللي عملناه، على الجهاز الأساسي (504e1c95.host.njalla.net / 80.78.28.149 — فاكره؟ اللي بدأنا منه واللي لسه متفعل عليه ال ccs.exe).

ومن وهو على الـ backup server، استخدم Impacket wmiexec على الـ Domain Controller عشان يشغّل أوامر استكشاف ريموت للمرة الأخيرة.

عرفنا منين؟ ظهرت process للـ Domain Controller: عملية WmiPrvSE.exe بتشغّل cmd.exe (هي التول بتشتغل كده):

```
ParentImage:  C:\Windows\System32\wbem\WmiPrvSE.exe
Image:        C:\Windows\System32\cmd.exe
CommandLine:  cmd.exe /Q /c [الأمر] 1> \\127.0.0.1\ADMIN$\__[random] 2>&1
```

قال التقرير إن الاتاكر ملحقش للأسف ينفذ الـ ransomware (زعلني)، وتم طرده من الشبكة :(

---

### للاستزادة

لقيت dynamic analysis reports كويسين جدًا على ANY.RUN:

* Betruger Backdoor Malware: [https://any.run/report/ae7c31d4547dd293ba3fd3982b715c65d731ee07a9c1cc402234d8705c01dfca/ca432fcb-b5f7-4ed4-8143-55fd1875ff40](https://any.run/report/ae7c31d4547dd293ba3fd3982b715c65d731ee07a9c1cc402234d8705c01dfca/ca432fcb-b5f7-4ed4-8143-55fd1875ff40)
* SectopRAT Malware (EarthTime.exe): [https://any.run/report/bcff246f0739ed98f8aa615d256e7e00bc1cb24c8cabaea609b25c3f050c7805/2f79f6ae-f8ca-400b-b8a8-f67353b20ab6#i-table-processes-fa2e16fe-ba9d-4fb5-8bc8-3467ddba8928](https://any.run/report/bcff246f0739ed98f8aa615d256e7e00bc1cb24c8cabaea609b25c3f050c7805/2f79f6ae-f8ca-400b-b8a8-f67353b20ab6#i-table-processes-fa2e16fe-ba9d-4fb5-8bc8-3467ddba8928)

ودا لينك التقرير الأصلي:

* DFIR Report: [https://thedfirreport.com/2025/09/08/blurring-the-lines-intrusion-shows-connection-with-three-major-ransomware-gangs/](https://thedfirreport.com/2025/09/08/blurring-the-lines-intrusion-shows-connection-with-three-major-ransomware-gangs/)

للأسف ملقيتش Static analysis للكود (طبيعي عشان custom packed)، لكن من باب الفضول عملت static analysis بسيط جدًا لهم بدون تعمق.

لكن الanalysis الي عملته بالإنجليزي كله، فا نأسف بقا.
ودا لينك المقال بتاعي النسخه الانجلش وهتلاقو عليها ريبورت الانالسيز : [https://medium.com/@VampireXRay/from-earthtime-to-msbuild-anatomy-of-a-three-gang-ransomware-intrusion-914ead353313](https://medium.com/@VampireXRay/from-earthtime-to-msbuild-anatomy-of-a-three-gang-ransomware-intrusion-914ead353313)

وبس كده، إن أصبت فهو من عند الله، وإن أخطأت فهو من نفسي والشيطان :)
</div>