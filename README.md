amdshim
=======

Super small amd shim with path resolution, embed to make you lib smaller!

If you are creating a Javascript library and want to use RequireJS/Almond for modular management and dependency resolution, but afraid of inflation of the general file size, this tool is ideal to be used as a simple and quick replacement.

Check out <https://github.com/normanzb/chuanr/blob/master/gruntfile.js> to see how it is used in Chuanr <https://github.com/normanzb/chuanr/>.

amdshim.embed
-------------

AMDShim.embed is the smallest version which it relies on correctly sorted dependencies. That's been said, if the the dependent is loaded without loading dependencies before hand, it will fail.

Usually the output of r.js will sort the dependencies in order and you don't have to worry about that.

amdshim.defer
-------------

Contradicting to above embedding version which relies on correctly sorted order on dependecies, AMDShim.defer is slightly bigger and it will wait for dependencies are fully loaded before calling into the callback/factory function.

This version also provide a handful methods/properties as indicated below:

* amdShim.define(path<optional>, dependencies<optional>, factory): The AMD define method, define a module, if the module path is not provided, and the module is not loaded by amdShim, module will be considered as anonymous module.
* amdShim.require(dependencies, factory): The AMD require method.
* amdShim.insert(): Enable this shim to global naming space, takes over window.define() and window.require().
* amdShim.remove(): Disable this shim from global naming space, similar to noConflict() from the other library.
* amdShim.modules: Hash table for all loaded modules
* amdShim.modules.rename(name, newName): Rename module
* amdShim.modules.noNames(): Return hash table for all anonymous modules
* amdShim.config: Similar to require.config() in require js, only support a subset of the configuration, such as `paths`, `shim`, `baseUrl`. 

###Configuration

Example:

    {
        baseUrl: '.',
        paths: {
            'RSVP': 'bower_component/RSVP/RSVP'
        },
        shim: {
            'RSVP': {
                exports: 'RSVP'
            }
        },
        // Enable amdshim to proactively download the script 
        proactive: {
            // Exclude scripts from be downloaded automatically
            exclude: [
                'RegExp Here'
            ]
        }
    }