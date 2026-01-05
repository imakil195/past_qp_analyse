'use client';

import { useState, useMemo } from 'react';
import { Search, Calendar, FolderOpen, Award, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Import TYPE only to avoid bundling the logic code
import type { RepeatedQuestionGroup, QuestionData } from '../lib/analyzer/repetitionAnalysis';

interface QuestionTableProps {
    questions: QuestionData[];
    topics: string[];
    years: number[];
    repeatedQuestions: RepeatedQuestionGroup[];
}

export default function QuestionTable({ questions, topics, years, repeatedQuestions }: QuestionTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('All');
    const [selectedTopic, setSelectedTopic] = useState<string>('All');
    const [showAllRepeated, setShowAllRepeated] = useState(false);

    // Filter questions based on search/filters
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const matchText = q.text.toLowerCase().includes(searchTerm.toLowerCase());
            const matchYear = selectedYear === 'All' || q.year.toString() === selectedYear;
            const matchTopic = selectedTopic === 'All' || (q.topic || 'Uncategorized') === selectedTopic;
            return matchText && matchYear && matchTopic;
        });
    }, [questions, searchTerm, selectedYear, selectedTopic]);

    // Use passed prop instead of calculating client-side
    const repeatedGroups = repeatedQuestions;

    const topRepeated = repeatedGroups.filter(g => g.count > 1).slice(0, 5);
    const hasRepeated = topRepeated.length > 0;

    return (
        <div className="space-y-8">

            {/* Main Question Bank */}
            <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden min-h-[600px]">
                {/* Controls */}
                <div className="p-4 border-b border-border/50 flex flex-col lg:flex-row gap-4 items-center justify-between bg-muted/5">
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="pl-9 pr-8 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-muted/50 transition-colors appearance-none"
                            >
                                <option value="All">All Years</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                        </div>

                        <div className="relative">
                            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="pl-9 pr-8 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-muted/50 transition-colors appearance-none max-w-[200px]"
                            >
                                <option value="All">All Topics</option>
                                {topics.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Table Header - Distinct from rows */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/40 border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-7">Question</div>
                    <div className="col-span-2 text-center">Details</div>
                    <div className="col-span-2 text-center">Topic</div>
                </div>

                {/* List Container */}
                <div className="divide-y divide-border/30">
                    <AnimatePresence mode='popLayout'>
                        {/* Questions List */}
                        <div className="p-6">
                            {filteredQuestions.length > 0 ? (
                                <div className="space-y-5">
                                    {filteredQuestions.map((q, idx) => {
                                        // Same multi-part splitting logic as analysis page
                                        let formattedParts: { letter: string, text: string }[] = [];

                                        // Try Pattern 1: space + letter + ) + space
                                        let parts = q.text.split(/\s+([a-z])\)\s+/i);
                                        if (parts.length > 2) {
                                            for (let i = 1; i < parts.length - 1; i += 2) {
                                                const letter = parts[i];
                                                const text = parts[i + 1];
                                                if (letter && text) {
                                                    formattedParts.push({ letter: letter.toLowerCase(), text: text.trim() });
                                                }
                                            }
                                        } else {
                                            // Try Pattern 2: marks patterns like "L3 7 b" or "(12 Marks) b"
                                            parts = q.text.split(/(?:L\d+\s+\d+|\(\d+\s*Marks?\))\s+([a-z])\s+/i);
                                            if (parts.length > 2) {
                                                for (let i = 1; i < parts.length - 1; i += 2) {
                                                    const letter = parts[i];
                                                    const text = parts[i + 1];
                                                    if (letter && text) {
                                                        formattedParts.push({ letter: letter.toLowerCase(), text: text.trim() });
                                                    }
                                                }
                                            }
                                        }

                                        const hasMultipleParts = formattedParts.length > 1;

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="border border-border rounded-xl bg-gradient-to-br from-card to-card/50 overflow-hidden shadow-sm hover:shadow-md transition-all"
                                            >
                                                {/* Header with metadata */}
                                                <div className="bg-gradient-to-r from-muted/30 to-muted/10 px-6 py-3 border-b border-border/50 flex flex-wrap items-center gap-3">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                                        <Calendar className="w-3 h-3" />
                                                        {q.year}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/70 text-foreground border border-border">
                                                        <FolderOpen className="w-3 h-3" />
                                                        {q.topic}
                                                    </span>
                                                    {q.marks > 0 && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent/50 text-foreground border border-border">
                                                            <Award className="w-3 h-3" />
                                                            {q.marks} marks
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Question Content */}
                                                <div className="p-6">
                                                    {hasMultipleParts ? (
                                                        <div className="space-y-6">
                                                            {formattedParts.map((part, pidx) => (
                                                                <div key={pidx} className="flex gap-4 items-start p-4 rounded-lg bg-accent/20 border border-border/30">
                                                                    <div className="flex-shrink-0 pt-1">
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                                            {part.letter}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 pt-1.5">
                                                                        <p className="text-foreground leading-relaxed text-base">
                                                                            {part.text}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-foreground leading-relaxed text-base">{q.text}</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">No questions found</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    </AnimatePresence>
                </div>

                <div className="p-4 bg-muted/5 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                    <span>Showing {filteredQuestions.length} of {questions.length} questions</span>
                    <span>{hasRepeated ? `${repeatedGroups.filter(g => g.count > 1).length} repeated questions found` : 'No repetitions found'}</span>
                </div>
            </div>
        </div>
    );
}
