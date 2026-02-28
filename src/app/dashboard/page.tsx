"use client";

import { useSession } from "next-auth/react";
import { FolderGit2, FolderOpen, ArrowRight, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MOCK_PROJECTS = [
    { id: "1", title: "E-Commerce Microservices", date: "2 hours ago", nodes: 12 },
    { id: "2", title: "SaaS Starter Kit", date: "Yesterday", nodes: 8 },
];

const TEMPLATES = [
    { id: "t1", title: "Real-time Chat App", category: "Social" },
    { id: "t2", title: "GraphQL CMS", category: "Content" },
    { id: "t3", title: "FinTech Dashboard", category: "Finance" },
    { id: "t4", title: "AI Agent Platform", category: "AI/ML" },
];

export default function DashboardIndex() {
    const { data: session } = useSession();
    const router = useRouter();

    if (!session) return <div className="p-8 text-neutral-400">Please sign in to view your dashboard.</div>;

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-neutral-950 min-h-screen pb-24">
            <div className="max-w-6xl mx-auto space-y-12 shrink-0">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {session.user?.name || 'Developer'}</h1>
                        <p className="text-neutral-400 mt-1">Manage your architecture designs and templates.</p>
                    </div>
                    <Link href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-2 transition-colors">
                        <FolderGit2 size={18} />
                        New Architecture
                    </Link>
                </div>

                {/* Recent Projects */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <FolderOpen size={20} className="text-blue-500" />
                            Recent Projects
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {MOCK_PROJECTS.map(proj => (
                            <div key={proj.id} className="group relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <h3 className="font-semibold text-white text-lg relative z-10">{proj.title}</h3>
                                <p className="text-sm text-neutral-500 mt-1 relative z-10">Last edited {proj.date}</p>

                                <div className="mt-6 flex items-center justify-between text-sm relative z-10">
                                    <span className="text-neutral-400 border border-neutral-800 bg-neutral-950 px-2 py-1 rounded">
                                        {proj.nodes} Nodes
                                    </span>
                                    <ArrowRight size={16} className="text-neutral-500 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        ))}
                        <div
                            onClick={() => router.push('/')}
                            className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-neutral-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-neutral-900 transition-all cursor-pointer min-h-[160px]"
                        >
                            <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                                <FolderGit2 size={20} />
                            </div>
                            <span className="font-medium">Design New System</span>
                        </div>
                    </div>
                </section>

                {/* Templates */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <LayoutTemplate size={20} className="text-purple-500" />
                            Template Library
                        </h2>
                        <button className="text-sm text-blue-500 hover:text-blue-400">View all</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {TEMPLATES.map(temp => (
                            <div key={temp.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-purple-500/50 cursor-pointer transition-colors group">
                                <div className="h-32 bg-neutral-950 border-b border-neutral-800 flex items-center justify-center relative overflow-hidden">
                                    {/* Mock thumbnail representation */}
                                    <div className="absolute inset-0 pattern-dots pattern-neutral-800 pattern-bg-transparent pattern-size-4 pattern-opacity-40"></div>
                                    <div className="relative z-10 flex gap-2 opacity-50">
                                        <div className="w-8 h-8 rounded bg-blue-600/50 border border-blue-500/20"></div>
                                        <div className="w-8 h-8 rounded bg-emerald-600/50 border border-emerald-500/20"></div>
                                        <div className="w-8 h-8 rounded bg-orange-600/50 border border-orange-500/20"></div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1 block">
                                        {temp.category}
                                    </span>
                                    <h3 className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors">{temp.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
