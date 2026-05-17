import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    BookOpen,
    Layers,
    AlertCircle,
    CheckCircle,
    Loader2,
    Settings,
    FileText,
    Archive,
    Check,
    Plus,
    X,
    Edit3,
    Trash2,
    ChevronDown,
    ChevronUp,
    Play,
    File,
    Link as LinkIcon,
    Paperclip,
    FileSignature,
    CheckSquare,
    AlertTriangle
} from 'lucide-react';
import api from '../../../api/axios';
import type { CourseResponse, CourseLevel } from '../../../types/course';

interface Category {
    id: number;
    name: string;
    description?: string;
}

export type LessonContentType = 'VIDEO' | 'PDF' | 'TEXT' | 'EXTERNAL_LINK' | 'ATTACHMENT';

export interface Lesson {
    id: number;
    title: string;
    position: number;
    contentType: LessonContentType;
    contentUrl?: string;
    textContent?: string;
    sectionId: number;
}

export interface Section {
    id: number;
    title: string;
    position: number;
    courseId: number;
    lessons?: Lesson[];
}

export default function InstructorCourseEdit() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    // Tabs state: 'info' or 'curriculum'
    const [activeTab, setActiveTab] = useState<'info' | 'curriculum'>('info');

    // Course state
    const [course, setCourse] = useState<CourseResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [submittingStatus, setSubmittingStatus] = useState(false);

    // Form fields state (Tab 1)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [level, setLevel] = useState<CourseLevel>('BEGINNER');
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    // Metadata states
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    
    // Status/Success message states
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Workflow modals states
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        type: 'publish' | 'archive';
    }>({ show: false, type: 'publish' });

    // Curriculum Builder state (Tab 2)
    const [sections, setSections] = useState<Section[]>([]);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [expandedSectionIds, setExpandedSectionIds] = useState<Record<number, boolean>>({});
    
    // Section Add/Edit inline state
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [editingSectionTitle, setEditingSectionTitle] = useState('');
    
    // Section Delete confirmation
    const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

    // Lesson Add/Edit modal state
    const [lessonModal, setLessonModal] = useState<{
        show: boolean;
        sectionId: number;
        lessonToEdit?: Lesson;
        title: string;
        contentType: LessonContentType;
        contentUrl: string;
        textContent: string;
        error: string | null;
        submitting: boolean;
    }>({
        show: false,
        sectionId: 0,
        title: '',
        contentType: 'VIDEO',
        contentUrl: '',
        textContent: '',
        error: null,
        submitting: false
    });

    // Lesson Delete confirmation
    const [lessonToDelete, setLessonToDelete] = useState<{
        lesson: Lesson;
        sectionId: number;
    } | null>(null);

    // Fetch initial metadata & course details
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch categories
                const categoriesPromise = api.get<Category[]>('/api/v1/categories');
                // Fetch course details
                const coursePromise = api.get<CourseResponse>(`/api/v1/instructor/courses/${courseId}`);

                const [categoriesRes, courseRes] = await Promise.all([categoriesPromise, coursePromise]);
                
                setCategories(categoriesRes.data);
                
                const c = courseRes.data;
                setCourse(c);
                setTitle(c.title);
                setDescription(c.description || '');
                setCategoryId(String(c.categoryId));
                setLevel(c.level);
                setThumbnailUrl(c.thumbnailUrl || '');
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to load course details. Please try again.');
            } finally {
                setLoading(false);
                setCategoriesLoading(false);
            }
        }
        
        if (courseId) {
            fetchData();
        }
    }, [courseId]);

    // Load curriculum section & lesson records
    const fetchCurriculum = async () => {
        if (!courseId) return;
        setSectionsLoading(true);
        try {
            const { data: sectionList } = await api.get<Section[]>(`/api/v1/instructor/courses/${courseId}/sections`);
            
            // For each section, load lessons dynamically
            const sectionsWithLessons = await Promise.all(
                sectionList.map(async (sec) => {
                    try {
                        const { data: lessonList } = await api.get<Lesson[]>(
                            `/api/v1/instructor/courses/${courseId}/sections/${sec.id}/lessons`
                        );
                        return { ...sec, lessons: lessonList.sort((a, b) => a.position - b.position) };
                    } catch (err) {
                        console.error(`Failed to fetch lessons for section ${sec.id}`, err);
                        return { ...sec, lessons: [] };
                    }
                })
            );

            // Sort sections by position
            setSections(sectionsWithLessons.sort((a, b) => a.position - b.position));
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to fetch curriculum sections.');
        } finally {
            setSectionsLoading(false);
        }
    };

    // Trigger curriculum fetch when Curriculum Tab is selected
    useEffect(() => {
        if (activeTab === 'curriculum') {
            fetchCurriculum();
        }
    }, [activeTab]);

    // Client-side validations for Info Tab
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        
        if (!title.trim()) {
            errors.title = 'Course title is required.';
        } else if (title.length > 200) {
            errors.title = 'Title must be under 200 characters.';
        }

        if (description.length > 2000) {
            errors.description = 'Description must be under 2000 characters.';
        }

        if (!categoryId) {
            errors.categoryId = 'Category is required.';
        }

        if (thumbnailUrl && thumbnailUrl.length > 500) {
            errors.thumbnailUrl = 'Thumbnail URL must be under 500 characters.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Auto-clear success message
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Save changes (Info Tab)
    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setUpdating(true);
        setError(null);
        setSuccessMessage(null);

        const requestBody = {
            title: title.trim(),
            description: description.trim(),
            categoryId: Number(categoryId),
            level,
            thumbnailUrl: thumbnailUrl.trim() || null
        };

        try {
            const { data } = await api.put<CourseResponse>(`/api/v1/instructor/courses/${courseId}`, requestBody);
            setCourse(data);
            setSuccessMessage('Course details updated successfully!');
            setUpdating(false);
        } catch (err: any) {
            setUpdating(false);
            setError(err.response?.data?.message || 'Failed to update course details.');
        }
    };

    // Status changes (Publish / Archive)
    const handleStatusTransition = async () => {
        const { type } = confirmModal;
        setConfirmModal({ show: false, type });
        setSubmittingStatus(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const endpoint = `/api/v1/instructor/courses/${courseId}/${type}`;
            const { data } = await api.patch<CourseResponse>(endpoint);
            setCourse(data);
            setSuccessMessage(`Course status successfully transitioned to ${data.status}!`);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to transition course status to ${type === 'publish' ? 'PUBLISHED' : 'ARCHIVED'}.`);
        } finally {
            setSubmittingStatus(false);
        }
    };

    // Toggle Section Accordion
    const toggleSection = (sectionId: number) => {
        setExpandedSectionIds((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Create Section (POST)
    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSectionTitle.trim()) return;

        setError(null);
        try {
            const position = sections.length;
            const { data: newSec } = await api.post<Section>(
                `/api/v1/instructor/courses/${courseId}/sections`,
                { title: newSectionTitle.trim(), position }
            );
            
            // Add new section locally and expand it
            setSections((prev) => [...prev, { ...newSec, lessons: [] }]);
            setExpandedSectionIds((prev) => ({ ...prev, [newSec.id]: true }));
            
            setNewSectionTitle('');
            setIsAddingSection(false);
            setSuccessMessage(`Section "${newSec.title}" successfully added!`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create new section.');
        }
    };

    // Update Section Title (PUT)
    const handleUpdateSection = async (section: Section) => {
        if (!editingSectionTitle.trim()) return;

        setError(null);
        try {
            const { data: updatedSec } = await api.put<Section>(
                `/api/v1/instructor/courses/${courseId}/sections/${section.id}`,
                { title: editingSectionTitle.trim(), position: section.position }
            );

            setSections((prev) =>
                prev.map((s) => (s.id === section.id ? { ...s, title: updatedSec.title } : s))
            );
            setEditingSectionId(null);
            setEditingSectionTitle('');
            setSuccessMessage('Section title updated successfully.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update section.');
        }
    };

    // Delete Section (DELETE)
    const handleDeleteSection = async () => {
        if (!sectionToDelete) return;

        setError(null);
        try {
            await api.delete(`/api/v1/instructor/courses/${courseId}/sections/${sectionToDelete.id}`);
            
            setSections((prev) => prev.filter((s) => s.id !== sectionToDelete.id));
            setSectionToDelete(null);
            setSuccessMessage(`Section "${sectionToDelete.title}" and its lessons have been successfully deleted.`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete section.');
        }
    };

    // Save Lesson (Create POST or Edit PUT)
    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        const { sectionId, lessonToEdit, title: lTitle, contentType, contentUrl, textContent } = lessonModal;

        if (!lTitle.trim()) {
            setLessonModal((prev) => ({ ...prev, error: 'Lesson title is required.' }));
            return;
        }

        setLessonModal((prev) => ({ ...prev, submitting: true, error: null }));
        setError(null);

        const currentSection = sections.find((s) => s.id === sectionId);
        const position = lessonToEdit ? lessonToEdit.position : (currentSection?.lessons?.length || 0);

        const requestBody = {
            title: lTitle.trim(),
            position,
            contentType,
            contentUrl: contentUrl.trim() || null,
            textContent: textContent.trim() || null
        };

        try {
            if (lessonToEdit) {
                // Edit PUT request
                const { data: updatedLesson } = await api.put<Lesson>(
                    `/api/v1/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonToEdit.id}`,
                    requestBody
                );

                setSections((prev) =>
                    prev.map((s) => {
                        if (s.id === sectionId) {
                            return {
                                ...s,
                                lessons: s.lessons?.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)) || []
                            };
                        }
                        return s;
                    })
                );
                setSuccessMessage(`Lesson "${updatedLesson.title}" updated successfully.`);
            } else {
                // Create POST request
                const { data: newLesson } = await api.post<Lesson>(
                    `/api/v1/instructor/courses/${courseId}/sections/${sectionId}/lessons`,
                    requestBody
                );

                setSections((prev) =>
                    prev.map((s) => {
                        if (s.id === sectionId) {
                            return {
                                ...s,
                                lessons: [...(s.lessons || []), newLesson]
                            };
                        }
                        return s;
                    })
                );
                setSuccessMessage(`Lesson "${newLesson.title}" created successfully.`);
            }

            // Close modal
            setLessonModal({
                show: false,
                sectionId: 0,
                title: '',
                contentType: 'VIDEO',
                contentUrl: '',
                textContent: '',
                error: null,
                submitting: false
            });
        } catch (err: any) {
            setLessonModal((prev) => ({
                ...prev,
                submitting: false,
                error: err.response?.data?.message || 'Failed to save lesson.'
            }));
        }
    };

    // Delete Lesson (DELETE)
    const handleDeleteLesson = async () => {
        if (!lessonToDelete) return;
        const { lesson, sectionId } = lessonToDelete;

        setError(null);
        try {
            await api.delete(`/api/v1/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lesson.id}`);

            setSections((prev) =>
                prev.map((s) => {
                    if (s.id === sectionId) {
                        return {
                            ...s,
                            lessons: s.lessons?.filter((l) => l.id !== lesson.id) || []
                        };
                    }
                    return s;
                })
            );
            setLessonToDelete(null);
            setSuccessMessage(`Lesson "${lesson.title}" successfully deleted.`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete lesson.');
        }
    };

    // Style helper for course status badge
    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'ARCHIVED':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'DRAFT':
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    // Helper for lesson icon based on type
    const getLessonIcon = (type: LessonContentType) => {
        switch (type) {
            case 'VIDEO':
                return <Play className="h-4 w-4 text-rose-500" />;
            case 'PDF':
                return <File className="h-4 w-4 text-emerald-500" />;
            case 'EXTERNAL_LINK':
                return <LinkIcon className="h-4 w-4 text-sky-500" />;
            case 'ATTACHMENT':
                return <Paperclip className="h-4 w-4 text-indigo-500" />;
            case 'TEXT':
            default:
                return <FileSignature className="h-4 w-4 text-amber-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium animate-pulse">Loading course builder workspace...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="max-w-2xl mx-auto my-12 bg-rose-50 border border-rose-100 p-8 rounded-2xl text-center shadow-sm">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-rose-900">Course Workspace Error</h2>
                <p className="text-rose-600 mt-2">{error || 'Could not find the specified course details.'}</p>
                <Link to="/instructor/courses" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            {/* Breadcrumb back */}
            <div className="mb-6">
                <Link
                    to="/instructor/courses"
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course Dashboard
                </Link>
            </div>

            {/* Header / Workflow Dashboard */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusBadgeStyle(course.status)}`}>
                            {course.status}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Category: <strong className="text-slate-700">{course.categoryName}</strong> · Level: <strong className="text-slate-700">{course.level}</strong>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Publish Workflow */}
                    {course.status === 'DRAFT' && (
                        <button
                            type="button"
                            onClick={() => setConfirmModal({ show: true, type: 'publish' })}
                            disabled={submittingStatus}
                            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold rounded-lg transition shadow-sm hover:shadow"
                        >
                            {submittingStatus && confirmModal.type === 'publish' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Publish Course
                        </button>
                    )}

                    {/* Archive Workflow */}
                    {course.status !== 'ARCHIVED' && (
                        <button
                            type="button"
                            onClick={() => setConfirmModal({ show: true, type: 'archive' })}
                            disabled={submittingStatus}
                            className="inline-flex items-center px-4 py-2.5 border border-amber-200 hover:border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-700 text-sm font-semibold rounded-lg transition shadow-xs"
                        >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Course
                        </button>
                    )}
                </div>
            </div>

            {/* Success Notification */}
            {successMessage && (
                <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-emerald-800">Success</h3>
                        <p className="text-xs text-emerald-600 mt-1">{successMessage}</p>
                    </div>
                </div>
            )}

            {/* Error Notification */}
            {error && (
                <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-rose-800">Workflow Error</h3>
                        <p className="text-xs text-rose-600 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Workspace Tabs Header */}
            <div className="border-b border-slate-200 mb-8 flex space-x-8">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                        activeTab === 'info'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Settings className="h-4 w-4" />
                    <span>Course Info & Setup</span>
                </button>
                <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`pb-4 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                        activeTab === 'curriculum'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Layers className="h-4 w-4" />
                    <span>Curriculum Builder</span>
                </button>
            </div>

            {/* Tab 1 Content: Course Settings Form */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Settings Panel */}
                    <div className="lg:col-span-2 bg-white border border-slate-150 rounded-2xl shadow-sm p-6 md:p-8">
                        <form onSubmit={handleSaveChanges} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">General Details</h3>
                                <p className="text-sm text-slate-500">Edit your core course configurations. Changes will sync immediately to the database.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Course Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all ${
                                        validationErrors.title ? 'border-rose-300 ring-rose-500/10' : 'border-slate-200'
                                    }`}
                                />
                                {validationErrors.title && <span className="text-xs text-rose-500 font-medium">{validationErrors.title}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all resize-y ${
                                        validationErrors.description ? 'border-rose-300 ring-rose-500/10' : 'border-slate-200'
                                    }`}
                                />
                                {validationErrors.description && <span className="text-xs text-rose-500 font-medium">{validationErrors.description}</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Category</label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        disabled={categoriesLoading}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">Difficulty Level</label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value as CourseLevel)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all cursor-pointer"
                                    >
                                        <option value="BEGINNER">Beginner</option>
                                        <option value="INTERMEDIATE">Intermediate</option>
                                        <option value="ADVANCED">Advanced</option>
                                        <option value="ALL_LEVELS">All Levels</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Thumbnail URL</label>
                                <input
                                    type="url"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/photo-xxx"
                                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all ${
                                        validationErrors.thumbnailUrl ? 'border-rose-300 ring-rose-500/10' : 'border-slate-200'
                                    }`}
                                />
                                {validationErrors.thumbnailUrl && <span className="text-xs text-rose-500 font-medium">{validationErrors.thumbnailUrl}</span>}
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg text-sm flex items-center space-x-2 cursor-pointer"
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Syncing Changes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Info Card Panel */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Course Preview Card</h3>
                            
                            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-xs bg-slate-50/50">
                                <div className="h-44 bg-slate-900 relative">
                                    {thumbnailUrl ? (
                                        <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-900 text-white p-4">
                                            <BookOpen className="h-6 w-6 text-indigo-300 mb-2" />
                                            <span className="text-xs font-semibold uppercase">Learnova Preview</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 ring-indigo-600/10 ring-1">
                                            {level}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white space-y-2">
                                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                        {categories.find(c => c.id === Number(categoryId))?.name || 'N/A'}
                                    </span>
                                    <h4 className="font-bold text-slate-900 line-clamp-2">{title || 'Untitled Course'}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 space-y-4">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-indigo-500" />
                                <span>Course Statistics</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-2xs">
                                    <span className="text-2xl font-bold text-slate-800">{course.sectionCount}</span>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">Sections</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-2xs">
                                    <span className="text-2xl font-bold text-slate-800">{course.lessonCount}</span>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">Lessons</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2 Content: Nested Section & Lesson CRUD Workspace */}
            {activeTab === 'curriculum' && (
                <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 md:p-8 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900">Curriculum Builder Workspace</h3>
                            <p className="text-sm text-slate-500 mt-1">Organize your course sections and populate them with text, external link, or video lessons.</p>
                        </div>
                        
                        {!isAddingSection && (
                            <button
                                onClick={() => setIsAddingSection(true)}
                                className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition shadow-sm cursor-pointer"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add New Section
                            </button>
                        )}
                    </div>

                    {/* Section Add Inline Mode */}
                    {isAddingSection && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 mb-8 animate-in slide-in-from-top-4 duration-300">
                            <h4 className="text-sm font-bold text-slate-800 mb-3">Add New Section Chapter</h4>
                            <form onSubmit={handleCreateSection} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={newSectionTitle}
                                    onChange={(e) => setNewSectionTitle(e.target.value)}
                                    placeholder="Enter section title (e.g. Getting Started, Advanced Hooks)..."
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white"
                                    required
                                />
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="submit"
                                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition cursor-pointer"
                                    >
                                        Add Section
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddingSection(false);
                                            setNewSectionTitle('');
                                        }}
                                        className="px-4 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-sm font-semibold rounded-lg transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Section List Loading state */}
                    {sectionsLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-3">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                            <p className="text-slate-400 font-medium">Fetching curriculum structure...</p>
                        </div>
                    ) : sections.length === 0 ? (
                        /* Empty Placeholder State */
                        <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl text-center max-w-xl mx-auto p-8 flex flex-col items-center">
                            <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-4">
                                <Layers className="h-8 w-8" />
                            </div>
                            <h4 className="text-base font-bold text-slate-900">Build Your Structure</h4>
                            <p className="text-slate-500 text-sm mt-1 max-w-sm">This course doesn't have sections yet. Click below to add your first chapter!</p>
                            <button
                                onClick={() => setIsAddingSection(true)}
                                className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Your First Section
                            </button>
                        </div>
                    ) : (
                        /* Accordion Stack of Sections */
                        <div className="space-y-4">
                            {sections.map((section, idx) => {
                                const isExpanded = !!expandedSectionIds[section.id];
                                const isEditingSection = editingSectionId === section.id;
                                
                                return (
                                    <div
                                        key={section.id}
                                        className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs transition-all bg-white"
                                    >
                                        {/* Section Header */}
                                        <div className="px-5 py-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                                            {isEditingSection ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editingSectionTitle}
                                                        onChange={(e) => setEditingSectionTitle(e.target.value)}
                                                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 bg-white text-sm"
                                                        required
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateSection(section)}
                                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded cursor-pointer"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingSectionId(null);
                                                            setEditingSectionTitle('');
                                                        }}
                                                        className="px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold rounded cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex items-center space-x-3 cursor-pointer flex-1"
                                                    onClick={() => toggleSection(section.id)}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-5 w-5 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-slate-400" />
                                                    )}
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-800 text-base">
                                                            Section {idx + 1}: {section.title}
                                                        </h4>
                                                        <span className="text-xs text-slate-400 font-medium">
                                                            {section.lessons?.length || 0} Lessons
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {!isEditingSection && (
                                                <div className="flex items-center space-x-2">
                                                    {/* Edit Section */}
                                                    <button
                                                        onClick={() => {
                                                            setEditingSectionId(section.id);
                                                            setEditingSectionTitle(section.title);
                                                        }}
                                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                                        title="Edit Section Title"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    
                                                    {/* Delete Section */}
                                                    <button
                                                        onClick={() => setSectionToDelete(section)}
                                                        className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                        title="Delete Section"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Nested Section Content: Lesson lists */}
                                        {isExpanded && (
                                            <div className="p-5 bg-white space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                {(!section.lessons || section.lessons.length === 0) ? (
                                                    <div className="py-6 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-150">
                                                        <Play className="h-5 w-5 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-xs text-slate-400 font-medium">No lessons added to this section yet.</p>
                                                    </div>
                                                ) : (
                                                    <div className="border border-slate-150 rounded-lg divide-y divide-slate-100">
                                                        {section.lessons.map((lesson, lIdx) => (
                                                            <div
                                                                key={lesson.id}
                                                                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    {getLessonIcon(lesson.contentType)}
                                                                    <div>
                                                                        <h5 className="text-sm font-semibold text-slate-800">
                                                                            {lIdx + 1}. {lesson.title}
                                                                        </h5>
                                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                                            {lesson.contentType}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center space-x-1.5">
                                                                    {/* Edit Lesson */}
                                                                    <button
                                                                        onClick={() => setLessonModal({
                                                                            show: true,
                                                                            sectionId: section.id,
                                                                            lessonToEdit: lesson,
                                                                            title: lesson.title,
                                                                            contentType: lesson.contentType,
                                                                            contentUrl: lesson.contentUrl || '',
                                                                            textContent: lesson.textContent || '',
                                                                            error: null,
                                                                            submitting: false
                                                                        })}
                                                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                                                        title="Edit Lesson"
                                                                    >
                                                                        <Edit3 className="h-3.5 w-3.5" />
                                                                    </button>

                                                                    {/* Delete Lesson */}
                                                                    <button
                                                                        onClick={() => setLessonToDelete({ lesson, sectionId: section.id })}
                                                                        className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                                        title="Delete Lesson"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add Lesson button inside section panel */}
                                                <div className="flex justify-start">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLessonModal({
                                                            show: true,
                                                            sectionId: section.id,
                                                            title: '',
                                                            contentType: 'VIDEO',
                                                            contentUrl: '',
                                                            textContent: '',
                                                            error: null,
                                                            submitting: false
                                                        })}
                                                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold rounded-lg transition cursor-pointer"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" /> Add Lesson to Section
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modals (Course workflows) */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-bold text-slate-900 capitalize">
                                {confirmModal.type === 'publish' ? 'Publish Course' : 'Archive Course'}
                            </h3>
                            <button
                                onClick={() => setConfirmModal({ show: false, type: 'publish' })}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="mt-3 text-sm text-slate-500 space-y-2 leading-relaxed">
                            {confirmModal.type === 'publish' ? (
                                <p>Are you sure you want to publish <strong>"{course.title}"</strong>? This will make the course active and visible to all registered learners on Learnova.</p>
                            ) : (
                                <p>Are you sure you want to archive <strong>"{course.title}"</strong>? Once archived, the course will be retired and no longer open for active enrollments.</p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setConfirmModal({ show: false, type: 'publish' })}
                                className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusTransition}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition shadow-sm ${
                                    confirmModal.type === 'publish'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-amber-600 hover:bg-amber-700'
                                }`}
                            >
                                Confirm {confirmModal.type === 'publish' ? 'Publication' : 'Archive'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Delete Confirmation Modal */}
            {sectionToDelete && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-bold text-rose-900 flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-rose-500 animate-pulse" />
                                Delete Section Chapter
                            </h3>
                            <button
                                onClick={() => setSectionToDelete(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="mt-3 text-sm text-slate-500 leading-relaxed">
                            <p>Are you sure you want to delete section <strong>"{sectionToDelete.title}"</strong>?</p>
                            <p className="text-xs text-rose-600 font-semibold mt-2">Warning: This action will permanently remove all lessons nested inside this section. This cannot be undone.</p>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setSectionToDelete(null)}
                                className="px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSection}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-sm font-semibold rounded-lg text-white transition cursor-pointer"
                            >
                                Delete Section
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lesson Add/Edit Modal */}
            {lessonModal.show && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-slate-900">
                                {lessonModal.lessonToEdit ? 'Edit Lesson' : 'Add New Lesson'}
                            </h3>
                            <button
                                onClick={() => setLessonModal((prev) => ({ ...prev, show: false }))}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveLesson} className="mt-4 space-y-4">
                            {lessonModal.error && (
                                <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-600 font-medium flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2 text-rose-500" />
                                    {lessonModal.error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">Lesson Title</label>
                                <input
                                    type="text"
                                    value={lessonModal.title}
                                    onChange={(e) => setLessonModal((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter lesson title..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-700">Content Type</label>
                                <select
                                    value={lessonModal.contentType}
                                    onChange={(e) => setLessonModal((prev) => ({ ...prev, contentType: e.target.value as LessonContentType }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm"
                                >
                                    <option value="VIDEO">Video Lecture</option>
                                    <option value="PDF">PDF Reader</option>
                                    <option value="TEXT">Text Article</option>
                                    <option value="EXTERNAL_LINK">External Web Link</option>
                                    <option value="ATTACHMENT">Resource File Attachment</option>
                                </select>
                            </div>

                            {(lessonModal.contentType === 'VIDEO' || lessonModal.contentType === 'EXTERNAL_LINK' || lessonModal.contentType === 'PDF' || lessonModal.contentType === 'ATTACHMENT') && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-700">Resource URL / Attachment Path</label>
                                    <input
                                        type="text"
                                        value={lessonModal.contentUrl}
                                        onChange={(e) => setLessonModal((prev) => ({ ...prev, contentUrl: e.target.value }))}
                                        placeholder="https://example.com/file.mp4"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm"
                                    />
                                </div>
                            )}

                            {lessonModal.contentType === 'TEXT' && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-700">Text Content</label>
                                    <textarea
                                        value={lessonModal.textContent}
                                        onChange={(e) => setLessonModal((prev) => ({ ...prev, textContent: e.target.value }))}
                                        rows={4}
                                        placeholder="Type your markdown or lesson text details here..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm resize-y"
                                    />
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setLessonModal((prev) => ({ ...prev, show: false }))}
                                    className="px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={lessonModal.submitting}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-sm font-semibold rounded-lg text-white transition flex items-center cursor-pointer"
                                >
                                    {lessonModal.submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    {lessonModal.lessonToEdit ? 'Save Changes' : 'Create Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lesson Delete Confirmation Modal */}
            {lessonToDelete && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-bold text-rose-900">
                                Delete Lesson
                            </h3>
                            <button
                                onClick={() => setLessonToDelete(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="mt-3 text-sm text-slate-500">
                            <p>Are you sure you want to delete lesson <strong>"{lessonToDelete.lesson.title}"</strong>?</p>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setLessonToDelete(null)}
                                className="px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteLesson}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-sm font-semibold rounded-lg text-white transition cursor-pointer"
                            >
                                Delete Lesson
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
