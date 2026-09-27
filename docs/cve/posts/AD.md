---
date: 2026-04-20
---
# Active Directory (AD) and Kerberos Protocol Attacks

<!-- more -->

[🇪🇬 اقرأ بالعربي](../AD-ar.md){ .md-button }

Not a new CVE discussion, but something important in cyber security: Active Directory (AD) and its attacks, specifically the Kerberos Protocol.

I found it important, so I wanted to summarize it and share the benefit.

![‘My Hero Academia’ Season 7 Character Guide — Who Stars in the Final Act?](https://static1.colliderimages.com/wordpress/wp-content/uploads/2024/05/katuski-bakugo-in-my-hero-academia.png)

## Intro to AD

Let's give a simple explanation of what AD is.

Any company has a system of accounts linked together under something called the domain, and from it accounts are distributed to every employee in the company.

AD is responsible for making sure that account actually belongs to the domain or not.

This process is called AD, but the machine responsible for handling it is the **Domain Controller (DC)**.

AD as a process is split into two parts:

* The DC system itself
* The authentication process itself

---

## The Authentication Process

Let's set the DC system aside a bit and focus on the user, since the user is the reason everything falls apart

(I mean, the user is the target of the Attacker — basically, my brother, the user).

First, let's talk about the default, i.e. what normally happens:

The user logs into the account with the username and password, which gets sent to the DC so it authorizes him, so he sends something called **AS-REQ**.

This request is basically the timestamp — meaning the time — encrypted with the hash of the account's password (we call it the **NT HASH**).

The DC decrypts this and confirms, "yes, this is a user I have on the domain," and sends back something called the **TGT** — a ticket containing the user's data and privileges, encrypted with the hash of the domain account's password called **KRBTGT**, along with a session key used to encrypt the connection.

Now, say I want Access to a database on a server, or any service in general?

I need to ask the DC to authenticate again so it lets me use the service — suppose I don't have permission?

I send it the TGT again, saying "I've already been authenticated before, can I access the database?" (along with the SPN, the service name).

It decrypts the ticket and confirms everything is fine and allowed, and sends back a ticket called **TGS** — containing the privilege data, encrypted with the hash of the service account's password, whatever that service is — and I go use it to access the service, in this example, the database.

---

## Bismillah, let's start on the Attacks

**Here's the thing now:** if I got the TGT or TGS somehow, straight up, without going through all that process — and I'm not actually the user who owns the ticket (attacker) — and I used it and gained access with the ticket, or completed the process using it?

**This is called:**`Pass the Ticket (PtT) Attack`

---

Okay, so I'm a regular user (got hacked) and I want to get into the database and I have no permission.

I got the password hash of another user (lateral movement) who does have permission, and sent an AS-REQ request.

It'll give me back a TGT and I continue until I get access?

**This is:**`Overpass the Hash Attack`

---

Now, if there's Privilege Escalation and I reach a domain admin account and get the krbtgt hash, I can make a TGT freely, whenever I want.

**This is:**`Golden Ticket Attack`

---

Okay, so you hacked a user and somehow have the hash of the service account's password?

**This is:**`Silver Ticket Attack`

---

But if you don't have that hash, how do you get it?

You're an Attacker on a user's machine, waiting for him to request a TGS ticket

Then you grab it via Memory Dump (a copy of memory) and get the hash, then crack it to find out the service account's password so you can carry out a Silver Ticket Attack?

**This is:**`Kerberoasting Attack`

---

## Let's get into Defense

The normal sequence of event IDs for the account authentication process:

```
[DC: 4768]     ──(TGT issued)
[DC: 4769]     ──(TGS issued)
[Target: 4624] ──(Access Granted)
```

And `[Target: 4625]` if the user gets the password wrong or something.

If you find them spread far apart in time, or you find that some event ID is missing — something's off — start Investigating, because there could be an Attack from the ones mentioned above.

---

And that's it.

*If I got it right, it's from God, and if I made a mistake, it's from myself and Satan :)*
