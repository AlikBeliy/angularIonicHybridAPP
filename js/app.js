// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var monkeyVpn = angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngStorage', 'ngCordova', 'ngMap', 'angulartics', 'angulartics.google.analytics.cordova']);


monkeyVpn.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $analyticsProvider, googleAnalyticsCordovaProvider, $logProvider, $compileProvider, $httpProvider) {

    $ionicConfigProvider.navBar.alignTitle('center');
	
    // Combine multiple $http requests into one $applyAsync (boosts performance)
    $httpProvider.useApplyAsync(true);

    // disable some angular default logging to provide small performance boost in production
    if (CBConfigEnv == "production") {
        $logProvider.debugEnabled(false);
        $compileProvider.debugInfoEnabled(false);
    }

    $analyticsProvider.firstPageview(true);
    $analyticsProvider.virtualPageviews(true);
    // init google analytics only for production
    if (CBConfigEnv == "production") {
        googleAnalyticsCordovaProvider.trackingId = "UA-70346556-1";
        googleAnalyticsCordovaProvider.debug = false; // default: false
    } else {
        googleAnalyticsCordovaProvider.trackingId = "";
        googleAnalyticsCordovaProvider.debug = true; // default: false
    }
	
    /* routes */
    $stateProvider
        .state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "partials/mainPages/main.html",
            controller: 'AppCtrl'
        })
        .state('app.homenotconnected', {
            url: "/homenotconnected",
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/homeNotConnected.html",
                    controller: 'HomeNotConnectedCtrl'
                }
            }
        })
        .state('app.homepageconnected', {
            url: "/homepageconnected",
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/homePageConnected.html",
                    controller: 'HomePageConnectedCtrl'
                }
            }
        })
        .state('app.moreTraffic', {
            url: "/moretraffic",
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/moreTraffic.html",
                    controller: 'MoreTrafficCtrl'
                }
            }
        })
        .state('app.help', {
            url: "/help",
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/help.html",
                    controller: 'HelpCtrl'
                }
            }
        })
        .state('app.answer', {
            url: "/answer/:id",
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/answer.html",
                    controller: 'HelpCtrl'
                }
            }
        })
        .state('app.login', {
            url: "/login",
            authenticate: false,
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/login.html",
                    controller: 'LoginCtrl'
                }
            }
        })
        .state('app.signup', {
            url: "/signup",
            authenticate: false,
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/signup.html",
                    controller: 'SignupCtrl'
                }
            }
        })
        .state('app.settings', {
            url: "/settings",
            authenticate: false,
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/settings.html",
                    controller: 'SettingsCtrl'
                }
            }
        })
        .state('app.about', {
            url: "/about",
            authenticate: false,
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/about.html",
                    controller: 'AboutCtrl'
                }
            }
        })
        .state('app.signupconfirm', {
            url: "/signupconfirm",
            authenticate: false,
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/signupConfirm.html",
                    controller: 'SignupConfirmCtrl'
                }
            }
        })
        .state('app.reachlimit', {
            url: "/reachlimit",
            authenticate: false,
            views: {
                'menuContent': {
                    templateUrl: "partials/mainPages/reachLimit.html",
                    controller: 'ReachLimitCtrl'
                }
            }
        })
        
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/signup');
});

