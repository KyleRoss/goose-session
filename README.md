# goose-session
A lightweight [Express 4.x](http://expressjs.com/) Session Store using the [Mongoose ODM](http://mongoosejs.com/). This session store takes a pre-existing connection using Mongoose and uses that for the session store instead of opening a new connection. It provides an easy way to store sessions in MongoDB without flooding connections along with allowing full configuration over your connection and error handling.

_Why reconnect to the same database twice?_

**goose-session vs. the others**

| Feature                                                      | goose-session      | the others
| ------------------------------------------------------------ | ------------------ | ------------
| Use your pre-existing Mongoose connection                    | :white_check_mark: | :x:
| Use your own Mongoose connection error handling/reconnection | :white_check_mark: | :x: (some have config properties)
| Provide full Mongoose configuration for the connection       | :white_check_mark: | :x:
| Switch between Mongo replica sets and single connections     | :white_check_mark: | :x: (usually requires separate modules)
| Full control over Mongoose Schema and Model                  | :white_check_mark: | :x:
| Express 3.x and 4.x support                                  | :white_check_mark: | :white_check_mark: (depends on module)
| Requires Mongoose as a dependency                            | :x:                | :white_check_mark:
| Handles connecting to different servers/databases*           | :x:                | :white_check_mark:

<small><em>* - Since goose-session uses your mongoose connection to store sessions, you cannot disconnect and connect to other databases/servers otherwise all initialized sessions will no longer exist in the new database. If you are connecting to different servers/databases within your app, you would either need to create a new separate mongoose connection instance or use one of the alternative modules out there that creates it's own connection.</em></small>

## Install
Install via npm:

    npm install goose-session --save

You should have already installed the following dependencies to your application:

    npm install express express-session --save


## Full Example

    var express = require('express'),
        session = require('express-session'),
        gooseSession = require('goose-session'),
        mongoose = require('mongoose'),
        app = express();
    
    // Set an error handler
    mongoose.connection.on('error', function(err) {
        console.error('MongoDB Error:', err);
    });
    
    // Connect to Mongo
    mongoose.connect('mongodb://localhost:27017/app', {
        user: 'mongoUser',
        pass: 'mongoPass',
        server: {
            // Good idea to keep the connection alive
            socketOptions: { keepAlive: 1 }
        }
    });
    
    // Add express-session middleware
    app.use(session({
        // Tell express-session to use goose-session as the store
        store: gooseSession(mongoose, {
            // goose-session options...
            collection: 'sessions',
            expireAfter: '3d'
        }),
        
        // express-session configuration
        secret: 'mySecretKey',
        name: 'app.session',
        rolling: true,
        saveUninitialized: false,
        unset: 'destroy'
    }));
    
    // Start the server
    app.listen(3000, function() {
        console.log('Server listening on port 3000');
    });
    
    
This example shows a very basic express application with a MongoDB connection. We start out by creating an error event handler for Mongoose to handle errors when they happen. You would typically have other event handlers also like `disconnected` and `open`, it just all depends on what you need for your application. Remember that this MongoDB connection is for your app too, not just the sessions, so you should have whatever you need for your application; there is nothing special needed for goose-session.

After creating the connection using `mongoose.connect(...)`, we will add a piece of Express middleware that uses [express-session](https://github.com/expressjs/session). Inside the configuration for express-session, we tell it to use `gooseSession` as the store (or storage system) for the sessions. We provide the `mongoose` instance as the first argument and an optional options object as the second _(available options are listed below)_. After `store`, we also provide some additional configuration options to express-session which is outlined in their [documentation](https://github.com/expressjs/session). These options are not required for goose-session, but there are a couple that is required by express-session. It's also a good idea to set the following express-session options:

* `rolling: true` - Forces the cookie to be set by the browser on every response in order for the expiration date to be updated.
* `saveUninitialized: false` - If your sessions are authentication-based, you can set this property to false to prevent "empty" sessions from being saved to the store.
* `unset: 'destroy'` - Tells express-session that when the session is nulled or deleted, it should also be removed from the store.

Lastly, we start the express server on port `3000`.

## Usage
Require `goose-session` and `express-session`:

    var gooseSession = require('goose-session'),
        session = require('express-session');

Add express-session middleware with the `store` set to goose-session:

    app.use(session({
        store: gooseSession(mongoose, { ... }),
        ...
    }));

---

### GooseSession(mongoose[, options])
The goose-session constructor that provides all the required methods to express-session for storing sessions.

*Arguments*

| Required? | Argument | Type         | Description
| --------- | -------- | ------------ | ------------------------------------------
| Yes       | mongoose | _Mongoose()_ | The mongoose instance `require('mongoose')`.
| No        | options  | Object       | Optional configuration for goose-session. See _options_ below.

---

### Options
The following configuration options are available:

#### schema
_Object | Mongoose.Schema_<br>
The schema to use for the session. You can either pass an object in the format that Mongoose.Schema uses or a created Mongoose.Schema object.

Default:

    new mongoose.Schema({
        session: mongoose.Schema.Types.Mixed,
        expires: { type: Date, expires: this.options.expireAfter }
    });

NOTE: If you are using your own schema and use a different key name than `session`, you need to set `options.sessionKey` also.

#### model
_Mongoose.model_<br>
A custom model that has already been initialized. If `model` is provided, then `schema` is ignored.

Default:

    mongoose.model(this.options.collection, sessionSchema);

#### collection
_String_<br>
The name of the collection to store sessions in. Ignored if `model` is provided. Default is `sessions`.

#### expireAfter
_Number | String_<br>
The time in milliseconds (number) or string formatted using the [ms module](https://www.npmjs.com/package/ms) that the session should expire when there is no activity. Default is `6h` (6 hours).

#### sessionKey
_String_<br>
The name of the key that stores session information inside the `schema`. Only needed if you are using your own schema with a different key to store session information. Default is `session`.

## Issues
Found a bug? Have an enhancement? Create a new issue. I will try to get it fixed as soon as possible.

## Contributing
Want to contribute to the project? Fork and submit a pull request.

## License
Licensed under the MIT license. See LICENSE in the repository for more information.
