import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleCheck, CircleX, AlertTriangle } from "lucide-react";
import type { PurchaseResponse } from "../types/legacySchemas";

interface PurchaseResultProps {
  result: PurchaseResponse | null;
  error: string | null;
}

export function PurchaseResult({ result, error }: PurchaseResultProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!result) return null;

  if (result.success) {
    return (
      <Alert className="border-green-500/50 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
        <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle>Purchase Successful!</AlertTitle>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <CircleX className="h-4 w-4" />
      <AlertTitle>Purchase Failed</AlertTitle>
      <AlertDescription>{result.message}</AlertDescription>
    </Alert>
  );
}
