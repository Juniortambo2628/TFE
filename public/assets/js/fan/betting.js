document.addEventListener('DOMContentLoaded', function() {
    const matchesContainer = document.getElementById('matchesContainer');
    const predictionModal = $('#predictionModal');
    const predictionForm = document.getElementById('predictionForm');
    const matchTitle = document.getElementById('matchTitle');
    const matchIdInput = document.getElementById('matchId');
    const oddsDisplay = document.getElementById('oddsDisplay');
    const betNowBtn = document.getElementById('betNowBtn');
    const partnerName = document.getElementById('partnerName');

    // Mock Matches (Ideally from VenueService via API)
    const matches = [
        { id: 'match_01', team_a: 'Brazil', team_b: 'France', date: '2026-06-15' },
        { id: 'match_02', team_a: 'Argentina', team_b: 'Germany', date: '2026-06-16' },
        { id: 'match_03', team_a: 'Kenya', team_b: 'USA', date: '2026-06-17' }
    ];

    renderMatches();

    function renderMatches() {
        let html = '';
        matches.forEach(match => {
            html += `
                <div class="match-card p-3 mb-3 border rounded d-flex justify-content-between align-items-center bg-white">
                    <div class="match-info">
                        <h5 class="mb-1">${match.team_a} vs ${match.team_b}</h5>
                        <small class="text-muted">${match.date}</small>
                    </div>
                    <button class="btn btn-outline-primary predict-btn" data-id="${match.id}" data-teams="${match.team_a} vs ${match.team_b}">
                        Predict
                    </button>
                </div>
            `;
        });
        matchesContainer.innerHTML = html;

        document.querySelectorAll('.predict-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const teams = this.dataset.teams;
                openPredictionModal(id, teams);
            });
        });
    }

    function openPredictionModal(id, teams) {
        matchIdInput.value = id;
        matchTitle.textContent = teams;
        document.getElementById('scoreA').value = '';
        document.getElementById('scoreB').value = '';
        
        // Fetch Odds
        fetch(`/TFE/api/gamification.php?action=odds&match_id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const odds = data.odds;
                    oddsDisplay.innerHTML = `
                        <span class="badge badge-light p-2">1: ${odds.home_win}</span>
                        <span class="badge badge-light p-2">X: ${odds.draw}</span>
                        <span class="badge badge-light p-2">2: ${odds.away_win}</span>
                    `;
                    partnerName.textContent = odds.provider;
                    
                    // Setup affiliate link tracking
                    betNowBtn.href = `https://example.com/bet/${id}`; // Mock URL
                    betNowBtn.onclick = (e) => {
                        trackClick(id, odds.provider);
                    };
                }
            });

        predictionModal.modal('show');
    }

    function trackClick(matchId, partnerRef) {
        fetch('/TFE/api/gamification.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'click',
                match_id: matchId,
                partner_ref: partnerRef
            })
        });
    }

    predictionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const matchId = matchIdInput.value;
        const scoreA = document.getElementById('scoreA').value;
        const scoreB = document.getElementById('scoreB').value;
        const predictedScore = `${scoreA}-${scoreB}`;

        fetch('/TFE/api/gamification.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'predict',
                match_id: matchId,
                predicted_score: predictedScore
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                predictionModal.modal('hide');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    });
});
