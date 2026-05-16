import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import type { CourseResponse } from '../../../types/course';
import type { PageResponse } from '../../../types/common';

export function useInstructorCourses(initialPage = 0, initialSize = 10) {
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [page, setPage] = useState<number>(initialPage);
    const [size] = useState<number>(initialSize);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<PageResponse<CourseResponse>>(
                `/api/v1/instructor/courses`,
                {
                    params: {
                        page,
                        size,
                        sort: 'updatedAt,desc',
                    },
                }
            );
            setCourses(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch courses. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [page, size]);

    const publishCourse = async (courseId: number) => {
        try {
            const response = await api.patch<CourseResponse>(
                `/api/v1/instructor/courses/${courseId}/publish`
            );
            // Update local state
            setCourses((prev) =>
                prev.map((c) => (c.id === courseId ? response.data : c))
            );
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to publish course.';
            throw new Error(msg);
        }
    };

    const archiveCourse = async (courseId: number) => {
        try {
            const response = await api.patch<CourseResponse>(
                `/api/v1/instructor/courses/${courseId}/archive`
            );
            // Update local state
            setCourses((prev) =>
                prev.map((c) => (c.id === courseId ? response.data : c))
            );
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to archive course.';
            throw new Error(msg);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    return {
        courses,
        loading,
        error,
        page,
        size,
        totalPages,
        totalElements,
        setPage,
        retry: fetchCourses,
        publishCourse,
        archiveCourse,
    };
}
