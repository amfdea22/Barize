/**
 * BARIZE - Serviço de Impressão (Bluetooth + USB)
 * Usa Web Bluetooth / Web USB API para imprimir diretamente do navegador
 * Compatível com impressoras térmicas ESC/POS (Epson, Bematech, Elgin, etc.)
 *
 * Suporta auto-conexao: busca dispositivos ja pareados/autorizados
 */

// ─── Tipos Web Bluetooth ───────────────────────────────────

interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
  name?: string;
  id?: string;
  addEventListener: (type: string, listener: EventListener) => void;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  connected: boolean;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  writeValue(value: BufferSource): Promise<void>;
  properties: { write: boolean; writeWithoutResponse: boolean };
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  getDevices(): Promise<BluetoothDevice[]>;
}

declare global {
  interface Navigator {
    bluetooth?: Bluetooth;
    usb?: USB;
  }
}

interface RequestDeviceOptions {
  filters?: BluetoothFilter[];
  optionalServices?: string[];
  acceptAllDevices?: boolean;
}

interface BluetoothFilter {
  services?: string[];
  namePrefix?: string;
  name?: string;
}

// ─── Tipos Web USB ─────────────────────────────────────────

interface USB {
  requestDevice(options: USBRequestDeviceOptions): Promise<USBDevice>;
  getDevices(): Promise<USBDevice[]>;
}

interface USBRequestDeviceOptions {
  filters: USBDeviceFilter[];
}

interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
}

interface USBDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  configuration?: USBConfiguration;
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBIsochronousOutTransferResult>;
}

interface USBConfiguration {
  configurationValue: number;
  interfaces: USBInterface[];
}

interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
}

interface USBAlternateInterface {
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  endpoints: USBEndpoint[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: string;
  type: string;
  packetSize: number;
}

interface USBIsochronousOutTransferResult {
  bytesWritten: number;
}

// ─── ESC/POS Commands ──────────────────────────────────────

const ESCPOS = {
  initialize: new Uint8Array([0x1B, 0x40]),
  cut: new Uint8Array([0x1D, 0x56, 0x42, 0x00]),
  boldOn: new Uint8Array([0x1B, 0x45, 0x01]),
  boldOff: new Uint8Array([0x1B, 0x45, 0x00]),
  center: new Uint8Array([0x1B, 0x61, 0x01]),
  left: new Uint8Array([0x1B, 0x61, 0x00]),
  lineFeed: new Uint8Array([0x0A]),
  normal: new Uint8Array([0x1B, 0x21, 0x00]),
  doubleHeight: new Uint8Array([0x1B, 0x21, 0x10]),
};

// ─── Interfaces ────────────────────────────────────────────

interface PrintItem {
  nome: string;
  quantidade: number;
  preco?: number;
  observacao?: string;
}

interface PrintComandaData {
  comanda_numero: string;
  mesa: string;
  itens: PrintItem[];
  cliente?: string;
  garcom?: string;
}

interface PrintFechamentoData {
  comanda_numero: string;
  mesa: string;
  cliente?: string;
  atendente?: string;
  itens: PrintItem[];
  valor_bruto: number;
  desconto: number;
  taxa: number;
  valor_final: number;
  forma_pagamento: string;
  troco?: number;
}

type ConnectionType = 'bluetooth' | 'usb';

export interface DiscoveredPrinter {
  id: string;
  name: string;
  type: ConnectionType;
}

class PrinterService {
  private btDevice: BluetoothDevice | null = null;
  private btServer: BluetoothRemoteGATTServer | null = null;
  private btCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  private usbDevice: USBDevice | null = null;
  private usbEndpoint = 1;

  private isConnectedFlag = false;
  private connectionType: ConnectionType | null = null;
  private deviceName = '';

  // Vendor IDs de impressoras termicas
  private readonly PRINTER_VENDOR_IDS = [
    0x04B8, // Epson
    0x0815, // Bematech
    0x0CCD, // Elgin
    0x0456, // Analogic
    0x0493, // Star Micronics
    0x0407, // Citizen
    0x0A5F, // Zebra
  ];

