import React from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import logo from '@/assets/images/PanditYatralogo.png';

export const PWAInstallPrompt: React.FC = () => {
    const { isInstallable, installPWA } = usePWA();
    const [isVisible, setIsVisible] = React.useState(true);

    if (!isInstallable || !isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white border-2 border-orange-200 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 max-w-lg mx-auto">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-2 rounded-xl">
                        <img src={logo} alt="PanditYatra" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">Install PanditYatra App</h3>
                        <p className="text-xs text-gray-500">Access sacred services faster from your home screen.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={installPWA}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 h-9 font-bold rounded-full"
                    >
                        <Download className="w-3 h-3 mr-2" />
                        Install
                    </Button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
