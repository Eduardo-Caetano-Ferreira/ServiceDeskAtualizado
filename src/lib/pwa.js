import { useEffect, useState } from 'react';

// PWA: registro do service worker, aviso de nova versão e botão "Instalar".

let waitingWorker = null;
let updating = false; // só recarrega quando o operador aceitou atualizar
const listeners = new Set();
let installEvent = null;

const emit = () => listeners.forEach((fn) => fn());

/** Registra o service worker (somente em produção, onde o sw.js existe de fato). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      const watch = (worker) => {
        worker.addEventListener('statechange', () => {
          // nova versão instalada enquanto já existe uma ativa = atualização disponível
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = worker;
            emit();
          }
        });
      };

      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorker = reg.waiting;
        emit();
      }
      reg.addEventListener('updatefound', () => reg.installing && watch(reg.installing));

      // verifica atualização a cada 30 min enquanto o app fica aberto
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    } catch (err) {
      console.warn('Service worker não registrado:', err);
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // na 1ª instalação o SW assume a página sem precisar recarregar
    if (updating) window.location.reload();
  });
}

// Chrome/Edge avisam quando o app pode ser instalado
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    emit();
  });
}

/** Retorna se há nova versão pronta e a função que aplica a atualização. */
export function usePwaUpdate() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return {
    updateReady: !!waitingWorker,
    applyUpdate: () => {
      updating = true;
      waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    },
  };
}

/** Retorna se o botão "Instalar aplicativo" deve aparecer e a função que abre o instalador. */
export function usePwaInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  return {
    canInstall: !!installEvent && !standalone,
    install: async () => {
      if (!installEvent) return;
      installEvent.prompt();
      await installEvent.userChoice.catch(() => {});
      installEvent = null;
      emit();
    },
  };
}
