var require, define;
(function (undef) {

    /*
     * A compact version of Promise
     */
    function Promise() {
        this._successCallbacks = [];
        this._failureCallbacks = [];
    }

    Promise.prototype.then = function(onSuccess, onFailure) {
        var p;
        var me = this;
        p = new Promise();

        if (typeof onSuccess == 'function'){
            var handleSuccess = function () {
                var res = onSuccess.apply(me, arguments);
                if (res && typeof res.then === 'function'){
                    res.then(function(){
                        p.resolve.apply(p, arguments);
                    });
                }
                else{
                    p.resolve.apply(p, (res == null ? [] : [res]));
                }
            };

            if (me._isSuccessed) {
                handleSuccess.call(null, me.result);
            } else {
                me._successCallbacks.push(handleSuccess);
            }
        }

        if (typeof onFailure == 'function'){
            var handleFail = function () {
                var res = onFailure.apply(me, arguments);
                if (res && typeof res.then === 'function'){
                    res.then(function(){
                        p.resolve.apply(p, arguments);
                    });
                }
                else{
                    p.resolve.apply(p, (res == null ? [] : [res]));
                }
            };

            if (me._isFailed) {
                handleFail.call(null, me.error);
            } else {
                me._failureCallbacks.push(handleFail);
            }
        }
        
        return p;
    };

    Promise.prototype.resolve = function() {
        var me = this;

        me.result = arguments[0];
        
        if (me._isFailed){
            return;
        }

        me._isSuccessed = true;
        for (var i = 0; i < me._successCallbacks.length; i++) {
            me._successCallbacks[i].call(null, me.result);
        }
        me._successCallbacks = [];
    };

    Promise.prototype.reject = function(){
        var me = this;

        me.error = arguments[0];

        if (me._isSuccessed){
            return;
        }

        me._isFailed = true;
        for (var i = 0; i < me._failureCallbacks.length; i++) {
            me._failureCallbacks[i].call(null, me.error);
        }
        me._failureCallbacks = [];
    };

    /* 
     * AMD shim 
     */
    var mod = {}, g = this, NE = '_NE_', defers = {}, aCount=0;
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
            if ( typeof deps == 'function' && 'length' in id) {
                require.apply(g, arguments);
            }
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
                        f: function(){ return require }
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
                    return require.call( cur, cur.d, cur.f );
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

            if ( factory ) {
                return factory.apply(g, resolved);
            }
        });

        if ( factory ) {
            return ret;
        }
        else {
            return resolved[0];
        }
    };
}());