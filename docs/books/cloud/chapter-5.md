---
date: 2026-07-18
---
# Chapter 5


Module 5 : **Networking Basics*** Foundational concepts for connecting systems (LANs, subnets, routing, IP addressing).
**Amazon VPC (Virtual Private Cloud)**

* **Definition:** A logically isolated section of the AWS Cloud where you launch resources.
* **Scope:** Dedicated to a single AWS Region.
* **Components:** LANs and Subnets, Routing, Gateways, Network resources, Configurations, and Multiple layers of security.
* **Similarities vs. VLANs:***Similar:* Both provide logical network isolation and segmentation.*Difference:* VLANs operate within a single physical network/data center, while VPCs are highly scalable, isolated virtual networks spanning an entire AWS Region globally.

**VPC Networking**

* **Subnets:** Segments of a VPC's IP address range, deployed in a specific Availability Zone.**Public Subnet:** Has a direct route to the internet (used for web servers).**Private Subnet:** No direct internet access (used for databases/backend).
* **Elastic IP Address:** A static, public IPv4 address. Can be allocated to your account and quickly remapped/reassigned to other instances automatically if needed.
* **Elastic Network Interface (ENI):** A virtual network card that you can attach to an EC2 instance to manage its network connectivity.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/49a4acff-d93a-49b6-ad53-2cbbd80a7be3/mJZ_3QTCvuiS9QnCCkUcjniiIaECWN6OxQpUp-vWnpg=.png)

**VPC Networking (Advanced)**

* **VPC Peering:** Connects two VPCs.*Rule:* IP address ranges (CIDR) cannot overlap.*Limitation:* Transitive peering is NOT supported (if A is peered with B, and B with C, A cannot talk to C directly).*Resource:* Only one peering connection resource exists between a pair of VPCs.
* **AWS Direct Connect:** Dedicated, private network connection (much faster and more consistent than internet-based VPN).
* **VPC Endpoints:** Privately connect to AWS services without requiring an internet gateway or NAT.**Gateway Endpoint:** For S3 and DynamoDB.**Interface Endpoint:** Uses AWS PrivateLink (powered by an ENI).
* **AWS Transit Gateway:** Acts as a central transit hub. Connects VPCs and on-premises networks through a single gateway.

**VPC Security**

* **Security Groups (Instance Level):**Act at the instance (ENI) level.**Default:** Sealed shut to all inbound traffic; allows all outbound.**Behavior:** Stateful (return traffic is automatically allowed, regardless of rules).
* **NACLs (Network Access Control Lists - Subnet Level):**Act at the subnet level.Have separate inbound and outbound rules (explicitly allow or deny traffic).**Default:** Allows all inbound and outbound traffic.**Behavior:** Stateless (return traffic must be explicitly allowed by rules).
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/49a4acff-d93a-49b6-ad53-2cbbd80a7be3/GBAJH80NJEfzndOhcrhP-0F-BwiXlApy6n7GVdiIaP0=.png)

**Amazon Route 53 (DNS Service)**

* **Routing Types:****Simple:** Basic routing to a single resource.**Weighted:** Splits traffic based on assigned weights (e.g., testing new versions).**Latency:** Routes to the region with the lowest latency (best for global apps).**Geolocation:** Routes based on the user's physical location.**Geoproximity:** Routes based on the location of your resources (allows shifting traffic using "bias").**Failover:** Automatically redirects to a backup site if the primary is unreachable.**Multivalue Answer:** Responds to queries with up to 8 healthy records selected randomly.
* **DNS Failover:** Supports backup across multiple regions.
* **Use Case:** Routing for multi-tiered web applications.

**Amazon CloudFront (CDN)**

* **Features:** Fast, global, self-service model, Pay-as-you-go CDN service.
* **Infrastructure:****Edge Locations:** Caches content closest to users for ultra-low latency.**Regional Edge Cache:** Sits between your origin and edge locations to cache larger objects, reducing origin load.
