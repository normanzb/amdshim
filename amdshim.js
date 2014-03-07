var require, define;
(function (undef) {
    var mod = {}, g = this;
    function resolvePath(base, relative){
        var ret;
        base = base.split('/');
        relative = relative.split('/');
        base.pop();
        ret = base.concat(relative);

        for(var l = ret.length ; l--; ){
            if ( ret[l] == '.' ) {
                ret.splice( l, 1 );
            }
            else if ( ret[l] == '..' && l > 0 ) {
                ret.splice( l - 1, 2 );
            }
        }
        return ret.join('/');
    }
    define = function( id, deps, factory ){
        mod[id] = {
            p: id,
            d: deps,
            f: factory
        };
    };
    define.amd = true;
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
            return factory.apply(g, resolved);
        }
        else {
            return resolved[0];
        }
    };
}());