import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳'
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    flag: '🇳🇵'
  },
];

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'buttons' | 'compact';
}

/**
 * Enhanced Language Switcher Component
 * Supports: English (en), Hindi (hi), Nepali (ne)
 * Features:
 * - Persistent language selection (localStorage)
 * - Responsive design
 * - Multiple display variants
 * - Native language names
 */
export function LanguageSwitcher({
  className = '',
  variant = 'dropdown'
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Get current language details
  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    // Persist in localStorage
    localStorage.setItem('preferredLanguage', langCode);
    setIsOpen(false);
  };

  // Variant 1: Dropdown Menu (Default)
  if (variant === 'dropdown') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 ${className}`}
            title={`Current language: ${currentLanguage.nativeName}`}
          >
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="hidden sm:inline text-xs font-medium">
              {currentLanguage.name}
            </span>
            <span className="sm:hidden text-xs font-medium">
              {currentLanguage.code.toUpperCase()}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-gray-500">
              Select Language
            </p>
          </div>

          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="cursor-pointer flex gap-2 pl-2"
            >
              <span className="text-lg w-5">{lang.flag}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{lang.name}</p>
                <p className="text-xs text-gray-500">{lang.nativeName}</p>
              </div>
              {lang.code === i18n.language && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Variant 2: Button Group
  if (variant === 'buttons') {
    return (
      <div className={`flex gap-1 rounded-lg border p-1 bg-gray-50 ${className}`}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            title={lang.nativeName}
            className={`
              px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${lang.code === i18n.language
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Variant 3: Compact (for footer)
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`
            flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900
            transition-colors ${className}
          `}>
            <Globe className="h-4 w-4" />
            {currentLanguage.code.toUpperCase()}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="cursor-pointer text-sm"
            >
              {lang.flag} {lang.name}
              {lang.code === i18n.language && ' ✓'}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}

export default LanguageSwitcher;
