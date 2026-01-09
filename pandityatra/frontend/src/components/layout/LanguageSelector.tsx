import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
    const [language, setLanguage] = React.useState('English');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setLanguage('English')}>
                    English {language === 'English' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('Nepali')}>
                    नेपाली {language === 'Nepali' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('Hindi')}>
                    हिंदी {language === 'Hindi' && '✓'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSelector;
