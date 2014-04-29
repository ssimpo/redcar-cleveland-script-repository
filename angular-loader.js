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
	//		Create Unit Tests
	
	var module = this;
	var apps = [];
	var hasTestsCached = {};
	var $;
	var angularAppId = "rcbc-app";
	var XMLHttpFactories = [
		function(){return new XMLHttpRequest()},
		function(){return new ActiveXObject("Msxml2.XMLHTTP")},
		function(){return new ActiveXObject("Msxml3.XMLHTTP")},
		function(){return new ActiveXObject("Microsoft.XMLHTTP")}
	];
	var loadedScripts = {};
	
	var hasTests = {
		"requireJs": function(){
			// summary:
			//		Is requireJs loaded and available.
			// returns: Boolean
			
			hasTestsCached["requireJs"] = ((typeof global.define === "function") && (typeof global.require === "function"));
			return hasTestsCached["requireJs"];
		},
		"dojo18": function(){
			// summary:
			//		Is Dojo1.8+ available.
			// returns: Boolean
			
			hasTestsCached["dojo18"] = (isProperty(window, "dojoConfig") && hasRequireJs());
			return hasTestsCached["dojo18"];
		},
		"dojo15": function(){
			// summary:
			//		Is Dojo1.5 available.
			// returns: Boolean
			
			hasTestsCached["dojo15"] = isProperty(global, "dojo");
			return hasTestsCached["dojo15"];
		},
		"jsonParser": function(){
			// summary:
			//		Is native JSON Parser available.
			// returns: Boolean
			
			hasTestsCached["jsonParser"] = isProperty(global, "JSON");
			return hasTestsCached["jsonParser"];
		},
		"querySelectorAll": function(){
			// summary:
			//		Is native dom query selector (all) available
			// returns: Boolean
			
			hasTestsCached["querySelectorAll"] = isProperty(global.document, "querySelectorAll");
			return hasTestsCached["querySelectorAll"];
		},
		"ie": function(){
			// summary:
			//      Get the Internet Explorer version (or false if other browser).
			// note:
			//      Code largely taken from dojo._base.sniff.
			// returns: integer
			//      Version number
			
			var isIE;
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
        
			hasTestsCached["ie"]  = (((isIE == undefined) || (isIE == 0)) ? false : isIE);
        
			return hasTestsCached["ie"];
		}
	};
	
	function has(test){
		// summary:
		//		Perform a test, either using the cache of the previous test or
		//		performing a new test.
		// test: String
		//		Test to perform.
		// returns: Mixed
		//		Test result
		// throws:
		//		If no test found will throw an error.
		
		if(isProperty(hasTestsCached, test)){
			return hasTestsCached[test];
		}else if(isProperty(hasTests, test)){
			return hasTests[test]();
		}
		
		throw "Test: " + test + " not found."
	}
	
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
	
	function appendScript(constr){
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
        
		if(!isProperty(loadedScripts, constr.src)){
			loadedScripts[constr.src] = true;
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
		
		return null;
    }
	
	function addOnloadFunction(node, onload, context){
		// summary:
		//		Add an onLoad function to a node with a specified
		//		context (optional).
		// description:
		//		Add an onLoad function to a node with a specified context. This
		//		is a cross-browser solution that should work in IE8.
		// node: Object XMLDOMNode
		//		The node to add an onLoad function to.
		// onload: Function
		//		The onload function to apply.
		// context: Object|undefined
		//		Context to bind the onload function to.
		
        var done = false;
        context = ((context === undefined) ? this : context);
            
        var boundOnload = bind(context, onload);
        var func = function(e, detach){
            if(!done && (!node.readyState || node.readyState === "loaded" || node.readyState === "complete")){
                done = true;
				detach();
                boundOnload();
            }
        };
        
		on((has("ie") ? "readystatechange" : "load"), func, node, context);
    }
	
	function on(eventName, func, subject, context){
		// summary:
		//		Cross-browser event attaching function.
		// todo:
		//		Detach is not robust when not using detachEvent
		//		or removeEventListener.
		// eventName: String
		//		Name of event to attach to.
		// func: Function
		//		Event function to call on the event.
		// subject: Object XMLDOMNode | Mixed
		//		The node or object to attach the event to.
		// context: Object | Undefined
		//		Context to attach the event function to (defaults to
		//		browser default).
		
		var returner = {};
		func = ((context !== undefined) ? bind(context, func) : func);
		onEventName = "on" + eventName;
		attachFunc = function(){
			func.call(subject);
		};
		
		if(subject.attachEvent){
			returner.detach = function(){
				subject.detachEvent(onEventName, func);
			};
			subject.attachEvent(onEventName, function(e){
				attachFunc(e, returner.detach);
			});
		}else if(subject.addEventListener){
			returner.detach = function(){
				subject.removeEventListener(eventName, func);
			};
			subject.addEventListener(eventName, function(e){
				func(e, returner.detach);
			}, false);
		}else{
			var oldFunc = subject[onEventName];
			returner.detach = function(){
				subject[onEventName] = oldFunc;
			};
			
			if(typeof oldFunc !== "function"){
				subject[onEventName] = function(e){
					attachFunc(e, returner.detach);
				}
			}else{
				subject[onEventName] = function(){
					oldFunc();
					attachFunc(e, returner.detach);
				};
			}
			
		}
		
		return returner;
	}
	
	function getHeadNode(){
		// summary:
		//		Get the dom head element.
		// returns: XMLDOMNode
		//		The head node.
		
		return global.document.getElementsByTagName("head")[0];
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
		// callback: Function
		//		Callback to fire when querySelector is available.  Supplies
		//		the actual selector as the callback argument.
		
		if(has("dojo15")){
			callback(dojo.query);
		}else if(has("dojo18")){
			require(["dojo/query"], callback);
		}else if(typeof global.$ === "function"){
			callback(global.$);
		}else if(has("requireJs")){
			define.amd = true;
			require(["/apps/lib/lib/jquery/jquery.min.js"], callback);
		}else if(has("querySelectorAll")){
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
	
	function findAngularApps(context) {
		// summary:
		//		Find the angular apps on the current page.
		// returns: Array
		//		The nodes found by the querySelector.
		
		context = ((context === undefined) ? global.document : context);
		
		return $("["+angularAppId+"]", context);
	}
	
	function loadProfile(appDom, callback){
		// summary:
		//		Load a profile and then fire the callback passing the profile.
		// appDom: Object XMLDOMNode
		//		The dom node representing the app for which a profile is needed.
		// callback: Function
		//		The callback to fire when the profile is loaded.
		
		var appName = getNodeAttribute(appDom, angularAppId);
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
				for(var i = 0; i < apps.length; i++){
					try{
						angular.bootstrap(apps[i].appNode, [apps[i].appName]);
					}catch(e){ }
				}
				callback();
			}
		}
		
		function loader(i){
			return function(){
				appendScript({
					"onload": runNext,
					"src": location.protocol+"//"+location.host+mids[i]
				});
			};
		}
		
		for(var i = 0; i < mids.length; i++){
			loaders.push(loader(i));
		}
		
		runNext();
	};
	
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
		
	function calculateLibraryPath(id, useMin){
		// summary:
		//		Calculate the path to a given library.
		// id: String
		//		The name of the library.
		// useMin: Boolean | Undefined
		//		Use the minified version of the library (defaults to true).
		// returns: String
		//		The path to the library.
		
		useMin = ((useMin === undefined) ? true : useMin);
		
		return "/apps/lib/lib/" + id + "/" + id + (useMin?".min":"") + ".js";
	}
	
	function ajaxGet(src, callback, errCallback){
		// summary:
		//		Get a url, process as json and optionally fire callback or
		//		errCallback (on failure).
		// description:
		//		Use either dojo 1.8+ or 1.5 ajax code to load a json resource
		//		and optionally fire callback or errCallback (on failure).
		// src: String
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
		if(has("dojo15")){
			opts.load = callback;
			opts.error = errCallback;
			opts.url = src;
			dojo.xhrGet(opts);
		}else if(has("dojo18")){
			opts.method = "get";
			require(["dojo/query"], function(request){
				request(src, opts).then(callback, errCallback);
			});
		}else{
			sendRequest(src, function(data){
				callback(JSON.parse(data));
			}, errCallback);
		}
	}
	
	function sendRequest(src, callback, errCallback, postData){
		// summary:
		//		Native Ajax sending and handling function.
		// source:
		//		http://www.quirksmode.org/js/xmlhttp.html
		// src: String
		//		Resource path to load.
		// callback: Function
		//		The calLback to use on success. passes the loaded text.
		// errCallback: Function
		//		Failure callback.  Error passed to the error callback.
		// postData: String | undefined
		//		The data to post (if any)
		
		errCallback = ((errCallback === undefined) ? function(){} : errCallback);
		var request = createXMLHTTPObject();
		if(!request){
			errCallback();
		}
		
		var method = ((postData !== undefined) ? "POST" : "GET");
		request.open(method, src ,true);
		if(postData !== undefined){
			request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		}
		
		on("readystatechange", function(e, detach){
			if(request.readyState !== 4){
				return;
			}
			if((request.status !== 200) && (request.status !== 304)){
				errCallback(request);
			}
			detach();
			callback(request.responseText);
		}, request);
		
		if(request.readyState === 4){
			return;
		}
		request.send(postData);
	}

	function createXMLHTTPObject(){
		// summary:
		//		Create a Ajax loading object (cross-browser);
		// returns: Object
		//		The Ajax loading object.
		
		var xmlhttp = false;
		for(var i=0; i< XMLHttpFactories.length; i++){
			try{
				xmlhttp = XMLHttpFactories[i]();
			}catch(e){
				continue;
			}
			break;
		}
		return xmlhttp;
	}
	
	function ready(win, callback){
		// summary:
		//		Run a function after the dom has loaded.
		// description:
		//		Run a function after the dom has loaded.  Defaults to Dojo
		//		version of dom ready checking.  If Dojo not present will
		//		fallback to module version.
		// win: Object Window
		//		The window to wait for dom in.
		// callback: Function
		//		The callback function when the dom has loaded.
		
		if(has("dojo15")){
			dojo.ready(function(){
				callback();
			});
		}else if(has("dojo18")) {
			require(["dojo/ready"], function(ready){
				ready(function(){
					callback();
				});
			});
		}else{
			contentLoaded(win, function(){
				callback();
			});
		}
	}
	
	function contentLoaded(win, callback){
		// summary:
		//		Detect if the specified window has completely loaded the dom.
		// source:
		//		https://github.com/dperini/ContentLoaded/blob/master/src/contentloaded.js
		// win: Object Window
		//		The window to poll.
		// callback: Function
		//		The callback when loading is complete.
		
		var done = false;
		var top = true;
		var doc = win.document;
		var root = doc.documentElement;
		
		var init = function(e, detach){
			if (e.type === "readystatechange" && doc.readyState !== "complete"){
				return;
			}
			if(detach !== undefined) {
				detach();
			}
			if (!done && (done = true)){
				callback.call(win, e.type || e);
			}
		};
		
		if(doc.readyState === "complete"){
			callback.call(win, "lazy");
		}else{
			if(doc.createEventObject && root.doScroll){
				try {
					top = !win.frameElement;
				}catch(e){ }
				if(top){
					contentLoadedPoll(root, init);
				}
			}
			
			on("DOMContentLoaded", init, doc);
			on("readystatechange", init, doc);
			on("load", init, win);
		}
	}
	
	function contentLoadedPoll(root, init){
		// summary:
		//		Content polling to see if it has completed loading.
		// root: Object XMLDOMNode
		//		The root of the document
		// init: Function
		
		try{
			root.doScroll("left");
		}catch(e){
			setTimeout(poll, 50);
			return;
		}
		init("poll");
	}
	
	function loadJsonParser(callback){
		// summary:
		//		Load a JSON parser if there is non nataive
		//		to current environment.
		// callback: Function
		//		Callback to fire when the parser is loaded.
		
		if(has("jsonParser")){
			callback();
		}else{
			appendScript({
				"src": calculateLibraryPath("json3"),
				"onload": function(){
					JSON3.runInContext(module);
					callback();
				}
			});
		}
	}
	
	function load(){
		// summary:
		//		Main module function.
		
		loadJsonParser(function(){
			getQuerySelector(function(selector){
				$ = selector;
				ready(global.window, loadApps);
			});
		});
	}
	
	load();
})(window);