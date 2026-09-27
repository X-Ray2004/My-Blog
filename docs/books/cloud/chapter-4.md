---
date: 2026-07-18
---
# Chapter 4


Module 4 : **AWS Shared Responsibility Model*** **AWS Responsibility ("Security OF the Cloud"):** Protects physical infrastructure, hardware, networking, and controls software virtualization.

* **Customer Responsibility ("Security IN the Cloud"):** Encryption, firewalls, managing services/deployments, application settings, network configuration, and data location.
* **Control Levels by Model:****IaaS (e.g., EC2):** Customer has complete control over the OS, virtual server, and most of the system.**PaaS (e.g., Database):** Customer only manages access endpoints to store and retrieve data.**SaaS:** Customer doesn't manage the supporting infrastructure; just pay-as-you-go and use the application.

**AWS IAM (Identity and Access Management)**

* **Purpose:** Define users, manage accounts, and securely control access to AWS resources.
* **Job Roles:** Storage, Security, System Admins (each gets different permissions).
* **IAM Components:****User:** An identity (person/application).**Group:** A collection of users.**Policy:** Defines the level of access (permissions).**Role:** Grants permissions to an AWS *service* (to make requests on your behalf), not a person.
* **Types of Access:****Programmatic:** Uses Access Key ID + Secret Access Key (for CLI/SDK).**AWS Management Console:** Uses Username + Password + MFA.
* **MFA Token:** Extra security layer (Multi-Factor Authentication).
* **Core Principle:** Principle of Least Privilege (give only the minimum permissions needed to do the job).
* **IAM Policies Types:****Identity-based:** Attached to users/groups/roles.**Resource-based:** Attached to a resource itself (e.g., an S3 Bucket policy).
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/03caef0c-a4dd-47d5-9604-bb6744166315)

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/49a4acff-d93a-49b6-ad53-2cbbd80a7be3/-U9yFZf-W9KZaachj0JBFUCWLx7KtfMsXI3PEW2An2k=.png)

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/49a4acff-d93a-49b6-ad53-2cbbd80a7be3/FzF57a9dNHdb30ntPvMdOvml-xr3SdTTQHvYGRunfEI=.png)

**Auditing, Logging & Governance**

* **AWS CloudTrail:** The baseline logging service. Tracks "Who did What, When, and Where" for all API interactions.Allows viewing/downloading the last 90 days of account activity.
* **AWS Config:** Tracks and evaluates resource configurations.Features: Review configuration history, relationships, set rules, and get alerts.Aggregates resources across multiple regions and accounts.
* **Service Control Policies (SCPs):** Used within AWS Organizations to specify the *maximum* permissions allowed.

**Security & Encryption Services**

* **AWS KMS (Key Management System):** Manages encryption keys. Used by CloudTrail to log all key usage.
* **TLS (formerly SSL):** Standard protocol for encrypting data in transit.
* **Amazon Cognito:** Manages user sign-up/sign-in for web and mobile apps.Supports SAML (allows sign-in using corporate directory credentials like Active Directory).
* **AWS Shield:** Managed DDoS protection. Minimizes latency and downtime (includes standard Shield and Shield Advanced with inline mitigation).

**Amazon S3 Security Tools**

* **Block Public Access:** Account-level setting to prevent accidental public exposure.
* **Bucket Policies:** Resource-based policies to control access.
* **ACL (Access Control List):** Legacy mechanism to manage S3 bucket/object permissions.

**Compliance & Best Practices**

* **AWS Trusted Advisor:** Automated service that checks your account and provides best practices for cost, security, performance, and fault tolerance.
* **AWS Compliance Programs:** AWS establishes, implements, and maintains a Security Management System.Adheres to various laws, alignments, and frameworks (Certifications).
* **AWS Artifacts:** A portal where you can download AWS compliance reports and agreements (e.g., PCI, SOC, ISO certifications).
