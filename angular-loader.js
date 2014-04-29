(function(global){
	// author:
	//		Stephen Simpson <me@simpo.org>.
	// summary:
	//		Angular loader and bootstrapper.
	// description:
	//		Search current document for Angular apps and bootstrap them using
	//		an app profile for each.  Will bootstrap multiple apps
	//		on any one page.
	// todo:
	//		Remove any remaining Dojo dependencies.
	//		Create a ajax handling function that is cross-browser
	//			and independent of framework.
	//		Use ng-app instead of rcbc-app.
	//		Create Unit Tests
	
	var bowserSniffed = false;
	var isIE = false;
	var apps = [];
	var $;
	
	function isProperty(obj, key){
		// summary:
		//		Test if a key is a property of an object.
		// obj: Object
		//		Object to test for property.
		// key: String
		//		Property value to test for.
		// returns: Boolean
		
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
	
	function bind(context, func){
		// summary:
		//		Bind a function to a particular context.
		// description:
		//		Bind function to a context.  Use instead of Function.bind(), in
		//		case it does not exist in current environment.
		// context: Object
		//		The context to bind to.
		// func: Function
		//		The function to bind.
		// returns: Function
		//		The newly created bound function.
		
		if(isProperty(Function.prototype, "bind")){
			return func.bind(context);
		}
		
		var slice = [].slice;
		var args = slice.call(arguments, 2);
		var nop = function () {};
		var bound = function () {
			return func.apply(
				((this instanceof nop) ? this : (context || {})),
				args.concat(slice.call(arguments))
			);
		};
		
		nop.prototype = func.prototype;
		bound.prototype = new nop();
		
		return bound;
	}
	
	function getHeadNode(){
		// summary:
		//		Get the dom head element.
		// returns: XMLDOMNode
		//		The head node.
		
		return global.document.getElementsByTagName("head")[0];
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
        //          this node or insert after this). Defaults to the head.
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
		constr.node = ((isProperty(constr, "node")) ? constr.node : getHeadNode());
    
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
	
	function placeNode(node, refnode, position) {
		// summary:
		//		Place a node in the Dom with reference to another node.
		// node: Object XMLDOMNode
		//		The node to place.
		// refNode: Object XMLDOMNode
		//		The reference node.
		// position: String|undefined
		//		Where to place node in relation to refNode.  Four options:
		//			First: Place node as the first child of refNode.
		//			Last: Place node as the last child of refNode.
		//			Before: Place node before refNode in the Dom tree.
		//			After: Place node after refNode in the Dom tree
		
        position = ((position === undefined) ? "last": position);
		
        switch(position.toLowerCase()){
			case "first":
                refnode.parentNode.insertBefore(node, refnode.parentNode.firstChild);
            case "last":
                refnode.appendChild(node);
            case "before":
                refnode.parentNode.insertBefore(node, refnode);
            case "after":
                refnode.parentNode.insertBefore(node, refnode.nextSibling);
        }
    }
	
	function addOnloadFunction(node, onload, context){
		// summary:
		//		Add an onLoad function to a node with a specified
		//		context (optional).
		// description:
		//		Add an onLoad function to a node with a specified context. This
		//		is a cross-browser solution that should work in IE8.
		// todo:
		//		Stop using node.onload and use one of the append versions to
		//		stop overwriting of other context code.
		// node: Object XMLDOMNode
		//		The node to add an onLoad function to.
		// onload: Function
		//		The onload function to apply.
		// context: Object|undefined
		//		Context to bind the onload function to.
		
        var done = false;
        context = ((context === undefined) ? this : context);
            
        var boundOnload = bind(context, onload);
        var func = function(){
            if(!done && (!node.readyState || node.readyState=="loaded" || node.readyState=="complete")){
                done = true;
                boundOnload();
            }
        };
            
        if(ieVersion()){
            node.onreadystatechange = bind(context, func);
        }else{
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
        
        if(bowserSniffed){
			return isIE;
		}
        var webkit = parseFloat(navigator.userAgent.split("WebKit/")[1]) || undefined;
        if(!webkit){
            if(navigator.userAgent.indexOf("Opera") == -1){
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
	
	function executeProfile(mids, callback){
		// summary:
		//		Execute a profile and then call callback when complete.
		// mids: Array
		//		Array of scripts to load into the current page.
		// callback: Function
		//		Function to callback when done loading scripts.
		
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
	
	function findAngularApps(context) {
		// summary:
		//		Find the angular apps on the current page.
		// todo:
		//		Add optional Dom/Node context.
		//		Does it work with native querySelector?
		// returns: Array
		//		The nodes found by the querySelector.
		
		context = ((context === undefined) ? global.document : context);
		
		return $("[rcbc-app]", context);
	}
	
	function getProfileUrl(appName){
		// summary:
		//		Get the profile url for a given app name.
		// appName: String
		//		Name of app to calculate profile url for.
		// returns: String
		//		The profile url.
		
		return "/apps/" + appName + "/app/profile.json";
	}
		
	function addAppPathToUrl(url, appName){
		// summary;
		//		Add an app path (according to supplied app name) to the
		//		beginning of a url.
		// url: String
		//		The url to add to.
		// appName: String
		//		The app name to create paths for.
		// returns: String
		//		The calculated full relative path.
		
		return "/apps/" + appName + "/app/" + url;
	}
		
	function calculateLibraryPath(id){
		// summary:
		//		Calculate the path to a given library.
		// todo:
		//		Add option not to use the min version.
		// id: String
		//		The name of the library.
		// returns: String
		//		The path to the library.
		
		return "/apps/lib/lib/" + id + "/" + id + ".min.js";
	}
	
	function loadProfile(appDom, callback){
		// summary:
		//		Load a profile and then fire the callback passing the profile.
		// appDom: Object XMLDOMNode
		//		The dom node representing the app for which a profile is needed.
		// callback: Function
		//		The callback to fire when the profile is loaded.
		
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
		// summary:
		//		Get a url, process as json and optionally fire callback or
		//		errCallback (on failure).
		// description:
		//		Use either dojo 1.8+ or 1.5 ajax code to load a json resource
		//		and optionally fire callback or errCallback (on failure).
		// todo:
		//		Make it work without Dojo.
		// url: String
		//		The resource url to load.
		// callback: Function
		//		The optional callback to fire when the resource is loaded.
		//		Resource is passed to the callback.
		// errCallback: Function
		//		The optional error callback to call on resource failure. The
		//		error object is passed to the callback.
		
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
	
	function loadApps(){
		// summary:
		//		Load up all the Angular applications on the current page.
		
		var apps = findAngularApps();
		if(apps.length > 0){
			for(var i = 0; i < apps.length; i++){
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
	
	function querySelector(selector, context){
		// summary:
		//		Polyfill for $ function using native querySelector.
		// selector: String
		//		The selection criteria
		// context: Object XMLDOMNode|Undefined
		//		The optional context for the query, defaults to document.
		// returns: Array
		//		The found XMLNodes.
		
		context = ((context === undefined) ? global.document : context);
		
		return context.querySelectorAll(selector);
	}
	
	function getQuerySelector(callback){
		// summary:
		//		Get a querySelector to use in this module.
		// description:
		//		Look for a querySelector to use in this module.  Will fallback
		//		to the native one (if available) but will try to use a Dojo one
		//		first and then jQuery (if RequireJs is available).
		// todo:
		//		Add handling for no native querySelector
		//		Load jQuery directly instead of via requireJs.
		// callback: Function
		//		Callback to fire when querySelector is available.  Supplies
		//		the actual selector as the callback argument.
		
		if(isProperty(global, "dojo")){
			callback(dojo.query);
		}else if(isProperty(global, "dojoConfig")){
			require(["dojo/query"], callback);
		}else if(typeof global.$ === "function"){
			callback($);
		}else if((typeof global.define === "function") && (typeof global.require === "function")){
			define.amd = true;
			require(["/apps/lib/lib/jquery/jquery.min.js"], callback);
		}else if(isProperty(global.document, "querySelectorAll")){
			callback(querySelector);
		}else{
			appendScript({
				"src": "/apps/lib/lib/jquery/jquery.min.js",
				"onload": function(){
					callback(global.$);
				}
			});
		}
	}
	
	
	getQuerySelector(function(selector){
		$ = selector;
		if(isProperty(window, "dojo")){
			dojo.ready(function(){
				loadApps($);
			});
		}else{
			ready(function(){
				loadApps($);
			});
		}
	});
})(window);