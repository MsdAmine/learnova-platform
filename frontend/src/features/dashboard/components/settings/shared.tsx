import type { ReactNode } from 'react';

// ─── SettingsCard ───────────────────────────────────────────────────────────
// A grouped card within an active settings section (replaces the old
// page-wide anchor "SettingsSection" now that navigation is tab-driven).

export interface SettingsCardProps {
  id: string;
  heading: string;
  description?: string;
  children: ReactNode;
}

export function SettingsCard({ id, heading, description, children }: SettingsCardProps) {
  return (
    <section
      aria-labelledby={id}
      className="bg-surface border border-border-default rounded-lg p-4"
    >
      <h2 id={id} className="text-title-sm font-semibold text-text-primary">
        {heading}
      </h2>
      {description && (
        <p className="text-body-sm text-text-secondary mt-1">{description}</p>
      )}
      {children}
    </section>
  );
}

// ─── InfoRow ────────────────────────────────────────────────────────────────

export interface InfoRowProps {
  label: string;
  children: ReactNode;
}

export function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="py-3 flex items-start justify-between gap-4">
      <dt className="text-body-sm font-medium text-text-primary flex-shrink-0">{label}</dt>
      <dd className="text-body-sm text-text-secondary text-right min-w-0 break-words">
        {children}
      </dd>
    </div>
  );
}
