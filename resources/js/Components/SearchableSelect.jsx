import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function SearchableSelect({ options, value, onChange, placeholder, renderOption, labelKey = 'label', valueKey = 'value', imageKey = 'image', searchKeys = [labelKey] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [menuRect, setMenuRect] = useState(null);
    const wrapperRef = useRef(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    // The register form lives inside a fixed-height, overflow-y:auto card body,
    // which clips an absolutely-positioned dropdown (z-index can't beat
    // ancestor overflow). So the menu is portalled to <body> and positioned
    // fixed against the trigger's viewport rect instead.
    const positionMenu = useCallback(() => {
        if (!triggerRef.current) return;
        const r = triggerRef.current.getBoundingClientRect();
        setMenuRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        positionMenu();

        const handleClickOutside = (event) => {
            if (
                wrapperRef.current && !wrapperRef.current.contains(event.target) &&
                menuRef.current && !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        // Capture phase catches scrolls from any ancestor scroll container
        // (the form body), not just the window.
        const onScrollOrResize = () => positionMenu();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', onScrollOrResize, true);
        window.addEventListener('resize', onScrollOrResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        };
    }, [isOpen, positionMenu]);

    const filteredOptions = options.filter(option =>
        searchKeys.some(key =>
            option[key] && option[key].toString().toLowerCase().includes(search.toLowerCase())
        )
    );

    const selectedOption = options.find(o => o[valueKey] === value);

    const handleSelect = (option) => {
        onChange(option[valueKey]);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="searchable-select-wrapper position-relative" ref={wrapperRef}>
            <div
                ref={triggerRef}
                className="tfe-input d-flex align-items-center justify-content-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    <div className="d-flex align-items-center">
                        {selectedOption[imageKey] && (
                            <img src={selectedOption[imageKey]} alt="" className="me-2" style={{width: '20px', height: '15px', objectFit: 'cover'}} />
                        )}
                        <span className="text-white">{selectedOption[labelKey]}</span>
                    </div>
                ) : (
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{placeholder}</span>
                )}
                <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''} text-white`}></i>
            </div>

            {isOpen && menuRect && createPortal(
                <div
                    ref={menuRef}
                    className="searchable-select-dropdown bg-dark border border-secondary rounded overflow-hidden"
                    style={{ position: 'fixed', top: menuRect.top, left: menuRect.left, width: menuRect.width, zIndex: 4000, maxHeight: '250px' }}
                >
                    <div className="p-2 border-bottom border-secondary sticky-top bg-dark">
                        <input
                            type="text"
                            className="tfe-input tfe-input--sm"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="options-list overflow-auto" style={{maxHeight: '200px'}}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.iso || `${option[valueKey]}-${option[labelKey]}`}
                                    className="p-2 cursor-pointer hover-bg-secondary d-flex align-items-center"
                                    onClick={() => handleSelect(option)}
                                    style={{cursor: 'pointer'}}
                                >
                                    {renderOption ? renderOption(option) : (
                                        <>
                                            {option[imageKey] && (
                                                <img src={option[imageKey]} alt="" className="me-2" style={{width: '24px', height: '16px', objectFit: 'cover'}} />
                                            )}
                                            <span className="text-white">{option[labelKey]}</span>
                                        </>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-2 text-muted text-center small">No results found</div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                .hover-bg-secondary:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                .rotate-180 {
                    transform: rotate(180deg);
                }
            `}</style>
        </div>
    );
}
