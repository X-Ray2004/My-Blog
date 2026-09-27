---
date: 2026-07-18
---
# Chapter 6

Module 6 : **Compute Services Overview*** Provides the processing power to run applications and workloads.
**Amazon EC2 (Elastic Compute Cloud)**

* Virtual servers (instances) in the cloud. Scalable and configurable.

**Amazon EC2 Cost Optimization**

* **Strategies:** Use Reserved Instances or Savings Plans for predictable workloads.
* **Spot Instances:** Bid on unused EC2 capacity for steep discounts (best for fault-tolerant workloads).
* **Right-sizing:** Choose the exact instance type that matches your resource needs.

**Container Services**

* **Amazon ECS:** Managed container orchestration service.
* **Amazon EKS:** Managed Kubernetes service to run Docker containers.
* **AWS Fargate:** Serverless compute for containers (no need to manage underlying EC2 servers).

**Introduction to AWS Lambda**

* **Serverless Compute:** Run code without provisioning or managing servers.
* **Payment:** Pay only for the compute time consumed (millisecond billing).
* **Scaling:** Scales automatically in response to application traffic.

**Introduction to AWS Elastic Beanstalk**

* **Purpose:** An easy-to-use service for deploying and scaling web applications.
* **Function:** Automatically handles the underlying infrastructure provisioning, load balancing, and auto-scaling (supports Java, Python, Node.js, PHP, etc.).
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/49a4acff-d93a-49b6-ad53-2cbbd80a7be3/Fet3edETL6Mv0AtvdaNUQzgNQA9cBs19h2qTtcBB-mU=.png)

**Choosing the Optimal Compute Service**

* **3 Key Questions:**What is the application design? (e.g., Containerized, Serverless, OS-dependent).What is the usage pattern? (e.g., Continuous, intermittent, spiky).Which configuration do you want to manage? (e.g., Full OS vs. just code).

**Amazon EC2 Deep Dive**

* **Concept:** Provides virtual machines (VMs) in the cloud.
* **Flexibility:** Any size, any instance type, in any Availability Zone.
* **AMI (Amazon Machine Image):** A template that contains the software configuration (OS, application server, applications) required to launch your EC2 instance.
* **Instance Naming (e.g., t3.large):****t:** Instance family (T = Burstable performance, general purpose).**3:** Generation (Third generation - newer = better performance/cheaper).**large:** Size within the family (determines vCPUs and RAM).
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/49a4acff-d93a-49b6-ad53-2cbbd80a7be3/96AqkNYgIbYBEtI1uW2FGRnfFQKBP2zscc4IT0ikxWA=.png)

**EC2 Configuration & Launch Steps**

* **Consider Network Performance:** Choose instance types based on required network bandwidth.
* **Network Settings:** Specify the VPC, Subnet, and optionally assign a Public IP to make it internet accessible.
* **IAM Role:** Attach an IAM role (not rule) to grant the EC2 instance permissions to access other AWS services.
* **User Data:** A script that executes automatically the first time the instance boots up.
* **Storage:****Root Volume:** Configured at launch.**Additional Storage:***EBS (Elastic Block Store):* Persistent storage (data remains if instance stops).*EC2 Instance Store:* Ephemeral storage (data is permanently deleted if instance stops/terminates).*Note:* Amazon S3 is an object/file system, but it cannot be used as a root volume.
* **Tags:** Labels (Key-Value pairs) assigned to resources for organization and tracking.
* **Metadata:** Base data about the EC2 instance that you can attach or query.

**EC2 Access & Security**

* **Security Groups:** Virtual firewall rules controlling traffic (Source/IP, Ports, Protocol).
* **Key Pairs:** SSH key pair (Public key stays on AWS, Private key is downloaded by you).*Windows:* Uses the key to decrypt the default Administrator password.*Linux:* Uses the private key for SSH access.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/00e121c8-7727-4e3d-ac32-d66c809cf387)

![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/7c770d19-34c8-47c1-b7ee-49a2458d293b)

**EC2 State & IP Behavior**

* **EBS-Backed Instances:** Can be stopped and started (root volume data is retained).
* **Reboot vs. Stop:** Rebooting keeps the internal/public/private IP and Host name. Stopping releases the public IP (changes on restart), but the private IP remains.
* **Elastic IP Limits:** Default limit is 5 Elastic IPs per Region (to prevent IP hoarding).
* **Instance Metadata:** Can be viewed via browser or CLI. Used to configure or manage a *running* instance (e.g., getting its own IP or IAM role credentials).

**EC2 Cost Optimization**

* **Core Strategies:** Right-sizing, increasing elasticity, optimal pricing models, optimizing storage choices.
* **Best Practices:**Cost allocation tagging.Define metrics, set targets, and review regularly.Architect for cost efficiency from the start.Assign clear responsibility for cost optimization.

**Container Basics**

* **Concept:** Packed, self-contained environments that support repeatability and consistency across environments.
* **Docker vs. VM:***VMs:* Include a full Guest OS (Heavy, takes minutes to boot).*Docker (Containers):* Share the host OS kernel (Lightweight, take seconds to start).
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/7bfcf8b8-d2e1-4910-83a1-b26f6b6703cc)

**Container Cluster Options**

* **EC2 Backed (Yes):** You manage the underlying EC2 instances (servers) that run the containers.
* **AWS Fargate Backed (No):** Serverless. AWS manages the underlying infrastructure; you only deploy and manage the containers.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/1dfee206-ff58-49aa-80b4-7712642b87b7)

**Kubernetes & AWS Container Services**

* **Kubernetes:** Open-source software for container orchestration.Deploys and manages applications at scale.Same toolset works on-premises and in the cloud.Orchestrates multiple Docker hosts.**Automates:** Container provisioning, networking, load distribution, and scaling.
* **Amazon EKS:** AWS managed Kubernetes service.
* **Amazon ECR:** Fully managed Docker container registry (stores and manages your container images).

**AWS Lambda**

* Run code without provisioning or managing servers.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/82a4bf6f-bc96-40d9-863b-cbe575d22cdf)

**AWS Lambda Configuration**

* **Setup Steps:**Grant permissions (IAM roles).Write code (using built-in IDE or external editor).Specify memory and environment variables.Optionally deploy inside a VPC for private network access.
* **Deployment:** Code and dependencies can be packaged as a `.zip` file for upload.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/d0b10d69-6501-4e6c-9c70-bc30862a71a6)

**AWS Lambda Limits**

* **Concurrent Executions:** Default limit is 1,000 per region (can be increased via AWS Support).
* *Note: You missed the rest of the line, but other common limits include Execution Timeout (max 15 mins), Memory (up to 10GB), and Deployment Package size.*
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/5cecd79d-b233-4e63-a1ae-6d02b2db5c9a)

**AWS Elastic Beanstalk**

* An easy, fast way to get web applications up and running (automates deployment, provisioning, load balancing, and auto-scaling).
