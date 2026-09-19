"use client";

import * as React from "react";
import { Wallet, AlertCircle, CheckCircle2, Edit3, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import type { BudgetSummary } from "@/types/shopping";

interface CartBudgetProps {
  summary: BudgetSummary;
  onUpdateBudget: (newBudget: number | null) => void;
}

export function CartBudget({ summary, onUpdateBudget }: CartBudgetProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputVal, setInputVal] = React.useState(
    summary.budget !== null ? summary.budget.toString() : ""
  );

  const handleSave = () => {
    const clean = inputVal.trim();
    if (!clean) {
      onUpdateBudget(null);
    } else {
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && parsed >= 0) {
        onUpdateBudget(parsed);
      }
    }
    setIsEditing(false);
  };

  const percentSpent = summary.budget
    ? Math.min(100, Math.round((summary.cartTotal / summary.budget) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Session Budget</h3>
            <p className="text-[11px] text-muted-foreground">
              Book fair & bookstore spending tracker
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="0"
              step="500"
              placeholder="Budget in Rs."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="h-8 w-28 text-xs px-2"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSave}
              className="h-8 w-8 text-emerald-600"
              aria-label="Save budget"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setInputVal(summary.budget !== null ? summary.budget.toString() : "");
                setIsEditing(false);
              }}
              className="h-8 w-8 text-muted-foreground"
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="h-8 text-xs gap-1 rounded-xl"
          >
            <Edit3 className="h-3 w-3" />
            <span>{summary.budget !== null ? "Edit Limit" : "Set Budget"}</span>
          </Button>
        )}
      </div>

      {summary.budget !== null ? (
        <div className="space-y-2 pt-1">
          {/* Progress Indicator */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                summary.isOverBudget
                  ? "bg-rose-500"
                  : percentSpent > 85
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${percentSpent}%` }}
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="rounded-xl bg-muted/40 p-2">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Budget
              </span>
              <span className="font-bold text-xs sm:text-sm text-foreground">
                {formatCurrency(summary.budget, { decimals: 0 })}
              </span>
            </div>

            <div className="rounded-xl bg-muted/40 p-2">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Planned
              </span>
              <span className="font-bold text-xs sm:text-sm text-foreground">
                {formatCurrency(summary.cartTotal, { decimals: 0 })}
              </span>
            </div>

            <div
              className={`rounded-xl p-2 ${
                summary.isOverBudget
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <span className="text-[10px] uppercase font-semibold block opacity-80">
                {summary.isOverBudget ? "Over Budget" : "Remaining"}
              </span>
              <span className="font-bold text-xs sm:text-sm">
                {summary.remaining !== null
                  ? formatCurrency(Math.abs(summary.remaining), { decimals: 0 })
                  : "—"}
              </span>
            </div>
          </div>

          {summary.isOverBudget && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Planned spend exceeds your budget by{" "}
                <strong>
                  {formatCurrency(Math.abs(summary.remaining || 0), { decimals: 0 })}
                </strong>
                .
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl">
          Set a spending limit for your book fair trip to keep track of remaining funds as you add books.
        </p>
      )}
    </div>
  );
}
