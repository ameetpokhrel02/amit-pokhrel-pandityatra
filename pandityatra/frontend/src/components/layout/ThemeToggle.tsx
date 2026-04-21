import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "@/components/theme/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative rounded-full w-10 h-10 hover:bg-orange-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors focus-visible:ring-orange-500"
                >
                    <AnimatePresence mode="wait">
                        {theme === 'light' ? (
                            <motion.div
                                key="sun"
                                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Sun className="h-[1.2rem] w-[1.2rem]" />
                            </motion.div>
                        ) : theme === 'dark' ? (
                            <motion.div
                                key="moon"
                                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Moon className="h-[1.2rem] w-[1.2rem]" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="monitor"
                                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Monitor className="h-[1.2rem] w-[1.2rem]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-1.5 shadow-2xl border-orange-100 dark:border-gray-800 dark:bg-gray-950 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90 min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg transition-all ${theme === 'light' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400'}`}
                >
                    <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                    </div>
                    {theme === 'light' && <Check className="h-3.5 w-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400'}`}
                >
                    <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                    </div>
                    {theme === 'dark' && <Check className="h-3.5 w-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg transition-all ${theme === 'system' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400'}`}
                >
                    <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
                    </div>
                    {theme === 'system' && <Check className="h-3.5 w-3.5" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

