var fs = require("fs");
var Q = require("q");
var mv = require("mv");

var globalReadFileSettings = {"encoding":"utf-8", "flag":"r"};
var currentDirectoryPath = process.cwd().replace(/\\/g,"/") + "/";

loadSettings(["bower.json",".bowerrc"]).then(function(settings){
    var devLibraryPaths = getDevLibraryPaths(settings);
    
    devLibraryPaths.forEach(function(mover){
        console.log("Moving: " + mover.from + ", To: " + mover.to);
        Q.nfcall(mv, mover.from, mover.to).then(undefined, function(){
            console.error(err);
        });
    });
});

function getDevLibraryPaths(settings){
    var paths = [];
    
    for(var library in settings.devDependencies){
        paths.push({
            "from": currentDirectoryPath + settings.directory + "/" + library,
            "to": currentDirectoryPath + settings.directoryDev + "/" + library
        });
    }
    
    return paths
}

function loadSettings(paths, readFileSettings){
    readFileSettings = (readFileSettings || globalReadFileSettings);
    
    var qArray = createFileLoadingPromiseArray(paths, readFileSettings);
    var deferred = Q.defer();
    Q.all(qArray).then(function(data){
        settings = parseSettings(data);
        deferred.resolve(settings);
    });
    
    return deferred.promise;
}

function createFileLoadingPromiseArray(paths, readFileSettings){
    var qArray = [];
    
    paths.forEach(function(path){
        qArray.push(Q.nfcall(fs.readFile, path, readFileSettings));
    });
    
    return qArray;
}

function parseSettings(data){
    var mergedSettings = {};
    
    data.forEach(function(txt){
        mergedSettings = mergeObjects(mergedSettings, JSON.parse(txt));
    });
    
    return mergedSettings
}

function mergeObjects(obj1, obj2){
    var obj3 = {};
    
    for(var attrname in obj1){
        if (obj1.hasOwnProperty(attrname)){
            obj3[attrname] = obj1[attrname];
        }
    }
    
    for(var attrname in obj2) {
        if (obj2.hasOwnProperty(attrname)){
            obj3[attrname] = obj2[attrname];
        }
        
    }
    
    return obj3;
}