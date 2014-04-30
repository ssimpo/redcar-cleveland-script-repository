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
	});
	
	it("placeNode", function(){
	});
	
	it("getNodeAttribute", function(){
	});
	
	it("querySelector", function(){
	});
	
	it("getQuerySelector", function(){
	});
	
	it("findAngularApps", function(){
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