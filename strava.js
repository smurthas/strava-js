var request = require('request');
var querystring = require('querystring');

var apiBase = 'https://www.strava.com/api/v1';

var auth;
exports.init = function(_auth) {
    auth = _auth;
}

exports.getToken = function(email, password, callback) {
    request.post({uri:apiBase + '/authentication/login',
                  body:'email=' + email + '&password=' + password},
                  // json: true},
      function(err, resp, body) {
          if(err || resp.statusCode !== 200) return callback(err, body, resp);
          return callback(null, JSON.parse(body));
      });
}

exports.apiCall = function(path, params, callback) {
    if(!callback && typeof params === 'function') {
        callback = params;
        params = undefined;
    }
    if(!params) params = '';
    else params = '?' + querystring.stringify(params);
    
    request.get({uri:apiBase + path + params, json: true}, function(err, resp, json) {
        if(err || resp.statusCode !== 200) return callback(err, json, resp);
        return callback(null, json);
    });
}