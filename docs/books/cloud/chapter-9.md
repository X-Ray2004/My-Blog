---
date: 2026-07-18
---
# Chapter 9


Module 9 : **AWS Well-Architected Framework*** **Core Pillars:** Security, Reliability, Cost Optimization, Performance Efficiency, Operational Excellence.

* **AWS Trusted Advisor:** AWS service that checks your architecture against these best practices.

**Operational Excellence Pillar**

* **Design Principles:** Perform operations as code, annotate documentation, make frequent/small/reversible changes, refine procedures frequently, anticipate failure, learn from all operational events.
* **Workflow Phases:** Prepare → Operate → Evolve.

**Security Pillar**

* **Focus:** Protect information, systems, and assets through risk assessments and mitigation.
* **Key Topics:** Manage identity/access (who can do what), detect security events, protect systems/services, ensure data confidentiality and integrity.
* **Design Principles:** Strong identity foundation, enable traceability, apply security at all layers, automate best practices, protect data in transit and at rest, keep people away from data, prepare for security events.

**Reliability Pillar**

* **Definition:** A measure of the system's ability to provide functionality. Includes all components. It is the probability the system will function as intended for a specified period (Mean Time Between Failures - MTBF).
* **Design Principles:** Test recovery procedures, automatically recover from failure, scale horizontally for aggregate availability, stop guessing capacity, manage change through automation.

**Performance Efficiency Pillar**

* **Focus:** Use resources efficiently.
* **Design Principles:** Democratize advanced technologies, go global in minutes, use serverless architectures, experiment more often, have mechanical sympathy (understand underlying hardware).
* **Workflow Phases:** Selection → Review → Monitor → Trade-offs.

**Cost Optimization Pillar**

* **Focus:** Run systems to deliver business value without overspending.
* **Design Principles:** Adopt a consumption model, measure overall efficiency, stop spending on data center operations, analyze/attribute expenditure, use managed services to reduce cost of ownership.
* **Workflow Phases:** Expenditure awareness → Match supply and demand → Cost-effective resources → Optimize over time.
  ![](https://beta.appflowy.cloud/api/file_storage/44d9144e-c30d-474c-bf65-161556199468/v1/blob/c096be2c-1ccd-48d7-8b5c-4238778fb84b/2ef0775b-9f5c-43a9-911a-2098f0f1d66e)

**Availability**

* **Formula:** Normal Operation Time / Total Time.
* **Influencing Factors:****Fault Tolerance:** Built-in redundancy of components to remain operational during failures.**Scalability:** Ability to handle increased capacity without changing the underlying design.**Recoverability:** Processes, policies, and procedures to restore service after a catastrophic event.

**AWS Trusted Advisor**

* An online tool that provides real-time guidance to help you provision your resources following AWS best practices.
