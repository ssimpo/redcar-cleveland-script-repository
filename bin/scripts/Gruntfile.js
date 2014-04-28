module.exports = function(grunt){
	grunt.loadNpmTasks('grunt-gaze');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-concurrent');
	
	grunt.initConfig({
		"pkg": grunt.file.readJSON('package.json'),
		
		"less": {
			"default": {
				"options": {
					"paths": ["<%= pkg.app.directories.styles %>/"],
					"compress": true,
					"cleancss": true,
					"strictImports": true
				},
				"files": [{
					"expand": true,
					"src": ["<%= pkg.app.directories.styles %>/*.less"],
					"dest": "<%= pkg.app.directories.styles %>/",
					"ext": ".css"
				}],
			},
		},
		
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
		},
		
		"gaze": {
			"compileless": {
				"files": ["<%= pkg.app.directories.styles %>/*.less"],
				"tasks": ["compileless"],
				"options": {
					"spawn": true
				}
			}
		},
		
		"concurrent": {
			"watch": {
				"tasks": ["gaze:compileless", "karma:unit"],
				"options": {
					"logConcurrentOutput": true
				}
			}
		}

	});
	
	grunt.registerTask('compileless', 'Compile less files into css', ['less']);
	grunt.registerTask("unit-tests", ["karma:unit"]);
	grunt.registerTask("unit-tests-ie", ["karma:ie-tests"]);
	grunt.registerTask("unit-tests-all", ["karma:all"]);
	grunt.registerTask('watch-less', 'Watcher that compiles less files into css', ['compileless','gaze:compileless']);
	grunt.registerTask('watch', 'File save operations', ['concurrent:watch']);
};