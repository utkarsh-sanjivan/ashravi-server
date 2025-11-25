## 1. Validate Shared IAM Resources
1. **Review existing IAM roles/policies**
   - Confirm the front-end deployment role (e.g., `AsharviDeployRole`) has only the permissions it needs (CloudFront, S3, Lambda, API Gateway). Ensure no overly broad policies remain from initial provisioning.
   - Ensure MFA is enforced for human users. Update password policies if missing.
2. **Create/confirm backend-specific IAM roles**
   - **`AsharviBackendEcsTaskRole`** – Allows `secretsmanager:GetSecretValue`, `logs:CreateLogStream`, `logs:PutLogEvents`, and specific DynamoDB access.
   - **`AsharviBackendEcsExecutionRole`** – Allows `ecr:GetAuthorizationToken`, `ecr:BatchGetImage`, `logs:CreateLogStream`, and `logs:PutLogEvents`.
   - **`AsharviCicdDeployRole`** (if reusing CI/CD) – Update trust relationship so GitHub Actions (or CodePipeline) can assume it. Attach least-privilege policy for ECR, ECS, CloudWatch, Secrets Manager.
3. **Rotate credentials** – Rotate access keys for CI/CD IAM users/roles if older than 90 days. Document new keys in your CI/CD secrets storage.

---

## 2. Prepare Networking for the Backend
1. **Create or validate VPC** (if the front end already uses one, ensure separation via subnets or new VPC):
   - CIDR (e.g., `10.20.0.0/16`), with two public subnets and two private subnets across separate Availability Zones.
   - Attach an Internet Gateway and create NAT Gateway(s) only if outbound internet is required from private subnets.
2. **Security Groups**
   - `alb-backend-sg`: inbound `443` from internet; outbound `3000` to ECS tasks.
   - `ecs-backend-sg`: inbound `3000` from ALB SG; outbound `443` to Secrets Manager/ECR and DynamoDB endpoints.
3. **VPC Endpoints** (optional but recommended): create interface endpoints for `com.amazonaws.ap-south-1.secretsmanager`, `ecr.api`, `ecr.dkr`, and `logs`. This allows ECS tasks to reach AWS services without traversing NAT.

---

## 3. Configure Secrets and Environment Values
1. **AWS Secrets Manager**
   - Create secret `asharvi/backend/prod` with JSON keys like `AWS_REGION`, `PARENTS_TABLE_NAME`, `CHILDREN_TABLE_NAME`, `COURSES_TABLE_NAME`, `COURSE_PROGRESS_TABLE_NAME`, `INSTRUCTORS_TABLE_NAME`, `QUESTIONS_TABLE_NAME`, `OTPS_TABLE_NAME`, `CHILD_EDUCATION_TABLE_NAME`, `CHILD_NUTRITION_TABLE_NAME`, `JWT_SECRET`, `SMTP_USER`, `SMTP_PASS`, `CORS_ORIGIN`.
   - For staging, duplicate as `asharvi/backend/staging` with appropriate values.
2. **Parameter Store (optional)**
   - Store non-sensitive settings (log level, feature flags) as parameters.
3. **Update IAM policies** to grant the ECS task role read access to these secrets/parameters only.

---

## 4. Provision Container Registry and Build Pipeline
1. **Create ECR repositories**
   - `asharvi-backend-staging`
   - `asharvi-backend-prod`
   - Enable image scanning and set lifecycle policies to retain the last N images (e.g., 20).
