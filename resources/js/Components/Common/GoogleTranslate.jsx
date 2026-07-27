import React, { useEffect } from 'react';

export default function GoogleTranslate() {
    useEffect(() => {
        const initTranslate = () => {
            if (window.google && window.google.translate && window.google.translate.TranslateElement && document.getElementById('google_translate_element')) {
                // Prevent duplicate initialization
                if (!document.getElementById('google_translate_element').hasChildNodes()) {
                    const layout = window.google.translate.TranslateElement.InlineLayout 
                        ? window.google.translate.TranslateElement.InlineLayout.SIMPLE 
                        : 0;

                    new window.google.translate.TranslateElement({
                        pageLanguage: 'en',
                        includedLanguages: 'en,sw,es,fr,de,pt',
                        layout: layout,
                        autoDisplay: false
                    }, 'google_translate_element');
                }
            }
        };

        // Try initializing immediately
        initTranslate();

        // Listen for load event from app.blade.php
        window.addEventListener('google-translate-loaded', initTranslate);

        return () => {
            window.removeEventListener('google-translate-loaded', initTranslate);
        };
    }, []);

    return (
        <div id="google_translate_wrapper" className="google-translate-fixed">
            <div id="google_translate_element"></div>
        </div>
    );
}
