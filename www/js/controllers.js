// Controllers for all things
// Have to break up once it blows up

// Google auth
var google_secrets = {"web":{"auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://accounts.google.com/o/oauth2/token","client_email":"330729095383-52sipta7q9em9k4ssheubuad9obgffvf@developer.gserviceaccount.com","redirect_uris":["http://localhost/login","https://nodejs-nma83.rhcloud.com/login"],"client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/330729095383-52sipta7q9em9k4ssheubuad9obgffvf@developer.gserviceaccount.com","client_id":"330729095383-52sipta7q9em9k4ssheubuad9obgffvf.apps.googleusercontent.com","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs"}};
var server_url = google_secrets.web.redirect_uris[0];
var device_ready = false;

angular.module('loccloc.controllers', ['ionic.utils'])
    .controller('AuthCtrl', function($scope, $ionicModal, $http, $localstorage, $state) {
        // Get cookie first
        var cookie = null;
        // Test server
        server_url = 'http://localhost:8080';
        server_url = 'https://nodejs-nma83.rhcloud.com';
        server_url = 'http://androidemu.net:8080';
        console.log(server_url);

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });

        // Label
        if ($localstorage.get('google_profile', '') === '') {
            $scope.LoginLogout = 'Login';
            $scope.loggedin = false;
        } else {
            $scope.LoginLogout = 'Logout';
            $scope.loggedin = true;
        }
        
        // Triggered in the login modal to close it
        $scope.closeLogin = function() {
            $scope.modal.hide();
        };

        // Open the login modal
        $scope.loginlogout = function() {
            $scope.iagree_checked = false;
            if ($localstorage.get('google_profile', '') === '') {
                // Login
                $scope.modal.show();
            } else {
                $localstorage.set('google_profile', '');
                $scope.LoginLogout = 'Login';
                $scope.loggedin = false;
            }
        };

        $scope.authPopup = function() {
            console.log('Requesting: ' + server_url);
            var loc_server = server_url + '/login';
            $http.get(loc_server)
                .success(function(data, status, headers, config) {
                    cookie = data.session_state;
                    $localstorage.set('session', cookie);
                    // Create URL
                    google_auth_url = google_secrets.web.auth_uri + '?' +
                        'client_id=' + google_secrets.web.client_id + '&' +
                        'response_type=code&' +
                        'scope=https://www.googleapis.com/auth/plus.login&' +
                        'redirect_uri=' + loc_server + '&' +
                        'state=' + cookie + '&' +
                        'login_hint=sub', '_blank';
                    console.log('Created URL ' + google_auth_url);

                    var ref = window.open(google_auth_url, '_blank', 'location=no');
                    ref.addEventListener('loadstop', function (event) {
                        console.log('url ' + event.url);

                        if (event.url.match(RegExp('^' + loc_server, 'g'))) {
                            ref.executeScript({
                                code: 'document.getElementById("user_data").innerHTML'
                            }, function(val) {
                                ref.close();
                                var google_profile = val[0];
                                console.log('returned is ' + typeof(google_profile));
                                // Profile is a string
                                $localstorage.set('google_profile', google_profile);
                                $scope.LoginLogout = 'Logout';
                                $scope.loggedin = true;
                            });

                            $scope.closeLogin();
                        }
                    });
                })
                .error(function(data, status, headers, config) {
                    console.log('Error getting cookie! ' + JSON.stringify(status));
                    $scope.status_text = 'Error getting cookie!';
                });
        };
    })

// Show friend location
    .controller('ShowCtrl', function($scope, $stateParams) {
    })

// Friends screen
    .controller('FriendsCtrl', ['$scope', '$ionicLoading', '$localstorage', '$http', function($scope, $ionicLoading, $localstorage, $http) {
        // Get full profile from storage
        var google_profile = $localstorage.getObject('google_profile');
        var friend_list = $localstorage.getObject('friend_list');

        // Fetch friend list once logged in
        $scope.fetchFriends = function(id) {
            var loc_server = server_url + '/view';
            console.log('Fetching friends:' + loc_server);
            return $http.get(loc_server, { params: { n: id } });
        }

        // Mark modified
        $scope.friend_list_modified = false;
        $scope.listModified = function() {
            $scope.friend_list_modified = true;
        }

        if (friend_list.hasOwnProperty('size')) {
            $scope.friends = friend_list.friends;
        } else {
            // Show the loading overlay and text
            $scope.loading = $ionicLoading.show({
                // The text to display in the loading indicator
                content: 'Loading friends',
                // The animation to use
                animation: 'fade-in',
                // Will a dark overlay or backdrop cover the entire view
                showBackdrop: true,
                // The maximum width of the loading indicator
                // Text will be wrapped if longer than maxWidth
                maxWidth: 200,
                // The delay in showing the indicator
                showDelay: 100
            });
            
            $scope.fetchFriends(google_profile.user_profile['id'])
                .success(function(data, status, headers, config) {
                    var friends_obj = JSON.parse(data.friends);
                    console.log('friends: ' + JSON.stringify(data));
                    friend_list.friends = [];

                    for (var fid in friends_obj) {
                        friends_obj[fid].id = fid; // Back refer from UI
                        friend_list.friends.push(friends_obj[fid]);
//                        console.log('pushed ' + friends_obj[fid]);
                    }
                    friend_list.size = friend_list.friends.length;
                    $scope.loading.hide();

                    $scope.friends = friend_list.friends;
                    $localstorage.setObject('friend_list', friend_list);
//                    $scope.LoadStatus = 'Friend list load done!';
                })
                .error(function(data, status, headers, config) {
                    $scope.loading.hide();
                    $scope.LoadStatus = 'Friend list load failed!';
                });
        }

        // Store back
        $scope.applyShares = function() {
            var loc_server = server_url + '/frn';
            var friends_obj = { };
            var state = $localstorage.get('session');
            
            friend_list.friends.forEach(function(element, index, array) {
                friends_obj[element.id] = {
                    name: element.name,
                    share: element.share
                };
            });

            // Save local
            $localstorage.setObject('friend_list', friend_list);
            // Send to server
            $http.put(loc_server, JSON.stringify(friends_obj),
                      { params: { n: google_profile.user_profile['id'],
                                  s: state } })
                .success(function(data, status, headers, config) {
                    $scope.friend_list_modified = false;
                    console.log('list saved');
                })
                .error(function(data, status, headers, config) {
                    console.log('save failed');
                });
        }
        
        // Set name in header
        $scope.UserName = google_profile.user_profile['displayName'];
        $scope.UserPic = google_profile.user_profile.image.url;
    }]);
