import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatPercentage(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value)
}

export function getCPAClassName(value: number, tcpa: number) {
  return value <= tcpa ? "text-green-500" : "text-red-500"
}

export function getPacingClassName(value: number) {
  if (value === 0) return "text-gray-400"
  return value < 90 ? "text-yellow-500" : value > 110 ? "text-red-500" : "text-green-500"
}

export function getROASClassName(value: number) {
  return value < 1 ? "text-red-500" : "text-green-500"
}

export function getROASColor(value: number) {
  return value < 1 ? "red" : "green"
}

export function getROASIcon(value: number) {
  return value < 1 ? "minus" : "plus"
}

export function getROASIconColor(value: number) {
  return value < 1 ? "red" : "green"
}

// utils.ts
export const getChartColor = (metric: string): string => {
  switch (metric.toLowerCase()) {
    case 'spend':
      return '#3B82F6';
    case 'revenue':
      return '#10B981';
    case 'cpa':
      return '#8B5CF6';
    case 'roas':
      return '#F59E0B';
    case 'ctr':
      return '#EC4899';
    default:
      return '#6B7280';
  }
};

export const formatChartValue = (value: number, metric: string): string => {
  if (metric.toLowerCase().includes('cpa') ||
      metric.toLowerCase().includes('spend') ||
      metric.toLowerCase().includes('revenue')) {
    return formatCurrency(value);
  }
  if (metric.toLowerCase().includes('rate') ||
      metric.toLowerCase().includes('roas') ||
      metric.toLowerCase().includes('ctr')) {
    return formatPercentage(value / 100);
  }
  return formatNumber(value);
};