  /**
   * Busca dispositivos Bluetooth/USB previamente autorizados pelo navegador.
   * SO retorna dispositivos que o usuario ja autorizou via requestDevice().
   */
  async discoverPrinters(): Promise<DiscoveredPrinter[]> {
    const printers: DiscoveredPrinter[] = [];

    if (navigator.bluetooth) {
      try {
        const btDevices = await navigator.bluetooth.getDevices();
        for (const dev of btDevices) {
          printers.push({
            id: dev.id || `bt-${dev.name}`,
            name: dev.name || 'Impressora Bluetooth',
            type: 'bluetooth',
          });
        }
      } catch (e) {
        console.warn('[Printer] Erro ao buscar Bluetooth:', e);
      }
    }

    if (navigator.usb) {
      try {
        const usbDevices = await navigator.usb.getDevices();
        for (const dev of usbDevices) {
          const isPrinter = this.PRINTER_VENDOR_IDS.includes(dev.vendorId);
          if (isPrinter) {
            printers.push({
              id: `usb-${dev.vendorId}-${dev.productId}`,
              name: dev.productName || dev.manufacturerName || 'Impressora USB',
              type: 'usb',
            });
          }
        }
      } catch (e) {
        console.warn('[Printer] Erro ao buscar USB:', e);
      }
    }

    return printers;
  }

  /**
   * Tenta reconectar a dispositivos ja autorizados.
   */
  async autoConnect(): Promise<boolean> {
    const printers = await this.discoverPrinters();
    if (printers.length === 0) return false;

    // Tenta Bluetooth primeiro
    const bt = printers.find(p => p.type === 'bluetooth');
    if (bt) {
      const ok = await this.reconnectBluetooth();
      if (ok) return true;
    }

    // Depois USB
    const usb = printers.find(p => p.type === 'usb');
    if (usb) {
      const ok = await this.reconnectUSB();
      if (ok) return true;
    }

    return false;
  }

  /**
   * Reconecta a um Bluetooth ja autorizado (sem picker)
   */
  private async reconnectBluetooth(): Promise<boolean> {
    try {
      const devices = await navigator.bluetooth!.getDevices();
      for (const dev of devices) {
        try {
          this.btDevice = dev;
          this.btDevice.addEventListener('gattserverdisconnected', () => {
            this.isConnectedFlag = false;
            this.connectionType = null;
          });

          this.btServer = (await this.btDevice.gatt?.connect()) || null;
          if (!this.btServer) continue;

          // Tenta encontrar characteristic
          try {
            const service = await this.btServer.getPrimaryService('00001800-0000-1000-8000-00805f9b34fb');
            const chars = await service.getCharacteristics();
            this.btCharacteristic = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || null;
          } catch {
            try {
              const service = await this.btServer.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
              this.btCharacteristic = await service.getCharacteristic('00001102-0000-1000-8000-00805f9b34fb');
            } catch {
              continue;
            }
          }

          if (!this.btCharacteristic) continue;

          this.isConnectedFlag = true;
          this.connectionType = 'bluetooth';
          this.deviceName = this.btDevice.name || 'Bluetooth';
          console.log(`[Printer] BT reconectado: ${this.deviceName}`);
          return true;
        } catch {
          continue;
        }
      }
    } catch (e) {
      console.warn('[Printer] Falha na reconexao BT:', e);
    }
    return false;
  }

  /**
   * Reconecta a um USB ja autorizado (sem picker)
   */
  private async reconnectUSB(): Promise<boolean> {
    try {
      const devices = await navigator.usb!.getDevices();
      for (const dev of devices) {
        if (!this.PRINTER_VENDOR_IDS.includes(dev.vendorId)) continue;
        try {
          this.usbDevice = dev;
          await this.usbDevice.open();

          if (this.usbDevice.configuration === null) {
            await this.usbDevice.selectConfiguration(1);
          }

          const iface = this.usbDevice.configuration?.interfaces.find(
            (i: USBInterface) => i.alternate.interfaceClass === 7
          );

          if (iface) {
            await this.usbDevice.claimInterface(iface.interfaceNumber);
            const ep = iface.alternate.endpoints?.find((e: any) => e.direction === 'out');
            if (ep) this.usbEndpoint = ep.endpointNumber;
          }

          this.isConnectedFlag = true;
          this.connectionType = 'usb';
          this.deviceName = this.usbDevice.productName || this.usbDevice.manufacturerName || 'USB';
          console.log(`[Printer] USB reconectado: ${this.deviceName}`);
          return true;
        } catch {
          continue;
        }
      }
    } catch (e) {
      console.warn('[Printer] Falha na reconexao USB:', e);
    }
    return false;
  }

