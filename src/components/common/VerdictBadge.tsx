import React from 'react';
import type { ProductVerdict } from '../../types/analysis';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: ProductVerdict;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  verdict,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    suitable: {
      label: 'Suitable',
      className: 'badge-suitable',
      icon: CheckCircle2,
      textColor: 'var(--status-suitable)',
    },
    caution: {
      label: 'Caution',
      className: 'badge-caution',
      icon: AlertTriangle,
      textColor: 'var(--status-caution)',
    },
    avoid: {
      label: 'Avoid',
      className: 'badge-avoid',
      icon: XCircle,
      textColor: 'var(--status-avoid)',
    },
    insufficient_data: {
      label: 'Insufficient Data',
      className: 'badge-insufficient',
      icon: HelpCircle,
      textColor: 'var(--status-insufficient)',
    },
  }[verdict] || {
    label: 'Unknown',
    className: 'badge-neutral',
    icon: HelpCircle,
    textColor: 'var(--text-secondary)',
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-1.5 px-3',
    lg: 'text-base py-2 px-4 font-semibold',
  }[size];

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }[size];

  return (
    <span
      className={`badge ${config.className} ${sizeClasses}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        borderRadius: '6px',
        fontWeight: size === 'lg' ? 600 : 500,
      }}
    >
      {showIcon && <IconComponent size={iconSizes} strokeWidth={2.2} />}
      <span>{config.label}</span>
    </span>
  );
};
