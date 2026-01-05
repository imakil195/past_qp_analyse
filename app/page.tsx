'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowRight, FileText, BarChart3, TrendingUp, Search } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
      <Navbar />

      <main className="min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 relative">

        {/* Abstract Background Blurs */}
        <div className="absolute top-20 left-[20%] w-72 h-72 bg-blue-400/20 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-20 right-[20%] w-96 h-96 bg-indigo-400/10 rounded-full blur-[120px] -z-10" />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-muted-foreground mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Exam Analytics v1.0
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Analyze Past Papers. <br className="hidden md:block" />
            <span className="text-primary">Prepare Smarter.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload previous year question papers and instantly discover repeated questions,
            chapter weightage, and important study topics.
          </p>

          <div className="flex justify-center items-center mt-8">
            <Link href="/dashboard" className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-white transition-all duration-300 hover:bg-primary/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <span className="mr-2">Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full"
        >
          <FeatureCard
            icon={<FileText className="w-6 h-6 text-blue-500" />}
            title="Upload PDFs"
            desc="Drag and drop multiple question papers. We extract everything instantly."
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6 text-indigo-500" />}
            title="Analyze Data"
            desc="Get detailed breakdown of marks, chapter weightage, and year-wise trends."
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6 text-violet-500" />}
            title="Study Smart"
            desc="Focus on what matters most based on repeated question patterns."
          />
        </motion.div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5 group">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {desc}
      </p>
    </div>
  )
}
