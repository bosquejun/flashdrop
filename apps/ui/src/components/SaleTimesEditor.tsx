import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUpdateSaleTimes } from "../hooks/useUpdateSaleTimes";
import { Settings, CircleCheck, CircleX } from "lucide-react";

function toLocalDatetime(date: Date): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

interface SaleTimesEditorProps {
  saleId: string;
  currentStart: Date;
  currentEnd: Date;
  onUpdated: () => void;
}

export function SaleTimesEditor({
  saleId,
  currentStart,
  currentEnd,
  onUpdated,
}: SaleTimesEditorProps) {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState(toLocalDatetime(currentStart));
  const [endTime, setEndTime] = useState(toLocalDatetime(currentEnd));
  const { loading, result, updateTimes, reset } = useUpdateSaleTimes();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTimes(saleId, {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    });
    onUpdated();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <Settings className="h-3 w-3" />
        Configure Sale Times
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Configure Sale Times</h3>
        <button
          onClick={() => { setOpen(false); reset(); }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="startTime" className="text-xs font-medium">
            Start Time
          </label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={loading}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="endTime" className="text-xs font-medium">
            End Time
          </label>
          <Input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={loading}
            className="h-9 text-sm"
          />
        </div>

        <Button
          type="submit"
          size="sm"
          variant="secondary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Times"}
        </Button>
      </form>

      {result?.success && (
        <Alert className="border-green-500/50 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
          <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {result && !result.success && (
        <Alert variant="destructive">
          <CircleX className="h-4 w-4" />
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
