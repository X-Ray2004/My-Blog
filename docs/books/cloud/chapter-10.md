---
date: 2026-07-18
---
# Chapter 10

Module 10 : **Elastic Load Balancing (ELB)*** **Function:** Distributes incoming network traffic across multiple targets (e.g., EC2 instances) in a single Availability Zone or across multiple AZs.

* **Integration:** Works seamlessly with Auto Scaling to automatically scale resources based on traffic demand.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/c6019a00-f09b-414b-a8b0-34f9db4725f8)

**Elastic Load Balancing (ELB) Details**

* **Centralized Entry:** Single contact point, shielding backend servers from direct client traffic.
* **Listener Gate:** Evaluates incoming requests based on protocols and ports.
* **High Availability:** Spans multiple Availability Zones.
* **Health Checks:** Monitors targets; diverts traffic from unhealthy (X) to healthy (✓).
* **Target Groups:** Organizes resources (EC2, containers) for intelligent routing (used by ALB/NLB).
* **Use Cases:** High availability/fault tolerance, containerized apps, elasticity/scalability, VPCs, hybrid environments, invoking Lambda functions.
* **Monitoring:** Metrics, access logs, CloudTrail logs.

**Amazon CloudWatch**

* **Monitors:** AWS resources and applications running on AWS.
* **Collects:** Standard metrics and Custom metrics.
* **Alarms:** Send notifications (via SNS) or trigger actions (like EC2 Auto Scaling).
* **Events (EventBridge):** Define rules to match AWS environment changes and route them to target functions/streams.
* **Create Alarm:** Triggered based on specified metrics/thresholds.

**Scaling & Amazon EC2 Auto Scaling**

* **Scaling:** Increasing or decreasing compute capacity.
* **Auto Scaling:** Maintains app availability by automatically adding or removing EC2 instances.
* **Auto Scaling Group:** A logical grouping (collection) of EC2 instances treated as a single unit for scaling and management.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/589ef86c-e4a6-4488-ac90-020908e3b9d6)

**Auto Scaling Workflow Example**

* **Trigger:** CloudWatch Alarm detects CPU usage crosses 90%.
* **Action:** Auto Scaling launches a new EC2 instance.
* **Integration:** The new instance is automatically added to the Target Group.
* **Verification:** Load Balancer performs a Health Check on the new instance before routing traffic to it.

**AWS Auto Scaling (Scaling Plans)**

* Provides a simple, powerful UI to build scaling plans for multiple resources:Amazon EC2 instances and Spot Fleets.Amazon ECS Tasks.Amazon DynamoDB tables and indexes.Amazon Aurora Replicas.

---

@VampireXRay

ان اصبت فهو من عند الله وان اخطأت فهو من نفسي والشيطان :)
