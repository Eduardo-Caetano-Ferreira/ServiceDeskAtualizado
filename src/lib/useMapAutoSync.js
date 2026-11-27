import { useEffect } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

const POLL_MS = 60 * 1000;

// Aplica no Firestore a escala vinda do mapa, mas só quando o conteúdo mudou.
// A transação evita que duas abas/operadores gravem em duplicidade e guarda o backup anterior.
export async function applyMapScale(map, source = 'mapa') {
  const currentRef = doc(db, 'techniciansList', 'current');
  const previousRef = doc(db, 'techniciansList', 'previous');
  const nowIso = new Date().toISOString();

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(currentRef);
    const cur = snap.exists() ? snap.data() : null;

    if (cur?.mapFingerprint === map.fingerprint) return 'unchanged';

    // Envio manual por imagem mais novo que a última alteração no mapa não é sobrescrito
    if (source === 'mapa-auto' && cur && cur.source === 'imagem' && cur.updatedAt && (!map.change?.at || new Date(cur.updatedAt) > new Date(map.change.at))) {
      return 'manual-newer';
    }

    const hadData = cur && ((cur.moto?.length || 0) + (cur.car?.length || 0)) > 0;
    if (hadData) {
      tx.set(previousRef, {
        moto: cur.moto || [],
        car: cur.car || [],
        updatedAt: cur.updatedAt || null,
        backedUpAt: nowIso,
      });
    }

    tx.set(
      currentRef,
      {
        moto: map.moto,
        car: map.car,
        updatedAt: nowIso,
        source: 'mapa',
        syncMode: source === 'mapa-auto' ? 'automatica' : 'manual',
        mapFingerprint: map.fingerprint,
        mapWorkDate: map.workDate,
        mapChangedAt: map.change?.at || null,
        mapChangedBy: map.change?.by || null,
        mapChangeAction: map.change?.action || null,
        geminiLastSync: nowIso,
        geminiStatus: 'online',
        geminiModel: 'mapa-etecc',
        geminiLatencyMs: null,
      },
      { merge: true }
    );
    return 'updated';
  });
}

// Consulta o mapa de tempos em tempos e sincroniza sozinho quando alguém altera lá.
export function useMapAutoSync() {
  useEffect(() => {
    let stopped = false;
    let running = false;

    const check = async () => {
      if (running || stopped || document.hidden) return;
      running = true;
      try {
        const res = await fetch('/api/sync-map');
        if (!res.ok) return; // sem escala hoje / mapa fora do ar: mantém a atual
        const map = await res.json();
        if (!Array.isArray(map.moto) || !map.fingerprint) return;
        await applyMapScale(map, 'mapa-auto');
      } catch (err) {
        console.warn('Sincronização automática com o mapa falhou:', err?.message || err);
      } finally {
        running = false;
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}

export function formatMapChange(iso, by) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const when = `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  return by ? `${when} por ${by}` : when;
}
