import api from './axios';
import type { CourseLevel } from './courses';

// Mirrors backend CourseResponse (richer than CourseCatalogItem).
// Unlike the public catalog, the wishlist endpoint applies no PUBLISHED filter —
// a saved course can later become DRAFT or ARCHIVED.
export interface WishlistCourse {
  id: number;
  title: string;
  description: string;
  level: CourseLevel;
  status: string;
  thumbnailUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  instructorProfileId: number | null;
  instructorName: string;
  createdAt: string;
  updatedAt: string;
}

// Mirrors backend WishlistStatusResponse — a small per-course saved flag, used
// where the full wishlist list would be wasteful (e.g. catalog cards).
export interface WishlistStatus {
  courseId: number;
  saved: boolean;
}

// Minimal Spring Page shape; only the fields the frontend reads.
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// v1 cap: request a single large page so the derived Set covers the full catalog.
// Revisit when real wishlist volume grows or a per-course status endpoint exists.
export async function getMyWishlist(size = 200): Promise<Page<WishlistCourse>> {
  const { data } = await api.get<Page<WishlistCourse>>(`/api/v1/wishlist?size=${size}`);
  return data;
}

export async function getCourseWishlistStatus(courseId: number): Promise<WishlistStatus> {
  const { data } = await api.get<WishlistStatus>(`/api/v1/wishlist/course/${courseId}/status`);
  return data;
}

export async function addToWishlist(courseId: number): Promise<void> {
  await api.post(`/api/v1/wishlist/course/${courseId}`);
}

export async function removeFromWishlist(courseId: number): Promise<void> {
  await api.delete(`/api/v1/wishlist/course/${courseId}`);
}
