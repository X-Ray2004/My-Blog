---
date: 2026-09-26
---
# ZinadIT CTF 2026 — Calc&Broken Reversing

<!-- more -->

“Just Easy”

> وما توفيقي إلا بالله :)

![](https://cdn-images-1.medium.com/max/1000/1*FEayT-zN2BvgapA4QUwaWQ.png)

### Challenge #1

was the description. A `.exe` file was attached, and we were told it takes a flag as input and checks it.

Simple enough — or so it seemed.
-----------------------------------

### Step 1 — First Look with DIE (Detect It Easy)

The first thing I always do with any binary is drop it into DIE to answer three questions:

* What type of file is this?
* What was it built with?
* What tools do I need to analyze it?

Dropping the binary into DIE showed it’s a **native C++ binary** compiled with MSVC.

So — IDA it is.

### Step 2 — Opening in IDA & Reading the Decompiled Code

We drag the binary into IDA, let it analyze, and go straight to `main`.

Here’s what the decompiler gave us:

```
s1 = a2[1]; // grab the flag from argv[1]
for ( i = 0; i <= 5; ++i )
    s1[i] += 5;
for ( j = 6; j <= 10; ++j )
    s1[j] -= 5;
for ( k = 11; k <= 28; ++k )
    s1[k] ^= 0x10u;
if ( !strcmp(s1, "_nHmruvO++Z]ESXOSP\\SE\\PDY ^Jm") )
    printf("Correct Flag");
else
    puts("Wrong Flag!!");
```

The names look boring — but the trick is simple:

**Don’t read the name. Read what goes in and what comes out.**

The Structure of the Challenge:

```
argv[1]  →  transform  →  compare with hardcoded string
```

### Step 3 — Understanding the Transformations

Let’s break it down loop by loop:

**Loop 1** → indices `0–5` → each char `+= 5`

**Loop 2** → indices `6–10` → each char `-= 5`

**Loop 3** → indices `11–28` → each char `^= 0x10`

And then it compares the result to:

```
_nHmruvO++Z]ESXOSP\SE\PDY ^Jm
```

So the program **transforms our input** and checks if it matches. Which means — we have the output, we just need to reverse the math.

### Step 4 — Breaking the Transformations

We have the output, we just need to flip every operation:

* indices `0–5` had `+= 5` → we do `-= 5`
* indices `6–10` had `-= 5` → we do `+= 5`
* indices `11–28` had `^= 0x10` → we do `^= 0x10` again *(XOR is its own inverse — *`<em class="markup--em markup--li-em">A ^ K ^ K = A</em>`

Now get the final script:

```
target = "_nHmruvO++Z]ESXOSP\\SE\\PDY ^Jm"
result = list(target)
# Reverse of += 5  →  subtract 5
for i in range(0, 6):
    result[i] = chr(ord(result[i]) - 5)
# Reverse of -= 5  →  add 5
for j in range(6, 11):
    result[j] = chr(ord(result[j]) + 5)
# Reverse of XOR 0x10  →  XOR again (self-inverse)
for k in range(11, 29):
    result[k] = chr(ord(result[k]) ^ 0x10)
print(''.join(result))
```

Run it: ZiChmp{T00\_MUCH\_C@LCUL@TI0NZ}

---

### Challenge #2

That was the challenge description. A `.exe` file was attached — no input needed, no interaction. Just run it and... something happens.

Simple enough — or so it seemed.

---

### Step 1 — First Look with DIE (Detect It Easy)

Dropping the binary into DIE showed it’s a **native C++ binary** compiled with MSVC.

So — IDA it is.

### Step 2 — Opening in IDA & Reading the Decompiled Code

We drag the binary into IDA, let it analyze, and go straight to `main`.

Here’s what the decompiler gave us:

```
if ( strlen(asc_2004) != 22 )
{
    printf("[*] Something went wrong!!");
    exit(0);
}
for ( i = 0; i < strlen(asc_2004); ++i )
{
    asc_2004[i] ^= 0x41u;
    printf("\\x%x", asc_2004[i]);
}
printf("\n%s\n", asc_2004);
```

Wait — the program **doesn’t ask for any input.**

It has a string stored inside it, XORs every byte with `0x41`, and prints the result.

Which means — **the flag is already inside the binary. Just encrypted.**

### Step 3 — Finding the Data

We go to `.rodata` in IDA and find the raw bytes stored at `asc_2004`:

![](https://cdn-images-1.medium.com/max/1000/1*NbgsuhQkJKw6_2rvgp6gXA.png)
Ida rdata View

```
1B 28 02 29 20 2C 31 3A 19 71 13 08 0F 06 1E 08 1B 1E 02 71 71 0D 3C
```

That’s our encrypted flag — 22 bytes, sitting right there.

### Step 4 — Breaking the Encryption

The program does:

```
asc_2004[i] ^= 0x41;
```

That’s it. Just XOR with `0x41`.

And since XOR is its own inverse — `A ^ K ^ K = A` — we just do the exact same thing on our bytes and we're done.

### Step 5 — The Script

```
data = [0x1B, 0x28, 0x02, 0x29, 0x20, 0x2C, 0x31, 0x3A,
        0x19, 0x71, 0x13, 0x08, 0x0F, 0x06, 0x1E, 0x08,
        0x1B, 0x1E, 0x02, 0x71, 0x71, 0x0D, 0x3C]
flag = ''.join(chr(b ^ 0x41) for b in data)
print(flag)
```

Flag : ZiChamp{X0RING\_IZ\_C00L}

> وبس كدا — إن أصبت فهو من عند الله، وإن أخطأت فهو من نفسي والشيطان :)
