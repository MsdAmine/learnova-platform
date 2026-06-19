import type { Ref } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { InstructorProfileReviewItem } from '../../../api/adminInstructorProfiles';

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

export function InstructorRequestCard({
  item,
  isActionPending,
  isRejecting,
  isConfirmingApprove,
  rawReason,
  actionError,
  rejectTextareaRef,
  onReasonChange,
  onOpenApproveConfirm,
  onCancelApprove,
  onApprove,
  onOpenRejectForm,
  onCancelReject,
  onReject,
  registerApproveTrigger,
  registerRejectTrigger,
}: {
  item: InstructorProfileReviewItem;
  isActionPending: boolean;
  isRejecting: boolean;
  isConfirmingApprove: boolean;
  rawReason: string;
  actionError?: string;
  rejectTextareaRef: Ref<HTMLTextAreaElement>;
  onReasonChange: (profileId: number, value: string) => void;
  onOpenApproveConfirm: (profileId: number) => void;
  onCancelApprove: (profileId: number) => void;
  onApprove: (item: InstructorProfileReviewItem) => void;
  onOpenRejectForm: (profileId: number) => void;
  onCancelReject: (profileId: number) => void;
  onReject: (item: InstructorProfileReviewItem) => void;
  registerApproveTrigger: (profileId: number, el: HTMLButtonElement | null) => void;
  registerRejectTrigger: (profileId: number, el: HTMLButtonElement | null) => void;
}) {
  const applicantName = item.fullName || item.email;
  const reasonValid = rawReason.trim().length > 0 && rawReason.length <= 1000;

  return (
    <li
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
            onChange={e => onReasonChange(item.id, e.target.value)}
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
            onClick={() => onReject(item)}
            aria-label={`Confirm rejection of ${applicantName}`}
          >
            Confirm rejection
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancelReject(item.id)}
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
            onClick={() => onApprove(item)}
            aria-label={`Approve instructor request from ${applicantName}`}
          >
            Approve instructor
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancelApprove(item.id)}
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
            ref={(el) => registerApproveTrigger(item.id, el)}
            onClick={() => onOpenApproveConfirm(item.id)}
            disabled={isActionPending}
            aria-label={`Approve instructor request from ${applicantName}`}
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            ref={(el) => registerRejectTrigger(item.id, el)}
            onClick={() => onOpenRejectForm(item.id)}
            disabled={isActionPending}
            aria-label={`Reject instructor request from ${applicantName}`}
          >
            Reject
          </Button>
        </div>
      )}
    </li>
  );
}
