// Ionic Starter App

// Google auth
var google_secrets = {"web":{"auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://accounts.google.com/o/oauth2/token","client_email":"330729095383-52sipta7q9em9k4ssheubuad9obgffvf@developer.gserviceaccount.com","redirect_uris":["http://localhost/login","https://nodejs-nma83.rhcloud.com/login"],"client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/330729095383-52sipta7q9em9k4ssheubuad9obgffvf@developer.gserviceaccount.com","client_id":"330729095383-52sipta7q9em9k4ssheubuad9obgffvf.apps.googleusercontent.com","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs"}};

var device_ready = false;

// angular.module is a global place for creating, registering and retrieving Angular modules
angular
    .module('loccloc', ['ionic', 'loccloc.controllers'])
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

            device_ready = true;
        });
    })
    .config(['$httpProvider', '$urlRouterProvider', '$stateProvider', function(
        $httpProvider, $urlRouterProvider, $stateProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];

        $stateProvider
            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AuthCtrl'
            })
            .state('app.show', {
                url: '/show',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/show.html',
                        controller: 'ShowCtrl'
                    }
                }
            })
            .state('app.friends', {
                url: '/friends',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/friends.html',
                        controller: 'FriendsCtrl'
                    }
                }
            });

        // Splash screen
        $urlRouterProvider.otherwise('/app/show');
    }])
