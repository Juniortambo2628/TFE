/**
 * Centralized country-to-flag-code mapping.
 *
 * TEAM_CODES maps Wikipedia-style team names → 2-letter ISO codes (used with /assets/Flags/{code}.png).
 * TEAM_NAMES is the reverse map (code → display name).
 * TEAM_FLAGS maps host country names → emoji flags for the World Cup banner.
 * SPECIAL_MAPPINGS handles UK sub-national codes and accented variants.
 * countryFlagMap is a lowercase lookup (used by MatchCard and similar components).
 * Fuzzy variations help resolve alternative team name spellings.
 */

export const TEAM_CODES = {
    'Mexico': 'mx', 'Argentina': 'ar', 'Germany': 'de', 'Cameroon': 'cm',
    'USA': 'us', 'Italy': 'it', 'Spain': 'es', 'Morocco': 'ma',
    'Brazil': 'br', 'France': 'fr', 'Nigeria': 'ng', 'Korea Republic': 'kr',
    'Canada': 'ca', 'Belgium': 'be', 'Croatia': 'hr', 'Ghana': 'gh',
    'Japan': 'jp', 'England': 'gb-eng', 'Portugal': 'pt', 'Uruguay': 'uy',
    'Netherlands': 'nl', 'Senegal': 'sn', 'Poland': 'pl', 'Saudi Arabia': 'sa',
    'South Africa': 'za', 'Qatar': 'qa', 'Switzerland': 'ch', 'Haiti': 'ht',
    'Scotland': 'gb-sct', 'Paraguay': 'py', 'Australia': 'au', "Cote d'Ivoire": 'ci',
    'Ecuador': 'ec', 'Curacao': 'cw', 'Tunisia': 'tn', 'Egypt': 'eg',
    'IR Iran': 'ir', 'New Zealand': 'nz', 'Cabo Verde': 'cv', 'Norway': 'no',
    'Austria': 'at', 'Jordan': 'jo', 'Algeria': 'dz', 'Colombia': 'co',
    'Uzbekistan': 'uz', 'Panama': 'pa', 'Kenya': 'ke',
    'TBD': 'TBD', 'TBD (Playoff A)': 'TBD', 'TBD (Playoff B)': 'TBD',
    'TBD (Playoff D)': 'TBD', 'TBD (Playoff F)': 'TBD',
    'TBD (Playoff I)': 'TBD', 'TBD (Playoff K)': 'TBD',
};

export const TEAM_NAMES = {
    ...Object.fromEntries(Object.entries(TEAM_CODES).map(([name, code]) => [code, name])),
    'gb': 'England', 'sc': 'Scotland',
};

export const TEAM_FLAGS = {
    'USA': '🇺🇸', 'Mexico': '🇲🇽', 'Canada': '🇨🇦',
    'Kenya': '🇰🇪', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬',
    'Germany': '🇩🇪', 'Spain': '🇪🇸', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'France': '🇫🇷',
    'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Netherlands': '🇳🇱', 'Portugal': '🇵🇹',
    'Morocco': '🇲🇦', 'Nigeria': '🇳🇬', 'Senegal': '🇸🇳', 'Egypt': '🇪🇬',
    'South Africa': '🇿🇦', 'Ghana': '🇬🇭', 'Cameroon': '🇨🇲', 'Tunisia': '🇹🇳',
    'Algeria': '🇩🇿', "Côte d'Ivoire": '🇨🇮', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
    'South Korea': '🇰🇷', 'Iran': '🇮🇷', 'Saudi Arabia': '🇸🇦', 'Qatar': '🇶🇦',
    'Croatia': '🇭🇷', 'Belgium': '🇧🇪', 'Switzerland': '🇨🇭', 'Poland': '🇵🇱',
    'Uruguay': '🇺🇾', 'Colombia': '🇨🇴', 'Ecuador': '🇪🇨', 'Chile': '🇨🇱',
    'Paraguay': '🇵🇾', 'Peru': '🇵🇪', 'Bolivia': '🇧🇴', 'Venezuela': '🇻🇪',
    'New Zealand': '🇳🇿', 'Panama': '🇵🇦', 'Haiti': '🇭🇹', 'Jamaica': '🇯🇲',
    'Norway': '🇳🇴', 'Sweden': '🇸🇪', 'Denmark': '🇩🇰', 'Austria': '🇦🇹',
    'Czech Republic': '🇨🇿', 'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Serbia': '🇷🇸',
    'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Ireland': '🇮🇪', 'Turkey': '🇹🇷',
    'Ukraine': '🇺🇦', 'Israel': '🇮🇱', 'Uzbekistan': '🇺🇿', 'Jordan': '🇯🇴',
};

