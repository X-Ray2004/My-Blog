---
date: 2026-07-18
---
# Chapter 8


Module 8 : **Database Services Overview*** **Unmanaged:** Managed by you (on-premises or EC2).

* **Managed:** Managed by the service (e.g., Amazon RDS, DynamoDB, S3).

**Challenges of Relational Databases**

* Server maintenance and energy footprint.
* Software installation and patches.
* Database backups and high availability.
* Limits on scalability.
* Data security.
* Operating system (OS) installation and patches.

**Amazon RDS Configuration**

* **DB Instance Class:** Determines CPU, Memory, and Network performance.
* **DB Instance Storage Types:** Magnetic, General Purpose SSD, Provisioned IOPS SSD.

**Amazon RDS High Availability & Scaling**

* **Multi-AZ Deployment:** Configures the DB for high availability (standby replica in another AZ for automatic failover).
* **Read Replicas:***Features:* Uses asynchronous replication; can be promoted to a standalone master if needed.*Functionality:* Used for read-heavy workloads to offload read queries from the primary DB.
* *Limits:* Not suitable for high-processing workloads or NoSQL needs.

**Amazon RDS Pricing Factors**

* **Requests:** Number of database I/O requests.
* **Deployment Type:** Storage and I/O charges vary based on Single-AZ vs. Multi-AZ deployment.
* **Data Transfer:** Free for inbound; tiered charges for outbound.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/a91678ed-278e-42f4-882f-eef5edff0168)

**Amazon DynamoDB**

* **Type:** NoSQL database. Offers high flexibility, low latency, and virtually unlimited storage.
* **Structure Core:** Tables → Items → Attributes.
* **Primary Keys:****Simple (Single):** Uses only a Partition Key. Must be unique for each item (e.g., User\_ID).**Compound (Composite):** Uses Partition Key + Sort Key. Partition Key can repeat, but the combination must be unique (e.g., IP\_Address as Partition Key, Timestamp as Sort Key for security logs).
* **Querying:** To find an item by non-primary key attributes, you use the **Scan** operation.
* **Data Element:** An **Attribute** is a fundamental data element in DynamoDB.

**Amazon Redshift**

* **Purpose:** Data warehousing and analysis.
* **Architecture:** Uses a Leader Node (handles client connections and final aggregation) and Compute Nodes (process queries and send results to the leader).
* **Use Cases & Big Data:**Enterprise Data Warehouse (EDW).Migrate at your own pace; experiment without large upfront costs.Respond faster to business needs; low price point for small customers.Managed service: Focus on data, not database management.

**Amazon Aurora**

* **Engine:** Compatible with MySQL and PostgreSQL.
* **Features:** Automates time-consuming tasks (like backups, patching).
* **Availability:** Highly available by design. Maintains multiple copies of data across Multiple AZs.
* **Recovery:** Offers instant crash recovery.
