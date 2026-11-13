import React, { useEffect } from 'react';

export default function ModalShell({ onClose, maxWidth = 'max-w-[770px]', children }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1220]/60 px-4 py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className={`mx-auto w-full ${maxWidth} rounded-2xl bg-white shadow-2xl`}>
        {children}
      </div>
    </div>
  );
}
