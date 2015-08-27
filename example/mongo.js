var mongoose = require('mongoose');

module.exports = function() {
    // Set an error handler
    mongoose.connection.on('error', function(err) {
        console.error('MongoDB Error:', err);
    });
    
    // Set a disconnected handler
    mongoose.connection.on('disconnected', function() {
        console.warn('Disconnected from MongoDB, attempting to reconnect...');
        
        process.nextTick(function() {
            connect();
        });
    });
    
    // Set an open handler
    mongoose.connection.on('open', function onMongoConnectionOpen() {
        console.log('Connected to MongoDB successfully.');
    });
    
    
    function connect() {
        // Connect to Mongo
        mongoose.connect('mongodb://localhost:27017/app', {
            user: 'mongoUser',
            pass: 'mongoPass',
            server: {
                // Good idea to keep the connection alive
                socketOptions: { keepAlive: 1 }
            }
        });
    }
    
    // Automatically connect to MongoDB
    connect();
    
    return {
        connect: connect,
        mongoose: mongoose
    };
};


