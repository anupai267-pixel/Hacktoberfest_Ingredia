import React from 'react';
import type { NutritionAssessment } from '../../types/analysis';

interface NutritionMetricCardProps {
  assessment: NutritionAssessment;
}

export const NutritionMetricCard: React.FC<NutritionMetricCardProps> = ({ assessment }) => {
  const { metric, value, unit, basis, status, thresholdUsed } = assessment;

  const statusColors = {
    low: { bg: 'var(--status-suitable-bg)', text: 'var(--status-suitable)', label: 'Normal / Low' },
    moderate: { bg: 'var(--status-caution-bg)', text: 'var(--status-caution)', label: 'Moderate' },
    high: { bg: 'var(--status-avoid-bg)', text: 'var(--status-avoid)', label: 'Elevated' },
    unknown: { bg: 'var(--bg-blush)', text: 'var(--text-muted)', label: 'Unavailable' },
  }[status];

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
          {metric}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            background: statusColors.bg,
            color: statusColors.text,
            fontWeight: 500,
          }}
        >
          {statusColors.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        {value !== null ? (
          <>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {value}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {unit} per {basis}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Data not provided
          </span>
        )}
      </div>

      {thresholdUsed && (
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
          Screening threshold: {thresholdUsed}
        </span>
      )}
    </div>
  );
};
