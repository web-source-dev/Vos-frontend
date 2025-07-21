// hooks/useStageTimer.ts
import { useEffect, useState } from 'react';

export function useStageTimer() {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<number>(0); // ms

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (startTime) {
      interval = setInterval(() => {
        setElapsed(Date.now() - startTime.getTime());
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [startTime]);

  const start = () => {
    const now = new Date();
    setStartTime(now);
    setElapsed(0);
    return now;
  };

  const stop = () => {
    const end = new Date();
    const total = end.getTime() - (startTime?.getTime() || end.getTime());
    return { startTime, endTime: end, totalTime: total };
  };

  const reset = () => {
    setStartTime(null);
    setElapsed(0);
  };

  return {
    startTime,
    elapsed,
    start,
    stop,
    reset,
    elapsedSeconds: Math.floor(elapsed / 1000),
    elapsedFormatted: formatDuration(elapsed),
  };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
