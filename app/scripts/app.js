"use strict";

var Cal = angular.module("Cal", ["ngRoute"]);

Cal.config(['$routeProvider', function($routeProvider){
    $routeProvider.when('/event', {
        templateUrl: '/apps/cal/app/views/event.html',
        controller: 'event'
    }).otherwise({
        redirectTo: '/event'
    });
}]);