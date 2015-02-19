// Controllers for all things
// Have to break up once it blows up

// Google auth
var google_secrets = {"web":{"auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://accounts.google.com/o/oauth2/token","client_email":"330729095383-52sipta7q9em9k4ssheubuad9obgffvf@developer.gserviceaccount.com","redirect_uris":["http://localhost/login","https://nodejs-nma83.rhcloud.com/login"],"client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/330729095383-52sipta7q9em9k4ssheubuad9obgffvf@developer.gserviceaccount.com","client_id":"330729095383-52sipta7q9em9k4ssheubuad9obgffvf.apps.googleusercontent.com","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs"}};
var device_ready = false;

angular.module('loccloc.controllers', ['ionic.utils'])
    .controller('AuthCtrl', function($scope, config, $ionicModal, $http, $localstorage, $state, $window, appState, $ionicHistory) {
        // Get cookie first
        var cookie = null;
        // Test server
        var server_url = config.server_url;
        console.log(server_url);

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });

        // Label
        if ($localstorage.get('loggedin', false)) {
            $scope.LoginLogout = 'Logout';
            $scope.loggedin = true;
            appState.loggedin = true;
        } else {
            $scope.LoginLogout = 'Login';
            $scope.loggedin = false;
            appState.loggedin = false;
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
                $localstorage.set('loggedin', false);
                $scope.LoginLogout = 'Login';
                $scope.loggedin = false;
                appState.loggedin = false;

                // Go to splash
                $ionicHistory.nextViewOptions({
                    disableAnimate: true,
                    disableBack: true
                });
                $state.go('app.splash', {}, {reload: true});
            }
        };

        $scope.authPopup = function() {
            var loc_server = config.server_url + '/login';
            // Create URL
            google_auth_url = google_secrets.web.auth_uri + '?' +
                'client_id=' + google_secrets.web.client_id + '&' +
                'response_type=code&' +
                'scope=https://www.googleapis.com/auth/plus.login&' +
                'redirect_uri=' + loc_server + '&' +
                'state=' + cookie + '&' +
                'approval_prompt=force&' +
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
                        $localstorage.set('loggedin', true);
                        $scope.LoginLogout = 'Logout';
                        $scope.loggedin = true;
                        appState.loggedin = true;
                        // store token
                        $window.sessionStorage.token = JSON.parse(google_profile).token;
                        console.log('storing token ' + $window.sessionStorage.token);
                        $localstorage.set('token', $window.sessionStorage.token);

                        $ionicHistory.nextViewOptions({
                            disableAnimate: true,
                            disableBack: true
                        });

                        $state.go('app.show', {}, {reload: true});
                    });

                    $scope.closeLogin();
                }
            });
        };
    })
// Splash screen
    .controller('SplashCtrl', function($scope, $state, $localstorage, $ionicHistory) {
        $scope.loggedin = true;
        $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
        });
        if ($localstorage.get('loggedin', false))
            $state.go('app.show', {}, {reload: true});
        else
            $scope.loggedin = false;
    })
// Show friend location and startup reporting
    .controller('ShowCtrl', function($scope, config, $stateParams, $localstorage, $http, geoLocation, socket, appState) {
        // Get full profile from storage
        var google_profile = $localstorage.getObject('google_profile');
        var loc_save_done = false;
        var loggedin = $localstorage.get('loggedin', false) &&
            google_profile.hasOwnProperty('user_profile');
        // Assume friend list has been loaded
        var friend_list = $localstorage.getObject('friend_list');
        var recvd_locs = { };

        $scope.loggedin = loggedin;
        $scope.places = ['Home', 'Work'];
        
        if (loggedin) {
            var none = '- None -';
            // Set name in header
            $scope.UserName = google_profile.user_profile['displayName'];
            $scope.UserPic = google_profile.user_profile.image.url;
            if (friend_list.hasOwnProperty('friends')) {
                $scope.friends = friend_list.friends.filter(function(elem, index, arr) {
                    return elem.share;
                });
                if ($scope.friends.length > 0)
                    $scope.sel_friend = $scope.friends[0];
                else
                    $scope.sel_friend = [none];
            } else {
                $scope.friends = [none];
            }
            $scope.FriendLoc = '';
            $scope.from_place = 'Home'; $scope.to_place = 'Work';
        } else {
            console.log('nothing to show, storage corrupt');
            $scope.UserName = 'Error! Please logout and try again';
        }
        
        // Send location to server
        $scope.storeLoc = function(id, loc) {
            var loc_server = config.server_url + '/loc';
            var state = $localstorage.get('session');
            
            // Send to server
            console.log('storing to ' + loc_server);
            return $http.put(loc_server, JSON.stringify(loc),
                             { params: { n: google_profile.user_profile['id'],
                                         s: state } });
        };

        // Store location of others
        $scope.updateLoc = function(data) {
            var lat = data.latitude,
                lng = data.longitude;
            var lat_str, lng_str;
            console.log('updating for ' + data.userid + '=' + lat + ':' + lng);
            recvd_locs[data.userid] = [lat, lng];
            
            if (lat < 0)
                lat_str = 'S';
            else
                lat_str = 'N';
            if (lng < 0)
                lng_str = 'W';
            else
                lng_str = 'E';

            $scope.FriendLoc = '' + lat + lat_str + ', ' + lng + lng_str;
        };

        if (loggedin) {
            geoLocation.setCallback(function(nloc) {
                var prevLoc = geoLocation.getGeolocation();
                $scope.CurrentLoc = JSON.stringify(nloc);
                $scope.$apply();
                // Check if required to store
                if (!prevLoc.hasOwnProperty('latitude') || !loc_save_done ||
                    geoLocation.canStore(prevLoc, nloc)) {
                    $scope.storeLoc(google_profile.user_profile['id'], nloc)
                        .success(function(data, status, headers, config) {
                            console.log('loc saved');
                            loc_save_done = true;
                        })
                        .error(function(data, status, headers, config) {
                            console.log('loc save failed');
                            loc_save_done = false;
                        });
                }
            });

            // Receive locations from server
            socket.connect(config.server_url, $localstorage.get('token', ''),
                           google_profile.user_profile['id']);
            socket.on('location', $scope.updateLoc);

            $scope.$on('$destroy', function() {
                console.log('going bye..');
            });
        }
    })

// Friends screen
    .controller('FriendsCtrl', ['$scope', 'config', '$ionicLoading', '$localstorage', '$http', function($scope, config, $ionicLoading, $localstorage, $http) {
        // Get full profile from storage
        var google_profile = $localstorage.getObject('google_profile');
        var friend_list = $localstorage.getObject('friend_list');

        // Fetch friend list once logged in
        $scope.fetchFriends = function(id) {
            var loc_server = config.server_url + '/view';
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
                content: 'Loading friends',
                animation: 'fade-in',
                showBackdrop: true
            });
            
            $scope.fetchFriends(google_profile.user_profile['id'])
                .success(function(data, status, headers, config) {
                    var friends_obj = JSON.parse(data.friends);
                    //console.log('friends: ' + JSON.stringify(data));
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
            var loc_server = config.server_url + '/frn';
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
