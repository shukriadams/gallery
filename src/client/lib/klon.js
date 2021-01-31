/*
    Klon is a javascript library for creating and working with namespaces, inheritance 
    and loose coupling in a more traditional object oriented way. It has no dependencies.
    
    Use klon to create a global namespace like window.my.long.foo.bar.namespace from 
    the string "window.my.long.foo.bar.namespace". Klon will also attach a function

        var mytype = function(){}; 

    to that namespace, giving you 
        window.my.long.foo.bar.namespace.myType;
    

    Klon lets you affix multiple types to one namespace, or overwrite an existing type.
        var myInstance = new window.my.long.foo.bar.namespace.myType();
        var myOtherInstance = new window.my.long.foo.bar.namespace.myOtherType();


    Klon also lets you create an instance without knowing the type
        var myInstance = window.my.long.foo.bar.namespace.instance();

    In this way it allows you to achieve some degree of loose coupling, as you can bind
    different types with the same interface to a predetermined namespace, and then get
    an instance back without having to know which concrete type you're getting.


    Author : Shukri Adams (shukri.adams@gmail.com), 2013
    Klon is available under the MIT license and can be freely distributed.

    http://github.com/shukriadams/klon
*/

// this is the only global variable klon uses.
var klon;

(function(){
    
    'use strict';

    // setup global if it doesn't exist, else state will be reset each time script is read    
    if (klon == null){
        klon = {};
        klon.root = window;     // klon needs a global object to attach namespaces to. This can be override if needed.
        klon.logging = false;   // true if klon should go verbose. For development.
    }


    // names of functions klon attaches to namespaces.
    var functionNames = ["instance", "type", "clear"];


    // utility function : returns true if a namespace has been set up by Klon.
    klon.exists = function(ns){
        var nodes = ns.split('.');
        var root = klon.root;
        
        if (root === null){
            return false;
        }

        for (var i = 0 ; i < nodes.length ; i ++){
            var node = nodes[i];

            if (!root.hasOwnProperty(node)){
                return false;
            }

            root = root[node];
        }

        // check for klon functions.
        for (var i = 0 ; i < functionNames.length ; i ++){
            if (!root.hasOwnProperty(functionNames[i])){
                return false;
            }
        }
        return true;
    };


    // utility function : returns true if variable is neither undefined nor null
    klon.is = function(variable){
        if (typeof(variable) === 'undefined' || variable === null)
            return false;
        return true;
    };


    // Calls base method in underyling class. Can be stacked. Currently works for types
    // extended with underscore.
    // usage : klon.base(this, "basemethodname", yourArg1, yourArg2 ...)
    // caveats : 
    // Injects a "__depthX" argument into base call, so if you have an argument with the same name it might break
    klon.base = function(context, method, theirArgs){
        function getdepth(theirArgs){
            var args = Array.prototype.slice.call(theirArgs, 0);
            var i = 0;
            while(true){
                if(!(!!~args.indexOf("__depth" + i))){
                    break;
                }
                i ++;
                if (i == 100) // emergency
                    break;
            }
            return "__depth" + i;
        }
        
        if (theirArgs === null || theirArgs === undefined){
            theirArgs = [];
        }

        var calldepth = getdepth(theirArgs);
        var depth  = calldepth.substring(7);
        depth = parseInt(depth) + 1;
        var root = context["__proto__"];
        for (var i = 0 ; i < depth ; i ++){
            root = root["__proto__"]
        }

        if (root.hasOwnProperty(method)){
            var args = Array.prototype.slice.call(arguments, 3);
            args.push(calldepth);
            root[method].apply(context, args);
        }
    };


    // gets an instance
    // add optional interface as part of registration contract
    klon.register = function () { /*ns, key, type. Key is optional */ 
        var ns, type, key, rt;
        var args = Array.prototype.slice.call(arguments, 0);
        if (args.length == 3){
            ns = args[0]; 
            key = args[1]; 
            type = args[2]; 
        } else if (args.length == 2){
            ns = args[0]; 
            type = args[1]; 
        } else if (args.length == 1){
            ns = args[0]; 
        }
        
        rt = klon.root;

        // setup up and/or get namespace 
        var namespace = klon.namespace(ns, rt);


        // Attach "instance" method which returns an instance of the type 
        // with the requested key, or the first type at the node if no key
        // given.
        // key : unique key type was registerd with
        // args : optional constructor args for instance.
        if (!namespace.instance){
            namespace.instance = function instance (key, args){
                if (!args && typeof key === 'object' ){
                    args = key;
                    key = null;
                }

                return get(namespace, key, args, true);
            }; 
        }

            
        // Attach "type" method which returns the type (class) with the requested
        // key, or the first type at the node if no key is given.
        if (!namespace.type){
            namespace.type = function type(key){
                return get(namespace, key, null, false);
            }
        }
        

        // clears all types at the node.
        if (!namespace.clear){
            namespace.clear = function clear(){
                for (var property in namespace) {
                    if (!namespace.hasOwnProperty(property)) {
                        continue;
                    }
                    
                    if(!!~functionNames.indexOf(property)){
                        continue;
                    }

                    delete namespace[property];
                }                
            }
        }        


        // attach property to namespace, either at key, use name "default"
        if (type){
            if (!key){
                var i = 0;
                for(var property in namespace){
                    key = "_default" + i == 0 ? "" : i;    
                    if (!namespace.hasOwnProperty(key)) {
                        break;
                    }
                    i++;
                }
                
            }

            namespace[key] = type;

            klon.log('registered type at namespace ' + ns + (key?' '+key:'') );
        }

    };


    // gets an instance or raw type	
    function get(ns, key, args, inst){
        if (!key){ 
            
            // if no key given, find last type member that is not a reserved function
            var properties = Object.keys(ns);

            for (var i = 0 ; i < properties.length ; i ++){
                var property = properties[properties.length - 1 - i];
                if (!ns.hasOwnProperty(property)) {
                    continue;
                }
                
                if(!!~functionNames.indexOf(property)){
                    continue;
                }

                key = property;
                break;
            }                 
        }       

        if(!key || !ns.hasOwnProperty(key)){
            throw 'Did not find a registered type ' + (key ? key : '(no key given)'); 
        }

        if (inst){
            return new ns[key](args);
        }

        return ns[key];
    }


    // builds an object namespace from a string    
    klon.namespace = function(ns, rt){
        var nodes = ns.split('.');
        if (nodes.length === 0){
            throw 'Invalid namespace, must contain at least 1 node'
        }
        var root = rt;    
        for (var i = 0 ; i < nodes.length ; i ++){
            var node = nodes[i];
            root[node] = root[node] || {};
            root = root[node];
        }
        return root;
    };


    // logs stuff
    klon.log = function(message){
        if (!console || !klon.logging){
            return false;
        }

        console.log(message);   
    };

}());