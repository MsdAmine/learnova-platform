import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutGrid,
    List,
    Plus,
    BookOpen,
    Layers,
    MoreVertical,
    Edit,
    CheckCircle2,
    Archive,
    RotateCcw,
    AlertTriangle,
    TrendingUp,
    Search,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import { useInstructorCourses } from '../hooks/useInstructorCourses';
import type { CourseResponse, CourseStatus } from '../../../types/course';

export default function InstructorCourseList() {
    const {
        courses,
        loading,
        error,
        page,
        totalPages,
        totalElements,
        setPage,
        retry,
        publishCourse,
        archiveCourse
    } = useInstructorCourses(0, 8);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

    // Modal Confirmation States
    const [confirmModal, setConfirmModal] = useState<{
        type: 'publish' | 'archive';
        course: CourseResponse | null;
    }>({ type: 'publish', course: null });

    // Handle course actions
    const handleActionClick = (e: React.MouseEvent, type: 'publish' | 'archive', course: CourseResponse) => {
        e.stopPropagation();
        setConfirmModal({ type, course });
        setActiveDropdown(null);
    };

    const executeConfirmedAction = async () => {
        const { type, course } = confirmModal;
        if (!course) return;

        try {
            if (type === 'publish') {
                await publishCourse(course.id);
            } else if (type === 'archive') {
                await archiveCourse(course.id);
            }
        } catch (err: any) {
            alert(err.message || `Failed to ${type} course.`);
        } finally {
            setConfirmModal({ type: 'publish', course: null });
        }
    };

    // Derived statistics
    const totalCount = totalElements;
    const publishedCount = courses.filter((c) => c.status === 'PUBLISHED').length;
    const draftCount = courses.filter((c) => c.status === 'DRAFT').length;
    const archivedCount = courses.filter((c) => c.status === 'ARCHIVED').length;

    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || course.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: CourseStatus) => {
        switch (status) {
            case 'PUBLISHED':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
            case 'ARCHIVED':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20';
            case 'DRAFT':
            default:
                return 'bg-gray-100 text-gray-700 ring-gray-600/20';
        }
    };

    const getLevelStyle = (level: string) => {
        switch (level) {
            case 'ADVANCED':
                return 'bg-rose-50 text-rose-700 ring-rose-600/10';
            case 'INTERMEDIATE':
                return 'bg-indigo-50 text-indigo-700 ring-indigo-600/10';
            case 'BEGINNER':
            default:
                return 'bg-sky-50 text-sky-700 ring-sky-600/10';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 font-sans">
                        Instructor Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage your courses and track your student performance.
                    </p>
                </div>
                <Link
                    to="/instructor/courses/create"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition shadow-md w-full md:w-auto"
                >
                    <Plus className="h-5 w-5 mr-2 -ml-1" />
                    Create Your First Course
                </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Total Courses</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalCount}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Published</p>
                        <h3 className="text-2xl font-bold text-gray-900">{publishedCount}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                        <Edit className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Drafts</p>
                        <h3 className="text-2xl font-bold text-gray-900">{draftCount}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <Archive className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Archived</p>
                        <h3 className="text-2xl font-bold text-gray-900">{archivedCount}</h3>
                    </div>
                </div>
            </div>

            {/* Filters & View Toggles */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50/50"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>
                <div className="flex items-center border border-gray-200 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <List className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl mb-6 flex items-start justify-between">
                    <div className="flex space-x-3">
                        <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-rose-800">Error Loading Courses</h3>
                            <p className="text-xs text-rose-600 mt-1">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={retry}
                        className="inline-flex items-center px-3 py-1.5 border border-rose-300 text-xs font-semibold rounded-md text-rose-700 bg-white hover:bg-rose-50 transition"
                    >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        Try Again
                    </button>
                </div>
            )}

            {loading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm animate-pulse h-64" />
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center max-w-xl mx-auto my-12 flex flex-col items-center">
                    <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-6">
                        <TrendingUp className="h-10 w-10" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">No courses found</h2>
                    <p className="text-gray-500 mt-2">Get started and inspire your first students today!</p>
                    <Link
                        to="/instructor/courses/create"
                        className="mt-6 px-6 py-3 text-sm font-medium rounded-lg text-white bg-indigo-650 hover:bg-indigo-750 shadow-md transition inline-block"
                    >
                        Create Your First Course
                    </Link>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCourses.map((course) => (
                        <div key={course.id} className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col relative group">
                            <div className="relative h-44 bg-slate-900 overflow-hidden">
                                {course.thumbnailUrl ? (
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-900 text-white p-4">
                                        <BookOpen className="h-6 w-6 text-indigo-300 mb-2" />
                                        <span className="text-xs font-semibold uppercase">{course.categoryName}</span>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLevelStyle(course.level)}`}>{course.level}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusStyle(course.status)}`}>{course.status}</span>
                                </div>
                                <div className="absolute top-3 right-3 z-20">
                                    <button onClick={(e) => {e.stopPropagation(); setActiveDropdown(activeDropdown === course.id ? null : course.id)}} className="p-1.5 rounded-full bg-white/90 text-gray-700 hover:text-indigo-600 shadow-sm">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                    {activeDropdown === course.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-lg shadow-xl py-1 z-30">
                                            <button onClick={() => {alert('Edit coming soon'); setActiveDropdown(null)}} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                                                <Edit className="h-4 w-4 mr-2 text-gray-400" /> Edit Course
                                            </button>
                                            {course.status !== 'PUBLISHED' && (
                                                <button onClick={(e) => handleActionClick(e, 'publish', course)} className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center">
                                                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" /> Publish
                                                </button>
                                            )}
                                            {course.status !== 'ARCHIVED' && (
                                                <button onClick={(e) => handleActionClick(e, 'archive', course)} className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center">
                                                    <Archive className="h-4 w-4 mr-2 text-amber-400" /> Archive
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">{course.categoryName}</p>
                                    <h3 className="text-base font-bold text-gray-900 line-clamp-2">{course.title}</h3>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
                                    <div className="flex items-center space-x-3">
                                        <span className="flex items-center"><Layers className="h-3.5 w-3.5 mr-1" /> {course.sectionCount} {course.sectionCount === 1 ? 'Section' : 'Sections'}</span>
                                        <span className="flex items-center"><BookOpen className="h-3.5 w-3.5 mr-1" /> {course.lessonCount} {course.lessonCount === 1 ? 'Lesson' : 'Lessons'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-150">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Course</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Level</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Structure</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-150">
                            {filteredCourses.map((course) => (
                                <tr key={course.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                        <div className="h-10 w-16 rounded bg-indigo-900 flex-shrink-0 flex items-center justify-center text-white mr-4">
                                            {course.thumbnailUrl ? <img src={course.thumbnailUrl} className="w-full h-full object-cover" /> : <BookOpen className="h-4 w-4" />}
                                        </div>
                                        <div className="text-sm font-bold text-gray-900 truncate max-w-xs">{course.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{course.categoryName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-0.5 rounded text-xs font-bold ${getLevelStyle(course.level)}`}>{course.level}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusStyle(course.status)}`}>{course.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                                        {course.sectionCount} secs · {course.lessonCount} lessons
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button onClick={() => setActiveDropdown(activeDropdown === course.id ? null : course.id)} className="text-gray-400 hover:text-gray-600">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                        {activeDropdown === course.id && (
                                            <div className="absolute right-6 mt-1 w-44 bg-white border border-gray-150 rounded-lg shadow-xl py-1 z-30">
                                                <button onClick={() => alert('Edit soon')} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"><Edit className="h-4 w-4 mr-2" /> Edit</button>
                                                {course.status !== 'PUBLISHED' && <button onClick={(e) => handleActionClick(e, 'publish', course)} className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center"><CheckCircle2 className="h-4 w-4 mr-2" /> Publish</button>}
                                                {course.status !== 'ARCHIVED' && <button onClick={(e) => handleActionClick(e, 'archive', course)} className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center"><Archive className="h-4 w-4 mr-2" /> Archive</button>}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-4">
                    <p className="text-sm text-gray-500">Page {page + 1} of {totalPages}</p>
                    <nav className="inline-flex shadow-sm rounded-md overflow-hidden border border-gray-300">
                        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-2 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50 border-r border-gray-300"><ChevronLeft className="h-5 w-5" /></button>
                        <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} className="px-3 py-2 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
                    </nav>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.course && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">{confirmModal.type} Course</h3>
                            <button onClick={() => setConfirmModal({ type: 'publish', course: null })} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">Are you sure you want to {confirmModal.type} <strong>"{confirmModal.course.title}"</strong>?</p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setConfirmModal({ type: 'publish', course: null })} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                            <button onClick={executeConfirmedAction} className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${confirmModal.type === 'publish' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>Confirm {confirmModal.type}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
