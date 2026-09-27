---
date: 2026-09-26
---
# FahmSec CTF 2026 : ReflectiveBait Reversing

<!-- more -->

> *“What you see is not what runs. Find the truth.”*

> “وما توفيقي إلا بالله :)”

![](https://cdn-images-1.medium.com/max/1000/1*BNudgIhWClExm5g3Sr2s-A.jpeg)
No, it’s not related, nobody pay attention, it’s just me and my brother For article Photo

That was the challenge description. A `.exe` file and a `.dll` file were attached, and we were told it's a **.NET program that asks for a flag.**

Simple enough — or so it seemed.

---

### Step 1 — First Look with DIE (Detect It Easy)

The first thing I always do with any binary is drop it into **DIE** to answer three questions:

* What type of file is this?
* What was it built with?
* What tools do I need to analyze it?

Dropping `ReflectiveBait.exe` into DIE showed:

```
Language: C++
Compiler: Microsoft Visual C++
Tool:     Visual Studio 2022
Debug:    PDB file link
```

At first glance — looks like a normal C++ binary. But two things caught my attention:

PDB file Link ?
Find the DLL with the same name
**The challenge description said .NET + a DLL was attached.**

2.IDA won’t help here. The real logic is in the DLL and .Net — so we open **dnSpy(Disassembly .net object).**

### Step 2— Opening the DLL in dnSpy

![](https://cdn-images-1.medium.com/max/1000/1*ADdsW0I_DwZ6EeftWwMP9A.png)
.exe On dnspy

IF We Drag .exe Will Not Get Anything Just A Structure … So ..

Drag `ReflectiveBait.dll` into dnSpy.

The structure revealed several classes:

![](https://cdn-images-1.medium.com/max/1000/1*KaM_a6IsabQWc-A4JmGKIQ.png)
Functions And Data Of Dll

![](https://cdn-images-1.medium.com/max/1000/1*HyrZN_DwYWPr9MT0MHngPA.png)
Data !

![](https://cdn-images-1.medium.com/max/1000/1*VL6NeWs8G4GA9_UL-jQ_Ow.png)
First Function N0001 Main Function

```
t0000  ← main logic
t0001  ← helper functions
__w    ← function wrappers
__s    ← encrypted strings
```

Everything is obfuscated — renamed to meaningless names. But obfuscation hides names, not logic.

### Step 3 — Reading the Main Logic (`m0000_impl`)

I went straight to the main function. Here’s what I found, with the obfuscation stripped away:

```
private static int m0000_impl(string[] a01)
{
    // Print "Enter the flag: "
    __w.__m_0A00000E(__s.__s_00000000());
// Take input from the user
    string text = __w.__m_0A00000F() ?? string.Empty;
    // Convert f0002 from Base64 to bytes - this is the stored ciphertext
    byte[] array = __w.__m_0A000011(t0000.f0002);
    // Encrypt the user's input using AES
    byte[] array2 = __w.__m_06000002(text, t0000.f0000, t0000.f0001);
    // Compare encrypted input with stored ciphertext
    bool flag = array2.Length == array.Length &&
                CryptographicOperations.FixedTimeEquals(array2, array);
    // Print result
    __w.__m_0A000014(flag ? __s.__s_00000002() : __s.__s_00000001());
    return flag ? 0 : 1;
}
```

The function names look scary — but the trick is simple:

> ***Don’t read the name. Read what goes in and what comes out.***

But How I Get This Info ?!!
If we Go to \_\_m\_0A000011

![](https://cdn-images-1.medium.com/max/1000/1*0q-y-S8ucPpD2E-64nhLsw.png)
Base64 Function !

If we Go to \_\_m\_06000002

![](https://cdn-images-1.medium.com/max/1000/1*di0QBIVPCzg9jpJfvpdlBA.png)
m0001?

![](https://cdn-images-1.medium.com/max/1000/1*IQpABl1Rf_erUoOzv92kYA.png)
AES Encryption !

![](https://cdn-images-1.medium.com/max/1000/1*pgK9aLlAIPtfE4uwpC1Qew.png)
But What is m0004 ?

Look Like VIP !

![](https://cdn-images-1.medium.com/max/1000/1*KG6V3fvdiJQAmPNEa1EO9g.png)
The Structure Of all The Challlenge !

And What is t0001 ? Flag ?

![](https://cdn-images-1.medium.com/max/1000/1*MIGtl45MeU5SQI5FfrjA9A.png)
m0002 ! Xor ! Firts Function I get !

But what is Data ? OHHHH

First Photo We GET !

![](https://cdn-images-1.medium.com/max/1000/1*RKkKb9Xm2LkwzZrE4UQE8w.png)
I think I got it :D

### Step 4— Breaking the Encryption (`m0002`)

```
public static string m0002(byte[] a01, int a02)
{
    byte b = (byte)(a02 & 255);  // take last byte of the number
    for (int i = 0; i < a01.Length; i++)
        a01[i] ^= b;             // XOR every byte
    return Encoding.UTF8.GetString(a01);
}
```

Simple XOR encryption. The key:

```
-1585270920 & 255 = 0x78
```

I applied it to all three arrays and got:

```
__s_00000003 → "FahemSec_AES256_Key_32bytes!!!__"  (Key)
__s_00000004 → "FahemSec_AES_IV!"                   (IV)
__s_00000005 → "CBopk2T9+bciwMVvJrTfu4MN87drTZdIEv1r6XDcwe4="  (Ciphertext)
```

### Step 6 — Decrypting the Flag

Now Get Final Script Ever !

![](https://cdn-images-1.medium.com/max/1000/1*6KI9Q2VmGqeHWaY89sw6Kw.png)

```
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import base64

key = b"FahemSec_AES256_Key_32bytes!!!__"
iv  = b"FahemSec_AES_IV!"
ct  = base64.b64decode("CBopk2T9+bciwMVvJrTfu4MN87drTZdIEv1r6XDcwe4=")

cipher = AES.new(key, AES.MODE_CBC, iv)
print(unpad(cipher.decrypt(ct), AES.block_size).decode())
```

### Summary

```
DIE → confirmed .NET → use dnSpy
         ↓
dnSpy → found main logic in t0000
         ↓
m0000_impl → program encrypts input and compares
         ↓
__w strings → revealed ReadLine, Base64, AES
         ↓
m0001 → AES-256-CBC, CreateEncryptor
         ↓
__s → strings encrypted with XOR
         ↓
m0002 → XOR key = 0x78
         ↓
Decrypted → Key, IV, Ciphertext
         ↓
AES Decrypt → FLAG
```

> وبس كدا إن أصبت فهو من عند الله ,وإن أخطأت فهو من نفسي والشيطان :)
