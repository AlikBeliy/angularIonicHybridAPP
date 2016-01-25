/**
 * Created by Kevin on 27/03/2015.
 */

angular.module('starter.services', [])
    .factory('databaseService', function ($http, $q, $localStorage) {
    /**
     * function for logging in user, validates if user and password matches
     * @param userdata - containing the username and password of user
     */

    //var baseURL="http://192.185.137.203/~homepage/projects/vpn/";
    //var baseURL="http://monkeyvpn.api/index.php";
    var baseURL="https://www.monkeyvpn.com/mapi/index.php";

    var sendRequest = function(method, urlPath, params) {
        var deferred = $q.defer();
        //var completeUrl;
        if(params){
            params = $.param(params)
        }
        console.log(method, urlPath, params);
        $http({method: method, url: urlPath, data: params,  headers : { 'Content-Type': 'application/x-www-form-urlencoded' }}).success(function (data, status, headers) {
            deferred.resolve(data);
        }).error(function (data, status, headers, config, statusText) {
            console.log('Request Failed!',data,status,headers,config,statusText); //todo
            deferred.reject({data: data, status: status});
        });
        return deferred.promise;
    }

    /**
     * Retrieves list of servers use for the connect drop down after login.
     */
    function fetchServers() {
        sendRequest('POST', baseURL+'?action=serverslist', '').then(function(data){
            $localStorage.servers = data;
        },function(error){
            console.log('error');
        });

    }

    /**
     * Function for login validation
     * @param email
     * @param password
     */
    function validateUser(email, password) {
        var userData = {username: email, password: password};
        return sendRequest('POST', baseURL+'?action=login', userData);
    }

     function getServersFromJson(){

         if(!angular.isDefined($localStorage.servers)){
             $http.get('defaultServers.json').success(function(data) {
                 $localStorage.servers = data;
             }).error(function(){
                 console.log('Servers list file not found');
             });
         }
     }

    /**
     * Function for registration
     * @param email
     * @param password
     * @param uuid
     */
    function signupUser(email, password, uuid) {
        var userData = {username: email, password: password, uuid: uuid};
        return sendRequest('POST', baseURL+'?action=register', userData);
    }
        /**
     * Function for skipping the registration
     * @param email
     * @param password
     * @param uuid
     */
    function skipSignUp(uuid) {
        var userData = {uuid: uuid};
        return sendRequest('POST', baseURL+'?action=skip', userData);
    }
    
    /**
     * Function for registration with facebook/google
     * @param token
     * @param tokentype
     * @param uuid
     */
    function socialSignUp(token, tokentype, uuid) {
       var userData = {token: token, tokentype: tokentype, uuid: uuid};
        return sendRequest('POST', baseURL+'?action=register', userData);
    }
    
    /**
     * Function for forgot password feature
     * @param email
     */
    function forgotPass(email) {
        var userData = {email: email};
        return sendRequest('POST', 'http://www.monkeyvpn.com/forgot', userData);
    }

    /**
     * Function for getting user's used and total traffic
     * @param email
     */
    function getUserTraffic(email, password) {
        var userData = {username: email, password: password};
        return sendRequest('POST',  baseURL+'?action=traffic', userData);
    }

    function getIP(){
        return sendRequest('GET', 'http://ip-api.com/json', '');
    }
    return {
        validateUser: validateUser,
        signupUser: signupUser,
        skipSignUp: skipSignUp,
        forgotPass: forgotPass,
        fetchServers: fetchServers,
        getServersFromJson: getServersFromJson,
        getUserTraffic: getUserTraffic,
        getIP: getIP,
        socialSignUp: socialSignUp
    }

}).factory('VpnService', function ($q, $state, $ionicLoading, $ionicPopup, databaseService, $rootScope) {

    /**
     * Creates a vpn on the device and connects
     */
    function connectVPN(vpnPassword, vpnUsername, vpnHost){
        //vpnPassword = "test";
        //vpnUsername = "tester";
        vpnHost = "hk.monkeyvpn.com"; //for testing only
        var vpnConfig =          {
                    "vpnPassword": vpnPassword,
                    "vpnUsername": vpnUsername,
                    "vpnHost": vpnHost,
                    "userCertificate": "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",
                    "userCertificatePassword": "testit",
                    "caCertificate": "MIIDRDCCAiygAwIBAgIJANpc9y3v56/PMA0GCSqGSIb3DQEBCwUAMBsxGTAXBgNVBAMTEGhrLm1vbmtleXZwbi5jb20wHhcNMTUwNDA4MDgzMzM1WhcNMjUwNDA1MDgzMzM1WjAbMRkwFwYDVQQDExBoay5tb25rZXl2cG4uY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6Kxdx+7XPjxj5UzmVgzyoGzNCHVjt4UPUe2JrvqDwo13wwd/tjOoUgygc4F9LQH8Oyn8A9Fk16tjtgz7rsPnPzbJ4803tYRnTbWVXb8FYkv/Uz7uD/ap9q6jT7RY1bCCD14przkzqfvveHmCBe0OdX/1Zr10ekT0fw2Go5cUsySB7V5QcGRdfpwukhCbqKOQLFNh6JQT1/bK7ju1gc6iHxv3G0fhFoKnx0ZmGbzmBRL/rTbVx0uiLTdSZgJBkTCW7vo0F3f3XhiSVV2vK2hsHCkm3RWS2pg0migBE1gvSumoNZjjEVWySPF2qEwz+ZHwSD4mz6AkdnkudF570GPzkQIDAQABo4GKMIGHMB0GA1UdDgQWBBR0GpsO77j6CeYbgizrB3PbL1pz/DBLBgNVHSMERDBCgBR0GpsO77j6CeYbgizrB3PbL1pz/KEfpB0wGzEZMBcGA1UEAxMQaGsubW9ua2V5dnBuLmNvbYIJANpc9y3v56/PMAwGA1UdEwQFMAMBAf8wCwYDVR0PBAQDAgEGMA0GCSqGSIb3DQEBCwUAA4IBAQCN0ya3PmHDrdPtQYVdOUIBW0Oma4pZI3kAX6rVm28G/7ksJRNpFCKOEsk4XqZD/KzWARN02CA4GdTZWY64///bi/3XHfcNjHaD/4w9X+wru9TXRG/cA+k/PALDF99FTQ77lP/K8xdG3fU3mm6+vnXtmlEHvBnudT83WY5XvzG4IKuFwsygo30c8BAyG76T9khGCk2c9lHckZOSbS5D/TMpuii0LVnU0g/6P6c00G6edGJV75NtRO3JK4d6dxnDdTEt20vj7vhz3RLycpxhH8GGGs/J1f4pGdPuiKsQUhq0rsUFc0rWZXupODr8FRAJ5RVHvIQ4z5t/2lrw3UMhYBrl",
                    "appName": "monkeyVPN" 
            };

		var deferred = $q.defer();

        if (ionic.Platform.isIOS()) {
            // on iOS the VPN Plugin needs to call .provision first to setup the VPN profile
            // TODO actually the first .enable after calling this fails, probably too quick, so have to change logic for ios a bit
            window.plugins.VPNManager.provision(
                function(result){
                    console.log("provisionVPN result ", result);
                    enableVPN(deferred,vpnConfig);
                },
                function(error){
                    console.log("provisionVPN error ", error);
                    
                },
                vpnConfig
            );
        } else {
            // on Android its not required to call .provision and can just call the VPN Plugins .enable function directly
            enableVPN(deferred,vpnConfig);
        };


		return deferred.promise;
    }

    function enableVPN(deferred, vpnConfig) {
         window.plugins.VPNManager.enable(
                    function(result){
                        console.log("connectVPN result ", result);
                        deferred.resolve(result);
                    },
                    function(error){
                        console.log("connectVPN error ", error);
                        deferred.reject(error);
                    },
                    vpnConfig
                );


    }

	function status(){
		window.plugins.VPNManager.status(function(result){
                console.log("status result ", result);
            },
            function(error){
				console.log("status error ", error);
                alert(error);
            });
	}

	function registerCallback(){
        if (window.plugins && window.plugins.VPNManager) {
            window.plugins.VPNManager.registerCallback(function(result){
                    console.log("callback result ", result);
                    if (result=="CONNECTING") {
                        if (ionic.Platform.isIOS()) {
                            // on iOS we never get a CONNECTED event, so as soon as CONNECTING happens we assume its connected, TODO: probably have to check another way if it really connected or not
                            $ionicLoading.hide();
                            $state.transitionTo("app.homepageconnected");
                        } else {
                            $ionicLoading.show({
                                content: 'Loading',
                                animation: 'fade-in',
                                showBackdrop: true,
                                maxWidth: 200,
                                showDelay: 0
                            });
                        }
                    } else if (result=="CONNECTED") {
                        databaseService.getIP().then(function (data) {
                            //$rootScope.currentIP = data;
                            $rootScope.ipInfo = {
                                ip: data.data.query,
                                countryCode: data.data.countryCode,
                                city: data.data.city,
                            };
                        });
                        $ionicLoading.hide();
                        $state.transitionTo("app.homepageconnected");
                    }else if ( result=="DISCONNECTED"){
                        $state.transitionTo("app.homenotconnected");
                    } else {
                        $ionicLoading.hide();
                    }
                },
                function(error){
                    $ionicPopup.alert({
                        title: 'Error',
                        template: error,
                        cssClass: 'alertPopup'
                    });
                    $ionicLoading.hide();
                    console.log("callback error ", error);
                });
        }
	}

	function disconnect(){
		var deferred = $q.defer();
        window.plugins.VPNManager.disable(
		    function(result){
                console.log("disconnect result ", result);
				deferred.resolve(result);
            },
            function(error){
				console.log("disconnect error ", error);
				deferred.reject(error);
            },
            {} //options
        );
		return deferred.promise;
    }

    return {
        connectVPN: connectVPN,
		status: status,
		registerCallback: registerCallback,
		disconnect: disconnect
    }
})
    .factory('AuthService', function($localStorage){
        return{
            user: {},
            setUser : function(aUser, callback){
                angular.copy(aUser, this.user);
                $localStorage.current_user = aUser;
                callback(this.user);
            },
            isLoggedIn : function(){
                return(this.user)? this.user : false;
            },
            logOut : function(callback){
                angular.copy({}, this.user);
                delete $localStorage.current_user;
                callback(this.user);
            }
        }

    });
