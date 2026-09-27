---
date: 2026-07-18
---
# Chapter 3


Module 3 : **AWS Global Infrastructure*** **Components:** Regions, Availability Zones (AZs), Edge Locations.

* **Regions:** Separate geographic areas.Used for data replication and communication (mostly within the same region for speed).Some regions have restricted rules based on local government regulations.
* **Availability Zones (AZs):** Isolated locations within a Region (each has one or more data centers).
* **Edge Locations:** Endpoints for AWS services like CloudFront (used for content caching to reduce latency).
* **Cloud Ping:** A tool to test latency (response time) between your location and AWS Regions.

**Security & Networking Design**

* Data centers are highly designed for security.
* Uses custom networking equipment sourced from multiple OEMs (to avoid vendor lock-in).
* Amazon constantly measures availability and performance to route traffic via the best path.

**System Features**

* **High Availability (HA):** System is running and accessible.
* **Fault Tolerance:** System continues working even if a component fails.
* **Elasticity:** Automatically add/remove resources to match current demand.
* **Scalability:** Ability of a system to handle growing workload (Vertical & Horizontal scaling).
* *Best Practice:* AWS recommends replicating data and resources across multiple AZs to achieve maximum resilience.

**AWS Services Categories**

* (Note: You missed listing them, but generally they are grouped into: Compute, Storage, Database, Networking, Security, Analytics, Machine Learning, etc.)
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/49a4acff-d93a-49b6-ad53-2cbbd80a7be3/ekhTLNS_h215C3qh2HPM6WUMo8NKkth40to4HSLVsCo=.png)

**Storage Services**

* **Amazon S3 (Simple Storage Service):** Object storage (Simple Global). Highly scalable, stores files/objects.
* **Amazon EBS (Elastic Block Store):** Block storage. Attached to a single EC2 instance at a time (like a physical hard drive).
* **Amazon EFS (Elastic File System):** Managed file storage. Can be attached to *multiple* EC2 instances simultaneously.

**Compute Services**

* **AWS EC2 (Elastic Compute Cloud):** Virtual servers in the cloud.Supports: VMs, Docker containers, Web Applications, deploying code, and Kubernetes (via EKS).

**Database Services**

* *Note: You missed the specific types, but AWS provides both Relational (SQL - e.g., RDS) and Non-Relational (NoSQL - e.g., DynamoDB) databases.*

**Networking & Content Delivery**

* **Gateways:** For connecting on-premises networks to AWS (e.g., VPN, Direct Connect).
* **APIs:** Amazon API Gateway (to create, publish, and manage secure APIs).
* **Content Delivery:** Amazon CloudFront (uses Edge Locations to deliver data with low latency).

**Security Services**

* **IAM:** Identity and Access Management (manages users, groups, and permissions).
* **KMS:** Key Management Service (creates and manages encryption keys).
* **Shield:** DDoS protection service.

**Cost Management & Governance**

* **Cost Management:** Budgets, Cost Explorer, Savings Plans (to optimize spending).
* **Management & Governance:** CloudTrail (API logging), Config (resource tracking), AWS Organizations (centralized control).
