import { useState, useEffect } from 'react';

export const useClock = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  return time;
};
