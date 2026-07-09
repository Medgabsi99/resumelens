"use client";
import { useRef, useState, useCallback } from "react";
import { JobApplication, ApplicationStatus } from "@/types";

interface DragState {
  draggingId: string | null;
  dragOverColumn: ApplicationStatus | null;
  /** The card id we're hovering *above* for within-column or list reorder */
  insertBeforeId: string | null;
}

const INITIAL: DragState = {
  draggingId: null,
  dragOverColumn: null,
  insertBeforeId: null,
};

export function useDragAndDrop(
  applications: JobApplication[],
  handleStatusChange: (app: JobApplication, newStatus: ApplicationStatus) => Promise<void>,
  onReorder?: (apps: JobApplication[]) => void
) {
  const [drag, setDrag] = useState<DragState>(INITIAL);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  // ── Create a styled ghost element ───────────────────────────
  const createGhost = useCallback((label: string) => {
    const ghost = document.createElement("div");
    ghost.id = "__kanban-ghost__";
    ghost.innerText = label;
    Object.assign(ghost.style, {
      position: "fixed",
      top: "-999px",
      left: "-999px",
      padding: "8px 14px",
      borderRadius: "10px",
      background: "var(--paper-card, #1e1e2e)",
      border: "1px solid var(--accent-border, rgba(99,102,241,0.3))",
      color: "var(--ink, #f8fafc)",
      fontSize: "12px",
      fontWeight: "600",
      fontFamily: "Instrument Sans, system-ui, sans-serif",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      pointerEvents: "none",
      zIndex: "99999",
      maxWidth: "200px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      opacity: "0.95",
    });
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    return ghost;
  }, []);

  const removeGhost = useCallback(() => {
    const existing = document.getElementById("__kanban-ghost__");
    if (existing) existing.remove();
    ghostRef.current = null;
  }, []);

  // ── KANBAN: Drag start ────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      const app = applications.find((a) => a.id === id);
      const label = app ? `${app.job_title} @ ${app.company_name}` : id;
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
      const ghost = createGhost(label);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(removeGhost, 0);
      setDrag((d) => ({ ...d, draggingId: id }));
    },
    [applications, createGhost, removeGhost]
  );

  // ── KANBAN: Drag end ──────────────────────────────────────────
  const handleDragEnd = useCallback(() => {
    removeGhost();
    setDrag(INITIAL);
  }, [removeGhost]);

  // ── Column drag-over (needed to allow drop) ───────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // ── Column drag-enter — highlight target column ───────────────
  const handleDragEnter = useCallback(
    (e: React.DragEvent, status: ApplicationStatus) => {
      e.preventDefault();
      setDrag((d) => ({ ...d, dragOverColumn: status }));
    },
    []
  );

  // ── Column drag-leave ─────────────────────────────────────────
  const handleDragLeave = useCallback((_unused: ApplicationStatus) => {
    // Leave column highlight until drop/end to avoid flicker
  }, []);

  // ── Card drag-enter — track insert-before position ───────────
  const handleCardDragEnter = useCallback(
    (e: React.DragEvent, cardId: string) => {
      e.preventDefault();
      setDrag((d) => ({ ...d, insertBeforeId: cardId }));
    },
    []
  );

  // ── KANBAN: Drop on column ────────────────────────────────────
  const handleDropColumn = useCallback(
    async (e: React.DragEvent, status: ApplicationStatus) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || drag.draggingId;
      if (!id) { setDrag(INITIAL); return; }

      const app = applications.find((a) => a.id === id);
      if (!app) { setDrag(INITIAL); return; }

      const insertBefore = drag.insertBeforeId;
      setDrag(INITIAL);

      // Status change (cross-column)
      if (app.status !== status) {
        await handleStatusChange(app, status);
      }

      // Within-column reorder (optimistic local update)
      if (app.status === status && insertBefore && insertBefore !== id && onReorder) {
        const sameCol = applications.filter((a) => a.status === status);
        const others = sameCol.filter((a) => a.id !== id);
        const insertIdx = others.findIndex((a) => a.id === insertBefore);
        const reordered = [...others];
        reordered.splice(insertIdx >= 0 ? insertIdx : reordered.length, 0, app);
        const updated = applications.map((a) => {
          const found = reordered.find((r) => r.id === a.id);
          return found ?? a;
        });
        onReorder(updated);
      }
    },
    [applications, drag.draggingId, drag.insertBeforeId, handleStatusChange, onReorder]
  );

  // ── LIST VIEW: Drag start ─────────────────────────────────────
  const handleListDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      const app = applications.find((a) => a.id === id);
      const label = app ? `${app.job_title} @ ${app.company_name}` : id;
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
      const ghost = createGhost(label);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(removeGhost, 0);
      setDrag((d) => ({ ...d, draggingId: id }));
    },
    [applications, createGhost, removeGhost]
  );

  // ── LIST VIEW: Card drag-enter ────────────────────────────────
  const handleListCardDragEnter = useCallback(
    (e: React.DragEvent, cardId: string) => {
      e.preventDefault();
      setDrag((d) => ({ ...d, insertBeforeId: cardId }));
    },
    []
  );

  // ── LIST VIEW: Drop (pure reorder, no status change) ─────────
  const handleListDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || drag.draggingId;
      const insertBefore = drag.insertBeforeId;
      setDrag(INITIAL);

      if (!id || !onReorder) return;

      const draggedApp = applications.find((a) => a.id === id);
      if (!draggedApp) return;

      // Remove dragged from list
      const withoutDragged = applications.filter((a) => a.id !== id);

      if (!insertBefore || insertBefore === id) {
        // Drop at end
        onReorder([...withoutDragged, draggedApp]);
        return;
      }

      // Insert before target
      const insertIdx = withoutDragged.findIndex((a) => a.id === insertBefore);
      if (insertIdx === -1) {
        onReorder([...withoutDragged, draggedApp]);
        return;
      }

      const result = [...withoutDragged];
      result.splice(insertIdx, 0, draggedApp);
      onReorder(result);
    },
    [applications, drag.draggingId, drag.insertBeforeId, onReorder]
  );

  return {
    draggingId: drag.draggingId,
    dragOverColumn: drag.dragOverColumn,
    insertBeforeId: drag.insertBeforeId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleCardDragEnter,
    handleDropColumn,
    // List-view reorder
    handleListDragStart,
    handleListCardDragEnter,
    handleListDrop,
  };
}
export default useDragAndDrop;
