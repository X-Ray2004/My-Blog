---
date: 2025-01-12
---

# Dissecting the Shamoon Attack

<!-- more -->

<div class="rtl-content" markdown>

# الـ Attack الي معانا المرادي قديم شويه  
# Shamoon Attack واتعاد تاني في 2016 و 2018

## مهمة الهجوم

ومهمته تخريب الداتا وسرقتها

في 2018 شركة تخص انتاج البترول في السعوديه اترصد فيها 42 جهاز تم تخريبهم في يوم 10 Dec ومع Infected Network فيها 15 الف جهاز تقريبا !

## بداية الهجوم

الموضوع بدأ في ايام 9-11 Oct مع شويه Credentials مسروقه او Phishing Attack لـ Administration Data والي يقال انها كانت Admin Accounts استقالوا من الشركه لكن لسه اكونتاتهم موجوده ودي الي تم استخدامها في الـ Attack دا

في 29-31 Oct الـ EDR لاحظ وجود لاستخدام PsExec والي هو عباره عن Tool تحكم بجهاز تاني عن بعد و RDP brute force عشان يقدر ي Login على اجهزه التارجت

اممم C2 ؟  
طب ازاي قدر يوصل لوجود الاجهزه دي من الاساس على النتورك وليه اجهزه معينه ؟  
ودا كان لان هدف المالوير الاساسي كان التخريب زي ما قلنا

المهم تم تحديد الاجهزه دي من خلال SMB والي هو Legitimate Service على Port 445 مهمته الـ File Sharing وتتواصل مع الطبعات الموجوده على النتورك و مع ICMP scan وصلوا الحمد لله 

## مرحلة الـ WinRM

في 19 Nov اترصد بالـ EDR استخدام لـ WinRM والي هيا Windows Remote Management عشان يبدأ configure payloads و C2 Setup

والي من خلاله في يوم 10 Dec اتعمل MBR overwritten  
والـ MBR دا أول sector في الـ HardDisk بيساعد على تحديد مكان الـ Bootloader  
وبس كدا خلاص ال OS unbootable للاجهزه وكذا سيرفر  
بالشفا :)

## الـ Mitigation

نعدل تاني الـ MBR وبعدها حمل Os جديد بعد التاكد ان النتورك عندك بقت Clean

## الـ Prevention

تقفل كل الـ Services الغير مهمه حسب كل Directory مع التاكد من مسح اي داتا لاي يوزر كان في الشركه و يتم تامنها وتامين كلمات سر المستخدمين كلها عامه بـ MFA

طب وهو فين الـ EDR في كل دا فين التيم ؟  
الـ Attacker استعمل تيكنيك Low-and-slow  
وهي زي ما واضح اتحركك بخطوات مدروسه على فتره طويله تقريبا شهر  
بالتالي اتاكد من وجود تيم Soc متخصص ومتدرب للمراقبه :)

## الـ Malware Analysis

نخش على الجزء المفضل وهو الـ Malware Analysis 

من الـ Payloads الي كانت معانا في ال Attack دا في مرحله الـ WinRM برضو وهو ISM.exe حوالي 565kbوالي كان مهمته info gathering عن شويه معلومات مهمه عن التارجت زي  
anti-virus - firewall products  
Current system date and time - time zone  
The domain of the local “administrator” account  
%username% environment (systeminfo)  
List of currently running processes (tasklist)  
WPAD and current proxy configurations

حاجات بسيطه يعني

و طبعا عشان يتم التخريب والـ System ميقدرش يـ Detect تغير في ال MBR وينبه اليوزر لازم يعمل Shutdown  
task-killing the Windows initialization process, winit.exe  

طيب افرض دا اصلا معموله بلوك على جهاز اليوزر  
( Server & Host )  
مش هنغلب هو عامل حسابه  
Create scheduled tasks  
ونوقف كل التحديثات والـ checks الي على السيستم عشان ميقدرش ي Detect تغير في ال MBR وينبه اليوزر و Backdoor بسيط يعني مش حوار

وهنعمل outbound DNS and HTTP السيرفرات عشان ميوصلهمش اي تنبيه برضو ونحمل باقي الـ Payloads ونبعت الداتا لـ Attacker Host  

خلصت ؟  
يلا بقا نمسح الكاش من خلال أن الـ Payload بيكريت تاسك برضو  
remove all traces of its temporary files from the system  
اهم من الشغل ظبت الشغل اه

وبس كدا  
إن أصبت فهو من عند الله وإن أخطأت فهو من نفسي والشيطان :)

</div>