# terraform

> **Categoria**: devops
> **Tags**: terraform, opentofu, iac, hcl, modules, state, atlantis

Terraform/OpenTofu: HCL syntax, state management (remote state, locking), modules, workspaces, providers, CI/CD integration (Terragrunt, Atlantis), best practices.

## Quando Usar

Use ao provisionar infraestrutura como c�digo, gerenciar state remoto, criar m�dulos reutiliz�veis, configurar workspaces multi-ambiente, ou integrar Terraform em CI/CD.

## HCL Syntax & Resources

**HCL b�sico**:

```hcl
terraform {
  required_version = ">= 1.8"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "my-tfstate"
    key    = "prod/network/terraform.tfstate"
    region = "us-east-1"
  }
}

variable "environment" {
  type        = string
  description = "Environment name"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod"
  }
}

resource "aws_s3_bucket" "data" {
  bucket = "my-data-${var.environment}"
  tags = {
    Name        = "Data bucket"
    Environment = var.environment
  }
}

output "bucket_arn" {
  value       = aws_s3_bucket.data.arn
  description = "Bucket ARN"
}
```

**Data sources**: ler recursos existentes

```hcl
data "aws_vpc" "existing" {
  tags = { Name = "my-vpc" }
}
```

## State Management

**Remote State** (essencial para times):

```hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "${var.project}/${var.environment}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # para locking
  }
}
```

**State locking** (DynamoDB ou similar):

```bash
# Tabela DynamoDB para locks
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}
```

**Boas pr�ticas de state**:

- **NUNCA** commitar `terraform.tfstate` (cont�m secrets)
- Sempre usar remote state + locking
- Separar state por ambiente (dev/staging/prod)
- Separar state por componente (network, app, database)
- `terraform state rm` para remover recursos do state
- `terraform import` para recursos existentes

## Modules

**Module structure**:

```
modules/
+-- vpc/
�   +-- main.tf          ? recursos principais
�   +-- variables.tf     ? inputs
�   +-- outputs.tf      ? outputs
�   +-- README.md       ? documenta��o
+-- ecs-service/
+-- rds/
```

**Module example**:

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "this" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  tags = merge(var.tags, { Name = var.name })
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]
}
```

**Module registry** (Terraform Registry para m�dulos p�blicos):

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  name = "my-vpc"
  cidr = "10.0.0.0/16"
  azs  = ["us-east-1a", "us-east-1b"]
}
```

**Versionamento de m�dulos**: tags git (`v1.0.0`) ou registry

## Workspaces

**Workspaces** (multi-ambiente com mesmo m�dulo):

```bash
terraform workspace new dev
terraform workspace new staging
terraform workspace new production
terraform workspace select production
```

**Uso em configura��o**:

```hcl
resource "aws_s3_bucket" "app" {
  bucket = "app-${terraform.workspace}-data"
}
```

**Workspaces vs diret�rios separados**:
| Abordagem | Pr�s | Contras |
|-----------|------|---------|
| **Workspaces** | Menos duplica��o, estado centralizado | Risco de erro humano (workspace errado) |
| **Diret�rios** (`envs/` separados) | Isolamento total, CI/CD mais seguro | Duplica��o, mais manuten��o |
| **Terragrunt** | DRY, m�dulos + configura��o | Depend�ncia extra |

**Recomenda��o**: usar workspaces para ambientes similares (dev/staging), diret�rios separados para production

## CI/CD Integration

**Atlantis** (pull request workflow):

```yaml
# atlantis.yaml
version: 3
projects:
```
