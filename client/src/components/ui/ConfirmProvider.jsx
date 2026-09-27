import React, { useCallback, useRef, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { ConfirmContext } from "./confirm-context";

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    setRequest({
      title: "Are you sure?",
      description: "",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      destructive: false,
      ...options,
    });
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((result) => {
    setRequest(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(request)}
        onClose={() => settle(false)}
        labelledBy="confirm-title"
        describedBy={request?.description ? "confirm-description" : undefined}
      >
        <div className="px-6 pt-6 pb-2">
          <h2 id="confirm-title" className="text-[17px] font-semibold text-ink">
            {request?.title}
          </h2>
          {request?.description && (
            <p id="confirm-description" className="t-sm text-muted mt-2">
              {request.description}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 pt-4 pb-6">
          <Button variant="secondary" onClick={() => settle(false)}>
            {request?.cancelLabel}
          </Button>
          <Button
            data-autofocus
            variant={request?.destructive ? "solidDanger" : "primary"}
            onClick={() => settle(true)}
          >
            {request?.confirmLabel}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