export const SPECIAL_MAPPINGS = {
    'England': 'gb-eng', 'Scotland': 'gb-sct', 'Wales': 'gb-wls',
    'Curaçao': 'cw', 'Curacao': 'cw', 'Cabo Verde': 'cv', 'Cape Verde': 'cv',
};

export const countryFlagMap = {
    'argentina': 'ar', 'brazil': 'br', 'england': 'gb-eng', 'france': 'fr',
    'germany': 'de', 'italy': 'it', 'netherlands': 'nl', 'portugal': 'pt',
    'spain': 'es', 'kenya': 'ke', 'usa': 'us', 'mexico': 'mx', 'canada': 'ca',
    'south africa': 'za', 'korea republic': 'kr', 'qatar': 'qa', 'switzerland': 'ch',
    'haiti': 'ht', 'scotland': 'gb-sct', 'morocco': 'ma', 'australia': 'au',
    'paraguay': 'py', "côte d'ivoire": 'ci', "cote d'ivoire": 'ci',
    'ecuador': 'ec', 'curaçao': 'cw', 'curacao': 'cw',
    'japan': 'jp', 'tunisia': 'tn', 'belgium': 'be', 'egypt': 'eg',
    'ir iran': 'ir', 'new zealand': 'nz', 'saudi arabia': 'sa', 'uruguay': 'uy',
    'cabo verde': 'cv', 'senegal': 'sn', 'norway': 'no', 'austria': 'at',
    'jordan': 'jo', 'algeria': 'dz', 'ghana': 'gh', 'panama': 'pa',
    'croatia': 'hr', 'colombia': 'co', 'uzbekistan': 'uz', 'nigeria': 'ng',
};

/**
 * Fuzzy lookup map: lowercased alternative names → 2-letter ISO code.
 * Used by teamNameToCode() to resolve Wikipedia variations.
 */
export const TEAM_NAME_VARIATIONS = {
    'united states': 'us', 'usa': 'us', 'united states of america': 'us',
    'south korea': 'kr', 'korea republic': 'kr', 'republic of korea': 'kr',
    'iran': 'ir', 'islamic republic of iran': 'ir',
    'ivory coast': 'ci', "cote d'ivoire": 'ci', "côte d'ivoire": 'ci',
    'cape verde': 'cv', 'cabo verde': 'cv',
    'curacao': 'cw', 'curaçao': 'cw',
    'england': 'gb-eng', 'scotland': 'gb-sct', 'wales': 'gb-wls',
    'republic of ireland': 'ie', 'ireland': 'ie',
    'czech republic': 'cz', 'czechia': 'cz',
    'turkey': 'tr', 'türkiye': 'tr',
    'netherlands': 'nl', 'holland': 'nl',
    'germany': 'de', 'france': 'fr', 'spain': 'es', 'italy': 'it',
    'brazil': 'br', 'argentina': 'ar', 'portugal': 'pt',
    'belgium': 'be', 'croatia': 'hr', 'morocco': 'ma',
    'japan': 'jp', 'australia': 'au', 'mexico': 'mx',
    'canada': 'ca', 'uruguay': 'uy', 'colombia': 'co',
    'ecuador': 'ec', 'senegal': 'sn', 'ghana': 'gh',
    'cameroon': 'cm', 'nigeria': 'ng', 'tunisia': 'tn',
    'egypt': 'eg', 'algeria': 'dz', 'south africa': 'za',
    'qatar': 'qa', 'saudi arabia': 'sa', 'saudi': 'sa',
    'poland': 'pl', 'denmark': 'dk', 'sweden': 'se',
    'switzerland': 'ch', 'austria': 'at', 'norway': 'no',
    'paraguay': 'py', 'panama': 'pa', 'jamaica': 'jm',
    'haiti': 'ht', 'usmnt': 'us', 'socceroos': 'au',
    'black stars': 'gh', 'super eagles': 'ng', 'atlas lions': 'ma',
    'new zealand': 'nz', 'new-zealand': 'nz',
};
