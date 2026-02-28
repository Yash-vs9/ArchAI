"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useCallback } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";
import { motion } from "framer-motion";
import { Sparkles, Hexagon } from "lucide-react";
import { CursorSpotlight } from "@/components/ui/CursorSpotlight";
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [architecture, setArchitecture] = useState<any>(null);

  const handleCanvasGenerateStart = useCallback(() => setIsGenerating(true), []);
  const handleCanvasGenerateEnd = useCallback(() => setIsGenerating(false), []);
  const handleArchitectureUpdate = useCallback((data: any) => {
    setArchitecture(data);
    setIsGenerating(false);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          <div className="absolute w-16 h-16 border-l-2 border-r-2 border-purple-500 rounded-full animate-spin direction-reverse"></div>
          <Hexagon className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black selection:bg-blue-500/30">
        <CursorSpotlight />
        <ParticlesBackground />

        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[20%] h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[20%] h-96 w-96 rounded-full bg-purple-500/20 blur-[120px]"
          />
        </div>

        <div className="z-10 flex max-w-2xl flex-col items-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-blue-500/30 bg-blue-500/10 text-sm text-blue-400 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Architecture Design</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl mb-6"
          >
            DevArchitect AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 text-lg leading-relaxed text-neutral-400"
          >
            Describe your project idea in plain language. Watch our AI agent conduct a structured interview and generate a beautiful, interactive visual system architecture in real-time.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={() => signIn()}
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-blue-600 px-8 font-medium text-white transition-all duration-300 hover:bg-blue-500 hover:ring-2 hover:ring-blue-500/50 hover:ring-offset-2 hover:ring-offset-black"
          >
            <span className="relative z-10">Start Designing</span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-black text-white">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-white/5 bg-black/50 px-6 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-[1px]">
            <div className="h-full w-full rounded-[7px] bg-black flex items-center justify-center">
              <Hexagon className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <span className="font-semibold tracking-tight text-white/90">DevArchitect</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white/50">{session.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm font-medium text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] z-0"></div>

        {/* Left Panel: Chat Interview */}
        <section className="relative z-10 w-full md:w-[400px] lg:w-[450px] border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col shadow-2xl">
          <ChatPanel
            onCanvasGenerateStart={handleCanvasGenerateStart}
            onCanvasGenerateEnd={handleCanvasGenerateEnd}
            onArchitectureUpdate={handleArchitectureUpdate}
          />
        </section>

        {/* Right Panel: Architecture Canvas */}
        <section className="relative z-10 flex-1 bg-transparent">
          <ArchitectureCanvas isGenerating={isGenerating} architecture={architecture} />
        </section>
      </main>
    </div>
  );
}