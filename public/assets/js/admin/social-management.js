/**
 * Admin Social Management
 *
 * Handles conversation modal viewing.
 */

(function () {
  'use strict';

  let conversationModal;

  /**
   * Initialize modal on DOM ready
   */
  function initModal() {
    conversationModal = window.initAdminModal('conversationModal');
  }

  /**
   * View conversation details
   * @param {string|number} conversationId - Conversation ID
   */
  window.viewConversation = async function (conversationId) {
    const content = document.getElementById('conversationContent');
    if (!content) return;

    content.innerHTML = '<div class="loading">Loading conversation...</div>';

    conversationModal = window.showAdminModal(conversationModal, 'conversationModal');
    if (!conversationModal) return;

    const response = await fetch(
      `api/conversation-details.php?conversation_id=${conversationId}`
    );
    await window.handleModalApiResponse(
      response,
      content,
      (data) => {
        let html = `
                    <div class="conversation-info mb-4">
                        <p><strong>Type:</strong> ${data.conversation.type}</p>
                        <p><strong>Participants:</strong> ${data.participants.map(p => p.name).join(', ')}</p>
                        <p><strong>Total Messages:</strong> ${data.messages.length}</p>
                    </div>
                    <h6>Messages</h6>
                    <div class="messages-list" style="max-height: 400px; overflow-y: auto;">
                `;

        data.messages.forEach(msg => {
          html += `
                        <div class="message mb-3 p-3" style="background: #2a2a2a; border-radius: 8px;">
                            <div class="d-flex justify-content-between mb-2">
                                <strong>${msg.sender_name}</strong>
                                <small class="text-muted">${new Date(msg.created_at).toLocaleString()}</small>
                            </div>
                            <p class="mb-0">${msg.content}</p>
                        </div>
                    `;
        });

        html += '</div>';
        return html;
      },
      'Failed to load conversation'
    );
  };

  // Initialize modal when DOM is ready
  window.initModalOnReady('conversationModal', (modal) => {
    conversationModal = modal;
  });
})();
