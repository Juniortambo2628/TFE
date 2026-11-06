import React, { useState, useEffect } from 'react';

const IntroLoader = ({ onFinish }) => {
    const [phase, setPhase] = useState('loading'); // 'loading' -> 'fading' -> 'finished'
    // Under 400ms in all (UX plan, Nov 2026): it held every first visit for
    // 1.8s. A brand moment, not a wait.
    const TOTAL_LOADING_TIME = 250;

    useEffect(() => {
        const timer = setTimeout(() => {
            setPhase('fading');
            setTimeout(() => {
                setPhase('finished');
                if (onFinish) onFinish();
            }, 150); // fade out
        }, TOTAL_LOADING_TIME);

        return () => clearTimeout(timer);
    }, [onFinish]);

    if (phase === 'finished') return null;

    return (
        <div 
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-150`}
            style={{ 
                backgroundColor: '#DC143C',
                opacity: phase === 'fading' ? 0 : 1,
                pointerEvents: phase === 'fading' ? 'none' : 'auto'
            }}
        >
            <div 
                className="logo-pulse-container"
                style={{
                    animation: 'pulse-loader 1.5s infinite ease-in-out'
                }}
            >
                <img 
                    src="/assets/img/logo/TFE-logo.png" 
                    alt="TFE Logo" 
                    className="w-32 md:w-48 h-auto"
                    style={{ border: 'none', outline: 'none' }}
                />
            </div>
        </div>
    );
};

export default IntroLoader;
