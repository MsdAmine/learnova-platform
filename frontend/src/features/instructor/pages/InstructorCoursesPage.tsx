import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  type CourseLevel,
  type CourseStatus,
  type CreateInstructorCoursePayload,
  type InstructorCourseResponse,
  type UpdateInstructorCoursePayload,
  archiveInstructorCourse,
  createInstructorCourse,
  getMyInstructorCourses,
  publishInstructorCourse,
  updateInstructorCourse,
} from '../../../api/instructorCourses';
import { type CategoryResponse, getCategories } from '../../../api/categories';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { Input, FormField } from '../../../components/ui/Input';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { cn } from '../../../lib/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterValue = 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUpdatedAt(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 30) return `Updated ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Updated 1 month ago';
  if (diffMonths < 12) return `Updated ${diffMonths} months ago`;
  return `Updated ${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function levelLabel(level: CourseLevel): string {
  const labels: Record<CourseLevel, string> = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
    ALL_LEVELS: 'All levels',
  };
  return labels[level];
}

function statusBadgeVariant(status: CourseStatus): BadgeVariant {
  if (status === 'PUBLISHED') return 'salem';
  if (status === 'DRAFT') return 'accent';
  return 'default';
}

function isHttpStatus(err: unknown, status: number): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === status
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function InstructorCoursesLoadingSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <Bone className="h-7 w-52 mb-2" />
          <Bone className="h-4 w-72" />
        </div>
        <Bone className="h-10 w-36 rounded-md" />
      </div>
      <Bone className="h-4 w-60 mb-8" />
      <div className="flex gap-0.5 mb-6">
        <Bone className="h-9 w-10 rounded-md" />
        <Bone className="h-9 w-16 rounded-md" />
        <Bone className="h-9 w-24 rounded-md" />
        <Bone className="h-9 w-20 rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface border border-border-default rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <Bone className="h-4 w-48" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <Bone className="h-3 w-72 mb-3" />
            <div className="flex justify-end gap-2">
              <Bone className="h-9 w-20 rounded-md" />
              <Bone className="h-9 w-14 rounded-md" />
              <Bone className="h-9 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Course form modal ──────────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const INPUT_CLASS = cn(
  'w-full bg-surface text-text-primary text-body',
  'border border-border-default rounded-md',
  'py-3 px-4',
  'transition-colors duration-fast ease-out',
  'focus:outline-none focus:border-salem',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
  'appearance-none',
  'disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed',
);

interface CourseFormModalProps {
  course: InstructorCourseResponse | null;
  onClose: () => void;
  onSuccess: (course: InstructorCourseResponse) => void;
}

function CourseFormModal({ course, onClose, onSuccess }: CourseFormModalProps) {
  const isEdit = course !== null;
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(course?.title ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | ''>(course?.categoryId ?? '');
  const [level, setLevel] = useState<CourseLevel | ''>(course?.level ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnailUrl ?? '');

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState(false);

  // Focus first input on open; return focus to the opener (Create/Edit button) on close
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    titleInputRef.current?.focus();
    return () => { opener?.focus(); };
  }, []);

  // Load categories once on open
  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then(data => {
        if (!cancelled) { setCategories(data); setCatsLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setCatsError(true); setCatsLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  // Escape closes modal; Tab is trapped inside the dialog (aria-modal="true")
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!submitting) onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(el => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && dialog.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!title.trim()) {
      next.title = 'Title is required.';
    } else if (title.length > 200) {
      next.title = 'Title must not exceed 200 characters.';
    }
    if (description.length > 2000) {
      next.description = 'Description must not exceed 2000 characters.';
    }
    if (!categoryId) {
      next.categoryId = 'Category is required.';
    }
    if (!level) {
      next.level = 'Level is required.';
    }
    if (thumbnailUrl.length > 500) {
      next.thumbnailUrl = 'URL must not exceed 500 characters.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setFormError(null);
    setSubmitting(true);
    try {
      let result: InstructorCourseResponse;
      if (isEdit) {
        const payload: UpdateInstructorCoursePayload = {
          title: title.trim() || undefined,
          description: description || undefined,
          categoryId: categoryId !== '' ? (categoryId as number) : undefined,
          level: level !== '' ? (level as CourseLevel) : undefined,
          thumbnailUrl: thumbnailUrl || undefined,
        };
        result = await updateInstructorCourse(course.id, payload);
      } else {
        if (categoryId === '' || level === '') return;
        const payload: CreateInstructorCoursePayload = {
          title: title.trim(),
          categoryId: categoryId as number,
          level: level as CourseLevel,
        };
        if (description) payload.description = description;
        if (thumbnailUrl) payload.thumbnailUrl = thumbnailUrl;
        result = await createInstructorCourse(payload);
      }
      onSuccess(result);
      onClose();
    } catch (err) {
      if (isHttpStatus(err, 409)) {
        setFieldErrors(prev => ({ ...prev, title: 'You already have a course with this title.' }));
      } else {
        setFormError(
          isEdit
            ? 'We could not update this course. Try again.'
            : 'We could not create this course. Try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-form-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text-primary/40"
        aria-hidden="true"
        onClick={() => { if (!submitting) onClose(); }}
      />

      {/* Panel */}
      <div className="relative bg-surface rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="px-6 pt-6 pb-4 border-b border-border-default">
          <h2 id="course-form-title" className="text-title-sm font-semibold text-text-primary">
            {isEdit ? 'Edit course' : 'Create course'}
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            {isEdit
              ? 'Update the course details below.'
              : 'New courses are created as drafts. Publish when ready.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-4 flex flex-col gap-4">

            {/* Title */}
            <FormField label="Title" htmlFor="cf-title" error={fieldErrors.title}>
              <Input
                id="cf-title"
                ref={titleInputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={210}
                placeholder="e.g. React Fundamentals"
                hasError={!!fieldErrors.title}
                disabled={submitting}
              />
            </FormField>

            {/* Description */}
            <FormField
              label="Description (optional)"
              htmlFor="cf-desc"
              error={fieldErrors.description}
            >
              <textarea
                id="cf-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={2100}
                rows={4}
                placeholder="What will learners gain from this course?"
                disabled={submitting}
                aria-invalid={!!fieldErrors.description || undefined}
                className={cn(
                  'w-full bg-surface text-text-primary text-body',
                  'border border-border-default rounded-md',
                  'py-3 px-4 resize-y',
                  'placeholder:text-text-muted',
                  'transition-colors duration-fast ease-out',
                  'focus:outline-none',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
                  fieldErrors.description
                    ? 'border-error focus:border-error focus-visible:outline-error'
                    : 'focus:border-salem focus-visible:outline-salem',
                  submitting && 'bg-surface-elevated text-text-muted cursor-not-allowed',
                )}
              />
            </FormField>

            {/* Category */}
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="cf-cat"
                className="text-body-sm font-medium text-text-secondary"
              >
                Category <span aria-hidden="true">*</span>
              </label>
              {catsLoading ? (
                <div className={cn(INPUT_CLASS, 'text-text-muted cursor-default')}>
                  Loading categories...
                </div>
              ) : catsError ? (
                <p className="text-body-sm text-error" role="alert">
                  Could not load categories. Reload to try again.
                </p>
              ) : (
                <select
                  id="cf-cat"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  disabled={submitting}
                  aria-invalid={!!fieldErrors.categoryId || undefined}
                  aria-required="true"
                  className={cn(
                    INPUT_CLASS,
                    'cursor-pointer',
                    fieldErrors.categoryId && 'border-error',
                  )}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
              {fieldErrors.categoryId && (
                <p className="text-body-sm text-error" role="alert">{fieldErrors.categoryId}</p>
              )}
            </div>

            {/* Level */}
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="cf-level"
                className="text-body-sm font-medium text-text-secondary"
              >
                Level <span aria-hidden="true">*</span>
              </label>
              <select
                id="cf-level"
                value={level}
                onChange={e => setLevel(e.target.value as CourseLevel | '')}
                disabled={submitting}
                aria-invalid={!!fieldErrors.level || undefined}
                aria-required="true"
                className={cn(
                  INPUT_CLASS,
                  'cursor-pointer',
                  fieldErrors.level && 'border-error',
                )}
              >
                <option value="">Select a level</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="ALL_LEVELS">All levels</option>
              </select>
              {fieldErrors.level && (
                <p className="text-body-sm text-error" role="alert">{fieldErrors.level}</p>
              )}
            </div>

            {/* Thumbnail URL */}
            <FormField
              label="Thumbnail URL (optional)"
              htmlFor="cf-thumb"
              error={fieldErrors.thumbnailUrl}
              hint="Paste a direct image URL. There is no upload endpoint in v1."
            >
              <Input
                id="cf-thumb"
                type="url"
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                maxLength={510}
                placeholder="https://..."
                hasError={!!fieldErrors.thumbnailUrl}
                disabled={submitting}
              />
            </FormField>

            {/* Form-level error */}
            {formError && (
              <p className="text-body-sm text-error" role="alert">{formError}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-default flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
            >
              {isEdit ? 'Save changes' : 'Create course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Course row ─────────────────────────────────────────────────────────────────

interface InstructorCourseRowProps {
  course: InstructorCourseResponse;
  onPublish: (id: number) => Promise<void>;
  onArchive: (id: number) => Promise<void>;
  onEdit: (course: InstructorCourseResponse) => void;
}

function InstructorCourseRow({ course, onPublish, onArchive, onEdit }: InstructorCourseRowProps) {
  const [action, setAction] = useState<'publish' | 'archive' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const isArchived = course.status === 'ARCHIVED';
  const visibilityLabel = course.status === 'PUBLISHED'
    ? 'Visible in catalog'
    : 'Not visible in catalog';

  const metaLine = [
    course.categoryName,
    levelLabel(course.level),
    visibilityLabel,
    formatUpdatedAt(course.updatedAt),
  ].join(' · ');

  async function handlePublish() {
    setAction('publish');
    setRowError(null);
    try {
      await onPublish(course.id);
    } catch (err) {
      setRowError(
        isHttpStatus(err, 409)
          ? 'Archived courses cannot be published again.'
          : 'We could not update this course.',
      );
    } finally {
      setAction(null);
    }
  }

  async function handleArchive() {
    setAction('archive');
    setConfirming(false);
    setRowError(null);
    try {
      await onArchive(course.id);
    } catch {
      setRowError('Could not archive this course. Try again.');
      setAction(null);
    }
  }

  return (
    <article
      className="bg-surface border border-border-default rounded-lg p-4"
    >
      {/* Title + badge */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 mb-1">
        <span className="text-body-sm font-semibold text-text-primary line-clamp-1 flex-1 min-w-0">
          {course.title}
        </span>
        <Badge variant={statusBadgeVariant(course.status)}>
          {course.status}
        </Badge>
      </div>

      {/* Meta line */}
      <p className="text-caption text-text-muted mb-3">{metaLine}</p>

      {/* Actions + inline error */}
      <div aria-live="polite" aria-atomic="true">
        {!isArchived && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {confirming ? (
              <>
                <span className="text-caption text-text-secondary select-none">
                  Archive this course?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(false)}
                  disabled={action !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={action === 'archive'}
                  onClick={handleArchive}
                  aria-label={`Confirm archive ${course.title}`}
                >
                  Archive
                </Button>
              </>
            ) : (
              <>
                {course.status === 'DRAFT' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={action === 'publish'}
                    disabled={action !== null}
                    onClick={handlePublish}
                    aria-label={`Publish ${course.title}`}
                  >
                    Publish
                  </Button>
                )}
                <Button asChild variant="ghost" size="sm" disabled={action !== null}>
                  <Link
                    to={`/instructor/courses/${course.id}/content`}
                    aria-label={`Manage content for ${course.title}`}
                  >
                    Manage content
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={action !== null}
                  onClick={() => onEdit(course)}
                  aria-label={`Edit ${course.title}`}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={action !== null}
                  onClick={() => { setConfirming(true); setRowError(null); }}
                  aria-label={`Archive ${course.title}`}
                >
                  Archive
                </Button>
              </>
            )}
          </div>
        )}

        {rowError && (
          <p className="text-caption text-text-muted mt-2 text-right">{rowError}</p>
        )}
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<InstructorCourseResponse[]>([]);
  const [loading, setLoading] = useState(true); // true on first render; set false in async callback
  const [fetchError, setFetchError] = useState(false);
  const [loadTick, setLoadTick] = useState(0);  // increment to trigger a re-fetch
  const [filter, setFilter] = useState<FilterValue>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<InstructorCourseResponse | null>(null);

  // All setState calls here are inside .then()/.catch() — asynchronous, not synchronous
  // in the effect body. Satisfies react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    getMyInstructorCourses()
      .then(data => {
        if (!cancelled) {
          setCourses(data);
          setFetchError(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [loadTick]);

  // Called from a button click (event handler) — synchronous setState is fine here.
  function handleRetry() {
    setLoading(true);
    setFetchError(false);
    setLoadTick(t => t + 1);
  }

  const filteredCourses = useMemo(
    () => (filter === 'all' ? courses : courses.filter(c => c.status === filter)),
    [courses, filter],
  );

  const totalCount     = courses.length;
  const publishedCount = courses.filter(c => c.status === 'PUBLISHED').length;
  const draftCount     = courses.filter(c => c.status === 'DRAFT').length;
  const archivedCount  = courses.filter(c => c.status === 'ARCHIVED').length;

  function upsertCourse(updated: InstructorCourseResponse) {
    setCourses(prev => {
      const exists = prev.some(c => c.id === updated.id);
      if (exists) return prev.map(c => c.id === updated.id ? updated : c);
      return [updated, ...prev];
    });
  }

  async function handlePublish(courseId: number): Promise<void> {
    const updated = await publishInstructorCourse(courseId);
    upsertCourse(updated);
  }

  async function handleArchive(courseId: number): Promise<void> {
    const updated = await archiveInstructorCourse(courseId);
    upsertCourse(updated);
  }

  function openCreate() {
    setEditingCourse(null);
    setFormOpen(true);
  }

  function openEdit(course: InstructorCourseResponse) {
    setEditingCourse(course);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCourse(null);
  }

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {loading ? (
        <InstructorCoursesLoadingSkeleton />
      ) : (
        <>
          {/* ── Page header ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
            <div>
              <h1 className="text-title font-semibold text-text-primary">
                My teaching courses
              </h1>
              <p className="text-body-sm text-text-secondary mt-1">
                Create, publish, and manage the courses you teach.
              </p>
            </div>
            {!fetchError && courses.length > 0 && (
              <Button variant="primary" size="md" onClick={openCreate}>
                Create course
              </Button>
            )}
          </div>

          {/* ── States: error / empty / loaded ─────────────────────────────── */}
          {fetchError ? (
            <StatePanel
              message="We could not load your teaching courses."
              onRetry={handleRetry}
            />
          ) : courses.length === 0 ? (
            <div className="bg-surface border border-border-default rounded-lg px-6 py-12 text-center">
              <p className="text-body-sm font-medium text-text-primary mb-1">
                No teaching courses yet
              </p>
              <p className="text-body-sm text-text-secondary mb-4">
                Create your first course to start building your catalog.
              </p>
              <Button variant="primary" size="md" onClick={openCreate}>
                Create course
              </Button>
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div
                className="flex flex-wrap items-center text-body-sm text-text-secondary mb-8"
                aria-label="Course summary"
              >
                <span>
                  <span className="font-semibold text-text-primary">{totalCount}</span>
                  {' '}{totalCount === 1 ? 'course' : 'courses'} total
                </span>
                {publishedCount > 0 && (
                  <>
                    <span className="mx-2 text-border-hover select-none" aria-hidden="true">·</span>
                    <span>
                      <span className="font-semibold text-text-primary">{publishedCount}</span>
                      {' '}published
                    </span>
                  </>
                )}
                {draftCount > 0 && (
                  <>
                    <span className="mx-2 text-border-hover select-none" aria-hidden="true">·</span>
                    <span>
                      <span className="font-semibold text-text-primary">{draftCount}</span>
                      {' '}{draftCount === 1 ? 'draft' : 'drafts'}
                    </span>
                  </>
                )}
                {archivedCount > 0 && (
                  <>
                    <span className="mx-2 text-border-hover select-none" aria-hidden="true">·</span>
                    <span>
                      <span className="font-semibold text-text-primary">{archivedCount}</span>
                      {' '}archived
                    </span>
                  </>
                )}
              </div>

              {/* Filter tabs */}
              <div className="mb-6">
                <FilterTabs
                  options={[
                    { value: 'all' as const,       label: 'All'       },
                    { value: 'DRAFT' as const,      label: 'Draft'     },
                    { value: 'PUBLISHED' as const,  label: 'Published' },
                    { value: 'ARCHIVED' as const,   label: 'Archived'  },
                  ]}
                  value={filter}
                  onChange={v => setFilter(v)}
                  aria-label="Filter courses by status"
                />
              </div>

              {/* Course list */}
              {filteredCourses.length === 0 ? (
                <p className="text-body-sm text-text-muted py-10 text-center">
                  No courses match this filter.
                </p>
              ) : (
                <ul className="flex flex-col gap-3" aria-label="Teaching courses">
                  {filteredCourses.map(course => (
                    <li key={course.id}>
                      <InstructorCourseRow
                        course={course}
                        onPublish={handlePublish}
                        onArchive={handleArchive}
                        onEdit={openEdit}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}

      {/* Form modal — conditionally mounted so state resets between opens */}
      {formOpen && (
        <CourseFormModal
          key={editingCourse?.id ?? 'create'}
          course={editingCourse}
          onClose={closeForm}
          onSuccess={upsertCourse}
        />
      )}
    </div>
  );
}
