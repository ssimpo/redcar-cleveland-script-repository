console.log("HELLO");

(function(){
	function isProperty(obj, key){
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
	
	function findAngularApps($) {
		return $("[ng-app]");
		
	}
	
	if(isProperty(window, "require")){
		require(["dojo/ready", "dojo/query"], function(ready, $){
			ready(function(){
				var apps = findAngularApps($);
				if(apps.length > 0){
					console.log(1, apps);
				}
			});
		});
	}else{
		dojo.ready(function(){
			var apps = findAngularApps(dojo.query);
			if(apps.length > 0){
				console.log(2, apps);
			}
		});
	}
})();