import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="admin-card-dark max-w-xl border-0 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold text-white border-b border-white/10 pb-4">
                        Share {shareType === 'post' ? 'Post' : 'Story'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
                    <div className="share-modal-body p-6 overflow-y-auto custom-scrollbar">
                        {/* Share Preview */}
                        <div className="share-preview mb-6">
                            <div className="share-preview-content rounded-xl overflow-hidden border border-white/10">
                                {shareContent}
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="share-message-input mb-6">
                            <textarea
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all outline-none"
                                placeholder="Add a message (optional)"
                                value={data.message}
                                onChange={e => setData('message', e.target.value)}
                                rows="3"
                                maxLength={500}
                            ></textarea>
                        </div>

                        {/* Tabs */}
                        <div className="share-tabs flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
                            {['users', 'publicTribes', 'memberTribes'].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    <i className={`fas fa-${tab === 'users' ? 'user' : tab === 'publicTribes' ? 'globe' : 'users'}`}></i>
                                    {tab === 'users' ? 'Users' : tab === 'publicTribes' ? 'Public Tribes' : 'My Tribes'}
                                </button>
                            ))}
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

                    <DialogFooter className="p-6 bg-white/5 flex items-center justify-between border-t border-white/5">
                        <div className="text-sm text-gray-400">
                            {selectedRecipients.length > 0 && (
                                <span>{selectedRecipients.length} selected</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-all"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50 disabled:shadow-none"
                                disabled={processing || selectedRecipients.length === 0}
                            >
                                {processing ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin me-2"></i>Sharing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-share me-2"></i>Share
                                    </>
                                )}
                            </button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
