"use strict";

describe("Angular Loader Tester", function(){
	it("has", function(){
	});
	
	it("isProperty", function(){
		var obj = {
			"TEST1": "TESTA",
			"TEST2": function(){},
			"TEST3": 1,
			"TEST4": {}
		}
		expect(angularLoader.isProperty(obj, "TEST1")).toBeTruthy();
		expect(angularLoader.isProperty(obj, "TEST2")).toBeTruthy();
		expect(angularLoader.isProperty(obj, "TEST3")).toBeTruthy();
		expect(angularLoader.isProperty(obj, "TEST4")).toBeTruthy();
		expect(angularLoader.isProperty(obj, "TEST5")).toBeFalsy();
	});
	
	it("bind", function(){
	});
	
	it("appendScript", function(){
	});
	
	it("addOnloadFunction", function(){
	});
	
	it("on", function(){
	});
	
	it("getHeadNode", function(){
		expect(angularLoader.getHeadNode()).toBeHtmlNode();
		expect(angularLoader.getHeadNode().tagName.toLowerCase()).toEqual("head");
	});
	
	it("placeNode", function(){
		var article = document.createElement("article");
		var p = document.createElement("p");
		article.appendChild(p);
		var b = document.createElement("b");
		var i = document.createElement("i");
		
		// Test default placing.
		angularLoader.placeNode(b, p);
		expect(p.innerHTML).toEqual("<b></b>");
		angularLoader.placeNode(i, p);
		expect(p.innerHTML).toEqual("<b></b><i></i>");
		
		// Test placing within another node.
		angularLoader.placeNode(i, p, "first");
		expect(p.innerHTML).toEqual("<i></i><b></b>");
		angularLoader.placeNode(i, p, "last");
		expect(p.innerHTML).toEqual("<b></b><i></i>");
		
		// Test placing before or after a node.
		angularLoader.placeNode(i, p, "after");
		expect(article.innerHTML).toEqual("<p><b></b></p><i></i>");
		angularLoader.placeNode(i, p, "before");
		expect(article.innerHTML).toEqual("<i></i><p><b></b></p>");
		
		// Test that text case of position string does not matter.
		angularLoader.placeNode(i, p, "AFTER");
		expect(article.innerHTML).toEqual("<p><b></b></p><i></i>");
		
		// Clean-up.
		article.removeChild(i);
		i = undefined;
		p.removeChild(b);
		b = undefined;
		article.removeChild(p);
		p = undefined
		article = undefined;
	});
	
	it("getNodeAttributeValue", function(){
		var article = document.createElement("article");
		article.setAttribute("class", "TEST");
		expect(angularLoader.getNodeAttributeValue(article, "class")).toEqual("TEST");
	});
	
	it("querySelector", function(){
	});
	
	it("getQuerySelector", function(){
	});
	
	it("findAngularApps", function(){
		var selectorLoaded = false;
		angularLoader.libraryUrlOverride["jquery"] = "http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js";
		
		
		runs(function(){
			angularLoader.loadQuerySelector(function(){
				selectorLoaded = true;
			});
		});
		
		waitsFor(function(){
			return selectorLoaded;
		}, "querySelector to be loaded", 7000);
		
		runs(function(){
			var article = document.createElement("article");
			article.innerHTML = "<div rcbc-app=\"App1\"></div><div rcbc-app=\"App2\"></div><div rcbc-app=\"App3\"></div>";
			
			var apps = angularLoader.findAngularApps(article);
			expect(apps.length).toEqual(3);
		});
	});
	
	it("loadProfile", function(){
	});
	
	it("executeProfile", function(){
	});
	
	it("loadApps", function(){
	});
	
	it("getProfileUrl", function(){
	});
	
	it("addAppPathToUrl", function(){
	});
	
	it("calculateLibraryPath", function(){
	});
	
	it("ajaxGet", function(){
	});
	
	it("sendRequest", function(){
	});
	
	it("createXMLHTTPObject", function(){
	});
	
	it("ready", function(){
	});
	
	it("contentLoaded", function(){
	});
	
	it("contentLoadedPoll", function(){
	});
	
	it("loadJsonParser", function(){
	});
	
	it("load", function(){
	});
});