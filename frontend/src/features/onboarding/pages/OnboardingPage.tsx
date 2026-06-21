import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  getLearningPreferences,
  updateLearningPreferences,
  type LearningGoal,
  type PreferredLevel,
} from '../../../api/learningPreferences';
import { getCategories, type CategoryResponse } from '../../../api/categories';
import { completeOnboarding } from '../../../api/profile';
import { LEARNING_GOAL_LABELS, PREFERRED_LEVEL_LABELS } from '../../../lib/learning-preference-labels';
import { Button } from '../../../components/ui/Button';
import { FormField, Input } from '../../../components/ui/Input';
import { selectInputClass } from '../../dashboard/components/settings/settingsHelpers';
import logoPrimaryUrl from '../../../assets/logo-primary.png';

const TOTAL_STEPS = 4;
const MAX_PREFERRED_CATEGORIES = 8;
const MIN_WEEKLY_GOAL_MINUTES = 30;
const MAX_WEEKLY_GOAL_MINUTES = 1200;

const STEP_TITLES = [
  "What's your main learning goal?",
  'Set your pace',
  'Pick a few topics you care about',
  'Review and finish',
];

interface FormErrors {
  weeklyGoalMinutes?: string;
  preferredCategoryIds?: string;
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const [learningGoal, setLearningGoal] = useState<LearningGoal | ''>('');
  const [preferredLevel, setPreferredLevel] = useState<PreferredLevel | ''>('');
  const [weeklyGoalMinutes, setWeeklyGoalMinutes] = useState('');
  const [preferredCategoryIds, setPreferredCategoryIds] = useState<number[]>([]);

  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const token = { cancelled: false };
    Promise.all([getLearningPreferences(), getCategories()])
      .then(([prefs, cats]) => {
        if (token.cancelled) return;
        setLearningGoal(prefs.learningGoal ?? '');
        setPreferredLevel(prefs.preferredLevel ?? '');
        setWeeklyGoalMinutes(prefs.weeklyGoalMinutes != null ? String(prefs.weeklyGoalMinutes) : '');
        setPreferredCategoryIds(prefs.preferredCategoryIds);
        setCategories(cats);
      })
      .catch(() => {
        if (token.cancelled) return;
        setLoadError('Could not load your learning preferences. Please try again.');
      });
    return () => { token.cancelled = true; };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function toggleCategory(categoryId: number) {
    setPreferredCategoryIds(current => {
      if (current.includes(categoryId)) {
        return current.filter(id => id !== categoryId);
      }
      if (current.length >= MAX_PREFERRED_CATEGORIES) return current;
      return [...current, categoryId];
    });
  }

  function validateStep2(): boolean {
    const trimmed = weeklyGoalMinutes.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (parsed !== null && (Number.isNaN(parsed) || parsed < MIN_WEEKLY_GOAL_MINUTES || parsed > MAX_WEEKLY_GOAL_MINUTES)) {
      setFieldErrors({ weeklyGoalMinutes: `Enter a value between ${MIN_WEEKLY_GOAL_MINUTES} and ${MAX_WEEKLY_GOAL_MINUTES} minutes.` });
      return false;
    }
    setFieldErrors({});
    return true;
  }

  function goNext() {
    if (step === 2 && !validateStep2()) return;
    setFormError(null);
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setFormError(null);
    setStep(s => Math.max(s - 1, 1));
  }

