---
date: 2026-09-26
---
# FahmSec CTF 2026 : Func Reversing !

<!-- more -->

“Easy I Think”

> وما توفيقي إلا بالله :)

![](https://cdn-images-1.medium.com/max/1000/1*VlBYUKC-TumUkWHFBxLB6A.png)

### Step 1: Initial Recon

First Detecet Easy Drag (Trust Issues)

![](https://cdn-images-1.medium.com/max/1000/1*CLK5396MvgRu9-W2PW0Jhg.png)
okay Just c language

Go to my dear IDA
Generate your pseoudocode and your strings and Back.

I also ran `strings` on the binary to get a quick overview of anything interesting hardcoded.

![](https://cdn-images-1.medium.com/max/1000/1*pv38F_5oFqkfjZEs93V5Sw.png)
oooh Nice thank you For Instructions ^^

The string `"i got u man"` is sitting right there in plaintext. Already suspicious.

### Step 2: Generate the Graph & Map the Functions

I generated the **call graph** in IDA. Three VIP functions stood out:

![](https://cdn-images-1.medium.com/max/1000/1*kMqOWcyw-G2Oj_u8-FUAsA.png)
Now I think generate graph will be useful

Ooh I Need to know your secret excuseMe
Now we have VIP functions

* `main()`
* `secret_feature()`
* `secret_auth()`

### Step 3: Analyzing `main()` — The Hidden Option

Looking at the pseudocode of `main()`, the program runs a loop and reads your menu choice into `v5`. The visible menu shows options 1, 2, 3 — but in the actual code I noticed:

![](https://cdn-images-1.medium.com/max/1000/1*Ouaee4ANeRZnOZrKkrJ8ag.png)
Not Secret For Me

**1337 is never displayed to the user.** That’s the first secret — a hidden menu option using the classic leet number. This is your entry point to the flag.

### Step 4: Tracing `secret_feature()` → `secret_auth()`

```
int secret_feature() {
  if ( secret_auth() )
    puts("Correct!"), exit(0);
  else
    puts("Access denied.");
}
```

Simple gate. Everything depends on `secret_auth()` returning true.

```
_BOOL8 secret_auth() {
  char s[136];
  char *s2 = "i got u man";
  fgets(s, 128, stdin);
  s[strcspn(s, "\r\n")] = 0;
  return strcmp(s, s2) == 0;
}
```

The password is hardcoded in plaintext as `s2 = "i got u man"`. Your input `s` is compared directly via `strcmp`. No encryption, no obfuscation — pure plaintext.

### Step 5: Getting the Flag

The challenge asks for the **MD5 hash of the flag/password**

The password is: `i got u man`

Computing MD5:

```
MD5("i got u man") = b99b8f1a9c3c68c862a50d698dc78b81
```

So the flag is:

> FahemSec{f25de377479695d1eb4e7ac61ba6e2fa}.

> *وبس كدا إن أصبت فهو من عند الله ,وإن أخطأت فهو من نفسي والشيطان :)*
