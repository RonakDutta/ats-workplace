import { createContext, useContext } from "react";

export const ConfirmContext = createContext(null);

/**
 * Replaces window.confirm. Returns a promise that settles when the user picks.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete role" })) { ... }
 */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside ConfirmProvider");
  return confirm;
}
