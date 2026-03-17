import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )

    const resolvedTheme = useMemo<"light" | "dark">(() => {
        if (theme !== "system") return theme
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }, [theme])

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")
        root.classList.add(resolvedTheme)
        root.style.colorScheme = resolvedTheme
    }, [resolvedTheme])

    useEffect(() => {
        if (theme !== "system") return

        const media = window.matchMedia("(prefers-color-scheme: dark)")
        const onChange = () => {
            const root = window.document.documentElement
            const next = media.matches ? "dark" : "light"
            root.classList.remove("light", "dark")
            root.classList.add(next)
            root.style.colorScheme = next
        }

        media.addEventListener("change", onChange)
        return () => media.removeEventListener("change", onChange)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
