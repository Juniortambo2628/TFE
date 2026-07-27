import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from '@inertiajs/react';
import FilePondUploader from '@/Components/Common/FilePondUploader';

export default function AdminCustomizeModal({ isOpen, onClose, cardData }) {
    const [files, setFiles] = useState([]);
    const { data, setData, post, processing, reset } = useForm({
        [cardData.settingsKey]: null,
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            onSuccess: () => {
                reset();
                setFiles([]);
                onClose();
            },
        });
    };

    const modalContent = (
        <>
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1070 }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content admin-card-dark border-0 shadow-lg">
                        <div className="modal-header border-bottom border-secondary p-3">
                            <h5 className="modal-title text-white d-flex align-items-center">
                                <i className="fas fa-paint-brush me-2 text-primary"></i>
                                Customizing: {cardData.label}
                            </h5>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white" 
                                onClick={onClose}
                                aria-label="Close"
                            ></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4">
                                <p className="text-white small mb-4" style={{ opacity: 0.7 }}>
                                    Choose a new background image for the <strong>{cardData.label}</strong> card. 
                                    This will override the category default for this specific card.
                                </p>
                                
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Background Image</label>
                                    <FilePondUploader 
                                        files={files}
                                        onUpdateFiles={(fileItems) => {
                                            setFiles(fileItems);
                                            if (fileItems[0]) setData(cardData.settingsKey, fileItems[0].file);
                                        }}
                                        labelIdle='Drop image or click to browse'
                                    />
                                </div>
                                
                                {cardData.currentImage && (
                                    <div className="mt-3">
                                        <label className="admin-form-label small opacity-50">Current Image</label>
                                        <div className="rounded overflow-hidden" style={{ height: '100px', border: '1px solid #333' }}>
                                            <img src={cardData.currentImage} className="w-100 h-100 object-fit-cover" alt="Current BG" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer border-top border-secondary p-3">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary text-white" 
                                    onClick={onClose}
                                    style={{ background: 'transparent', border: '1px solid #444' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary px-4"
                                    disabled={processing || files.length === 0}
                                >
                                    {processing ? 'Saving...' : 'Apply Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>
        </>
    );

    return createPortal(modalContent, document.body);
}