monkeyVpn.run(['$rootScope', '$state', '$location', 'AuthService', 'VpnService', 'databaseService', '$ionicPlatform', '$localStorage',
    function ($rootScope, $state, $location, AuthService, VpnService, databaseService, $ionicPlatform, $localStorage) {

        $ionicPlatform.ready(function () {

            CBConfigAppBinaryVersion = "NA";
            CBConfigAppBinaryBuildNumber = "NA";

            if (window.cordova && window.cordova.getAppVersion) {
                window.cordova.getAppVersion.getVersionNumber().then(function (version) {
                    CBConfigAppBinaryVersion = version;
                    CBConfigVersionFingerprint = CBConfigAppBinaryVersion + " (" + CBConfigAppBinaryBuildNumber + "-" + CBConfigGitVersion + "-" + CBConfigEnv + ")";
                });
                window.cordova.getAppVersion.getVersionCode().then(function (version) {
                    CBConfigAppBinaryBuildNumber = version;
                    CBConfigVersionFingerprint = CBConfigAppBinaryVersion + " (" + CBConfigAppBinaryBuildNumber + "-" + CBConfigGitVersion + "-" + CBConfigEnv + ")";
                });
            }
            CBConfigVersionFingerprint = CBConfigAppBinaryVersion + " (" + CBConfigAppBinaryBuildNumber + "-" + CBConfigGitVersion + "-" + CBConfigEnv + ")";
			
            // watch $localStorage.user for changes and update tracking codes with user information when it changes, this watch gets triggered on each app start as well and therefore initializes the tracking codes properly
            $rootScope.$watch(function () {
                if ($localStorage.current_user) {
                    return $localStorage.current_user.id;
                }
            }, function (oldVal, newVal) {
                // add user-id to google analytics and set custom dimension 'provider' (=dimension with index 1)
                if (window.analytics) {
                    window.analytics.setUserId($localStorage.current_user.id);
                    window.analytics.addCustomDimension(1, $localStorage.current_user.provider, function (success) { console.log(success); }, function (error) { console.log(error); });
                }
                console.log("User Tracking ID: ", newVal);
            });

            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            VpnService.registerCallback(); //register the callback handler for the VPN Service
                    
            function initializeStore() {
                    
                // Let's set a pretty high verbosity level, so that we see a lot of stuff
                // in the console (reassuring us that something is happening).
                store.verbosity = store.INFO;
                    
                // We register a dummy product. It's ok, it shouldn't
                // prevent the store "ready" event from firing.
                store.register({
                    id: "com.monkeyvpn.app.14daypass",
                    alias: "14-Day Pass",
                    type: store.CONSUMABLE
                });
                    
                store.register({
                    id: "com.monkeyvpn.app.1monthsubscription",
                    alias: "1 Month Premium Subscription",
                    type: store.PAID_SUBSCRIPTION
                });  
                   
                store.register({
                    id: "com.monkeyvpn.app.6monthsubscription ",
                    alias: "6 Month Premium Subscription",
                    type: store.PAID_SUBSCRIPTION
                });  
                
                store.register({
                    id: "com.monkeyvpn.app.12monthsubscription",
                    alias: "12 Month Premium Subscription",
                    type: store.PAID_SUBSCRIPTION
                });  
                // When every goes as expected, it's time to celebrate!
                // The "ready" event should be welcomed with music and fireworks,
                // go ask your boss about it! (just in case)
                store.ready(function () {
                    console.log("\\o/ STORE READY \\o/");
                });
                
                // Log all errors
                store.error(function(error) {
                    console.log('STORE ERROR ' + error.code + ': ' + error.message);
                });
                
                
                store.when("com.monkeyvpn.app.14daypass").approved(function(p) {
                    console.log("verify subscription");
                    p.verify();
                });
                store.when("com.monkeyvpn.app.14daypass").verified(function(p) {
                    console.log("subscription verified");
                    p.finish();
                });
                store.when("com.monkeyvpn.app.14daypass").unverified(function(p) {
                    console.log("subscription unverified");
                });
                store.when("com.monkeyvpn.app.14daypass").updated(function(p) {
                    if (p.owned) {
                        console.log("you are subscribed!");
                    }
                    else {
                        console.log("you are not subscribed!");
                    }
                });
                
                
                    
                // After we've done our setup, we tell the store to do
                // it's first refresh. Nothing will happen if we do not call store.refresh()
                store.refresh();
            }
            if (window.cordova && window.store) {
                initializeStore();
            }
					
            // this utility function clears the history stack so that on android the back button exits the app instead of navigating back to the signin page (for example)
            $rootScope.clearAllHistory = function () {
                $timeout(function () {
                    $ionicHistory.clearHistory();
                });
            };

        });

        databaseService.getServersFromJson();

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            if (Object.keys(AuthService.isLoggedIn()).length === 0 && toState.authenticate) {
                event.preventDefault();
                $state.go('app.signup');
            }
        });


    }]);