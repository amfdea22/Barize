# BARIZE - Guia de Infraestrutura Física e Rede

> **Pilar 1**: O Alicerce do Sistema

## 1. Servidor Local Dedicado (Mini-PC / NUC)

### Recomendação de Hardware

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | Intel Celeron / N100 | Intel i5 / AMD Ryzen 5 |
| RAM | 8 GB DDR4 | 16 GB DDR4 |
| Armazenamento | 256 GB SSD NVMe | 512 GB SSD NVMe |
| Rede | 1x Gigabit Ethernet | 2x Gigabit Ethernet (bonding) |
| USB | 2x USB 3.0 | 4x USB 3.0 (para impressoras) |

**Modelos Sugeridos:**
- Intel NUC 13 Pro (i5-1340P, 16GB, 512GB)
- Minisforum UM690 (Ryzen 9, ideal para multitarefa)
- HP EliteDesk 800 G4 Mini (custo-benefício)

### ⚠️ Regras de Ouro
- **NUNCA** rodar o servidor no PC de caixa ou escritório
- **NUNCA** usar HD mecânico (HDD) — SSD é obrigatório
- O servidor deve ser **acessível apenas via SSH/RDP local** (sem exposição à internet)

## 2. Proteção Elétrica (Nobreak / UPS)

### Especificações do Nobreak

| Característica | Exigência |
|----------------|-----------|
| Tipo | UPS Senoidal (Pure Sine Wave) |
| Potência | Mínimo 700VA / 420W |
| Autonomia | Mínimo 15 minutos (para desligamento seguro) |
| Tomadas | 4+ tomadas (servidor + modem + switch + 1 extra) |
| Software | Deve ter comunicação USB/serial para desligamento automático |

### Modelos Sugeridos
- **Nobreak Intelbras UPS Senoidal 1200VA** (recomendado)
- **Nobreak APC Back-UPS Pro 1000VA** (senoidal)
- **Nobreak SMS Sinus 1000VA** (custo-benefício)

### Procedimento de Desligamento Seguro
1. UPS envia sinal para servidor quando bateria está abaixo de 20%
2. Servidor executa script de shutdown graceful:
   ```bash
   docker-compose -f infra/docker-compose.yml stop
   shutdown -h now
   ```

## 3. Rede Cabeada (Ethernet)

### Topologia Recomendada

```
[Modem/Roteador]──[Switch Gigabit]──[Servidor BARIZE (IP Fixo)]
                    ├──[PDV 1 - Caixa]
                    ├──[PDV 2 - Balcão]
                    ├──[Impressora Térmica]
                    └──[Access Point WiFi (opcional)]
```

### Configuração de Rede
- **IP Fixo para o servidor**: Configure reserva DHCP ou IP estático (ex: 192.168.0.100)
- **DNS Local**: Configure entrada em `/etc/hosts` ou DNS local
  ```
  192.168.0.100  barize.local
  ```
- **Switch**: Mínimo 5 portas Gigabit (TP-Link TL-SG105, recomendado)
- **Cabos**: Categoria 5e ou 6 (máximo 100m por segmento)

### Wi-Fi (Apenas se Necessário)
- **Mínimo**: Access Point empresarial (Ubiquiti UniFi, TP-Link EAP)
- **NUNCA**: Usar Wi-Fi de modem residencial para PDVs
- **Rede separada**: Criar VLAN ou SSID exclusivo para os PDVs

## 4. Climatização

### Requisitos do Local do Servidor
- **Temperatura**: 18°C a 25°C
- **Umidade**: 40% a 60%
- **Ventilação**: Circulação de ar constante
- **Limpeza**: Sem poeira excessiva (limpar a cada 3 meses)

### Problemas Comuns
- ❌ Servidor dentro de gaveta ou armário fechado
- ❌ Servidor perto de fogão, forno ou chapa
- ❌ Servidor no chão (risco de água/cerveja)
- ✅ Servidor em prateleira ventilada, longe de fontes de calor

## 5. Checklist de Instalação Física

- [ ] Servidor dedicado (NUC/Mini-PC) adquirido e instalado
- [ ] UPS senoidal conectado e testado (simular queda de energia)
- [ ] Switch Gigabit instalado com cabos CAT5e/6
- [ ] IP fixo configurado para o servidor
- [ ] DNS local configurado (barize.local)
- [ ] Local do servidor ventilado e climatizado
- [ ] Backup em pendrive/nuvem configurado e testado
- [ ] Impressora térmica conectada via Ethernet ou USB
- [ ] PDVs testados na rede cabeada
- [ ] Script de desligamento seguro testado
