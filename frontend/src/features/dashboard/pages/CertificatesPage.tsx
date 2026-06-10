import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { FilterTabs } from '../../../components/ui/FilterTabs';

// ── Types ─────────────────────────────────────────────────────────────────────

type CertificateStatus = 'issued' | 'eligible' | 'in_progress';
type CertificateFilter = 'all' | 'issued' | 'ready' | 'in-progress';

interface CertificateItem {
  id: string;
  courseTitle: string;
  instructor: string;
  category?: string;
  status: CertificateStatus;
  issuedAt?: string;
  completedAt?: string;
  progress?: number;
  certificateId?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const CERTIFICATES: CertificateItem[] = [
  {
    id: '1',
    courseTitle: 'Advanced React Patterns and Architecture',
    instructor: 'Sarah Chen',
    category: 'Frontend',
    status: 'issued',
    issuedAt: '2026-05-12',
    certificateId: 'CERT-ARP-2026-001',
  },
  {
    id: '2',
    courseTitle: 'Node.js Backend Engineering',
    instructor: 'James Okafor',
    category: 'Backend',
    status: 'issued',
    issuedAt: '2026-04-03',
    certificateId: 'CERT-NBE-2026-002',
  },
  {
    id: '3',
    courseTitle: 'PostgreSQL for App Developers',
    instructor: 'Ana Torres',
    category: 'Database',
    status: 'eligible',
    completedAt: '2026-05-28',
  },
  {
    id: '4',
    courseTitle: 'TypeScript for Production Systems',
    instructor: 'Marcus Webb',
    category: 'Frontend',
    status: 'in_progress',
    progress: 35,
  },
  {
    id: '5',
    courseTitle: 'System Design Fundamentals',
    instructor: 'Priya Mehta',
    category: 'Architecture',
    status: 'in_progress',
    progress: 12,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryStrip({ items }: { items: CertificateItem[] }) {
  const issued     = items.filter(c => c.status === 'issued').length;
  const eligible   = items.filter(c => c.status === 'eligible').length;
  const inProgress = items.filter(c => c.status === 'in_progress').length;

  return (
    <div
      className="flex items-center gap-0 mb-8 text-body-sm text-text-secondary"
      aria-label="Certificate statistics"
    >
      <span className="flex items-center">
        <span className="font-semibold text-text-primary mr-1.5">{issued}</span>
        {issued === 1 ? 'certificate' : 'certificates'} earned
      </span>
      <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
      <span className="flex items-center">
        <span className="font-semibold text-text-primary mr-1.5">{eligible}</span>
        ready to generate
      </span>
      <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
      <span className="flex items-center">
        <span className="font-semibold text-text-primary mr-1.5">{inProgress}</span>
        in progress
      </span>
    </div>
  );
}

function LatestCertificateRow({ certificate }: { certificate: CertificateItem }) {
  return (
    <div className="flex bg-surface border border-border-hover rounded-lg overflow-hidden mb-6">
      <div
        className="hidden sm:flex w-20 items-center justify-center flex-shrink-0 self-stretch bg-surface-elevated"
        aria-hidden="true"
      >
        <FileText size={20} className="text-text-muted" aria-hidden="true" />
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className="text-caption text-text-muted">Latest certificate</span>
          <Badge variant="anzac" className="flex-shrink-0">Issued</Badge>
        </div>
        <p className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
          {certificate.courseTitle}
        </p>
        <p className="text-caption text-text-secondary mb-3">
          {certificate.instructor}
          {certificate.issuedAt && (
            <>
              {' · Issued '}
              <time dateTime={certificate.issuedAt}>{formatDate(certificate.issuedAt)}</time>
            </>
          )}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-3">
          <Button
            variant="secondary"
            size="sm"
            aria-label={`View certificate for ${certificate.courseTitle}`}
          >
            View certificate
          </Button>
          <button
            type="button"
            aria-label={`Download certificate for ${certificate.courseTitle}`}
            className="text-caption font-medium text-salem min-h-[44px] px-1 rounded-sm hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: CertificateItem }) {
  const isIssued   = certificate.status === 'issued';
  const isEligible = certificate.status === 'eligible';

  return (
    <div className="bg-surface border border-border-default hover:border-border-hover rounded-lg p-4 motion-safe:transition-colors duration-fast">
      {/* Tonal document preview — decorative */}
      <div className="bg-surface-elevated rounded-md h-14 mb-3" aria-hidden="true" />

      {/* Header row: title + status badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-body-sm font-semibold text-text-primary line-clamp-2 flex-1">
          {certificate.courseTitle}
        </p>
        {isIssued && (
          <Badge variant="anzac" className="flex-shrink-0 mt-0.5">Issued</Badge>
        )}
        {isEligible && (
          <Badge variant="salem" className="flex-shrink-0 mt-0.5">Ready</Badge>
        )}
      </div>

      <p className="text-caption text-text-secondary mb-0.5">{certificate.instructor}</p>

      {isIssued && certificate.issuedAt && (
        <time
          className="text-caption text-text-muted block mb-3"
          dateTime={certificate.issuedAt}
        >
          Issued {formatDate(certificate.issuedAt)}
        </time>
      )}
      {isEligible && certificate.completedAt && (
        <time
          className="text-caption text-text-muted block mb-3"
          dateTime={certificate.completedAt}
        >
          Completed {formatDate(certificate.completedAt)}
        </time>
      )}

      {isIssued && (
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            aria-label={`View certificate for ${certificate.courseTitle}`}
          >
            View
          </Button>
          <button
            type="button"
            aria-label={`Download certificate for ${certificate.courseTitle}`}
            className="text-caption font-medium text-salem min-h-[44px] px-1 rounded-sm hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
          >
            Download
          </button>
        </div>
      )}
      {isEligible && (
        <div className="mt-3">
          <Button
            variant="secondary"
            size="sm"
            disabled
            aria-label={`Generate certificate for ${certificate.courseTitle}`}
          >
            Generate certificate
          </Button>
          <p className="text-caption text-text-muted mt-1">
            Certificate generation coming soon.
          </p>
        </div>
      )}
    </div>
  );
}

function CertificateProgressRow({ item }: { item: CertificateItem }) {
  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4 mb-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
            {item.courseTitle}
          </h3>
          <p className="text-caption text-text-secondary">{item.instructor}</p>
        </div>
        <Link
          to="/dashboard/courses"
          aria-label={`Continue ${item.courseTitle}`}
          className="flex items-center gap-1 text-caption font-medium text-salem flex-shrink-0 rounded-sm min-h-[44px] px-1 hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
        >
          Continue <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar
            value={item.progress ?? 0}
            label={`${item.courseTitle} progress toward certificate`}
          />
        </div>
        <span className="text-caption text-text-secondary w-8 text-right flex-shrink-0">
          {item.progress ?? 0}%
        </span>
      </div>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const [filter, setFilter] = useState<CertificateFilter>('all');

  const issuedItems     = CERTIFICATES.filter(c => c.status === 'issued');
  const eligibleItems   = CERTIFICATES.filter(c => c.status === 'eligible');
  const inProgressItems = CERTIFICATES.filter(c => c.status === 'in_progress');

  // Most recently issued certificate — drives LatestCertificateRow
  const latestCertificate = issuedItems.length > 0
    ? issuedItems.reduce((a, b) => ((a.issuedAt ?? '') > (b.issuedAt ?? '') ? a : b))
    : null;

  // Items for the certificate grid
  const gridItems = (() => {
    if (filter === 'issued')      return issuedItems;
    if (filter === 'ready')       return eligibleItems;
    if (filter === 'in-progress') return [];
    return [...issuedItems, ...eligibleItems];
  })();

  const showLatest     = latestCertificate !== null && (filter === 'all' || filter === 'issued');
  const showInProgress = filter === 'all' || filter === 'in-progress';
  const showGrid       = filter !== 'in-progress';

  // Toolbar count: issued+eligible for 'all'; filter-specific otherwise
  const displayCount = (() => {
    if (filter === 'all')         return issuedItems.length + eligibleItems.length;
    if (filter === 'issued')      return issuedItems.length;
    if (filter === 'ready')       return eligibleItems.length;
    return inProgressItems.length;
  })();

  const hasNoData = CERTIFICATES.length === 0;

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* 1. Page header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Certificates</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          View, download, and share the certificates you have earned.
        </p>
      </div>

      {/* 2. Summary strip ─────────────────────────────────────────────── */}
      <SummaryStrip items={CERTIFICATES} />

      {/* 3. Filter toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
        <span className="text-body-sm text-text-secondary">
          {displayCount}{' '}
          {displayCount === 1 ? 'certificate' : 'certificates'}
        </span>
        <FilterTabs
          options={[
            { value: 'all',         label: 'All'         },
            { value: 'issued',      label: 'Issued'      },
            { value: 'ready',       label: 'Ready'       },
            { value: 'in-progress', label: 'In progress' },
          ]}
          value={filter}
          onChange={setFilter}
          aria-label="Filter certificates"
        />
      </div>

      {/* ── Empty state: no data ──────────────────────────────────────── */}
      {hasNoData ? (
        <div className="bg-surface border border-border-default rounded-lg p-8 flex flex-col items-center text-center gap-3">
          <span className="text-body-sm font-semibold text-text-primary">
            No certificates yet
          </span>
          <p className="text-body-sm text-text-secondary">
            Complete a course to earn your first certificate.
          </p>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/dashboard/courses">Go to my courses</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* 4. Latest certificate row ──────────────────────────────── */}
          {showLatest && latestCertificate && (
            <LatestCertificateRow certificate={latestCertificate} />
          )}

          {/* 5. Certificate grid ────────────────────────────────────── */}
          {showGrid && (
            <section className="mb-8" aria-label="Certificates">
              {gridItems.length === 0 ? (
                <p className="text-body-sm text-text-muted py-10 text-center">
                  No certificates match this filter.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                  {gridItems.map(cert => (
                    <CertificateCard key={cert.id} certificate={cert} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 6. In-progress section ─────────────────────────────────── */}
          {showInProgress && (
            inProgressItems.length > 0 ? (
              <section className="mb-6" aria-label="In progress">
                <h2 className="text-body-sm font-medium text-text-secondary mb-3">
                  In progress ({inProgressItems.length})
                </h2>
                <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
                  {inProgressItems.map(item => (
                    <CertificateProgressRow key={item.id} item={item} />
                  ))}
                </ul>
              </section>
            ) : (
              filter === 'in-progress' && (
                <p className="text-body-sm text-text-muted py-10 text-center">
                  No certificates match this filter.
                </p>
              )
            )
          )}
        </>
      )}

    </div>
  );
}
