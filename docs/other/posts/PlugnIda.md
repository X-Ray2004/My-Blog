---
date: 2024-11-20
---
# Findcrypt3 IDA Plugin

<!-- more -->

### Findcrypt3 IDA Plugin

**Unlocking Hidden Secrets: A Malware Analyst’s Journey with FindCrypt3 Plugin**

### Introduction

In the world of malware analysis, identifying cryptographic routines embedded in malware is crucial for extracting hidden configurations, decrypting payloads, and understanding the malware’s operational intent. One powerful tool in a malware analyst’s arsenal is the **FindCrypt3 plugin** for IDA Pro. This article details my experience downloading, configuring, and testing the FindCrypt3 plugin, along with the challenges faced and how I overcame them. Additionally, I will highlight the tangible benefits that this plugin offers for malware analysis.

### Downloading and Installing FindCrypt3

The journey began with downloading the **FindCrypt3** plugin, an IDA Pro extension designed to identify hardcoded cryptographic constants (such as AES S-Boxes) in malware binaries. The plugin can be found in public GitHub repositories or through IDA community sources.

**Steps to Download:**

1. Navigate to the [FindCrypt3 GitHub repository](https://github.com/polymorf/findcrypt3).
2. Clone the repository using:

```
git clone https://github.com/polymorf/findcrypt3.git
```

3. Alternatively, download the ZIP file and extract it to your desired directory.

**Installation Process:**

1. Copy the extracted **findcrypt3.py** and **findcrypt3.rules** files to the **IDA Pro plugin directory** (usually located at `C:\Program Files\IDA Pro\plugins`).
2. Ensure the file structure resembles:

```
C:\Program Files\IDA Pro\plugins\findcrypt3.py
C:\Program Files\IDA Pro\plugins\findcrypt3.rules
```

* Restart IDA Pro to load the new plugin.

### Errors Encountered and Solutions

**1. Python Configuration Error:**
Upon launching IDA Pro, I was greeted with the following error:

```
WARNING: Python 3 is not configured (Python3TargetDLL value is not set).
Please run idapyswitch to select a Python 3 install.
```

**Solution:**

* Download and install Python 3 from [python.org](https://www.python.org/downloads/).
* Make sure it the verision suitable for ida verision.
* Run the following command to set the Python path:

```
idapyswitch.exe
```

* Choose the Python 3 executable path when prompted.

**2. Invalid Win32 Application Error:**
Another issue occurred when IDA attempted to load `idapython3.dll`:

```
LoadLibrary(C:\Program Files\IDA Pro\plugins\idapython3.dll) error: %1 is not a valid Win32 application.
```

**Solution:**

* This error indicated a mismatch between the plugin’s architecture and IDA Pro’s version (32-bit vs 64-bit).
* I ensured the correct Python version (64-bit) was installed, matching the 64-bit version of IDA Pro.
* Reinstalled the correct `idapython3.dll` and placed it in the `plugins` directory.

**3. YARA Module Not Found Error:**
Running the plugin revealed another issue:

```
Traceback (most recent call last):
  File "C:\Program Files\IDA Pro\plugins\findcrypt3.py", line 9, in <module>
    import yara
ModuleNotFoundError: No module named 'yara'
```

**Solution:**

* Installed the `yara-python` module:

```
pip install yara-python
```

* Restarted IDA Pro, resolving the missing module issue.

### Testing the Plugin

With FindCrypt3 successfully installed, I proceeded to test the plugin by analyzing a suspected malware sample.

**Test Case:**
I analyzed a simple C program that includes the AES S-Box to test the `findcrypt-yara` plugin in IDA Pro. This binary will contain known cryptographic constants that `findcrypt-yara` should detect.

### 1. Create the C File (`test_crypto.c`)

```
#include <stdio.h>
// AES S-Box (Substitution Box)
unsigned char aes_sbox[256] = {
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5,
    0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0,
    0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc,
    0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a,
    0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0,
    0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b,
    0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85,
    0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5,
    0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17,
    0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88,
    0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c,
    0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9,
    0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6,
    0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e,
    0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94,
    0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68,
    0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
};

void dummy_encrypt() {
    printf("Testing AES S-Box...\n");
    for (int i = 0; i < 256; i++) {
        printf("%x ", aes_sbox[i]);
    }
    printf("\nEncryption done!\n");
}
int main() {
    dummy_encrypt();
    return 0;
}
```

---

### 2. Compile the Binary

Run this command in the terminal (Windows or Linux):

```
gcc test_crypto.c -o test_crypto.exe
```

---

### 3. Load in IDA Pro

1. Open `test_crypto.exe` in IDA Pro.
2. Run the `findcrypt-yara` plugin from **Edit → Plugins → findcrypt3**.
3. The AES S-Box should be detected and highlighted in the results.

---

### Testing

* If no constants are found, make sure the plugin is correctly installed and YARA is operational.
* You can try adding MD5 or SHA constants in the same manner for broader testing.

**Result:**
The plugin detected:

![](https://cdn-images-1.medium.com/max/1000/1*UQn5aWDeh0Ad1pXX1ktKng.png)

```
.data:00404020   Rijndael_AES_CHAR_404020
.data:00404020   Rijndael_AES_LONG_404020
```

### Benefits for Malware Analysts

The FindCrypt3 plugin provides critical insights into malware functionality by revealing cryptographic constants embedded in binaries. Here are some of the key benefits:

**1. Uncovering Encrypted Configurations:**
Malware often encrypts its configuration files (C2 servers, payload URLs). By identifying AES or RC4 constants, analysts can extract and decrypt these configurations, allowing better detection and mitigation.

**2. Reverse Engineering C2 Communication:**
Encrypted C2 traffic can be decrypted by recognizing and replicating the cryptographic routines, facilitating deeper analysis of malware behavior.

**3. Detecting Obfuscation and Anti-Analysis:**
Malware frequently uses encryption to hide payloads or sensitive strings. FindCrypt3 detects these obfuscation techniques, allowing analysts to bypass them.

**4. YARA Rule Creation:**
Cryptographic constants are unique to many malware families. Extracting these constants enables the development of YARA rules, aiding in the detection of similar malware across systems.

**5. Identifying Ransomware:**
Ransomware relies heavily on encryption. Recognizing cryptographic functions early helps analysts identify potential ransomware samples, allowing for preemptive measures.

As a malware analyst, detecting cryptographic constants (like the AES S-Box) in malware binaries provides **valuable insights** into the malware’s behavior, capabilities, and goals. Here’s how this benefits you:

---

### 1. Identifying Encryption Usage (Data Protection & C2 Communication)

* **Why it matters:**
  Malware often uses encryption to protect configuration files, evade detection, or secure communications with its Command-and-Control (C2) servers.
* **Example:** AES or RC4 might encrypt payloads or hide API keys and IP addresses.
* **Benefit:** Detecting AES constants reveals **where and how** the malware encrypts/decrypts data. This allows you to:
* Decrypt C2 communication.
* Extract hidden configurations.
* Uncover malware capabilities hidden in encrypted sections.

---

### 2. Extracting Hidden Configuration Files

* **Why it matters:**
  Configuration files often contain:
* C2 server addresses.
* Hardcoded credentials.
* Commands or payload URLs.
* **Benefit:** By identifying the decryption function, you can dump the encrypted config, apply the detected algorithm (AES, RC4), and extract **operational intelligence**.

---

### 3. Bypassing Anti-Analysis Techniques

* **Why it matters:**
  Malware authors use encryption to obfuscate code and prevent static analysis. If critical payloads are encrypted, **reverse engineering becomes harder**.
* **Benefit:** Recognizing cryptographic constants allows you to locate **decryption routines** and bypass obfuscation, effectively reversing the malware’s protections.

---

### 4. Detecting Keylogging or Ransomware Behavior

* **Why it matters:**
  Ransomware heavily relies on encryption to lock files. Keyloggers and credential stealers use hashing (like MD5 or SHA-256) to store captured data securely.
* **Benefit:** By identifying cryptographic functions early, you can determine if the malware is a potential ransomware or stealer and **respond accordingly**.

---

### 5. Signature and YARA Rule Development

* **Why it matters:**
  Cryptographic constants are often reused across multiple malware families (e.g., same AES S-Box or RC4 keys).
* **Benefit:**
* Extracting these constants allows you to create **YARA rules** that detect variants of the malware.
* This improves **threat hunting** and **automated detection** across your network or clients.

---

### 6. Reverse Engineering Malware Algorithms

* **Why it matters:**
  If you can identify the encryption algorithm, you can reverse-engineer the entire cryptographic scheme.
* **Benefit:**
* It allows you to develop **decryption tools** for infected systems.
* You can disrupt malware operations by decrypting and modifying critical files.

---

### Real-World Application (Case Study)

* **Example:**
* *Mirai Botnet* used XOR encryption for configuration files. Analysts identified the XOR key using tools like `findcrypt`. This enabled researchers to decrypt configurations and take down infected IoT devices.
* *LokiBot* used AES to encrypt stolen credentials. Analysts traced the AES key by identifying S-Box constants, decrypting stolen data, and blocking the malware’s operation.

### Conclusion

The FindCrypt3 plugin is a must-have tool for malware analysts, offering deep insights into encryption methods used by malware. By overcoming initial installation challenges and leveraging the plugin effectively, analysts can unlock hidden secrets within malware binaries, gaining a strategic edge in cybersecurity operations.
