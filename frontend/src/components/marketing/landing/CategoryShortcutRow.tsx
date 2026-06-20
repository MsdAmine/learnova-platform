import { Link } from 'react-router-dom';
import type { CategoryResponse } from '../../../api/categories';

// A wrapping nav-shortcut row, not a stats grid: no fake course counts are
// shown. Capped to avoid an unbounded chip wall as the category list grows;
// the "Browse by category" heading + "/courses" remain the full escape hatch.
const MAX_SHORTCUTS = 8;

interface CategoryShortcutRowProps {
  categories: CategoryResponse[];
}

export function CategoryShortcutRow({ categories }: CategoryShortcutRowProps) {
  if (categories.length === 0) return null;

  const shortcuts = categories.slice(0, MAX_SHORTCUTS);

  return (
    <section aria-labelledby="category-shortcuts-heading" className="bg-bg-base py-12 lg:py-16">
      <div className="px-6 md:px-12 lg:px-16 max-w-container mx-auto">
        <h2 id="category-shortcuts-heading" className="text-title-sm font-semibold text-text-primary mb-4">
          Browse by category
        </h2>
        <div className="flex flex-wrap gap-3">
          {shortcuts.map((category) => (
            <Link
              key={category.id}
              to={`/courses?category=${encodeURIComponent(category.name)}`}
              aria-label={`Browse ${category.name} courses`}
              className="inline-flex items-center rounded-full border border-border-default bg-surface px-4 py-2 text-body-sm font-medium text-text-primary hover:border-border-hover hover:bg-surface-elevated motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
