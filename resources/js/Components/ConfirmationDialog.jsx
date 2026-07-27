import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { cn } from "../lib/utils";

/**
 * A standardized confirmation dialog component using Shadcn UI.
 * Used to replace window.confirm() calls.
 */
export default function ConfirmationDialog({ 
    open, 
    onOpenChange, 
    title = "Are you sure?", 
    description, 
    onConfirm, 
    confirmText = "Continue", 
    cancelText = "Cancel",
    variant = "default",
    isLoading = false
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0a0a0b] border-white/5 sm:max-w-[425px] rounded-3xl overflow-hidden shadow-2xl p-8">
                <DialogHeader className="text-center sm:text-center">
                    <DialogTitle className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-white/60 text-base leading-relaxed">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8 sm:justify-center">
                    <Button 
                        variant="ghost" 
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 py-6 rounded-xl font-semibold text-white/50 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        variant={variant} 
                        type="button"
                        onClick={() => {
                            onConfirm();
                        }}
                        className={cn(
                            "flex-1 py-6 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg",
                            variant === 'destructive' 
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                        )}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><i className="fas fa-spinner fa-spin me-2"></i> Processing...</>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
