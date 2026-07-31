"""
BARIZE - Rotas Administrativas
Pilar 2: Gerenciamento de Logs e Configurações do Sistema
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from loguru import logger
import platform
import os
import time
from datetime import datetime

from ..database import get_db, get_engine as engine
from ..models.usuario import Usuario
from ..middleware.metrics import metrics_store
from ..models.printer_config import PrinterConfig
from ..schemas.printer import (
    PrinterConfigResponse,
    PrinterConfigUpdate,
    PrinterTestRequest,
    PrinterTestResponse,
)
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/health")
def health_check():
    """Health check simples para monitoramento."""
    return {
        "status": "ok",
        "servico": "BARIZE API",
        "versao": "1.0.0",
        "hostname": platform.node(),
    }


@router.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    """Verifica conexão com o banco de dados."""
    try:
        db.execute(db.text("SELECT 1"))
        return {"status": "ok", "database": "conectado"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Banco de dados indisponível: {e}")


@router.get("/images")
def list_images(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista imagens com info de atribuição a produtos (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])
    from ..models.produto import Produto
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    assigned = db.query(Produto).filter(Produto.foto_url.isnot(None)).all()
    assigned_map = {}
    for p in assigned:
        fname = p.foto_url.split("/")[-1]
        assigned_map[fname] = {"id": p.id, "nome": p.nome}
    images = []
    for f in sorted(os.listdir(uploads_dir)):
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
            path = os.path.join(uploads_dir, f)
            size = os.path.getsize(path)
            images.append({
                "filename": f,
                "url": f"/uploads/{f}",
                "size_bytes": size,
                "size_kb": round(size / 1024, 1),
                "assigned_to": assigned_map.get(f),
            })
    return {"images": images}


@router.post("/produtos/{produto_id}/imagem")
def assign_product_image(
    produto_id: int,
    filename: str,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atribui uma imagem do uploads a um produto (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    path = os.path.join(uploads_dir, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Imagem não encontrada no servidor")

    from ..models.produto import Produto
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    produto.foto_url = f"/uploads/{filename}"
    db.commit()
    logger.info(f"[Admin] Imagem '{filename}' atribuída ao produto #{produto_id} ({produto.nome})")
    return {"url": produto.foto_url, "produto_id": produto_id, "produto_nome": produto.nome}

@router.get("/metrics")
def system_metrics(current_user: Usuario = Depends(get_current_user)):
    """Métricas de requisições por endpoint (admin)."""
    verificar_role(current_user, ["admin"])
    raw = metrics_store.snapshot()
    endpoints = {}
    for key, data in raw.items():
        endpoints[key] = {
            "total": data["count"],
            "erros": data["errors"],
            "duracao_total_s": round(data["total_duration"], 3),
            "duracao_media_ms": round(data["total_duration"] / data["count"] * 1000, 2) if data["count"] else 0,
            "taxa_erro_pct": round(data["errors"] / data["count"] * 100, 2) if data["count"] else 0,
        }
    return {"endpoints": endpoints}


@router.get("/health/enhanced")
def health_enhanced(db: Session = Depends(get_db)):
    """Health check detalhado com métricas do sistema."""
    result = {
        "status": "ok",
        "servico": "BARIZE API",
        "versao": "1.0.0",
        "hostname": platform.node(),
        "plataforma": platform.platform(),
        "python": platform.python_version(),
        "timestamp": datetime.utcnow().isoformat(),
        "banco": {"status": "desconhecido"},
    }
    try:
        db.execute(db.text("SELECT 1"))
        result["banco"] = {"status": "conectado", "tipo": str(engine.url).split(":")[0]}
    except Exception as e:
        result["banco"] = {"status": "erro", "detalhe": str(e)}
        result["status"] = "degradado"
    return result


@router.get("/logs")
def obter_logs(
    lines: int = 50,
    current_user: Usuario = Depends(get_current_user),
):
    """Retorna as últimas linhas do log (admin)."""
    verificar_role(current_user, ["admin"])

    log_file = "/var/log/barize/barize.log"
    if not os.path.exists(log_file):
        # Fallback para log local
        log_file = "barize.log"

    try:
        if os.path.exists(log_file):
            with open(log_file, "r") as f:
                all_lines = f.readlines()
                last_lines = all_lines[-lines:]
            return {
                "arquivo": log_file,
                "total_linhas": len(all_lines),
                "linhas": "".join(last_lines),
            }
        else:
            return {"arquivo": log_file, "mensagem": "Arquivo de log não encontrado"}
    except Exception as e:
        return {"erro": str(e)}


@router.post("/logs/level")
def set_log_level(
    level: str,
    current_user: Usuario = Depends(get_current_user),
):
    """Altera o nível de log em tempo real (admin)."""
    verificar_role(current_user, ["admin"])

    valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
    if level.upper() not in valid_levels:
        raise HTTPException(
            status_code=400,
            detail=f"Nível inválido. Válidos: {valid_levels}",
        )

    logger.remove()
    logger.add(
        sink=lambda msg: print(msg, end=""),
        level=level.upper(),
    )
    logger.info(f"[ADMIN] Nível de log alterado para {level.upper()}")
    return {"sucesso": True, "level": level.upper()}


# ─── Printer Configuration ─────────────────────────────────────


def _get_printer_config(db: Session) -> PrinterConfig:
    """Retorna a config ativa ou cria default."""
    config = db.query(PrinterConfig).filter(PrinterConfig.ativo == True).first()
    if not config:
        config = PrinterConfig(
            tipo="network",
            host="",
            porta=9100,
            baud_rate=9600,
            timeout=5.0,
            ativo=True,

        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get("/printer-config", response_model=PrinterConfigResponse)
def obter_config_impressora(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna a configuração atual da impressora."""
    verificar_role(current_user, ["admin", "gerente"])
    return _get_printer_config(db)


