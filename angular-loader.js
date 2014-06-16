(function(global){
	"use strict";
	
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
	
	var $;
	
	var module = {
		apps: [],
		query: false,
		hasTestsCached: {},
		angularAppId: "rcbc-app",
		XMLHttpFactories: [
			function(){return new global.XMLHttpRequest();},
			function(){return new global.ActiveXObject("Msxml2.XMLHTTP");},
			function(){return new global.ActiveXObject("Msxml3.XMLHTTP");},
			function(){return new global.ActiveXObject("Microsoft.XMLHTTP");}
		],
		loadedScripts: {},
		libraryUrlOverride: {},
		appsDir: "/apps",
		
		hasTests: {
			"isJasmineTest": function(){
				// summary:
				//		Is this running in test suit (Jasmine)?
				// returns: Boolean
				
				return (
					(typeof global.describe === "function") &&
						(typeof global.it === "function")
				);
			},
			"requireJs": function(){
				// summary:
				//		Is requireJs loaded and available.
				// returns: Boolean
				
				return (
					(typeof global.define === "function") &&
						(typeof global.require === "function")
				);
			},
			"dojo18": function(){
				// summary:
				//		Is Dojo1.8+ available.
				// returns: Boolean
				
				return (
					module.isProperty(global.window, "dojoConfig") &&
						module.has("requireJs")
				);
			},
			"dojo15": function(){
				// summary:
				//		Is Dojo1.5 available.
				// returns: Boolean
				
				return module.isProperty(global, "dojo");
			},
			"jsonParser": function(){
				// summary:
				//		Is native JSON Parser available.
				// returns: Boolean
				
				return module.isProperty(global, "JSON");
			},
			"querySelectorAll": function(){
				// summary:
				//		Is native dom query selector (all) available
				// returns: Boolean
				
				return module.isProperty(global.document, "querySelectorAll");
			},
			"webkit": function(){
				// summary:
				//		Get the WebKit version number if using webkit
				
				var userAgent = global.navigator.userAgent;
				return (parseFloat(userAgent.split("WebKit/")[1]) || undefined);
			},
			"opera": function(){
				// summary:
				//		Get the Opera version number if using webkit
				
				var userAgent = global.navigator.userAgent;
				var appVersion = parseFloat(global.navigator.appVersion);
				return (
					(appVersion >= 9.8) ?
						(parseFloat(userAgent.split("Version/")[1]) || appVersion)
						: appVersion
				);
			},
			"ie": function(){
				// summary:
				//      Get the Internet Explorer version (or false if other browser).
				// note:
				//      Code largely taken from dojo._base.sniff.
				// returns: integer
				//      Version number
				
				var isIE;
				var appVersion = global.navigator.appVersion;
				if(!module.has("webkit")){
					if(!module.has("opera")){
						if(global.document.all) {
							isIE = (parseFloat(appVersion.split("MSIE ")[1]) || undefined);
							var mode = global.document.documentMode;
							if(mode && mode !== 5 && Math.floor(isIE) !== mode){
								isIE = mode;
							}
						}
					}
				}
			
				return (((isIE === undefined) || (isIE === 0)) ? false : isIE);
			}
		},
		
		has: function(test, reset){
			// summary:
			//		Perform a test, either using the cache of the previous test or
			//		performing a new test.
			// test: String
			//		Test to perform.
			// reset: Boolean
			//		Reset the cache and perform the test again.
			// returns: Mixed
			//		Test result
			
			reset = ((reset === undefined) ? false : true);
			if((!module.isProperty(module.hasTestsCached, test)) || (reset)){
				module.hasTestsCached[test] = module.hasTests[test]();
			}
			
			return module.hasTestsCached[test];
		},
		
		isProperty: function(obj, key){
			// summary:
			//		Test if a key is a property of an object.
			// obj: Object
			//		Object to test for property.
			// key: String
			//		Property value to test for.
			// returns: Boolean
			
			return Object.prototype.hasOwnProperty.call(obj, key);
		},
		
		bind: function(context, func){
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
			
			if(module.isProperty(Function.prototype, "bind")){
				return func.bind(context);
			}
		
			var slice = [].slice;
			var args = slice.call(arguments, 2);
			var Nop = function () {};
			var bound = function () {
				return func.apply(
					((this instanceof Nop) ? this : (context || {})),
					args.concat(slice.call(arguments))
				);
			};
		
			Nop.prototype = func.prototype;
			bound.prototype = new Nop();
		
			return bound;
		},
		
		appendStyle: function(constr){
			constr.position = (module.isProperty(constr, "position") ? constr.position : "last");
			constr.node = ((module.isProperty(constr, "node")) ? constr.node : module.getHeadNode());
			
			var link = global.document.createElement("link");
			link.type = "text/stylesheet";
			link.rel = "stylesheet";
			link.href = constr.href;
			
			module.placeNode(link, constr.node, constr.position);
			
			return link;
		},
		
		appendScript: function(constr){
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
				
			if(!module.isProperty(module.loadedScripts, constr.src)){
				module.loadedScripts[constr.src] = true;
				var context = ((module.isProperty(constr, "context")) ? constr.context : this);
				var position = (module.isProperty(constr, "position") ? constr.position : "last");
				constr.node = ((module.isProperty(constr, "node")) ? constr.node : module.getHeadNode());
    
				var script = global.document.createElement("script");
				script.type = "text/javascript";
				script.src = constr.src;
				constr.async = ((module.isProperty(constr, "async")) ? constr.async : false);
				
				if(constr.async){
					script.async = true;
				}
				if(module.isProperty(constr, "id")){
					script.id = constr.id;
				}
				if(constr.onload){
					module.addOnloadFunction(script, constr.onload, context);
				}
				if(constr.onerror){
					script.onerror = module.bind(context, constr.onerror);
				}
				
				module.placeNode(script, constr.node, position);
				
				return script;
			}
		
			return null;
		},
		
		addOnloadFunction: function(node, onload, context){
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
            
			var boundOnload = module.bind(context, onload);
			var func = function(e, detach){
				if(!done && (!node.readyState || node.readyState === "loaded" || node.readyState === "complete")){
					done = true;
					detach();
					boundOnload();
				}
			};
        
			module.on((module.has("ie") ? "readystatechange" : "load"), func, node, context);
		},
		
		on: function(eventName, func, subject, context){
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
		
			func = ((context !== undefined) ? module.bind(context, func) : func);
			var returner = {};
			var onEventName = "on" + eventName;
			var attachFunc = function(){
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
					};
				}else{
					subject[onEventName] = function(e){
						oldFunc();
						attachFunc(e, returner.detach);
					};
				}
			}
				
			return returner;
		},
		
		getHeadNode: function(){
			// summary:
			//		Get the dom head element.
			// returns: XMLDOMNode
			//		The head node.
			
			return global.document.getElementsByTagName("head")[0];
		},
		
		placeNode: function(node, refnode, position) {
			// summary:
			//		Place a node in the Dom with reference to another node.
			// node: Object XMLDOMNode
			//		The node to place.
			// refNode: Object XMLDOMNode
			//		The reference node.
			// position: String|undefined
			//		Where to place node in relation to refNode.  Four options:
			//			first: Place node as the first child of refNode.
			//			last: Place node as the last child of refNode.
			//			before: Place node before refNode in the Dom tree.
			//			after: Place node after refNode in the Dom tree
		
			position = ((position === undefined) ? "last": position);
			
			switch(position.toLowerCase()){
				case "first":
					refnode.insertBefore(node, refnode.firstChild);
					break;
				case "last":
					refnode.appendChild(node);
					break;
				case "before":
					refnode.parentNode.insertBefore(node, refnode);
					break;
				case "after":
					refnode.parentNode.insertBefore(node, refnode.nextSibling);
					break;
			}
		},
		
		getNodeAttributeValue: function(node, attribute){
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
			if(!result){
				var attributes = node.attributes;
				var length = attributes.length;
				for(var i = 0; i < length; i++){
					if(attributes[i].nodeName === attribute){
						result = attributes[i].nodeValue;
					}
				}
			}
			return result;
		},
		
		querySelector: function(selector, context){
			// summary:
			//		Polyfill for $ function using native querySelector.
			// selector: String
			//		The selection criteria
			// context: Object XMLDOMNode|Undefined
			//		The optional context for the query, defaults to document.
			// returns: Array
			//		The found XMLNodes.
			
			context = ((context === undefined) ? global.document : context);
			
			return context.querySelectorAll(selector, context);
		},
		
		getQuerySelector: function(callback){
			// summary:
			//		Get a querySelector to use in this module.
			// description:
			//		Look for a querySelector to use in this module.  Will fallback
			//		to the native one (if available) but will try to use a Dojo one
			//		first and then jQuery (if RequireJs is available).
			// callback: Function
			//		Callback to fire when querySelector is available.  Supplies
			//		the actual selector as the callback argument.
			
			if(module.has("dojo15")){
				callback(global.dojo.query);
			}else if(module.has("dojo18")){
				global.require(["dojo/query"], callback);
			}else if(typeof global.$ === "function"){
				callback(global.$);
			}else if(module.has("requireJs")){
				global.define.amd = true;
				global.require([module.calculateLibraryPath("jquery")], callback);
			}else if(module.has("querySelectorAll")){
				callback(module.querySelector);
			}else{
				module.appendScript({
					"src": module.calculateLibraryPath("jquery"),
					"onload": function(){
						callback(global.$);
					},
					"onerror": function(e){
						console.log(e);
					}
				});
			}
		},
		
		findAngularApps: function(context) {
			// summary:
			//		Find the angular apps on the current page.
			// returns: Array
			//		The nodes found by the querySelector.
			
			context = ((context === undefined) ? global.document : context);
			return $("["+module.angularAppId+"]", context);
		},
		
		loadProfile: function(appDom, callback){
			// summary:
			//		Load a profile and then fire the callback passing the profile.
			// appDom: Object XMLDOMNode
			//		The dom node representing the app for which a profile is needed.
			// callback: Function
			//		The callback to fire when the profile is loaded.
			
			var appName = module.getNodeAttributeValue(appDom, module.angularAppId);
			var appProfileUrl = module.getProfileUrl(appName);
			module.ajaxGet(appProfileUrl, function(data){
				var i;
				
				for (i = 0; i < data.scripts.length; i++) {
					data.scripts[i] = module.addAppPathToUrl(data.scripts[i], appName);
				}
				for (i = (data.libraries.length-1); i >= 0; i--) {
					var id = data.libraries[i];
					data.scripts.unshift(module.calculateLibraryPath(id));
				}
				for (i = 0; i < data.styles.length; i++) {
					data.styles[i] = module.addAppPathToUrl(data.styles[i], appName);
				}
				
				module.apps.push({
					"appName": appName,
					"appNode": appDom
				});
				callback(data);
			}, function(e){
				console.error(e);
			});
		},
		
		executeProfile: function(mids, callback){
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
					for(var i = 0; i < module.apps.length; i++){
						try{
							global.angular.bootstrap(module.apps[i].appNode, [module.apps[i].appName]);
						}catch(e){ }
					}
					callback();
				}
			}
			
			function loader(i){
				return function(){
					module.appendScript({
						"onload": runNext,
						"src": global.location.protocol+"//"+global.location.host+mids[i]
					});
				};
			}
			
			for(var i = 0; i < mids.length; i++){
				loaders.push(loader(i));
			}
			
			runNext();
		},
		
		loadStyles: function(styles){
			for(var i = 0; i < styles.length; i++){
				module.appendStyle({
					"href": styles[i]
				});
			}
		},
		
		loadApps: function(){
			// summary:
			//		Load up all the Angular applications on the current page.
			
			var apps = module.findAngularApps();
			var loader = function(profile){
				module.loadStyles(profile.styles);
				module.executeProfile(profile.scripts, function(){});
			};
			
			if(apps.length > 0){
				for(var i = 0; i < apps.length; i++){
					module.loadProfile(apps[i], loader);
				}
			}
		},
		
		getProfileUrl: function(appName){
			// summary:
			//		Get the profile url for a given app name.
			// appName: String
			//		Name of app to calculate profile url for.
			// returns: String
			//		The profile url.
			
			return module.addAppPathToUrl("profile.json", appName);
		},
		
		getQueryUrlPart: function(){
			// summary:
			//		Get the query part of the current url
			// returns: String
			//		The query as a string
			
			if(global.location.href.indexOf('#')){
				return global.location.href.slice(
					global.location.href.indexOf('?') + 1,
					global.location.href.indexOf('#')
				);
			}
			
			return global.location.href.slice(
				global.location.href.indexOf('?') + 1
			);
		},
		
		getQueryObjectFromString: function(txt, splitter, asigner){
			// summary:
			//		Get a query object from the supplied string.
			// description:
			//		Given a string, extract a query object from its contents.
			//		Expects a string in the normal url query-string format of
			//		key1=value1&key=value2&key3=value3.  Defaults to splitting
			//		the string into key/value pairs using '&' and splitting the
			//		key and value using '='.  These defaults can be overriden
			//		by supplying alternative splitter.
			// txt: String
			//		The query-string to extract an object from.
			// splitter: String
			//		Defaults to '&'.
			// asigner: String
			//		Defaults to '='
			// returns: Object
			//		The query object extracted from the supplied string.
			
			splitter = ((splitter === undefined) ? "&" : splitter);
			asigner = ((asigner === undefined) ? "=" : asigner);
			
			var hash = {};
			var query = txt.split(splitter);
			for(var i = 0; i < query.length; i++){
				var parts = query[i].split(asigner);
				hash[parts[0]] = parts[1];
			}
			
			return hash;
		},
		
		getQueryObject: function(){
			// summary:
			//		Get a query object from current browser query-string.
			// note:
			//		Will extract a second object for the parametre
			//		"angularClone", if it exists.  This object is split using
			//		',' for key/value and ':' to split the key and value.
			// returns: Object
			//		The current query object.
			
			var query = module.getQueryUrlPart();
			var hash = module.getQueryObjectFromString(query);
			
			if(module.isProperty(hash, "angularClone")){
				hash.angularClone = module.getQueryObjectFromString(
					hash.angularClone, ",", ":"
				);
			}
			
			return hash;
		},
		
		getClonePathPart: function(appName){
			// summary:
			//		Extract query parametres and add clone route to the url if
			//		one specified for the supplied Angular app.
			// appName: string
			//		The application to grab a clone path for.
			// returns: string
			//		The clone path, defaults to "".
			
			if(!module.query){
				module.query = module.getQueryObject();
			}
			if(module.isProperty(module.query, "angularClone")){
				if(module.isProperty(module.query.angularClone, appName)){
					return "/clones/" + module.query.angularClone[appName];
				}
			}
			
			return "";
		},
		
		addAppPathToUrl: function(url, appName){
			// summary;
			//		Add an app path (according to supplied app name) to the
			//		beginning of a url.
			// url: String
			//		The url to add to.
			// appName: String
			//		The app name to create paths for.
			// returns: String
			//		The calculated full relative path.
			
			return module.appsDir + "/" + appName + module.getClonePathPart(appName) + "/app/" + url;
		},
			
		calculateLibraryPath: function(id, useMin){
			// summary:
			//		Calculate the path to a given library.
			// id: String
			//		The name of the library.
			// useMin: Boolean | Undefined
			//		Use the minified version of the library (defaults to true).
			// returns: String
			//		The path to the library.
			
			if(module.isProperty(module.libraryUrlOverride, id)){
				return module.libraryUrlOverride[id];
			}
			
			useMin = ((useMin === undefined) ? true : useMin);
			return module.appsDir + "/lib/lib/" + id + "/" + id + (useMin?".min":"") + ".js";
		},
		
		ajaxGet: function(src, callback, errCallback){
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
			if(module.has("dojo15")){
				opts.load = callback;
				opts.error = errCallback;
				opts.url = src;
				global.dojo.xhrGet(opts);
			}else if(module.has("dojo18")){
				opts.method = "get";
				global.require(["dojo/query"], function(request){
					request(src, opts).then(callback, errCallback);
				});
			}else{
				module.sendRequest(src, function(data){
					callback(JSON.parse(data));
				}, errCallback);
			}
		},
		
		sendRequest: function(src, callback, errCallback, postData){
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
			var request = module.createXMLHTTPObject();
			if(!request){
				errCallback();
			}
			
			var method = ((postData !== undefined) ? "POST" : "GET");
			request.open(method, src ,true);
			if(postData !== undefined){
				request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			}
			
			module.on("readystatechange", function(e, detach){
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
		},
	
		createXMLHTTPObject: function(){
			// summary:
			//		Create a Ajax loading object (cross-browser);
			// returns: Object
			//		The Ajax loading object.
			
			var xmlhttp = false;
			for(var i=0; i< module.XMLHttpFactories.length; i++){
				try{
					xmlhttp = module.XMLHttpFactories[i]();
				}catch(e){
					continue;
				}
				break;
			}
			return xmlhttp;
		},
		
		ready: function(win, callback){
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
			
			if(module.has("dojo15")){
				global.dojo.ready(function(){
					callback();
				});
			}else if(module.has("dojo18")) {
				global.require(["dojo/ready"], function(ready){
					ready(function(){
						callback();
					});
				});
			}else{
				module.contentLoaded(win, function(){
					callback();
				});
			}
		},
		
		contentLoaded: function(win, callback){
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
						module.contentLoadedPoll(root, init);
					}
				}
				
				module.on("DOMContentLoaded", init, doc);
				module.on("readystatechange", init, doc);
				module.on("load", init, win);
			}
		},
		
		contentLoadedPoll: function(root, init){
			// summary:
			//		Content polling to see if it has completed loading.
			// root: Object XMLDOMNode
			//		The root of the document
			// init: Function
			
			try{
				root.doScroll("left");
			}catch(e){
				global.setTimeout(module.contentLoadedPoll, 50);
				return;
			}
			init("poll");
		},
		
		loadJsonParser: function(callback){
			// summary:
			//		Load a JSON parser if there is non nataive
			//		to current environment.
			// callback: Function
			//		Callback to fire when the parser is loaded.
			
			if(module.has("jsonParser")){
				callback();
			}else{
				module.appendScript({
					"src": module.calculateLibraryPath("json3"),
					"onload": function(){
						global.JSON3.runInContext(module);
						callback();
					}
				});
			}
		},
		
		loadQuerySelector: function(callback){
			// summary:
			//		Load and assign the querySelector into the module scope.
			
			module.getQuerySelector(function(selector){
				$ = selector;
				callback();
			});
		},
		
		load: function(){
			// summary:
			//		Main module function.
		
			module.loadJsonParser(function(){
				module.loadQuerySelector(function(){
					module.ready(global.window, module.loadApps);
				});
			});
		}
	};
	
	if(module.has("isJasmineTest")){
		global.angularLoader = module;
	}else{
		module.load();
	}
})(window);