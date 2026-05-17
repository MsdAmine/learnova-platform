import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    Layers,
    AlertCircle,
    CheckCircle,
    Loader2,
    Sparkles,
    Check
} from 'lucide-react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import type { CourseLevel } from '../../../types/course';

interface Category {
    id: number;
    name: string;
    description?: string;
}

export default function InstructorCourseCreate() {
    const navigate = useNavigate();
    const { user, activeProfile } = useAuth();

    // Steps state: 1 = Basic Info, 2 = Details, 3 = Review
    const [step, setStep] = useState(1);
    
    // Form fields state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [level, setLevel] = useState<CourseLevel>('BEGINNER');
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    // Metadata states
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Error / Validation states
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Fetch categories on mount
    useEffect(() => {
        async function fetchCategories() {
            try {
                const { data } = await api.get<Category[]>('/api/v1/categories');
                setCategories(data);
            } catch (err: any) {
                console.error('Failed to fetch categories:', err);
                setError('Failed to fetch categories. Please refresh the page.');
            } finally {
                setCategoriesLoading(false);
            }
        }
        fetchCategories();
    }, []);

    // Instant client-side validation
    const validateStep = (currentStep: number): boolean => {
        const errors: Record<string, string> = {};
        
        if (currentStep === 1) {
            if (!title.trim()) {
                errors.title = 'Course title is required.';
            } else if (title.length > 200) {
                errors.title = 'Title cannot exceed 200 characters.';
            }
            
            if (!categoryId) {
                errors.categoryId = 'Please select a course category.';
            }
        }

        if (currentStep === 2) {
            if (description.length > 2000) {
                errors.description = 'Description cannot exceed 2000 characters.';
            }
            if (thumbnailUrl && thumbnailUrl.length > 500) {
                errors.thumbnailUrl = 'Thumbnail URL cannot exceed 500 characters.';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((prev) => prev + 1);
            setError(null);
        }
    };

    const handleBack = () => {
        setStep((prev) => prev - 1);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final complete validation
        if (!validateStep(1) || !validateStep(2)) {
            setStep(1); // jump to the step with errors
            return;
        }

        setSubmitting(true);
        setError(null);

        const requestBody = {
            title: title.trim(),
            description: description.trim() || undefined,
            categoryId: Number(categoryId),
            level,
            thumbnailUrl: thumbnailUrl.trim() || undefined
        };

        try {
            await api.post('/api/v1/instructor/courses', requestBody);
            // Success transition
            setSubmitting(false);
            // Redirect back to courses list
            navigate('/instructor/courses');
        } catch (err: any) {
            setSubmitting(false);
            if (err.response?.status === 409) {
                setError('You already have a course with this title. Please choose a unique title.');
                setStep(1); // Put them back on the title page
            } else {
                setError(err.response?.data?.message || 'An unexpected error occurred while creating the course. Please try again.');
            }
        }
    };

    // Calculate dynamic category name for preview
    const selectedCategoryName = categories.find(c => c.id === Number(categoryId))?.name || 'N/A';

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            {/* Back to courses link */}
            <div className="mb-6">
                <Link
                    to="/instructor/courses"
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course Listing
                </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-2">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shadow-sm">
                        <Sparkles className="h-6 w-6" />
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Create a New Course
                    </h1>
                </div>
                <p className="text-slate-500">
                    Design a premium learning experience. Fill in details to initialize your course curriculum builder.
                </p>
            </div>

            {/* Step Indicator */}
            <div className="mb-8 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    {/* Step 1 */}
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-300 ${
                            step >= 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                        }`}>
                            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
                        </div>
                        <span className={`text-sm font-medium transition-colors duration-300 ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                            Basic Info
                        </span>
                    </div>

                    <div className="flex-1 h-0.5 mx-4 bg-slate-100 relative">
                        <div className={`absolute left-0 top-0 h-full bg-indigo-600 transition-all duration-500`} style={{ width: step > 1 ? '100%' : '0%' }}></div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-300 ${
                            step >= 2 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                        }`}>
                            {step > 2 ? <Check className="h-4 w-4" /> : '2'}
                        </div>
                        <span className={`text-sm font-medium transition-colors duration-300 ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                            Course Details
                        </span>
                    </div>

                    <div className="flex-1 h-0.5 mx-4 bg-slate-100 relative">
                        <div className={`absolute left-0 top-0 h-full bg-indigo-600 transition-all duration-500`} style={{ width: step > 2 ? '100%' : '0%' }}></div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-300 ${
                            step === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                        }`}>
                            3
                        </div>
                        <span className={`text-sm font-medium transition-colors duration-300 ${step === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                            Review & Create
                        </span>
                    </div>
                </div>
            </div>

            {/* Error Notification */}
            {error && (
                <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-rose-800">Action Required</h3>
                        <p className="text-xs text-rose-600 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Main Form container */}
            <form onSubmit={handleSubmit} className="bg-white border border-slate-150 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="p-6 md:p-8">
                    {/* Step 1 Content */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Course Identity</h2>
                                <p className="text-sm text-slate-500">Pick a clear, professional title and category for your course.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Course Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        if (validationErrors.title) {
                                            setValidationErrors(prev => ({ ...prev, title: '' }));
                                        }
                                    }}
                                    placeholder="e.g. Master Modern Java Development from Scratch"
                                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all ${
                                        validationErrors.title ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
                                    }`}
                                />
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-rose-500 font-medium">{validationErrors.title}</span>
                                    <span className={`font-semibold ${title.length > 200 ? 'text-rose-500' : 'text-slate-400'}`}>
                                        {title.length}/200
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Category <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={categoryId}
                                        onChange={(e) => {
                                            setCategoryId(e.target.value);
                                            if (validationErrors.categoryId) {
                                                setValidationErrors(prev => ({ ...prev, categoryId: '' }));
                                            }
                                        }}
                                        disabled={categoriesLoading}
                                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all appearance-none cursor-pointer ${
                                            validationErrors.categoryId ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
                                        }`}
                                    >
                                        <option value="">-- Choose Category --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                        {categoriesLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Layers className="h-4 w-4" />
                                        )}
                                    </div>
                                </div>
                                {validationErrors.categoryId && (
                                    <span className="text-xs text-rose-500 font-medium">{validationErrors.categoryId}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2 Content */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Course Details</h2>
                                <p className="text-sm text-slate-500">Provide an engaging description and select the targeting difficulty level.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        if (validationErrors.description) {
                                            setValidationErrors(prev => ({ ...prev, description: '' }));
                                        }
                                    }}
                                    rows={6}
                                    placeholder="Describe what your students will learn, the prerequisites, and the objectives..."
                                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all resize-y ${
                                        validationErrors.description ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
                                    }`}
                                />
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-rose-500 font-medium">{validationErrors.description}</span>
                                    <span className={`font-semibold ${description.length > 2000 ? 'text-rose-500' : 'text-slate-400'}`}>
                                        {description.length}/2000
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Difficulty Level <span className="text-rose-500">*</span>
                                    </label>
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

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Thumbnail URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={thumbnailUrl}
                                        onChange={(e) => {
                                            setThumbnailUrl(e.target.value);
                                            if (validationErrors.thumbnailUrl) {
                                                setValidationErrors(prev => ({ ...prev, thumbnailUrl: '' }));
                                            }
                                        }}
                                        placeholder="e.g. https://images.unsplash.com/photo-xxx"
                                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-900 bg-slate-50/50 transition-all ${
                                            validationErrors.thumbnailUrl ? 'border-rose-300 ring-rose-500/10 ring-2' : 'border-slate-200'
                                        }`}
                                    />
                                    {validationErrors.thumbnailUrl && (
                                        <span className="text-xs text-rose-500 font-medium">{validationErrors.thumbnailUrl}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 Content */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Review Your Course Settings</h2>
                                <p className="text-sm text-slate-500">Double-check details before launching the course curriculum builder.</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 space-y-4">
                                <div className="grid grid-cols-3 border-b border-slate-200/60 pb-3">
                                    <span className="text-sm font-semibold text-slate-500 col-span-1">Title</span>
                                    <span className="text-sm font-bold text-slate-900 col-span-2">{title}</span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-200/60 pb-3">
                                    <span className="text-sm font-semibold text-slate-500 col-span-1">Category</span>
                                    <span className="text-sm font-medium text-slate-800 col-span-2 flex items-center">
                                        <Layers className="h-4 w-4 mr-2 text-indigo-500" />
                                        {selectedCategoryName}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-200/60 pb-3">
                                    <span className="text-sm font-semibold text-slate-500 col-span-1">Level</span>
                                    <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded col-span-2 w-max">
                                        {level}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-sm font-semibold text-slate-500 col-span-1">Description</span>
                                    <span className="text-sm text-slate-600 col-span-2 line-clamp-3 italic">
                                        {description || 'No description provided.'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-sm">
                                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                <span>
                                    Upon creation, this course will initialize in <strong>DRAFT</strong> status. You can then add curriculum modules, upload video lectures, and publish whenever you are ready!
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex items-center justify-between">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={submitting}
                            className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium rounded-lg transition shadow-sm hover:shadow text-sm disabled:opacity-50"
                        >
                            Back
                        </button>
                    ) : (
                        <Link
                            to="/instructor/courses"
                            className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium rounded-lg transition shadow-sm hover:shadow text-sm inline-block"
                        >
                            Cancel
                        </Link>
                    )}

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-md hover:shadow-lg text-sm"
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={submitting || categoriesLoading}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg text-sm flex items-center space-x-2 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Creating Course...</span>
                                </>
                            ) : (
                                <>
                                    <BookOpen className="h-4 w-4" />
                                    <span>Create & Launch Builder</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
