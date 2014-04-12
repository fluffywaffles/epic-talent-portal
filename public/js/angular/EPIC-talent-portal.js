function router($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: '/partials/list',
    controller: 'applicantList'
  });
}

var app = angular.module('EPIC-talent-portal', ['ngRoute', 'ui.bootstrap'], router);

app.factory("Talent", ["$http", function($http) {
  var listData;
  var loaded;
  var queryOffset;
  var prevQuery;
  return {
    load: function(cb, forceReload) {
      if(listData && !forceReload) {
        return cb(listData);
      }
      $http.get('/data').success(function(data) {
        listData = data;
        loaded = listData.length;
        cb(listData);
      });
    },
    
    next: function(limit, cb) {
      if(typeof limit === 'function') cb = limit, limit = null;
      var reqstr;
      if(prevQuery) reqstr = '/data/filter?' + prevQuery + '&';
      else reqstr = '/data?';
      reqstr += 'offset=' + loaded + (limit ? '&noLimit=true' : '');
      $http.get(reqstr).success(function(data) {
        loaded += data.length;
        cb(data);
      });
    },
    
    dbSize: function(cb) {
      $http.get('/data/size').success(function(data) {
        cb(data);
      });
    },
    
    sizeQuery: function(optsString, cb) {
      if(prevQuery === optsString) cb('no change');
      $http.get('/data/size?'+optsString).success(function(data) {
        cb(data);
      });
    },
    
    query: function(optsString, cb) {
      if(prevQuery !== optsString) loaded = 0, queryOffset = 0, prevQuery = optsString;
      var reqstr = '/data/filter?' + optsString 
        + '&offset=' + queryOffset;
      $http.get(reqstr).success(function(data) {
        loaded = data.length;
        cb(data);
      });
    }
  }
}]);

app.controller('applicantList', function($scope, Talent) {
  function queryStringify(queryObj) {
    var queryArr = [];
    $.each(queryObj, function(key, value) {
      queryArr.push(key + '=' + value);
    });
    console.log(queryArr);
    return queryArr.join('&')
  }
    
  console.log(Talent);
  Talent.load(function(data) {
    $scope.apps = data;
    console.log($scope.apps);
    console.log('loaded talent');
    $scope.loadedApps = true;
    $scope.filterInclude = function(actual, expected) {
      if(expected) return actual === 'No';
      return actual;
    }
    $scope.nextPage = function() { 
      Talent.next(function(data) {
        console.log(data);
        $scope.apps = $scope.apps.concat(data);
        console.log($scope.apps);
      });
    };
    $scope.loadAll = function() {
      Talent.next('load all', function(data) {
        $scope.apps = $scope.apps.concat(data);
        console.log('Errthing loaded.');
      });
    };
    Talent.dbSize(function(data) {
      console.log(data);
      $scope.dbSize = data;
    });
    $scope.toUpperCase = function(str) {
      return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
    //paramses is an object
    $scope.query = function(paramses) {
      Talent.query(queryStringify(paramses), function(data) {
        console.log(data);
        $scope.apps = data;
      });
    };
    
    $scope.$watchCollection('search', function(searchObj) {
      if(!$.isEmptyObject(searchObj)) {
        Talent.sizeQuery(queryStringify(searchObj), function(data) {
          if(data !== 'no change')
            console.log(data),
            $scope.dbSize = data;
        });
        $scope.query(searchObj);
      }
    });
  });
});