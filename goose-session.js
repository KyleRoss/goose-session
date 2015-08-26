var Store = require('express-session').Store,
    util = require('util');
    
var GooseSession = function(mongoose, options) {
    var assign = require('lodash.assign'),
        ms = require('ms');
        
    this.mongoose = mongoose;
    var opts = this.options = assign({
        schema: null,
        model: null,
        collection: 'sessions',
        expireAfter: '6h',
        sessionKey: 'session'
    }, options || {});
    
    if(typeof opts.expireAfter === 'string') opts.expireAfter = ms(opts.expireAfter);
    
    if(!opts.schema) {
        opts.schema = new mongoose.Schema({
            _id: String,
            session: mongoose.Schema.Types.Mixed,
            expires: {
                type: Date,
                expires: (opts.expireAfter / 1000)
            }
        });
    }
    
    if(!opts.model) opts.model = mongoose.model(opts.collection, opts.schema);
    
    function defaultCallback(cb) {
        return cb || function(err) {
            if(err) console.error(err);
        };
    }
    
    this.get = function(sid, cb) {
        var self = this;
        cb = defaultCallback(cb);
        
        opts.model.findOne({ _id: sid }).exec(function(err, res) {
            if(err || !res) return cb(err);
            if(!res.expires || new Date < res.expires) return cb(null, res[opts.sessionKey]);
            
            return self.destroy(sid, cb);
        });
    };
    
    this.set = function(sid, session, cb) {
        var s = { session: session };
        cb = defaultCallback(cb);
        
        s.expires = (session && session.cookie && session.cookie._expires)?
                        new Date(session.cookie._expires) : new Date(Date.now() + opts.expireAfter);
    
        opts.model.update({ _id: sid }, s, { upsert: true }, function(err) {
            cb(err);
        });
    };
    
    this.destroy = function(sid, cb) {
        cb = defaultCallback(cb);
        
        opts.model.remove({ _id: sid }).exec(function(err) {
            cb(err);
        });
    };
    this.length = function(cb) {
        cb = defaultCallback(cb);
        
        opts.model.find().exec(function(err, res) {
            if(err) return cb(err, Array.isArray(res)? res.length : null);
        });
    };
    this.clear = function(cb) {
        cb = defaultCallback(cb);
        
        opts.model.remove().exec(function(err) {
            cb(err);
        });
    };
};

util.inherits(GooseSession, Store);

module.exports = function(mongoose, options) {
    return new GooseSession(mongoose, options);
};
