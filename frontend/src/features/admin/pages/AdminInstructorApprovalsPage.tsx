import { useState, useEffect, useRef } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import {
  getPendingInstructorProfiles,
  approveInstructorProfile,
  rejectInstructorProfile,
  type InstructorProfileReviewItem,
} from '../../../api/adminInstructorProfiles';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getHttpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function RequestRowSkeleton() {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Bone className="h-4 w-40" />
        <Bone className="h-4 w-16 rounded-full" />
      </div>
      <Bone className="h-3 w-56 mb-4" />
      <Bone className="h-3 w-20 mb-1" />
      <Bone className="h-4 w-full mb-2" />
      <Bone className="h-3 w-16 mb-1" />
      <Bone className="h-12 w-full mb-4" />
      <div className="flex justify-end gap-2">
        <Bone className="h-11 w-20 rounded-md" />
        <Bone className="h-11 w-16 rounded-md" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminInstructorApprovalsPage() {
  const [isLoading, setIsLoading] = useState(true); // true on first render; set false in async callback
  const [loadError, setLoadError] = useState<string | null>(null);
  const [requests, setRequests] = useState<InstructorProfileReviewItem[]>([]);
  const [loadTick, setLoadTick] = useState(0); // increment to trigger a re-fetch
  const [actionPendingId, setActionPendingId] = useState<number | null>(null);
  const [actionErrorById, setActionErrorById] = useState<Record<number, string>>({});
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReasonById, setRejectReasonById] = useState<Record<number, string>>({});
  const [confirmingApproveId, setConfirmingApproveId] = useState<number | null>(null);

  // Single textarea ref is valid because only one row is in reject state at a time.
  const rejectTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Per-row refs for returning focus to the Reject trigger button on cancel.
  const rejectTriggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Per-row refs for returning focus to the Approve trigger button on cancel.
  const approveTriggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // All setState calls are inside .then()/.catch() — asynchronous, not synchronous
  // in the effect body. Satisfies react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    getPendingInstructorProfiles()
      .then(data => {
        if (!cancelled) {
          setRequests(data);
          setLoadError(null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('We could not load instructor requests.');
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [loadTick]);

  // Called from a button click (event handler) — synchronous setState is fine here.
  function handleRetry() {
    setIsLoading(true);
    setLoadError(null);
    setLoadTick(t => t + 1);
  }

  // Move focus into the textarea when the reject form opens.
  useEffect(() => {
    if (rejectingId !== null) {
      rejectTextareaRef.current?.focus();
    }
  }, [rejectingId]);

  // ── State helpers ──────────────────────────────────────────────────────────

  function clearActionError(profileId: number) {
    setActionErrorById(prev => {
      const next = { ...prev };
      delete next[profileId];
      return next;
    });
  }

  function removeRequest(profileId: number) {
    setRequests(prev => prev.filter(r => r.id !== profileId));
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function openApproveConfirm(profileId: number) {
    clearActionError(profileId);
    setConfirmingApproveId(profileId);
  }

  function cancelApprove(profileId: number) {
    setConfirmingApproveId(null);
    clearActionError(profileId);
    // Return focus to the Approve trigger button after the confirmation collapses.
    setTimeout(() => {
      approveTriggerRefs.current.get(profileId)?.focus();
    }, 0);
  }

  function handleApprove(item: InstructorProfileReviewItem) {
    clearActionError(item.id);
    setActionPendingId(item.id);
    approveInstructorProfile(item.id)
      .then(() => {
        removeRequest(item.id);
        setConfirmingApproveId(null);
      })
      .catch((err: unknown) => {
        const status = getHttpStatus(err);
        if (status === 404) {
          removeRequest(item.id);
          setConfirmingApproveId(null);
        } else {
          setActionErrorById(prev => ({
            ...prev,
            [item.id]: 'Something went wrong. Try again.',
          }));
        }
      })
      .finally(() => {
        setActionPendingId(null);
      });
  }

  function openRejectForm(profileId: number) {
    clearActionError(profileId);
    setRejectingId(profileId);
  }

  function cancelReject(profileId: number) {
    setRejectingId(null);
    setRejectReasonById(prev => {
      const next = { ...prev };
      delete next[profileId];
      return next;
    });
    clearActionError(profileId);
    // Return focus to the Reject trigger button after the form collapses.
    setTimeout(() => {
      rejectTriggerRefs.current.get(profileId)?.focus();
    }, 0);
  }

  function handleReject(item: InstructorProfileReviewItem) {
    const rawReason = rejectReasonById[item.id] ?? '';
    const reason = rawReason.trim();
    if (!reason || reason.length > 1000) return;
    clearActionError(item.id);
    setActionPendingId(item.id);
    rejectInstructorProfile(item.id, { rejectionReason: reason })
      .then(() => {
        removeRequest(item.id);
        setRejectingId(null);
        setRejectReasonById(prev => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      })
      .catch((err: unknown) => {
        const status = getHttpStatus(err);
        if (status === 404) {
          removeRequest(item.id);
        } else if (status === 400) {
          setActionErrorById(prev => ({
            ...prev,
            [item.id]: 'Enter a rejection reason of 1000 characters or fewer.',
          }));
        } else {
          setActionErrorById(prev => ({
            ...prev,
            [item.id]: 'Something went wrong. Try again.',
          }));
        }
      })
      .finally(() => {
        setActionPendingId(null);
      });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Instructor approvals</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Review instructor access requests and manage approval decisions.
        </p>
      </div>

      {isLoading ? (
        <div aria-hidden="true" className="flex flex-col gap-3">
          {[0, 1, 2, 3].map(i => <RequestRowSkeleton key={i} />)}
        </div>
      ) : loadError ? (
        <StatePanel message={loadError} onRetry={handleRetry} />
      ) : (
        <>
          {/* Summary strip — omitted on empty list per spec */}
          {requests.length > 0 && (
            <p
              className="text-body-sm text-text-secondary mb-8"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="font-semibold text-text-primary">{requests.length}</span>
              {' pending '}
              {requests.length === 1 ? 'request' : 'requests'}
            </p>
          )}

          {requests.length === 0 ? (
            <StatePanel
              title="No pending instructor requests"
              message="New instructor applications will appear here when learners apply."
            />
          ) : (
            <ul role="list" className="flex flex-col gap-3">
              {requests.map(item => {
                const applicantName = item.fullName || item.email;
                const isActionPending = actionPendingId === item.id;
                const isRejecting = rejectingId === item.id;
                const isConfirmingApprove = confirmingApproveId === item.id;
                const rawReason = rejectReasonById[item.id] ?? '';
                const reasonValid = rawReason.trim().length > 0 && rawReason.length <= 1000;
                const actionError = actionErrorById[item.id];

                return (
                  <li
                    key={item.id}
                    aria-label={`Instructor request from ${applicantName}`}
                    className="bg-surface border border-border-default rounded-lg p-4"
                  >
                    {/* Identity row: name + status badge */}
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-body-sm font-semibold text-text-primary line-clamp-1">
                        {applicantName}
                      </p>
                      <Badge variant="accent">Pending</Badge>
                    </div>

                    {/* Meta line: email + request date */}
                    <p className="text-caption text-text-secondary mb-3">
                      {item.email}
                      {' · Requested '}
                      {formatRelativeDate(item.requestedAt)}
                    </p>

                    {/* Application details */}
                    <dl className="space-y-1.5">
                      {item.expertise && (
                        <div>
                          <dt className="text-caption font-medium text-text-primary">Expertise</dt>
                          <dd className="text-body-sm text-text-secondary">{item.expertise}</dd>
                        </div>
                      )}
                      {item.bio && (
                        <div>
                          <dt className="text-caption font-medium text-text-primary">Bio</dt>
                          <dd className="text-body-sm text-text-secondary">{item.bio}</dd>
                        </div>
                      )}
                      {item.experience && (
                        <div>
                          <dt className="text-caption font-medium text-text-primary">Experience</dt>
                          <dd className="text-body-sm text-text-secondary">{item.experience}</dd>
                        </div>
                      )}
                      {item.motivation && (
                        <div>
                          <dt className="text-caption font-medium text-text-primary">Motivation</dt>
                          <dd className="text-body-sm text-text-secondary">{item.motivation}</dd>
                        </div>
                      )}
                    </dl>

                    {/* Inline reject reason field */}
                    {isRejecting && (
                      <div className="mt-3">
                        <label
                          htmlFor={`reject-reason-${item.id}`}
                          className="block text-caption font-medium text-text-primary mb-1"
                        >
                          Reason for rejection (required)
                        </label>
                        <textarea
                          id={`reject-reason-${item.id}`}
                          ref={rejectTextareaRef}
                          value={rawReason}
                          onChange={e =>
                            setRejectReasonById(prev => ({ ...prev, [item.id]: e.target.value }))
                          }
                          disabled={isActionPending}
                          aria-describedby={`reject-reason-${item.id}-hint`}
                          maxLength={1000}
                          rows={3}
                          placeholder="Explain why this request is being rejected"
                          className="w-full bg-surface text-text-primary text-body border border-border-default rounded-md py-3 px-4 placeholder:text-text-muted focus:outline-none focus:border-salem focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem disabled:bg-surface-elevated disabled:text-text-muted resize-none transition-colors duration-fast"
                        />
                        <p
                          id={`reject-reason-${item.id}-hint`}
                          className="text-caption text-text-muted mt-1"
                        >
                          The applicant may see this reason. {rawReason.length}/1000 characters.
                        </p>
                      </div>
                    )}

                    {/* Inline approve confirmation */}
                    {isConfirmingApprove && (
                      <p className="text-body-sm text-text-primary mt-3">
                        Approve this instructor request?
                      </p>
                    )}

                    {/* Row-level action error */}
                    {actionError && (
                      <p role="alert" className="text-caption text-error mt-2">
                        {actionError}
                      </p>
                    )}

                    {/* Action buttons */}
                    {isRejecting ? (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Button
                          variant="destructive"
                          size="sm"
                          loading={isActionPending}
                          disabled={!reasonValid || isActionPending}
                          onClick={() => handleReject(item)}
                          aria-label={`Confirm rejection of ${applicantName}`}
                        >
                          Confirm rejection
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelReject(item.id)}
                          disabled={isActionPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : isConfirmingApprove ? (
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={isActionPending}
                          disabled={isActionPending}
                          onClick={() => handleApprove(item)}
                          aria-label={`Approve instructor request from ${applicantName}`}
                        >
                          Approve instructor
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelApprove(item.id)}
                          disabled={isActionPending}
                          aria-label={`Cancel approval of instructor request from ${applicantName}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 mt-3 flex-wrap">
                        <Button
                          variant="primary"
                          size="sm"
                          ref={(el) => {
                            if (el) approveTriggerRefs.current.set(item.id, el);
                            else approveTriggerRefs.current.delete(item.id);
                          }}
                          onClick={() => openApproveConfirm(item.id)}
                          disabled={isActionPending}
                          aria-label={`Approve instructor request from ${applicantName}`}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          ref={(el) => {
                            if (el) rejectTriggerRefs.current.set(item.id, el);
                            else rejectTriggerRefs.current.delete(item.id);
                          }}
                          onClick={() => openRejectForm(item.id)}
                          disabled={isActionPending}
                          aria-label={`Reject instructor request from ${applicantName}`}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
