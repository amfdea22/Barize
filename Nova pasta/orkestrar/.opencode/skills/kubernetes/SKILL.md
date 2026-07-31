# kubernetes

> **Categoria**: devops
> **Tags**: kubernetes, k8s, helm, rbac, ingress, prometheus, docker

Kubernetes: Pods, Deployments, Services, ConfigMaps, Secrets, RBAC, Ingress, Helm, Operators, Observabilidade (Prometheus/Grafana), Resource Limits, Namespaces, multi-environment.

## Quando Usar

Use ao implantar aplica��es em Kubernetes, configurar clusters, definir recursos, gerenciar configura��es, ou otimizar workloads em produ��o.

## Core Resources (Pods/Deployments/Services)

**Pod** (menor unidade):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: my-app
    env: production
spec:
  containers:
    - name: my-app
      image: nginx:1.25
      ports:
        - containerPort: 80
      resources:
        requests:
          memory: '256Mi'
          cpu: '250m'
        limits:
          memory: '512Mi'
          cpu: '500m'
      env:
        - name: NODE_ENV
          value: production
      livenessProbe:
        httpGet:
          path: /health
          port: 80
        initialDelaySeconds: 5
        periodSeconds: 10
```
