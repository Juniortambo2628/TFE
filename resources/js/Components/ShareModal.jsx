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
            <form id="share-form" onSubmit={handleSubmit} className="share-form">
                <blockquote className="share-preview">{shareContent}</blockquote>

                <textarea
                    className="tfe-textarea"
                    placeholder="Add a message (optional)"
                    aria-label="Message"
                    value={data.message}
                    onChange={e => setData('message', e.target.value)}
                    rows="3"
                    maxLength={500}
                />

                <div className="share-recipients">
                    {activeTab === 'users' && (
                        <RecipientList
                            items={shareOptions.users}
                            type="user"
                            empty="No users available"
                            isSelected={isSelected}
                            onToggle={toggleRecipient}
                        />
                    )}
                    {activeTab === 'publicTribes' && (
                        <RecipientList
                            items={shareOptions.publicTribes}
                            type="tribe"
                            tag="Public"
                            empty="No public tribes available"
                            isSelected={isSelected}
                            onToggle={toggleRecipient}
                        />
                    )}
                    {activeTab === 'memberTribes' && (
                        <RecipientList
                            items={shareOptions.memberTribes}
                            type="tribe"
                            tag="Member"
                            empty="You're not a member of any tribes"
                            isSelected={isSelected}
                            onToggle={toggleRecipient}
                        />
                    )}
                </div>
            </form>
        </TfeModal>
    );
}

// One selectable row per fan or tribe. Same treatment as the team picker's
// `.tfe-team-card` — hairline at rest, brighter edge when picked — rather than
// Tailwind border utilities, which Bootstrap's `!important` `.border` overrides
// on dashboards.
function RecipientList({ items, type, tag, empty, isSelected, onToggle }) {
    if (!items.length) {
        return <p className="share-recipients__empty">{empty}</p>;
    }

    return items.map((item) => {
        const selected = isSelected(type, item.id);

        return (
            <button
                key={`${type}-${item.id}`}
                type="button"
                className={`share-recipient${selected ? ' is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onToggle(type, item.id, item.name)}
            >
                <span className={`share-recipient__avatar${type === 'tribe' ? ' share-recipient__avatar--tribe' : ''}`}>
                    {item.avatar || type === 'user' ? (
                        <img src={item.avatar || '/assets/img/avatars/default-avatar.png'} alt="" />
                    ) : (
                        <i className="fas fa-layer-group" aria-hidden="true" />
                    )}
                </span>
                <span className="share-recipient__body">
                    <span className="share-recipient__name">{item.name}</span>
                    {tag && <span className="share-recipient__tag">{tag}</span>}
                </span>
                <i className={`share-recipient__check fas ${selected ? 'fa-check-circle' : 'fa-circle'}`} aria-hidden="true" />
            </button>
        );
    });
}
