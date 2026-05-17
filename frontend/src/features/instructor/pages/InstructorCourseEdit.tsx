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
    Eye,
    Archive,
    Check,
    HelpCircle,
    Plus,
    X,
    Lock
} from 'lucide-react';
import api from '../../../api/axios';
import type { CourseResponse, CourseLevel } from '../../../types/course';

interface Category {
    id: number;
    name: string;
    description?: string;
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

    // Form fields state
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

    // Modal Confirmation states
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        type: 'publish' | 'archive';
    }>({ show: false, type: 'publish' });

    // Fetch initial data
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

    // Client-side validations
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

    // Update Core Metadata
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

    // Execute publish/archive status transition
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
                    <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                        Placeholder
                    </span>
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

            {/* Tab 2 Content: Curriculum Placeholder */}
            {activeTab === 'curriculum' && (
                <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-12 text-center max-w-xl mx-auto flex flex-col items-center">
                    <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-6">
                        <Layers className="h-10 w-10 animate-bounce" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Curriculum Builder</h2>
                    <p className="text-gray-500 mt-2 max-w-md leading-relaxed text-sm">
                        Design modules, structure lessons, and order your content. 
                        Curriculum sections and lessons management coming next in Issue <strong>#40/#41</strong>.
                    </p>
                    <div className="mt-8 border border-slate-100 bg-slate-50 rounded-xl p-4 w-full text-left space-y-3">
                        <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Preview Mode enabled. Upcoming elements include:</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                            <span>Modular Curriculum Sections</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                            <span>Interactive Video & Document Lessons</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
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
        </div>
    );
}
