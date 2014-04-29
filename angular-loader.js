(function(global){
	var bowserSniffed = false;
	var isIE = false;
	var apps = [];
	
	function isProperty(obj, key){
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
	
	function bind(obj, func) {
		var slice = [].slice,
		args = slice.call(arguments, 2),
		nop = function () {},
		bound = function () {
			return func.apply( this instanceof nop ? this : ( obj || {} ),
				args.concat( slice.call(arguments) ) );
		};
		nop.prototype = func.prototype;
		bound.prototype = new nop();
		return bound;
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
            script.onerror = bind(context, constr.onerror);
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
            
        var boundOnload = bind(context, onload);
        var func = function() {
            if (!done && (!node.readyState || node.readyState=="loaded" || node.readyState=="complete")) {
                done = true;
                boundOnload();
            }
        };
            
        if (ieVersion()) {
            node.onreadystatechange = bind(context, func);
        } else {
            node.onload = bind(context, func);
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
	
	var executeProfile = function(mids, callback){
		var loaders = [];
		function runNext(){
			if(loaders.length > 0){
				var loader = loaders.shift();
				loader();
			}else{
				dojo.forEach(apps, function(app){
					angular.bootstrap(app.appNode, [app.appName]);
				});
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
	
	function findAngularApps($) {
		return $("[rcbc-app]");
	}
	
	function getProfileUrl(appName){
		return "/apps/" + appName + "/app/profile.json";
	}
		
	function addAppPathToUrl(url, appName){
		return "/apps/" + appName + "/app/" + url;
	}
		
	function calculateLibraryPath(id){
		return "/apps/lib/lib/" + id + "/" + id + ".min.js";
	}
	
	function loadProfile(appDom, callback) {
		var appName = getNodeAttribute(appDom, "rcbc-app");
		var appProfileUrl = getProfileUrl(appName);
		ajaxGet(appProfileUrl, function(data){
			for (var i = 0; i < data.scripts.length; i++) {
				data.scripts[i] = addAppPathToUrl(data.scripts[i], appName);
			}
			for (var i = (data.libraries.length-1); i >= 0; i--) {
				var id = data.libraries[i];
				data.scripts.unshift(calculateLibraryPath(id));
			}
			apps.push({
				"appName": appName,
				"appNode": appDom
			});
			callback(data);
		}, function(){
				console.log("ERROR");
		});
	}
	
	function ajaxGet(url, callback, errCallback){
		callback = callback || function(){};
		errCallback = errCallback || function(){};
			
		var opts = {"handleAs": "json"};
		if(isProperty(global, "dojo")){
			opts.load = callback;
			opts.error = errCallback;
			opts.url = url;
			dojo.xhrGet(opts);
		}else if(isProperty(global, "dojoConfig")){
			opts.method = "get";
			require(["dojo/query"], function(request){
				request(url, opts).then(callback, errCallback);
			});
		}
	}
	
	function loadApps($) {
		var apps = findAngularApps($);
		if(apps.length > 0){
			for (var i = 0; i < apps.length; i++) {
				loadProfile(apps[i], function(profile){
					executeProfile(profile.scripts, function(){
							console.log("DONE");
					});
				});
			}
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

		var result = (node.getAttribute && node.getAttribute(attribute)) || null;
        if(!result) {
            var attributes = node.attributes;
            var length = attributes.length;
            for(var i = 0; i < length; i++)
                if(attributes[i].nodeName === attr)
                    result = attributes[i].nodeValue;
        }
        return result;
	}
	
	function getQuerySelector(callback) {
		if(isProperty(global, "dojo")){
			callback(dojo.query);
		}else if(isProperty(global, "dojoConfig")){
			require(["dojo/query"], callback);
		}else if(typeof global.$ === "function"){
			callback($);
		}else if((typeof global.define === "function") && (typeof global.require === "function")){
			define.amd = true;
			require(["/apps/lib/lib/jquery/jquery.min.js"], callback);
		}else if(isProperty(document, "querySelector")){
			callback(document.querySelector);
		}
	}
	
	if(isProperty(window, "dojo")){
		getQuerySelector(function($){
			dojo.ready(function(){
				loadApps($);
			});
		});
	}else{
		require([
			"dojo/ready",
		], function(ready){
			ready(function(){
				loadApps($);
			});
		});
	}
})(window);