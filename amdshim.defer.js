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
                    if (res && (res instanceof Promise)){
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
                    if (res && (res instanceof Promise)){
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
    var GET_ELEMENTS_BY_TAG = 'getElementsByTagName',
        CREATE_ELEMENT = 'createElement',
        FUNCTION = 'function',
        DOC = 'document',
        mod = {}, NE = '_NE_', defers = {}, aCount=0, NA = '_anonymous_',
        config = {},
        head = g[DOC][GET_ELEMENTS_BY_TAG]('head')[0] || g[DOC][GET_ELEMENTS_BY_TAG]('html')[0];

    initConfig();

    function emptyModule(ret) { return function(){ return ret; }; }

    //get the current executing file path
    //see: https://github.com/samyk/jiagra/blob/master/jiagra.js
    function getCurrentScript() {
        //moz
        if(g[DOC].currentScript) {
            //firefox 4+, Chrome 10+
            return g[DOC].currentScript.src;
        }
        var stack = null;
        try {
            stack(); //thrown exception
        } catch(e) {
            stack = e.stack; //safari contains line,sourceId,sourceURL
            if(!stack && window.opera){
                //opera 9 doesnot has e.stack, but e.Backtrace
                stack = (String(e).match(/of linked script \S+/g) || []).join(' ');
            }
            if(stack) {
               /*chrome23:
                * at http://113.93.50.63/data.js:4:1
                *firefox17:
                *@http://113.93.50.63/data.js:4
                *opera12:
                *@http://113.93.50.63/data.js:4
                *IE10:
                *  at Global code (http://113.93.50.63/data.js:4:1)
                */
                //pop the last row
                stack = stack.split( /[@ ]/g).pop();
                stack = stack[0] == '(' ? stack.slice(1, -1) : stack;
                //remove line no.
                return stack.replace(/(:\d+)?:\d+$/i, '');
            }
        }
        var nodes = g[DOC][GET_ELEMENTS_BY_TAG]('SCRIPT');
        //IE
        for(var i = 0, node; node = nodes[i++];) {
            if(node.readyState === 'interactive') {
                return node.src;
            }
        }

        return nodes[nodes.length - 1].src;
    }

    function initConfig() {
        var anchor, id;

        config.paths = config.paths || {};
        anchor = g[DOC][CREATE_ELEMENT]('a');
        anchor.href = config.baseUrl || '.';
        config.baseUrl = anchor.href;
        config.proactive = typeof config.proactive === 'object'?
            config.proactive:(config.proactive===true?{}:null);
        config.shim = config.shim || {};

        if (config.proactive) {
            config.proactive.exclude = config.proactive.exclude || [];
            for(id in defers) {
                getModule(id);
            }
        }
    }

    function getModule(id) {
        var path, s, pathMatcher, i, loaded = false, shim, configuredPath;
        if (defers[id].getting === true) {
            return;
        }
        for(i = config.proactive.exclude.length; i--;){
            pathMatcher = config.proactive.exclude[i];
            if ((new RegExp(pathMatcher)).test(id)){
                return;
            }
        }
        defers[id].getting = true;
        for(pathMatcher in config.proactive.bundle) {
            if (!config.proactive.bundle.hasOwnProperty(pathMatcher)) {continue;}
            if ((new RegExp(pathMatcher)).test(id)){
                configuredPath = config.proactive.bundle[pathMatcher] + '.js';
                break;
            }
        }
        if (!configuredPath) {
            configuredPath = (config.paths[id]?config.paths[id]:id) + '.js';
        }
        if (!configuredPath) {
            for(pathMatcher in config.paths) {
                if (!config.paths.hasOwnProperty(pathMatcher)) {continue;}
                if (id.indexOf(pathMatcher) === 0) {
                    configuredPath = id.replace(new RegExp('^'+pathMatcher), config.paths[pathMatcher]) + '.js';
                    break;
                }
            }
        }
        if (/(^\w*?:|^)\/\//.test(configuredPath) || configuredPath.charAt(0) === '/') {
            path = configuredPath;
        }
        else {
            path = config.baseUrl;
            if (path.charAt(path.length-1) !== '/'){
                path+='/';
            }
            path += configuredPath;
        }
        if (head.querySelectorAll('script[src="'+path+'"]').length > 0) {
            return;
        }
        s = g[DOC][CREATE_ELEMENT]('script');
        s.type = 'text/javascript';
        s.src = path;
        s.setAttribute('amdshim-id', id);
        if (id in config.shim) {
            shim = config.shim[id];
            s.onload = s.onreadystatechange = function(){
                if (!loaded && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') ) {
                    loaded = true;
                    define(id, shim.deps || [], function(){
                        var output;
                        if (typeof shim.init === FUNCTION) {
                            try{
                                output = shim.init.apply(g, arguments);
                            }
                            catch(e) {}
                        }
                        if(output === undef && shim.exports) {
                            output = (window.eval || window.execScript)( '(' + shim.exports + ')');
                        }
                        return output;
                    });
                }
            };
            s.onerror = function() {
                if (g.console && typeof g.console.log === FUNCTION) {
                    g.console.log('Fail to load module: ' + id);
                }
            };
        }
        head.insertBefore(s, head.children[0]);
    }

    function extractCurrentID() {
        var id;
        if (config.proactive) {
            id = getCurrentScript();
            id = id.replace(config.baseUrl, '');
            id = resolvePath('.', id);
            if (id.substr(id.length-3,id.length) === '.js'){
                id=id.substr(0, id.length-3);
            }
            for(var key in config.paths) {
                if (config.paths[key] === id) {
                    id = key;
                    break;
                }
            }
        }
        else {
            id = NA + '/' + aCount++;
        }

        return id;
    }

    function resolvePath(base, relative){
        var ret, upCount = 0, l;

        base = base.split('/');
        relative = relative.split('/');
        // handling relative start with /
        if (relative[0] === ''){
            relative.shift();
        }
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
    define = function( ){
        var dfds, i, arg, id, deps, factory;

        id = arguments[0];
        deps = arguments[1];
        factory = arguments[2];

        if ( !factory ) {
            id = null;
            deps = [];

            for( i = 0 ; i < arguments.length; i++ ) {
                arg = arguments[i];
                if ( typeof arg == 'object' && 'length' in arg ) {
                    deps = arg;
                }
                else if ( typeof arg == 'object' ) {
                    factory = emptyModule(arg);
                }
                else if ( typeof arg == FUNCTION ) {
                    factory = arg;
                }
                else if ( typeof arg == 'string' ) {
                    id = arg;
                }
            }

            if ( id == null ) {
                id = extractCurrentID();
            }

            return define.call(g, id, deps, factory);
        }
        if ( id in mod ) {
            // oops, duplicated download?
            return;
        }
        mod[id] = {
            p: id,
            d: deps,
            f: factory
        };
        if ( defers[id] ) {
            dfds = defers[id];

            for(i = 0; i < dfds.length; i++) {
                dfds[i].resolve( mod[id] );
            }

            delete defers[id];
        }
    };
    define.amdShim = define.amd = {};
    require = function(deps, factory){
        var module = this;
        var resolved = [], depLoaded = [],
            dfdFinal = new Promise(), ret;

        if (
            module == null || module === g ||
            // To workaround in IE8, `this` is an wrapper of window when function called like this: window.foo();
            module.document == g[DOC] ||
            module === amdShim
        ) {
            module = { p: NE };
        }

        if (deps == null) {
            deps = [];
        }
        else if ( typeof deps == 'string' && factory == null ) {
            deps = [deps];
        }

        if ( deps.length > 0 ) {
            (function step(i){
                var relative = deps[i];
                var absolute = resolvePath( module.p, relative );
                var dfd = new Promise();
                var cur;
                if ( absolute === 'require' ) {
                    cur = {
                        p: NE,
                        d: [],
                        f: function(){return require;}
                    };
                }
                else {
                    cur = mod[absolute];
                }
                if ( !cur ) {
                    if ( !factory ) {
                        throw 'module not found';
                    }

                    if ( !defers[absolute] ) {
                        defers[absolute] = [];
                    }
                    defers[absolute].push( dfd );
                    if (config.proactive) {
                        getModule(absolute);
                    }
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
                .then(function(result){
                    resolved[i] = result;
                    depLoaded[i] = true;
                    if (depLoaded.length < deps.length) {
                        return;
                    }
                    for(var itr = 0; itr < depLoaded.length; itr++) {
                        if (depLoaded[itr] !== true) {
                            return;
                        }
                    }
                    dfdFinal.resolve();
                });

                if ((i + 1)< deps.length){
                    step(i+1);
                }
            })(0);
        }
        else {
            dfdFinal.resolve();
        }

        ret = dfdFinal.then(function(){
            resolved.push(require, {});
            var type = typeof factory;

            if ( type == FUNCTION ) {
                return factory.apply(g, resolved);
            }
            else if ( type == 'object' && module.p != NE ) {
                return factory;
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
    }
    function Modules(){
        this.rename = function ( name, newName ) {
            if ( !(name in mod) ) { return; }
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
    amdShim.config = function(cfg) {
        config = cfg;
        initConfig();
    };
    amdShim.modules = new Modules();
    amdShim.waiting = defers;
    amdShim.insert();
    amdShim.script = {path: getCurrentScript()};
}());