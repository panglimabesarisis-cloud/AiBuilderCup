import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';

interface RowActionMenuProps {
  /** Bundle name, used for accessible labels. */
  label: string;
  isActive: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

const MENU_WIDTH = 176;
const MENU_HEIGHT = 132;

/**
 * "..." action menu (Edit / Deactivate / Delete). Rendered in a portal with fixed positioning so it is
 * never clipped by the table's horizontal scroll container.
 */
export const RowActionMenu: React.FC<RowActionMenuProps> = ({
  label,
  isActive,
  onEdit,
  onToggleActive,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    const fitsBelow = rect.bottom + 6 + MENU_HEIGHT <= window.innerHeight;
    const top = fitsBelow ? rect.bottom + 6 : Math.max(8, rect.top - 6 - MENU_HEIGHT);
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open, close]);

  const run = (fn: () => void) => () => {
    close();
    fn();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${label}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${label}`}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="z-[70] rounded-xl border border-zinc-700 bg-zinc-900 p-1 text-xs shadow-2xl shadow-black/50"
          >
            <button
              type="button"
              role="menuitem"
              onClick={run(onEdit)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-blue-400" />
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={run(onToggleActive)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none cursor-pointer"
            >
              <Power className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-emerald-400'}`} />
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={run(onDelete)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-rose-300 hover:bg-rose-950/60 focus:bg-rose-950/60 focus:outline-none cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>,
          document.body
        )}
    </>
  );
};
