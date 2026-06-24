import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { downloadCertificatePdf, getCertificate } from '../../../api/certificates';
import type { CertificateResponse } from '../../../api/certificates';
import { Button } from '../../../components/ui/Button';

function formatIssuedAt(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoString));
}

export default function CertificateViewPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [certificate, setCertificate] = useState<CertificateResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    const token = { cancelled: false };
    getCertificate(Number(certificateId))
      .then(data => {
        if (token.cancelled) return;
        setCertificate(data);
      })
      .catch(() => {
        if (token.cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (token.cancelled) return;
        setLoading(false);
      });
    return () => {
      token.cancelled = true;
    };
  }, [certificateId]);

  const handleDownloadPdf = async () => {
    if (!certificate) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      await downloadCertificatePdf(certificate.id, certificate.certificateCode);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          .cert-actions { display: none !important; }
          body { margin: 0; padding: 0; }
          .cert-page { padding: 0 !important; }
          .cert-card {
            max-width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #E5E7EB !important;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <main className="cert-page min-h-screen bg-bg-base flex flex-col items-center py-3xl px-md">
        {loading && (
          <p className="text-body-sm text-text-secondary mt-3xl">Loading certificate...</p>
        )}

        {!loading && error && (
          <div className="text-center mt-3xl">
            <p className="text-body text-text-primary mb-md">Certificate not found.</p>
            <button
              type="button"
              onClick={() => navigate('/dashboard/certificates')}
              className="text-body-sm text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
            >
              ← Back to certificates
            </button>
          </div>
        )}

        {!loading && !error && certificate && (
          <>
            <div className="cert-card bg-surface border border-border-default rounded-lg w-full max-w-container-prose p-xl md:p-3xl text-center shadow-layer">

              {/* Platform name */}
              <p className="text-title-sm text-salem">Learnova</p>

              {/* Decorative divider — Salem at 20% opacity */}
              <div
                style={{
                  width: 48,
                  height: 2,
                  backgroundColor: 'var(--color-salem)',
                  opacity: 0.2,
                  margin: '16px auto',
                }}
              />

              {/* Certificate heading */}
              <h1 className="text-title text-text-primary">Certificate of Completion</h1>

              {/* Recipient */}
              <p className="text-body text-text-secondary mt-xl">This certifies that</p>
              <p className="text-headline text-text-primary mt-sm">{certificate.learnerName}</p>

              {/* Course */}
              <p className="text-body text-text-secondary mt-xl">has successfully completed</p>
              <p className="text-title-sm text-text-primary mt-sm">{certificate.courseTitle}</p>

              {/* Instructor */}
              <p className="text-body-sm text-text-secondary mt-sm">
                Instructed by {certificate.instructorName}
              </p>

              {/* Issued date */}
              <p className="text-body-sm text-text-muted mt-lg">
                Issued {formatIssuedAt(certificate.issuedAt)}
              </p>

              {/* Anzac accent line — completion moment, per DESIGN.md "Field Rule" */}
              <div
                style={{
                  width: 48,
                  height: 2,
                  backgroundColor: 'var(--color-anzac)',
                  margin: '24px auto',
                }}
              />

              {/* Verification code */}
              <p
                className="text-caption text-text-muted uppercase"
                style={{ letterSpacing: '0.05em' }}
              >
                Verification code
              </p>
              <p className="font-mono text-body-sm text-text-secondary mt-xs">
                {certificate.certificateCode}
              </p>
            </div>

            {/* Action bar — hidden on print */}
            <div className="cert-actions flex flex-col items-center gap-3 mt-xl">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard/certificates')}
                >
                  ← Back to my certificates
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDownloadPdf}
                  loading={downloading}
                >
                  Download PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.print()}
                >
                  Print certificate
                </Button>
              </div>
              {downloadError && (
                <p className="text-body-sm text-error">
                  We could not download the PDF. Please try again.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