  // ─── Conexao Bluetooth (com picker) ─────────────────────

  async connectBluetooth(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        console.error('[Printer] Web Bluetooth nao suportada');
        return false;
      }

      console.log('[Printer] Abrindo seletor Bluetooth...');

      // Filtros amplos - busca todas as impressoras disponiveis
      this.btDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '00001101-0000-1000-8000-00805f9b34fb', // SPP
          '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
          '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
          '00001102-0000-1000-8000-00805f9b34fb', // SPP Data
          '0000fee7-0000-1000-8000-00805f9b34fb', // Common printer service
          '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 BLE
          '0000fff0-0000-1000-8000-00805f9b34fb', // Generic printer
        ],
      });

      console.log(`[Printer] Dispositivo selecionado: ${this.btDevice.name} (${this.btDevice.id})`);

      this.btDevice.addEventListener('gattserverdisconnected', () => {
        this.isConnectedFlag = false;
        this.connectionType = null;
        console.log('[Printer] BT desconectado');
      });

      console.log('[Printer] Conectando ao GATT server...');
      this.btServer = (await this.btDevice.gatt?.connect()) || null;
      if (!this.btServer) {
        console.error('[Printer] Nao conectou ao GATT server');
        return false;
      }
      console.log('[Printer] GATT conectado!');

      // Tenta encontrar characteristic de escrita
      let found = false;

      // Tenta SPP
      if (!found) {
        try {
          console.log('[Printer] Tentando servico SPP...');
          const service = await this.btServer.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
          this.btCharacteristic = await service.getCharacteristic('00001102-0000-1000-8000-00805f9b34fb');
          found = true;
          console.log('[Printer] Characteristic SPP encontrada!');
        } catch { /* continua */ }
      }

      // Tenta Generic Access
      if (!found) {
        try {
          console.log('[Printer] Tentando Generic Access...');
          const service = await this.btServer.getPrimaryService('00001800-0000-1000-8000-00805f9b34fb');
          const chars = await service.getCharacteristics();
          this.btCharacteristic = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || null;
          if (this.btCharacteristic) {
            found = true;
            console.log('[Printer] Characteristic GA encontrada!');
          }
        } catch { /* continua */ }
      }

      // Tenta servicos comuns de impressora
      if (!found) {
        const serviceUUIDs = ['0000fee7-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb', '0000fff0-0000-1000-8000-00805f9b34fb'];
        for (const uuid of serviceUUIDs) {
          try {
            console.log(`[Printer] Tentando servico ${uuid}...`);
            const service = await this.btServer.getPrimaryService(uuid);
            const chars = await service.getCharacteristics();
            this.btCharacteristic = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || null;
            if (this.btCharacteristic) {
              found = true;
              console.log(`[Printer] Characteristic encontrada em ${uuid}!`);
              break;
            }
          } catch { /* continua */ }
        }
      }

      // Ultimo recurso: tenta servico generico conhecido
      if (!found) {
        try {
          console.log('[Printer] Tentando servico generico...');
          const service = await this.btServer.getPrimaryService('00001800-0000-1000-8000-00805f9b34fb');
          const chars = await service.getCharacteristics();
          console.log(`[Printer] ${chars.length} characteristics no servico generico`);
          const writable = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
          if (writable) {
            this.btCharacteristic = writable;
            found = true;
            console.log('[Printer] Characteristic de escrita encontrada!');
          }
        } catch (e) {
          console.error('[Printer] Nenhum servico compativel encontrado:', e);
        }
      }

      if (!this.btCharacteristic) {
        console.error('[Printer] NENHUMA characteristic de escrita encontrada!');
        return false;
      }

      this.isConnectedFlag = true;
      this.connectionType = 'bluetooth';
      this.deviceName = this.btDevice.name || 'Bluetooth';
      console.log(`[Printer] CONECTADO: ${this.deviceName}`);
      return true;
    } catch (error: any) {
      console.error('[Printer] Erro BT:', error?.message || error);
      this.isConnectedFlag = false;
      this.connectionType = null;
      return false;
    }
  }

  // ─── Conexao USB (com picker) ───────────────────────────

  async connectUSB(): Promise<boolean> {
    try {
      if (!navigator.usb) {
        console.error('[Printer] Web USB nao suportada');
        return false;
      }

      this.usbDevice = await navigator.usb.requestDevice({
        filters: [
          { classCode: 7 },
          ...this.PRINTER_VENDOR_IDS.map(vid => ({ vendorId: vid })),
        ],
      });

      await this.usbDevice.open();

      if (this.usbDevice.configuration === null) {
        await this.usbDevice.selectConfiguration(1);
      }

      const iface = this.usbDevice.configuration?.interfaces.find(
        (i: USBInterface) => i.alternate.interfaceClass === 7
      );

      if (iface) {
        await this.usbDevice.claimInterface(iface.interfaceNumber);
        const ep = iface.alternate.endpoints?.find((e: any) => e.direction === 'out');
        if (ep) this.usbEndpoint = ep.endpointNumber;
      }

      this.isConnectedFlag = true;
      this.connectionType = 'usb';
      this.deviceName = this.usbDevice.productName || this.usbDevice.manufacturerName || 'USB';
      console.log(`[Printer] USB conectado: ${this.deviceName}`);
      return true;
    } catch (error: any) {
      console.error('[Printer] Erro USB:', error?.message || error);
      this.isConnectedFlag = false;
      this.connectionType = null;
      return false;
    }
  }

  // ─── Generico ───────────────────────────────────────────

  async connect(type: ConnectionType = 'bluetooth'): Promise<boolean> {
    this.disconnect();
    if (type === 'usb') return this.connectUSB();
    return this.connectBluetooth();
  }

  disconnect(): void {
    if (this.btDevice?.gatt?.connected) {
      this.btDevice.gatt.disconnect();
    }
    this.btDevice = null;
    this.btServer = null;
    this.btCharacteristic = null;

    if (this.usbDevice?.opened) {
      this.usbDevice.close().catch(() => {});
    }
    this.usbDevice = null;

    this.isConnectedFlag = false;
    this.connectionType = null;
    this.deviceName = '';
  }

  getConnectionStatus(): boolean {
    return this.isConnectedFlag;
  }

  getDeviceName(): string {
    return this.deviceName || 'Desconhecida';
  }

  getConnectionType(): ConnectionType | null {
    return this.connectionType;
  }

  // ─── Envio de dados ─────────────────────────────────────

  private async send(data: Uint8Array): Promise<void> {
    if (!this.isConnectedFlag) throw new Error('Nao conectado');

    if (this.connectionType === 'bluetooth' && this.btCharacteristic) {
      // Envia em chunks de 20 bytes (limite BLE)
      for (let i = 0; i < data.length; i += 20) {
        const chunk = data.slice(i, i + 20);
        await this.btCharacteristic.writeValueWithoutResponse(chunk);
      }
    } else if (this.connectionType === 'usb' && this.usbDevice) {
      await this.usbDevice.transferOut(this.usbEndpoint, data);
    } else {
      throw new Error('Nenhum dispositivo conectado');
    }
  }

  private textToBytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  }

  // ─── Impressao (58mm = 32 colunas) ──────────────────────

  async imprimirComanda(data: PrintComandaData): Promise<void> {
    if (!this.isConnectedFlag) throw new Error('Impressora nao conectada');

    const COL = 32;
    const LINHA = '='.repeat(COL);
    const TRACO = '-'.repeat(COL);

    let p = new Uint8Array(0);

    // Cabecalho centralizado
    p = this.concat(p, ESCPOS.initialize);
    p = this.concat(p, ESCPOS.center);
    p = this.concat(p, ESCPOS.boldOn);
    p = this.concat(p, this.textToBytes('BARIZE\n'));
    p = this.concat(p, ESCPOS.normal);
    p = this.concat(p, this.textToBytes('* COMANDA *\n'));
    p = this.concat(p, this.textToBytes(LINHA + '\n'));

    // Comanda e Mesa
    p = this.concat(p, ESCPOS.left);
    p = this.concat(p, this.textToBytes(`Comanda: #${data.comanda_numero}\n`));
    p = this.concat(p, this.textToBytes(`Mesa: ${data.mesa}\n`));
    if (data.cliente) {
      p = this.concat(p, this.textToBytes(`Cliente: ${data.cliente}\n`));
    }
    if (data.garcom) {
      p = this.concat(p, this.textToBytes(`Garcom: ${data.garcom}\n`));
    }
    p = this.concat(p, this.textToBytes(TRACO + '\n'));

    // Itens (quantidade em negrito)
    for (const item of data.itens) {
      p = this.concat(p, ESCPOS.boldOn);
      p = this.concat(p, this.textToBytes(`${item.quantidade}x `));
      p = this.concat(p, ESCPOS.boldOff);
      p = this.concat(p, this.textToBytes(`${item.nome}\n`));
      if (item.observacao) {
        p = this.concat(p, this.textToBytes(`   Obs: ${item.observacao}\n`));
      }
    }

    // Rodape
    p = this.concat(p, this.textToBytes(TRACO + '\n'));
    p = this.concat(p, ESCPOS.center);
    p = this.concat(p, this.textToBytes(`${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`));
    p = this.concat(p, ESCPOS.lineFeed);
    p = this.concat(p, ESCPOS.cut);

    await this.send(p);
  }

  async imprimirFechamento(data: PrintFechamentoData): Promise<void> {
    if (!this.isConnectedFlag) throw new Error('Impressora nao conectada');

    const COL = 32;
    const LINHA = '='.repeat(COL);
    const TRACO = '-'.repeat(COL);
    const ESPACO = ' '.repeat(COL);
    const now = new Date();
    const dataStr = now.toLocaleDateString('pt-BR');
    const horaStr = now.toLocaleTimeString('pt-BR');
    const numCupom = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const pdvNum = '001';

    let p = new Uint8Array(0);

    // === CABECALHO ===
    p = this.concat(p, ESCPOS.initialize);
    p = this.concat(p, ESCPOS.center);
    p = this.concat(p, ESCPOS.boldOn);
    p = this.concat(p, this.textToBytes('BARIZE\n'));
    p = this.concat(p, ESCPOS.boldOff);
    p = this.concat(p, this.textToBytes('CNPJ: XX.XXX.XXX/XXXX-XX\n'));
    p = this.concat(p, this.textToBytes('EnderecoRua, 123 - Centro\n'));
    p = this.concat(p, this.textToBytes('Tel: (XX) XXXX-XXXX\n'));
    p = this.concat(p, this.textToBytes(ESPACO + '\n'));
    p = this.concat(p, ESCPOS.boldOn);
    p = this.concat(p, this.textToBytes('*** CUPOM NAO FISCAL ***\n'));
    p = this.concat(p, ESCPOS.boldOff);
    p = this.concat(p, this.textToBytes(ESPACO + '\n'));

    // === DADOS DO CUPOM ===
    p = this.concat(p, ESCPOS.left);
    p = this.concat(p, this.textToBytes(`Cupom: ${numCupom}  PDV: ${pdvNum}\n`));
    p = this.concat(p, this.textToBytes(`Data: ${dataStr}  Hora: ${horaStr}\n`));
    p = this.concat(p, this.textToBytes(LINHA + '\n'));

    // === DADOS DO CLIENTE / MESA ===
    p = this.concat(p, ESCPOS.boldOn);
    p = this.concat(p, this.textToBytes(`Mesa: ${data.mesa}\n`));
    p = this.concat(p, ESCPOS.boldOff);
    if (data.cliente) {
      p = this.concat(p, this.textToBytes(`Cliente: ${data.cliente}\n`));
    }
    if (data.atendente) {
      p = this.concat(p, this.textToBytes(`Atendente: ${data.atendente}\n`));
    }
    p = this.concat(p, this.textToBytes(LINHA + '\n'));

    // === ITENS ===
    p = this.concat(p, ESCPOS.center);
    p = this.concat(p, ESCPOS.boldOn);
    p = this.concat(p, this.textToBytes('ITEM  PRODUTO  VALOR\n'));
    p = this.concat(p, ESCPOS.boldOff);
    p = this.concat(p, this.textToBytes(TRACO + '\n'));
    p = this.concat(p, ESCPOS.left);

    for (const item of data.itens) {
      const subtotal = item.preco ? item.quantidade * item.preco : 0;
      const qtdNome = `${item.quantidade}x ${item.nome}`.trim();
      const valor = item.preco ? `R$${subtotal.toFixed(2)}` : '';
      const espacos = Math.max(1, COL - qtdNome.length - valor.length);
      const linha = qtdNome + ' '.repeat(espacos) + valor;
      p = this.concat(p, this.textToBytes(linha + '\n'));
    }

    // === TOTALIZADORES ===
    p = this.concat(p, this.textToBytes(TRACO + '\n'));

    const linhaSubtotal = 'SUBTOTAL';
    const valSubtotal = `R$ ${data.valor_bruto.toFixed(2)}`;
    const espSubtotal = Math.max(1, COL - linhaSubtotal.length - valSubtotal.length);
    p = this.concat(p, this.textToBytes(linhaSubtotal + ' '.repeat(espSubtotal) + valSubtotal + '\n'));

    if (data.desconto > 0) {
      const desc = 'DESCONTO';
      const valDesc = `-R$ ${data.desconto.toFixed(2)}`;
      const espDesc = Math.max(1, COL - desc.length - valDesc.length);
      p = this.concat(p, this.textToBytes(desc + ' '.repeat(espDesc) + valDesc + '\n'));
    }
    if (data.taxa > 0) {
      const taxa = 'TAXA SERVICO';
      const valTaxa = `+R$ ${data.taxa.toFixed(2)}`;
      const espTaxa = Math.max(1, COL - taxa.length - valTaxa.length);
      p = this.concat(p, this.textToBytes(taxa + ' '.repeat(espTaxa) + valTaxa + '\n'));
    }

    // === TOTAL ===
    p = this.concat(p, this.textToBytes(LINHA + '\n'));
    p = this.concat(p, ESCPOS.center);
    p = this.concat(p, ESCPOS.boldOn);
    p = this.concat(p, ESCPOS.doubleHeight);
    const totalStr = `TOTAL: R$ ${data.valor_final.toFixed(2)}`;
    const espTotal = Math.max(0, Math.floor((COL - totalStr.length) / 2));
    p = this.concat(p, this.textToBytes(' '.repeat(espTotal) + totalStr + '\n'));
    p = this.concat(p, ESCPOS.normal);
    p = this.concat(p, ESCPOS.boldOff);

    // === PAGAMENTO ===
    p = this.concat(p, ESCPOS.left);
    p = this.concat(p, this.textToBytes(LINHA + '\n'));
    p = this.concat(p, this.textToBytes(`Forma pgto: ${data.forma_pagamento}\n`));
    if (data.forma_pagamento.toLowerCase().includes('dinheiro') && data.troco !== undefined && data.troco > 0) {
      p = this.concat(p, this.textToBytes(`Valor pago:  R$ ${(data.valor_final + data.troco).toFixed(2)}\n`));
      p = this.concat(p, this.textToBytes(`Troco:       R$ ${data.troco.toFixed(2)}\n`));
    }

    // === RODAPE ===
    p = this.concat(p, this.textToBytes(LINHA + '\n'));
    p = this.concat(p, ESCPOS.center);
    p = this.concat(p, this.textToBytes('Obrigado pela preferencia!\n'));
    p = this.concat(p, this.textToBytes('Volte sempre!\n'));
    p = this.concat(p, this.textToBytes(ESPACO + '\n'));
    p = this.concat(p, this.textToBytes(`${dataStr} ${horaStr}\n`));
    p = this.concat(p, this.textToBytes(ESPACO + '\n'));
    p = this.concat(p, this.textToBytes(ESPACO + '\n'));
    p = this.concat(p, this.textToBytes(ESPACO + '\n'));
    p = this.concat(p, ESCPOS.lineFeed);
    p = this.concat(p, ESCPOS.cut);

    await this.send(p);
  }

  private concat(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
  }
}

export const bluetoothPrinter = new PrinterService();
export const printerService = bluetoothPrinter;
export type { PrintComandaData, PrintFechamentoData, ConnectionType };
