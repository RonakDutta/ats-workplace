import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
        <div className="p-6">
          <div className="flex gap-4">
            {request?.destructive && (
              <div className="size-9 shrink-0 rounded-sm bg-bad-soft border border-bad-line flex items-center justify-center">
                <AlertTriangle className="size-4.5 text-bad" />
              </div>
            )}
            <div className="min-w-0 pt-0.5">
              <h2
                id="confirm-title"
                className="text-[15px] font-semibold text-ink"
              >
                {request?.title}
              </h2>
              {request?.description && (
                <p
                  id="confirm-description"
                  className="text-[13px] text-muted mt-1.5 leading-relaxed"
                >
                  {request.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
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
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
