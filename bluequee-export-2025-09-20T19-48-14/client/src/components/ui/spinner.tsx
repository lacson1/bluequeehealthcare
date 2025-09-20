import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size]
      )}></div>
    </div>
  );
};

export const LoadingCard = ({ title = "Loading...", className }: { title?: string; className?: string }) => (
  <div className={cn("bg-white rounded-lg shadow-sm border p-6", className)}>
    <div className="flex items-center justify-center space-x-3">
      <Spinner />
      <span className="text-gray-600">{title}</span>
    </div>
  </div>
);

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-white rounded-lg shadow-sm border p-6", className)}>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);