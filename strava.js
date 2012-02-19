var request = require('request');
var async = require('async');
var querystring = require('querystring');

var apiBase = 'https://www.strava.com/api';

var vs = {
  '/rides': 'v1',
  '/segments': 'v1'
}

function v(path) {
  return vs[path] || 'v2';
}

var auth;
exports.init = function(_auth) {
  auth = _auth;
}

exports.getToken = function(email, password, callback) {
  request.post({uri:apiBase+ '/v2/authentication/login',
                body:'email=' + email + '&password=' + password},
                // json: true},
  function(err, resp, body) {
    try {
      body = JSON.parse(body);
    } catch(err) {}
    return callback(err, resp, body);
  });
}

exports.apiCall = function(path, params, callback) {
  if(!callback && typeof params === 'function') {
    callback = params;
    params = undefined;
  }
  if(!params) params = '';
  else params = '?' + querystring.stringify(params);
  request.get({uri:apiBase + path + params, json: true}, callback);
}


exports.getRide = function(id, callback) {
  exports.apiCall('/v1/rides/' + id, function(err, resp, json) {
    if(err || resp.statusCode !== 200 || !json.ride) return callback(err, resp, json);
    return callback(undefined, resp, json.ride);
  });
}

exports.getRideWithDetails = function(id, callback) {
  var errs = {};
  exports.getRide(id, function(err, resp, ride) {
    errs.ride = err;
    if(err || resp.statusCode !== 200 || !ride) return callback(errs, resps, ride);
    exports.getEffortsWithDetails(id, function(err, efforts) {
      errs.efforts = err;
      if(err || !efforts) return callback(errs, resp, efforts);
      ride.efforts = efforts;
      return callback(undefined, resp, ride);
    })
  })
}

exports.getEffort = function(effortId, callback) {
  exports.apiCall('/v1/efforts/' + effortId, function(err, resp, json) {
    if(err || resp.statusCode !== 200 || !json.effort) return callback(err, resp, json);
    return callback(undefined, resp, json.effort);
  });
}

exports.getEfforts = function(rideId, callback) {
  exports.apiCall('/v1/rides/' + rideId + '/efforts', function(err, resp, json) {
    if(err || resp.statusCode !== 200 || !json.efforts) return callback(err, resp, json);
    return callback(undefined, resp, json.efforts);
  });
}

exports.getEffortsWithDetails = function(rideId, callback) {
  exports.getEfforts(rideId, function(err, resp, efforts) {
    if(err || resp.statusCode !== 200) return callback(err, resp, efforts);
    var effortsWithDetails = [];
    var errors = [];
    async.forEachSeries(efforts, function(effort, next) {
      exports.getEffort(effort.id, function(err, resp, effort) {
        if (err || resp.statusCode !== 200) errors.push({err:err, statusCode: resp.statusCpde, body:effort});
        else effortsWithDetails.push(effort);
        next();
      });
    }, function(err) {
      if(err) errors.push(err);
      if(errors.length > 0) return callback(errors, effortsWithDetails);
      return callback(undefined, effortsWithDetails);
    });
  });
}

exports.getRides = function(params, callback) {
  if (!callback && typeof params === 'function') {
    callback = params;
    params = {};
  }
  if(!params.athleteId) params.athleteId = auth.athlete.id;
  exports.apiCall('/v1/rides', params, function(err, resp, json) {
    if(!err && json.rides) json = json.rides;
    callback(err, resp, json);
  });
}

exports.getRidesWithDetails = function(params, callback) {
  exports.getRides(params, function(err, resp, rides) {
    if(err || resp.statusCode !== 200) return callback(err, resp, rides);
    var ridesWithDetails = [];
    var errors = [];
    async.forEachSeries(rides, function(ride, next) {
      exports.getRideWithDetails(ride.id, function(errs, resps, rideDetails) {
        if(err || resp.statusCode !== 200 || !rideDetails) errors.push({err:err, statusCode: resp.statusCode, body:rideDetails});
        else ridesWithDetails.push(rideDetails);
        return next();
      });
    }, function(err) {
      if(err) errors.push(err);
      if(errors.length > 0) return callback(errors, ridesWithDetails);
      return callback(undefined, ridesWithDetails);
    });
  });
}