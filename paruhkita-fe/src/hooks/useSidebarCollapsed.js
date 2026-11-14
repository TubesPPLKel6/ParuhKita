import { useState } from 'react';

export default function useSidebarCollapsed(role) {
  const storageKey = `paruhkita-sidebar-collapsed:${role}`;
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(storageKey) === 'true');

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  return [collapsed, toggle];
}
