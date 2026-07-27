import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options, value, onChange, placeholder, renderOption, labelKey = 'label', valueKey = 'value', imageKey = 'image', searchKeys = [labelKey] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

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
                className="form-control pill-input d-flex align-items-center justify-content-between cursor-pointer" 
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

            {isOpen && (
                <div className="searchable-select-dropdown position-absolute w-100 bg-dark border border-secondary rounded mt-1 overflow-hidden" style={{zIndex: 1000, maxHeight: '250px'}}>
                    <div className="p-2 border-bottom border-secondary sticky-top bg-dark">
                        <input 
                            type="text" 
                            className="form-control form-control-sm pill-input bg-black text-white border-secondary" 
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
                </div>
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
