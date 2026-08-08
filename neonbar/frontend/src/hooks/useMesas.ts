import { useEffect, useState } from 'react';
import { mesasService } from '../services/api';
import type { Mesa } from '../types';

export function useMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await mesasService.listar({ ativo: 1 });
      setMesas(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { mesas, loading, error, reload: load };
}
