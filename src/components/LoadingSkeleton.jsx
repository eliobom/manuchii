import React from 'react';

const LoadingSkeleton = ({ className = '', lines = 1 }) => {
  if (lines === 1) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 rounded h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        ></div>
      ))}
    </div>
  );
};

export const TaskSkeleton = () => (
  <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 bg-gray-200 rounded"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-5 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  </div>
);

export const UserTaskSkeleton = () => (
  <div className="p-4 border-b border-gray-200 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      </div>
    </div>
    <div className="pl-8 space-y-3">
      <TaskSkeleton />
      <TaskSkeleton />
      <TaskSkeleton />
    </div>
  </div>
);

export default LoadingSkeleton;