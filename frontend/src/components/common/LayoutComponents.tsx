import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function PageShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-gray-500 max-w-3xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap flex-shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionCard({ title, subtitle, actions, children, className = '' }: { title?: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ title, message, icon, action }: { title: string; message: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 min-h-[220px]">
      {icon && <div className="text-gray-400 mb-3 flex justify-center">{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-2 max-w-sm leading-relaxed">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[220px]">
      <LoadingSpinner size="lg" text={message || "Loading data..."} />
    </div>
  );
}

export function ErrorState({ title, message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 rounded-xl border border-red-200 max-w-xl mx-auto my-4">
      <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mb-3" />
      <h3 className="text-sm font-semibold text-red-900">{title || "Operation Failed"}</h3>
      <p className="text-xs text-red-600 mt-2 leading-relaxed">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors">
          Retry Action
        </button>
      )}
    </div>
  );
}

export function ResponsiveGrid({ children, cols = 3, className = '' }: { children: React.ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  const colClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };
  
  return (
    <div className={`grid gap-6 ${colClasses[cols]} ${className}`}>
      {children}
    </div>
  );
}
