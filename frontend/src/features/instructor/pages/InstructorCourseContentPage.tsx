import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  type InstructorCourseContentResponse,
  type InstructorLessonResponse,
  type InstructorSectionResponse,
  type LessonContentType,
  type LessonPayload,
  createLesson,
  createSection,
  deleteLesson,
  deleteSection,
  getInstructorCourseContent,
  updateLesson,
  updateSection,
} from '../../../api/instructorCourseContent';
import { Button } from '../../../components/ui/Button';
import { Input, FormField } from '../../../components/ui/Input';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { cn } from '../../../lib/cn';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isHttpStatus(err: unknown, status: number): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === status
  );
}

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`;
}

function validateTitle(value: string): string | null {
  if (!value.trim()) return 'Title is required.';
  if (value.length > 200) return 'Title must not exceed 200 characters.';
  return null;
}

// ── Lesson content helpers ──────────────────────────────────────────────────────

// '' represents "no content yet" (a structural placeholder lesson).
type ContentTypeChoice = '' | LessonContentType;

const CONTENT_TYPE_OPTIONS: { value: ContentTypeChoice; label: string }[] = [
  { value: '', label: 'No content yet' },
  { value: 'TEXT', label: 'Text' },
  { value: 'VIDEO', label: 'Video (external link)' },
  { value: 'PDF', label: 'PDF (external link)' },
  { value: 'LINK', label: 'Resource link' },
];

const URL_CONTENT_TYPES: ContentTypeChoice[] = ['VIDEO', 'PDF', 'LINK'];

interface LessonDraft {
  title: string;
  contentType: ContentTypeChoice;
  textContent: string;
  contentUrl: string;
  durationMinutes: string;
}

interface LessonFieldErrors {
  title?: string;
  textContent?: string;
  contentUrl?: string;
  durationMinutes?: string;
}

const EMPTY_LESSON_DRAFT: LessonDraft = {
  title: '',
  contentType: '',
  textContent: '',
  contentUrl: '',
  durationMinutes: '',
};

function draftFromLesson(lesson: InstructorLessonResponse): LessonDraft {
  return {
    title: lesson.title,
    contentType: lesson.contentType ?? '',
    textContent: lesson.textContent ?? '',
    contentUrl: lesson.contentUrl ?? '',
    durationMinutes:
      lesson.durationSeconds != null ? String(Math.round(lesson.durationSeconds / 60)) : '',
  };
}

function isHttpUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const url = new URL(v);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateLessonDraft(d: LessonDraft): LessonFieldErrors {
  const errors: LessonFieldErrors = {};
  const titleError = validateTitle(d.title);
  if (titleError) errors.title = titleError;

  if (d.contentType === 'TEXT' && !d.textContent.trim()) {
    errors.textContent = 'Lesson body is required for text lessons.';
  }
  if (URL_CONTENT_TYPES.includes(d.contentType) && !isHttpUrl(d.contentUrl)) {
    errors.contentUrl = 'Enter a valid http:// or https:// URL.';
  }
  const minutes = d.durationMinutes.trim();
  if (minutes && (!/^\d+$/.test(minutes) || Number(minutes) < 0)) {
    errors.durationMinutes = 'Enter a whole number of minutes.';
  }
  return errors;
}

function buildLessonPayload(d: LessonDraft): LessonPayload {
  const contentType = d.contentType === '' ? null : d.contentType;
  const minutes = d.durationMinutes.trim();
  return {
    title: d.title.trim(),
    contentType,
    textContent: contentType === 'TEXT' ? d.textContent : null,
    contentUrl: contentType && contentType !== 'TEXT' ? d.contentUrl.trim() : null,
    durationSeconds: minutes ? Number(minutes) * 60 : null,
  };
}

// Shared field styling, matching the Input component's stroke-only-at-rest look.
const fieldClass = cn(
  'w-full bg-surface text-text-primary text-body',
  'border border-border-default rounded-md py-3 px-4',
  'placeholder:text-text-muted transition-colors duration-fast ease-out',
  'focus:outline-none focus:border-salem',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
);

// ── Shared lesson fields form (title + content) ─────────────────────────────────
// Self-contained: owns draft + inline validation state. Parent handles the API
// call and any server/network error via onSubmit + serverError. Remount with a
// new `key` to reset (used by the add form after a successful create).

interface LessonFieldsFormProps {
  initial: LessonDraft;
  submitLabel: string;
  submitVariant: 'primary' | 'secondary';
  isPending: boolean;
  idPrefix: string;
  ariaContext: string;
  serverError: string | null;
  onSubmit: (payload: LessonPayload) => void;
  onCancel: () => void;
}

function LessonFieldsForm({
  initial,
  submitLabel,
  submitVariant,
  isPending,
  idPrefix,
  ariaContext,
  serverError,
  onSubmit,
  onCancel,
}: LessonFieldsFormProps) {
  const [draft, setDraft] = useState<LessonDraft>(initial);
  const [errors, setErrors] = useState<LessonFieldErrors>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  function update<K extends keyof LessonDraft>(key: K, value: LessonDraft[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
    if (errors[key as keyof LessonFieldErrors]) {
      setErrors(prev => { const next = { ...prev }; delete next[key as keyof LessonFieldErrors]; return next; });
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateLessonDraft(draft);
    if (Object.keys(found).length > 0) { setErrors(found); return; }
    setErrors({});
    onSubmit(buildLessonPayload(draft));
  }

  const isUrlType = URL_CONTENT_TYPES.includes(draft.contentType);
  const urlLabel =
    draft.contentType === 'VIDEO' ? 'Video URL'
      : draft.contentType === 'PDF' ? 'PDF URL'
        : 'Resource URL';

  return (
    <form onSubmit={handleSubmit} noValidate className="px-2 py-3 flex flex-col gap-3">
      <FormField label="Lesson title" htmlFor={`${idPrefix}-title`} error={errors.title}>
        <Input
          id={`${idPrefix}-title`}
          ref={titleRef}
          value={draft.title}
          onChange={e => update('title', e.target.value)}
          maxLength={210}
          placeholder="Lesson title"
          hasError={!!errors.title}
          disabled={isPending}
          aria-label={`Lesson title for ${ariaContext}`}
        />
      </FormField>

      <FormField label="Content type" htmlFor={`${idPrefix}-type`}>
        <select
          id={`${idPrefix}-type`}
          value={draft.contentType}
          onChange={e => update('contentType', e.target.value as ContentTypeChoice)}
          disabled={isPending}
          className={fieldClass}
        >
          {CONTENT_TYPE_OPTIONS.map(opt => (
            <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormField>

      {draft.contentType === 'TEXT' && (
        <FormField
          label="Lesson body"
          htmlFor={`${idPrefix}-text`}
          error={errors.textContent}
          hint="Plain text only. Line breaks are preserved for learners."
        >
          <textarea
            id={`${idPrefix}-text`}
            value={draft.textContent}
            onChange={e => update('textContent', e.target.value)}
            maxLength={20000}
            rows={6}
            placeholder="Write the lesson content here…"
            aria-invalid={!!errors.textContent || undefined}
            disabled={isPending}
            className={cn(fieldClass, 'resize-y min-h-[120px]', errors.textContent && 'border-error focus:border-error focus-visible:outline-error')}
          />
        </FormField>
      )}

      {isUrlType && (
        <FormField
          label={urlLabel}
          htmlFor={`${idPrefix}-url`}
          error={errors.contentUrl}
          hint="Paste an external link. File uploads are not supported yet."
        >
          <Input
            id={`${idPrefix}-url`}
            type="url"
            inputMode="url"
            value={draft.contentUrl}
            onChange={e => update('contentUrl', e.target.value)}
            maxLength={2048}
            placeholder="https://…"
            hasError={!!errors.contentUrl}
            disabled={isPending}
          />
        </FormField>
      )}

      <FormField
        label="Estimated duration (minutes, optional)"
        htmlFor={`${idPrefix}-duration`}
        error={errors.durationMinutes}
      >
        <Input
          id={`${idPrefix}-duration`}
          type="text"
          inputMode="numeric"
          value={draft.durationMinutes}
          onChange={e => update('durationMinutes', e.target.value)}
          maxLength={5}
          placeholder="e.g. 10"
          hasError={!!errors.durationMinutes}
          disabled={isPending}
          className="max-w-[160px]"
        />
      </FormField>

      {serverError && (
        <p className="text-body-sm text-error" role="alert">{serverError}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" variant={submitVariant} size="sm" loading={isPending}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function ContentLoadingSkeleton() {
  return (
    <div aria-hidden="true">
      <Bone className="h-4 w-32 mb-4" />
      <Bone className="h-7 w-64 mb-2" />
      <Bone className="h-4 w-80 mb-8" />
      <Bone className="h-4 w-40 mb-8" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-surface border border-border-default rounded-lg p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <Bone className="h-5 w-48" />
                <div className="flex gap-2">
                  <Bone className="h-9 w-24 rounded-md" />
                  <Bone className="h-9 w-14 rounded-md" />
                  <Bone className="h-9 w-16 rounded-md" />
                </div>
              </div>
              <Bone className="h-4 w-full mb-2" />
              <Bone className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        <div>
          <div className="bg-surface border border-border-default rounded-lg p-4">
            <Bone className="h-5 w-28 mb-3" />
            <Bone className="h-10 w-full rounded-md mb-3" />
            <Bone className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add-section side panel ─────────────────────────────────────────────────────

interface AddSectionPanelProps {
  courseId: number;
  onCreated: (section: InstructorSectionResponse) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function AddSectionPanel({ courseId, onCreated, inputRef }: AddSectionPanelProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validateTitle(title);
    if (validationError) { setError(validationError); return; }
    setError(null);
    setSubmitting(true);
    try {
      const section = await createSection(courseId, { title: title.trim() });
      onCreated(section);
      setTitle('');
      inputRef.current?.focus();
    } catch (err) {
      setError(
        isHttpStatus(err, 409)
          ? 'Archived courses cannot be edited.'
          : 'Could not add section. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface border border-border-default rounded-lg p-4">
      <h2 className="text-title-sm font-semibold text-text-primary mb-3">Add a section</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3">
          <FormField label="Section title" htmlFor="add-section-title" error={error ?? undefined}>
            <Input
              id="add-section-title"
              ref={inputRef}
              value={title}
              onChange={e => { setTitle(e.target.value); if (error) setError(null); }}
              maxLength={210}
              placeholder="e.g. Getting Started"
              hasError={!!error}
              disabled={submitting}
            />
          </FormField>
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            Add section
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Guidance panel (desktop only) ─────────────────────────────────────────────

function GuidancePanel() {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-4 mt-4">
      <p className="text-body-sm font-medium text-text-primary mb-1">How content works</p>
      <p className="text-body-sm text-text-secondary">
        Sections group related lessons. Learners see this structure in the course player, in the
        order shown here. New sections and lessons are added to the end.
      </p>
    </div>
  );
}

// ── Inline add-lesson form ─────────────────────────────────────────────────────

interface AddLessonFormProps {
  sectionId: number;
  sectionTitle: string;
  onCreated: (lesson: InstructorLessonResponse) => void;
  onClose: () => void;
}

function AddLessonForm({ sectionId, sectionTitle, onCreated, onClose }: AddLessonFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Bump to remount the fields form with a fresh, empty draft after a create.
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(payload: LessonPayload) {
    setServerError(null);
    setSubmitting(true);
    try {
      const lesson = await createLesson(sectionId, payload);
      onCreated(lesson);
      setFormKey(k => k + 1);
    } catch (err) {
      setServerError(
        isHttpStatus(err, 409)
          ? 'Archived courses cannot be edited.'
          : 'Could not add lesson. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <li className="border-t border-border-default">
      <LessonFieldsForm
        key={formKey}
        initial={EMPTY_LESSON_DRAFT}
        submitLabel="Add lesson"
        submitVariant="secondary"
        isPending={submitting}
        idPrefix={`add-lesson-${sectionId}`}
        ariaContext={`section ${sectionTitle}`}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </li>
  );
}

// ── Inline lesson edit form (mounted only while editing) ───────────────────────

interface LessonEditFormProps {
  lesson: InstructorLessonResponse;
  sectionTitle: string;
  isPending: boolean;
  serverError: string | null;
  onSave: (payload: LessonPayload) => void;
  onCancel: () => void;
}

// Mounted only while editingLessonId === lesson.id (see parent), and unmounts
// on save/cancel — so the initial draft captured from `lesson` never needs to
// re-sync with a changed prop; a different lesson means a fresh mount.
function LessonEditForm({ lesson, sectionTitle, isPending, serverError, onSave, onCancel }: LessonEditFormProps) {
  return (
    <LessonFieldsForm
      initial={draftFromLesson(lesson)}
      submitLabel="Save"
      submitVariant="secondary"
      isPending={isPending}
      idPrefix={`edit-lesson-${lesson.id}`}
      ariaContext={`lesson ${lesson.title} in section ${sectionTitle}`}
      serverError={serverError}
      onSubmit={onSave}
      onCancel={onCancel}
    />
  );
}

// ── Lesson row ─────────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: InstructorLessonResponse;
  sectionTitle: string;
  isEditing: boolean;
  isDeleting: boolean;
  isPending: boolean;
  rowError: string | null;
  onEdit: () => void;
  onSave: (payload: LessonPayload) => void;
  onCancelEdit: () => void;
  onDeleteClick: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onEditButtonRef: (el: HTMLButtonElement | null) => void;
}

function LessonRow({
  lesson,
  sectionTitle,
  isEditing,
  isDeleting,
  isPending,
  rowError,
  onEdit,
  onSave,
  onCancelEdit,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
  onEditButtonRef,
}: LessonRowProps) {
  return (
    <li aria-live="polite" aria-atomic="true" className="border-t border-border-default">
      {isEditing ? (
        <LessonEditForm
          lesson={lesson}
          sectionTitle={sectionTitle}
          isPending={isPending}
          serverError={rowError}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      ) : isDeleting ? (
        <div className="px-2 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-caption text-text-secondary select-none">Delete this lesson?</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancelDelete} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={isPending}
              onClick={onConfirmDelete}
              aria-label={`Confirm delete lesson ${lesson.title}`}
            >
              Delete lesson
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-2 py-2 flex items-center justify-between gap-2 min-h-[44px]">
            <span className="text-body-sm text-text-primary line-clamp-2 flex-1 min-w-0">
              {lesson.title}
            </span>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                ref={onEditButtonRef}
                variant="ghost"
                size="sm"
                onClick={onEdit}
                aria-label={`Edit lesson ${lesson.title} in section ${sectionTitle}`}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteClick}
                aria-label={`Delete lesson ${lesson.title} in section ${sectionTitle}`}
              >
                Delete
              </Button>
            </div>
          </div>
          {rowError && (
            <p className="px-2 pb-2 text-caption text-error" role="alert">{rowError}</p>
          )}
        </>
      )}
    </li>
  );
}

// ── Inline section edit form (mounted only while editing) ─────────────────────

interface SectionEditFormProps {
  section: InstructorSectionResponse;
  isPending: boolean;
  onSave: (title: string) => void;
  onCancel: () => void;
}

// Mounted only while editingSectionId === section.id (see parent), and
// unmounts on save/cancel — so the initial-value capture below never needs to
// re-sync with a changed `section` prop; a different section means a fresh mount.
function SectionEditForm({ section, isPending, onSave, onCancel }: SectionEditFormProps) {
  const [draftTitle, setDraftTitle] = useState(section.title);
  const [editError, setEditError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount — DOM-only side effect, no setState.
  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateTitle(draftTitle);
    if (err) { setEditError(err); return; }
    setEditError(null);
    onSave(draftTitle.trim());
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mb-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-1 min-w-0">
          <Input
            ref={inputRef}
            value={draftTitle}
            onChange={e => { setDraftTitle(e.target.value); if (editError) setEditError(null); }}
            maxLength={210}
            hasError={!!editError}
            disabled={isPending}
            aria-label={`New title for section ${section.title}`}
          />
          {editError && (
            <p className="text-body-sm text-error mt-1" role="alert">{editError}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0 pt-px">
          <Button type="submit" variant="secondary" size="sm" loading={isPending}>
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Section card ───────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: InstructorSectionResponse;
  isEditing: boolean;
  isConfirmingDelete: boolean;
  addingLesson: boolean;
  pendingIds: Set<string>;
  rowErrors: Record<string, string>;
  editingLessonId: number | null;
  deletingLessonId: number | null;
  onEditSection: () => void;
  onSaveSection: (title: string) => void;
  onCancelEditSection: () => void;
  onDeleteSectionClick: () => void;
  onCancelDeleteSection: () => void;
  onConfirmDeleteSection: () => void;
  onAddLesson: () => void;
  onLessonCreated: (lesson: InstructorLessonResponse) => void;
  onCloseLessonForm: () => void;
  onEditLesson: (lessonId: number) => void;
  onSaveLesson: (lessonId: number, payload: LessonPayload) => void;
  onCancelEditLesson: () => void;
  onDeleteLessonClick: (lessonId: number) => void;
  onCancelDeleteLesson: () => void;
  onConfirmDeleteLesson: (lessonId: number) => void;
  onEditSectionButtonRef: (el: HTMLButtonElement | null) => void;
  onLessonEditButtonRef: (lessonId: number, el: HTMLButtonElement | null) => void;
}

function SectionCard({
  section,
  isEditing,
  isConfirmingDelete,
  addingLesson,
  pendingIds,
  rowErrors,
  editingLessonId,
  deletingLessonId,
  onEditSection,
  onSaveSection,
  onCancelEditSection,
  onDeleteSectionClick,
  onCancelDeleteSection,
  onConfirmDeleteSection,
  onAddLesson,
  onLessonCreated,
  onCloseLessonForm,
  onEditLesson,
  onSaveLesson,
  onCancelEditLesson,
  onDeleteLessonClick,
  onCancelDeleteLesson,
  onConfirmDeleteLesson,
  onEditSectionButtonRef,
  onLessonEditButtonRef,
}: SectionCardProps) {
  const sectionKey = `section:${section.id}`;
  const isSectionPending = pendingIds.has(sectionKey);
  const sectionRowError = rowErrors[sectionKey] ?? null;
  const lessonCount = section.lessons.length;
  const showLessonList = lessonCount > 0 || addingLesson;

  return (
    <article className="bg-surface border border-border-default rounded-lg p-4">

      {/* Section header */}
      <div aria-live="polite" aria-atomic="true">
        {isEditing ? (
          <SectionEditForm
            section={section}
            isPending={isSectionPending}
            onSave={onSaveSection}
            onCancel={onCancelEditSection}
          />
        ) : isConfirmingDelete ? (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-caption text-text-secondary select-none">
              Delete this section and its lessons?
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelDeleteSection}
                disabled={isSectionPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                loading={isSectionPending}
                onClick={onConfirmDeleteSection}
                aria-label={`Confirm delete section ${section.title}`}
              >
                Delete section
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-4">
            <div className="min-w-0 sm:flex-1">
              <h2 className="text-title-sm font-semibold text-text-primary line-clamp-2">
                {section.title}
              </h2>
              <span className="text-caption text-text-muted">
                {pluralize(lessonCount, 'lesson', 'lessons')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={onAddLesson}
                disabled={isSectionPending || addingLesson}
                aria-label={`Add lesson to ${section.title}`}
              >
                Add lesson
              </Button>
              <Button
                ref={onEditSectionButtonRef}
                variant="ghost"
                size="sm"
                onClick={onEditSection}
                disabled={isSectionPending}
                aria-label={`Edit section ${section.title}`}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteSectionClick}
                disabled={isSectionPending}
                aria-label={`Delete section ${section.title}`}
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        {sectionRowError && !isEditing && !isConfirmingDelete && (
          <p className="text-caption text-error mb-2" role="alert">{sectionRowError}</p>
        )}
      </div>

      {/* Lesson list */}
      {!showLessonList ? (
        <p className="text-caption text-text-muted px-2 py-2">
          No lessons in this section yet.
        </p>
      ) : (
        <ul aria-label={`Lessons in ${section.title}`}>
          {section.lessons.map(lesson => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              sectionTitle={section.title}
              isEditing={editingLessonId === lesson.id}
              isDeleting={deletingLessonId === lesson.id}
              isPending={pendingIds.has(`lesson:${lesson.id}`)}
              rowError={rowErrors[`lesson:${lesson.id}`] ?? null}
              onEdit={() => onEditLesson(lesson.id)}
              onSave={payload => onSaveLesson(lesson.id, payload)}
              onCancelEdit={onCancelEditLesson}
              onDeleteClick={() => onDeleteLessonClick(lesson.id)}
              onCancelDelete={onCancelDeleteLesson}
              onConfirmDelete={() => onConfirmDeleteLesson(lesson.id)}
              onEditButtonRef={el => onLessonEditButtonRef(lesson.id, el)}
            />
          ))}
          {addingLesson && (
            <AddLessonForm
              sectionId={section.id}
              sectionTitle={section.title}
              onCreated={onLessonCreated}
              onClose={onCloseLessonForm}
            />
          )}
        </ul>
      )}
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstructorCourseContentPage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>();
  const parsedCourseId = Number(courseIdParam);
  const isInvalidId = !courseIdParam || isNaN(parsedCourseId);
  const courseId = isInvalidId ? 0 : parsedCourseId;

  const [content, setContent] = useState<InstructorCourseContentResponse | null>(null);
  const [loading, setLoading] = useState(!isInvalidId);
  const [fetchError, setFetchError] = useState(false);
  const [loadTick, setLoadTick] = useState(0);

  // Single-at-a-time inline edit/delete state
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<number | null>(null);
  const [addingLessonSectionId, setAddingLessonSectionId] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<number | null>(null);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  // Focus management refs
  const addSectionInputRef = useRef<HTMLInputElement>(null);
  const editSectionButtonRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());
  const lessonEditButtonRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isInvalidId) return; // invalid id — render not-found without a fetch
    let cancelled = false;
    // loading=true is set by useState (initial) or by handleRetry (event handler).
    // Do not set it here — setState in effect body is flagged by react-hooks/set-state-in-effect.
    getInstructorCourseContent(courseId)
      .then(data => {
        if (!cancelled) {
          setContent(data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, loadTick]);

  function handleRetry() {
    setLoading(true);
    setFetchError(false);
    setContent(null);
    setLoadTick(t => t + 1);
  }

  // ── Pending helpers ─────────────────────────────────────────────────────────

  function addPending(key: string) {
    setPendingIds(prev => { const next = new Set(prev); next.add(key); return next; });
  }
  function removePending(key: string) {
    setPendingIds(prev => { const next = new Set(prev); next.delete(key); return next; });
  }
  function setRowError(key: string, msg: string) {
    setRowErrors(prev => ({ ...prev, [key]: msg }));
  }
  function clearRowError(key: string) {
    setRowErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
  }

  // ── Section CRUD ────────────────────────────────────────────────────────────

  const handleSectionCreated = useCallback((section: InstructorSectionResponse) => {
    setContent(prev => prev ? { ...prev, sections: [...prev.sections, section] } : prev);
  }, []);

  async function handleSaveSection(sectionId: number, title: string) {
    const key = `section:${sectionId}`;
    addPending(key);
    clearRowError(key);
    try {
      const updated = await updateSection(sectionId, { title });
      setContent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map(s =>
            s.id === sectionId ? { ...s, title: updated.title } : s,
          ),
        };
      });
      setEditingSectionId(null);
      setTimeout(() => editSectionButtonRefs.current.get(sectionId)?.focus(), 0);
    } catch (err) {
      setEditingSectionId(null);
      setRowError(
        key,
        isHttpStatus(err, 409)
          ? 'Archived courses cannot be edited.'
          : 'Could not rename section. Try again.',
      );
    } finally {
      removePending(key);
    }
  }

  async function handleConfirmDeleteSection(sectionId: number) {
    const key = `section:${sectionId}`;
    addPending(key);
    clearRowError(key);
    try {
      await deleteSection(sectionId);
      setContent(prev =>
        prev ? { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) } : prev,
      );
      setConfirmDeleteSectionId(null);
      setTimeout(() => addSectionInputRef.current?.focus(), 0);
    } catch (err) {
      setConfirmDeleteSectionId(null);
      setRowError(
        key,
        isHttpStatus(err, 409)
          ? 'Archived courses cannot be edited.'
          : 'Could not delete section. Try again.',
      );
    } finally {
      removePending(key);
    }
  }

  // ── Lesson CRUD ─────────────────────────────────────────────────────────────

  function handleLessonCreated(sectionId: number, lesson: InstructorLessonResponse) {
    setContent(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, lessons: [...s.lessons, lesson] } : s,
        ),
      };
    });
  }

  async function handleSaveLesson(lessonId: number, payload: LessonPayload) {
    const key = `lesson:${lessonId}`;
    addPending(key);
    clearRowError(key);
    try {
      const updated = await updateLesson(lessonId, payload);
      setContent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map(s => ({
            ...s,
            lessons: s.lessons.map(l => l.id === lessonId ? updated : l),
          })),
        };
      });
      setEditingLessonId(null);
      setTimeout(() => lessonEditButtonRefs.current.get(lessonId)?.focus(), 0);
    } catch (err) {
      // Keep the edit form open so the instructor's draft is not lost; the error
      // is surfaced inline inside the form via the rowError → serverError prop.
      setRowError(
        key,
        isHttpStatus(err, 409)
          ? 'Archived courses cannot be edited.'
          : 'Could not save lesson. Try again.',
      );
    } finally {
      removePending(key);
    }
  }

  async function handleConfirmDeleteLesson(lessonId: number) {
    const key = `lesson:${lessonId}`;
    addPending(key);
    clearRowError(key);
    try {
      await deleteLesson(lessonId);
      setContent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map(s => ({
            ...s,
            lessons: s.lessons.filter(l => l.id !== lessonId),
          })),
        };
      });
      setDeletingLessonId(null);
      setTimeout(() => addSectionInputRef.current?.focus(), 0);
    } catch (err) {
      setDeletingLessonId(null);
      setRowError(
        key,
        isHttpStatus(err, 409)
          ? 'Archived courses cannot be edited.'
          : 'Could not delete lesson. Try again.',
      );
    } finally {
      removePending(key);
    }
  }

  // ── Derived counts ──────────────────────────────────────────────────────────

  const totalSections = content?.sections.length ?? 0;
  const totalLessons =
    content?.sections.reduce((sum, s) => sum + s.lessons.length, 0) ?? 0;

  // ── Callback ref setters (stable) ───────────────────────────────────────────

  const handleEditSectionButtonRef = useCallback(
    (sectionId: number, el: HTMLButtonElement | null) => {
      editSectionButtonRefs.current.set(sectionId, el);
    },
    [],
  );

  const handleLessonEditButtonRef = useCallback(
    (lessonId: number, el: HTMLButtonElement | null) => {
      lessonEditButtonRefs.current.set(lessonId, el);
    },
    [],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-8 py-8 pb-14 max-w-container mx-auto">
        <ContentLoadingSkeleton />
      </div>
    );
  }

  // Determine page error type (404 vs generic)
  const isNotFound = isInvalidId || (fetchError && content === null && !loading);
  const isGenericError = !isInvalidId && fetchError;

  const pageTitle = content?.courseTitle ?? 'Course content';

  const sidePanel = (
    <AddSectionPanel
      courseId={courseId}
      onCreated={handleSectionCreated}
      inputRef={addSectionInputRef}
    />
  );

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* Back link + sibling nav */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Link
          to="/instructor/courses"
          className={cn(
            'inline-flex items-center gap-1 text-body-sm text-text-secondary font-medium',
            'hover:text-text-primary motion-safe:transition-colors duration-fast',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
          )}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to teaching courses
        </Link>
        {!isInvalidId && (
          <Link
            to={`/instructor/courses/${courseId}/quizzes`}
            className={cn(
              'inline-flex items-center text-body-sm text-text-secondary font-medium',
              'hover:text-text-primary motion-safe:transition-colors duration-fast',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
            )}
          >
            Manage quizzes
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">{pageTitle}</h1>
        {!isNotFound && !isGenericError && (
          <p className="text-body-sm text-text-secondary mt-1">
            Organize the sections and lessons learners will see in the course player.
          </p>
        )}
      </div>

      {/* Not-found state */}
      {isNotFound && !isGenericError && (
        <StatePanel
          title="Course not found"
          message="This course does not exist, or you do not have access to it."
        />
      )}

      {/* Generic error */}
      {isGenericError && (
        <StatePanel
          message="We could not load this course content."
          onRetry={handleRetry}
        />
      )}

      {/* Loaded state */}
      {!isNotFound && !isGenericError && content && (
        <>
          {/* Summary strip */}
          {totalSections > 0 && (
            <div
              className="flex flex-wrap items-center text-body-sm text-text-secondary mb-8"
              aria-label="Content summary"
            >
              <span>
                <span className="font-semibold text-text-primary">{totalSections}</span>
                {' '}{totalSections === 1 ? 'section' : 'sections'}
              </span>
              <span className="mx-2 text-border-hover select-none" aria-hidden="true">·</span>
              <span>
                <span className="font-semibold text-text-primary">{totalLessons}</span>
                {' '}{totalLessons === 1 ? 'lesson' : 'lessons'}
              </span>
            </div>
          )}

          {/* Builder grid */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">

            {/* Mobile: side panel above the list */}
            <div className="lg:hidden">{sidePanel}</div>

            {/* Main column */}
            <div>
              {content.sections.length === 0 ? (
                <StatePanel
                  title="No content yet"
                  message="Create the first section to start building this course."
                />
              ) : (
                <ul className="flex flex-col gap-3" aria-label="Course sections">
                  {content.sections.map(section => (
                    <li key={section.id}>
                      <SectionCard
                        section={section}
                        isEditing={editingSectionId === section.id}
                        isConfirmingDelete={confirmDeleteSectionId === section.id}
                        addingLesson={addingLessonSectionId === section.id}
                        pendingIds={pendingIds}
                        rowErrors={rowErrors}
                        editingLessonId={editingLessonId}
                        deletingLessonId={deletingLessonId}
                        onEditSection={() => {
                          setEditingSectionId(section.id);
                          setConfirmDeleteSectionId(null);
                          setAddingLessonSectionId(null);
                        }}
                        onSaveSection={title => handleSaveSection(section.id, title)}
                        onCancelEditSection={() => setEditingSectionId(null)}
                        onDeleteSectionClick={() => {
                          setConfirmDeleteSectionId(section.id);
                          setEditingSectionId(null);
                        }}
                        onCancelDeleteSection={() => setConfirmDeleteSectionId(null)}
                        onConfirmDeleteSection={() => handleConfirmDeleteSection(section.id)}
                        onAddLesson={() => {
                          setAddingLessonSectionId(section.id);
                          setEditingSectionId(null);
                          setConfirmDeleteSectionId(null);
                          setEditingLessonId(null);
                          setDeletingLessonId(null);
                        }}
                        onLessonCreated={lesson => handleLessonCreated(section.id, lesson)}
                        onCloseLessonForm={() => setAddingLessonSectionId(null)}
                        onEditLesson={lessonId => {
                          setEditingLessonId(lessonId);
                          setDeletingLessonId(null);
                          setAddingLessonSectionId(null);
                        }}
                        onSaveLesson={handleSaveLesson}
                        onCancelEditLesson={() => {
                          if (editingLessonId !== null) clearRowError(`lesson:${editingLessonId}`);
                          setEditingLessonId(null);
                        }}
                        onDeleteLessonClick={lessonId => {
                          setDeletingLessonId(lessonId);
                          setEditingLessonId(null);
                        }}
                        onCancelDeleteLesson={() => setDeletingLessonId(null)}
                        onConfirmDeleteLesson={handleConfirmDeleteLesson}
                        onEditSectionButtonRef={el => handleEditSectionButtonRef(section.id, el)}
                        onLessonEditButtonRef={handleLessonEditButtonRef}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Desktop: right rail */}
            <div className="hidden lg:block">
              {sidePanel}
              <GuidancePanel />
            </div>

          </div>
        </>
      )}
    </div>
  );
}
