<?php

use App\Helpers\DashboardHelper;
use App\Http\Controllers\Admin\AnnouncementsController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\ContentController;
use App\Http\Controllers\Admin\MessagesController;
use App\Http\Controllers\Admin\PrizeController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StoryController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\BudgetApiController;
use App\Http\Controllers\Fan\ActivityController;
use App\Http\Controllers\Fan\AdController;
use App\Http\Controllers\Fan\BudgetController;
use App\Http\Controllers\Fan\CommunicationController;
use App\Http\Controllers\Fan\ContactController;
use App\Http\Controllers\Fan\DashboardController;
use App\Http\Controllers\Fan\EventController;
use App\Http\Controllers\Fan\FanStoreController;
use App\Http\Controllers\Fan\FeedController;
use App\Http\Controllers\Fan\FollowController;
use App\Http\Controllers\Fan\JourneyController;
use App\Http\Controllers\Fan\LoanApplicationController;
use App\Http\Controllers\Fan\MatchScheduleController;
use App\Http\Controllers\Fan\NotificationController;
use App\Http\Controllers\Fan\PaymentController;
use App\Http\Controllers\Fan\PredictWinController;
use App\Http\Controllers\Fan\ProfileController;
use App\Http\Controllers\Fan\SavingsGoalController;
use App\Http\Controllers\Fan\SecurityController;
use App\Http\Controllers\Fan\ShareController;
use App\Http\Controllers\Fan\StoriesController;
use App\Http\Controllers\Fan\TribeController;
use App\Http\Controllers\Fan\WalletController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\SerpApiController;
use App\Http\Controllers\TestimonialController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('index');
Route::get('/news', [NewsController::class, 'index'])->name('news.index');
Route::get('/news/{category}', [NewsController::class, 'index'])->name('news.category');
Route::get('/news-categories', [NewsController::class, 'categories'])->name('news.categories');

Route::get('/dashboard', function () {
    return DashboardHelper::redirectByRole();
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', function () {
        return redirect()->route('fan.profile');
    })->name('profile.edit');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/privacy', function () {
        return redirect()->route('fan.profile');
    })->name('profile.privacy');
});

Route::get('/testimonials', [TestimonialController::class, 'index']);
Route::post('/testimonials', [TestimonialController::class, 'store']);
Route::post('/analytics/track', [AnalyticsController::class, 'track'])->name('analytics.track');

require __DIR__.'/auth.php';

