import { useEffect, useRef } from 'react';

let openDialogs = 0;

/**
 * Comportamento comum dos diálogos: fecha com Esc, move o foco para dentro
 * ao abrir, devolve o foco ao elemento anterior ao fechar e trava a rolagem
 * da página enquanto houver algum diálogo aberto.
 */
export function useDialog<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();

    openDialogs += 1;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Só o diálogo mais recente (o que contém o foco) responde ao Esc.
      if (ref.current && !ref.current.contains(document.activeElement)) return;
      event.stopPropagation();
      closeRef.current();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      openDialogs -= 1;
      if (openDialogs <= 0) {
        openDialogs = 0;
        document.body.style.overflow = '';
      }
      if (previous && document.contains(previous)) previous.focus();
    };
  }, []);

  return ref;
}
