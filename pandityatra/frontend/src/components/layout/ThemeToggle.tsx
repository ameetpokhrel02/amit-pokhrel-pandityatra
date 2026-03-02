import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/components/theme/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="p-2 shadow-xl border-orange-100 dark:border-gray-800 dark:bg-gray-900">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={`cursor-pointer gap-2 rounded-lg ${theme === 'light' ? 'bg-orange-50 text-orange-700 dark:bg-gray-800 dark:text-orange-400' : 'hover:bg-orange-50/50 dark:hover:bg-gray-800'}`}
                >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={`cursor-pointer gap-2 rounded-lg ${theme === 'dark' ? 'bg-orange-50 text-orange-700 dark:bg-gray-800 dark:text-orange-400' : 'hover:bg-orange-50/50 dark:hover:bg-gray-800'}`}
                >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={`cursor-pointer gap-2 rounded-lg ${theme === 'system' ? 'bg-orange-50 text-orange-700 dark:bg-gray-800 dark:text-orange-400' : 'hover:bg-orange-50/50 dark:hover:bg-gray-800'}`}
                >
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