Route::middleware(['auth', 'verified'])->prefix('fan')->name('fan.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/budget-calculator', [BudgetController::class, 'index'])->name('budget-calculator');
    Route::get('/itineraries', [BudgetController::class, 'itineraries'])->name('itineraries');
    Route::post('/itineraries/{budget}/confirm', [BudgetController::class, 'confirm'])->name('budget.confirm');
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile');
    Route::get('/profile/user/{user}', [ProfileController::class, 'show'])->name('profile.user');
    Route::get('/journey', [JourneyController::class, 'index'])->name('journey');
    Route::get('/bookings/{booking}', [JourneyController::class, 'show'])->name('bookings.show');
    Route::get('/wallet', [WalletController::class, 'index'])->name('wallet');

    // Loan Applications (Fan)
    Route::get('/loan-applications', [LoanApplicationController::class, 'index'])->name('loan-applications');
    Route::post('/loan-applications', [LoanApplicationController::class, 'store'])->name('loan-applications.store');
    Route::delete('/loan-applications/{loanApplication}', [LoanApplicationController::class, 'destroy'])->name('loan-applications.destroy');

    // Savings Goals (Fan)
    Route::get('/savings-goals', [SavingsGoalController::class, 'index'])->name('savings-goals');
    Route::post('/savings-goals', [SavingsGoalController::class, 'store'])->name('savings-goals.store');
    Route::put('/savings-goals/{savingsGoal}', [SavingsGoalController::class, 'update'])->name('savings-goals.update');
    Route::delete('/savings-goals/{savingsGoal}', [SavingsGoalController::class, 'destroy'])->name('savings-goals.destroy');

    // Budget Delete
    Route::delete('/budgets/{budget}', [BudgetController::class, 'destroy'])->name('budgets.destroy');

    // API Routes for Fan Dashboard
    Route::post('/budget/save', [BudgetController::class, 'store'])->name('budget.save');
    Route::get('/budget/active', [BudgetController::class, 'getActive'])->name('budget.active');

    // Budget Calculator API
    Route::post('/api/budget/estimate', [BudgetApiController::class, 'estimate'])->name('api.budget.estimate');
    Route::post('/api/budget/cost-of-living', [BudgetApiController::class, 'costOfLiving'])->name('api.budget.col');
    Route::post('/api/budget/exchange-rate', [BudgetApiController::class, 'exchangeRate'])->name('api.budget.exchange');
    Route::post('/api/budget/visa-info', [BudgetApiController::class, 'visaInfo'])->name('api.budget.visa');

    // Feature Pages
    Route::get('/match-schedule', [MatchScheduleController::class, 'index'])->name('match-schedule');
    Route::get('/communication', [CommunicationController::class, 'index'])->name('communication');
    Route::get('/payments', [PaymentController::class, 'index'])->name('payments');
    Route::get('/activities', [ActivityController::class, 'index'])->name('activities');
    Route::get('/events', [EventController::class, 'index'])->name('events');
    Route::get('/security', [SecurityController::class, 'index'])->name('security');
    Route::get('/contact', [ContactController::class, 'index'])->name('contact');
    Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

    // Profile API
    Route::put('/profile/update', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');

    // Social Feed
    Route::get('/feed', [FeedController::class, 'index'])->name('feed');
    Route::get('/feed/post/{post}', [FeedController::class, 'show'])->name('feed.post.show');
    Route::post('/feed', [FeedController::class, 'store'])->name('feed.store');
    Route::post('/feed/{post}/like', [FeedController::class, 'like'])->name('feed.like');
    Route::post('/feed/{post}/comment', [FeedController::class, 'comment'])->name('feed.comment');
    Route::post('/feed/{post}/repost', [FeedController::class, 'repost'])->name('feed.repost');
    Route::post('/feed/{post}/share', [FeedController::class, 'share'])->name('feed.share');
    Route::delete('/feed/{post}', [FeedController::class, 'destroy'])->name('feed.destroy');

    // Follow/Unfollow
    Route::post('/follow/{user}', [FollowController::class, 'toggle'])->name('follow.toggle');
    Route::get('/follow/{user}/preview', [FollowController::class, 'preview'])->name('follow.preview');

    // Stories
    Route::get('/stories', [StoriesController::class, 'index'])->name('stories');
    Route::post('/stories', [StoriesController::class, 'store'])->name('stories.store');
    Route::post('/stories/{story}/view', [StoriesController::class, 'view'])->name('stories.view');
    Route::post('/stories/{story}/reply', [StoriesController::class, 'reply'])->name('stories.reply');
    Route::post('/stories/{story}/link', [StoriesController::class, 'link'])->name('stories.link');
    Route::get('/stories/{story}/replies', [StoriesController::class, 'getReplies'])->name('stories.replies');
    Route::get('/stories/{story}/viewers', [StoriesController::class, 'viewers'])->name('stories.viewers');
    Route::delete('/stories/{story}', [StoriesController::class, 'destroy'])->name('stories.destroy');

    // Ad tracking
    Route::post('/ads/{ad}/impression', [AdController::class, 'trackImpression'])->name('ads.impression');
    Route::post('/ads/{ad}/click', [AdController::class, 'trackClick'])->name('ads.click');

    // Share
    Route::get('/share/options', [ShareController::class, 'getShareOptions'])->name('share.options');
    Route::post('/share', [ShareController::class, 'share'])->name('share');

    // Tribes
    Route::get('/tribes', [TribeController::class, 'index'])->name('tribes');
    Route::get('/tribes/{tribe}', [TribeController::class, 'show'])->name('tribes.show');
    Route::post('/tribes', [TribeController::class, 'store'])->name('tribes.store');
    Route::post('/tribes/{tribe}/join', [TribeController::class, 'join'])->name('tribes.join');
    Route::post('/tribes/{tribe}/leave', [TribeController::class, 'leave'])->name('tribes.leave');
    Route::put('/tribes/{tribe}', [TribeController::class, 'update'])->name('tribes.update');
    Route::post('/tribes/{tribe}/members/{user}/toggle-role', [TribeController::class, 'toggleRole'])->name('tribes.members.toggle-role');

    // Fan Store
    Route::get('/store', [FanStoreController::class, 'index'])->name('store');

    // Package detail (public detail of a single admin-managed package)
    Route::get('/packages/{package}', [App\Http\Controllers\Fan\PackageController::class, 'show'])
        ->name('packages.show');

    // Predict & Win
    Route::get('/predict-win', [PredictWinController::class, 'index'])->name('predict-win');
    Route::post('/predict-win/predict', [PredictWinController::class, 'predict'])->name('predict-win.predict');

    // Payment Routes (Enhanced)
    Route::post('/payments/method', [PaymentController::class, 'addPaymentMethod'])->name('payments.method.add');
    Route::delete('/payments/method/{id}', [PaymentController::class, 'removePaymentMethod'])->name('payments.method.remove');
    Route::post('/payments/initiate', [PaymentController::class, 'initiatePayment'])->name('payments.initiate');
    Route::post('/payments/verify', [PaymentController::class, 'verifyPayment'])->name('payments.verify');

    // Security Routes (Enhanced)
    Route::post('/security/password', [SecurityController::class, 'changePassword'])->name('security.password');
    Route::post('/security/two-factor', [SecurityController::class, 'toggleTwoFactor'])->name('security.two-factor');
    Route::post('/security/notifications', [SecurityController::class, 'toggleLoginNotifications'])->name('security.notifications');

    // Event RSVP Routes
    Route::post('/events/{event}/rsvp', [EventController::class, 'rsvp'])->name('events.rsvp');
    Route::delete('/events/{event}/rsvp', [EventController::class, 'cancelRsvp'])->name('events.rsvp.cancel');

    // Match Schedule Routes (Enhanced)
    Route::post('/match-schedule/{fixture}/favorite', [MatchScheduleController::class, 'toggleFavorite'])->name('match-schedule.favorite');

    // 2FA Routes
    Route::post('/security/two-factor/confirm', [SecurityController::class, 'confirmTwoFactor'])->name('security.two-factor.confirm');

    // Communication Routes (Enhanced)
    Route::post('/communication/{message}/read', [CommunicationController::class, 'markAsRead'])->name('communication.read');
    Route::delete('/communication/{message}', [CommunicationController::class, 'deleteMessage'])->name('communication.delete');

    // Tribe Posts (Discussions)
    Route::post('/tribes/{tribe}/posts', [TribeController::class, 'createPost'])->name('tribes.posts.store');
    Route::post('/tribes/{tribe}/posts/{post}/reply', [TribeController::class, 'replyToPost'])->name('tribes.posts.reply');

    // Notifications & Messages
    Route::post('/notifications/read-all', [NotificationController::class, 'markNotificationsRead'])->name('notifications.read-all');
    Route::post('/messages/read-all', [NotificationController::class, 'markMessagesRead'])->name('messages.read-all');
});

