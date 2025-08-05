export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatSOL(amount: number): string {
  return `${amount.toFixed(4)} SOL`;
}

export function formatCurrency(amount: number): string {
  return formatSOL(amount);
}

export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return `${Math.abs(diffInDays)} days ago`;
  } else if (diffInDays === 0) {
    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
    if (diffInHours <= 0) {
      return 'now';
    }
    return `in ${diffInHours} hours`;
  } else if (diffInDays === 1) {
    return 'tomorrow';
  } else {
    return `in ${diffInDays} days`;
  }
}

export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = (now.getTime() - then.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return 'just now';
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  }
  if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  return then.toLocaleDateString();
}
