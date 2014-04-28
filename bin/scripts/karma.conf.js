module.exports = function(config){
    config.set({
        "basePath": "../../",
        
        "files": [
            "app/scripts/lib/angular/angular.min.js",
            "app/scripts/app.js",
            "app/scripts/controllers/*.js",
            "app/scripts/controllers/**/*.js",
            "app/scripts/directives/*.js",
            "app/scripts/directives/**/*.js",
            "app/scripts/services/*.js",
            "app/scripts/services/**/*.js",
            "test/lib/angular-mocks/angular-mocks.js",
            "app/scripts/lib/angular-route/angular-route.min.js",
            "test/unit/**/*.js"
        ],
        
        "exclude" : [
            "app/scripts/lib/*.min.js",
            "test/lib/*.min.js"
        ],

        "autoWatch" : true,
        
        "frameworks": ["jasmine"],

        "browsers" : ["PhantomJS"],

        "plugins" : [
            "karma-chrome-launcher",
            "karma-phantomjs-launcher",
            "karma-firefox-launcher",
            "karma-jasmine",
            "karma-ie-launcher"
        ],

        "junitReporter" : {
            "outputFile": "test_out/unit.xml",
            "suite": "unit"
        }
    });
}