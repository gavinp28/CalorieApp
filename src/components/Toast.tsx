import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const ToastContext = createContext<(message: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((m: string) => {
    clearTimeout(timer.current);
    setMessage(m);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), 2400);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 transition-all duration-300 md:bottom-10 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        {message && <p className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-bg shadow-xl">{message}</p>}
      </div>
    </ToastContext.Provider>
  );
}
