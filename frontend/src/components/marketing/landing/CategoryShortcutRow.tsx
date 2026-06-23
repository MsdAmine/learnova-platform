import { Link } from 'react-router-dom';
import {
  BookOpen,
  Code,
  Palette,
  Database,
  Cloud,
  Shield,
  Briefcase,
  TrendingUp,
  Megaphone,
  Globe,
  Calculator,
  Languages,
  Cpu,
  PenTool,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryResponse } from '../../../api/categories';

// Skill-area cards, not a stats grid: no fake course counts are shown. Capped
// so the grid stays calm as the category list grows; the hero chips and
// "/courses" remain the full escape hatch.
const MAX_SHORTCUTS = 8;

// Keyword → icon mapping so each category gets a relevant glyph without any
// backend icon field. Order matters: the first keyword found in the (lowercased)
// category name wins. Anything unmatched falls back to a neutral BookOpen, so a
// brand-new category never renders without an icon.
const ICON_RULES: ReadonlyArray<[string[], LucideIcon]> = [
  [['web', 'frontend', 'front-end', 'html', 'css', 'javascript', 'react'], Code],
  [['program', 'develop', 'software', 'coding', 'code', 'engineer'], Code],
  [['design', 'ui', 'ux', 'graphic'], Palette],
  [['draw', 'illustrat', 'art'], PenTool],
  [['data', 'analytic', 'sql', 'database'], Database],
  [['ai', 'machine', 'ml', 'deep learn'], Cpu],
  [['cloud', 'devops', 'kubernetes', 'aws'], Cloud],
  [['security', 'cyber', 'network'], Shield],
  [['business', 'management', 'finance', 'entrepreneur'], Briefcase],
  [['market', 'seo', 'social'], Megaphone],
  [['math', 'statistic', 'calculus'], Calculator],
  [['language', 'english', 'spanish', 'french'], Languages],
  [['market', 'growth', 'sales'], TrendingUp],
  [['geo', 'world', 'culture'], Globe],
];

function iconForCategory(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const [keywords, Icon] of ICON_RULES) {
    if (keywords.some((kw) => lower.includes(kw))) return Icon;
  }
  return BookOpen;
}

interface CategoryShortcutRowProps {
  categories: CategoryResponse[];
}

export function CategoryShortcutRow({ categories }: CategoryShortcutRowProps) {
  if (categories.length === 0) return null;

  const shortcuts = categories.slice(0, MAX_SHORTCUTS);

  return (
    <section
      aria-labelledby="category-shortcuts-heading"
      className="bg-surface-elevated py-14 lg:py-20"
    >
      <div className="px-6 md:px-12 lg:px-16 max-w-container mx-auto">
        <div className="mb-8">
          <h2 id="category-shortcuts-heading" className="text-headline text-text-primary">
            Explore by category
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            Jump straight to the subject you want to learn.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {shortcuts.map((category) => {
            const Icon = iconForCategory(category.name);
            return (
              <Link
                key={category.id}
                to={`/courses?category=${encodeURIComponent(category.name)}`}
                aria-label={`Browse ${category.name} courses`}
                className="group flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-5 hover:border-border-hover motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-salem-50"
                  aria-hidden="true"
                >
                  <Icon size={20} className="text-salem" />
                </span>
                <span className="min-w-0">
                  <span className="block text-body-sm font-semibold text-text-primary truncate">
                    {category.name}
                  </span>
                  {category.description && (
                    <span className="mt-0.5 block text-caption text-text-secondary line-clamp-2">
                      {category.description}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
