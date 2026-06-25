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

// ── Course detail types (mirror backend CourseDetailResponse DTO) ──────────────
// Adds a safe syllabus preview, derived totals, and public instructor details on
// top of the catalog summary fields. Never carries lesson textContent/contentUrl.

export type LessonContentType = 'TEXT' | 'VIDEO' | 'PDF' | 'LINK';

export interface PublicInstructor {
  displayName: string;
  bio: string | null;
  expertise: string | null;
  experience: string | null;
}

export interface PublicLessonPreview {
  id: number;
  title: string;
  position: number;
  contentType: LessonContentType | null;
  durationSeconds: number | null;
}

export interface PublicSectionPreview {
  id: number;
  title: string;
  position: number;
  lessons: PublicLessonPreview[];
}

export interface CourseDetail {
  id: number;
  title: string;
  description: string;
  level: CourseLevel;
  status: string; // always 'PUBLISHED' on the public catalog endpoints
  thumbnailUrl: string | null;
  categoryName: string | null;
  createdAt: string;
  instructor: PublicInstructor;
  sections: PublicSectionPreview[];
  sectionCount: number;
  lessonCount: number;
  totalDurationSeconds: number;
}

// ── API calls (always via the shared Axios instance) ───────────────────────────

export async function getPublishedCourses(): Promise<CourseCatalogItem[]> {
  const { data } = await api.get<CourseCatalogItem[]>('/api/v1/courses');
  return data;
}

export async function getPublishedCourse(courseId: number): Promise<CourseDetail> {
  const { data } = await api.get<CourseDetail>(`/api/v1/courses/${courseId}`);
  return data;
}
