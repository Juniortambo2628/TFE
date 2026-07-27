document.addEventListener('DOMContentLoaded', function() {
    const matchesContainer = document.getElementById('matchesContainer');
    const budgetForm = document.getElementById('budgetForm');
    const resultContainer = document.getElementById('resultContainer');
    const totalCostEl = document.getElementById('totalCost');
    const breakdownList = document.getElementById('breakdownList');
    
    let currentBudget = null;
    let allMatches = []; 
    let currentWizardMethod = '';

    // Load matches from local World Cup 2026 data
    if (typeof WorldCup2026Data !== 'undefined') {
        // Transform local data to match expected structure
        allMatches = WorldCup2026Data.matches.map(m => {
            const stadium = WorldCup2026Data.getStadiumInfo(m.venue);
            return {
                fixture: {
                    id: m.id,
                    date: m.date + 'T' + m.time + ':00',
                    venue: {
                        name: m.venue,
                        city: stadium ? stadium.city : '',
                        country: stadium ? stadium.country : '',
                        capacity: stadium ? stadium.capacity : 0,
                        officialName: stadium ? stadium.officialName : m.venue
                    }
                },
                league: {
                    round: m.stage
                },
                teams: {
                    home: { name: m.homeTeam },
                    away: { name: m.awayTeam }
                },
                group: m.group,
                matchday: m.matchday
            };
        });
        console.log('World Cup 2026 matches loaded:', allMatches.length);
    } else {
        console.error('WorldCup2026Data not available. Make sure world-cup-2026-matches.js is loaded.');
    }

    let selectedOptions = [];

    // Wizard Functions - Explicitly attach to window
    // Wizard Filter Logic
    let selectedStadiums = [];
    let selectedStages = [];
    let selectedGroups = [];
    let selectedTeams = [];

    window.selectWizardMethod = function(method) {
        // Method is now just 'filter'
        document.getElementById('wizardStep1').style.display = 'none';
        document.getElementById('wizardStep2').style.display = 'block';
        openSelectionModal();
    };

    window.openSelectionModal = function() {
        const modal = document.getElementById('selectionModal');
        const grid = document.getElementById('selectionGrid');
        const title = document.getElementById('modalTitle');
        
        // Setup Tabs with counters
        updateTabsWithCounters();
        
        renderFilterGrid('stadium');
        modal.style.display = 'flex';
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        // Add click outside to close
        setTimeout(() => {
            modal.onclick = function(event) {
                if (event.target === modal) {
                    closeSelectionModal();
                }
            };
        }, 100);
    };

    window.closeSelectionModal = function() {
        const modal = document.getElementById('selectionModal');
        modal.style.display = 'none';
        modal.onclick = null; // Remove handler
        
        // Restore body scroll when modal closes
        document.body.style.overflow = '';
    };

    window.switchFilterTab = function(tab) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        renderFilterGrid(tab);
    };

    function renderFilterGrid(type) {
        const grid = document.getElementById('selectionGrid');
        grid.innerHTML = '';
        
        if (type === 'stadium') {
            const venues = [...new Set(allMatches.map(m => m.fixture?.venue?.name).filter(Boolean))].sort();
            // Stadium images mapping with World Cup 2026 venues
            const stadiumImageMap = {
                'Mexico City Stadium': 'Estadio_Azteca_desde_el_aire_1.webp',
                'Estadio Guadalajara': 'Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho.webp',
                'Estadio Monterrey': 'Estadio_BBVA.webp',
                'Toronto Stadium': 'BMO_Field.webp',
                'BC Place Vancouver': 'BC_Place_Opening_Day_2011-09-30.webp',
                'Los Angeles Stadium': 'sofi_stadium.webp',
                'New York New Jersey Stadium': 'Metlife_stadium.webp',
                'Dallas Stadium': 'Arlington_June_2020_2_(AT&T_Stadium).webp',
                'Atlanta Stadium': 'mercedes_benz_stadium.webp',
                'Houston Stadium': 'Nrgstadium0.webp',
                'Philadelphia Stadium': 'Lincoln_Financial_Field.webp',
                'Miami Stadium': 'Hard_Rock_Stadium_2017.webp',
                'Seattle Stadium': 'CenturyLink_Field_&_Safeco_Field.webp',
                'San Francisco Bay Area Stadium': 'Levis_Stadium.webp',
                'Boston Stadium': 'Gillette_Stadium_entrance_and_lighthouse.webp',
                'Kansas City Stadium': 'Arrowhead_Stadium_(October_27,_2019_-_2).webp'
            };

            venues.forEach(venue => {
                const isSelected = selectedStadiums.includes(venue);
                const match = allMatches.find(m => m.fixture?.venue?.name === venue);
                const capacity = match?.fixture?.venue?.capacity || 0;
                const city = match?.fixture?.venue?.city || '';
                const country = match?.fixture?.venue?.country || '';
                let imgSrc = '/TFE/assets/img/backdrops/stadium-sideview.jpg';
                if (stadiumImageMap[venue]) {
                    imgSrc = `/TFE/assets/stadium_selection_modal/${stadiumImageMap[venue]}`;
                }
                
                // Format capacity nicely
                const capacityText = capacity > 0 ? `${(capacity / 1000).toFixed(0)}K` : '';
                const countryFlag = country === 'USA' ? '🇺🇸' : country === 'Mexico' ? '🇲🇽' : country === 'Canada' ? '🇨🇦' : '';

                grid.innerHTML += `
                    <div class="selection-card stadium-card ${isSelected ? 'selected' : ''}" onclick="toggleFilterOption(this, 'stadium', '${venue}')">
                        <img src="${imgSrc}" class="card-image" loading="lazy" onerror="this.src='/TFE/assets/img/backdrops/stadium-sideview.jpg'">
                        <div class="card-label">${venue}</div>
                        <div class="card-sublabel stadium-info">
                            <span class="stadium-location">${countryFlag} ${city}</span>
                            ${capacityText ? `<span class="stadium-capacity"><i class="fas fa-users"></i> ${capacityText}</span>` : ''}
                        </div>
                    </div>
                `;
            });
        } else if (type === 'stage') {
            const stages = [...new Set(allMatches.map(m => m.league?.round).filter(Boolean))].sort();
            const stageOrder = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third Place', 'Final'];
            stages.sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b));
            
            stages.forEach(stage => {
                const isSelected = selectedStages.includes(stage);
                let icon = 'fa-trophy';
                if (stage.includes('Group')) icon = 'fa-users';
                if (stage.includes('Final')) icon = 'fa-medal';
                
                grid.innerHTML += `
                    <div class="selection-card ${isSelected ? 'selected' : ''}" onclick="toggleFilterOption(this, 'stage', '${stage}')">
                        <div class="card-icon"><i class="fas ${icon}"></i></div>
                        <div class="card-label">${stage}</div>
                    </div>
                `;
            });
        } else if (type === 'group') {
            // Group filter - show all teams with individual selection
            const groups = typeof WorldCup2026Data !== 'undefined' ? WorldCup2026Data.getAllGroups() : [];
            
            groups.forEach(groupLetter => {
                const groupInfo = typeof WorldCup2026Data !== 'undefined' ? WorldCup2026Data.groups[groupLetter] : null;
                const teams = groupInfo ? groupInfo.teams : [];
                
                // Create team list HTML with individual selection
                const teamListHTML = teams.map(team => {
                    const isTeamSelected = selectedTeams.includes(team);
                    const escapedTeam = team.replace(/'/g, "\\'");
                    return `<li class="team-item ${isTeamSelected ? 'selected' : ''}" onclick="event.stopPropagation(); toggleTeamSelection('${escapedTeam}', this)">${team}</li>`;
                }).join('');
                
                grid.innerHTML += `
                    <div class="selection-card group-card">
                        <div class="group-card-header">
                            <span class="group-letter">Group ${groupLetter}</span>
                        </div>
                        <ul class="group-team-list">
                            ${teamListHTML}
                        </ul>
                    </div>
                `;
            });
        }
    }

    // Team selection handler
    window.toggleTeamSelection = function(teamName, element) {
        element.classList.toggle('selected');
        if (selectedTeams.includes(teamName)) {
            selectedTeams = selectedTeams.filter(t => t !== teamName);
        } else {
            selectedTeams.push(teamName);
        }
        updateFilterSummary();
    };

    window.toggleFilterOption = function(card, type, value) {
        card.classList.toggle('selected');
        if (type === 'stadium') {
            if (selectedStadiums.includes(value)) selectedStadiums = selectedStadiums.filter(i => i !== value);
            else selectedStadiums.push(value);
        } else if (type === 'stage') {
            if (selectedStages.includes(value)) selectedStages = selectedStages.filter(i => i !== value);
            else selectedStages.push(value);
        }
        updateFilterSummary();
    };

    function updateFilterSummary() {
        const container = document.getElementById('selectionSummary');
        const total = selectedStadiums.length + selectedStages.length + selectedTeams.length;
        if (total === 0) {
            container.innerHTML = '<p>No filters selected (Showing All)</p>';
        } else {
            let tags = '';
            if (selectedStadiums.length > 0) tags += `<span class="selection-tag">${selectedStadiums.length} Stadiums</span>`;
            if (selectedStages.length > 0) tags += `<span class="selection-tag">${selectedStages.length} Stages</span>`;
            if (selectedTeams.length > 0) tags += `<span class="selection-tag">${selectedTeams.length} Teams</span>`;
            container.innerHTML = tags;
        }
        // Update tab badges
        updateTabsWithCounters();
    }

    function updateTabsWithCounters() {
        const title = document.getElementById('modalTitle');
        if (!title) return;
        
        const stadiumBadge = selectedStadiums.length > 0 ? `<span class="badge">${selectedStadiums.length}</span>` : '';
        const stageBadge = selectedStages.length > 0 ? `<span class="badge">${selectedStages.length}</span>` : '';
        const teamBadge = selectedTeams.length > 0 ? `<span class="badge">${selectedTeams.length}</span>` : '';
        
        const activeTab = document.querySelector('.filter-tab.active')?.dataset?.tab || 'stadium';
        
        title.innerHTML = `
            <div class="filter-tabs">
                <button class="filter-tab ${activeTab === 'stadium' ? 'active' : ''}" data-tab="stadium" onclick="switchFilterTab('stadium')">
                    Stadiums${stadiumBadge}
                </button>
                <button class="filter-tab ${activeTab === 'stage' ? 'active' : ''}" data-tab="stage" onclick="switchFilterTab('stage')">
                    Stages${stageBadge}
                </button>
                <button class="filter-tab ${activeTab === 'group' ? 'active' : ''}" data-tab="group" onclick="switchFilterTab('group')">
                    Teams${teamBadge}
                </button>
            </div>
        `;
    }

    window.loadWizardMatches = function() {
        let filteredMatches = allMatches;

        if (selectedStadiums.length > 0) {
            filteredMatches = filteredMatches.filter(m => selectedStadiums.includes(m.fixture?.venue?.name));
        }
        
        if (selectedStages.length > 0) {
            filteredMatches = filteredMatches.filter(m => selectedStages.includes(m.league?.round));
        }
        
        // Filter by selected teams (home or away)
        if (selectedTeams.length > 0) {
            filteredMatches = filteredMatches.filter(m => 
                selectedTeams.includes(m.teams?.home?.name) || selectedTeams.includes(m.teams?.away?.name)
            );
        }

        renderMatches(filteredMatches);
        document.getElementById('wizardStep2').style.display = 'none';
        document.getElementById('wizardStep3').style.display = 'block';
        closeSelectionModal();
    };

    function renderMatches(matches) {
        const container = document.getElementById('matchesContainer');
        if (matches.length === 0) {
            container.innerHTML = '<p>No matches found for this selection.</p>';
            return;
        }
        
        // Helper to generate unique color for each team
        const getTeamColor = (teamName, isHome) => {
            let hash = 0;
            for (let i = 0; i < teamName.length; i++) {
                hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = hash % 360;
            const saturation = 65 + (hash % 20);
            const lightness = isHome ? 50 : 55;
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        };

        // Get country flag based on venue country
        const getCountryFlag = (country) => {
            const flags = { 'USA': '🇺🇸', 'Mexico': '🇲🇽', 'Canada': '🇨🇦' };
            return flags[country] || '🏟️';
        };
        
        let matchesHtml = matches.map(match => {
            const homeColor = getTeamColor(match.teams?.home?.name || 'Home', true);
            const awayColor = getTeamColor(match.teams?.away?.name || 'Away', false);
            const venue = match.fixture?.venue;
            const matchDate = new Date(match.fixture?.date);
            const formattedDate = matchDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const formattedTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const groupBadge = match.group ? `<span class="group-badge">Group ${match.group}</span>` : '';

            return `
            <div class="match-card" onclick="toggleMatchSelection('${match.fixture?.id}')">
                <input type="checkbox" class="match-checkbox" id="match_${match.fixture?.id}" value="${match.fixture?.id}">
                <div class="match-header">
                    <i class="fas fa-shield-alt match-flag" style="color: ${homeColor}; margin-right: 8px;"></i>
                    <div class="match-teams">${match.teams?.home?.name} vs ${match.teams?.away?.name}</div>
                    <i class="fas fa-shield-alt match-flag" style="color: ${awayColor}; margin-left: 8px;"></i>
                </div>
                <div class="match-details">
                    <i class="fas fa-map-marker-alt"></i> 
                    <span class="venue-flag">${getCountryFlag(venue?.country)}</span>
                    ${venue?.officialName || venue?.name}, ${venue?.city}
                    ${venue?.capacity ? `<span class="capacity-badge">${(venue.capacity / 1000).toFixed(0)}K</span>` : ''}
                </div>
                <div class="match-details">
                    <i class="fas fa-calendar"></i> ${formattedDate} at ${formattedTime}
                </div>
                <div class="match-details">
                    <i class="fas fa-trophy"></i> ${match.league?.round} ${groupBadge}
                </div>
            </div>
            `;
        }).join('');
        container.innerHTML = matchesHtml;
    }

    // ... (existing toggleMatchSelection) ...

    function renderSavedBudgets(budgets) {
        const list = document.getElementById('savedBudgetsList');
        if (budgets.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No saved itineraries yet.</p></div>';
            return;
        }

        list.innerHTML = budgets.map(budget => `
            <div class="saved-budget-item ${budget.is_active ? 'active' : ''}">
                <div class="budget-info">
                    <h4>
                        <span id="budgetName_${budget.id}">${budget.name || 'World Cup Trip'}</span>
                        <button class="btn-icon-small" onclick="renameBudget(${budget.id}, '${budget.name || 'World Cup Trip'}')" title="Rename">
                            <i class="fas fa-pen"></i>
                        </button>
                        ${budget.is_active ? '<span class="active-badge">Active</span>' : ''}
                    </h4>
                    <div class="budget-meta">
                        <span><i class="fas fa-calendar"></i> ${new Date(budget.created_at).toLocaleDateString()}</span>
                        <span><i class="fas fa-coins"></i> KES ${new Intl.NumberFormat().format(budget.total_cost)}</span>
                        <span><i class="fas fa-futbol"></i> ${budget.match_ids.length} Matches</span>
                    </div>
                </div>
                <div class="budget-actions">
                    <button class="btn btn-sm btn-primary" onclick='loadBudget(${JSON.stringify(budget)})'>
                        <i class="fas fa-upload"></i> Load
                    </button>
                    ${!budget.is_active ? `
                    <button class="btn btn-sm btn-success" onclick="setActiveBudget(${budget.id})">
                        <i class="fas fa-check"></i> Set Active
                    </button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteBudget(${budget.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.renameBudget = function(budgetId, currentName) {
        const newName = prompt("Enter new name for this itinerary:", currentName);
        if (newName && newName !== currentName) {
            fetch('/TFE/api/itinerary.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'rename', budget_id: budgetId, name: newName })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    openSavedBudgetsModal(); // Reload list
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(err => console.error(err));
        }
    };

    // Toggle match selection
    window.toggleMatchSelection = function(matchId) {
        const checkbox = document.getElementById(`match_${matchId}`);
        const card = checkbox.closest('.match-card');
        checkbox.checked = !checkbox.checked;
        card.classList.toggle('selected', checkbox.checked);
    };

    // Accommodation Selection Logic
    const accommodationCards = document.querySelectorAll('.option-card');
    accommodationCards.forEach(card => {
        card.addEventListener('click', function() {
            const groupName = this.querySelector('input[type="radio"]').name;
            document.querySelectorAll(`input[name="${groupName}"]`).forEach(input => {
                input.closest('.option-card').classList.remove('active');
            });
            this.classList.add('active');
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
        });
    });

    // Live Currency Logic
    let exchangeRates = { KES: 1 }; // Default fallback
    let currentCurrency = 'KES';
    
    const currencies = [
        { code: 'KES', flag: '🇰🇪', symbol: 'KES' },
        { code: 'USD', flag: '🇺🇸', symbol: '$' },
        { code: 'EUR', flag: '🇪🇺', symbol: '€' },
        { code: 'GBP', flag: '🇬🇧', symbol: '£' },
        { code: 'ZAR', flag: '🇿🇦', symbol: 'R' },
        { code: 'NGN', flag: '🇳🇬', symbol: '₦' }
    ];

    // Fetch Rates
    fetch('/TFE/api/currency.php?action=get_rates&base=USD')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Normalize rates to KES base if needed, or just store USD base
                // Since our base costs are likely in KES or USD, let's handle conversion carefully.
                // Assuming base costs in DB are in KES.
                // We need KES -> Target Rate.
                // API gives USD -> Target.
                // So KES -> Target = (USD -> Target) / (USD -> KES)
                
                const usdToKes = data.rates['KES'];
                exchangeRates = {};
                
                for (const [code, rate] of Object.entries(data.rates)) {
                    exchangeRates[code] = rate / usdToKes; // Rate relative to KES
                }
                
                // Ensure KES is exactly 1
                exchangeRates['KES'] = 1;
                
                console.log('Exchange rates loaded (Base KES):', exchangeRates);
                initCurrencyMenu();
            }
        })
        .catch(err => console.error('Failed to load rates:', err));

    function initCurrencyMenu() {
        const menu = document.getElementById('currencyMenu');
        if (!menu) return;

        menu.innerHTML = currencies.map(c => `
            <div class="currency-option ${c.code === currentCurrency ? 'selected' : ''}" 
                 onclick="selectCurrency('${c.code}', '${c.flag}')">
                <span class="currency-flag">${c.flag}</span>
                <span class="currency-code">${c.code}</span>
                <span class="currency-symbol">${c.symbol}</span>
            </div>
        `).join('');
    }

    window.toggleCurrencyMenu = function() {
        document.getElementById('currencySelector').classList.toggle('active');
    };

    window.selectCurrency = function(code, flag) {
        currentCurrency = code;
        document.getElementById('currentCode').textContent = code;
        document.getElementById('currentFlag').textContent = flag;
        document.getElementById('currencySelector').classList.remove('active');
        
        // Update menu selection
        document.querySelectorAll('.currency-option').forEach(opt => {
            opt.classList.toggle('selected', opt.querySelector('.currency-code').textContent === code);
        });

        updateCurrency();
    };

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        const selector = document.getElementById('currencySelector');
        if (selector && !selector.contains(e.target)) {
            selector.classList.remove('active');
        }
    });

    // Override existing updateCurrency
    window.updateCurrency = function() {
        const totalElement = document.getElementById('totalCost');
        if (!currentBudget) return;

        let costInKes = currentBudget.total_estimated_cost; // Assuming base is KES
        let rate = exchangeRates[currentCurrency] || 1;
        let convertedCost = costInKes * rate;
        
        const symbol = currencies.find(c => c.code === currentCurrency)?.symbol || currentCurrency;
        
        totalElement.textContent = symbol + ' ' + new Intl.NumberFormat().format(Math.round(convertedCost));
    };


    budgetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const selectedMatches = Array.from(document.querySelectorAll('.match-checkbox:checked')).map(cb => cb.value);
        const accommodationLevel = document.querySelector('input[name="accommodationLevel"]:checked')?.value || '3_star';
        const flightClass = document.querySelector('input[name="flightClass"]:checked')?.value || 'economy';
        const nights = parseInt(document.getElementById('nights')?.value) || 7;

        if (selectedMatches.length === 0) {
            alert('Please select at least one match.');
            return;
        }

        const btn = budgetForm.querySelector('.btn-calculate');
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Calculating...</span>';

        fetch('/TFE/api/itinerary.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'calculate',
                matches: selectedMatches,
                accommodation_level: accommodationLevel,
                flight_class: flightClass,
                nights: nights
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentBudget = data.data; // Update currentBudget BEFORE displayResults
                displayResults(data.data);
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error))
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        });
    });

    // Back button logic for Wizard Step 3
    window.goBackToOptions = function() {
        document.getElementById('wizardStep3').style.display = 'none';
        document.getElementById('wizardStep2').style.display = 'block';
        openSelectionModal();
    };

    function displayResults(data) {
        const breakdown = data.breakdown;
        
        // Update Hero Total
        updateCurrency(); 

        const breakdownList = document.getElementById('breakdownList');
        breakdownList.innerHTML = ''; // Clear existing content
        breakdownList.className = 'breakdown-accordion'; // Change class for styling

        // 1. Create Tabs for Summary vs Breakdown
        const tabsHtml = `
            <div class="result-tabs">
                <button class="result-tab active" onclick="switchResultTab('breakdown')">Cost Breakdown</button>
                <button class="result-tab" onclick="switchResultTab('summary')">Selection Summary</button>
            </div>
        `;
        
        // 2. Create Breakdown Accordion Content
        let breakdownHtml = '<div id="tab-breakdown" class="result-tab-content active">';
        
        const categories = [
            { key: 'match_tickets', label: 'Match Tickets', icon: 'fa-ticket-alt' },
            { key: 'accommodation', label: 'Accommodation', icon: 'fa-hotel' },
            { key: 'flights', label: 'Flights', icon: 'fa-plane' },
            { key: 'local_transport', label: 'Local Transport', icon: 'fa-bus' },
            { key: 'food_and_drink', label: 'Food & Drink', icon: 'fa-utensils' },
            { key: 'miscellaneous', label: 'Miscellaneous', icon: 'fa-ellipsis-h' }
        ];

        categories.forEach(cat => {
            const cost = breakdown[cat.key] || 0;
            let details = '';
            
            // Add specific details based on category
            if (cat.key === 'flights' && breakdown.flight_details) {
                details = `<ul class="detail-list">${breakdown.flight_details.map(d => `<li>${d}</li>`).join('')}</ul>`;
            } else if (cat.key === 'match_tickets') {
                const matchCount = document.querySelectorAll('.match-checkbox:checked').length;
                details = `<p class="detail-text">Estimated for ${matchCount} match(es) based on Category 2/3 average prices.</p>`;
            } else if (cat.key === 'accommodation') {
                const nights = document.getElementById('nights').value;
                const level = document.querySelector('input[name="accommodationLevel"]:checked')?.closest('.option-card').querySelector('h4').textContent;
                details = `<p class="detail-text">${nights} nights at ${level} level.</p>`;
            } else {
                details = `<p class="detail-text">Estimated daily allowance based on standard fan consumption.</p>`;
            }

            breakdownHtml += `
                <div class="accordion-item">
                    <div class="accordion-header" onclick="toggleAccordion(this)">
                        <div class="accordion-title">
                            <i class="fas ${cat.icon}"></i> ${cat.label}
                        </div>
                        <div class="accordion-cost">KES ${new Intl.NumberFormat().format(cost)}</div>
                        <i class="fas fa-chevron-down accordion-icon"></i>
                    </div>
                    <div class="accordion-body">
                        ${details}
                    </div>
                </div>
            `;
        });
        breakdownHtml += '</div>';

        // 3. Create Summary Content
        const selectedMatches = Array.from(document.querySelectorAll('.match-checkbox:checked')).map(cb => {
            const card = cb.closest('.match-card');
            return card.querySelector('.match-teams').textContent + ' (' + card.querySelectorAll('.match-details')[2].textContent.replace('🏆', '').trim() + ')';
        });
        const accLevel = document.querySelector('input[name="accommodationLevel"]:checked')?.closest('.option-card').querySelector('h4').textContent;
        const flightClass = document.querySelector('input[name="flightClass"]:checked')?.closest('.option-card').querySelector('h4').textContent;
        const duration = document.getElementById('nights').value;

        let summaryHtml = `
            <div id="tab-summary" class="result-tab-content" style="display: none;">
                <div class="summary-group">
                    <h4><i class="fas fa-futbol"></i> Selected Matches (${selectedMatches.length})</h4>
                    <ul class="summary-list">
                        ${selectedMatches.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>
                <div class="summary-group">
                    <h4><i class="fas fa-suitcase"></i> Trip Details</h4>
                    <ul class="summary-list">
                        <li><strong>Accommodation:</strong> ${accLevel}</li>
                        <li><strong>Flight Class:</strong> ${flightClass}</li>
                        <li><strong>Duration:</strong> ${duration} Days</li>
                    </ul>
                </div>
            </div>
        `;

        // Combine and Render
        const container = document.querySelector('.breakdown-details');
        // Insert tabs before the list
        if (!container.querySelector('.result-tabs')) {
            container.insertAdjacentHTML('afterbegin', tabsHtml);
        }
        
        breakdownList.innerHTML = breakdownHtml + summaryHtml;
        
        // Show results container
        document.getElementById('resultContainer').style.display = 'block';
        
        // Render Chart
        const labels = [];
        const values = [];
        const colors = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a'];

        categories.forEach((cat, idx) => {
            const cost = breakdown[cat.key] || 0;
            if (cost > 0) {
                labels.push(cat.label);
                values.push(cost);
            }
        });

        const ctx = document.getElementById('budgetChart').getContext('2d');
        if (window.myBudgetChart) {
            window.myBudgetChart.destroy();
        }
        
        window.myBudgetChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    hoverBackgroundColor: colors,
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }],
            },
            options: {
                maintainAspectRatio: false,
                tooltips: {
                    backgroundColor: "rgb(255,255,255)",
                    bodyFontColor: "#858796",
                    borderColor: '#dddfeb',
                    borderWidth: 1,
                    xPadding: 15,
                    yPadding: 15,
                    displayColors: false,
                    caretPadding: 10,
                },
                legend: {
                    display: false
                },
                cutoutPercentage: 80,
            },
        });
        
        // Scroll to results
        document.getElementById('resultContainer').scrollIntoView({ behavior: 'smooth' });
    }

    // Back to Step 1 function
    window.backToStep1 = function() {
        document.getElementById('wizardStep2').style.display = 'none';
        document.getElementById('wizardStep1').style.display = 'block';
    };

    // Helper functions for new UI
    window.switchResultTab = function(tabName) {
        document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        document.querySelectorAll('.result-tab-content').forEach(c => c.style.display = 'none');
        document.getElementById('tab-' + tabName).style.display = 'block';
    };

    window.toggleAccordion = function(header) {
        const item = header.parentElement;
        item.classList.toggle('active');
    };

    // Save Itinerary Button Handler
    const saveBtn = document.getElementById('saveItineraryBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            if (!currentBudget) return;

            const selectedMatches = Array.from(document.querySelectorAll('.match-checkbox:checked')).map(cb => cb.value);
            const accommodationLevel = document.querySelector('input[name="accommodationLevel"]:checked')?.value || '3_star';
            const flightClass = document.querySelector('input[name="flightClass"]:checked')?.value || 'economy';

            const name = prompt("Enter a name for this itinerary:", "My World Cup Trip");
            if (!name) return;

            const btn = this;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            fetch('/TFE/api/itinerary.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    name: name,
                    matches: selectedMatches,
                    accommodation_level: accommodationLevel,
                    flight_class: flightClass,
                    budget_data: currentBudget,
                    is_active: false
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Itinerary saved! Budget ID: ' + data.budget_id);
                    btn.textContent = 'Saved';
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-secondary');
                } else {
                    alert('Error saving: ' + data.message);
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }

    // Saved Budgets Logic
    window.openSavedBudgetsModal = function() {
        const modal = document.getElementById('savedBudgetsModal');
        const list = document.getElementById('savedBudgetsList');
        modal.style.display = 'flex';
        list.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

        fetch('/TFE/api/itinerary.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_all' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderSavedBudgets(data.data);
            } else {
                list.innerHTML = '<p class="error">Failed to load budgets.</p>';
            }
        })
        .catch(err => {
            console.error(err);
            list.innerHTML = '<p class="error">Error loading budgets.</p>';
        });
    };

    window.closeSavedBudgetsModal = function() {
        document.getElementById('savedBudgetsModal').style.display = 'none';
    };

    function renderSavedBudgets(budgets) {
        const list = document.getElementById('savedBudgetsList');
        if (budgets.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No saved itineraries yet.</p></div>';
            return;
        }

        list.innerHTML = budgets.map(budget => `
            <div class="saved-budget-item ${budget.is_active ? 'active' : ''}">
                <div class="budget-info">
                    <h4>
                        World Cup Trip 
                        ${budget.is_active ? '<span class="active-badge">Active</span>' : ''}
                    </h4>
                    <div class="budget-meta">
                        <span><i class="fas fa-calendar"></i> ${new Date(budget.created_at).toLocaleDateString()}</span>
                        <span><i class="fas fa-coins"></i> KES ${new Intl.NumberFormat().format(budget.total_cost)}</span>
                        <span><i class="fas fa-futbol"></i> ${budget.match_ids.length} Matches</span>
                    </div>
                </div>
                <div class="budget-actions">
                    <button class="btn btn-sm btn-primary" onclick='loadBudget(${JSON.stringify(budget)})'>
                        <i class="fas fa-upload"></i> Load
                    </button>
                    ${!budget.is_active ? `
                    <button class="btn btn-sm btn-success" onclick="setActiveBudget(${budget.id})">
                        <i class="fas fa-check"></i> Set Active
                    </button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteBudget(${budget.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.loadBudget = function(budget) {
        // 1. Set form values
        if (document.querySelector(`input[name="accommodationLevel"][value="${budget.accommodation_level}"]`)) {
            document.querySelector(`input[name="accommodationLevel"][value="${budget.accommodation_level}"]`).checked = true;
            // Trigger click to update UI
            document.querySelector(`input[name="accommodationLevel"][value="${budget.accommodation_level}"]`).closest('.option-card').click();
        }
        
        if (document.querySelector(`input[name="flightClass"][value="${budget.flight_class}"]`)) {
            document.querySelector(`input[name="flightClass"][value="${budget.flight_class}"]`).checked = true;
             document.querySelector(`input[name="flightClass"][value="${budget.flight_class}"]`).closest('.option-card').click();
        }

        // 2. Set matches
        // Filter allMatches to get the full match objects for the saved IDs
        // Ensure IDs are compared correctly (string vs int)
        const savedMatchIds = budget.match_ids.map(id => parseInt(id));
        const savedMatches = allMatches.filter(m => savedMatchIds.includes(m.fixture.id));
        
        if (savedMatches.length > 0) {
            // Render these matches into the container
            renderMatches(savedMatches);
            
            // Now that they are rendered, check them
            savedMatches.forEach(match => {
                const cb = document.getElementById(`match_${match.fixture.id}`);
                if (cb) {
                    cb.checked = true;
                    cb.closest('.match-card').classList.add('selected');
                }
            });
            
            // Show Step 3 (Matches List) and hide others
            document.getElementById('wizardStep1').style.display = 'none';
            document.getElementById('wizardStep2').style.display = 'none';
            document.getElementById('wizardStep3').style.display = 'block';
        }

        // 3. Display results directly
        currentBudget = {
            total_estimated_cost: budget.total_cost,
            breakdown: budget.breakdown
        };
        displayResults(currentBudget);
        
        closeSavedBudgetsModal();
        
        // Scroll to results
        document.getElementById('resultContainer').style.display = 'block';
        document.getElementById('resultContainer').scrollIntoView({ behavior: 'smooth' });
    };

    window.setActiveBudget = function(budgetId) {
        if (!confirm('Set this itinerary as your active plan? This will update your dashboard.')) return;

        fetch('/TFE/api/itinerary.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'set_active', budget_id: budgetId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                openSavedBudgetsModal(); // Reload list
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => console.error(err));
    };

    window.deleteBudget = function(budgetId) {
        if (!confirm('Are you sure you want to delete this itinerary?')) return;

        fetch('/TFE/api/itinerary.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', budget_id: budgetId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                openSavedBudgetsModal(); // Reload list
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => console.error(err));
    };
    // Nights adjustment helper
    const nightsInput = document.getElementById('nights');
    if (nightsInput) {
        nightsInput.addEventListener('input', function() {
            const display = document.getElementById('nightsValue');
            if (display) display.textContent = this.value;
        });
    }

    // Dropdown Logic
    window.toggleSavedBudgetsDropdown = function() {
        const dropdown = document.getElementById('savedBudgetsDropdown');
        const list = document.getElementById('dropdownList');
        
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            return;
        }

        // Close other modals if open
        if (typeof closeSavedBudgetsModal === 'function') {
            closeSavedBudgetsModal();
        }
        
        dropdown.classList.add('show');
        list.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

        fetch('/TFE/api/itinerary.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_all' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderDropdownBudgets(data.data);
            } else {
                list.innerHTML = '<p class="error">Failed to load plans.</p>';
            }
        })
        .catch(err => {
            console.error(err);
            list.innerHTML = '<p class="error">Error loading plans.</p>';
        });
    };

    function renderDropdownBudgets(budgets) {
        const list = document.getElementById('dropdownList');
        if (budgets.length === 0) {
            list.innerHTML = '<div style="padding:15px;text-align:center;color:#888;">No saved plans yet.</div>';
            return;
        }

        // Take top 5
        const recent = budgets.slice(0, 5);
        
        list.innerHTML = recent.map(budget => `
            <div class="dropdown-item" onclick='loadBudgetFromDropdown(${JSON.stringify(budget)})'>
                <h5>
                    ${budget.is_active ? '<i class="fas fa-check-circle" style="color:var(--primary-red)"></i> ' : ''}
                    World Cup Trip
                </h5>
                <p>
                    <span>${new Date(budget.created_at).toLocaleDateString()}</span>
                    <span>KES ${new Intl.NumberFormat().format(budget.total_cost)}</span>
                </p>
            </div>
        `).join('');
    }

    window.loadBudgetFromDropdown = function(budget) {
        loadBudget(budget);
        document.getElementById('savedBudgetsDropdown').classList.remove('show');
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('savedBudgetsDropdown');
        const trigger = document.querySelector('.btn-dropdown-trigger');
        
        if (dropdown && dropdown.classList.contains('show') && !dropdown.contains(event.target) && !trigger.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    });
});
