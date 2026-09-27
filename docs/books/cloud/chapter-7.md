---
date: 2026-07-18
---
# Chapter 7


Module 7 : **Storage Services Overview****Amazon EBS (Elastic Block Store)**

* **Concept:** Block storage (stores data in divided pieces/blocks) vs. Object storage (updates the entire file).
* **Usage:** Create individual storage volumes and attach them to EC2 instances.
* **Snapshots:** First snapshot is the baseline; subsequent ones only save changes (incremental). Snapshots can be shared.
* **Features:** Encryption support, Elasticity (can resize dynamically).
* **Volume Types:**SSD (General Purpose, Provisioned IOPS)HDD (Magnetic/Cold)
* **Metrics:** Measured by IOPS (Input/Output Operations Per Second) and data transfer.

**Amazon S3 (Simple Storage Service)**

* **Concept:** Object storage. Store objects (files) inside "Buckets".
* **Features:** Designed for 99.999999999% (11 9s) of durability. Virtually unlimited storage.
* **Creation:** You choose the authentication, AWS Region, and size/name for your bucket.
* **Storage Classes:** Standard, Intelligent-Tiering, Standard-IA (Infrequent Access), One Zone-IA, Glacier, Glacier Deep Archive.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/b7a97acf-a2ae-4d0b-bcce-f46fc0464c9f)

**Amazon S3 (Continued) & Amazon EFS**

**S3 Access & Pricing**

* **Access Methods:** Console, CLI, SDK.
* **Pricing Model (Pay-as-you-go):** Based on GBs stored, Data Transfer, and API Requests.

**Amazon EFS (Elastic File System)**

* **Use Cases:** Easy setup and scale; ideal for big data and media processing workloads.
* **Architecture:***Note: You left this blank, but to complete it:* EFS is a regional service. It uses a Network File System (NFS) protocol and scales automatically to petabytes without needing to pre-provision storage. It can be mounted concurrently across multiple AZs.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/e1060c49-6d21-40f2-b5d8-fab311c582e1)

**Amazon EFS Implementation**

* **Steps:**Create EC2 resources and launch the instance.Create the EFS file system.Create mount targets in the appropriate subnets.Connect EC2 instances to the mount targets.Verify resources and account protection.
* **Components:** File System → Mount Target → Tags.

**Amazon S3 Glacier**

* **Purpose:** Data archiving with high security, high durability, and extremely low cost.
* **Access:** RESTful web service interface, or via SDKs (Java, .NET, etc.).

**Amazon S3 Lifecycle Policies**

* **Automation:** Automatically transition objects over time to save costs.
* **Typical Flow:** Standard → Infrequent Access (IA) → S3 Glacier → (Optional: Delete).
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/9da348a7-bed6-4237-a9b9-95fb1e6b3f80)

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/a006c85b-6834-4823-b05d-e50ed2196602)

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/d2bd3642-0ec8-4619-ba23-32ad012b79a1)

**Amazon S3 Glacier (Security)**

* **Access Control:** Managed using IAM policies.
* **Encryption:** Supports AES-256 encryption.
* **Key Management:** Keys can be managed by AWS (S3-managed) or you can use AWS KMS for full control over your encryption keys.
