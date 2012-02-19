var strava = require('./strava');

strava.getToken(process.argv[2], process.argv[3], function(err,resp, auth) {
    if(err) console.error("err:", err);
    console.error("auth", auth);
    strava.init(auth);
    strava.getRidesWithDetails({}, function(err, resp, rides) {
        if(err) console.error("err:", err);
        console.error("rides:", rides);
    })
});