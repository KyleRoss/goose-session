var express = require('express'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    gooseSession = require('goose-session'),
    mongo = require('./mongo.js')(),
    app = express();


// Add cookie parser middleware (needed for sessions)
app.use(cookieParser());

// Add express-session middleware
app.use(session({
    // Tell express-session to use goose-session as the store
    store: gooseSession(mongo.mongoose, {
        // goose-session options...
        collection: 'sessions',
        expireAfter: '3d'
    }),
    
    // express-session configuration
    secret: 'mySecretKey',
    name: 'app.session',
    resave: true,
    rolling: true,
    saveUninitialized: false,
    unset: 'destroy'
}));

/*
This middleware will update a property inside the session that will force MongoDB to update 
the TTL on the session document. Without this, the document is still resaved, but without
any changes, Mongo will not reset the expiration (TTL). If your application is updating a
property every request in `req.session`, then this is not needed.
 */
app.use(function updateSession(req, res, next) {
    // Set _touch in the session to the current date to force update the session
    req.session._touch = Date.now();
    next();
});

// ... routes ...

// Start the server
app.listen(3000, function() {
    console.log('Server listening on port 3000');
});
