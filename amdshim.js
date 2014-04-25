var amdShim = {};
(function (undef) {
    var require, define, g = this;

    /*
     * A compact version of Promise
     */
    var Promise = (function(){
        var PROTOTYPE = 'prototype', FUNCTION = 'function', RESOLVED = 'resolved', REJECTED = 'rejected';
        function Promise() {
            this._s = [];
            this._f = [];
        }
        Promise[PROTOTYPE].then = function(onSuccess, onFailure) {
            var p = new Promise();
            var me = this;

            if (typeof onSuccess == FUNCTION){
                var handleSuccess = function () {
                    var res = onSuccess.apply(me, arguments);
                    if (res && typeof res.then === FUNCTION){
                        res.then(function(){
                            p.resolve.apply(p, arguments);
                        });
                    }
                    else{
                        p.resolve.apply(p, (res == null ? [] : [res]));
                    }
                };

                if (me[RESOLVED]) {
                    handleSuccess.call(null, me.result);
                } else {
                    me._s.push(handleSuccess);
                }
            }

            if (typeof onFailure == FUNCTION){
                var handleFail = function () {
                    var res = onFailure.apply(me, arguments);
                    if (res && typeof res.then === FUNCTION){
                        res.then(function(){
                            p.resolve.apply(p, arguments);
                        });
                    }
                    else{
                        p.resolve.apply(p, (res == null ? [] : [res]));
                    }
                };

                if (me[REJECTED]) {
                    handleFail.call(null, me.error);
                } else {
                    me._f.push(handleFail);
                }
            }
            
            return p;
        };

        Promise[PROTOTYPE].resolve = function() {
            var me = this;

            me.result = arguments[0];
            
            if (me[REJECTED]){
                return;
            }

            me[RESOLVED] = true;
            for (var i = 0; i < me._s.length; i++) {
                me._s[i].call(null, me.result);
            }
            me._s = [];
        };
        Promise[PROTOTYPE].reject = function(){
            var me = this;

            me.error = arguments[0];

            if (me[RESOLVED]){
                return;
            }

            me[REJECTED] = true;
            for (var i = 0; i < me._f.length; i++) {
                me._f[i].call(null, me.error);
            }
            me._f = [];
        };
        return Promise;
    })();

    /* 
     * AMD shim 
     */
    var mod = {}, g = this, NE = '_NE_', defers = {}, aCount=0, NA = '_anonymous_';
    function resolvePath(base, relative){
        var ret, upCount = 0, l;

        base = base.split('/');
        relative = relative.split('/');
        if ( relative[0] == '.' || relative[0] == '..' ) {
            base.pop();
            ret = base.concat(relative);
        }
        else {
            ret = relative;
        }

        for(l = ret.length ; l--; ){
            if ( ret[l] == '.' ) {
                ret.splice( l, 1 );
            }
            else if ( ret[l] == '..' ) {
                upCount++;
            }
            else {
                if ( upCount > 0 ) {
                    ret.splice( l, 2 );
                    upCount--;
                }
            }
        }
        return ret.join('/');
    }
    define = function( id, deps, factory ){
        var dfds;
        if ( !factory ) { 
            if ( typeof deps == 'function' && typeof id == 'string' ) {
                factory = deps;
                deps = [];
            }
            else {
                if ( typeof deps == 'function' && 'length' in id ) {
                    factory = deps;
                    deps = id;
                }
                else if ( typeof id == 'function' ) {
                    factory = id;
                    deps = [];
                }
                id = NA + '/' + aCount++;
            }
            return define.call(g, id, deps, factory);
        }
        mod[id] = {
            p: id,
            d: deps,
            f: factory
        };
        if ( defers[id] ) {
            dfds = defers[id];

            for( var i = 0; i < dfds.length; i++ ) {
                dfds[i].resolve( mod[id] );
            }

            delete defers[id];
        }
    };
    define.amdShim = define.amd = true;
    require = function(deps, factory){
        var module = this;
        var resolved = [], cur, relative, absolute, 
            dfdFinal = new Promise(), ret;

        if ( module == null || module === g ) {
            module = { p: NE };
        }

        if ( typeof deps == 'string' && factory == null ) {
            deps = [deps];
        }

        if ( deps.length > 0 ) 
            (function step(i){
                relative = deps[i];
                absolute = resolvePath( module.p, relative );
                var dfd = new Promise();
                if ( absolute == "require" ) {
                    cur = {
                        p: NE,
                        d: [],
                        f: require
                    };
                }
                else {
                    cur = mod[absolute];
                }
                if ( !cur ) {
                    if ( !factory ) {
                        throw "module not found";    
                    }
                    
                    if ( !defers[absolute] ) {
                        defers[absolute] = []; 
                    }
                    defers[absolute].push( dfd );
                }
                else {
                    dfd.resolve( cur );
                }
                dfd
                .then(function( cur ){
                    if ( cur.o ) {
                        return cur.o;
                    }
                    else {
                        cur.o = new Promise();
                        return require.call( cur, cur.d, cur.f )
                            .then(function( result ){
                                if ( cur.o ) {
                                    cur.o.resolve( result );
                                }
                                return result;
                            });
                    }
                })
                .then(function( result ){
                    resolved[i] = result;

                    i++;
                    if ( i < deps.length ) {
                        step( i );
                    }
                    else {
                        dfdFinal.resolve();
                    }
                });
            })(0);
        else 
            dfdFinal.resolve();

        ret = dfdFinal.then(function(){
            resolved.push(require, {});
            var type = typeof factory;

            if ( type == 'function' ) {
                return factory.apply(g, resolved);
            }
            else if ( type == 'object' && module.p != NE ) {
                return object;
            }
            else {
                throw "Try to define a module without telling the module path.";
            }
        });

        if ( factory ) {
            return ret;
        }
        else {
            return resolved[0];
        }
    };

    amdShim.require = require; amdShim.define = define;
    function backup() {
        if ( g.require !== require ) {
            backup.require = g.require;
        }
        if ( g.define !== define ) {
            backup.define = g.define;
        }
    };
    function Modules(){
        this.rename = function ( name, newName ) {
            if ( !(name in mod) ) { return }
            define( newName, mod[name].d, mod[name].f );
            delete mod[name];
        };
        this.noNames = function(){
            var ret = [], cur, i;
            for( i = aCount; i--; ) {
                cur = mod[ NA + '/' + i ];
                if ( cur ) ret.unshift( cur );
            }
            return ret;
        };
    }
    Modules.prototype = mod;
    amdShim.remove = function() {
        if ( g.require === require ) {
            g.require = backup.require;
        }
        if ( g.define === define ) {
            g.define = backup.define;
        }
    };
    amdShim.insert = function() {
        backup();
        g.require = require;
        g.define = define;
    };
    amdShim.modules = new Modules();
    amdShim.waiting = defers;
    amdShim.insert();
}());