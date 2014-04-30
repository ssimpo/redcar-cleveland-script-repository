module.exports = function(grunt){
	grunt.loadNpmTasks('grunt-karma');
	
	grunt.initConfig({
		"pkg": grunt.file.readJSON('package.json'),
		
		"karma": {
			"options": {
				"configFile": "./karma.conf.js"
			},
			"unit": {
				"autoWatch": true,
				"browsers" : ["PhantomJS"]
			},
			"ie-tests": {
				"autoWatch": false,
				"singleRun": true,
				"browsers" : ["IE"]
			},
			"all": {
				"autoWatch": false,
				"singleRun": true,
				"browsers" : ["Firefox","Chrome","IE"]
			}
		}

	});
	
	grunt.registerTask("unit-tests", ["karma:unit"]);
	grunt.registerTask("unit-tests-ie", ["karma:ie-tests"]);
	grunt.registerTask("unit-tests-all", ["karma:all"]);
	grunt.registerTask('watch', 'File save operations', ['karma:unit']);
};