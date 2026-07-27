import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * A premium global status dialog for success and error messages
 */
export default function StatusDialog({ 
    open, 
    onOpenChange, 
    type = 'success', // 'success' | 'error'
    title, 
    message, 
    buttonText = "Great, Thanks!",
    onButtonClick
}) {
    const isSuccess = type === 'success';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0a0a0b] border-white/5 max-w-sm text-center py-10 rounded-3xl overflow-hidden shadow-2xl p-8">
                {/* Icon Section */}
                <div className="flex justify-center mb-8 relative">
                    <div className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center relative",
                        isSuccess ? "bg-red-600 shadow-[0_0_30px_rgba(220,20,60,0.3)]" : "bg-red-800 shadow-[0_0_30px_rgba(153,27,27,0.3)]"
                    )}>
                        <i className={cn(
                            "fas text-4xl text-white",
                            isSuccess ? "fa-check" : "fa-exclamation"
                        )}></i>
                    </div>
                </div>

                <DialogHeader className="mb-2">
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                        {title || (isSuccess ? "Everything Set!" : "System Error")}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-4 mb-8">
                    <p className="text-white/60 text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="px-6">
                    <button 
                        onClick={() => {
                            if (onButtonClick) onButtonClick();
                            onOpenChange(false);
                        }}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg",
                            isSuccess ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-white/10 hover:bg-white/20"
                        )}
                    >
                        {buttonText || (isSuccess ? "Great, Thanks!" : "Try Again")}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
