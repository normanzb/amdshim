var require, define;
(function (undef) {
    var mod = {}, g = this;
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
        id = arguments[0];
        deps = arguments[1];
        factory = arguments[2];

        if ( !factory ) { 
            id = null;

            for( i = 0 ; i < arguments.length; i++ ) {
                arg = arguments[i];
                if ( typeof arg == 'object' && 'length' in arg ) {
                    deps = arg;
                }
                else if ( typeof arg == 'object' ) {
                    factory = (function(ret) { return function(){ return ret; }})(arg);
                }
                else if ( typeof arg == 'function' ) {
                    factory = arg;
                }
                else if ( typeof arg == 'string' ) {
                    id = arg
                }
            }

            if ( id == null ) {
                id = NA + '/' + aCount++;
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
    };
    define.amd = {};
    require = function(deps, factory){
        var module = this;
        var resolved = [], cur, relative, absolute;

        if ( module == null || module === g ) {
            module = { p: '_NE_' };
        }

        if ( typeof deps == 'string' && factory == null ) {
            deps = [deps];
        }

        for(var i = 0; i < deps.length; i++) {
            relative = deps[i];
            absolute = resolvePath( module.p, relative );
            if ( absolute == "require" ) {
                cur = {
                    p: '_NE_',
                    d: [],
                    f: function(){ return require }
                };
            }
            else {
                cur = mod[absolute];
            }
            if ( !cur ) {throw "module not found"}
            resolved.push( require.call( cur, cur.d, cur.f ) );
        }

        resolved.push(require, {});
        if ( factory ) {
            if ( !('o' in module) ) {
                module.o = factory.apply(g, resolved);
            }
            return module.o;
        }
        else {
            return resolved[0];
        }
    };
}());