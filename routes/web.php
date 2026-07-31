<?php

use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('index');
Route::get('/news', [\App\Http\Controllers\NewsController::class, 'index'])->name('news.index');
Route::get('/news/{category}', [\App\Http\Controllers\NewsController::class, 'index'])->name('news.category');
Route::get('/news-categories', [\App\Http\Controllers\NewsController::class, 'categories'])->name('news.categories');

Route::get('/dashboard', function () {
    if (Auth::user()->is_admin) {
        return redirect()->route('admin.dashboard');
    }
    if (Auth::user()->is_partner) {
        return redirect()->route('partner.dashboard');
    }

    return redirect()->route('fan.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', function () {
        return redirect()->route('fan.profile');
    })->name('profile.edit');
    Route::patch('/profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [\App\Http\Controllers\ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/privacy', function () {
        return redirect()->route('fan.profile');
    })->name('profile.privacy');
});

Route::get('/testimonials', [\App\Http\Controllers\TestimonialController::class, 'index']);
Route::post('/testimonials', [\App\Http\Controllers\TestimonialController::class, 'store']);
Route::post('/analytics/track', [\App\Http\Controllers\AnalyticsController::class, 'track'])->name('analytics.track');

require __DIR__.'/auth.php';

Route::middleware(['auth', 'verified'])->prefix('fan')->name('fan.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Fan\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/budget-calculator', [\App\Http\Controllers\Fan\BudgetController::class, 'index'])->name('budget-calculator');
    Route::get('/itineraries', [\App\Http\Controllers\Fan\BudgetController::class, 'itineraries'])->name('itineraries');
    Route::post('/itineraries/{budget}/confirm', [\App\Http\Controllers\Fan\BudgetController::class, 'confirm'])->name('budget.confirm');
    Route::get('/profile', [\App\Http\Controllers\Fan\ProfileController::class, 'index'])->name('profile');
    Route::get('/profile/user/{user}', [\App\Http\Controllers\Fan\ProfileController::class, 'show'])->name('profile.user');
    Route::get('/journey', [\App\Http\Controllers\Fan\JourneyController::class, 'index'])->name('journey');
    Route::get('/bookings/{booking}', [\App\Http\Controllers\Fan\JourneyController::class, 'show'])->name('bookings.show');
    Route::get('/wallet', [\App\Http\Controllers\Fan\WalletController::class, 'index'])->name('wallet');

    // Loan Applications (Fan)
    Route::get('/loan-applications', [\App\Http\Controllers\Fan\LoanApplicationController::class, 'index'])->name('loan-applications');
    Route::post('/loan-applications', [\App\Http\Controllers\Fan\LoanApplicationController::class, 'store'])->name('loan-applications.store');
    Route::delete('/loan-applications/{loanApplication}', [\App\Http\Controllers\Fan\LoanApplicationController::class, 'destroy'])->name('loan-applications.destroy');

    // Savings Goals (Fan)
    Route::get('/savings-goals', [\App\Http\Controllers\Fan\SavingsGoalController::class, 'index'])->name('savings-goals');
    Route::post('/savings-goals', [\App\Http\Controllers\Fan\SavingsGoalController::class, 'store'])->name('savings-goals.store');
    Route::put('/savings-goals/{savingsGoal}', [\App\Http\Controllers\Fan\SavingsGoalController::class, 'update'])->name('savings-goals.update');
    Route::delete('/savings-goals/{savingsGoal}', [\App\Http\Controllers\Fan\SavingsGoalController::class, 'destroy'])->name('savings-goals.destroy');

    // Budget Delete
    Route::delete('/budgets/{budget}', [\App\Http\Controllers\Fan\BudgetController::class, 'destroy'])->name('budgets.destroy');

    // API Routes for Fan Dashboard
    Route::post('/budget/save', [\App\Http\Controllers\Fan\BudgetController::class, 'store'])->name('budget.save');
    Route::get('/budget/active', [\App\Http\Controllers\Fan\BudgetController::class, 'getActive'])->name('budget.active');

    // Feature Pages
    Route::get('/match-schedule', [\App\Http\Controllers\Fan\MatchScheduleController::class, 'index'])->name('match-schedule');
    Route::get('/communication', [\App\Http\Controllers\Fan\CommunicationController::class, 'index'])->name('communication');
    Route::get('/payments', [\App\Http\Controllers\Fan\PaymentController::class, 'index'])->name('payments');
    Route::get('/activities', [\App\Http\Controllers\Fan\ActivityController::class, 'index'])->name('activities');
    Route::get('/events', [\App\Http\Controllers\Fan\EventController::class, 'index'])->name('events');
    Route::get('/security', [\App\Http\Controllers\Fan\SecurityController::class, 'index'])->name('security');
    Route::get('/contact', [\App\Http\Controllers\Fan\ContactController::class, 'index'])->name('contact');
    Route::post('/contact', [\App\Http\Controllers\Fan\ContactController::class, 'store'])->name('contact.store');

    // Profile API
    Route::put('/profile/update', [\App\Http\Controllers\Fan\ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [\App\Http\Controllers\Fan\ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');

    // Social Feed
    Route::get('/feed', [\App\Http\Controllers\Fan\FeedController::class, 'index'])->name('feed');
    Route::get('/feed/post/{post}', [\App\Http\Controllers\Fan\FeedController::class, 'show'])->name('feed.post.show');
    Route::post('/feed', [\App\Http\Controllers\Fan\FeedController::class, 'store'])->name('feed.store');
    Route::post('/feed/{post}/like', [\App\Http\Controllers\Fan\FeedController::class, 'like'])->name('feed.like');
    Route::post('/feed/{post}/comment', [\App\Http\Controllers\Fan\FeedController::class, 'comment'])->name('feed.comment');
    Route::post('/feed/{post}/repost', [\App\Http\Controllers\Fan\FeedController::class, 'repost'])->name('feed.repost');
    Route::post('/feed/{post}/share', [\App\Http\Controllers\Fan\FeedController::class, 'share'])->name('feed.share');
    Route::delete('/feed/{post}', [\App\Http\Controllers\Fan\FeedController::class, 'destroy'])->name('feed.destroy');

    // Follow/Unfollow
    Route::post('/follow/{user}', [\App\Http\Controllers\Fan\FollowController::class, 'toggle'])->name('follow.toggle');
    Route::get('/follow/{user}/preview', [\App\Http\Controllers\Fan\FollowController::class, 'preview'])->name('follow.preview');

    // Stories
    Route::get('/stories', [\App\Http\Controllers\Fan\StoriesController::class, 'index'])->name('stories');
    Route::post('/stories', [\App\Http\Controllers\Fan\StoriesController::class, 'store'])->name('stories.store');
    Route::post('/stories/{story}/view', [\App\Http\Controllers\Fan\StoriesController::class, 'view'])->name('stories.view');
    Route::post('/stories/{story}/reply', [\App\Http\Controllers\Fan\StoriesController::class, 'reply'])->name('stories.reply');
    Route::post('/stories/{story}/link', [\App\Http\Controllers\Fan\StoriesController::class, 'link'])->name('stories.link');
    Route::get('/stories/{story}/replies', [\App\Http\Controllers\Fan\StoriesController::class, 'getReplies'])->name('stories.replies');
    Route::get('/stories/{story}/viewers', [\App\Http\Controllers\Fan\StoriesController::class, 'viewers'])->name('stories.viewers');
    Route::delete('/stories/{story}', [\App\Http\Controllers\Fan\StoriesController::class, 'destroy'])->name('stories.destroy');

    // Ad tracking
    Route::post('/ads/{ad}/impression', [\App\Http\Controllers\Fan\AdController::class, 'trackImpression'])->name('ads.impression');
    Route::post('/ads/{ad}/click', [\App\Http\Controllers\Fan\AdController::class, 'trackClick'])->name('ads.click');

    // Share
    Route::get('/share/options', [\App\Http\Controllers\Fan\ShareController::class, 'getShareOptions'])->name('share.options');
    Route::post('/share', [\App\Http\Controllers\Fan\ShareController::class, 'share'])->name('share');

    // Tribes
    Route::get('/tribes', [\App\Http\Controllers\Fan\TribeController::class, 'index'])->name('tribes');
    Route::get('/tribes/{tribe}', [\App\Http\Controllers\Fan\TribeController::class, 'show'])->name('tribes.show');
    Route::post('/tribes', [\App\Http\Controllers\Fan\TribeController::class, 'store'])->name('tribes.store');
    Route::post('/tribes/{tribe}/join', [\App\Http\Controllers\Fan\TribeController::class, 'join'])->name('tribes.join');
    Route::post('/tribes/{tribe}/leave', [\App\Http\Controllers\Fan\TribeController::class, 'leave'])->name('tribes.leave');
    Route::put('/tribes/{tribe}', [\App\Http\Controllers\Fan\TribeController::class, 'update'])->name('tribes.update');
    Route::post('/tribes/{tribe}/members/{user}/toggle-role', [\App\Http\Controllers\Fan\TribeController::class, 'toggleRole'])->name('tribes.members.toggle-role');

    // Fan Store
    Route::get('/store', [\App\Http\Controllers\Fan\FanStoreController::class, 'index'])->name('store');

    // Predict & Win
    Route::get('/predict-win', [\App\Http\Controllers\Fan\PredictWinController::class, 'index'])->name('predict-win');
    Route::post('/predict-win/predict', [\App\Http\Controllers\Fan\PredictWinController::class, 'predict'])->name('predict-win.predict');

    // Payment Routes (Enhanced)
    Route::post('/payments/method', [\App\Http\Controllers\Fan\PaymentController::class, 'addPaymentMethod'])->name('payments.method.add');
    Route::delete('/payments/method/{id}', [\App\Http\Controllers\Fan\PaymentController::class, 'removePaymentMethod'])->name('payments.method.remove');
    Route::post('/payments/initiate', [\App\Http\Controllers\Fan\PaymentController::class, 'initiatePayment'])->name('payments.initiate');
    Route::post('/payments/verify', [\App\Http\Controllers\Fan\PaymentController::class, 'verifyPayment'])->name('payments.verify');

    // Security Routes (Enhanced)
    Route::post('/security/password', [\App\Http\Controllers\Fan\SecurityController::class, 'changePassword'])->name('security.password');
    Route::post('/security/two-factor', [\App\Http\Controllers\Fan\SecurityController::class, 'toggleTwoFactor'])->name('security.two-factor');
    Route::post('/security/notifications', [\App\Http\Controllers\Fan\SecurityController::class, 'toggleLoginNotifications'])->name('security.notifications');

    // Event RSVP Routes
    Route::post('/events/{event}/rsvp', [\App\Http\Controllers\Fan\EventController::class, 'rsvp'])->name('events.rsvp');
    Route::delete('/events/{event}/rsvp', [\App\Http\Controllers\Fan\EventController::class, 'cancelRsvp'])->name('events.rsvp.cancel');

    // Match Schedule Routes (Enhanced)
    Route::post('/match-schedule/{fixture}/favorite', [\App\Http\Controllers\Fan\MatchScheduleController::class, 'toggleFavorite'])->name('match-schedule.favorite');

    // 2FA Routes
    Route::post('/security/two-factor/confirm', [\App\Http\Controllers\Fan\SecurityController::class, 'confirmTwoFactor'])->name('security.two-factor.confirm');

    // Communication Routes (Enhanced)
    Route::post('/communication/{message}/read', [\App\Http\Controllers\Fan\CommunicationController::class, 'markAsRead'])->name('communication.read');
    Route::delete('/communication/{message}', [\App\Http\Controllers\Fan\CommunicationController::class, 'deleteMessage'])->name('communication.delete');

    // Tribe Posts (Discussions)
    Route::post('/tribes/{tribe}/posts', [\App\Http\Controllers\Fan\TribeController::class, 'createPost'])->name('tribes.posts.store');
    Route::post('/tribes/{tribe}/posts/{post}/reply', [\App\Http\Controllers\Fan\TribeController::class, 'replyToPost'])->name('tribes.posts.reply');

    // Notifications & Messages
    Route::post('/notifications/read-all', [\App\Http\Controllers\Fan\NotificationController::class, 'markNotificationsRead'])->name('notifications.read-all');
    Route::post('/messages/read-all', [\App\Http\Controllers\Fan\NotificationController::class, 'markMessagesRead'])->name('messages.read-all');
});

// Admin Routes
Route::middleware(['auth', 'verified', 'is_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');

    // Users Management
    Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index'])->name('users');
    Route::put('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/toggle-admin', [\App\Http\Controllers\Admin\UserController::class, 'toggleAdmin'])->name('users.toggle-admin');
    Route::delete('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('users.destroy');

    // Profile Management
    Route::get('/profile', [\App\Http\Controllers\Admin\ProfileController::class, 'index'])->name('profile');
    Route::put('/profile', [\App\Http\Controllers\Admin\ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [\App\Http\Controllers\Admin\ProfileController::class, 'password'])->name('profile.password');

    // Payments Management
    Route::get('/payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index'])->name('payments');
    Route::put('/payments/{paymentTransaction}/status', [\App\Http\Controllers\Admin\PaymentController::class, 'updateStatus'])->name('payments.status');

    // Events Management
    Route::get('/events', [\App\Http\Controllers\Admin\EventController::class, 'index'])->name('events');
    Route::post('/events', [\App\Http\Controllers\Admin\EventController::class, 'store'])->name('events.store');
    Route::put('/events/{event}', [\App\Http\Controllers\Admin\EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [\App\Http\Controllers\Admin\EventController::class, 'destroy'])->name('events.destroy');

    // Content Management
    Route::get('/content', [\App\Http\Controllers\Admin\ContentController::class, 'index'])->name('content');
    Route::post('/content/settings', [\App\Http\Controllers\Admin\ContentController::class, 'updateSettings'])->name('content.settings.update');
    Route::delete('/content/posts/{post}', [\App\Http\Controllers\Admin\ContentController::class, 'deletePost'])->name('content.posts.delete');

    // News Management
    Route::get('/news', [\App\Http\Controllers\Admin\NewsController::class, 'index'])->name('news.index');
    Route::post('/news', [\App\Http\Controllers\Admin\NewsController::class, 'store'])->name('news.store');
    Route::put('/news/{news}', [\App\Http\Controllers\Admin\NewsController::class, 'update'])->name('news.update');
    Route::delete('/news/{news}', [\App\Http\Controllers\Admin\NewsController::class, 'destroy'])->name('news.destroy');

    // Ads Management
    Route::get('/ads', [\App\Http\Controllers\Admin\AdController::class, 'index'])->name('ads.index');
    Route::post('/ads', [\App\Http\Controllers\Admin\AdController::class, 'store'])->name('ads.store');
    Route::put('/ads/{ad}', [\App\Http\Controllers\Admin\AdController::class, 'update'])->name('ads.update');
    Route::delete('/ads/{ad}', [\App\Http\Controllers\Admin\AdController::class, 'destroy'])->name('ads.destroy');

    // Settings
    Route::get('/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('settings');
    Route::post('/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])->name('settings.update');
    Route::post('/settings/tournaments/refresh', [\App\Http\Controllers\Admin\SettingsController::class, 'refreshTournaments'])->name('settings.tournaments.refresh');
    // Announcements
    Route::get('/announcements', [\App\Http\Controllers\Admin\AnnouncementsController::class, 'index'])->name('announcements');
    Route::post('/announcements', [\App\Http\Controllers\Admin\AnnouncementsController::class, 'store'])->name('announcements.store');
    Route::put('/announcements/{announcement}', [\App\Http\Controllers\Admin\AnnouncementsController::class, 'update'])->name('announcements.update');
    Route::put('/announcements/{announcement}/toggle', [\App\Http\Controllers\Admin\AnnouncementsController::class, 'toggle'])->name('announcements.toggle');
    Route::delete('/announcements/{announcement}', [\App\Http\Controllers\Admin\AnnouncementsController::class, 'destroy'])->name('announcements.destroy');

    // Messages
    Route::get('/messages', [\App\Http\Controllers\Admin\MessagesController::class, 'index'])->name('messages');
    Route::put('/messages/{message}/read', [\App\Http\Controllers\Admin\MessagesController::class, 'markAsRead'])->name('messages.read');
    Route::delete('/messages/{message}', [\App\Http\Controllers\Admin\MessagesController::class, 'destroy'])->name('messages.destroy');
    Route::put('/internal-messages/{internalMessage}/read', [\App\Http\Controllers\Admin\MessagesController::class, 'markInternalAsRead'])->name('messages.internal.read');
    Route::delete('/internal-messages/{internalMessage}', [\App\Http\Controllers\Admin\MessagesController::class, 'destroyInternal'])->name('messages.internal.destroy');

    // Analytics
    Route::get('/analytics', [\App\Http\Controllers\Admin\AnalyticsController::class, 'index'])->name('analytics');

    // Loan Applications
    Route::get('/loan-applications', [\App\Http\Controllers\Admin\LoanApplicationController::class, 'index'])->name('loan-applications');
    Route::put('/loan-applications/{loanApplication}', [\App\Http\Controllers\Admin\LoanApplicationController::class, 'update'])->name('loan-applications.update');
    Route::delete('/loan-applications/{loanApplication}', [\App\Http\Controllers\Admin\LoanApplicationController::class, 'destroy'])->name('loan-applications.destroy');

    // Prizes Management
    Route::get('/prizes', [\App\Http\Controllers\Admin\PrizeController::class, 'index'])->name('prizes.index');
    Route::post('/prizes', [\App\Http\Controllers\Admin\PrizeController::class, 'store'])->name('prizes.store');
    Route::put('/prizes/{prize}', [\App\Http\Controllers\Admin\PrizeController::class, 'update'])->name('prizes.update');
    Route::delete('/prizes/{prize}', [\App\Http\Controllers\Admin\PrizeController::class, 'destroy'])->name('prizes.destroy');

    // Savings Goals Management
    Route::get('/savings-goals', [\App\Http\Controllers\Admin\SavingsGoalController::class, 'index'])->name('savings-goals.index');
    Route::delete('/savings-goals/{savingsGoal}', [\App\Http\Controllers\Admin\SavingsGoalController::class, 'destroy'])->name('savings-goals.destroy');

    // Booking Management
    Route::get('/bookings', [\App\Http\Controllers\Admin\BookingController::class, 'index'])->name('bookings.index');
    Route::get('/bookings/{booking}', [\App\Http\Controllers\Admin\BookingController::class, 'show'])->name('bookings.show');
    Route::put('/bookings/{booking}', [\App\Http\Controllers\Admin\BookingController::class, 'update'])->name('bookings.update');
    Route::delete('/bookings/{booking}', [\App\Http\Controllers\Admin\BookingController::class, 'destroy'])->name('bookings.destroy');

    // Product Management
    Route::get('/products', [\App\Http\Controllers\Admin\ProductController::class, 'index'])->name('products.index');
    Route::post('/products', [\App\Http\Controllers\Admin\ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{product}', [\App\Http\Controllers\Admin\ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [\App\Http\Controllers\Admin\ProductController::class, 'destroy'])->name('products.destroy');

    // Tribes Management
    Route::get('/tribes', [\App\Http\Controllers\Admin\TribeController::class, 'index'])->name('tribes.index');
    Route::get('/tribes/{tribe}', [\App\Http\Controllers\Admin\TribeController::class, 'show'])->name('tribes.show');
    Route::put('/tribes/{tribe}', [\App\Http\Controllers\Admin\TribeController::class, 'update'])->name('tribes.update');
    Route::delete('/tribes/{tribe}', [\App\Http\Controllers\Admin\TribeController::class, 'destroy'])->name('tribes.destroy');

    // Stories Management
    Route::get('/stories', [\App\Http\Controllers\Admin\StoryController::class, 'index'])->name('stories.index');
    Route::delete('/stories/{story}', [\App\Http\Controllers\Admin\StoryController::class, 'destroy'])->name('stories.destroy');
});

// Partner Routes
Route::middleware(['auth', 'verified', 'is_partner'])->prefix('partner')->name('partner.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Partner\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/requests', [\App\Http\Controllers\Partner\DashboardController::class, 'requests'])->name('requests');
    Route::get('/requests/{budget}', [\App\Http\Controllers\Partner\DashboardController::class, 'show'])->name('requests.show');
    Route::put('/requests/{budget}', [\App\Http\Controllers\Partner\DashboardController::class, 'update'])->name('requests.update');

    // Profile Routes
    Route::get('/profile', [\App\Http\Controllers\Partner\ProfileController::class, 'index'])->name('profile');
    Route::post('/profile', [\App\Http\Controllers\Partner\ProfileController::class, 'update'])->name('profile.update');

    // Security Routes
    Route::get('/security', [\App\Http\Controllers\Partner\SecurityController::class, 'index'])->name('security');
    Route::post('/security/password', [\App\Http\Controllers\Partner\SecurityController::class, 'changePassword'])->name('security.password');
    Route::post('/security/two-factor', [\App\Http\Controllers\Partner\SecurityController::class, 'toggleTwoFactor'])->name('security.two-factor');
    Route::post('/security/two-factor/confirm', [\App\Http\Controllers\Partner\SecurityController::class, 'confirmTwoFactor'])->name('security.two-factor.confirm');

    // Communication/Messages Routes
    Route::get('/messages', [\App\Http\Controllers\Partner\CommunicationController::class, 'index'])->name('messages');
    Route::post('/messages', [\App\Http\Controllers\Partner\CommunicationController::class, 'store'])->name('messages.store');
    Route::post('/messages/{budget}/read', [\App\Http\Controllers\Partner\CommunicationController::class, 'markAsRead'])->name('messages.read');
});
