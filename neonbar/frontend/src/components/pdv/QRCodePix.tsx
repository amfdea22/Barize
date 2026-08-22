import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// ─── Payload PIX (BR Code EMV estático) — espelha o gerador do backend ───

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id: string, valor: string): string {
  const len = valor.length;
  return `${id}${len.toString().padStart(2, '0')}${valor}`;
}

export function gerarPayloadPix(
  chave: string,
  nome = 'BARIZE',
  cidade = 'SAO PAULO',
  valor = 0,
  txid = '***',
): string {
  const key = (chave || '').trim();
  if (!key) return '';
  const merchant = tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', key));
  let payload = tlv('00', '01') + merchant + tlv('52', '0000') + tlv('53', '986');
  if (valor > 0) payload += tlv('54', valor.toFixed(2));
  payload +=
    tlv('58', 'BR') +
    tlv('59', (nome || '').trim().slice(0, 25).toUpperCase()) +
    tlv('60', (cidade || '').trim().slice(0, 15).toUpperCase()) +
    tlv('62', tlv('05', txid || '***'));
  payload += '6304';
  return payload + crc16(payload);
}

// Chave PIX configurável — trocar pela chave real da empresa (padrão de exemplo)
export const PIX_CHAVE = '12345678000199';

// ─── Componente QRCodePix ───

interface QRCodePixProps {
  payload?: string;
  chave?: string;
  valor?: number;
  nome?: string;
  cidade?: string;
  size?: number;
  title?: string;
}

export default function QRCodePix({
  payload: payloadProp,
  chave,
  valor,
  nome,
  cidade,
  size = 96,
  title = 'Pague com PIX',
}: QRCodePixProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const payload = payloadProp || gerarPayloadPix(chave || PIX_CHAVE, nome, cidade, valor);
    if (!payload) return;
    QRCode.toDataURL(payload, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).then(setDataUrl).catch(() => setDataUrl(null));
  }, [payloadProp, chave, valor, nome, cidade, size]);

  if (!dataUrl) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <div className="grid grid-cols-[repeat(8,4px)] gap-[1px] p-1 border border-black/20 bg-white">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className="w-[4px] h-[4px] bg-black"
              style={{
                opacity: ((i * 7) % 3 === 0 || (i * 13) % 5 === 0) ? 1 : 0.12,
              }}
            />
          ))}
        </div>
        <span className="text-[8px] uppercase tracking-wide text-black/50">{title}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <img src={dataUrl} alt="QR Code PIX" style={{ width: size, height: size }} className="bg-white p-0.5" />
      <span className="text-[8px] uppercase tracking-wide text-black/50">{title}</span>
    </div>
  );
}
