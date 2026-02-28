"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Bot, User, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SelectCards, MultiSelectChips, SliderInput, StepperInput, ToggleSwitch, TextareaInput } from "./forms/DynamicInputs";

type QuestionData = {
    key: string;
    type: "textarea" | "stepper" | "slider" | "select" | "multi-select" | "toggle";
    q: string;
    options?: string[];
};

export default function ChatPanel({ onCanvasGenerateStart }: { onCanvasGenerateStart: () => void }) {
    const [messages, setMessages] = useState<{ id: string; role: "agent" | "user"; text: string }[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // Dynamic Form State
    const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
    const [activeInput, setActiveInput] = useState<string | string[]>("");

    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load history from localStorage on mount
    useEffect(() => {
        const storedSess = localStorage.getItem("archai_session");
        const storedMsgs = localStorage.getItem("archai_messages");
        let initialMsgs: any[] = [];
        if (storedMsgs) {
            try {
                initialMsgs = JSON.parse(storedMsgs);
                setMessages(initialMsgs);
            } catch (e) { }
        }

        let sessionId = storedSess;
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2, 15);
            localStorage.setItem("archai_session", sessionId);
        }

        const socket = io("http://localhost:3001", {
            query: { sessionId }
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnected(true);
            socket.emit("restore_interview", { sessionId, messages: initialMsgs });
        });

        socket.on("agent_message", (data: { text: string; isComplete: boolean; questionData?: QuestionData }) => {
            setIsTyping(false);
            setMessages((prev) => {
                const updated = [...prev, { id: Date.now().toString(), role: "agent" as const, text: data.text }];
                localStorage.setItem("archai_messages", JSON.stringify(updated));
                return updated;
            });

            if (data.questionData) {
                setCurrentQuestion(data.questionData);
                // Initialize active input based on type
                if (data.questionData.type === "multi-select") {
                    setActiveInput([]);
                } else {
                    setActiveInput("");
                }
            } else if (data.isComplete) {
                setCurrentQuestion(null);
            }
        });

        socket.on("generate_canvas_start", () => {
            onCanvasGenerateStart();
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [onCanvasGenerateStart]);

    useEffect(() => {
        if (!currentQuestion) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping, currentQuestion]);

    const handleConfirmSelection = (finalValue?: string) => {
        const valToSubmit = finalValue !== undefined ? finalValue : activeInput;
        // Stringify arrays for multi-select
        const textValue = Array.isArray(valToSubmit) ? valToSubmit.join(", ") : valToSubmit;

        if (!textValue || !socketRef.current) return;

        setMessages((prev) => {
            const updated = [...prev, { id: Date.now().toString(), role: "user" as const, text: textValue }];
            localStorage.setItem("archai_messages", JSON.stringify(updated));
            return updated;
        });

        setCurrentQuestion(null);
        setActiveInput("");
        setIsTyping(true);

        const sessionId = localStorage.getItem("archai_session");
        socketRef.current.emit("user_message", { sessionId, text: textValue });
    };

    const renderDynamicInput = () => {
        if (!currentQuestion) return null;

        const { type, options } = currentQuestion;

        switch (type) {
            case "select":
                return <SelectCards options={options || []} onSelect={handleConfirmSelection} />;
            case "multi-select":
                return (
                    <div className="flex flex-col">
                        <MultiSelectChips
                            options={options || []}
                            selected={activeInput as string[]}
                            onToggle={(val) => {
                                setActiveInput(prev => {
                                    const arr = prev as string[];
                                    return arr.includes(val) ? arr.filter(i => i !== val) : [...arr, val];
                                });
                            }}
                        />
                        <button
                            onClick={() => handleConfirmSelection()}
                            disabled={(activeInput as string[]).length === 0}
                            className="mt-6 px-6 py-3 bg-blue-600 rounded-xl font-medium text-white disabled:opacity-50 transition-all ml-auto hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        >
                            Confirm Selection
                        </button>
                    </div>
                );
            case "slider":
                return <SliderInput options={options || []} onSelect={handleConfirmSelection} />;
            case "stepper":
                return (
                    <div className="flex flex-col">
                        <StepperInput
                            options={options || []}
                            value={activeInput as string}
                            onChange={(val) => setActiveInput(val)}
                        />
                        <button
                            onClick={() => handleConfirmSelection()}
                            disabled={!(activeInput as string).trim()}
                            className="mt-6 px-6 py-3 bg-blue-600 rounded-xl font-medium text-white disabled:opacity-50 transition-all ml-auto hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        >
                            Next Step
                        </button>
                    </div>
                );
            case "toggle":
                return <ToggleSwitch options={options || []} onSelect={handleConfirmSelection} />;
            case "textarea":
            default:
                return (
                    <TextareaInput
                        value={activeInput as string}
                        onChange={(val) => setActiveInput(val)}
                        onSubmit={() => handleConfirmSelection()}
                    />
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-900/50 backdrop-blur-xl border-t border-r border-white/5 relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white/90">Agent Interview</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'}`}></span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">
                                {isConnected ? "Connected" : "Disconnected"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide relative z-10">
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                        >
                            <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center border ${msg.role === "agent"
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                : "bg-white/5 border-white/10 text-white/70"
                                }`}>
                                {msg.role === "agent" ? <Bot size={14} /> : <User size={14} />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "agent"
                                ? "bg-white/5 text-neutral-300 rounded-tl-sm border border-white/5"
                                : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/20"
                                }`}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex gap-3 max-w-[80%]"
                        >
                            <div className="shrink-0 h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                                <Bot size={14} />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 rounded-tl-sm flex items-center gap-1.5 h-10">
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-blue-400"></motion.span>
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-blue-400"></motion.span>
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-blue-400"></motion.span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Dynamic Form Input Card */}
            <AnimatePresence>
                {currentQuestion && !isTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 right-0 p-4 z-20"
                    >
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
                            <div className="flex items-center gap-2 mb-2 text-blue-400">
                                <CheckCircle2 size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Action Required</span>
                            </div>
                            <p className="text-white font-medium text-sm mb-4 leading-relaxed">{currentQuestion.q}</p>

                            {renderDynamicInput()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Basic Text Input Fallback (for follow-ups when active question is null) */}
            {!currentQuestion && !isTyping && messages.length > 0 && messages[messages.length - 1].text.includes("generated") && (
                <div className="p-4 border-t border-white/5 bg-black/40">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleConfirmSelection();
                    }} className="relative flex items-center">
                        <input
                            type="text"
                            value={activeInput as string}
                            onChange={(e) => setActiveInput(e.target.value)}
                            placeholder="Ask for follow-up modifications..."
                            className="w-full bg-black/50 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </form>
                </div>
            )}
        </div>
    );
}