@router.put("/printer-config", response_model=PrinterConfigResponse)
def atualizar_config_impressora(
    data: PrinterConfigUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza a configuração da impressora."""
    verificar_role(current_user, ["admin"])
    config = _get_printer_config(db)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(config, key, value)
    db.commit()
    db.refresh(config)
    logger.info(f"[ADMIN] Config de impressora atualizada: {config.tipo} / {config.host}")
    return config


@router.post("/printer-test", response_model=PrinterTestResponse)
def testar_impressora(
    data: PrinterTestRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Testa a conexão com a impressora.
    Tenta conectar e enviar um texto de teste.
    """
    verificar_role(current_user, ["admin", "gerente"])

    try:
        from escpos.printer import Network, Usb, Serial
        ESCPOS_OK = True
    except ImportError:
        ESCPOS_OK = False

    if not ESCPOS_OK:
        return PrinterTestResponse(
            sucesso=True,
            mensagem="Modo simulação — python-escpos não instalado. A impressão funcionará em modo simulado.",
        )

    try:
        printer = None
        if data.tipo == "network":
            host = data.host or ""
            if not host:
                return PrinterTestResponse(
                    sucesso=False,
                    mensagem="Host não informado para impressora de rede.",
                )
            printer = Network(host, data.porta or 9100)
        elif data.tipo == "usb":
            printer = Usb()
        elif data.tipo == "serial":
            printer = Serial(baud=data.baud_rate or 9600, timeout=data.timeout or 5.0)
        else:
            return PrinterTestResponse(
                sucesso=False,
                mensagem=f"Tipo de impressora inválido: {data.tipo}",
            )

        printer.text("\n\n")
        printer.text("=== NEONBAR - TESTE DE IMPRESSÃO ===\n")
        printer.text("Impressora configurada com sucesso!\n")
        printer.text(f"Tipo: {data.tipo}\n")
        if data.host:
            printer.text(f"Host: {data.host}:{data.porta or 9100}\n")
        printer.text(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        printer.text("====================================\n\n\n")
        printer.cut()

        return PrinterTestResponse(
            sucesso=True,
            mensagem="Teste de impressão enviado com sucesso!",
        )

    except Exception as e:
        logger.error(f"[ADMIN] Falha no teste de impressão: {e}")
        return PrinterTestResponse(
            sucesso=False,
            mensagem=f"Falha na conexão: {str(e)}",
        )
