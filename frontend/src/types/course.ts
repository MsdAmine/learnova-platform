export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DEACTIVATED';

export interface CourseResponse {
    id: number;
    title: string;
    description: string;
    level: CourseLevel;
    status: CourseStatus;
    thumbnailUrl: string | null;
    categoryId: number;
    categoryName: string;
    instructorProfileId: number;
    instructorName: string;
    sectionCount: number;
    lessonCount: number;
    createdAt: string;
    updatedAt: string;
}
