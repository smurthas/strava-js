var strava = require('./strava');

strava.getToken(process.argv[2], process.argv[3], function(err, auth) {
    if(err) console.error("err:", err);
    console.error("auth", auth);
    strava.apiCall('/rides', {athleteId: auth.athlete_id}, function(err, rides) {
        if(err) console.error("err:", err);
        console.error("rides:", rides);
    })
});