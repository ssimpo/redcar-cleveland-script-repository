module.exports = function(config){
    config.set({
        "basePath": "../../",
        
        "files": [
            "angular-loader.js",
            "test/unit/**/*.js"
        ],
        
        "exclude" : [
            "/**/*.min.js"
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