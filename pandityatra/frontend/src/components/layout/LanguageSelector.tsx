import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLanguage = i18n.language || 'en';

    // Map language codes to display names
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ne', name: 'नेपाली' },
        { code: 'hi', name: 'हिंदी' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
                {languages.map((lang) => (
                    <DropdownMenuItem 
                        key={lang.code} 
                        onClick={() => changeLanguage(lang.code)}
                        className={currentLanguage === lang.code ? 'bg-orange-50 text-orange-600' : ''}
                    >
                        {lang.name} {currentLanguage === lang.code && '✓'}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSelector;