  const finishOnboarding = useCallback(async (savePreferences: boolean) => {
    setIsSaving(true);
    setFormError(null);
    try {
      if (savePreferences) {
        const trimmed = weeklyGoalMinutes.trim();
        const parsedMinutes = trimmed === '' ? null : Number(trimmed);
        await updateLearningPreferences({
          learningGoal: learningGoal === '' ? null : learningGoal,
          preferredLevel: preferredLevel === '' ? null : preferredLevel,
          weeklyGoalMinutes: parsedMinutes,
          preferredCategoryIds,
        });
      }
      await completeOnboarding();
      if (user) {
        refreshUser({ ...user, learnerOnboardingCompleted: true });
      }
      navigate('/dashboard');
    } catch {
      setFormError('We could not complete onboarding. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [learningGoal, preferredLevel, weeklyGoalMinutes, preferredCategoryIds, user, refreshUser, navigate]);

  if (user?.learnerOnboardingCompleted === true) {
    return (
      <OnboardingShell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-salem-50 text-salem">
            <Check size={22} aria-hidden="true" />
          </div>
          <h1 className="text-headline text-text-primary mb-2">You're all set</h1>
          <p className="text-body text-text-secondary mb-8">
            You've already completed onboarding. Head to your dashboard to keep learning.
          </p>
          <Button variant="primary" size="lg" asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </OnboardingShell>
    );
  }

  if (loadError) {
    return (
      <OnboardingShell>
        <p className="text-body-sm text-error" role="alert">{loadError}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </OnboardingShell>
    );
  }

  if (!categories) {
    return (
      <OnboardingShell>
        <p className="text-body-sm text-text-secondary">Loading…</p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      {/* Progress — text-based, not color-only */}
      <div className="mb-8">
        <p className="text-body-sm font-medium text-text-secondary mb-2">
          Step {step} of {TOTAL_STEPS}
        </p>
        <div className="h-1.5 w-full rounded-full bg-border-default" role="presentation">
          <div
            className="h-1.5 rounded-full bg-salem transition-[width] duration-200"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-headline text-text-primary mb-2 outline-none"
      >
        {STEP_TITLES[step - 1]}
      </h1>
      <p className="text-body text-text-secondary mb-8">
        Tell us a little about how you'd like to learn. You can change this anytime in Settings.
      </p>

      {step === 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Learning goal</legend>
          {Object.entries(LEARNING_GOAL_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-md border border-border-default px-4 py-3 cursor-pointer hover:border-border-hover focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-salem"
            >
              <input
                type="radio"
                name="learningGoal"
                value={value}
                checked={learningGoal === value}
                onChange={() => setLearningGoal(value as LearningGoal)}
                className="accent-salem size-4"
              />
              <span className="text-body text-text-primary">{label}</span>
            </label>
          ))}
        </fieldset>
      )}

      {step === 2 && (
        <div className="grid gap-5">
          <FormField label="Preferred level" htmlFor="onb-preferred-level">
            <select
              id="onb-preferred-level"
              value={preferredLevel}
              onChange={e => setPreferredLevel(e.target.value as PreferredLevel | '')}
              disabled={isSaving}
              className={selectInputClass()}
            >
              <option value="">No preference set</option>
              {Object.entries(PREFERRED_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Weekly learning goal (minutes)"
            htmlFor="onb-weekly-goal"
            error={fieldErrors.weeklyGoalMinutes}
            hint={`Optional. Between ${MIN_WEEKLY_GOAL_MINUTES} and ${MAX_WEEKLY_GOAL_MINUTES} minutes.`}
          >
            <Input
              id="onb-weekly-goal"
              type="number"
              inputMode="numeric"
              min={MIN_WEEKLY_GOAL_MINUTES}
              max={MAX_WEEKLY_GOAL_MINUTES}
              step={15}
              value={weeklyGoalMinutes}
              onChange={e => setWeeklyGoalMinutes(e.target.value)}
              disabled={isSaving}
              hasError={!!fieldErrors.weeklyGoalMinutes}
              placeholder="e.g. 180"
              className="max-w-[220px]"
            />
          </FormField>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-xs">
          {categories.length === 0 ? (
            <p className="text-body-sm text-text-muted">No categories are available yet.</p>
          ) : (
            <fieldset className="flex flex-wrap gap-2" aria-describedby="onb-categories-hint">
              <legend className="sr-only">Preferred categories</legend>
              {categories.map(category => (
                <label
                  key={category.id}
                  className="flex items-center gap-1.5 text-body-sm text-text-primary cursor-pointer rounded-full border border-border-default px-3 py-1.5 hover:border-border-hover focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-salem"
                >
                  <input
                    type="checkbox"
                    checked={preferredCategoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    disabled={
                      isSaving ||
                      (!preferredCategoryIds.includes(category.id) && preferredCategoryIds.length >= MAX_PREFERRED_CATEGORIES)
                    }
                    className="accent-salem h-4 w-4"
                  />
                  {category.name}
                </label>
              ))}
            </fieldset>
          )}
          <p id="onb-categories-hint" className="text-body-sm text-text-muted">
            Optional. Select up to {MAX_PREFERRED_CATEGORIES}.
          </p>
          {fieldErrors.preferredCategoryIds && (
            <p className="text-body-sm text-error" role="alert">{fieldErrors.preferredCategoryIds}</p>
          )}
        </div>
      )}

      {step === 4 && (
        <dl className="flex flex-col gap-3">
          <ReviewRow label="Learning goal" value={learningGoal ? LEARNING_GOAL_LABELS[learningGoal] : 'No preference set'} />
          <ReviewRow label="Preferred level" value={preferredLevel ? PREFERRED_LEVEL_LABELS[preferredLevel] : 'No preference set'} />
          <ReviewRow label="Weekly goal" value={weeklyGoalMinutes ? `${weeklyGoalMinutes} minutes` : 'No preference set'} />
          <ReviewRow
            label="Categories"
            value={
              preferredCategoryIds.length === 0
                ? 'No preference set'
                : categories
                    .filter(c => preferredCategoryIds.includes(c.id))
                    .map(c => c.name)
                    .join(', ')
            }
          />
        </dl>
      )}

      {formError && (
        <p className="text-body-sm text-error mt-6" role="alert">{formError}</p>
      )}

      <div className="flex items-center justify-between mt-10">
        <div>
          {step > 1 && (
            <Button variant="secondary" size="md" onClick={goBack} disabled={isSaving}>
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md" onClick={() => finishOnboarding(false)} loading={isSaving} disabled={isSaving}>
            Skip for now
          </Button>
          {step < TOTAL_STEPS ? (
            <Button variant="primary" size="md" onClick={goNext} disabled={isSaving}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={() => finishOnboarding(true)} loading={isSaving} disabled={isSaving}>
              Finish onboarding
            </Button>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border-default last:border-b-0">
      <dt className="text-body-sm font-medium text-text-primary">{label}</dt>
      <dd className="text-body-sm text-text-secondary text-right min-w-0 break-words">{value}</dd>
    </div>
  );
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center bg-surface px-4 sm:px-6 py-10">
      <Link to="/" aria-label="Learnova – home" className="mb-10 rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem">
        <img src={logoPrimaryUrl} alt="" aria-hidden="true" className="h-9 w-auto object-contain" />
      </Link>
      <div className="w-full max-w-lg bg-surface">
        {children}
      </div>
    </div>
  );
}
