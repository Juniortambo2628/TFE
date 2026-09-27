import React, { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import TfeModal from '@/Components/Common/TfeModal';
import '../../css/fan/share-modal.css';

export default function ShareModal({ isOpen, onClose, shareType, shareId, shareContent }) {
    const [shareOptions, setShareOptions] = useState({ users: [], publicTribes: [], memberTribes: [] });
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'publicTribes', 'memberTribes'
    
    const { data, setData, post, processing, reset } = useForm({
        message: 'Check this out!',
    });

    useEffect(() => {
        if (isOpen) {
            fetchShareOptions();
        } else {
            setSelectedRecipients([]);
            reset();
        }
    }, [isOpen]);

    const fetchShareOptions = async () => {
        try {
            const response = await fetch(route('fan.share.options'));
            const data = await response.json();
            setShareOptions(data);
        } catch (error) {
            console.error('Error fetching share options:', error);
        }
    };

    const toggleRecipient = (type, id, name) => {
        setSelectedRecipients(prev => {
            const key = `${type}-${id}`;
            const exists = prev.find(r => r.key === key);
            if (exists) {
                return prev.filter(r => r.key !== key);
            } else {
                return [...prev, { type, id, name, key }];
            }
        });
    };

    const isSelected = (type, id) => {
        return selectedRecipients.some(r => r.type === type && r.id === id);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedRecipients.length === 0) {
            toast.warning('Please select at least one recipient');
            return;
        }

        router.post(route('fan.share'), {
            share_type: shareType,
            share_id: shareId,
            recipients: selectedRecipients.map(r => ({ type: r.type, id: r.id })),
            message: data.message,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                const response = window.page?.props?.flash?.shareResponse;
                if (response?.success) {
                    toast.success(`Shared successfully to ${response.messages_sent || selectedRecipients.length} ${response.messages_sent === 1 ? 'recipient' : 'recipients'}!`);
                } else {
                    toast.success('Shared successfully!');
                }
                onClose();
                reset();
                setSelectedRecipients([]);
            },
            onError: (errors) => {
                console.error('Share error:', errors);
                toast.error('Failed to share. Please try again.');
            },
        });
    };

    return (
        <TfeModal
            open={isOpen}
            onClose={onClose}
            size="lg"
            label="Share"
            title={shareType === 'post' ? 'Share post' : 'Share story'}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
                { id: 'users', label: 'Users', icon: 'fas fa-user' },
                { id: 'publicTribes', label: 'Public Tribes', icon: 'fas fa-globe' },
                { id: 'memberTribes', label: 'My Tribes', icon: 'fas fa-users' },
            ]}
            footer={(
                <>
                    <span className="tfe-modal__foot-note">
                        {selectedRecipients.length > 0 ? `${selectedRecipients.length} selected` : 'Pick at least one recipient'}
                    </span>
                    <button type="button" className="tfe-btn" onClick={onClose}>Cancel</button>
                    <button
                        type="submit"
                        form="share-form"
                        className="tfe-btn tfe-btn--filled"
                        disabled={processing || selectedRecipients.length === 0}
                    >
                        <i className={`fas ${processing ? 'fa-spinner fa-spin' : 'fa-share'}`} />
                        {processing ? 'Sharing…' : 'Share'}
                    </button>
                </>
            )}
        >
                <form id="share-form" onSubmit={handleSubmit}>
                    <div>
                        {/* Share Preview */}
                        <div className="share-preview mb-6">
                            <div className="share-preview-content rounded-xl overflow-hidden border border-white/10">
                                {shareContent}
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="share-message-input mb-6">
                            <textarea
                                className="tfe-textarea"
                                placeholder="Add a message (optional)"
                                value={data.message}
                                onChange={e => setData('message', e.target.value)}
                                rows="3"
                                maxLength={500}
                            ></textarea>
                        </div>
                        {/* Recipients List */}
                        <div className="share-recipients-list grid grid-cols-1 gap-2">
                            {activeTab === 'users' && (
                                <>
                                    {shareOptions.users.length > 0 ? (
                                        shareOptions.users.map(user => (
                                            <div
                                                key={`user-${user.id}`}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected('user', user.id) ? 'bg-red-600/10 border-red-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                                onClick={() => toggleRecipient('user', user.id, user.name)}
                                            >
                                                <img
                                                    src={user.avatar || '/assets/img/avatars/default-avatar.png'}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <span className="flex-1 text-white font-medium">{user.name}</span>
                                                {isSelected('user', user.id) && (
                                                    <i className="fas fa-check-circle text-red-500 text-xl"></i>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">No users available</div>
                                    )}
                                </>
                            )}

                            {activeTab === 'publicTribes' && (
                                <>
                                    {shareOptions.publicTribes.length > 0 ? (
                                        shareOptions.publicTribes.map(tribe => (
                                            <div
                                                key={`tribe-${tribe.id}`}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected('tribe', tribe.id) ? 'bg-red-600/10 border-red-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                                onClick={() => toggleRecipient('tribe', tribe.id, tribe.name)}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-red-400 overflow-hidden">
                                                    {tribe.avatar ? (
                                                        <img src={tribe.avatar} alt={tribe.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <i className="fas fa-layer-group"></i>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="block text-white font-medium">{tribe.name}</span>
                                                    <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Public</span>
                                                </div>
                                                {isSelected('tribe', tribe.id) && (
                                                    <i className="fas fa-check-circle text-red-500 text-xl"></i>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">No public tribes available</div>
                                    )}
                                </>
                            )}

                            {activeTab === 'memberTribes' && (
                                <>
                                    {shareOptions.memberTribes.length > 0 ? (
                                        shareOptions.memberTribes.map(tribe => (
                                            <div
                                                key={`tribe-${tribe.id}`}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected('tribe', tribe.id) ? 'bg-red-600/10 border-red-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                                onClick={() => toggleRecipient('tribe', tribe.id, tribe.name)}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 overflow-hidden">
                                                    {tribe.avatar ? (
                                                        <img src={tribe.avatar} alt={tribe.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <i className="fas fa-layer-group"></i>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="block text-white font-medium">{tribe.name}</span>
                                                    <span className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Member</span>
                                                </div>
                                                {isSelected('tribe', tribe.id) && (
                                                    <i className="fas fa-check-circle text-red-500 text-xl"></i>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">You're not a member of any tribes</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </TfeModal>
    );
}