2. **CI/CD pipeline**
   - If using GitHub Actions, ensure repository secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECR_REPO`, `ECS_CLUSTER`, `ECS_SERVICE`) are updated.
   - Pipeline stages: lint/test → build Docker image → push to ECR → update ECS service. Confirm IAM deploy role has permissions for these actions.

---

## 5. Set Up ECS Fargate Infrastructure
1. **ECS Cluster** – Create `asharvi-backend-cluster` (Fargate). Enable Container Insights for monitoring.
2. **Task Definitions**
   - Use Node.js 18 image built from repository Dockerfile.
   - CPU/memory recommendations: staging (0.5 vCPU/1 GB), production (1 vCPU/2 GB). Adjust per load tests.
   - Configure container to listen on port `3000`. Add health check command hitting `/ready`.
   - Inject secrets from Secrets Manager using `ValueFrom` references.
   - Configure logging with awslogs to `/aws/ecs/asharvi-backend`.
3. **ECS Services**
   - Create separate services for staging and production with desired count ≥2 in different subnets.
   - Enable circuit breaker and deployment minimum healthy percent of 100/200.
   - Attach to corresponding target groups (created in the ALB step).
   - Configure auto-scaling (scale out at 60% CPU/memory, scale in at 30%).

---

## 6. Application Load Balancer and Routing
1. **Create ALB** `asharvi-backend-alb`
   - Internet-facing, placed in public subnets.
   - Listeners: HTTP (80) redirect to HTTPS (443), HTTPS (443) with ACM certificate (`api.example.com`).
2. **Target Groups**
   - Staging: `asharvi-backend-tg-stg` – health check path `/ready`.
   - Production: `asharvi-backend-tg-prod` – same health check.
3. **Route 53**
   - Add `api.example.com` (prod) and `staging-api.example.com` records pointing to the ALB via alias.
   - Use weighted or latency routing if needed.

---

## 7. Database Integration (DynamoDB)
1. **Provision DynamoDB tables**
   - Tables: parents, children, courses, course_progress, instructors, questions, otps, child_education, child_nutrition.
   - Partition key: `id` (string). Add GSIs as needed for access patterns (email, slug, childId, userId/courseId, etc.).
2. **Throughput/Autoscaling**
   - Enable auto-scaling (RCU/WCU) per table or use on-demand.
3. **VPC Endpoints**
   - Create DynamoDB gateway endpoint for private subnets.
4. **Backups/Monitoring**
   - Enable point-in-time recovery. Set CloudWatch alarms on throttling/consumed capacity.

---

## 8. Monitoring, Logging, and Alerts
1. **CloudWatch Logs** – Verify log groups exist (`/aws/ecs/asharvi-backend-staging` and `/aws/ecs/asharvi-backend-prod`) with retention (e.g., 30 days).
2. **CloudWatch Metrics & Alarms**
   - Create dashboards tracking ALB target response time, ECS CPU/memory, task count, and custom application metrics if emitted.
   - Set alarms for high 5xx errors, unhealthy host count, and scaling thresholds. Send notifications to existing SNS topics or create `asharvi-backend-alerts` topic.
3. **Tracing (optional)** – Enable AWS X-Ray or third-party APM if deeper tracing is required. Grant task role necessary permissions.

---

## 9. Deployment and Validation Steps
1. **First Deployment**
   - Push code to staging branch; CI/CD pipeline should build, push image, update staging ECS service.
   - Wait for tasks to pass health checks; confirm via `aws ecs describe-services` and ALB target group health.
   - Run smoke tests against `https://staging-api.example.com/health-check`.
2. **Production Rollout**
   - Merge to `main` or trigger prod pipeline. Require manual approval if using GitHub environments.
   - Monitor CloudWatch metrics and logs for anomalies during rollout. Use ECS deployment circuit breaker for automatic rollback on failures.
3. **Post-Deployment Review**
   - Validate IAM access logs for unusual activity.
   - Ensure secrets rotation alarms are configured and documented.
   - Review cost explorer for new backend resources to establish baseline spend.

---

## 10. Maintenance Checklist
- Rotate Secrets Manager values and ECS task role credentials regularly.
- Patch Docker base images monthly; update Dockerfile to latest Node.js LTS when available.
- Review auto-scaling policies quarterly based on load trends.
- Test disaster recovery by simulating DynamoDB throttling/failures and verifying application behavior.
- Document runbooks for incident response, scaling changes, and deployment rollback procedures.
