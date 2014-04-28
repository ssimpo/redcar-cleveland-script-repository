(function(){
	var bowserSniffed = false;
	var isIE = false;
	
	function isProperty(obj, key){
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
	
	if (!isProperty(Function, "bind")){
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
		constr.async = ((isProperty(constr, "async")) ? constr.async : false);
		
		if(constr.async){
			script.async = true;
		}
        if (isProperty(constr, "id")) {
			script.id = constr.id;
		}
        if (constr.onload){
            addOnloadFunction(script, constr.onload, context);
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
            
        if (ieVersion()) {
            node.onreadystatechange = func.bind(context);
        } else {
            node.onload = func.bind(context);
        }
    }
	
	function ieVersion() {
        // summary:
        //      Get the Internet Explorer version (or false if other browser).
        // note:
        //      Code largely taken from dojo._base.sniff.
        // returns: integer
        //      Version number
        
        if (bowserSniffed) { return isIE; }
        var webkit = parseFloat(navigator.userAgent.split("WebKit/")[1]) || undefined;
        if (!webkit) {
            if (navigator.userAgent.indexOf("Opera") == -1) {
                if(document.all) {
                    isIE = parseFloat(navigator.appVersion.split("MSIE ")[1]) || undefined;
                    var mode = document.documentMode;
                    if(mode && mode != 5 && Math.floor(isIE) != mode){
                        isIE = mode;
                    }
                }
            }
        }
        
        isIE = (((isIE == undefined) || (isIE == 0)) ? false : isIE);
        
		return isIE;
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
	
	var require2 = function(mids, callback){
		var loaders = [];
		function runNext(){
			if(loaders.length > 0){
				var loader = loaders.shift();
				loader();
			}else{
				callback();
			}
		}
		
		dojo.forEach(mids, function(mid){
			loaders.push(function(){
				appendScript({
					"onload": runNext,
					"src": location.protocol+"//"+location.host+mid,
					"node": dojo.query("head")[0]
				});
			});
		});
				
		runNext();
	};
	
	if(isProperty(window, "dojo")){
		dojo.ready(function(){
			main(dojo.query, dojo, undefined, require2, undefined);
		});
	}else{
		require([
			"dojo/ready",
			"dojo/query",
			"dojo/array",
			"dojo/dom-attr",
			"dojo/request"
		], function(ready, $, array, domAttr, request){
			ready(function(){
				main($, array, domAttr, require2, request);
			});
		});
	}
})();