/**
 * Sidebar State Management Hook
 * 
 * Custom hook for managing sidebar state with open/close controls.
 * Extracted from Sidebar component to prevent circular dependencies.
 */

import { useState } from 'react';

/**
 * Custom hook for managing sidebar state
 * 
 * @param initialOpen - Initial sidebar open state
 * @returns Sidebar state and controls
 */
export function useSidebar(initialOpen: boolean = true) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}

export type SidebarState = ReturnType<typeof useSidebar>;