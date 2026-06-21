import { useState, useEffect, useRef } from 'react';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { InstructorRequestCard } from '../components/InstructorRequestCard';
import { InstructorRequestRowSkeleton } from '../components/InstructorRequestRowSkeleton';
import {
  getPendingInstructorProfiles,
  approveInstructorProfile,
  rejectInstructorProfile,
  type InstructorProfileReviewItem,
} from '../../../api/adminInstructorProfiles';

function getHttpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

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

  function registerApproveTrigger(profileId: number, el: HTMLButtonElement | null) {
    if (el) approveTriggerRefs.current.set(profileId, el);
    else approveTriggerRefs.current.delete(profileId);
  }

  function registerRejectTrigger(profileId: number, el: HTMLButtonElement | null) {
    if (el) rejectTriggerRefs.current.set(profileId, el);
    else rejectTriggerRefs.current.delete(profileId);
  }

  function handleReasonChange(profileId: number, value: string) {
    setRejectReasonById(prev => ({ ...prev, [profileId]: value }));
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
          {[0, 1, 2, 3].map(i => <InstructorRequestRowSkeleton key={i} />)}
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
              {requests.map(item => (
                <InstructorRequestCard
                  key={item.id}
                  item={item}
                  isActionPending={actionPendingId === item.id}
                  isRejecting={rejectingId === item.id}
                  isConfirmingApprove={confirmingApproveId === item.id}
                  rawReason={rejectReasonById[item.id] ?? ''}
                  actionError={actionErrorById[item.id]}
                  rejectTextareaRef={rejectTextareaRef}
                  onReasonChange={handleReasonChange}
                  onOpenApproveConfirm={openApproveConfirm}
                  onCancelApprove={cancelApprove}
                  onApprove={handleApprove}
                  onOpenRejectForm={openRejectForm}
                  onCancelReject={cancelReject}
                  onReject={handleReject}
                  registerApproveTrigger={registerApproveTrigger}
                  registerRejectTrigger={registerRejectTrigger}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
