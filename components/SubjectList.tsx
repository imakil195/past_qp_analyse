'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle, FileText, ArrowRight, Trash2, Settings2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SubjectStat {
    _id: string;
    name: string;
    code: string;
    paperCount: number;
    questionCount: number;
    lastUpdated?: Date;
}

export default function SubjectList({ subjects }: { subjects: SubjectStat[] }) {
    const router = useRouter();
    const [isManageMode, setIsManageMode] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Prevent navigation
        if (!confirm('Are you sure you want to delete this subject? All papers and questions will be lost forever.')) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            router.refresh();
        } catch (err) {
            alert('Could not delete subject');
        } finally {
            setDeletingId(null);
        }
    };

    if (subjects.length === 0) {
        return (
            <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No subjects yet</h3>
                <p className="text-muted-foreground mt-1">Upload a question paper to create your first subject.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setIsManageMode(!isManageMode)}
                    className={`flex items-center text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                        ${isManageMode ? 'bg-red-50 text-red-600' : 'bg-secondary text-muted-foreground hover:text-foreground'}
                    `}
                >
                    {isManageMode ? (
                        <> <X className="w-3.5 h-3.5 mr-1" /> Done </>
                    ) : (
                        <> <Settings2 className="w-3.5 h-3.5 mr-1" /> Manage </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {subjects.map((sub, i) => (
                    <motion.div
                        key={sub._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                    >
                        <Link href={`/analysis/${sub._id}`} className={`block h-full group ${isManageMode ? 'pointer-events-none' : ''}`}>
                            <div className="bg-card border border-border/50 rounded-2xl p-6 h-full shadow-sm hover:shadow-md hover:border-primary/30 transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <BookOpen className="w-32 h-32" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="font-bold text-lg">{sub.name.charAt(0)}</span>
                                        </div>
                                        <span className="px-2 py-1 bg-secondary rounded-md text-xs font-mono text-muted-foreground">{sub.code}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{sub.name}</h3>

                                    <div className="flex gap-4 mt-6 text-sm text-muted-foreground">
                                        <div className="flex items-center">
                                            <FileText className="w-4 h-4 mr-1.5" />
                                            {sub.paperCount} Papers
                                        </div>
                                        <div className="flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1.5" />
                                            {sub.questionCount} Qs
                                        </div>
                                    </div>

                                    {!isManageMode && (
                                        <div className="mt-6 flex items-center text-primary font-medium text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                            View Analysis <ArrowRight className="w-4 h-4 ml-1" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>

                        {/* Delete Overlay Button */}
                        {isManageMode && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => handleDelete(e, sub._id)}
                                disabled={deletingId === sub._id}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20 pointer-events-auto cursor-pointer"
                            >
                                {deletingId === sub._id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </motion.button>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
