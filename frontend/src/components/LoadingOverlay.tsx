import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isVisible: boolean;
    text?: string;
}

export default function LoadingOverlay({ isVisible, text = 'Salvando...' }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center space-y-4 max-w-sm w-full mx-4">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-full animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="text-slate-700 font-semibold text-lg">{text}</div>
            </div>
        </div>
    );
}
