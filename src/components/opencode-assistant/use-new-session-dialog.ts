import { useCallback, useState } from "react";
import { NewSessionDialog } from "./new-session-dialog";

export function useNewSessionDialog(
  createSession: (title: string, baseBranch: string) => Promise<any>,
) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  const handleCreate = useCallback(
    async (title: string, baseBranch: string) => {
      return createSession(title, baseBranch);
    },
    [createSession],
  );

  return {
    isOpen,
    openDialog,
    closeDialog,
    handleCreate,
    NewSessionDialogComponent: NewSessionDialog,
  };
}
