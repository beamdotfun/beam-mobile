import React, {useEffect, useState} from 'react';
import {Text} from '../ui';
import {differenceInSeconds} from 'date-fns';

interface AuctionCountdownProps {
  endTime: string;
  onEnd?: () => void;
  className?: string;
}

export function AuctionCountdown({
  endTime,
  onEnd,
  className,
}: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const seconds = differenceInSeconds(new Date(endTime), new Date());

      if (seconds <= 0) {
        setTimeLeft(0);
        onEnd?.();
        return;
      }

      setTimeLeft(seconds);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0) {
    return (
      <Text
        className={`text-lg font-medium text-destructive ${className || ''}`}>
        Ended
      </Text>
    );
  }

  if (days > 0) {
    return (
      <Text className={`text-lg font-medium ${className || ''}`}>
        {days}d {hours}h {minutes}m
      </Text>
    );
  }

  if (hours > 0) {
    return (
      <Text className={`text-lg font-medium ${className || ''}`}>
        {hours}h {minutes}m {seconds}s
      </Text>
    );
  }

  // Last hour - show in red to indicate urgency
  return (
    <Text className={`text-lg font-medium text-destructive ${className || ''}`}>
      {minutes}m {seconds}s
    </Text>
  );
}