// SerpAPI (Google Flights + Hotels) — auth only, no fan prefix
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/api/search/flights', [SerpApiController::class, 'searchFlights'])->name('api.search.flights');
    Route::post('/api/search/hotels', [SerpApiController::class, 'searchHotels'])->name('api.search.hotels');
});

// Admin Routes
Route::middleware(['auth', 'verified', 'is_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');

    // Users Management
    Route::get('/users', [UserController::class, 'index'])->name('users');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/toggle-admin', [UserController::class, 'toggleAdmin'])->name('users.toggle-admin');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Profile Management
    Route::get('/profile', [App\Http\Controllers\Admin\ProfileController::class, 'index'])->name('profile');
    Route::put('/profile', [App\Http\Controllers\Admin\ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [App\Http\Controllers\Admin\ProfileController::class, 'password'])->name('profile.password');

    // Payments Management
    Route::get('/payments', [App\Http\Controllers\Admin\PaymentController::class, 'index'])->name('payments');
    Route::put('/payments/{paymentTransaction}/status', [App\Http\Controllers\Admin\PaymentController::class, 'updateStatus'])->name('payments.status');

    // Events Management
    Route::get('/events', [App\Http\Controllers\Admin\EventController::class, 'index'])->name('events');
    Route::post('/events', [App\Http\Controllers\Admin\EventController::class, 'store'])->name('events.store');
    Route::put('/events/{event}', [App\Http\Controllers\Admin\EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [App\Http\Controllers\Admin\EventController::class, 'destroy'])->name('events.destroy');

    // Content Management
    Route::get('/content', [ContentController::class, 'index'])->name('content');
    Route::post('/content/settings', [ContentController::class, 'updateSettings'])->name('content.settings.update');
    Route::delete('/content/posts/{post}', [ContentController::class, 'deletePost'])->name('content.posts.delete');

    // News Management
    Route::get('/news', [App\Http\Controllers\Admin\NewsController::class, 'index'])->name('news.index');
    Route::post('/news', [App\Http\Controllers\Admin\NewsController::class, 'store'])->name('news.store');
    Route::put('/news/{news}', [App\Http\Controllers\Admin\NewsController::class, 'update'])->name('news.update');
    Route::delete('/news/{news}', [App\Http\Controllers\Admin\NewsController::class, 'destroy'])->name('news.destroy');

    // Ads Management
    Route::get('/ads', [App\Http\Controllers\Admin\AdController::class, 'index'])->name('ads.index');
    Route::post('/ads', [App\Http\Controllers\Admin\AdController::class, 'store'])->name('ads.store');
    Route::put('/ads/{ad}', [App\Http\Controllers\Admin\AdController::class, 'update'])->name('ads.update');
    Route::delete('/ads/{ad}', [App\Http\Controllers\Admin\AdController::class, 'destroy'])->name('ads.destroy');

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::post('/settings/tournaments/refresh', [SettingsController::class, 'refreshTournaments'])->name('settings.tournaments.refresh');
    // Announcements
    Route::get('/announcements', [AnnouncementsController::class, 'index'])->name('announcements');
    Route::post('/announcements', [AnnouncementsController::class, 'store'])->name('announcements.store');
    Route::put('/announcements/{announcement}', [AnnouncementsController::class, 'update'])->name('announcements.update');
    Route::put('/announcements/{announcement}/toggle', [AnnouncementsController::class, 'toggle'])->name('announcements.toggle');
    Route::delete('/announcements/{announcement}', [AnnouncementsController::class, 'destroy'])->name('announcements.destroy');

    // Messages
    Route::get('/messages', [MessagesController::class, 'index'])->name('messages');
    Route::put('/messages/{message}/read', [MessagesController::class, 'markAsRead'])->name('messages.read');
    Route::delete('/messages/{message}', [MessagesController::class, 'destroy'])->name('messages.destroy');
    Route::put('/internal-messages/{internalMessage}/read', [MessagesController::class, 'markInternalAsRead'])->name('messages.internal.read');
    Route::delete('/internal-messages/{internalMessage}', [MessagesController::class, 'destroyInternal'])->name('messages.internal.destroy');

    // Analytics
    Route::get('/analytics', [App\Http\Controllers\Admin\AnalyticsController::class, 'index'])->name('analytics');

    // Loan Applications
    Route::get('/loan-applications', [App\Http\Controllers\Admin\LoanApplicationController::class, 'index'])->name('loan-applications');
    Route::put('/loan-applications/{loanApplication}', [App\Http\Controllers\Admin\LoanApplicationController::class, 'update'])->name('loan-applications.update');
    Route::delete('/loan-applications/{loanApplication}', [App\Http\Controllers\Admin\LoanApplicationController::class, 'destroy'])->name('loan-applications.destroy');

    // Prizes Management
    Route::get('/prizes', [PrizeController::class, 'index'])->name('prizes.index');
    Route::post('/prizes', [PrizeController::class, 'store'])->name('prizes.store');
    Route::put('/prizes/{prize}', [PrizeController::class, 'update'])->name('prizes.update');
    Route::delete('/prizes/{prize}', [PrizeController::class, 'destroy'])->name('prizes.destroy');

    // Packages Management (fixed-price prepacked itineraries)
    Route::get('/packages', [App\Http\Controllers\Admin\PackageController::class, 'index'])->name('packages.index');
    Route::get('/packages/fixtures', [App\Http\Controllers\Admin\PackageController::class, 'fixtures'])->name('packages.fixtures');
    Route::post('/packages', [App\Http\Controllers\Admin\PackageController::class, 'store'])->name('packages.store');
    Route::put('/packages/{package}', [App\Http\Controllers\Admin\PackageController::class, 'update'])->name('packages.update');
    Route::delete('/packages/{package}', [App\Http\Controllers\Admin\PackageController::class, 'destroy'])->name('packages.destroy');

    // Savings Goals Management
    Route::get('/savings-goals', [App\Http\Controllers\Admin\SavingsGoalController::class, 'index'])->name('savings-goals.index');
    Route::delete('/savings-goals/{savingsGoal}', [App\Http\Controllers\Admin\SavingsGoalController::class, 'destroy'])->name('savings-goals.destroy');

    // Booking Management
    Route::get('/bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::get('/bookings/{booking}', [BookingController::class, 'show'])->name('bookings.show');
    Route::put('/bookings/{booking}', [BookingController::class, 'update'])->name('bookings.update');
    Route::delete('/bookings/{booking}', [BookingController::class, 'destroy'])->name('bookings.destroy');

    // Product Management
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    // Tribes Management
    Route::get('/tribes', [App\Http\Controllers\Admin\TribeController::class, 'index'])->name('tribes.index');
    Route::get('/tribes/{tribe}', [App\Http\Controllers\Admin\TribeController::class, 'show'])->name('tribes.show');
    Route::put('/tribes/{tribe}', [App\Http\Controllers\Admin\TribeController::class, 'update'])->name('tribes.update');
    Route::delete('/tribes/{tribe}', [App\Http\Controllers\Admin\TribeController::class, 'destroy'])->name('tribes.destroy');

    // Stories Management
    Route::get('/stories', [StoryController::class, 'index'])->name('stories.index');
    Route::delete('/stories/{story}', [StoryController::class, 'destroy'])->name('stories.destroy');
});

// Partner Routes
Route::middleware(['auth', 'verified', 'is_partner'])->prefix('partner')->name('partner.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Partner\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/requests', [App\Http\Controllers\Partner\DashboardController::class, 'requests'])->name('requests');
    Route::get('/requests/{budget}', [App\Http\Controllers\Partner\DashboardController::class, 'show'])->name('requests.show');
    Route::put('/requests/{budget}', [App\Http\Controllers\Partner\DashboardController::class, 'update'])->name('requests.update');

    // Profile Routes
    Route::get('/profile', [App\Http\Controllers\Partner\ProfileController::class, 'index'])->name('profile');
    Route::post('/profile', [App\Http\Controllers\Partner\ProfileController::class, 'update'])->name('profile.update');

    // Security Routes
    Route::get('/security', [App\Http\Controllers\Partner\SecurityController::class, 'index'])->name('security');
    Route::post('/security/password', [App\Http\Controllers\Partner\SecurityController::class, 'changePassword'])->name('security.password');
    Route::post('/security/two-factor', [App\Http\Controllers\Partner\SecurityController::class, 'toggleTwoFactor'])->name('security.two-factor');
    Route::post('/security/two-factor/confirm', [App\Http\Controllers\Partner\SecurityController::class, 'confirmTwoFactor'])->name('security.two-factor.confirm');

    // Communication/Messages Routes
    Route::get('/messages', [App\Http\Controllers\Partner\CommunicationController::class, 'index'])->name('messages');
    Route::post('/messages', [App\Http\Controllers\Partner\CommunicationController::class, 'store'])->name('messages.store');
    Route::post('/messages/{budget}/read', [App\Http\Controllers\Partner\CommunicationController::class, 'markAsRead'])->name('messages.read');
});
