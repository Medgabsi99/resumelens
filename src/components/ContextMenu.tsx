"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ContextMenuItem {
  /** Unique key */
  key: string;
  /** Label shown in menu */
  label: string;
  /** Optional icon (emoji or SVG element) */
  icon?: ReactNode;
  /** Optional keyboard shortcut hint */
  shortcut?: string;
  /** Destructive items render in red */
  danger?: boolean;
  /** Disabled items are greyed out */
  disabled?: boolean;
  /** Renders a separator line BEFORE this item */
  separator?: boolean;
  /** Click handler */
  onClick: () => void;
}

interface ContextMenuState {
  items: ContextMenuItem[];
  x: number;
  y: number;
  visible: boolean;
}

interface ContextMenuContextType {
  show: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
  hide: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ContextMenuContext = createContext<ContextMenuContextType>({
  show: () => {},
  hide: () => {},
});

export function useContextMenu() {
  return useContext(ContextMenuContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextMenuState>({
    items: [],
    x: 0,
    y: 0,
    visible: false,
  });

  const menuRef = useRef<HTMLDivElement>(null);

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const show = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = 220;
    const menuH = Math.min(items.length * 44 + 16, 400);

    // Clamp to viewport
    const x = e.clientX + menuW > vw ? e.clientX - menuW : e.clientX;
    const y = e.clientY + menuH > vh ? e.clientY - menuH : e.clientY;

    setState({ items, x, y, visible: true });
  }, []);

  // Close on outside click, scroll, or Escape
  useEffect(() => {
    if (!state.visible) return;

    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    const onScroll = () => hide();

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [state.visible, hide]);

  return (
    <ContextMenuContext.Provider value={{ show, hide }}>
      {children}
      {state.visible && (
        <ContextMenuPopup
          ref={menuRef}
          items={state.items}
          x={state.x}
          y={state.y}
          onClose={hide}
        />
      )}
    </ContextMenuContext.Provider>
  );
}

// ─── Popup ───────────────────────────────────────────────────────────────────
import { forwardRef } from "react";

interface ContextMenuPopupProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

const ContextMenuPopup = forwardRef<HTMLDivElement, ContextMenuPopupProps>(
  function ContextMenuPopup({ items, x, y, onClose }, ref) {
    const [focusedIdx, setFocusedIdx] = useState(-1);
    const enabledItems = items.filter((i) => !i.disabled);

    // Keyboard nav within the menu
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIdx((i) => Math.min(i + 1, enabledItems.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && focusedIdx >= 0) {
          e.preventDefault();
          enabledItems[focusedIdx]?.onClick();
          onClose();
        }
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [focusedIdx, enabledItems, onClose]);

    return (
      <>
        <style>{`
          @keyframes ctx-appear {
            from { opacity: 0; transform: scale(0.94) translateY(-4px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          .ctx-menu {
            animation: ctx-appear 0.14s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .ctx-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.1s ease, color 0.1s ease;
            color: var(--ink);
            user-select: none;
            white-space: nowrap;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
          }
          .ctx-item:hover,
          .ctx-item.focused {
            background: var(--accent-bg);
            color: var(--accent);
          }
          .ctx-item.danger {
            color: #ef4444;
          }
          .ctx-item.danger:hover,
          .ctx-item.danger.focused {
            background: rgba(239, 68, 68, 0.08);
            color: #ef4444;
          }
          .ctx-item.disabled {
            opacity: 0.4;
            cursor: not-allowed;
            pointer-events: none;
          }
          .ctx-separator {
            height: 1px;
            margin: 4px 8px;
            background: var(--border);
            opacity: 0.5;
          }
          .ctx-shortcut {
            margin-left: auto;
            font-size: 10px;
            font-family: monospace;
            color: var(--ink-faint);
            opacity: 0.7;
            flex-shrink: 0;
          }
        `}</style>

        <div
          ref={ref}
          className="ctx-menu"
          role="menu"
          aria-label="Context menu"
          style={{
            position: "fixed",
            top: y,
            left: x,
            zIndex: 999999,
            minWidth: 200,
            maxWidth: 260,
            padding: "6px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--paper-card)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.25), 0 16px 40px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {items.map((item, globalIdx) => {
            const enabledIdx = enabledItems.indexOf(item);
            const isFocused = enabledIdx !== -1 && enabledIdx === focusedIdx;

            return (
              <div key={item.key}>
                {item.separator && <div className="ctx-separator" />}
                <button
                  role="menuitem"
                  className={[
                    "ctx-item",
                    item.danger ? "danger" : "",
                    item.disabled ? "disabled" : "",
                    isFocused ? "focused" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onClick();
                    onClose();
                  }}
                  onMouseEnter={() => setFocusedIdx(enabledIdx)}
                  tabIndex={-1}
                  disabled={item.disabled}
                >
                  {item.icon && (
                    <span
                      style={{
                        flexShrink: 0,
                        width: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        opacity: item.danger ? 1 : 0.7,
                      }}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.shortcut && (
                    <span className="ctx-shortcut">{item.shortcut}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </>
    );
  }
);
