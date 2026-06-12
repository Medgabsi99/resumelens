import { useState } from "react";
import { JobApplication, ApplicationStatus } from "@/types";

export function useDragAndDrop(
  applications: JobApplication[],
  handleStatusChange: (app: JobApplication, newStatus: ApplicationStatus) => Promise<void>
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = (status: ApplicationStatus) => {
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDropColumn = async (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    if (!id) return;
    const app = applications.find((a) => a.id === id);
    if (app && app.status !== status) {
      await handleStatusChange(app, status);
    }
    setDraggingId(null);
  };

  return {
    draggingId,
    dragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDropColumn,
  };
}
export default useDragAndDrop;
