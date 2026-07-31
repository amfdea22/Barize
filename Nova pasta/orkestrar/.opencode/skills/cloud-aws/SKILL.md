# cloud-aws

> **Categoria**: devops
> **Tags**: aws, cloud, iam, lambda, ecs, s3, rds, dynamodb, cdk

AWS fundamentals: IAM, Lambda, ECS/EKS, S3, RDS, DynamoDB, VPC, CloudWatch, CDK/Terraform e cost optimization.

## Quando Usar

Use ao projetar arquitetura AWS, configurar infraestrutura, definir permiss�es IAM, escolher servi�os de armazenamento ou otimizar custos em cloud.

## IAM Security Best Practices

**Least privilege** � conceder apenas permiss�es necess�rias:

```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/uploads/*"
}
```

**Pr�ticas essenciais**:

- **NUNCA usar root account** (ativar MFA, criar admin user)
- **Roles > Users**: prefira IAM Roles a IAM Users
- **Service control policies (SCP)**: boundary de permiss�es em Organization
- **Access Analyzer**: detecta recursos compartilhados publicamente
- **Conditions**: `aws:SourceIp`, `aws:MultiFactorAuthPresent`, `aws:RequestedRegion`
- **Rotacionar keys**: no m�ximo 90 dias

**Credenciais tempor�rias**: STS AssumeRole para acesso cross-account

```bash
aws sts assume-role --role-arn "arn:aws:iam::123456:role/MyRole" \
  --role-session-name "deploy-session"
```

## Compute (Lambda & ECS)

**Lambda** (serverless):

- Timeout m�ximo: 15 minutos (use ECS/Fargate para mais)
- Mem�ria: 128MB-10GB (CPU escala com mem�ria)
- Cold start: ~200ms-1s (Java/.NET maiores)
- **Warmer**: EventBridge Scheduler para keep-warm
- **Lambda Layers**: depend�ncias compartilhadas entre fun��es
- **SnapStart**: reduz cold start para <200ms (Java 11+)

**ECS** (containers gerenciados):

```yaml
# Task definition (excerpt)
family: my-app
cpu: 256
memory: 512
networkMode: awsvpc
executionRoleArn: arn:aws:iam::...
containerDefinitions:
  - name: app
    image: 123456.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
    cpu: 256
    memory: 512
    essential: true
    portMappings:
      - containerPort: 3000
        protocol: tcp
    environment:
      - name: NODE_ENV
        value: production
    logConfiguration:
      logDriver: awslogs
      options:
        awslogs-group: /ecs/my-app
        awslogs-region: us-east-1
        awslogs-stream-prefix: ecs
```
