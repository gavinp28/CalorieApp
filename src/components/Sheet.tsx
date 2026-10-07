import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Bottom sheet on phones, centered dialog on desktop. Built on <dialog>, so focus
 * is trapped, Escape closes it and the page behind is inert.
 */
export function Sheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="sheet m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm md:m-auto md:max-w-md"
    >
      <div className="card rounded-b-none px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 md:rounded-b-[var(--card-radius)] md:pt-6">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-surface-2 md:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  );
}
