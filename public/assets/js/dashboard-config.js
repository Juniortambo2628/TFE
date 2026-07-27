/**
 * Dashboard Configuration
 * Global configuration object for the reusable dashboard
 *
 * Usage: Modify these settings to customize dashboard behavior without touching individual scripts
 */

window.DASHBOARD_CONFIG = {
  // ===== DASHBOARD IDENTIFICATION =====
  dashboardId: 'mainDashboard', // Main dashboard container ID
  sidebarId: 'dashboardSidebar', // Sidebar container ID
  contentId: 'dashboardContent', // Main content container ID
  headerId: 'dashboardHeader', // Header container ID

  // ===== LAYOUT CONFIGURATION =====
  layout: {
    sidebarWidth: '280px', // Sidebar width
    sidebarCollapsedWidth: '60px', // Collapsed sidebar width
    headerHeight: '80px', // Header height
    contentPadding: '2rem', // Main content padding
    cardPadding: '1.5rem', // Card padding
    sectionMargin: '3rem', // Section margin
  },

  // ===== SIDEBAR CONFIGURATION =====
  sidebar: {
    enableCollapse: true, // Enable sidebar collapse
    enableMobileToggle: true, // Enable mobile toggle
    autoCloseOnMobile: true, // Auto-close on mobile when clicking outside
    enableSmoothTransition: true, // Enable smooth transitions
    collapseBreakpoint: 768, // Breakpoint for mobile collapse
    enableUserInfo: true, // Show user info in sidebar footer
    enableBranding: true, // Show branding in sidebar header
    enableActiveState: true, // Highlight active navigation item
    enableHoverEffects: true, // Enable hover effects
  },

  // ===== NAVIGATION CONFIGURATION =====
  navigation: {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'fas fa-tachometer-alt',
        url: 'dashboard.html',
        active: true,
      },
      {
        id: 'users',
        label: 'User Management',
        icon: 'fas fa-users',
        url: 'users.html',
        active: false,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'fas fa-chart-line',
        url: 'analytics.html',
        active: false,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'fas fa-cog',
        url: 'settings.html',
        active: false,
      },
      {
        id: 'website',
        label: 'Back to Website',
        icon: 'fas fa-home',
        url: '../index.html',
        active: false,
        external: true,
      },
    ],
  },

  // ===== THEME CONFIGURATION =====
  theme: {
    enableDarkMode: true, // Enable dark mode toggle
    defaultTheme: 'light', // Default theme (light/dark)
    enableThemePersistence: true, // Save theme preference in localStorage
    enableSmoothTransitions: true, // Smooth theme transitions
    customColors: {
      primary: '#ffd300', // Override primary color
      secondary: '#6c757d', // Override secondary color
      accent: '#007bff', // Override accent color
      success: '#28a745', // Override success color
      warning: '#ffc107', // Override warning color
      danger: '#dc3545', // Override danger color
      info: '#17a2b8', // Override info color
    },
  },

  // ===== DATA TABLE CONFIGURATION =====
  dataTable: {
    enablePagination: true, // Enable pagination
    enableSorting: true, // Enable column sorting
    enableFiltering: true, // Enable filtering
    enableSearch: true, // Enable global search
    enableExport: true, // Enable export functionality
    enableColumnSelection: true, // Enable column show/hide
    enableRowSelection: false, // Enable row selection
    enableVirtualScrolling: false, // Enable virtual scrolling for large datasets
    pageSize: 25, // Default page size
    pageSizeOptions: [10, 25, 50, 100], // Available page sizes
    enableResponsive: true, // Enable responsive design
    enableHoverEffects: true, // Enable row hover effects
    enableLoadingStates: true, // Enable loading states
    enableEmptyStates: true, // Enable empty state messages
    enableErrorStates: true, // Enable error state handling
  },

  // ===== CHARTS CONFIGURATION =====
  charts: {
    enableCharts: true, // Enable chart functionality
    defaultChartType: 'line', // Default chart type
    chartTypes: ['line', 'bar', 'pie', 'doughnut', 'area'], // Available chart types
    enableAnimation: true, // Enable chart animations
    enableResponsive: true, // Enable responsive charts
    enableTooltips: true, // Enable chart tooltips
    enableLegend: true, // Enable chart legend
    enableExport: true, // Enable chart export
    defaultColors: [
      // Default color palette
      '#ffd300',
      '#007bff',
      '#28a745',
      '#dc3545',
      '#ffc107',
      '#17a2b8',
      '#6f42c1',
      '#e83e8c',
    ],
    enableDarkMode: true, // Enable dark mode for charts
  },

  // ===== NOTIFICATIONS CONFIGURATION =====
  notifications: {
    enableNotifications: true, // Enable notification system
    enableRealTime: true, // Enable real-time notifications
    enableSound: false, // Enable notification sounds
    enableDesktop: false, // Enable desktop notifications
    maxNotifications: 50, // Maximum notifications to store
    autoHideDelay: 5000, // Auto-hide delay in milliseconds
    enableMarkAllRead: true, // Enable mark all as read
    enableNotificationHistory: true, // Enable notification history
    enableCategories: true, // Enable notification categories
    categories: ['info', 'success', 'warning', 'error', 'system'],
  },

  // ===== EXPORT CONFIGURATION =====
  export: {
    enableCSV: true, // Enable CSV export
    enablePDF: true, // Enable PDF export
    enableExcel: false, // Enable Excel export
    enableJSON: true, // Enable JSON export
    enableScheduled: true, // Enable scheduled exports
    enableEmail: true, // Enable email export
    defaultFormat: 'csv', // Default export format
    maxRecordsPerExport: 10000, // Maximum records per export
    enableCompression: true, // Enable file compression
    enableCustomFields: true, // Enable custom field selection
  },

  // ===== API CONFIGURATION =====
  api: {
    baseUrl: '/api', // Base API URL
    timeout: 30000, // Request timeout in milliseconds
    enableRetry: true, // Enable automatic retry
    maxRetries: 3, // Maximum retry attempts
    retryDelay: 1000, // Delay between retries in milliseconds
    enableCaching: true, // Enable response caching
    cacheTimeout: 300000, // Cache timeout in milliseconds (5 minutes)
    enableOfflineMode: false, // Enable offline mode
    enableProgressTracking: true, // Enable progress tracking
    enableErrorHandling: true, // Enable error handling
  },

  // ===== USER INTERFACE CONFIGURATION =====
  ui: {
    enableAnimations: true, // Enable UI animations
    enableHoverEffects: true, // Enable hover effects
    enableLoadingStates: true, // Enable loading states
    enableTooltips: true, // Enable tooltips
    enableModals: true, // Enable modal dialogs
    enableDropdowns: true, // Enable dropdown menus
    enableTabs: true, // Enable tab navigation
    enableAccordions: true, // Enable accordion components
    enableCarousels: false, // Enable carousel components
    enableDatePickers: true, // Enable date pickers
    enableTimePickers: true, // Enable time pickers
    enableColorPickers: false, // Enable color pickers
    enableFileUploads: true, // Enable file uploads
    enableDragDrop: true, // Enable drag and drop
    enableKeyboardShortcuts: true, // Enable keyboard shortcuts
    enableAccessibility: true, // Enable accessibility features
  },

  // ===== PERFORMANCE CONFIGURATION =====
  performance: {
    enableLazyLoading: true, // Enable lazy loading
    enableVirtualScrolling: false, // Enable virtual scrolling
    enableDebouncing: true, // Enable input debouncing
    debounceDelay: 300, // Debounce delay in milliseconds
    enableThrottling: true, // Enable function throttling
    throttleDelay: 100, // Throttle delay in milliseconds
    enableCaching: true, // Enable data caching
    enableCompression: true, // Enable data compression
    enableMinification: false, // Enable code minification
    enableCDN: false, // Enable CDN resources
    enableServiceWorker: false, // Enable service worker
    enablePreloading: true, // Enable resource preloading
  },

  // ===== SECURITY CONFIGURATION =====
  security: {
    enableCSRF: true, // Enable CSRF protection
    enableXSS: true, // Enable XSS protection
    enableContentSecurityPolicy: true, // Enable CSP
    enableSecureHeaders: true, // Enable security headers
    enableInputValidation: true, // Enable input validation
    enableOutputEncoding: true, // Enable output encoding
    enableSessionSecurity: true, // Enable session security
    enablePasswordPolicy: true, // Enable password policy
    enableTwoFactor: false, // Enable two-factor authentication
    enableAuditLogging: true, // Enable audit logging
  },

  // ===== LOCALIZATION CONFIGURATION =====
  localization: {
    enableLocalization: true, // Enable localization
    defaultLanguage: 'en', // Default language
    supportedLanguages: ['en', 'es', 'fr', 'de'], // Supported languages
    enableRTL: false, // Enable right-to-left support
    enablePluralization: true, // Enable pluralization
    enableDateFormatting: true, // Enable date formatting
    enableNumberFormatting: true, // Enable number formatting
    enableCurrencyFormatting: true, // Enable currency formatting
    enableTimezoneSupport: true, // Enable timezone support
    enableAutoDetection: true, // Enable language auto-detection
  },

  // ===== DEBUGGING CONFIGURATION =====
  debugging: {
    enableDebugMode: false, // Enable debug mode
    enableConsoleLogging: false, // Enable console logging
    enableErrorReporting: true, // Enable error reporting
    enablePerformanceMonitoring: false, // Enable performance monitoring
    enableUserTracking: false, // Enable user tracking
    enableAnalytics: false, // Enable analytics
    enableHeatmaps: false, // Enable heatmaps
    enableSessionRecording: false, // Enable session recording
    enableA11yAuditing: false, // Enable accessibility auditing
    enableLighthouseAuditing: false, // Enable Lighthouse auditing
  },

  // ===== CUSTOMIZATION CONFIGURATION =====
  customization: {
    enableCustomCSS: true, // Enable custom CSS
    enableCustomJS: true, // Enable custom JavaScript
    enableCustomComponents: true, // Enable custom components
    enableCustomThemes: true, // Enable custom themes
    enableCustomLayouts: true, // Enable custom layouts
    enableCustomWidgets: true, // Enable custom widgets
    enableCustomPlugins: true, // Enable custom plugins
    enableCustomHooks: true, // Enable custom hooks
    enableCustomEvents: true, // Enable custom events
    enableCustomAPIs: true, // Enable custom APIs
  },

  // ===== CALLBACKS =====
  callbacks: {
    onInit: null, // Called when dashboard initializes
    onThemeChange: null, // Called when theme changes
    onSidebarToggle: null, // Called when sidebar toggles
    onNavigationChange: null, // Called when navigation changes
    onDataLoad: null, // Called when data loads
    onDataUpdate: null, // Called when data updates
    onExport: null, // Called when export starts
    onError: null, // Called when error occurs
    onUserAction: null, // Called when user performs action
    onBeforeUnload: null, // Called before page unloads
  },

  // ===== MESSAGES =====
  messages: {
    loading: 'Loading...',
    noData: 'No data available',
    error: 'An error occurred',
    success: 'Operation completed successfully',
    confirm: 'Are you sure?',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    markAllRead: 'Mark All as Read',
    clearAll: 'Clear All',
    reset: 'Reset',
    apply: 'Apply',
    close: 'Close',
    open: 'Open',
    toggle: 'Toggle',
    expand: 'Expand',
    collapse: 'Collapse',
    show: 'Show',
    hide: 'Hide',
    enable: 'Enable',
    disable: 'Disable',
    activate: 'Activate',
    deactivate: 'Deactivate',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    retry: 'Retry',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    first: 'First',
    last: 'Last',
    page: 'Page',
    of: 'of',
    items: 'items',
    perPage: 'per page',
    showing: 'Showing',
    to: 'to',
    from: 'from',
    total: 'total',
    selected: 'selected',
    all: 'all',
    none: 'none',
    some: 'some',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    done: 'Done',
    continue: 'Continue',
    finish: 'Finish',
    complete: 'Complete',
    incomplete: 'Incomplete',
    pending: 'Pending',
    processing: 'Processing',
    failed: 'Failed',
    cancelled: 'Cancelled',
    expired: 'Expired',
    active: 'Active',
    inactive: 'Inactive',
    enabled: 'Enabled',
    disabled: 'Disabled',
    online: 'Online',
    offline: 'Offline',
    connected: 'Connected',
    disconnected: 'Disconnected',
    available: 'Available',
    unavailable: 'Unavailable',
    public: 'Public',
    private: 'Private',
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
    deleted: 'Deleted',
    restored: 'Restored',
    created: 'Created',
    updated: 'Updated',
    modified: 'Modified',
    saved: 'Saved',
    unsaved: 'Unsaved',
    changed: 'Changed',
    unchanged: 'Unchanged',
    new: 'New',
    old: 'Old',
    recent: 'Recent',
    latest: 'Latest',
    oldest: 'Oldest',
    newest: 'Newest',
    popular: 'Popular',
    trending: 'Trending',
    featured: 'Featured',
    recommended: 'Recommended',
    suggested: 'Suggested',
    related: 'Related',
    similar: 'Similar',
    different: 'Different',
    unique: 'Unique',
    duplicate: 'Duplicate',
    original: 'Original',
    copy: 'Copy',
    move: 'Move',
    share: 'Share',
    download: 'Download',
    upload: 'Upload',
    print: 'Print',
    email: 'Email',
    sms: 'SMS',
    call: 'Call',
    message: 'Message',
    chat: 'Chat',
    comment: 'Comment',
    reply: 'Reply',
    like: 'Like',
    unlike: 'Unlike',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    bookmark: 'Bookmark',
    unbookmark: 'Unbookmark',
    follow: 'Follow',
    unfollow: 'Unfollow',
    subscribe: 'Subscribe',
    unsubscribe: 'Unsubscribe',
    join: 'Join',
    leave: 'Leave',
    enter: 'Enter',
    exit: 'Exit',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    signup: 'Sign Up',
    signin: 'Sign In',
    signout: 'Sign Out',
    profile: 'Profile',
    account: 'Account',
    settings: 'Settings',
    preferences: 'Preferences',
    configuration: 'Configuration',
    options: 'Options',
    help: 'Help',
    support: 'Support',
    contact: 'Contact',
    about: 'About',
    terms: 'Terms',
    privacy: 'Privacy',
    security: 'Security',
    legal: 'Legal',
    copyright: 'Copyright',
    license: 'License',
    version: 'Version',
    update: 'Update',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    install: 'Install',
    uninstall: 'Uninstall',
    remove: 'Remove',
    add: 'Add',
    create: 'Create',
    new: 'New',
    duplicate: 'Duplicate',
    copy: 'Copy',
    move: 'Move',
    rename: 'Rename',
    edit: 'Edit',
    modify: 'Modify',
    change: 'Change',
    update: 'Update',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    remove: 'Remove',
    clear: 'Clear',
    reset: 'Reset',
    restore: 'Restore',
    undo: 'Undo',
    redo: 'Redo',
    refresh: 'Refresh',
    reload: 'Reload',
    restart: 'Restart',
    stop: 'Stop',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    play: 'Play',
    record: 'Record',
    capture: 'Capture',
    screenshot: 'Screenshot',
    print: 'Print',
    export: 'Export',
    import: 'Import',
    backup: 'Backup',
    restore: 'Restore',
    sync: 'Sync',
    connect: 'Connect',
    disconnect: 'Disconnect',
    link: 'Link',
    unlink: 'Unlink',
    attach: 'Attach',
    detach: 'Detach',
    bind: 'Bind',
    unbind: 'Unbind',
    associate: 'Associate',
    disassociate: 'Disassociate',
    merge: 'Merge',
    split: 'Split',
    combine: 'Combine',
    separate: 'Separate',
    join: 'Join',
    leave: 'Leave',
    enter: 'Enter',
    exit: 'Exit',
    open: 'Open',
    close: 'Close',
    show: 'Show',
    hide: 'Hide',
    display: 'Display',
    view: 'View',
    preview: 'Preview',
    fullscreen: 'Fullscreen',
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    expand: 'Expand',
    collapse: 'Collapse',
    toggle: 'Toggle',
    switch: 'Switch',
    change: 'Change',
    select: 'Select',
    deselect: 'Deselect',
    choose: 'Choose',
    pick: 'Pick',
    grab: 'Grab',
    drag: 'Drag',
    drop: 'Drop',
    move: 'Move',
    slide: 'Slide',
    scroll: 'Scroll',
    zoom: 'Zoom',
    pan: 'Pan',
    rotate: 'Rotate',
    flip: 'Flip',
    mirror: 'Mirror',
    invert: 'Invert',
    adjust: 'Adjust',
    modify: 'Modify',
    customize: 'Customize',
    personalize: 'Personalize',
    configure: 'Configure',
    setup: 'Setup',
    install: 'Install',
    uninstall: 'Uninstall',
    enable: 'Enable',
    disable: 'Disable',
    activate: 'Activate',
    deactivate: 'Deactivate',
    turnOn: 'Turn On',
    turnOff: 'Turn Off',
    powerOn: 'Power On',
    powerOff: 'Power Off',
    start: 'Start',
    stop: 'Stop',
    begin: 'Begin',
    end: 'End',
    finish: 'Finish',
    complete: 'Complete',
    done: 'Done',
    ready: 'Ready',
    busy: 'Busy',
    idle: 'Idle',
    active: 'Active',
    inactive: 'Inactive',
    online: 'Online',
    offline: 'Offline',
    available: 'Available',
    unavailable: 'Unavailable',
    connected: 'Connected',
    disconnected: 'Disconnected',
    loading: 'Loading',
    processing: 'Processing',
    waiting: 'Waiting',
    pending: 'Pending',
    queued: 'Queued',
    scheduled: 'Scheduled',
    running: 'Running',
    paused: 'Paused',
    stopped: 'Stopped',
    completed: 'Completed',
    finished: 'Finished',
    successful: 'Successful',
    failed: 'Failed',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    notice: 'Notice',
    alert: 'Alert',
    notification: 'Notification',
    message: 'Message',
    status: 'Status',
    state: 'State',
    condition: 'Condition',
    result: 'Result',
    outcome: 'Outcome',
    response: 'Response',
    feedback: 'Feedback',
    confirmation: 'Confirmation',
    verification: 'Verification',
    validation: 'Validation',
    authentication: 'Authentication',
    authorization: 'Authorization',
    permission: 'Permission',
    access: 'Access',
    control: 'Control',
    management: 'Management',
    administration: 'Administration',
    operation: 'Operation',
    function: 'Function',
    feature: 'Feature',
    capability: 'Capability',
    ability: 'Ability',
    option: 'Option',
    choice: 'Choice',
    alternative: 'Alternative',
    selection: 'Selection',
    preference: 'Preference',
    setting: 'Setting',
    parameter: 'Parameter',
    variable: 'Variable',
    value: 'Value',
    data: 'Data',
    information: 'Information',
    content: 'Content',
    item: 'Item',
    element: 'Element',
    component: 'Component',
    module: 'Module',
    section: 'Section',
    area: 'Area',
    region: 'Region',
    zone: 'Zone',
    space: 'Space',
    place: 'Place',
    location: 'Location',
    position: 'Position',
    point: 'Point',
    spot: 'Spot',
    site: 'Site',
    page: 'Page',
    screen: 'Screen',
    view: 'View',
    window: 'Window',
    dialog: 'Dialog',
    modal: 'Modal',
    popup: 'Popup',
    tooltip: 'Tooltip',
    hint: 'Hint',
    tip: 'Tip',
    help: 'Help',
    guide: 'Guide',
    tutorial: 'Tutorial',
    instruction: 'Instruction',
    direction: 'Direction',
    step: 'Step',
    stage: 'Stage',
    phase: 'Phase',
    level: 'Level',
    grade: 'Grade',
    rank: 'Rank',
    order: 'Order',
    sequence: 'Sequence',
    series: 'Series',
    list: 'List',
    array: 'Array',
    collection: 'Collection',
    group: 'Group',
    set: 'Set',
    batch: 'Batch',
    lot: 'Lot',
    bunch: 'Bunch',
    cluster: 'Cluster',
    bundle: 'Bundle',
    package: 'Package',
    box: 'Box',
    container: 'Container',
    holder: 'Holder',
    carrier: 'Carrier',
    transport: 'Transport',
    vehicle: 'Vehicle',
    tool: 'Tool',
    instrument: 'Instrument',
    device: 'Device',
    machine: 'Machine',
    system: 'System',
    platform: 'Platform',
    framework: 'Framework',
    structure: 'Structure',
    organization: 'Organization',
    company: 'Company',
    business: 'Business',
    enterprise: 'Enterprise',
    corporation: 'Corporation',
    firm: 'Firm',
    agency: 'Agency',
    department: 'Department',
    division: 'Division',
    unit: 'Unit',
    team: 'Team',
    group: 'Group',
    crew: 'Crew',
    staff: 'Staff',
    personnel: 'Personnel',
    employee: 'Employee',
    worker: 'Worker',
    member: 'Member',
    participant: 'Participant',
    user: 'User',
    customer: 'Customer',
    client: 'Client',
    guest: 'Guest',
    visitor: 'Visitor',
    audience: 'Audience',
    public: 'Public',
    community: 'Community',
    society: 'Society',
    population: 'Population',
    people: 'People',
    person: 'Person',
    individual: 'Individual',
    human: 'Human',
    being: 'Being',
    entity: 'Entity',
    object: 'Object',
    thing: 'Thing',
    stuff: 'Stuff',
    material: 'Material',
    substance: 'Substance',
    matter: 'Matter',
    element: 'Element',
    component: 'Component',
    part: 'Part',
    piece: 'Piece',
    fragment: 'Fragment',
    segment: 'Segment',
    portion: 'Portion',
    section: 'Section',
    division: 'Division',
    category: 'Category',
    class: 'Class',
    type: 'Type',
    kind: 'Kind',
    sort: 'Sort',
    variety: 'Variety',
    species: 'Species',
    breed: 'Breed',
    strain: 'Strain',
    model: 'Model',
    version: 'Version',
    edition: 'Edition',
    release: 'Release',
    update: 'Update',
    upgrade: 'Upgrade',
    patch: 'Patch',
    fix: 'Fix',
    repair: 'Repair',
    maintenance: 'Maintenance',
    service: 'Service',
    support: 'Support',
    help: 'Help',
    assistance: 'Assistance',
    aid: 'Aid',
    support: 'Support',
    backup: 'Backup',
    reserve: 'Reserve',
    spare: 'Spare',
    extra: 'Extra',
    additional: 'Additional',
    bonus: 'Bonus',
    reward: 'Reward',
    prize: 'Prize',
    gift: 'Gift',
    present: 'Present',
    offering: 'Offering',
    contribution: 'Contribution',
    donation: 'Donation',
    payment: 'Payment',
    fee: 'Fee',
    charge: 'Charge',
    cost: 'Cost',
    price: 'Price',
    value: 'Value',
    worth: 'Worth',
    amount: 'Amount',
    quantity: 'Quantity',
    number: 'Number',
    count: 'Count',
    total: 'Total',
    sum: 'Sum',
    average: 'Average',
    mean: 'Mean',
    median: 'Median',
    mode: 'Mode',
    range: 'Range',
    minimum: 'Minimum',
    maximum: 'Maximum',
    limit: 'Limit',
    boundary: 'Boundary',
    edge: 'Edge',
    border: 'Border',
    margin: 'Margin',
    padding: 'Padding',
    space: 'Space',
    gap: 'Gap',
    distance: 'Distance',
    length: 'Length',
    width: 'Width',
    height: 'Height',
    depth: 'Depth',
    size: 'Size',
    dimension: 'Dimension',
    measurement: 'Measurement',
    scale: 'Scale',
    ratio: 'Ratio',
    proportion: 'Proportion',
    percentage: 'Percentage',
    fraction: 'Fraction',
    decimal: 'Decimal',
    integer: 'Integer',
    whole: 'Whole',
    part: 'Part',
    half: 'Half',
    quarter: 'Quarter',
    third: 'Third',
    fourth: 'Fourth',
    fifth: 'Fifth',
    sixth: 'Sixth',
    seventh: 'Seventh',
    eighth: 'Eighth',
    ninth: 'Ninth',
    tenth: 'Tenth',
    first: 'First',
    second: 'Second',
    third: 'Third',
    fourth: 'Fourth',
    fifth: 'Fifth',
    last: 'Last',
    final: 'Final',
    initial: 'Initial',
    beginning: 'Beginning',
    start: 'Start',
    end: 'End',
    finish: 'Finish',
    completion: 'Completion',
    conclusion: 'Conclusion',
    result: 'Result',
    outcome: 'Outcome',
    effect: 'Effect',
    impact: 'Impact',
    influence: 'Influence',
    change: 'Change',
    modification: 'Modification',
    alteration: 'Alteration',
    adjustment: 'Adjustment',
    correction: 'Correction',
    fix: 'Fix',
    repair: 'Repair',
    restoration: 'Restoration',
    recovery: 'Recovery',
    revival: 'Revival',
    renewal: 'Renewal',
    refresh: 'Refresh',
    update: 'Update',
    upgrade: 'Upgrade',
    improvement: 'Improvement',
    enhancement: 'Enhancement',
    advancement: 'Advancement',
    progress: 'Progress',
    development: 'Development',
    growth: 'Growth',
    expansion: 'Expansion',
    increase: 'Increase',
    decrease: 'Decrease',
    reduction: 'Reduction',
    decline: 'Decline',
    fall: 'Fall',
    drop: 'Drop',
    rise: 'Rise',
    climb: 'Climb',
    ascent: 'Ascent',
    descent: 'Descent',
    up: 'Up',
    down: 'Down',
    left: 'Left',
    right: 'Right',
    top: 'Top',
    bottom: 'Bottom',
    front: 'Front',
    back: 'Back',
    side: 'Side',
    center: 'Center',
    middle: 'Middle',
    inside: 'Inside',
    outside: 'Outside',
    internal: 'Internal',
    external: 'External',
    inner: 'Inner',
    outer: 'Outer',
    upper: 'Upper',
    lower: 'Lower',
    higher: 'Higher',
    lower: 'Lower',
    greater: 'Greater',
    lesser: 'Lesser',
    more: 'More',
    less: 'Less',
    most: 'Most',
    least: 'Least',
    best: 'Best',
    worst: 'Worst',
    better: 'Better',
    worse: 'Worse',
    good: 'Good',
    bad: 'Bad',
    great: 'Great',
    terrible: 'Terrible',
    excellent: 'Excellent',
    poor: 'Poor',
    outstanding: 'Outstanding',
    awful: 'Awful',
    amazing: 'Amazing',
    horrible: 'Horrible',
    wonderful: 'Wonderful',
    dreadful: 'Dreadful',
    fantastic: 'Fantastic',
    terrible: 'Terrible',
    superb: 'Superb',
    awful: 'Awful',
    magnificent: 'Magnificent',
    appalling: 'Appalling',
    brilliant: 'Brilliant',
    atrocious: 'Atrocious',
    marvelous: 'Marvelous',
    abysmal: 'Abysmal',
    spectacular: 'Spectacular',
    dismal: 'Dismal',
    phenomenal: 'Phenomenal',
    pathetic: 'Pathetic',
    incredible: 'Incredible',
    pitiful: 'Pitiful',
    extraordinary: 'Extraordinary',
    miserable: 'Miserable',
    remarkable: 'Remarkable',
    wretched: 'Wretched',
    exceptional: 'Exceptional',
    deplorable: 'Deplorable',
    outstanding: 'Outstanding',
    lamentable: 'Lamentable',
    superior: 'Superior',
    inferior: 'Inferior',
    premium: 'Premium',
    basic: 'Basic',
    standard: 'Standard',
    custom: 'Custom',
    default: 'Default',
    normal: 'Normal',
    special: 'Special',
    unique: 'Unique',
    common: 'Common',
    rare: 'Rare',
    frequent: 'Frequent',
    occasional: 'Occasional',
    regular: 'Regular',
    irregular: 'Irregular',
    constant: 'Constant',
    variable: 'Variable',
    fixed: 'Fixed',
    flexible: 'Flexible',
    rigid: 'Rigid',
    soft: 'Soft',
    hard: 'Hard',
    smooth: 'Smooth',
    rough: 'Rough',
    even: 'Even',
    odd: 'Odd',
    flat: 'Flat',
    curved: 'Curved',
    straight: 'Straight',
    bent: 'Bent',
    sharp: 'Sharp',
    dull: 'Dull',
    bright: 'Bright',
    dark: 'Dark',
    light: 'Light',
    heavy: 'Heavy',
    thick: 'Thick',
    thin: 'Thin',
    wide: 'Wide',
    narrow: 'Narrow',
    broad: 'Broad',
    slim: 'Slim',
    fat: 'Fat',
    skinny: 'Skinny',
    big: 'Big',
    small: 'Small',
    large: 'Large',
    tiny: 'Tiny',
    huge: 'Huge',
    massive: 'Massive',
    enormous: 'Enormous',
    gigantic: 'Gigantic',
    colossal: 'Colossal',
    miniature: 'Miniature',
    micro: 'Micro',
    macro: 'Macro',
    mega: 'Mega',
    giga: 'Giga',
    tera: 'Tera',
    peta: 'Peta',
    exa: 'Exa',
    zetta: 'Zetta',
    yotta: 'Yotta',
    deci: 'Deci',
    centi: 'Centi',
    milli: 'Milli',
    micro: 'Micro',
    nano: 'Nano',
    pico: 'Pico',
    femto: 'Femto',
    atto: 'Atto',
    zepto: 'Zepto',
    yocto: 'Yocto',
  },
};
