/**
 * Print Service — WebSocket para impressão térmica
 * 
 * Envia comandas para impressoras térmicas via WebSocket.
 * Protocolo: ESC/POS via WebSocket (backend roteia para impressora correta).
 * 
 * Uso:
 *   printService.connect()
 *   printService.printComanda(comanda)
 *   printService.printEtiqueta(etiqueta)
 */

type PrintCallback = (result: { ok: boolean; error?: string }) => void;

class PrintService {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, PrintCallback[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;

  constructor() {
    // Backend WebSocket URL — same host, path /ws/print
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/ws/print`;
  }

  /** Connect to print WebSocket */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[Print] Conectado');
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.listeners.has(msg.id)) {
            const callbacks = this.listeners.get(msg.id)!;
            callbacks.forEach((cb) => cb(msg));
            this.listeners.delete(msg.id);
          }
        } catch { /* ignore parse errors */ }
      };

      this.ws.onclose = () => {
        console.log('[Print] Desconectado — reconectando...');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  /** Disconnect */
  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  /** Check if connected */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** Send print job */
  private send(type: string, data: Record<string, any>, callback?: PrintCallback): boolean {
    if (!this.connected) {
      callback?.({ ok: false, error: 'WebSocket não conectado' });
      return false;
    }

    const id = `print_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const msg = { id, type, ...data, timestamp: Date.now() };

    if (callback) {
      this.listeners.set(id, [callback]);
      // Timeout after 10s
      setTimeout(() => {
        if (this.listeners.has(id)) {
          this.listeners.get(id)!.forEach((cb) => cb({ ok: false, error: 'Timeout' }));
          this.listeners.delete(id);
        }
      }, 10000);
    }

    this.ws!.send(JSON.stringify(msg));
    return true;
  }

  /** Print comanda (80mm thermal) */
  printComanda(comanda: {
    id: number;
    mesa: string;
    cliente?: string;
    itens: Array<{ nome: string; quantidade: number; observacao?: string }>;
    setor?: 'CAIXA' | 'COZINHA' | 'BAR';
  }, callback?: PrintCallback): boolean {
    const header = `=== BARIZE ===\nComanda #${comanda.id}\nMesa: ${comanda.mesa}${comanda.cliente ? `\nCliente: ${comanda.cliente}` : ''}\n${'─'.repeat(32)}\n`;
    const items = comanda.itens
      .map((i) => `${i.quantidade}x ${i.nome}${i.observacao ? ` (${i.observacao})` : ''}`)
      .join('\n');
    const footer = `\n${'─'.repeat(32)}\nHora: ${new Date().toLocaleTimeString('pt-BR')}\n`;

    return this.send('print', {
      setor: comanda.setor || 'BAR',
      content: header + items + footer,
      raw: { comanda },
    }, callback);
  }

  /** Print etiqueta (80mm thermal) */
  printEtiqueta(etiqueta: {
    nome: string;
    quantidade: number;
    unidade: string;
    lote: string;
    validade: string;
    responsavel: string;
  }, callback?: PrintCallback): boolean {
    const content = `=== ETIQUETA ===\n${etiqueta.nome}\nQtd: ${etiqueta.quantidade} ${etiqueta.unidade}\nLote: ${etiqueta.lote}\nValidade: ${etiqueta.validade}\nResp: ${etiqueta.responsavel}\n`;

    return this.send('print', {
      setor: 'CAIXA',
      content,
      raw: { etiqueta },
    }, callback);
  }

  /** Print raw ESC/POS content */
  printRaw(content: string, setor: string = 'CAIXA', callback?: PrintCallback): boolean {
    return this.send('print', { setor, content }, callback);
  }

  /** Reconnect with exponential backoff */
  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
      this.connect();
    }, this.reconnectDelay);
  }
}

export const printService = new PrintService();
