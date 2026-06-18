import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ChevronRight } from 'lucide-react';
import {
  type AnswerOptionRequestPayload,
  type AnswerOptionResponse,
  type QuestionRequestPayload,
  type QuestionResponse,
  type QuizDetailResponse,
  type QuizFormPayload,
  type QuizResponse,
  type QuizStatus,
  addAnswerOption,
  addQuestionToQuiz,
  archiveInstructorQuiz,
  createInstructorQuiz,
  deleteAnswerOption,
  deleteQuestion as apiDeleteQuestion,
  getInstructorQuizDetail,
  listInstructorQuizzes,
  publishInstructorQuiz,
  updateAnswerOption,
  updateInstructorQuiz,
  updateQuestion as apiUpdateQuestion,
} from '../../../api/instructorQuizzes';
import {
  type InstructorSectionResponse,
  getInstructorCourseContent,
} from '../../../api/instructorCourseContent';
import { Button } from '../../../components/ui/Button';
import { Input, FormField } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
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

function quizBadgeVariant(status: QuizStatus) {
  if (status === 'PUBLISHED') return 'salem' as const;
  if (status === 'ARCHIVED') return 'coral' as const;
  return 'accent' as const;
}

function quizStatusLabel(status: QuizStatus): string {
  if (status === 'PUBLISHED') return 'Published';
  if (status === 'ARCHIVED') return 'Archived';
  return 'Draft';
}

function typeLabel(type: string): string {
  return type === 'TRUE_FALSE' ? 'True / false' : 'Multiple choice';
}

