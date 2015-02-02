// Helper services

angular.module('ionic.utils', [])

    .factory('$localstorage', ['$window', function($window) {
        return {
            set: function(key, value) {
                $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        }
    }])

    .factory('geoLocation', ['$localstorage', function ($localstorage) {
        var callback = null;

        // distance calc
        var toRad = function(deg) {
            return deg * Math.PI / 180;
        };
        
        var haversineDist = function(pos1, pos2) {
            var lat1 = pos1.latitude,
                lon1 = pos1.longitude,
                lat2 = pos2.latitude,
                lon2 = pos2.longitude;
            var R = 6371000; // m
            var x1 = lat2-lat1;
            var dLat = toRad(x1);
            var x2 = lon2-lon1;
            var dLon = toRad(x2);  
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);  
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            var d = R * c;

            return d;
        };
        
        return {
            setGeolocation: function (latitude, longitude) {
                var _position = {
                    latitude: latitude,
                    longitude: longitude
                }
                if (callback) callback(_position);
                
                $localstorage.setObject('geoLocation', _position)
            },
            setCallback: function(cb) {
                callback = cb;
            },
            getGeolocation: function () {
                return $localstorage.getObject('geoLocation');
            },
            clearLocation: function() {
                $localstorage.setObject('geoLocation', {});
            },
            setWatch: function(watch) {
                $localstorage.set('geoWatch', watch);
            },
            canStore: function(oldpos, newpos) {
                if (haversineDist(oldpos, newpos) > 500)
                    return true; // 500m threshold
                else
                    return false;
            }
        }
    }]);
