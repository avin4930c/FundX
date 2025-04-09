import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: number | null): string {
  if (!timestamp) return "Not available";
  
  const date = new Date(timestamp * 1000); // Convert from Unix timestamp (seconds) to JavaScript timestamp (milliseconds)
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function getStatusBadgeColor(status: number): string {
  switch (status) {
    case 0: // Not Started
      return 'gray';
    case 1: // Proof Submitted
      return 'purple';
    case 2: // Approved
      return 'green';
    case 3: // Rejected
      return 'red';
    case 4: // Funds Released
      return 'blue';
    default:
      return 'gray';
  }
}

export function getStatusText(status: number): string {
  switch (status) {
    case 0:
      return 'Not Started';
    case 1:
      return 'Proof Submitted';
    case 2:
      return 'Approved';
    case 3:
      return 'Rejected';
    case 4:
      return 'Funds Released';
    default:
      return 'Unknown';
  }
} 