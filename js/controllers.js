angular.module('starter.controllers', [])
    .controller('AppCtrl', function ($scope, $rootScope, $ionicHistory, $interval, $timeout, $localStorage, databaseService) {

        $scope.goPrevPage = function () {
            $ionicHistory.goBack();
        };
        $scope.password = /^\s*\w*\s*$/;
        $scope.email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        $rootScope.trafficUpdateInterval = function (check) {
            if (check) {
                if (angular.isDefined($localStorage.current_user)) {
                    var current_user_email = $localStorage.current_user.email;
                    var current_user_pass = $localStorage.current_user.password;
                    $scope.checkingTraffic = $interval(
                        function () {

                            databaseService.getUserTraffic(current_user_email, current_user_pass).then(function (data) {
                                if (angular.isDefined(data.totalTraffic) && angular.isDefined(data.totalTrafficUsed)) {
                                    $localStorage.totalTraffic = data.totalTraffic;
                                    $rootScope.totalTraffic = data.totalTraffic;
                                    $localStorage.totalTrafficUsed = data.totalTrafficUsed;
                                    $rootScope.totalTrafficUsed = data.totalTrafficUsed;
                                }
                            });
                        }, 5000 * 60);  //every 5 mins
                }
            } else {

                if (angular.isDefined($scope.checkingTraffic)) {
                    $interval.cancel($scope.checkingTraffic);
                }
            }
        }

        $rootScope.trafficUpdateWithDelay = function () {
            if (angular.isDefined($localStorage.current_user)) {
                var current_user = $localStorage.current_user.email;
                $timeout(
                    function () {

                        databaseService.getUserTraffic(current_user).then(function (data) {
                            if (angular.isDefined(data.totalTraffic) && angular.isDefined(data.totalTrafficUsed)) {
                                console.log("trafficUpdateWithDelay totalTraffic " + data.totalTraffic);
                                console.log("trafficUpdateWithDelay totalTrafficUsed" + data.totalTrafficUsed);
                                $localStorage.totalTraffic = data.totalTraffic;
                                $localStorage.totalTrafficUsed = data.totalTrafficUsed;
                            }

                        });
                    }, 10000);  //in 10 sec.
            }
        }

    })

    .controller('HomeNotConnectedCtrl', function ($scope, $rootScope, $state, databaseService, VpnService, AuthService, $ionicModal, $localStorage, $ionicPopup, NgMap) {
        console.log("current_user: "+ $localStorage.current_user);
        if (angular.isDefined($localStorage.current_user))
            $scope.current_username = $localStorage.current_user.email;

        if (angular.isDefined($localStorage.selectedServer)) {
            $scope.currentCountry = $localStorage.selectedServer;
        } else {
            $scope.currentCountry = $localStorage.servers[0];
        }

        $scope.$watch('currentCountry', function (data) {
            $localStorage.selectedServer = data;
        });

        $scope.servers = $localStorage.servers;

        //redirect to help page
        $scope.goToHelp = function () {
            $state.transitionTo("app.help");
        }
        $scope.goToSettings = function () {
            $rootScope.totalTraffic = $localStorage.totalTraffic;
            $rootScope.totalTrafficUsed = $localStorage.totalTrafficUsed;
            $rootScope.current_username = $localStorage.current_username;
            // if user has unlimited status set unlimited to true
            $rootScope.unlimited = false;
            if ($rootScope.totalTraffic === "u") {
                $rootScope.unlimited = true;
            };
            $state.transitionTo("app.settings");
        }
        /**
         * Connects user and redirect to homepageconnected
         */
        //console.log(AuthService.user.email);

        $scope.connect = function () {
            var vpnPassword = $localStorage.current_user.password;
            var vpnUsername = $localStorage.current_user.email;
            var vpnHost = $scope.currentCountry.fqdn;
            VpnService.connectVPN(vpnPassword, vpnUsername, vpnHost).then(
                function (result) {
                    console.log("connecting VPN ", result);
                    $rootScope.trafficUpdateInterval(true);
                    $rootScope.trafficUpdateWithDelay();
                    console.log("in connect " + $rootScope.trafficUpdateWithDelay());
                    //$state.transitionTo("app.homepageconnected");
                    // connecting, UI stuff is triggered by the callbacks
                },
                function (error) {
                    $ionicPopup.alert({
                        title: 'Error',
                        template: "Failed to connect to the VPN, please check the following: <br>1. Try another VPN server location" +
                        "<br>2. Make sure your internet connection is working" +
                        "<br>3. If you still have troubles connecting feel free to contact our support at <u>support@monkeyvpn.com</u>",
                        cssClass: 'alertPopup'
                    });
                }
                );
        }
        $ionicModal.fromTemplateUrl('partials/mainPages/countryList.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function () {
            $scope.modal.show();
        };
        $scope.closeModal = function (country) {
            $scope.currentCountry = country;
            $scope.modal.hide();
        };
        
        /* light grey map style */
        $scope.mapStyle = [{ "featureType": "landscape", "stylers": [{ "saturation": -100 }, { "lightness": 65 }, { "visibility": "on" }] }, { "featureType": "poi", "stylers": [{ "saturation": -100 }, { "lightness": 51 }, { "visibility": "simplified" }] }, { "featureType": "road.highway", "stylers": [{ "saturation": -100 }, { "visibility": "simplified" }] }, { "featureType": "road.arterial", "stylers": [{ "saturation": -100 }, { "lightness": 30 }, { "visibility": "on" }] }, { "featureType": "road.local", "stylers": [{ "saturation": -100 }, { "lightness": 40 }, { "visibility": "on" }] }, { "featureType": "transit", "stylers": [{ "saturation": -100 }, { "visibility": "simplified" }] }, { "featureType": "administrative.province", "stylers": [{ "visibility": "off" }] }, { "featureType": "water", "elementType": "labels", "stylers": [{ "visibility": "on" }, { "lightness": -25 }, { "saturation": -100 }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "hue": "#ffff00" }, { "lightness": -25 }, { "saturation": -97 }] }];
        
        /* the following code is not required anymore since we set the style in the ng-map html attribute already */
        /*
        NgMap.getMap().then(function(map) {
            map.setOptions({styles: $scope.mapStyle});
        });
         */

        ///**
        // * Retrieves hotspots to be use for the options
        // */
        //databaseService.fetchServers().then(function (hotspots) {
        //    $scope.hotspots = hotspots;
        //    $scope.selectedHotspot = $scope.hotspots[0];
        //});
    })
    .controller('HomePageConnectedCtrl', function ($scope, $rootScope, $state, VpnService, $localStorage, databaseService) {

        $rootScope.$watch("currentIP", function (newValue, oldValue) {
            $rootScope.currentIP = newValue;
        });

        $rootScope.totalTraffic = $localStorage.totalTraffic;
        $rootScope.totalTrafficUsed = $localStorage.totalTrafficUsed;

        // if user has unlimited status set unlimited to true
        $rootScope.unlimited = false;
        if ($rootScope.totalTraffic === "u") {
            $rootScope.unlimited = true;
        };

        console.log("totalTraffic" + $rootScope.totalTraffic);
        console.log("totalTrafficUsed" + $rootScope.totalTrafficUsed);

        $rootScope.$watchGroup(['totalTraffic', 'totalTrafficUsed'], function (newValue, oldValue, scope) {
            console.log(newValue);
            $scope.trafficPercent(newValue);
        });

        //redirect to help page
        $scope.goToHelp = function () {
            $state.transitionTo("app.help");
        }

        //redirect to settings page
        $scope.goToSettings = function () {
            $state.transitionTo("app.settings");
        }

        $scope.trafficPercent = function (data) {
            $scope.totalTraffic = data[0];
            $scope.totalTrafficUsed = data[1];

            //if user have unlimited tariff
            // his totalTrafficPersent = 0
            if ($scope.totalTraffic === "u") {
                $scope.totalTrafficPersent = 0;
            } else {
                if ($scope.totalTraffic != 0) {
                    //console.log("data in trafficPercent" + data);
                    $scope.totalTrafficPersent = (parseFloat($scope.totalTrafficUsed) / parseFloat($scope.totalTraffic)) * 100;
                }
            }

            if ($scope.totalTrafficPersent > 100)
                $scope.totalTrafficPersent = 100;
        };

        $scope.trafficPercent($rootScope);

        /**
         * Disconnects the user and returns to homenotconnected page.
         */
        $scope.disconnect = function () {
            VpnService.disconnect().then(
                function (result) {
                    $rootScope.trafficUpdateInterval(false);
                    $rootScope.trafficUpdateWithDelay();

                    $state.transitionTo("app.homenotconnected");
                },
                function (error) {
                    console.log("error disconnecting VPN ", error);
                }
                );
        };

        /**
         * Redirects user to more Traffic Page
         */
        $scope.getTraffic = function () {
            $state.transitionTo("app.moreTraffic");
        }
    })
    .controller('MoreTrafficCtrl', function ($scope, $state) {
        //console.log('MoreTrafficCtrl');
        $scope.gotoLogin = function () {
            $state.transitionTo("app.login");
        };
    })
    .controller('HelpCtrl', function ($scope, $state, $stateParams) {
        //temporary data
        $scope.questionsList = [
            {
                id: '1',
                ques: 'How do I get more Traffic?',
                answer: 'Nulla hendrerit dui mi, sit amet sagittis mi commodo id. Etiam at pulvinar erat. Fusce elementum metus quis efficitur commodo. Sed sed tincidunt lacus.'
            },
            {
                id: '2',
                ques: 'How safe is the VPN?',
                answer: 'Suspendisse vestibulum sapien at arcu congue semper. Aenean eleifend consectetur pellentesque. Quisque tristique lacus id dui dictum ultricies.\n\
                         Donec massa eros, ultricies ac ex ac, tempor rutrum nisl. Proin vitae sapien commodo leo aliquam malesuada sed vitae neque.'
            },
            {
                id: '3',
                ques: 'Question 3',
                answer: 'Vivamus ut quam condimentum massa condimentum eleifend ac a ligula.'
            },
            {
                id: '4',
                ques: 'Question 4',
                answer: 'Proin maximus eros ante, eu feugiat erat pulvinar eu.'
            },
            {
                id: '5',
                ques: 'Question 5',
                answer: 'Sed mattis est non molestie cursus.'
            },
            {
                id: '6',
                ques: 'Question 6',
                answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
            }
        ];

        $scope.openQuestion = function (question) {
            $state.transitionTo("app.answer", { id: question });
        };

        if ($stateParams.id) {
            angular.forEach($scope.questionsList, function (value, key) {
                if (value.id === $stateParams.id) {
                    $scope.currentQuestion = value;
                }
            });
        }
    })
    .controller('SettingsCtrl', function ($scope, $rootScope, $state, AuthService, $localStorage) {

        if (angular.isDefined($localStorage.current_user))
            $scope.current_username = $localStorage.current_user.email;

        // Redirects user to login page
        $scope.logOut = function () {
            //databaseService.fetchServers();
            AuthService.logOut(function (response) {
                console.log(AuthService.user);
                $rootScope.trafficUpdateInterval(false);
                $state.transitionTo("app.login");
            });
        }

        $scope.signUp = function () {
            $state.transitionTo("app.signup");
        }

    })
    .controller('AboutCtrl', function ($scope, $localStorage) {
        $scope.appVersion = CBConfigVersionFingerprint;

        if (angular.isDefined($localStorage.current_user)) {
            $scope.userid = $localStorage.current_user.id;
        }

        $scope.enableRemoteDebugging = { checked: (typeof $localStorage.enableRemoteDebugging === 'undefined') ? false : $localStorage.enableRemoteDebugging };
        $scope.enableRemoteDebuggingChange = function () {
            console.log($scope.enableRemoteDebugging.checked);
            var debugurl = "https://debug.bymo.co/target/target-script-min.js#anonymous";
            $localStorage.enableRemoteDebugging = $scope.enableRemoteDebugging.checked;
            if ($scope.enableRemoteDebugging.checked) {
                // enable weinre
                (function (e) { e.setAttribute("src", debugurl); document.getElementsByTagName("body")[0].appendChild(e); })(document.createElement("script"));
            }
        }

        if ($scope.enableRemoteDebugging.checked) {
            $scope.showTheToggle = false;
        } else {
            $scope.showTheToggle = true;
        }

        $scope.showDebugToggle = function () {
            $scope.showTheToggle = false;
        }


    })
    .controller('LoginCtrl', function ($scope, $state, $timeout, databaseService, AuthService, $localStorage, $sessionStorage, $cordovaDevice, $ionicPopup, $ionicLoading, $rootScope) {

        $scope.credentials = {};
        /**
         * checks if the user & pass is valid, if yes it will redirect to homepage
         */
        $scope.login = function (data) {
            if (!(angular.isDefined($scope.credentials.email) && angular.isDefined($scope.credentials.password))) {
                $ionicPopup.alert({
                    title: 'Error',
                    template: 'Please enter your email and password',
                    cssClass: 'alertPopup'
                });

            } else {
                $ionicLoading.show({
                    template: 'Logging in...'
                });
                databaseService.validateUser(data.email, data.password).then(function (user) {
                    if (user) {
                        console.log(user);
                        if (typeof user.result.error !== 'undefined') {
                            $ionicLoading.hide();
                            $ionicPopup.alert({
                                title: 'Error',
                                template: user.result.error,
                                cssClass: 'alertPopup'
                            });
                        } else if (typeof user.result.success !== 'undefined') {
                            $scope.storage = $localStorage.$default({
                                totalTraffic: user.totalTraffic,
                                totalTrafficUsed: user.totalTrafficUsed,
                                current_username : user.username
                            });
                            databaseService.fetchServers();
                            if ($rootScope.notLoggedIn) {
                                $rootScope.notLoggedIn = false;
                            };
                            AuthService.setUser(data, function (response) {
                                console.log(AuthService.isLoggedIn());
                                $ionicLoading.hide();
                                $state.transitionTo("app.homenotconnected");
                            });
                        }
                    }
                }, function (error) {
                    $ionicLoading.hide();
                    $ionicPopup.alert({
                        title: 'Error',
                        template: 'Check your internet connection',
                        cssClass: 'alertPopup'
                    });
                });
            }
            // for dev skip login and proceed
            // $state.transitionTo("app.homenotconnected");
        };

        $scope.forgotPassword = function () {
            var promptPopup = $ionicPopup.prompt({
                title: 'Forgot Password',
                template: 'Type your email to get you username and password',
                cssClass: 'alertPopup',
                inputType: 'email',
                okText: 'Send'
            });
            promptPopup.then(function (res) {

                if (res) {
                    databaseService.forgotPass(res);
                    $ionicPopup.alert({
                        title: 'Forgot Password',
                        template: 'Password sent to your email address, please check your Inbox or Spam Folder if you have not received the mail.',
                        cssClass: 'alertPopup'
                    });
                } else {
                    //cancel click
                }
            });

        }
        /**
         * Redirects to signup Page
         */
        $scope.goToSignup = function () {
            $state.transitionTo("app.signup");
        }
    })
    .controller('SignupCtrl', function ($scope, $state, $ionicLoading, $ionicPopup, $timeout, databaseService, AuthService, $localStorage, $cordovaDevice, $q, $rootScope) {

        databaseService.fetchServers();

        if (window.cordova) {
            ionic.Platform.ready(function () {
                $scope.uuid = $cordovaDevice.getUUID();
            });
        } else {
            $scope.uuid = '22wefeewf565u42e2ce33';  //for testing on PC
        }

        $scope.credentials = {};

        $scope.signup = function (data) {

            if (!(angular.isDefined($scope.credentials.email) && angular.isDefined($scope.credentials.password))) {
                $ionicPopup.alert({
                    title: 'Error',
                    template: 'Please enter a valid email and a password with at least 4 characters',
                    cssClass: 'alertPopup'
                });
            } else {

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });

                databaseService.signupUser(data.email, data.password, $scope.uuid).then(function (data) {
                    if (data) {
                        if (typeof data.result.error !== 'undefined') {

                            $ionicLoading.hide();
                            $ionicPopup.alert({
                                title: 'Error',
                                template: data.result.error,
                                cssClass: 'alertPopup'
                            });

                        } else if (typeof data.result.success !== 'undefined') {

                            $scope.storage = $localStorage.$default({
                                totalTraffic: data.totalTraffic,
                                totalTrafficUsed: data.totalTrafficUsed
                            });

                            $ionicLoading.hide();
                            $ionicPopup.alert({
                                title: 'Success',
                                template: data.result.success,
                                cssClass: 'alertPopup'
                            }).then(function (res) {
                                if ($rootScope.notLoggedIn) {
                                $rootScope.notLoggedIn = false;
                                };
                                $state.transitionTo("app.homenotconnected");
                            });
                        }
                    } else {
                        //alert("3"+'Invalid User');
                    }
                });

            }
            // for dev skip login and proceed
            // $state.transitionTo("app.homenotconnected");
        };

        var accessToken;
        var socialSignup = function (token, tokentype) {
            databaseService.socialSignUp(token, tokentype, $scope.uuid)
                .then(function (data) {
                    if (data) {
                        $scope.storage = $localStorage.$default({
                            totalTraffic: data.totalTraffic,
                            totalTrafficUsed: data.totalTrafficUsed
                        });

                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: 'Success',
                            template: data.result,
                            cssClass: 'alertPopup'
                        }).then(function (res) {
                            if ($rootScope.notLoggedIn) {
                                $rootScope.notLoggedIn = false;
                                };
                            $state.transitionTo("app.homenotconnected");
                        });
                    } else {
                        //alert('16'+error);
                    }
                }, function (error) {
                    //alert('15'+error);
                });
        };

        var fbLoginSuccess = function (response) {
            console.log(response);
            if (!response.authResponse) {
                fbLoginError("Cannot find the authResponse");
                return;
            }
            var authResponse = response.authResponse;

            // This is the fail callback from the login method

            getFacebookProfileInfo(authResponse)
                .then(function (profileInfo) {
                    console.log(profileInfo);
                    // For the purpose of this example I will store user data on local storage
                    socialSignup(accessToken, 'facebook');
                }, function (fail) {
                    console.log(fail);
                    // Fail get profile info
                });
        };
        var fbLoginError = function (error) {
            console.log(error);
            $ionicLoading.hide();
        };

        // This method is to get the user profile info from the facebook api
        var getFacebookProfileInfo = function (authResponse) {
            console.log(authResponse);
            accessToken = authResponse.accessToken;
            var info = $q.defer();

            facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
                function (response) {
                    console.log(response);
                    info.resolve(response);
                },
                function (response) {
                    console.log(response);
                }
                );
            return info.promise;
        };

        //This method is executed when the user press the "Login with facebook" button
        $scope.facebookSignIn = function () {
            facebookConnectPlugin.getLoginStatus(function (success) {
                console.log(success);
                if (success.status === 'connected') {
                    // Check if we have our user saved
                    getFacebookProfileInfo(success.authResponse)
                        .then(function (profileInfo) {
                            console.log(profileInfo);
                            socialSignup(accessToken, 'facebook');
                        }, function (fail) {
                            // Fail get profile info
                            console.log(fail);
                        });
                } else {
                    $ionicLoading.show({
                        template: 'Logging in...'
                    });
                    facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
                }
            });
        };


        $scope.googleSignIn = function () {


            window.plugins.googleplus.login(
                {},
                function (user_data) {
                    console.log("User data:");
                    console.log(user_data);
                    $ionicLoading.show({
                        template: 'Logging in...'
                    });
                    socialSignup(user_data.oauthToken, 'google');
                },
                function (msg) {
                    $ionicLoading.hide();
                }
                );
        };

        $scope.skipSignUp = function(){
            databaseService.skipSignUp($scope.uuid)
                .then(function(data){
                    if(data){
                        $scope.storage = $localStorage.$default({
                            totalTraffic: data.totalTraffic,
                            totalTrafficUsed: data.totalTrafficUsed
                        });

                        $ionicLoading.hide();
                        $ionicPopup.alert({
                            title: 'Success',
                            template: data.result,
                            cssClass: 'alertPopup'
                        }).then(function(res){
                            $state.transitionTo("app.homenotconnected");
                        });
                    }else{
                        //alert('16'+error);
                    }
                },function(error){
                    //alert('15'+error);
                });
        };
        /**
         * Redirects to signup Page
         */
        $scope.goToLogin = function () {
            $state.transitionTo("app.login");
        }

        //redirects to home page
        $scope.goToHomePage = function () {
            $rootScope.notLoggedIn = true;
            $state.transitionTo("app.homenotconnected");
        }

    })
    .controller('SignupConfirmCtrl', function ($scope, $state) {

    })
    .controller('ReachLimitCtrl', function ($scope, $state) {
        //redirect to help page
        $scope.goToHelp = function () {
            $state.transitionTo("app.help");
        }

        //redirect to settings page
        $scope.goToSettings = function () {
            $state.transitionTo("app.settings");
        }
        /**
         * Redirects user to more Traffic Page
         */
        $scope.getTraffic = function () {
            $state.transitionTo("app.moreTraffic");
        }
    })
