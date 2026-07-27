import React, { useState, useEffect } from 'react';

const IntroLoader = ({ onFinish }) => {
    // Separate state for the progress number (increments in steps)
    const [progressNumber, setProgressNumber] = useState(0);
    // Separate state for the width (animates via CSS for smoothness)
    const [barWidth, setBarWidth] = useState(0);
    
    const [phase, setPhase] = useState('loading'); // 'loading' -> 'pre-reveal' -> 'revealing' -> 'finished'
    
    // Detect mobile (768px breakpoint)
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );

    const TOTAL_LOADING_TIME = 6000;
    const REVEAL_DURATION_MS = 2500; 

    useEffect(() => {
        // Handle resize for mobile detection
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Trigger smooth width animation immediately on mount
        setTimeout(() => {
            setBarWidth(100);
        }, 50);

        // Counter logic
        const intervalTime = 50; 
        const totalSteps = TOTAL_LOADING_TIME / intervalTime;
        const increment = 100 / totalSteps;

        const timer = setInterval(() => {
            setProgressNumber(prev => {
                const next = prev + increment;
                if (next >= 100) {
                    clearInterval(timer);
                    
                    // On mobile: skip reveal animation, finish immediately
                    if (isMobile) {
                        setTimeout(() => {
                            setPhase('finished');
                            if (onFinish) onFinish();
                        }, 300); // Brief pause then finish
                    } else {
                        // Desktop: full reveal animation
                        setTimeout(() => {
                             setPhase('revealing');
                             
                            setTimeout(() => {
                                setPhase('finished');
                                if (onFinish) onFinish();
                            }, REVEAL_DURATION_MS + 100); 
                        }, 500); // Small pause at 100% before lift
                    }
                    
                    return 100;
                }
                return next;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [onFinish, isMobile]);

    if (phase === 'finished') return null;

    return (
        <div className="fixed inset-0 z-[100] font-sans text-white">
            
            {/* 1. Underlying Layer: The Content to Reveal (only show on desktop) */}
            {!isMobile && (
                <div className="absolute inset-0 z-0">
                     {/* Background Image */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: "url('/assets/img/African-fan-banner.jpg')" }}
                    >
                        {/* "overlay of a slightly transparent crimson red to a slightly transparent black... top right to bottom left" */}
                        <div 
                            className="absolute inset-0" 
                            style={{ 
                                background: 'linear-gradient(to bottom left, rgba(220, 20, 60, 0.4), rgba(0, 0, 0, 0.6))' 
                            }} 
                        />
                    </div>

                    {/* "Maintain the TFE logo on the bg image reveal" 
                        Placed here so it remains visible after the curtain lifts.
                    */}
                    <div className="absolute top-8 right-8 md:top-14 md:right-14 z-10">
                        <img 
                            src="/assets/img/logo/TFE-logo.png" 
                            alt="TFE Logo" 
                            className="w-16 md:w-24 h-auto opacity-90"
                        />
                    </div>
                </div>
            )}

            {/* 2. The Loader Overlay (The "Curtain") */}
            <div 
                className={`absolute inset-0 bg-white z-20 flex flex-col justify-between transition-transform duration-[2500ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
                    phase === 'revealing' ? '-translate-y-full' : 'translate-y-0'
                }`}
            >
                {/* Progress Bar Fill */}
                <div 
                    className="absolute inset-y-0 left-0 bg-black/10 z-0 transition-all ease-linear"
                    style={{ 
                        width: `${barWidth}%`, 
                        transitionDuration: `${TOTAL_LOADING_TIME}ms` 
                    }}
                />

                {/* Logo (FIXED ON TOP OF EVERYTHING) - this ensures it never moves or disappears.
                    "increase the size of the football experience logo"
                */}
                <div className="absolute top-8 right-8 md:top-14 md:right-14 z-[60]">
                    <img 
                        src="/assets/img/logo/TFE-logo.png" 
                        alt="TFE Logo" 
                        className="w-16 md:w-40 h-auto opacity-90"
                    />
                </div>
                
                {/* typing animation of "The Football Experience" in the very center */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-4 text-center">
                    <span 
                        className={`text-black transition-opacity duration-500 ${phase === 'revealing' ? 'opacity-0' : 'opacity-100'}`}
                        style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            fontSize: isMobile ? 'clamp(2rem, 8vw, 3.5rem)' : 'clamp(4.8rem, 12vw, 8.8rem)',
                            lineHeight: '1.1',
                            fontWeight: '400',
                            letterSpacing: isMobile ? '0em' : '-0.05em'
                        }}
                    >
                        {"The Football Experience".slice(0, Math.floor("The Football Experience".length * Math.max(0, (progressNumber - 20) / 80)))}
                    </span>
                </div>
                
                {/* Progress Counter */}
                <div className="relative z-10 p-6 md:p-14 mt-auto"> 
                    <div 
                        className={`transition-opacity duration-500 ${phase === 'revealing' ? 'opacity-0' : 'opacity-100'}`}
                    >
                         <span 
                            className="text-[60px] md:text-[180px] leading-none font-thin tracking-tighter tabular-nums block text-black"
                            style={{ fontFamily: '"Inter", sans-serif', fontWeight: 100 }}
                         >
                            {Math.round(progressNumber)}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default IntroLoader;
