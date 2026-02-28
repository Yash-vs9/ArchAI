import { motion } from "framer-motion";

export function SelectCards({ options, onSelect }: { options: string[], onSelect: (val: string) => void }) {
    return (
        <div className="grid grid-cols-2 gap-3 mt-4">
            {options.map((opt, i) => (
                <motion.button
                    key={opt}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSelect(opt)}
                    className="p-4 text-left border border-white/10 rounded-xl bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all font-medium text-sm text-neutral-200"
                >
                    {opt}
                </motion.button>
            ))}
        </div>
    );
}

export function MultiSelectChips({ options, selected, onToggle }: { options: string[], selected: string[], onToggle: (val: string) => void }) {
    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {options.map((opt, i) => {
                const isSelected = selected.includes(opt);
                return (
                    <motion.button
                        key={opt}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onToggle(opt)}
                        className={`px-4 py-2 rounded-full border text-sm transition-all shadow-sm ${isSelected
                                ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-blue-500/20"
                                : "bg-white/5 border-white/10 text-neutral-300 hover:border-white/30"
                            }`}
                    >
                        {opt}
                    </motion.button>
                )
            })}
        </div>
    );
}

export function SliderInput({ options, onSelect }: { options: string[], onSelect: (val: string) => void }) {
    return (
        <div className="flex flex-col gap-4 mt-6">
            <div className="flex justify-between items-center w-full px-2">
                {options.map((opt, i) => (
                    <div key={opt} className="flex flex-col items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-neutral-600'}`}></div>
                        <span className="text-xs text-neutral-400 font-medium">{opt}</span>
                    </div>
                ))}
            </div>
            <div className="relative h-1 bg-neutral-800 rounded-full w-full">
                <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full w-[0%] transition-all duration-300"></div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
                {options.map((opt, i) => (
                    <button key={opt} onClick={() => onSelect(opt)} className="p-2 border border-white/10 rounded-lg bg-white/5 text-xs hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                        Select
                    </button>
                ))}
            </div>
        </div>
    );
}

export function StepperInput({ options, value, onChange }: { options: string[], value: string, onChange: (val: string) => void }) {
    return (
        <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-2">
                {options.map((opt, i) => (
                    <motion.button
                        key={opt}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onChange(opt)}
                        className={`flex-1 py-3 border rounded-lg text-sm transition-colors ${value === opt ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/30'}`}
                    >
                        {opt}
                    </motion.button>
                ))}
            </div>
            {/* Provide a custom number input as fallback */}
            <input
                type="text"
                placeholder="Or type an exact number..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-2 w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
        </div>
    )
}

export function ToggleSwitch({ options, onSelect }: { options: string[], onSelect: (val: string) => void }) {
    return (
        <div className="flex flex-col gap-3 mt-4">
            {options.map((opt, i) => (
                <motion.button
                    key={opt}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSelect(opt)}
                    className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                    <span className="text-sm font-medium text-neutral-200">{opt}</span>
                    <div className="w-4 h-4 rounded-full border border-neutral-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-blue-500 transition-colors"></div>
                    </div>
                </motion.button>
            ))}
        </div>
    )
}

export function TextareaInput({ value, onChange, onSubmit }: { value: string, onChange: (val: string) => void, onSubmit: () => void }) {
    return (
        <div className="mt-4 flex flex-col gap-3">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
                placeholder="Type your answer here..."
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-neutral-500 min-h-[120px] resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
            />
            <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">{value.length} characters</span>
                <button
                    onClick={onSubmit}
                    disabled={value.trim().length === 0}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                    Confirm Answer
                </button>
            </div>
        </div>
    )
}
