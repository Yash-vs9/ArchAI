"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-50">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 bg-neutral-900 flex flex-col">
                <div className="h-14 flex items-center px-6 border-b border-neutral-800">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-xs font-bold text-white">A</div>
                        <span className="font-semibold tracking-tight text-white hover:text-blue-400 transition-colors">DevArchitect Dashboard</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md bg-neutral-800 text-white font-medium">
                        <LayoutDashboard size={18} className="text-blue-500" />
                        Projects
                    </Link>
                    <Link href="/dashboard/community" className="flex items-center gap-3 px-3 py-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
                        <Users size={18} />
                        Community
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
                        <Settings size={18} />
                        Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-neutral-800">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="h-8 w-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {session?.user?.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Guest'}</p>
                            <p className="text-xs text-neutral-500 truncate">{session?.user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}
