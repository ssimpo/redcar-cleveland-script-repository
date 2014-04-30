"use strict";

describe("Angular Loader Tester", function(){
	var jQueryLib = "http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js";
	
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
	
	function testQuerySelector(selector) {
		var article = document.createElement("article");
		article.innerHTML = "<h1 class=\"TEST\"></h1><p>Test</p><p>More test</p>";
		
		var test = selector("[class=TEST]", article);
		expect(test.length).toBe(1);
		expect(test[0].tagName.toLowerCase()).toBe("h1");
	}
	
	it("querySelector", function(){
		testQuerySelector(angularLoader.querySelector);
	});
	
	it("getQuerySelector", function(){
		angularLoader.libraryUrlOverride["jquery"] = jQueryLib;
		var selectorLoaded = false;
		var $;
		
		runs(function(){
			angularLoader.getQuerySelector(function(selector){
				$ = selector
				selectorLoaded = true;
			});
		});
		
		waitsFor(function(){
			return selectorLoaded;
		}, "querySelector to be loaded", 7000);
		
		runs(function(){
			testQuerySelector($);
		});
	});
	
	it("findAngularApps", function(){
		var selectorLoaded = false;
		angularLoader.libraryUrlOverride["jquery"] = jQueryLib;
		
		runs(function(){
			angularLoader.loadQuerySelector(function(){
				selectorLoaded = true;
			});
		});
		
		waitsFor(function(){
			return selectorLoaded;
		}, "querySelector to be loaded", 7000);
		
		runs(function(){
			var appId = angularLoader.angularAppId;
			var article = document.createElement("article");
			article.innerHTML = "<div "+appId+"=\"App1\"></div><section "+appId+"=\"App2\"></section><div "+appId+"=\"App3\"></div><div ng-app=\"App4\"></div>";
			
			var apps = angularLoader.findAngularApps(article);
			expect(apps.length).toBe(3);
			expect(apps[0]).toBeHtmlNode();
			expect(apps[1].tagName.toLowerCase()).toBe("section");
			
			angularLoader.angularAppId = "ng-app";
			var apps = angularLoader.findAngularApps(article);
			expect(apps.length).toBe(1);
			angularLoader.angularAppId = appId ;
		});
	});
	
	it("loadProfile", function(){
	});
	
	it("executeProfile", function(){
	});
	
	it("loadApps", function(){
	});
	
	it("getProfileUrl", function(){
		expect(angularLoader.getProfileUrl("test"))
			.toBe(angularLoader.appsDir + "/test/app/profile.json");
		expect(angularLoader.getProfileUrl("test2"))
			.toBe(angularLoader.appsDir + "/test2/app/profile.json");
	});
	
	it("addAppPathToUrl", function(){
		expect(angularLoader.addAppPathToUrl("profile.json", "test"))
			.toBe(angularLoader.appsDir + "/test/app/profile.json");
		expect(angularLoader.addAppPathToUrl("profile2.json", "test2"))
			.toBe(angularLoader.appsDir + "/test2/app/profile2.json");
	});
	
	it("calculateLibraryPath", function(){
		delete angularLoader.libraryUrlOverride["jquery"];
		expect(angularLoader.calculateLibraryPath("jquery"))
			.toBe(angularLoader.appsDir + "/lib/lib/jquery/jquery.min.js");
		expect(angularLoader.calculateLibraryPath("jquery", false))
			.toBe(angularLoader.appsDir + "/lib/lib/jquery/jquery.js");
		
		angularLoader.libraryUrlOverride["jquery"] = jQueryLib;
		expect(angularLoader.calculateLibraryPath("jquery"))
			.toBe(jQueryLib);
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