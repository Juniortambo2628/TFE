import React, { useState, useEffect } from 'react';

const IntroLoader = ({ onFinish }) => {
    const [phase, setPhase] = useState('loading'); // 'loading' -> 'fading' -> 'finished'
    const TOTAL_LOADING_TIME = 2000;

    useEffect(() => {
        const timer = setTimeout(() => {
            setPhase('fading');
            setTimeout(() => {
                setPhase('finished');
                if (onFinish) onFinish();
            }, 500); // 500ms fade out duration
        }, TOTAL_LOADING_TIME);

        return () => clearTimeout(timer);
    }, [onFinish]);

    if (phase === 'finished') return null;

    return (
        <div 
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500`}
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

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse-loader {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
            `}} />
        </div>
    );
};

export default IntroLoader;
