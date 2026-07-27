import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function FanTutorial({ steps, tutorialId = 'fan_dashboard_tutorial' }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const [tooltipPosition, setTooltipPosition] = useState('bottom');
    const [tooltipCoords, setTooltipCoords] = useState({ x: 0, y: 0 });
    const [arrowPos, setArrowPos] = useState({ left: 20 });

    useEffect(() => {
        const checkStart = () => {
            const hasSeenTutorial = localStorage.getItem(tutorialId);
            if (!hasSeenTutorial) {
                if (window.tfeLoaderFinished === true) {
                     setIsVisible(true);
                }
            }
        };

        const handleLoaderFinished = () => {
            const hasSeenTutorial = localStorage.getItem(tutorialId);
            if (!hasSeenTutorial) {
                setIsVisible(true);
            }
        };

        const handleManualStart = () => {
            setCurrentStep(0);
            setIsVisible(true);
            localStorage.removeItem(tutorialId);
        };

        checkStart();

        window.addEventListener('tfeLoaderFinished', handleLoaderFinished);
        window.addEventListener('startFanTutorial', handleManualStart);

        return () => {
             window.removeEventListener('tfeLoaderFinished', handleLoaderFinished);
             window.removeEventListener('startFanTutorial', handleManualStart);
        };
    }, [tutorialId]);

    useEffect(() => {
        if (!isVisible || currentStep >= steps.length) return;

        const targetId = steps[currentStep].target;
        let animationFrameId;

        const scrollToTarget = () => {
             const targetElement = document.getElementById(targetId);
             if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
        };

        scrollToTarget();

        const updatePosition = () => {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                
                setPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });

                const spaceAbove = rect.top;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceRight = window.innerWidth - rect.right;
                const spaceLeft = rect.left;

                let newPos = 'bottom';
                if (spaceBelow > 220) newPos = 'bottom';
                else if (spaceAbove > 220) newPos = 'top';
                else if (spaceRight > 320) newPos = 'right';
                else if (spaceLeft > 320) newPos = 'left';
                else newPos = 'bottom'; // Fallback

                setTooltipPosition(newPos);

                // Calculate exact tooltip coordinates to keep in viewport
                let x = 0;
                let y = 0;
                let arrowL = 20;
                const tooltipW = 300;
                const tooltipH = 200; // Approx max height
                const margin = 16;
                const viewportMargin = 10;

                if (newPos === 'bottom') {
                    y = rect.bottom + margin;
                    x = rect.left;
                } else if (newPos === 'top') {
                    y = rect.top - margin; // TranslateY(-100%) handled in style or here? Let's use style for simplicity or calc here.
                    // If we use style transform, y is the geometric anchor.
                    // Let's stick to the previous transform logic for top/bottom but FIX x.
                    x = rect.left;
                } else if (newPos === 'right') {
                   x = rect.right + margin;
                   y = rect.top;
                } else if (newPos === 'left') {
                   x = rect.left - tooltipW - margin;
                   y = rect.top;
                }

                // Clamp X (Horizontal)
                if (newPos === 'top' || newPos === 'bottom') {
                     // Check right edge
                     if (x + tooltipW > window.innerWidth - viewportMargin) {
                         const diff = (x + tooltipW) - (window.innerWidth - viewportMargin);
                         x -= diff;
                     }
                     // Check left edge
                     if (x < viewportMargin) {
                         x = viewportMargin;
                     }

                     // Calculate arrow relative to tooltip
                     // Arrow should point to center of target
                     const centerOfTarget = rect.left + (rect.width / 2);
                     arrowL = centerOfTarget - x - 6; // 6 is half arrow width
                     
                     // Clamp arrow to keep it inside tooltip rounded corners
                     arrowL = Math.max(12, Math.min(tooltipW - 24, arrowL));
                }
                
                setTooltipCoords({ x, y });
                setArrowPos({ left: arrowL });
            }
            
            animationFrameId = requestAnimationFrame(updatePosition);
        };

        animationFrameId = requestAnimationFrame(updatePosition);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [currentStep, isVisible, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTutorial();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        completeTutorial();
    };

    const completeTutorial = () => {
        localStorage.setItem(tutorialId, 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const currentStepData = steps[currentStep];

    return createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                clipPath: `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${position.left}px 100%, 
                    ${position.left}px ${position.top}px, 
                    ${position.left + position.width}px ${position.top}px, 
                    ${position.left + position.width}px ${position.top + position.height}px, 
                    ${position.left}px ${position.top + position.height}px, 
                    ${position.left}px 100%, 
                    100% 100%, 
                    100% 0%
                )`
            }}></div>
            
            <div style={{
                position: 'absolute',
                top: position.top - 4,
                left: position.left - 4,
                width: position.width + 8,
                height: position.height + 8,
                border: '2px solid #e31b23',
                borderRadius: '8px',
                boxShadow: '0 0 15px rgba(227, 27, 35, 0.6)',
                transition: 'all 0.1s linear', // FASTER transition for lag-free feel
                pointerEvents: 'none'
            }}></div>

            <div style={{
                position: 'absolute',
                top: tooltipPosition === 'top' ? tooltipCoords.y : tooltipCoords.y, // Logic handled in updatePosition + transform
                left: tooltipCoords.x,
                // Adjust top positioning logic:
                // If top: we calculated y as `rect.top - margin`. 
                // But we need to translate smoothly or set bottom.
                // Let's rely on `top` state from calc:
                // For 'top', coord Y is top of tooltip? No, we set y = rect.top - margin.
                // WE need to offset by height or use transform.
                transform: tooltipPosition === 'top' ? 'translateY(-100%)' : 'none',
                
                width: '300px',
                maxWidth: '90vw',
                backgroundColor: '#1e1e24',
                color: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                border: '1px solid #333',
                pointerEvents: 'auto',
                transition: 'opacity 0.2s ease', // Remove positional transition for responsiveness to rAF
                // but keep opacity or slight movement
            }}>
                <div style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', color: '#e31b23' }}>
                    {currentStepData.title}
                </div>
                <div style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.5', color: '#ccc' }}>
                    {currentStepData.content}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Step {currentStep + 1} of {steps.length}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {currentStep > 0 && (
                            <button 
                                onClick={handlePrev} 
                                style={{ 
                                    background: 'transparent', 
                                    border: '1px solid #555', 
                                    color: '#fff', 
                                    padding: '6px 12px', 
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Back
                            </button>
                        )}
                         <button 
                            onClick={handleSkip} 
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#888', 
                                padding: '6px 12px', 
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Skip
                        </button>
                        <button 
                            onClick={handleNext} 
                            style={{ 
                                background: '#e31b23', 
                                border: 'none', 
                                color: '#fff', 
                                padding: '6px 16px', 
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                        >
                            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
                
                <div style={{
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#1e1e24',
                    transform: 'rotate(45deg)',
                    borderLeft: '1px solid #333',
                    borderTop: '1px solid #333',
                    top: tooltipPosition === 'bottom' ? '-7px' : 'auto',
                    bottom: tooltipPosition === 'top' ? '-7px' : 'auto',
                    left: `${arrowPos.left}px`,
                    display: (tooltipPosition === 'top' || tooltipPosition === 'bottom') ? 'block' : 'none'
                }}></div>
            </div>
        </div>,
        document.body
    );
}
