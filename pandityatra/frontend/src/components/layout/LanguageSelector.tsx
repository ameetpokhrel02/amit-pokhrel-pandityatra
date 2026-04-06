import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
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

const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // Get current language details
    const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

    // Handle language change with localStorage persistence
    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        localStorage.setItem('preferredLanguage', langCode);
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full border-orange-200 hover:bg-orange-50"
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
};

export default LanguageSelector;
