import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { getMyCertificates } from '../../../api/certificates';
import type { CertificateResponse } from '../../../api/certificates';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatIssuedAt(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoString));
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function CertificatesSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-surface border border-border-default rounded-lg p-lg">
          <Bone className="h-5 w-3/4 mb-3" />
          <Bone className="h-3.5 w-1/3 mb-2" />
          <Bone className="h-3.5 w-2/5 mb-2" />
          <Bone className="h-3.5 w-1/2 mb-4" />
          <Bone className="h-9 w-36" />
        </div>
      ))}
    </div>
  );
}

// ── Certificate card ──────────────────────────────────────────────────────────

function CertificateCard({ certificate }: { certificate: CertificateResponse }) {
  const navigate = useNavigate();
  return (
    <article
      className="bg-surface border border-border-default rounded-lg p-lg"
      aria-label={certificate.courseTitle}
    >
      <h3 className="text-title-sm text-text-primary mb-1">
        {certificate.courseTitle}
      </h3>
      <p className="text-body-sm text-text-secondary mb-1">
        Issued{' '}
        <time dateTime={certificate.issuedAt}>
          {formatIssuedAt(certificate.issuedAt)}
        </time>
      </p>
      <p className="text-body-sm text-text-muted mb-1">
        Instructor: {certificate.instructorName}
      </p>
      <p className="text-body-sm text-text-muted mb-4">
        Code:{' '}
        <span className="font-mono">{certificate.certificateCode}</span>
      </p>
      <Button
        variant="secondary"
        size="sm"
        aria-label={`View certificate for ${certificate.courseTitle}`}
        onClick={() => navigate(`/dashboard/certificates/${certificate.id}`)}
      >
        View certificate
      </Button>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);

  const fetchCertificates = useCallback((token: { cancelled: boolean }) => {
    getMyCertificates()
      .then(data => {
        if (token.cancelled) return;
        setCertificates(data);
      })
      .catch(() => {
        if (token.cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (token.cancelled) return;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = { cancelled: false };
    fetchCertificates(token);
    return () => { token.cancelled = true; };
  }, [fetchCertificates]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchCertificates({ cancelled: false });
  }, [fetchCertificates]);

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Certificates</h1>
        <p className="text-body text-text-secondary mt-1 max-w-[72ch]">
          Finish every lesson in a course to issue a certificate from the course player.
        </p>
      </div>

      {/* State ladder */}
      {loading ? (
        <CertificatesSkeleton />
      ) : error ? (
        <StatePanel
          message="We could not load your certificates."
          onRetry={handleRetry}
        />
      ) : certificates.length === 0 ? (
        <div>
          <StatePanel
            title="No certificates yet"
            message="Complete a course to earn your first certificate."
          />
          <div className="mt-4 text-center">
            <Link
              to="/courses"
              className="inline-flex items-center min-h-[44px] text-body-sm font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
            >
              Explore courses
            </Link>
          </div>
        </div>
      ) : (
        <section aria-label="Certificates">
          <div className="flex flex-col gap-4">
            {certificates.map(cert => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
