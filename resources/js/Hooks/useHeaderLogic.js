import { useState, useEffect } from 'react';

export default function useHeaderLogic() {
    const [dropdowns, setDropdowns] = useState({
        user: false,
        notifications: false,
        messages: false
    });

    const closeAllDropdowns = () => {
        setDropdowns({
            user: false,
            notifications: false,
            messages: false
        });
    };

    const toggleDropdown = (key, e) => {
        if (e) e.stopPropagation();
        
        setDropdowns(prev => {
            // If the clicked dropdown is already open, close it.
            // Otherwise, close all others and open the clicked one.
            if (prev[key]) {
                return {
                    user: false,
                    notifications: false,
                    messages: false
                };
            }
            return {
                user: false,
                notifications: false,
                messages: false,
                [key]: true
            };
        });
    };

    useEffect(() => {
        const handleClickOutside = () => closeAllDropdowns();
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return {
        dropdowns,
        toggleDropdown,
        closeAllDropdowns
    };
}
