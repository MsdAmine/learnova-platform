import api from './axios';

// ── Types (mirror backend CourseCatalogResponse DTO) ───────────────────────────
// Backend record: id, title, description, level, status, thumbnailUrl,
// categoryName, instructorName, createdAt. Instant → ISO string.
// The DTO deliberately carries no rating, price, duration, lesson count, or
// certificate flag; the catalog UI must not display or fake any of those.

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

export interface CourseCatalogItem {
  id: number;
  title: string;
  description: string;
  level: CourseLevel;
  status: string; // always 'PUBLISHED' on the public catalog endpoints
  thumbnailUrl: string | null;
  categoryName: string | null;
  instructorName: string;
  createdAt: string;
}

// ── API calls (always via the shared Axios instance) ───────────────────────────

export async function getPublishedCourses(): Promise<CourseCatalogItem[]> {
  const { data } = await api.get<CourseCatalogItem[]>('/api/v1/courses');
  return data;
}

export async function getPublishedCourse(courseId: number): Promise<CourseCatalogItem> {
  const { data } = await api.get<CourseCatalogItem>(`/api/v1/courses/${courseId}`);
  return data;
}
