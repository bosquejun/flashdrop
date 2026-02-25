import type React from "react";
import { useEffect, useRef, useState } from "react";
import { formatDuration } from "../utils/format";

interface CountdownTimerProps {
  ms: number | null;
  label?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ ms, label }) => {
  const [remainingMs, setRemainingMs] = useState<number | null>(ms);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update remainingMs when ms prop changes (from polling)
  useEffect(() => {
    if (ms !== null) {
      setRemainingMs(ms);
    } else {
      setRemainingMs(null);
    }
  }, [ms]);

  // Set up interval to count down smoothly every second
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (remainingMs === null || remainingMs <= 0) {
      return;
    }

    // Set up interval to update every second
    intervalRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev === null || prev <= 0) {
          return 0;
        }
        return Math.max(0, prev - 1000);
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [remainingMs]);

  if (remainingMs === null || remainingMs <= 0) return null;

  const timeStr = formatDuration(remainingMs);
  const [h, m, s] = timeStr.split(":");

  const TimeUnit = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white border border-zinc-100 rounded-xl px-4 py-2 min-w-[3.8rem] text-center shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <span className="text-xl font-black font-mono text-zinc-900 tracking-tighter">{value}</span>
      </div>
      <span className="text-[8px] uppercase tracking-widest text-zinc-600 mt-2 font-black italic">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col items-start gap-3">
      {label && (
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <TimeUnit value={h} label="hr" />
        <span className="text-zinc-400 font-black mb-6 text-xl mx-1">:</span>
        <TimeUnit value={m} label="min" />
        <span className="text-zinc-400 font-black mb-6 text-xl mx-1">:</span>
        <TimeUnit value={s} label="sec" />
      </div>
    </div>
  );
};

export default CountdownTimer;
