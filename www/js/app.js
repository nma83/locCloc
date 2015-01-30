// Ionic Starter App

// Google auth
var google_secrets = {"web":{"auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://accounts.google.com/o/oauth2/token","client_email":"330729095383-52sipta7q9em9k4ssheubuad9obgffvf@developer.gserviceaccount.com","redirect_uris":["http://localhost/login","https://nodejs-nma83.rhcloud.com/login"],"client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/330729095383-52sipta7q9em9k4ssheubuad9obgffvf@developer.gserviceaccount.com","client_id":"330729095383-52sipta7q9em9k4ssheubuad9obgffvf.apps.googleusercontent.com","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs"}};

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular
    .module('starter', ['ionic'])
    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if(window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            
            if(window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
    })
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }])
    .controller('AuthCtrl', function($scope, $http) {
        // Get cookie first
        var server_url = google_secrets.web.redirect_uris[0];
        var cookie = null;
        // Test server
        server_url = 'http://localhost:8080/login';
//        server_url = 'https://nodejs-nma83.rhcloud.com/login';
        
        // Real server
        console.log(server_url);
        $scope.google_auth_url = '#';
        var cookieReq = function() {
        };

        $scope.authPopup = function() {
            console.log('Requesting: %s', server_url);
            $http.get(server_url)
                .success(function(data, status, headers, config) {
                    cookie = data.session_state;
                    // Create URL
                    $scope.google_auth_url = google_secrets.web.auth_uri + '?' +
                        'client_id=' + google_secrets.web.client_id + '&' +
                        'response_type=code&' +
                        'scope=https://www.googleapis.com/auth/plus.login&' +
                        'redirect_uri=' + server_url + '&' +
                        'state=' + cookie + '&' +
                        'login_hint=sub', '_blank';
                    console.log('Created URL ', $scope.google_auth_url);
                    var ref = window.open($scope.google_auth_url, '_blank', 'location=no');
                    ref.addEventListener('loadstop', function (event) {
                        console.log('win ' + event.url);
                        ref.close();
                    });
                })
                .error(function(data, status, headers, config) {
                    console.log('Error getting cookie!', JSON.stringify(status));
                });
        };
    });
