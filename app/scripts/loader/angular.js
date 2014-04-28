(function(){
	Function.prototype.bind = function( obj ) {
        var slice = [].slice,
        args = slice.call(arguments, 1),
        self = this,
        nop = function () {},
        bound = function () {
            return self.apply( this instanceof nop ? this : ( obj || {} ),
                args.concat( slice.call(arguments) ) );
        };
        nop.prototype = self.prototype;
        bound.prototype = new nop();
        return bound;
    };
	
	function isProperty(obj, key){
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
	
	function appendScript(constr) {
        // summary:
        //      Insert a script into the DOM at a given point.
        // description:
        //      Load scripts asynchronously cross-browser.  Will insert
        //      a script tag for the given URL at the specified position
        //      in the DOM.  When script is loaded, fire the onload event.
        // constr: object
        //      Parameters object with properties:
        //      node: object XMLNode
        //          The reference node for insertion (eg. insert within
        //          this node or insert after this).
        //      src: string
        //          The URL to load the script from
        //      onload: function
        //          The callback function to fire when script has loaded.
        //      onError: function
        //          The fallback function if loading fails
        //      context: object
        //          The context to run onload/onerror within.
        //      async: boolean
        //          Asynchronous or not?
        //      id: string
        //          The script ID.
        //      position:
        //          The location in insert the node with reference to the
        //          reference node : first, last, after, before.
        //          Defaults to last.
        // returns: XMLNode
        //      The script node being used as a loader.
            
        var done = false;
        var context = ((isProperty(constr, "context")) ? constr.context : this);
        var position = ((position === undefined) ? "last" : position);
    
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = constr.src;
		if(isProperty(constr, "async")){
			if(constr.async){
				script.async = true;
			}
		}
        if (isProperty(constr, "id")) {
			script.id = constr.id;
		}
        if (constr.onload){
            this.addOnloadFunction(script, constr.onload, context);
        }
        if (constr.onerror){
            script.onerror = constr.onerror.bind(context);
        }
        
        placeNode(script, constr.node, position);
		
        return script;
    }
	
	function placeNode(node,refnode,position) {
        position = ((position==undefined)?'last':position);
        switch(position.toLowerCase()) {
            case 'last':
                refnode.appendChild(node);
                break;
            case 'before':
                refnode.parentNode.insertBefore(node,refnode);
                break;
            case 'first':
                refnode.parentNode.insertBefore(node, refnode.parentNode.firstChild);
                break;
            case 'after':
                refnode.parentNode.insertBefore(node, refnode.nextSibling);
                break;
        }
    }
	
	function addOnloadFunction(node, onload, context) {
        var done = false;
        context = ((context==undefined)?this:context);
            
        var boundOnload = onload.bind(context);
        var func = function() {
            if (!done && (!node.readyState || node.readyState=="loaded" || node.readyState=="complete")) {
                done = true;
                boundOnload();
            }
        };
            
        if (this._ieVersion()) {
            node.onreadystatechange = func.bind(context);
        } else {
            node.onload = func.bind(context);
        }
    }
	
	var main = function($, array, domAttr, require, request){
		function findAngularApps() {
			return $("[ng-app]");
		}
		
		function getProfileUrl(appName){
			return "/apps/" + appName + "/app/profile.json";
		}
		
		function addAppPathToUrl(url, appName){
			return "/apps/" + appName + "/app/" + url;
		}
		
		function loadProfile(appDom, callback) {
			var appName = getNodeAttribute(appDom, "ng-app");
			var appProfileUrl = getProfileUrl(appName);
			ajaxGet(appProfileUrl, function(data){
				array.forEach(data.scripts, function(url, n){
					data.scripts[n] = addAppPathToUrl(data.scripts[n], appName);
				});
				callback(data);
			}, function(){
				console.log("ERROR");
			});
		}
	
		function loadApps() {
			var apps = findAngularApps($);
			if(apps.length > 0){
				array.forEach(apps, function(appDom){
					loadProfile(appDom, function(profile){
						console.log(location);
						console.log(profile);
						require(profile.scripts, function(){
							console.log("HELLO");
						});
					});
				});
			}
		}
		
		function ajaxGet(url, callback, errCallback){
			callback = callback || function(){};
			errCallback = errCallback || function(){};
			
			var opts = {"handleAs": "json"};
			if (request === undefined){
				opts.load = callback;
				opts.error = errCallback;
				opts.url = url;
				dojo.xhrGet(opts);
			}else{
				opts.method = "get";
				request(url, opts).then(errCallback);
			}
		}
		
		function getNodeAttribute(node, attribute){
			// summary:
			//		get an attribute of a node.
			// description:
			//		Get an attribute of a node using Dojo v1.5 or v2.0
			//		methodology.  Assumes domAttr is undefined for v1.5.
			// node: object HTMLElement
			//		The node to get an attribute value for.
			// attribute: string
			//		The attribute name to get.

			if(domAttr !== undefined){
				return domAttr.get(node, attribute, value);
			}else{
				return dojo.attr(node, attribute);
			}
		}
		
		loadApps();
	};
	
	if(isProperty(window, "require")){
		require([
			"dojo/ready",
			"dojo/query",
			"dojo/array",
			"dojo/dom-attr",
			"dojo/request"
		], function(ready, $, array, domAttr, request){
			ready(function(){
				main($, array, domAttr, require, request);
			});
		});
	}else{
		dojo.ready(function(){
			var require = function(mids, callback){
				var done = 0;
				dojo.forEach(mids, function(mid){
					appendScript({
						"load": function(){
							done++;
							if (done >= mids.length) {
								callback();
							}
						},
						"src": location.protocol+"//"+location.host+mid,
						"node": dojo.query("head")[0]
					});
				});
				
			};
			
			main(dojo.query, dojo, undefined, require, undefined);
		});
	}
})();