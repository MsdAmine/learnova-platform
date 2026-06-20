import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  getLearningPreferences,
  updateLearningPreferences,
  type LearningGoal,
  type PreferredLevel,
  type LearningPreferencesResponse,
} from '../../../../api/learningPreferences';
import { getCategories, type CategoryResponse } from '../../../../api/categories';
import { Button } from '../../../../components/ui/Button';
import { FormField, Input } from '../../../../components/ui/Input';
import { selectInputClass } from './settingsHelpers';
import { LEARNING_GOAL_LABELS, PREFERRED_LEVEL_LABELS } from '../../../../lib/learning-preference-labels';

const MAX_PREFERRED_CATEGORIES = 8;
const MIN_WEEKLY_GOAL_MINUTES = 30;
const MAX_WEEKLY_GOAL_MINUTES = 1200;

interface LearningPreferencesFormErrors {
  weeklyGoalMinutes?: string;
  preferredCategoryIds?: string;
}

export function LearningPreferencesSection() {
  const [preferences, setPreferences] = useState<LearningPreferencesResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LearningPreferencesFormErrors>({});

  const [learningGoal, setLearningGoal] = useState<LearningGoal | ''>('');
  const [preferredLevel, setPreferredLevel] = useState<PreferredLevel | ''>('');
  const [weeklyGoalMinutes, setWeeklyGoalMinutes] = useState('');
  const [preferredCategoryIds, setPreferredCategoryIds] = useState<number[]>([]);

  function applyPreferences(data: LearningPreferencesResponse) {
    setPreferences(data);
    setLearningGoal(data.learningGoal ?? '');
    setPreferredLevel(data.preferredLevel ?? '');
    setWeeklyGoalMinutes(data.weeklyGoalMinutes != null ? String(data.weeklyGoalMinutes) : '');
    setPreferredCategoryIds(data.preferredCategoryIds);
  }

  // Mount effect never resets state synchronously — only the .then/.catch
  // callbacks call setState, matching the useEnrollments / SavedCoursesPage
  // pattern and avoiding the setState-in-effect lint rule.
  const fetchAll = useCallback((token: { cancelled: boolean }) => {
    Promise.all([getLearningPreferences(), getCategories()])
      .then(([preferencesData, categoriesData]) => {
        if (token.cancelled) return;
        applyPreferences(preferencesData);
        setCategories(categoriesData);
      })
      .catch(() => {
        if (token.cancelled) return;
        setLoadError('Could not load your learning preferences. Please try again.');
      });
  }, []);

  useEffect(() => {
    const token = { cancelled: false };
    fetchAll(token);
    return () => { token.cancelled = true; };
  }, [fetchAll]);

  // Called from the "Retry" click handler, so resetting state here is safe.
  function handleRetry() {
    setLoadError(null);
    setPreferences(null);
    setCategories(null);
    fetchAll({ cancelled: false });
  }

  function toggleCategory(categoryId: number) {
    setPreferredCategoryIds(current => {
      if (current.includes(categoryId)) {
        return current.filter(id => id !== categoryId);
      }
      if (current.length >= MAX_PREFERRED_CATEGORIES) return current;
      return [...current, categoryId];
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedMinutes = weeklyGoalMinutes.trim();
    const parsedMinutes = trimmedMinutes === '' ? null : Number(trimmedMinutes);

    const errors: LearningPreferencesFormErrors = {};
    if (
      parsedMinutes !== null &&
      (Number.isNaN(parsedMinutes) || parsedMinutes < MIN_WEEKLY_GOAL_MINUTES || parsedMinutes > MAX_WEEKLY_GOAL_MINUTES)
    ) {
      errors.weeklyGoalMinutes = `Enter a value between ${MIN_WEEKLY_GOAL_MINUTES} and ${MAX_WEEKLY_GOAL_MINUTES} minutes.`;
    }
    if (preferredCategoryIds.length > MAX_PREFERRED_CATEGORIES) {
      errors.preferredCategoryIds = `Select up to ${MAX_PREFERRED_CATEGORIES} categories.`;
    }

    setFieldErrors(errors);
    setSuccessMessage(null);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    setFormError(null);
    try {
      const updated = await updateLearningPreferences({
        learningGoal: learningGoal === '' ? null : learningGoal,
        preferredLevel: preferredLevel === '' ? null : preferredLevel,
        weeklyGoalMinutes: parsedMinutes,
        preferredCategoryIds,
      });
      applyPreferences(updated);
      setSuccessMessage('Learning preferences saved.');
    } catch {
      setFormError('We could not save your learning preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (loadError) {
    return (
      <div className="mt-4">
        <p className="text-body-sm text-error" role="alert">{loadError}</p>
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!preferences || !categories) {
    return <p className="text-body-sm text-text-secondary mt-4">Loading learning preferences…</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4">
      <div className="grid gap-4 max-w-[560px]">
        <FormField label="Learning goal" htmlFor="prefs-learning-goal">
          <select
            id="prefs-learning-goal"
            value={learningGoal}
            onChange={e => setLearningGoal(e.target.value as LearningGoal | '')}
            disabled={isSaving}
            className={selectInputClass()}
          >
            <option value="">No preference set</option>
            {Object.entries(LEARNING_GOAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Preferred level" htmlFor="prefs-preferred-level">
          <select
            id="prefs-preferred-level"
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
          htmlFor="prefs-weekly-goal"
          error={fieldErrors.weeklyGoalMinutes}
          hint={`Optional. Between ${MIN_WEEKLY_GOAL_MINUTES} and ${MAX_WEEKLY_GOAL_MINUTES} minutes.`}
        >
          <Input
            id="prefs-weekly-goal"
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

        <div className="flex flex-col gap-xs">
          <span className="text-body-sm font-medium text-text-secondary">
            Preferred categories
          </span>
          {categories.length === 0 ? (
            <p className="text-body-sm text-text-muted">No categories are available yet.</p>
          ) : (
            <fieldset className="flex flex-wrap gap-2" aria-describedby="prefs-categories-hint">
              <legend className="sr-only">Preferred categories</legend>
              {categories.map(category => (
                <label
                  key={category.id}
                  className="flex items-center gap-1.5 text-body-sm text-text-primary cursor-pointer rounded-full border border-border-default px-3 py-1.5 hover:border-border-hover"
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
          <p id="prefs-categories-hint" className="text-body-sm text-text-muted">
            Optional. Select up to {MAX_PREFERRED_CATEGORIES}.
          </p>
          {fieldErrors.preferredCategoryIds && (
            <p className="text-body-sm text-error" role="alert">{fieldErrors.preferredCategoryIds}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            loading={isSaving}
            aria-label="Save learning preferences"
          >
            Save preferences
          </Button>
        </div>
        {formError && (
          <p className="text-caption text-error mt-1" role="alert">{formError}</p>
        )}
        {successMessage && !formError && (
          <p className="text-caption text-salem mt-1" role="status">{successMessage}</p>
        )}
      </div>
    </form>
  );
}
