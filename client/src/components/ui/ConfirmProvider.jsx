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
        <div className="px-5 pt-5 pb-5">
          <h2 id="confirm-title" className="t-heading text-ink">
            {request?.title}
          </h2>
          {request?.description && (
            <p id="confirm-description" className="t-sm text-muted mt-2">
              {request.description}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-sunken border-t border-line rounded-b-md">
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
