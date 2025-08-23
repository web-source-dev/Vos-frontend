// hooks/useStageTimer.ts
import { useEffect, useState, useCallback } from 'react';
import { getTimeTrackingByCaseId, updateStageTime } from '@/lib/api';

interface StageTimeData {
  startTime?: Date;
  endTime?: Date;
  totalTime?: number;
  inspectorId?: string;
  inspectorName?: string;
}

interface TimeTrackingData {
  caseId: string;
  stageTimes: {
    intake?: StageTimeData;
    scheduleInspection?: StageTimeData;
    inspection?: StageTimeData;
    quoteAndDecision?: StageTimeData;
    paperwork?: StageTimeData;
    completion?: StageTimeData;
  };
  totalTime: number;
  lastUpdated: Date;
}

export function useStageTimer(caseId?: string, stageName?: string) {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<number>(0); // ms
  const [savedTime, setSavedTime] = useState<number>(0); // previously saved time
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timeTrackingData, setTimeTrackingData] = useState<TimeTrackingData | null>(null);

  // Debug logging

  // Load existing time data when component mounts
  useEffect(() => {
    if (caseId && stageName) {
      loadExistingTimeData();
    }
  }, [caseId, stageName]);

  const loadExistingTimeData = useCallback(async () => {
    if (!caseId || !stageName) return;

    try {
      setIsLoading(true);
      const response = await getTimeTrackingByCaseId(caseId);
      
      if (response.success && response.data) {
        setTimeTrackingData(response.data);
        
        const stageData = response.data.stageTimes[stageName as keyof typeof response.data.stageTimes];
        
        if (stageData && stageData.totalTime) {
          // If there's saved time, set it as the base elapsed time
          setSavedTime(stageData.totalTime);
          setElapsed(stageData.totalTime);
          
          if (stageData.startTime) {
            const startDate = new Date(stageData.startTime);
            const now = new Date();
            
            if (stageName === 'inspection') {
              // For inspection stage, always continue from the saved total time
              // regardless of whether there's an endTime (save/close vs completion)
              // We don't want to add any gap time between save and reopen
              setElapsed(stageData.totalTime);
              setStartTime(now); // Start fresh timer from now, but keep the saved time
            } else {
              // For other stages, only continue if there's no endTime (stage not completed)
              if (!stageData.endTime) {
                const additionalTime = now.getTime() - startDate.getTime();
                setElapsed(stageData.totalTime + additionalTime);
                setStartTime(startDate);
              } else {
                // Stage is completed, don't continue the timer
              }
            }
          }
        } else {
          console.log(`No existing time data for ${stageName}`);
        }
      } else {
        console.log(`No time tracking data found for caseId: ${caseId}`);
      }
    } catch (error) {
      console.error('Error loading time tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, stageName]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const currentElapsed = now.getTime() - startTime.getTime();
        setElapsed(savedTime + currentElapsed);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [startTime, savedTime]);

  const start = useCallback(() => {
    const now = new Date();
    setStartTime(now);
    // Don't reset elapsed - keep the saved time
    return now;
  }, [elapsed, savedTime]);

  const stop = useCallback(async (isCompletion: boolean = true) => {
    const end = new Date();
    const totalElapsed = elapsed;
    
    // Save the time to database if caseId and stageName are provided
    if (caseId && stageName) {
      try {
        // Get the original start time from saved data or use current start time
        let originalStartTime = startTime || new Date();
        
        if (timeTrackingData && timeTrackingData.stageTimes[stageName as keyof typeof timeTrackingData.stageTimes]) {
          const stageData = timeTrackingData.stageTimes[stageName as keyof typeof timeTrackingData.stageTimes];
          // Use the original start time if it exists, otherwise use current start time
          if (stageData && stageData.startTime) {
            originalStartTime = new Date(stageData.startTime);
          }
        }
        
        // For inspection stage, if this is not a completion (just save/close), don't set endTime
        const shouldSetEndTime = isCompletion || stageName !== 'inspection';
        
        console.log(`Saving time for ${stageName}:`, {
          originalStartTime: originalStartTime.toISOString(),
          endTime: shouldSetEndTime ? end.toISOString() : 'not set (save/close)',
          totalElapsed: totalElapsed,
          savedTime: savedTime,
          newTime: totalElapsed - savedTime,
          isCompletion: isCompletion
        });
        
        // Save with the original start time and current end time (if completion), plus total accumulated time
        await updateStageTime(caseId, stageName, originalStartTime, end, {
          totalTime: totalElapsed,
          savedTime: savedTime,
          newTime: totalElapsed - savedTime,
          isCompletion: isCompletion
        });
      } catch (error) {
        console.error('Error saving stage time:', error);
      }
    }
    
    return { 
      startTime, 
      endTime: isCompletion ? end : null, 
      totalTime: totalElapsed,
      savedTime: savedTime,
      newTime: totalElapsed - savedTime
    };
  }, [caseId, stageName, startTime, elapsed, savedTime, timeTrackingData]);

  const reset = useCallback(() => {
    setStartTime(null);
    setElapsed(savedTime); // Reset to saved time, not 0
  }, [savedTime]);

  const resetAll = useCallback(() => {
    setStartTime(null);
    setElapsed(0);
    setSavedTime(0);
  }, []);

  const getStageTimeData = useCallback(() => {
    if (!timeTrackingData || !stageName) return null;
    return timeTrackingData.stageTimes[stageName as keyof typeof timeTrackingData.stageTimes];
  }, [timeTrackingData, stageName]);

  return {
    startTime,
    elapsed,
    savedTime,
    isLoading,
    timeTrackingData,
    start,
    stop,
    reset,
    resetAll,
    getStageTimeData,
    elapsedSeconds: Math.floor(elapsed / 1000),
    elapsedFormatted: formatDuration(elapsed),
    savedTimeFormatted: formatDuration(savedTime),
    newTimeFormatted: formatDuration(elapsed - savedTime),
    isOverTime: Math.floor(elapsed / 1000) > 1200, // 20 minutes = 1200 seconds
  };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