function excerpt(text: string, max = 60): string {
  return text.length <= max ? text : text.slice(0, max) + '…';
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function QuizzesLoadingSkeleton() {
  return (
    <div aria-hidden="true">
      <Bone className="h-4 w-32 mb-4" />
      <Bone className="h-7 w-48 mb-2" />
      <Bone className="h-4 w-72 mb-8" />
      <Bone className="h-4 w-44 mb-8" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3">
          {[0, 1].map(i => (
            <div key={i} className="bg-surface border border-border-default rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <Bone className="h-5 w-48" />
                <Bone className="h-5 w-16 rounded-full" />
              </div>
              <Bone className="h-4 w-40 mb-3" />
              <div className="flex gap-2">
                <Bone className="h-9 w-16 rounded-md" />
                <Bone className="h-9 w-20 rounded-md" />
                <Bone className="h-9 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="bg-surface border border-border-default rounded-lg p-4">
            <Bone className="h-5 w-28 mb-3" />
            <Bone className="h-10 w-full rounded-md mb-3" />
            <Bone className="h-10 w-full rounded-md mb-3" />
            <Bone className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Guidance panel ─────────────────────────────────────────────────────────────

function GuidancePanel() {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-4 mt-4">
      <p className="text-body-sm font-medium text-text-primary mb-1">Publishing requirements</p>
      <p className="text-body-sm text-text-secondary">
        A quiz needs at least one question. Each question needs at least one answer option,
        and one option must be marked correct, before you can publish.
      </p>
    </div>
  );
}

// ── Quiz create / edit panel ───────────────────────────────────────────────────

type QuizFormMode = 'closed' | 'create' | { edit: QuizResponse };

// Inner form — isolated via `key` prop so it remounts when mode switches,
// resetting all local state without needing a sync useEffect.
interface QuizFormInnerProps {
  courseId: number;
  isEditing: boolean;
  quiz: QuizResponse | null;
  sections: InstructorSectionResponse[];
  onClose: () => void;
  onCreated: (quiz: QuizResponse) => void;
  onUpdated: (quiz: QuizResponse) => void;
}

function QuizFormInner({
  courseId,
  isEditing,
  quiz,
  sections,
  onClose,
  onCreated,
  onUpdated,
}: QuizFormInnerProps) {
  // Initialize from props on mount; no sync useEffect needed because the key
  // prop on this component causes a full remount when create ↔ edit switches.
  const [title, setTitle] = useState(quiz?.title ?? '');
  const [description, setDescription] = useState(quiz?.description ?? '');
  const [passingScore, setPassingScore] = useState(quiz ? String(quiz.passingScore) : '70');
  const [sectionId, setSectionId] = useState(
    quiz?.sectionId != null ? String(quiz.sectionId) : '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus on mount — DOM-only side effect, no setState.
  useEffect(() => { titleRef.current?.focus(); }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required.';
    else if (title.trim().length > 150) errs.title = 'Title must not exceed 150 characters.';
    const score = parseInt(passingScore, 10);
    if (!passingScore.trim()) errs.passingScore = 'Passing score is required.';
    else if (isNaN(score) || score < 1 || score > 100)
      errs.passingScore = 'Passing score must be between 1 and 100.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setFormError(null);
    setSubmitting(true);
    const payload: QuizFormPayload = {
      title: title.trim(),
      description: description.trim() || null,
      passingScore: parseInt(passingScore, 10),
      sectionId: sectionId ? parseInt(sectionId, 10) : null,
    };
    try {
      if (isEditing && quiz) {
        const updated = await updateInstructorQuiz(quiz.id, payload);
        onUpdated(updated);
      } else {
        const created = await createInstructorQuiz(courseId, payload);
        onCreated(created);
      }
      onClose();
    } catch {
      setFormError('Could not save quiz. Check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-title-sm font-semibold text-text-primary">
          {isEditing ? 'Edit quiz' : 'Create a quiz'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3">
          <FormField label="Title" htmlFor="quiz-title" error={fieldErrors.title}>
            <Input
              id="quiz-title"
              ref={titleRef}
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: '' }));
              }}
              maxLength={160}
              placeholder="e.g. Module 1 Knowledge Check"
              hasError={!!fieldErrors.title}
              disabled={submitting}
            />
          </FormField>

          <div className="flex flex-col gap-xs">
            <label htmlFor="quiz-description" className="text-body-sm font-medium text-text-secondary">
              Description (optional)
            </label>
            <textarea
              id="quiz-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              disabled={submitting}
              placeholder="Brief overview of this quiz."
              className={cn(
                'w-full bg-surface text-text-primary text-body resize-y',
                'border border-border-default rounded-md py-3 px-4',
                'placeholder:text-text-muted transition-colors duration-fast',
                'focus:outline-none focus:border-salem',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
                submitting && 'bg-surface-elevated text-text-muted cursor-not-allowed',
              )}
            />
          </div>

          <FormField label="Passing score (%)" htmlFor="quiz-passing" error={fieldErrors.passingScore}>
            <Input
              id="quiz-passing"
              type="number"
              min="1"
              max="100"
              value={passingScore}
              onChange={e => {
                setPassingScore(e.target.value);
                if (fieldErrors.passingScore) setFieldErrors(p => ({ ...p, passingScore: '' }));
              }}
              hasError={!!fieldErrors.passingScore}
              disabled={submitting}
            />
          </FormField>

          {sections.length > 0 && (
            <div className="flex flex-col gap-xs">
              <label htmlFor="quiz-section" className="text-body-sm font-medium text-text-secondary">
                Section (optional)
              </label>
              <select
                id="quiz-section"
                value={sectionId}
                onChange={e => setSectionId(e.target.value)}
                disabled={submitting}
                className={cn(
                  'w-full bg-surface text-text-primary text-body',
                  'border border-border-default rounded-md py-3 px-4',
                  'focus:outline-none focus:border-salem',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
                  submitting && 'bg-surface-elevated text-text-muted cursor-not-allowed',
                )}
              >
                <option value="">Course-wide (no section)</option>
                {sections.map(s => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formError && (
            <p className="text-body-sm text-error" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" size="md" loading={submitting}>
            {isEditing ? 'Save changes' : 'Create quiz'}
          </Button>
        </div>
      </form>
    </>
  );
}

interface CreateEditQuizPanelProps {
  courseId: number;
  mode: QuizFormMode;
  sections: InstructorSectionResponse[];
  onOpen: () => void;
  onClose: () => void;
  onCreated: (quiz: QuizResponse) => void;
  onUpdated: (quiz: QuizResponse) => void;
}

function CreateEditQuizPanel({
  courseId,
  mode,
  sections,
  onOpen,
  onClose,
  onCreated,
  onUpdated,
}: CreateEditQuizPanelProps) {
  if (mode === 'closed') {
    return (
      <div className="bg-surface border border-border-default rounded-lg p-4">
        <h2 className="text-title-sm font-semibold text-text-primary mb-1">Create a quiz</h2>
        <p className="text-body-sm text-text-secondary mb-3">
          Add an assessment to test learners after studying this course.
        </p>
        <Button variant="primary" size="sm" onClick={onOpen} className="w-full">
          Create quiz
        </Button>
      </div>
    );
  }

  const isEditing = typeof mode === 'object';
  const quiz = isEditing ? (mode as { edit: QuizResponse }).edit : null;

  return (
    <div className="bg-surface border border-border-default rounded-lg p-4">
      <QuizFormInner
        key={isEditing ? `edit-${quiz!.id}` : 'create'}
        courseId={courseId}
        isEditing={isEditing}
        quiz={quiz}
        sections={sections}
        onClose={onClose}
        onCreated={onCreated}
        onUpdated={onUpdated}
      />
    </div>
  );
}

// ── Add option form (inline, beneath a question) ───────────────────────────────

interface AddOptionFormProps {
  questionId: number;
  questionContent: string;
  onAdded: (option: AnswerOptionResponse) => void;
  onClose: () => void;
}

function AddOptionForm({ questionId, questionContent, onAdded, onClose }: AddOptionFormProps) {
  const [optionText, setOptionText] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!optionText.trim()) { setTextError('Option text is required.'); return; }
    setTextError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      const opt = await addAnswerOption(questionId, { optionText: optionText.trim(), isCorrect });
      onAdded(opt);
      setOptionText('');
      setIsCorrect(false);
      inputRef.current?.focus();
    } catch {
      setFormError('Could not add option. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="pt-2 mt-2 border-t border-border-default">
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-1 min-w-0">
          <Input
            ref={inputRef}
            value={optionText}
            onChange={e => { setOptionText(e.target.value); if (textError) setTextError(null); }}
            placeholder="Option text"
            hasError={!!textError}
            disabled={submitting}
            aria-label={`New option for: ${questionContent}`}
          />
          {textError && <p className="text-body-sm text-error mt-1" role="alert">{textError}</p>}
        </div>
        <label className="flex items-center gap-1.5 text-body-sm text-text-secondary min-h-[44px] px-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isCorrect}
            onChange={e => setIsCorrect(e.target.checked)}
            disabled={submitting}
            className="accent-salem"
          />
          Mark as correct
        </label>
      </div>
      {formError && <p className="text-body-sm text-error mt-1" role="alert">{formError}</p>}
      <div className="flex gap-2 mt-2">
        <Button type="submit" variant="secondary" size="sm" loading={submitting}>
          Add option
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Edit option form ───────────────────────────────────────────────────────────

interface EditOptionFormProps {
  option: AnswerOptionResponse;
  questionContent: string;
  isPending: boolean;
  onSave: (payload: AnswerOptionRequestPayload) => void;
  onCancel: () => void;
}

function EditOptionForm({ option, questionContent, isPending, onSave, onCancel }: EditOptionFormProps) {
  const [optionText, setOptionText] = useState(option.optionText);
  const [isCorrect, setIsCorrect] = useState(option.isCorrect);
  const [textError, setTextError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!optionText.trim()) { setTextError('Option text is required.'); return; }
    setTextError(null);
    onSave({ optionText: optionText.trim(), isCorrect });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-wrap items-start gap-2 py-1">
      <div className="flex-1 min-w-0">
        <Input
          ref={inputRef}
          value={optionText}
          onChange={e => { setOptionText(e.target.value); if (textError) setTextError(null); }}
          hasError={!!textError}
          disabled={isPending}
          aria-label={`Edit option for: ${questionContent}`}
        />
        {textError && <p className="text-body-sm text-error mt-1" role="alert">{textError}</p>}
      </div>
      <label className="flex items-center gap-1.5 text-body-sm text-text-secondary min-h-[44px] px-1 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isCorrect}
          onChange={e => setIsCorrect(e.target.checked)}
          disabled={isPending}
          className="accent-salem"
        />
        Correct
      </label>
      <div className="flex gap-2 flex-shrink-0 pt-px">
        <Button type="submit" variant="secondary" size="sm" loading={isPending}>
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Option row ────────────────────────────────────────────────────────────────

interface OptionRowProps {
  option: AnswerOptionResponse;
  questionContent: string;
  isEditing: boolean;
  isDeleting: boolean;
  isPending: boolean;
  rowError: string | null;
  isArchived: boolean;
  onEdit: () => void;
  onSave: (payload: AnswerOptionRequestPayload) => void;
  onCancelEdit: () => void;
  onDeleteClick: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onToggleCorrect: () => void;
  onEditButtonRef: (el: HTMLButtonElement | null) => void;
}

function OptionRow({
  option,
  questionContent,
  isEditing,
  isDeleting,
  isPending,
  rowError,
  isArchived,
  onEdit,
  onSave,
  onCancelEdit,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
  onToggleCorrect,
  onEditButtonRef,
}: OptionRowProps) {
  return (
    <li aria-live="polite" aria-atomic="true" className="border-t border-border-default">
      {isEditing ? (
        <div className="px-2 py-1">
          <EditOptionForm
            option={option}
            questionContent={questionContent}
            isPending={isPending}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        </div>
      ) : isDeleting ? (
        <div className="px-2 py-2 flex flex-wrap items-center justify-between gap-2 min-h-[44px]">
          <span className="text-caption text-text-secondary select-none">Delete this option?</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancelDelete} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={isPending}
              onClick={onConfirmDelete}
              aria-label={`Confirm delete option: ${excerpt(option.optionText)}`}
            >
              Delete option
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-2 py-2 flex items-start justify-between gap-2 min-h-[44px]">
            <div className="flex-1 min-w-0">
              <span className="text-body-sm text-text-primary line-clamp-2">{option.optionText}</span>
              {option.isCorrect && (
                <span className="inline-flex items-center gap-1 text-caption text-salem mt-0.5">
                  <Check size={12} aria-hidden="true" />
                  Correct
                </span>
              )}
            </div>
            {!isArchived && (
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCorrect}
                  disabled={isPending}
                  aria-label={
                    option.isCorrect
                      ? `Unmark option as correct: ${excerpt(option.optionText)}`
                      : `Mark option as correct: ${excerpt(option.optionText)}`
                  }
                >
                  {option.isCorrect ? 'Unmark' : 'Mark correct'}
                </Button>
                <Button
                  ref={onEditButtonRef}
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  disabled={isPending}
                  aria-label={`Edit option: ${excerpt(option.optionText)}`}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeleteClick}
                  disabled={isPending}
                  aria-label={`Delete option: ${excerpt(option.optionText)}`}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
          {rowError && (
            <p className="px-2 pb-2 text-caption text-error" role="alert">{rowError}</p>
          )}
        </>
      )}
    </li>
  );
}

// ── Add question form (inline, at the bottom of the question list) ─────────────

interface AddQuestionFormProps {
  quizId: number;
  quizTitle: string;
  onAdded: (question: QuestionResponse) => void;
  onClose: () => void;
}

function AddQuestionForm({ quizId, quizTitle, onAdded, onClose }: AddQuestionFormProps) {
  const [content, setContent] = useState('');
  const [points, setPoints] = useState('1');
  const [type, setType] = useState<'MULTIPLE_CHOICE' | 'TRUE_FALSE'>('MULTIPLE_CHOICE');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { contentRef.current?.focus(); }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!content.trim()) errs.content = 'Question text is required.';
    const pts = parseInt(points, 10);
    if (!points.trim() || isNaN(pts) || pts < 1) errs.points = 'Points must be at least 1.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const q = await addQuestionToQuiz(quizId, {
        content: content.trim(),
        points: parseInt(points, 10),
        type,
      });
      onAdded(q);
      setContent('');
      setPoints('1');
      setFieldErrors({});
      contentRef.current?.focus();
    } catch (err) {
      setFormError(
        isHttpStatus(err, 400)
          ? 'This quiz is archived and can no longer be edited.'
          : 'Could not add question. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <li className="border-t border-border-default">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="px-2 py-3 flex flex-col gap-3"
        aria-label={`Add question to quiz: ${quizTitle}`}
      >
        <div className="flex flex-col gap-xs">
          <label htmlFor="new-q-content" className="text-body-sm font-medium text-text-secondary">
            Question
          </label>
          <textarea
            id="new-q-content"
            ref={contentRef}
            value={content}
            onChange={e => { setContent(e.target.value); if (fieldErrors.content) setFieldErrors(p => ({ ...p, content: '' })); }}
            rows={2}
            disabled={submitting}
            placeholder="Enter the question text"
            aria-invalid={!!fieldErrors.content}
            className={cn(
              'w-full bg-surface text-text-primary text-body resize-y',
              'border border-border-default rounded-md py-2 px-3',
              'placeholder:text-text-muted transition-colors duration-fast',
              'focus:outline-none focus:border-salem',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
              fieldErrors.content && 'border-error focus:border-error focus-visible:outline-error',
              submitting && 'bg-surface-elevated text-text-muted cursor-not-allowed',
            )}
          />
          {fieldErrors.content && (
            <p className="text-body-sm text-error" role="alert">{fieldErrors.content}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-xs w-24">
            <label htmlFor="new-q-points" className="text-body-sm font-medium text-text-secondary">
              Points
            </label>
            <Input
              id="new-q-points"
              type="number"
              min="1"
              value={points}
              onChange={e => { setPoints(e.target.value); if (fieldErrors.points) setFieldErrors(p => ({ ...p, points: '' })); }}
              hasError={!!fieldErrors.points}
              disabled={submitting}
            />
            {fieldErrors.points && (
              <p className="text-body-sm text-error" role="alert">{fieldErrors.points}</p>
            )}
          </div>

          <div className="flex flex-col gap-xs flex-1 min-w-[140px]">
            <label htmlFor="new-q-type" className="text-body-sm font-medium text-text-secondary">
              Type
            </label>
            <select
              id="new-q-type"
              value={type}
              onChange={e => setType(e.target.value as typeof type)}
              disabled={submitting}
              className={cn(
                'w-full bg-surface text-text-primary text-body',
                'border border-border-default rounded-md py-3 px-3',
                'focus:outline-none focus:border-salem',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
                submitting && 'bg-surface-elevated text-text-muted cursor-not-allowed',
              )}
            >
              <option value="MULTIPLE_CHOICE">Multiple choice</option>
              <option value="TRUE_FALSE">True / false</option>
            </select>
          </div>
        </div>

        {formError && <p className="text-body-sm text-error" role="alert">{formError}</p>}

        <div className="flex gap-2">
          <Button type="submit" variant="secondary" size="sm" loading={submitting}>
            Add question
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </li>
  );
}

// ── Edit question form ─────────────────────────────────────────────────────────

interface EditQuestionFormProps {
  question: QuestionResponse;
  isPending: boolean;
  onSave: (payload: QuestionRequestPayload) => void;
  onCancel: () => void;
}

function EditQuestionForm({ question, isPending, onSave, onCancel }: EditQuestionFormProps) {
  const [content, setContent] = useState(question.content);
  const [points, setPoints] = useState(String(question.points));
  const [type, setType] = useState(question.type);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { contentRef.current?.focus(); }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!content.trim()) errs.content = 'Question text is required.';
    const pts = parseInt(points, 10);
    if (!points.trim() || isNaN(pts) || pts < 1) errs.points = 'Points must be at least 1.';
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    onSave({ content: content.trim(), points: parseInt(points, 10), type });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 py-2">
      <div className="flex flex-col gap-xs">
        <label htmlFor={`edit-q-${question.id}`} className="text-body-sm font-medium text-text-secondary">
          Question
        </label>
        <textarea
          id={`edit-q-${question.id}`}
          ref={contentRef}
          value={content}
          onChange={e => { setContent(e.target.value); if (fieldErrors.content) setFieldErrors(p => ({ ...p, content: '' })); }}
          rows={2}
          disabled={isPending}
          aria-invalid={!!fieldErrors.content}
          className={cn(
            'w-full bg-surface text-text-primary text-body resize-y',
            'border border-border-default rounded-md py-2 px-3',
            'focus:outline-none focus:border-salem',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
            fieldErrors.content && 'border-error',
            isPending && 'bg-surface-elevated text-text-muted cursor-not-allowed',
          )}
        />
        {fieldErrors.content && <p className="text-body-sm text-error" role="alert">{fieldErrors.content}</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-24 flex flex-col gap-xs">
          <label htmlFor={`edit-q-pts-${question.id}`} className="text-body-sm font-medium text-text-secondary">
            Points
          </label>
          <Input
            id={`edit-q-pts-${question.id}`}
            type="number"
            min="1"
            value={points}
            onChange={e => { setPoints(e.target.value); if (fieldErrors.points) setFieldErrors(p => ({ ...p, points: '' })); }}
            hasError={!!fieldErrors.points}
            disabled={isPending}
          />
          {fieldErrors.points && <p className="text-body-sm text-error" role="alert">{fieldErrors.points}</p>}
        </div>

        <div className="flex-1 min-w-[140px] flex flex-col gap-xs">
          <label htmlFor={`edit-q-type-${question.id}`} className="text-body-sm font-medium text-text-secondary">
            Type
          </label>
          <select
            id={`edit-q-type-${question.id}`}
            value={type}
            onChange={e => setType(e.target.value as typeof type)}
            disabled={isPending}
            className={cn(
              'w-full bg-surface text-text-primary text-body',
              'border border-border-default rounded-md py-3 px-3',
              'focus:outline-none focus:border-salem',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
              isPending && 'bg-surface-elevated text-text-muted cursor-not-allowed',
            )}
          >
            <option value="MULTIPLE_CHOICE">Multiple choice</option>
            <option value="TRUE_FALSE">True / false</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="secondary" size="sm" loading={isPending}>
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Quiz editor (expanded; owns question/option state) ─────────────────────────

interface QuizEditorProps {
  quizId: number;
  quizTitle: string;
  isArchived: boolean;
  detail: QuizDetailResponse | null;
  loading: boolean;
  error: 'none' | 'notFound' | 'generic';
  onDetailUpdate: (updater: (prev: QuizDetailResponse) => QuizDetailResponse) => void;
  onRetryDetail: () => void;
}

function QuizEditor({
  quizId,
  quizTitle,
  isArchived,
  detail,
  loading,
  error,
  onDetailUpdate,
  onRetryDetail,
}: QuizEditorProps) {
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);
  const [addingOptionQuestionId, setAddingOptionQuestionId] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [deletingOptionId, setDeletingOptionId] = useState<number | null>(null);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const addQuestionBtnRef = useRef<HTMLButtonElement>(null);
  const questionEditBtnRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());
  const optionEditBtnRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());

  function addPending(key: string) {
    setPendingIds(prev => { const n = new Set(prev); n.add(key); return n; });
  }
  function removePending(key: string) {
    setPendingIds(prev => { const n = new Set(prev); n.delete(key); return n; });
  }
  function setRowError(key: string, msg: string) {
    setRowErrors(prev => ({ ...prev, [key]: msg }));
  }
  function clearRowError(key: string) {
    setRowErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  // ── Question mutations ───────────────────────────────────────────────────────

  async function handleSaveQuestion(questionId: number, payload: QuestionRequestPayload) {
    const key = `question:${questionId}`;
    addPending(key);
    clearRowError(key);
    try {
      const updated = await apiUpdateQuestion(questionId, payload);
      onDetailUpdate(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q.id === questionId ? { ...updated, answerOptions: q.answerOptions } : q,
        ),
      }));
      setEditingQuestionId(null);
      setTimeout(() => questionEditBtnRefs.current.get(questionId)?.focus(), 0);
    } catch {
      setEditingQuestionId(null);
      setRowError(key, 'Could not save question. Try again.');
    } finally {
      removePending(key);
    }
  }

  async function handleConfirmDeleteQuestion(questionId: number) {
    const key = `question:${questionId}`;
    addPending(key);
    clearRowError(key);
    try {
      await apiDeleteQuestion(questionId);
      onDetailUpdate(prev => ({
        ...prev,
        questions: prev.questions.filter(q => q.id !== questionId),
      }));
      setDeletingQuestionId(null);
      setTimeout(() => {
        if (addingQuestion) return;
        addQuestionBtnRef.current?.focus();
      }, 0);
    } catch {
      setDeletingQuestionId(null);
      setRowError(key, 'Could not delete question. Try again.');
    } finally {
      removePending(key);
    }
  }

  // ── Option mutations ─────────────────────────────────────────────────────────

  async function handleSaveOption(optionId: number, questionId: number, payload: AnswerOptionRequestPayload) {
    const key = `option:${optionId}`;
    addPending(key);
    clearRowError(key);
    try {
      const updated = await updateAnswerOption(optionId, payload);
      onDetailUpdate(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q.id === questionId
            ? { ...q, answerOptions: q.answerOptions.map(o => (o.id === optionId ? updated : o)) }
            : q,
        ),
      }));
      setEditingOptionId(null);
      setTimeout(() => optionEditBtnRefs.current.get(optionId)?.focus(), 0);
    } catch {
      setEditingOptionId(null);
      setRowError(key, 'Could not save option. Try again.');
    } finally {
      removePending(key);
    }
  }

  async function handleToggleCorrect(option: AnswerOptionResponse, questionId: number) {
    const key = `option:${option.id}`;
    addPending(key);
    clearRowError(key);
    try {
      const updated = await updateAnswerOption(option.id, {
        optionText: option.optionText,
        isCorrect: !option.isCorrect,
      });
      onDetailUpdate(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q.id === questionId
            ? { ...q, answerOptions: q.answerOptions.map(o => (o.id === option.id ? updated : o)) }
            : q,
        ),
      }));
    } catch {
      setRowError(key, 'Could not update option. Try again.');
    } finally {
      removePending(key);
    }
  }

  async function handleConfirmDeleteOption(optionId: number, questionId: number) {
    const key = `option:${optionId}`;
    addPending(key);
    clearRowError(key);
    try {
      await deleteAnswerOption(optionId);
      onDetailUpdate(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q.id === questionId
            ? { ...q, answerOptions: q.answerOptions.filter(o => o.id !== optionId) }
            : q,
        ),
      }));
      setDeletingOptionId(null);
    } catch {
      setDeletingOptionId(null);
      setRowError(key, 'Could not delete option. Try again.');
    } finally {
      removePending(key);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-2 pt-1">
        <Bone className="h-4 w-3/4" />
        <Bone className="h-4 w-1/2" />
        <Bone className="h-4 w-2/3" />
      </div>
    );
  }

  if (error !== 'none') {
    return (
      <div className="text-body-sm text-text-secondary py-2">
        {error === 'notFound'
          ? 'This quiz could not be found.'
          : 'Could not load questions.'}
        {error === 'generic' && (
          <button
            type="button"
            onClick={onRetryDetail}
            className="ml-2 text-salem font-medium underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div>
      {detail.questions.length === 0 && !addingQuestion && (
        <p className="text-body-sm text-text-muted py-2">
          No questions yet.
          {!isArchived && ' Add a question to get started.'}
        </p>
      )}

      <ul className="flex flex-col gap-2" aria-label={`Questions in quiz: ${quizTitle}`}>
        {detail.questions.map(question => {
          const qKey = `question:${question.id}`;
          const qPending = pendingIds.has(qKey);
          const qError = rowErrors[qKey] ?? null;
          const isQEditing = editingQuestionId === question.id;
          const isQDeleting = deletingQuestionId === question.id;
          const isAddingOptionHere = addingOptionQuestionId === question.id;

          const hasNoOptions = question.answerOptions.length === 0;
          const hasNoCorrectOption =
            !hasNoOptions && question.answerOptions.every(o => !o.isCorrect);

          return (
            <li
              key={question.id}
              className="bg-surface-elevated border border-border-default rounded-md"
              aria-live="polite"
              aria-atomic="true"
            >
              {/* Question header */}
              <div className="p-3">
                {isQEditing ? (
                  <EditQuestionForm
                    question={question}
                    isPending={qPending}
                    onSave={payload => handleSaveQuestion(question.id, payload)}
                    onCancel={() => setEditingQuestionId(null)}
                  />
                ) : isQDeleting ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 min-h-[44px]">
                    <span className="text-caption text-text-secondary select-none">
                      Delete this question and its options?
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingQuestionId(null)}
                        disabled={qPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        loading={qPending}
                        onClick={() => handleConfirmDeleteQuestion(question.id)}
                        aria-label={`Confirm delete question: ${excerpt(question.content)}`}
                      >
                        Delete question
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-body-sm text-text-primary line-clamp-2 flex-1 min-w-0">
                        {question.content}
                      </p>
                      {!isArchived && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAddingOptionQuestionId(
                                isAddingOptionHere ? null : question.id,
                              );
                              setEditingOptionId(null);
                            }}
                            disabled={qPending}
                            aria-label={`Add option to question: ${excerpt(question.content)}`}
                          >
                            Add option
                          </Button>
                          <Button
                            ref={el => { questionEditBtnRefs.current.set(question.id, el); }}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingQuestionId(question.id);
                              setDeletingQuestionId(null);
                              setAddingOptionQuestionId(null);
                              setEditingOptionId(null);
                            }}
                            disabled={qPending}
                            aria-label={`Edit question: ${excerpt(question.content)}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingQuestionId(question.id);
                              setEditingQuestionId(null);
                            }}
                            disabled={qPending}
                            aria-label={`Delete question: ${excerpt(question.content)}`}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-caption text-text-muted">
                      {pluralize(question.points, 'point', 'points')} · {typeLabel(question.type)}
                    </p>
                  </>
                )}
                {qError && !isQEditing && !isQDeleting && (
                  <p className="text-caption text-error mt-1" role="alert">{qError}</p>
                )}
              </div>

              {/* Option list */}
              {question.answerOptions.length > 0 && (
                <ul aria-label={`Options for: ${excerpt(question.content, 40)}`}>
                  {question.answerOptions.map(option => {
                    const oKey = `option:${option.id}`;
                    return (
                      <OptionRow
                        key={option.id}
                        option={option}
                        questionContent={question.content}
                        isEditing={editingOptionId === option.id}
                        isDeleting={deletingOptionId === option.id}
                        isPending={pendingIds.has(oKey)}
                        rowError={rowErrors[oKey] ?? null}
                        isArchived={isArchived}
                        onEdit={() => {
                          setEditingOptionId(option.id);
                          setDeletingOptionId(null);
                          setAddingOptionQuestionId(null);
                        }}
                        onSave={payload => handleSaveOption(option.id, question.id, payload)}
                        onCancelEdit={() => {
                          setEditingOptionId(null);
                          setTimeout(() => optionEditBtnRefs.current.get(option.id)?.focus(), 0);
                        }}
                        onDeleteClick={() => {
                          setDeletingOptionId(option.id);
                          setEditingOptionId(null);
                        }}
                        onCancelDelete={() => setDeletingOptionId(null)}
                        onConfirmDelete={() => handleConfirmDeleteOption(option.id, question.id)}
                        onToggleCorrect={() => handleToggleCorrect(option, question.id)}
                        onEditButtonRef={el => { optionEditBtnRefs.current.set(option.id, el); }}
                      />
                    );
                  })}
                </ul>
              )}

              {/* Add option form */}
              {!isArchived && isAddingOptionHere && (
                <div className="px-3 pb-3">
                  <AddOptionForm
                    questionId={question.id}
                    questionContent={question.content}
                    onAdded={opt => {
                      onDetailUpdate(prev => ({
                        ...prev,
                        questions: prev.questions.map(q =>
                          q.id === question.id
                            ? { ...q, answerOptions: [...q.answerOptions, opt] }
                            : q,
                        ),
                      }));
                    }}
                    onClose={() => setAddingOptionQuestionId(null)}
                  />
                </div>
              )}

              {/* Advisory hints (client-side mirror of publish rules) */}
              {!isArchived && !isQEditing && !isQDeleting && (
                <>
                  {hasNoOptions && (
                    <p className="px-3 pb-2 text-caption text-text-muted">
                      Add at least one option, and mark one correct, before publishing.
                    </p>
                  )}
                  {hasNoCorrectOption && (
                    <p className="px-3 pb-2 text-caption text-text-muted">
                      Mark one option as the correct answer before publishing.
                    </p>
                  )}
                </>
              )}
            </li>
          );
        })}

        {!isArchived && addingQuestion && (
          <AddQuestionForm
            quizId={quizId}
            quizTitle={quizTitle}
            onAdded={q => {
              onDetailUpdate(prev => ({
                ...prev,
                questions: [...prev.questions, q],
              }));
            }}
            onClose={() => {
              setAddingQuestion(false);
              setTimeout(() => addQuestionBtnRef.current?.focus(), 0);
            }}
          />
        )}
      </ul>

      {!isArchived && !addingQuestion && (
        <div className="mt-3">
          <Button
            ref={addQuestionBtnRef}
            variant="secondary"
            size="sm"
            onClick={() => {
              setAddingQuestion(true);
              setEditingQuestionId(null);
              setDeletingQuestionId(null);
              setAddingOptionQuestionId(null);
              setEditingOptionId(null);
            }}
            aria-label={`Add question to quiz: ${quizTitle}`}
          >
            Add question
          </Button>
        </div>
      )}

      {isArchived && (
        <p className="text-caption text-text-muted mt-3">
          This quiz is archived and is read-only.
        </p>
      )}
    </div>
  );
}

// ── Quiz card ──────────────────────────────────────────────────────────────────

interface QuizCardProps {
  quiz: QuizResponse;
  sections: InstructorSectionResponse[];
  isExpanded: boolean;
  detail: QuizDetailResponse | null;
  detailLoading: boolean;
  detailError: 'none' | 'notFound' | 'generic';
  isArchiving: boolean;
  isPending: boolean;
  publishError: string | null;
  archiveError: string | null;
  onToggleExpand: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onArchiveClick: () => void;
  onArchiveCancel: () => void;
  onArchiveConfirm: () => void;
  onDetailUpdate: (updater: (prev: QuizDetailResponse) => QuizDetailResponse) => void;
  onRetryDetail: () => void;
  onEditButtonRef: (el: HTMLButtonElement | null) => void;
}

function QuizCard({
  quiz,
  sections,
  isExpanded,
  detail,
  detailLoading,
  detailError,
  isArchiving,
  isPending,
  publishError,
  archiveError,
  onToggleExpand,
  onEdit,
  onPublish,
  onArchiveClick,
  onArchiveCancel,
  onArchiveConfirm,
  onDetailUpdate,
  onRetryDetail,
  onEditButtonRef,
}: QuizCardProps) {
  const isArchived = quiz.status === 'ARCHIVED';
  const isDraft = quiz.status === 'DRAFT';

  const sectionLabel = quiz.sectionId !== null
    ? (sections.find(s => s.id === quiz.sectionId)?.title ?? 'Section attached')
    : 'Course-wide';

  return (
    <article className="bg-surface border border-border-default rounded-lg p-4">
      <div aria-live="polite" aria-atomic="true">
        {isArchiving ? (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-h-[44px]">
            <span className="text-caption text-text-secondary select-none">Archive this quiz?</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onArchiveCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={isPending}
                onClick={onArchiveConfirm}
                aria-label={`Confirm archive quiz: ${quiz.title}`}
              >
                Archive quiz
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header row: title + badge + expand toggle */}
            <div className="flex items-start gap-3 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-title-sm font-semibold text-text-primary line-clamp-2">
                    {quiz.title}
                  </h2>
                  <Badge variant={quizBadgeVariant(quiz.status)}>
                    {quizStatusLabel(quiz.status)}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleExpand}
                aria-label={isExpanded ? `Collapse quiz: ${quiz.title}` : `Expand quiz: ${quiz.title}`}
                aria-expanded={isExpanded}
                className={cn(
                  'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md',
                  'text-text-muted hover:text-text-secondary hover:bg-surface-elevated',
                  'transition-colors duration-fast',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
                )}
              >
                {isExpanded
                  ? <ChevronDown size={16} aria-hidden="true" />
                  : <ChevronRight size={16} aria-hidden="true" />}
              </button>
            </div>

            {/* Meta line */}
            <p className="text-caption text-text-muted mb-3">
              Pass: {quiz.passingScore}% · {sectionLabel}
            </p>

            {/* Action row */}
            {!isArchived && (
              <div className="flex flex-wrap gap-2">
                <Button
                  ref={onEditButtonRef}
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  disabled={isPending}
                  aria-label={`Edit quiz: ${quiz.title}`}
                >
                  Edit
                </Button>
                {isDraft && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={isPending}
                    onClick={onPublish}
                    aria-label={`Publish quiz: ${quiz.title}`}
                  >
                    Publish
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onArchiveClick}
                  disabled={isPending}
                  aria-label={`Archive quiz: ${quiz.title}`}
                >
                  Archive
                </Button>
              </div>
            )}
          </>
        )}

        {publishError && (
          <p className="text-body-sm text-error mt-2" role="alert">{publishError}</p>
        )}
        {archiveError && (
          <p className="text-body-sm text-error mt-2" role="alert">{archiveError}</p>
        )}
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="border-t border-border-default pt-3 mt-3">
          <QuizEditor
            quizId={quiz.id}
            quizTitle={quiz.title}
            isArchived={isArchived}
            detail={detail}
            loading={detailLoading}
            error={detailError}
            onDetailUpdate={onDetailUpdate}
            onRetryDetail={onRetryDetail}
          />
        </div>
      )}
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstructorQuizzesPage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>();
  const parsedCourseId = Number(courseIdParam);
  const isInvalidId = !courseIdParam || isNaN(parsedCourseId);
  const courseId = isInvalidId ? 0 : parsedCourseId;

  // ── Quiz list state ──────────────────────────────────────────────────────────
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(!isInvalidId);
  const [listError, setListError] = useState<'none' | 'notFound' | 'generic'>('none');
  const [listTick, setListTick] = useState(0);

  // ── Detail (expanded quiz) state ─────────────────────────────────────────────
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [quizDetail, setQuizDetail] = useState<QuizDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<'none' | 'notFound' | 'generic'>('none');
  const [detailTick, setDetailTick] = useState(0);

  // ── Quiz form ────────────────────────────────────────────────────────────────
  const [quizFormMode, setQuizFormMode] = useState<QuizFormMode>('closed');

  // ── Quiz-level actions ───────────────────────────────────────────────────────
  const [archivingQuizId, setArchivingQuizId] = useState<number | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  // ── Sections (for optional form selector) ───────────────────────────────────
  const [sections, setSections] = useState<InstructorSectionResponse[]>([]);

  // ── Focus management refs ────────────────────────────────────────────────────
  const editQuizButtonRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());

  // ── Data loading: quiz list + sections ──────────────────────────────────────

  useEffect(() => {
    if (isInvalidId) return;
    let cancelled = false;
    // loading=true, listError='none', and quizzes=[] are pre-set by useState
    // (initial load) or by handleListRetry (retry). Do not set them here.

    Promise.all([
      listInstructorQuizzes(courseId),
      getInstructorCourseContent(courseId).catch(() => null),
    ]).then(([quizList, content]) => {
      if (cancelled) return;
      setQuizzes(quizList);
      if (content) setSections(content.sections);
      setLoading(false);
    }).catch(err => {
      if (cancelled) return;
      setListError(isHttpStatus(err, 404) ? 'notFound' : 'generic');
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [courseId, listTick, isInvalidId]);

  // ── Data loading: quiz detail (on expand) ────────────────────────────────────

  useEffect(() => {
    // When collapsed, state is already reset by handleToggleExpand (not here).
    if (expandedQuizId === null) return;
    let cancelled = false;
    // detailLoading=true, detailError='none', and quizDetail=null are pre-set
    // by handleToggleExpand (expand) or by the retry handler. Do not set here.

    getInstructorQuizDetail(expandedQuizId)
      .then(data => {
        if (!cancelled) {
          setQuizDetail(data);
          setDetailLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setDetailLoading(false);
          if (isHttpStatus(err, 404)) {
            setDetailError('notFound');
            setQuizzes(prev => prev.filter(q => q.id !== expandedQuizId));
            setExpandedQuizId(null);
          } else {
            setDetailError('generic');
          }
        }
      });

    return () => { cancelled = true; };
  }, [expandedQuizId, detailTick]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function addPending(key: string) {
    setPendingIds(prev => { const n = new Set(prev); n.add(key); return n; });
  }
  function removePending(key: string) {
    setPendingIds(prev => { const n = new Set(prev); n.delete(key); return n; });
  }
  function setRowError(key: string, msg: string) {
    setRowErrors(prev => ({ ...prev, [key]: msg }));
  }
  function clearRowError(key: string) {
    setRowErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function handleListRetry() {
    setLoading(true);
    setListError('none');
    setQuizzes([]);
    setListTick(t => t + 1);
  }

  function handleToggleExpand(quizId: number) {
    if (expandedQuizId === quizId) {
      // Collapsing: reset detail state here (not in the effect).
      setExpandedQuizId(null);
      setQuizDetail(null);
      setDetailLoading(false);
      setDetailError('none');
    } else {
      // Expanding: pre-set loading state here so the effect finds it ready.
      setExpandedQuizId(quizId);
      setQuizDetail(null);
      setDetailLoading(true);
      setDetailError('none');
    }
  }

  // ── Quiz mutations ───────────────────────────────────────────────────────────

  const handleQuizCreated = useCallback((quiz: QuizResponse) => {
    setQuizzes(prev => [...prev, quiz]);
    setQuizFormMode('closed');
  }, []);

  const handleQuizUpdated = useCallback((quiz: QuizResponse) => {
    setQuizzes(prev => prev.map(q => (q.id === quiz.id ? quiz : q)));
    setQuizFormMode('closed');
    setTimeout(() => editQuizButtonRefs.current.get(quiz.id)?.focus(), 0);
  }, []);

  async function handlePublish(quizId: number) {
    const key = `quiz:${quizId}`;
    addPending(key);
    clearRowError(key);
    try {
      const updated = await publishInstructorQuiz(quizId);
      setQuizzes(prev => prev.map(q => (q.id === quizId ? updated : q)));
    } catch (err) {
      const raw = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      let friendly = 'Could not publish quiz. Try again.';
      if (raw.includes('no questions')) {
        friendly = 'Add at least one question before publishing this quiz.';
      } else if (raw.includes('no answer options')) {
        friendly = 'Every question needs at least one answer option before you can publish.';
      } else if (raw.includes('isCorrect')) {
        friendly = 'Every question needs one option marked correct before you can publish.';
      }
      setRowError(key, friendly);
    } finally {
      removePending(key);
    }
  }

  async function handleArchiveConfirm(quizId: number) {
    const key = `quiz:${quizId}`;
    addPending(key);
    clearRowError(key);
    try {
      const updated = await archiveInstructorQuiz(quizId);
      setQuizzes(prev => prev.map(q => (q.id === quizId ? updated : q)));
      setArchivingQuizId(null);
      if (expandedQuizId === quizId) {
        // keep expanded so instructor can see it's now read-only
      }
    } catch {
      setArchivingQuizId(null);
      setRowError(key, 'Could not archive quiz. Try again.');
    } finally {
      removePending(key);
    }
  }

  // ── Derived counts ────────────────────────────────────────────────────────────

  const totalQuizzes = quizzes.length;
  const publishedCount = quizzes.filter(q => q.status === 'PUBLISHED').length;
  const draftCount = quizzes.filter(q => q.status === 'DRAFT').length;
  const archivedCount = quizzes.filter(q => q.status === 'ARCHIVED').length;

  // ── Callback refs ─────────────────────────────────────────────────────────────

  const handleEditQuizButtonRef = useCallback(
    (quizId: number, el: HTMLButtonElement | null) => {
      editQuizButtonRefs.current.set(quizId, el);
    },
    [],
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-8 py-8 pb-14 max-w-container mx-auto">
        <QuizzesLoadingSkeleton />
      </div>
    );
  }

  const isNotFound = isInvalidId || listError === 'notFound';
  const isGenericError = !isInvalidId && listError === 'generic';

  const sidePanel = (
    <CreateEditQuizPanel
      courseId={courseId}
      mode={quizFormMode}
      sections={sections}
      onOpen={() => setQuizFormMode('create')}
      onClose={() => setQuizFormMode('closed')}
      onCreated={handleQuizCreated}
      onUpdated={handleQuizUpdated}
    />
  );

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* Back link */}
      <Link
        to={`/instructor/courses/${courseId}/content`}
        className={cn(
          'inline-flex items-center gap-1 text-body-sm text-text-secondary font-medium mb-4',
          'hover:text-text-primary motion-safe:transition-colors duration-fast',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
        )}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to course content
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Quizzes</h1>
        {!isNotFound && !isGenericError && (
          <p className="text-body-sm text-text-secondary mt-1">
            Create and manage assessments for this course.
          </p>
        )}
      </div>

      {/* Not-found state */}
      {isNotFound && !isGenericError && (
        <>
          <StatePanel
            title="Course not found"
            message="This course does not exist, or you do not have access to it."
          />
          <Link
            to="/instructor/courses"
            className="inline-flex items-center gap-1 text-body-sm text-salem font-medium mt-4 min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm"
          >
            Back to teaching courses
          </Link>
        </>
      )}

      {/* Generic error state */}
      {isGenericError && (
        <StatePanel
          title="We could not load quizzes."
          message="An error occurred while loading this course's quizzes."
          onRetry={handleListRetry}
        />
      )}

      {/* Loaded state */}
      {!isNotFound && !isGenericError && (
        <>
          {/* Summary strip */}
          {totalQuizzes > 0 && (
            <div
              className="flex flex-wrap items-center text-body-sm text-text-secondary mb-8"
              aria-label="Quiz summary"
            >
              <span>
                <span className="font-semibold text-text-primary">{totalQuizzes}</span>
                {' '}{totalQuizzes === 1 ? 'quiz' : 'quizzes'}
              </span>
              <span className="mx-2 text-border-hover select-none" aria-hidden="true">·</span>
              <span>
                <span className="font-semibold text-text-primary">{publishedCount}</span>
                {' '}{publishedCount === 1 ? 'published' : 'published'}
              </span>
              <span className="mx-2 text-border-hover select-none" aria-hidden="true">·</span>
              <span>
                <span className="font-semibold text-text-primary">{draftCount}</span>
                {' '}{draftCount === 1 ? 'draft' : 'drafts'}
              </span>
              {archivedCount > 0 && (
                <>
                  <span className="mx-2 text-border-hover select-none" aria-hidden="true">·</span>
                  <span>
                    <span className="font-semibold text-text-primary">{archivedCount}</span>
                    {' '}{archivedCount === 1 ? 'archived' : 'archived'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Builder grid */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">

            {/* Mobile: side panel above the list */}
            <div className="lg:hidden">{sidePanel}</div>

            {/* Main column */}
            <div>
              {quizzes.length === 0 ? (
                <StatePanel
                  title="No quizzes yet"
                  message="Create a quiz to assess learners after they study this course."
                />
              ) : (
                <ul className="flex flex-col gap-3" aria-label="Course quizzes">
                  {quizzes.map(quiz => {
                    const qKey = `quiz:${quiz.id}`;
                    const isEditingThis =
                      typeof quizFormMode === 'object' && quizFormMode.edit.id === quiz.id;
                    return (
                      <li key={quiz.id}>
                        <QuizCard
                          quiz={quiz}
                          sections={sections}
                          isExpanded={expandedQuizId === quiz.id}
                          detail={expandedQuizId === quiz.id ? quizDetail : null}
                          detailLoading={expandedQuizId === quiz.id ? detailLoading : false}
                          detailError={expandedQuizId === quiz.id ? detailError : 'none'}
                          isArchiving={archivingQuizId === quiz.id}
                          isPending={pendingIds.has(qKey)}
                          publishError={
                            rowErrors[qKey] && quiz.status === 'DRAFT'
                              ? rowErrors[qKey]
                              : null
                          }
                          archiveError={
                            rowErrors[qKey] && quiz.status !== 'DRAFT'
                              ? rowErrors[qKey]
                              : null
                          }
                          onToggleExpand={() => handleToggleExpand(quiz.id)}
                          onEdit={() => {
                            setQuizFormMode({ edit: quiz });
                            if (!isEditingThis) clearRowError(qKey);
                          }}
                          onPublish={() => handlePublish(quiz.id)}
                          onArchiveClick={() => {
                            setArchivingQuizId(quiz.id);
                            clearRowError(qKey);
                          }}
                          onArchiveCancel={() => setArchivingQuizId(null)}
                          onArchiveConfirm={() => handleArchiveConfirm(quiz.id)}
                          onDetailUpdate={updater =>
                            setQuizDetail(prev => (prev ? updater(prev) : prev))
                          }
                          onRetryDetail={() => {
                            setDetailLoading(true);
                            setDetailError('none');
                            setDetailTick(t => t + 1);
                          }}
                          onEditButtonRef={el => handleEditQuizButtonRef(quiz.id, el)}
                        />
                      </li>
                    );
                  })}
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
