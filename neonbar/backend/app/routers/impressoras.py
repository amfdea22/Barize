from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import socket
import struct
import time
import subprocess
import platform
import re

router = APIRouter(prefix="/impressoras", tags=["impressoras"])

class ImpressoraCreate(BaseModel):
    nome: str
    modelo: str
    ip: str
    porta: int = 9100
    tipo: str = "wifi"

class ImpressoraUpdate(BaseModel):
    nome: Optional[str] = None
    modelo: Optional[str] = None
    ip: Optional[str] = None
    porta: Optional[int] = None
    tipo: Optional[str] = None

# Armazenamento local (em produção usar banco de dados)
impressoras_db = []
next_id = 1

@router.get("")
def listar_impressoras():
    return impressoras_db

@router.post("")
def criar_impressora(imp: ImpressoraCreate):
    global next_id
    nova = {
        "id": next_id,
        "nome": imp.nome,
        "modelo": imp.modelo,
        "ip": imp.ip,
        "porta": imp.porta,
        "tipo": imp.tipo,
        "status": "online" if testar_conexao(imp.ip, imp.porta) else "offline",
        "impressoes": 0,
        "padrao": len(impressoras_db) == 0
    }
    impressoras_db.append(nova)
    next_id += 1
    return nova

@router.put("/{imp_id}")
def atualizar_impressora(imp_id: int, imp: ImpressoraUpdate):
    for i, p in enumerate(impressoras_db):
        if p["id"] == imp_id:
            if imp.nome is not None:
                impressoras_db[i]["nome"] = imp.nome
            if imp.modelo is not None:
                impressoras_db[i]["modelo"] = imp.modelo
            if imp.ip is not None:
                impressoras_db[i]["ip"] = imp.ip
            if imp.porta is not None:
                impressoras_db[i]["porta"] = imp.porta
            if imp.tipo is not None:
                impressoras_db[i]["tipo"] = imp.tipo
            impressoras_db[i]["status"] = "online" if testar_conexao(impressoras_db[i]["ip"], impressoras_db[i]["porta"]) else "offline"
            return impressoras_db[i]
    raise HTTPException(status_code=404, detail="Impressora não encontrada")

@router.delete("/{imp_id}")
def excluir_impressora(imp_id: int):
    global impressoras_db
    impressoras_db = [p for p in impressoras_db if p["id"] != imp_id]
    return {"ok": True}

@router.post("/{imp_id}/testar")
def testar_impressao(imp_id: int):
    for p in impressoras_db:
        if p["id"] == imp_id:
            if testar_conexao(p["ip"], p["porta"]):
                return {"ok": True, "mensagem": "Teste enviado com sucesso"}
            else:
                raise HTTPException(status_code=500, detail="Não foi possível conectar à impressora")
    raise HTTPException(status_code=404, detail="Impressora não encontrada")

@router.put("/{imp_id}/padrao")
def definir_padrao(imp_id: int):
    for p in impressoras_db:
        p["padrao"] = p["id"] == imp_id
    return {"ok": True}

@router.get("/scan")
def escanear_rede():
    """Escaneia a rede local em busca de impressoras térmicas"""
    detectadas = []
    
    # Obtém o IP local
    ip_local = obter_ip_local()
    if not ip_local:
        return detectadas
    
    # Extrai a rede base (ex: 192.168.1)
    partes = ip_local.split('.')
    if len(partes) != 4:
        return detectadas
    
    rede_base = f"{partes[0]}.{partes[1]}.{partes[2]}"
    
    # Portas comuns de impressoras térmicas
    portas_comuns = [9100, 9101, 9102, 8080, 80, 443]
    
    # Fabricantes conhecidos de impressoras térmicas
    fabricantes_conhecidos = ['epson', 'bematech', 'elgin', 'diebold', 'star', 'citizen', 'pos']
    
    # Escaneia IPs na rede (limitado para performance)
    ips_para_escanear = []
    for i in range(1, 255):
        ips_para_escanear.append(f"{rede_base}.{i}")
    
    # Escaneia paralelamente usando threads
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    def verificar_ip(ip):
        resultados = []
        for porta in portas_comuns:
            if testar_conexao_rapida(ip, porta):
                # Tenta identificar o modelo
                modelo = identificar_impressora(ip, porta)
                resultados.append({
                    "ip": ip,
                    "nome": f"Impressora {ip}",
                    "modelo": modelo,
                    "fabricante": identificar_fabricante(modelo),
                    "porta": porta
                })
                break
        return resultados
    
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(verificar_ip, ip): ip for ip in ips_para_escanear}
        for future in as_completed(futures, timeout=10):
            try:
                resultados = future.result()
                detectadas.extend(resultados)
            except Exception:
                pass
    
    return detectadas

def testar_conexao(ip: str, porta: int) -> bool:
    """Testa se a impressora estárespondendo"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        resultado = sock.connect_ex((ip, porta))
        sock.close()
        return resultado == 0
    except:
        return False

def testar_conexao_rapida(ip: str, porta: int) -> bool:
    """Teste rápido de conexão"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        resultado = sock.connect_ex((ip, porta))
        sock.close()
        return resultado == 0
    except:
        return False

def identificar_impressora(ip: str, porta: int) -> str:
    """Tenta identificar o modelo da impressora via SCPI/status"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        sock.connect((ip, porta))
        
        # Comando ESC/POS para identificação (Epson)
        sock.send(b'\x1b\x40')  # Inicializa
        sock.send(b'\x1b\x32')  # ESC/POS Status
        time.sleep(0.5)
        
        dados = sock.recv(1024)
        sock.close()
        
        if dados:
            # Tenta extrair informações do modelo
            texto = dados.decode('ascii', errors='ignore').strip()
            if 'TM-' in texto:
                return texto[:20]
            elif 'T20' in texto or 'T88' in texto:
                return texto[:20]
    except:
        pass
    
    return "Impressora Térmica"

def identificar_fabricante(modelo: str) -> str:
    """Identifica o fabricante pelo modelo"""
    modelo_lower = modelo.lower()
    fabricantes = {
        'epson': ['tm-', 't20', 't88', 'epson'],
        'bematech': ['mp-', 'bematech'],
        'elgin': ['i9', 'ifood', 'elgin'],
        'diebold': ['compact', 'diebold'],
        'star': ['star', 'tsp'],
        'citizen': ['citizen', 'ct-'],
        'pos': ['pos', 'printer']
    }
    
    for fab, keywords in fabricantes.items():
        for kw in keywords:
            if kw in modelo_lower:
                return fab
    
    return "Desconhecido"

def obter_ip_local() -> str:
    """Obtém o IP local da máquina"""
    try:
        # Tenta obter via socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        pass
    
    try:
        # Tenta obter via comando do sistema
        if platform.system() == "Windows":
            resultado = subprocess.run(['ipconfig'], capture_output=True, text=True)
            # Procura por IPv4
            for linha in resultado.stdout.split('\n'):
                if 'IPv4' in linha:
                    ip = re.search(r'(\d+\.\d+\.\d+\.\d+)', linha)
                    if ip:
                        return ip.group(1)
        else:
            resultado = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
            return resultado.stdout.strip().split()[0]
    except:
        pass
    
    return "192.168.1.100"  # Fallback
