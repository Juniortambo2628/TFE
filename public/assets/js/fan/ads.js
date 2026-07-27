document.addEventListener('DOMContentLoaded', function() {
    const adContainers = document.querySelectorAll('.ad-banner-container');

    adContainers.forEach(container => {
        const placement = container.dataset.placement || 'BANNER';
        
        fetch(`/TFE/api/ads.php?action=serve&placement=${placement}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.ad) {
                    const ad = data.ad;
                    
                    // Create ad HTML
                    const adHtml = `
                        <div class="ad-banner" style="background-image: url('${ad.image_url}'); background-size: cover; background-position: center; height: 100px; width: 100%; position: relative; border-radius: 8px; overflow: hidden; cursor: pointer;">
                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; font-size: 12px;">
                                <span class="badge badge-warning">Ad</span> ${ad.partner_name}
                            </div>
                            <a href="${ad.click_url}" target="_blank" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;" onclick="trackClick(${ad.id})"></a>
                        </div>
                    `;
                    
                    container.innerHTML = adHtml;
                }
            })
            .catch(error => console.error('Error loading ad:', error));
    });
});

function trackClick(adId) {
    fetch('/TFE/api/ads.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'click',
            ad_id: adId
        })
    }).catch(error => console.error('Error tracking click:', error));
}
