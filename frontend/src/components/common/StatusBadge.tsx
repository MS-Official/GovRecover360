import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  const displayLabel = label || STATUS_LABELS[status] || status;

  return (
    <span className={`status-badge ${colorClass}`}>
      {displayLabel}
    </span>
  );
}
