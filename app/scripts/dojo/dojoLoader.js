require([
	"bootstrap",
	"dojo/parser",
	"dojo/ready"
], function(dbootstrap, parser, ready){
	ready(function(){
		parser.parse();
	})
});