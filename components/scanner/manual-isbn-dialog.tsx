"use client";

import * as React from "react";
import { inspectISBN } from "@/lib/isbn/validate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Barcode, CheckCircle2, AlertCircle, ArrowRight, X } from "lucide-react";

interface ManualIsbnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitIsbn: (isbn: string) => void;
}

export function ManualIsbnDialog({
  open,
  onOpenChange,
  onSubmitIsbn,
}: ManualIsbnDialogProps) {
  const [inputVal, setInputVal] = React.useState("");
  const [hasInteracted, setHasInteracted] = React.useState(false);

  const inspection = React.useMemo(() => {
    if (!inputVal.trim()) return null;
    return inspectISBN(inputVal);
  }, [inputVal]);

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);

    if (inspection?.isValid && inspection.normalized) {
      onSubmitIsbn(inspection.normalized);
      onOpenChange(false);
      setInputVal("");
      setHasInteracted(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-scale-in text-card-foreground relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
          <Barcode className="h-5 w-5" />
        </div>

        <h3 className="text-lg font-bold text-foreground">Enter ISBN Manually</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Type the 10 or 13-digit ISBN printed on the book barcode or copyright page.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="manualIsbn">ISBN-13 or ISBN-10</Label>
            <div className="relative">
              <Input
                id="manualIsbn"
                type="text"
                placeholder="e.g. 978-0-14-032872-1"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  if (!hasInteracted) setHasInteracted(true);
                }}
                className="font-mono text-base pr-10 tracking-wide"
                autoFocus
              />
              {inspection && hasInteracted && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {inspection.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              )}
            </div>

            {/* Live Feedback / Validation message */}
            {hasInteracted && inspection && (
              <div className="text-xs space-y-1">
                {inspection.isValid ? (
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    Valid {inspection.type}
                    {inspection.formatted && (
                      <span className="text-muted-foreground font-mono text-[11px]">
                        ({inspection.formatted})
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-destructive font-medium flex items-center gap-1.5">
                    {inspection.error || "Please enter a valid 10 or 13 digit ISBN."}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brandGradient"
              disabled={!inspection?.isValid}
              className="gap-2"
            >
              <span>Check Shelf</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
