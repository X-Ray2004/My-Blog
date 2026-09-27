---
date: 2026-09-26
---
# CyCTF qualification 2025 : Reverse 'BabyCrackMe' - "TakeAHook"

<!-- more -->


### Can We Crack The Baby  ?

> وما توفيقي إلا بالله :)

### Step 1: Understanding the Main Function

First, let’s look at what `main()` does:

![](https://cdn-images-1.medium.com/max/1000/1*bYmOu81MGJnP6GOBM2DzIQ.png)
IDA View For Main Function

Pretty straightforward — After generate pesudocode we can see the program reads our input and passes it to `check_input()`. If that function returns true, we win.
For Sorry The file Is not exe so we will continue Staticly

Now let’s see what `check_input()` actually does.

### Step 2: Analyzing check\_input()

![](https://cdn-images-1.medium.com/max/1000/1*sF3GKblAoTuMjaAjQW0OGg.png)
IDA View For Check_Input Function

We can see in Ida view that `TARGET_LEN` is 60 in decimal so

* The flag length must satisfy: `2 * length = TARGET_LEN`
* Looking at the data section: `TARGET_LEN = 0x3C = 60`
* Therefore: **Flag length = 30 characters**

![](https://cdn-images-1.medium.com/max/1000/1*Y3uLvlEAk55sOUYTTVC6wA.png)
IDA View For Check_Input Function

* Each character is processed by `emit_pair()` which produces 2 bytes
* These 2 bytes must match the corresponding bytes in the `TARGET` array

### Step 3: Understanding emit\_pair()

![](https://cdn-images-1.medium.com/max/1000/1*PxPrYfu1Y79fCSSx9kxiaQ.png)
IDA View For emit_pair Function

This is where things get interesting:

Breaking it down:

* `a1` = the input character
* `a2` = position in the string (0, 1, 2, ...)
* The function selects one of 10 obfuscation functions based on: `(9 * position + 7) % 10`
* It performs bit rotations (`rol8`, `ror8`) and XOR operations
* Returns 2 bytes that depend on both the character and its position

### Step 4: The Obfuscation Functions

There are 10 different obfuscation functions (`obfuscate1` through `obfuscate10`), each doing complex arithmetic (SAME WAY):

![](https://cdn-images-1.medium.com/max/1000/1*bCi9s-cZSyzC6Pjo2SVGKg.png)
IDA View For Obfuscation Functions

These functions use:

* 32-bit rotations (`rol32`, `ror32`)
* Large magic constants
* Multiplication and XOR operations

The good news? **We don’t need to reverse these functions!**

We will depend on brute force Why ?
To solve for `a1`:

* Inverse rotate `v7` to get: `a2 + (v9 ^ a1)`
* Subtract `a2`: `v9 ^ a1`
* XOR with `v9`: `a1 = (v9 ^ a1) ^ v9` ✓

**BUT** we can’t compute `v9` because it requires calling `OBF[...](a2)` which depends on the obfuscation functions we can't invert!

### Step 5: Understanding the TARGET Array

Before we dive into the solution, let’s understand what we’re matching against:

```
TARGET = [0xC2, 0x20, 0xF7, 0x2C, 0xAD, 0xE2, 0x6B, 0x55, ...]
//        ^     ^     ^     ^     ^     ^
//       [0]   [1]   [2]   [3]   [4]   [5]  ...
```

* **Total size**: 60 bytes (TARGET\_LEN = 0x3C)
* **Flag length**: 60 ÷ 2 = 30 characters (since each character produces 2 bytes)

#### The Mapping: Character Position → TARGET Bytes

Here’s the crucial part: `emit_pair()` produces **2 bytes** for each character. These bytes are stored consecutively in TARGET:

```
Flag character at position 0  → TARGET[0] and TARGET[1]
Flag character at position 1  → TARGET[2] and TARGET[3]
Flag character at position 2  → TARGET[4] and TARGET[5]
...
Flag character at position i  → TARGET[2*i] and TARGET[2*i+1]
...
Flag character at position 29 → TARGET[58] and TARGET[59]
```

**Visual example:**

```
# When we process the first character (position 0)
byte1, byte2 = emit_pair(flag[0], 0)
```

```
# These must match:
byte1 == TARGET[2*0]     # TARGET[0] = 0xC2
byte2 == TARGET[2*0 + 1] # TARGET[1] = 0x20
```

```
# When we process the second character (position 1)
byte1, byte2 = emit_pair(flag[1], 1)
```

```
# These must match:
byte1 == TARGET[2*1]     # TARGET[2] = 0xF7
byte2 == TARGET[2*1 + 1] # TARGET[3] = 0x2C
```

### Step 6: The Key Insight

Here’s the crucial realization: **each character is processed independently**. The output for position `i` only depends on:

* The character at position `i`
* The position value `i` itself

This means we can brute-force each position separately!

#### The Brute Force Strategy

For each position (0–29):

1. Get the target bytes: `TARGET[2*position]` and `TARGET[2*position+1]`
2. Try all printable ASCII characters (space to \~, about 95 characters)
3. For each character, call `emit_pair(character, position)`
4. Check if the output matches our target bytes
5. When we find a match, that’s the correct character at that position!

**Concrete example for position 0:**

```
# Target bytes for position 0
target = (TARGET[0], TARGET[1]) = (0xC2, 0x20)
```

```
# Try characters:
emit_pair(ord('a'), 0) → (0x45, 0x12) ✗ no match
emit_pair(ord('b'), 0) → (0x78, 0x9A) ✗ no match
emit_pair(ord('f'), 0) → (0xC2, 0x20) ✓ MATCH!
```

```
# Found it! flag[0] = 'f'
```

Total attempts: 30 positions × 95 characters = **2,850 attempts** (very fast!)

### Solution

### Implementation

I wrote a Python script that:

1. **Reimplements all the rotation functions** (`rol8`, `ror8`, `rol32`, `ror32`)
2. **Reimplements all 10 obfuscation functions** exactly as they appear in the binary
3. **Reimplements emit\_pair()** with the same logic
4. **Brute-forces each position** by trying all printable ASCII characters

Key code snippets:

```
# Brute force each position
for i in range(30):
    target_pair = (TARGET[2*i], TARGET[2*i + 1])
    for c in range(32, 127):  # Printable ASCII
        if emit_pair(c, i) == target_pair:
            flag.append(chr(c))
            break
```

### Running the Solution

Execute the Python script, and it will output the flag character by character!

```
def ror8(val, shift):
    """8-bit rotate right"""
    val &= 0xFF
    shift &= 7
    return ((val >> shift) | (val << (8 - shift))) & 0xFF
def rol32(val, shift):
    """32-bit rotate left"""
    val &= 0xFFFFFFFF
    shift &= 31
    return ((val << shift) | (val >> (32 - shift))) & 0xFFFFFFFF
def ror32(val, shift):
    """32-bit rotate right"""
    val &= 0xFFFFFFFF
    shift &= 31
    return ((val >> shift) | (val << (32 - shift))) & 0xFFFFFFFF
def to_signed32(val):
    """Convert to signed 32-bit"""
    val &= 0xFFFFFFFF
    return val if val < 0x80000000 else val - 0x100000000
# Obfuscation functions
def obfuscate1(a1):
    return (to_signed32(-1547330877 * rol32((a1 ^ 0xD00DF00D) - 1056969199, 9)) ^ 0x13579BDF) & 0xFFFFFFFF
def obfuscate2(a1):
    return (ror32(to_signed32(-1640531535 * ((a1 ^ 0xF0E1D2C3) + 270544960)), 13) ^ 0x31415926) & 0xFFFFFFFF
def obfuscate3(a1):
    return (rol32(to_signed32(-559038737 * ((a1 ^ 0xC3E2D1F0) + 1515870810)), 7) ^ 0x89ABCDEF) & 0xFFFFFFFF
def obfuscate4(a1):
    return (to_signed32(2135587861 * (rol32(a1, 5) ^ 0xA5A5A5A5)) + 464371934 ^ 0xF0F0F0F) & 0xFFFFFFFF
def obfuscate5(a1):
    return (to_signed32(-2048144789 * ror32((a1 + 523124044) ^ 0xC001D00D, 3)) ^ 0xDEADC0DE) & 0xFFFFFFFF
def obfuscate6(a1):
    return (to_signed32(668265261 * rol32((a1 ^ 0x2468ACE1) - 889275714, 17)) ^ 0xBADC0DE) & 0xFFFFFFFF
def obfuscate7(a1):
    return (ror32(to_signed32(-1255572915 * (a1 ^ 0xF1E2D3C)), 11) + 826392149 ^ 0xFEEDFACE) & 0xFFFFFFFF
def obfuscate8(a1):
    return (to_signed32(1374496519 * ((rol32(a1, 3) - 1698898192) ^ 0x13572468)) ^ 0xC0FFEE) & 0xFFFFFFFF
def obfuscate9(a1):
    return (to_signed32(-1150833019 * (ror32(a1 ^ 0xAAAAAAAA, 7) + 1013904242)) ^ 0xF7F7F7F7) & 0xFFFFFFFF
def obfuscate10(a1):
    return ((rol32(to_signed32(-1798288965 * (a1 - 559038242)), 13) ^ 0x600DCAFE) + 305463004) ^ 0x77777777) & 0xFFFFFFFF
OBF = [obfuscate1, obfuscate2, obfuscate3, obfuscate4, obfuscate5,
       obfuscate6, obfuscate7, obfuscate8, obfuscate9, obfuscate10]
def emit_pair(a1, a2):
    """Emulate the emit_pair function"""
    v9 = OBF[(9 * a2 + 7) % 10](a2)
  
    v7 = rol8((a2 + (v9 ^ a1)) & 0xFF, ((a2 ^ ((v9 >> 24) & 0xFF)) & 7))
    v8 = ror8(((a1 + ((v9 >> 8) & 0xFF)) ^ a2) & 0xFF, (((a2 >> 1) + ((v9 >> 16) & 0xFF)) & 7))
  
    return v7, v8
# Target bytes from the binary
TARGET = [
    0xC2, 0x20, 0xF7, 0x2C, 0xAD, 0xE2, 0x6B, 0x55, 0xAC, 0xCB,
    0x32, 0xB6, 0xE4, 0x2D, 0x11, 0x1B, 0xBF, 0x26, 0xDE, 0x2B,
    0x68, 0x0C, 0x65, 0xDB, 0x63, 0xB6, 0x87, 0x10, 0x36, 0x25,
    0x3A, 0x76, 0x4C, 0x40, 0xB5, 0x6A, 0x55, 0x2F, 0xF6, 0x59,
    0x56, 0x91, 0x7A, 0xCD, 0xFD, 0x74, 0x2F, 0xEF, 0xD1, 0x9C,
    0xC8, 0xED, 0x93, 0x7A, 0xA4, 0x7A, 0xBF, 0x71, 0x0C, 0xCF
]
FLAG_LEN = 30
# Solve for each character
flag = []
for i in range(FLAG_LEN):
    target_pair = (TARGET[2*i], TARGET[2*i + 1])
  
    # Try all printable ASCII characters
    found = False
    for c in range(32, 127):
        result = emit_pair(c, i)
        if result == target_pair:
            flag.append(chr(c))
            found = True
            break
  
    if not found:
        flag.append('?')
        print(f"Position {i}: No match found!")
flag_str = ''.join(flag)
print(f"Flag: {flag_str}")
# Verify the solution
print("\nVerifying...")
all_correct = True
for i, c in enumerate(flag_str):
    result = emit_pair(ord(c), i)
    expected = (TARGET[2*i], TARGET[2*i + 1])
    if result != expected:
        print(f"Position {i} ('{c}'): MISMATCH - got {result}, expected {expected}")
        all_correct = False
if all_correct:
    print("✓ All positions verified correctly!")
```

> إن أصبت فهو من عند الله، وإن أخطأت فهو من نفسي والشيطان :)
>
