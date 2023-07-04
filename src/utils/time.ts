export function automaticRelativeDifference(d: Date): {
  duration: number;
  unit: Intl.RelativeTimeFormatUnit;
} {
  const diff = -((new Date().getTime() - d.getTime()) / 1000) | 0;
  const absDiff = Math.abs(diff);

  if (absDiff > 86400 * 30 * 10)
    return { duration: Math.round(diff / (86400 * 365)), unit: "years" };
  if (absDiff > 86400 * 25)
    return { duration: Math.round(diff / (86400 * 30)), unit: "months" };
  if (absDiff > 3600 * 21)
    return { duration: Math.round(diff / 86400), unit: "days" };
  if (absDiff > 60 * 44)
    return { duration: Math.round(diff / 3600), unit: "hours" };
  if (absDiff > 30) return { duration: Math.round(diff / 60), unit: "minutes" };
  return { duration: diff, unit: "seconds" };
}

export function formatRelativeTime(fromDate: Date, toDate?: Date): string {
  if (!toDate) toDate = new Date();
  const timeDifference = toDate.getTime() - fromDate.getTime();
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""}`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
}
