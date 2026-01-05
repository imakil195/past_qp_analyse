'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UploadFormProps {
    existingSubjects?: { id: string; name: string }[];
}

export default function UploadForm({ existingSubjects = [] }: UploadFormProps) {
    const router = useRouter();
    const [subjectName, setSubjectName] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isNewSubject, setIsNewSubject] = useState(true);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'new') {
            setIsNewSubject(true);
            setSelectedSubjectId('');
            setSubjectName('');
        } else {
            setIsNewSubject(false);
            setSelectedSubjectId(val);
            // Find name for display/logic if needed, but ID is enough for backend
            const sub = existingSubjects.find(s => s.id === val);
            if (sub) setSubjectName(sub.name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || !year) {
            setError('Please provide a file and year');
            return;
        }

        if (isNewSubject && !subjectName.trim()) {
            setError('Please enter a subject name');
            return;
        }

        if (!isNewSubject && !selectedSubjectId) {
            setError('Please select a subject');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('year', year);

        if (isNewSubject) {
            formData.append('subjectName', subjectName);
        } else {
            formData.append('subjectId', selectedSubjectId);
            // Also send name just in case backend needs it for display, but ID takes precedence
            formData.append('subjectName', subjectName);
        }

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setSuccess('Analysis complete! Redirecting...');

            // Redirect to analysis page for this subject
            setTimeout(() => {
                router.push(`/analysis/${data.subjectId}`);
            }, 1500);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden"
        >
            <div className="p-8 border-b border-border/50 bg-background/50 backdrop-blur-sm">
                <h2 className="text-2xl font-semibold text-foreground">Upload Question Paper</h2>
                <p className="text-muted-foreground mt-1">Upload a PDF to extract insights instantly.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-background">

                {/* Subject Selection */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                    <div className="space-y-3">
                        {existingSubjects.length > 0 && (
                            <select
                                onChange={handleSubjectSelect}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                            >
                                <option value="new">+ Create New Subject</option>
                                {existingSubjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}

                        {isNewSubject && (
                            <input
                                type="text"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                placeholder="Enter Subject Name (e.g. Operating Systems)"
                                className="w-full px-4 py-3 rounded-xl bg-secondary border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                autoFocus
                            />
                        )}
                    </div>
                </div>

                {/* Year Input */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Year</label>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="e.g. 2023"
                        className="w-full px-4 py-3 rounded-xl bg-secondary border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                </div>

                {/* File Dropzone */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Question Paper (PDF)</label>
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group
          ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/50'}
        `}
                    >
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        {file ? (
                            <div className="flex flex-col items-center text-primary">
                                <CheckCircle className="w-10 h-10 mb-2" />
                                <span className="font-medium text-foreground">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                                <UploadCloud className="w-10 h-10 mb-3" />
                                <span className="font-medium">Click to upload or drag & drop</span>
                                <span className="text-xs mt-1">PDF files only</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 rounded-xl bg-green-50 text-green-600 text-sm font-medium border border-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30">
                        {success}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            Analyze Papers
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </button>

            </form>
        </motion.div>
    );
}
