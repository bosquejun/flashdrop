import { useState, useEffect } from "react";

interface SaleCountdownProps {
  targetDate: Date;
  label: string;
}

function formatTimeUnit(value: number): string {
  return String(value).padStart(2, "0");
}

export function SaleCountdown({ targetDate, label }: SaleCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <div className="text-center space-y-3">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="flex justify-center gap-3">
        <TimeBlock value={timeLeft.hours} unit="HRS" />
        <span className="text-3xl font-bold text-foreground/40 self-start mt-1">:</span>
        <TimeBlock value={timeLeft.minutes} unit="MIN" />
        <span className="text-3xl font-bold text-foreground/40 self-start mt-1">:</span>
        <TimeBlock value={timeLeft.seconds} unit="SEC" />
      </div>
    </div>
  );
}

function TimeBlock({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-mono font-bold tabular-nums bg-secondary rounded-lg px-4 py-2">
        {formatTimeUnit(value)}
      </span>
      <span className="text-xs font-medium text-muted-foreground mt-1">
        {unit}
      </span>
    </div>
  );
}

function getTimeLeft(target: Date) {
  const total = new Date(target).getTime() - Date.now();
  if (total <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    hours: Math.floor(total / (1000 * 60 * 60)),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}
