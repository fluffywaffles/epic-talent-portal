function router($routeProvider) {
  $routeProvider.when('/login', {
    templateUrl: '/partials/login',
    controller: 'login'
  });
  $routeProvider.when('/edit/:email', {
    templateUrl: '/partials/edit',
    controller: 'edit'
  });
  $routeProvider.when('/list', {
    templateUrl: '/partials/list',
    controller: 'applicantList'
  });
  $routeProvider.when('/', {
    templateUrl: '/partials/register',
    controller: 'register'
  });
}

var app = angular.module('EPIC-talent-portal',
                         ['ngRoute', 'ui.bootstrap'],
                         router);

app.factory("Talent", ["$http", function($http) {
  var listData;
  var loaded;
  var queryOffset;
  this.prevQuery = '';
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
      if(typeof limit === 'function')
        cb = limit, limit = null;
      var reqstr;
      if(this.prevQuery) reqstr = '/data/filter?' + this.prevQuery + '&';
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
      if(this.prevQuery === optsString) cb('no change');
      $http.get('/data/size?' + optsString)
      .success(function(data) {
        cb(data);
      });
    },

    query: function(optsString, cb) {
      if(this.prevQuery !== optsString) loaded = 0,
        queryOffset = 0, prevQuery = optsString;
      var reqstr = '/data/filter?' + optsString
        + '&offset=' + queryOffset;
      $http.get(reqstr).success(function(data) {
        loaded = data.length;
        cb(data);
      });
    }
  }
}]);

app.service('shared', ["Talent", function(Talent) {
  var queryArr;

  this.queryStringify = function(queryObj) {
    queryArr = [];
    $.each(queryObj, function(key, value) {
      queryArr.push(key + '=' + value);
    });
    return queryArr.join('&');
  };

  this.filterInclude = function(app, exclude) {
    if(exclude.international) return !app.international;
    return true;
  };

  this.nextPage = function(next) {
    return function() {
      Talent.next(function(data) {
        next(data);
      });
    }
  };

  this.loadAll = function(next) {
    return function() {
      Talent.next('load all', function(data) {
        next(data);
        console.log('Errthing loaded.');
      });
    }
  };

  this.toUpperCase = function(str) {
    return str && str.replace(/\w\S*/g,
      function(txt){
        return txt.charAt(0).toUpperCase() +
        txt.substr(1).toLowerCase();});
  };

  this.dbSize = function(next) {
    Talent.dbSize(function(data) {
      next(data);
    });
  };

  this.query = function(paramses, next) {
    Talent.query(this.queryStringify(paramses), function(data) {
      next(data);
    });
  };
}]);

app.service('session', ['$http', function($http) {
  this.user;

  var self = this;

  this.setUser = function(userObj) {
    this.user = angular.copy(userObj);
  };

  this.getUser = function() {
    return this.user;
  };

  this.clear = function() {
    this.user = undefined;
  };

  this.checkLogin = function(cb) {
    $http.get('/checkLogin')
    .success(function(userData) {
      self.setUser(userData);
      cb && cb();
    })
    .error(function() {
      console.log('not logged in; sorry');
      cb && cb();
    })
  }
}]);

app.controller('applicantList',
               ["$scope", "Talent", "shared", "$location", 'session',
function($scope, Talent, shared, $location, session) {


  Talent.prevQuery = '';

  session.checkLogin(function () {

    var u = session.getUser();

    if(! u) {
      $location.path('login');
      return;
    }
    if (! (u.isAdmin || u.startup)) {
      alert("Forbidden.");
      $location.path('edit/'+u.email);
      return;
    }

    if(u.isAdmin) {
      $scope.editPage = function(id) {
        console.log('EDIT ' + id);
        $location.path('edit/'+id);
      }
    }

    var filters = $('.top-fix');
    var cacheWidth = $('header').width();
    var subhead2 = $($('h2')[1]);

    function atElement(el, f, atbottom, reverse){
      var t = atbottom === undefined ? 0 : $(el).height();
      var reverse = reverse === undefined ? false : true;
      var pos = window.scrollY, off = $(el).offset().top+t;
      if ((reverse && pos <= off) || (!reverse && pos >= off)) f();
    }

    $(window).scroll(function(e) {
      atElement(filters, function() {
        filters.css({position:'fixed', top:'0', width: cacheWidth});
        });

      $(window).resize(function(e) {
        cacheWidth = $('header').width();
      });

      atElement(subhead2, function() {
        filters.removeAttr('style');
      }, 'at bottom', 'in reverse');
    });

    $scope.isAdmin = u.isAdmin;

    Talent.load(function(data) {

      $scope.apps = data;

      $scope.loadedApps = true;

      $scope.nextPage = shared.nextPage(function(data) {
        $scope.apps = $scope.apps.concat(data);
      });
      $scope.loadAll = shared.loadAll(function(data) {
        $scope.apps = $scope.apps.concat(data);
      });

      $scope.filterInclude = shared.filterInclude;
      $scope.toUpperCase = shared.toUpperCase;

      shared.dbSize(function(data) {
        $scope.dbSize = data;
      });

      $scope.$watchCollection('search', function(searchObj) {
        if(!$.isEmptyObject(searchObj)) {
          Talent.sizeQuery(shared.queryStringify(searchObj), function(data) {
            if(data !== 'no change') {
              $scope.dbSize = data.length > 0 ? data : 'No results!';
              shared.query(searchObj, function(data) {
                $scope.apps = data;
              });
            }
            else {
              shared.query(searchObj, function(data) {
                $scope.apps = $scope.apps.concat(data);
              });
            }
          });
        }
      });
    });
  });
}]);

app.controller('edit', ["$scope", "Talent", "shared", "$http", "$routeParams", "$location", "session", function($scope, Talent, shared, $http, $params, $location, session) {
  $scope.app = {};
  $scope.edit = {};

  session.checkLogin(function() {
    var u = session.getUser();

    console.log(u);

    if(! (u)) {
      $location.path('login');
      return;
    }

    // -- filepicker setup
    // API key for resume_portal
    filepicker.setKey('AVRqlhXowRme6yNY2qmrdz');
    $scope.pickFile = function() {
      filepicker.pick({
        mimetypes: ['text/plain',
                    'text/richtext',
                    'application/pdf',
                    'text/pdf'],
        container: 'modal',
        services: ['COMPUTER', 'GMAIL', 'BOX'
                   , 'DROPBOX', 'GOOGLE_DRIVE'
                   , 'SKYDRIVE', 'EVERNOTE'
                   , 'CLOUDDRIVE']
      },
      function(InkBlob) {
        $scope.$apply(function() {
          // update $scope inside $apply
          $scope.uploadedDoc = InkBlob;
          $scope.edit.raw.resume = InkBlob;
        });
      },
      function(PFError) {
        console.log(PFError.toString());
      });
    };

    $scope.isAdmin = u.isAdmin;

    $scope.toUpperCase = shared.toUpperCase;

    shared.query({email: $params.email}, function(data) {
      $scope.app = data[0];
      $scope.edit = angular.copy($scope.app);
      delete $scope.edit._id;
    });

    $scope.saveEdits = function() {
      if(u.email === $params.email || u.isAdmin) {
        $http.post('/users/update',
                   {email: $params.email, updates: $scope.edit})
        .success(function(data) {
          console.log(data);
          $scope.app = $.extend($scope.app, data);
          $scope.message = 'Changes saved.';
        })
        .error(function(err) {
          console.log(err);
        });
      }
    }
  });

}]);

app.controller('login', ["$scope", "$http", "shared", "$location", "session",
function($scope, $http, shared, $location, session) {

  $location.search().loggedout
    ? $scope.message = 'Successfully logged out.'
    : $scope.message = '';

  session.checkLogin(function() {

    var u = session.getUser();

    if (u) {
      if (u.startup) $location.url('list');
      else $location.url('edit/' + u.email);
    }

    $scope.submit = function() {
      $scope.message = 'Logging you in...';
      if (! ($scope.user.username && $scope.user.password)) {
        $scope.message = 'Error: please input a username and password.';
        return;
      }
      // TODO(jordan): re-route login
      $http.post('/login', $scope.user)
      .success(function(data) {
        session.setUser(data);
        var u = session.getUser();
        if(u.startup)
          $location.url('list');
        else
          $location.url('edit/' + u.email);
      })
      .error(function(error) {
        console.log(error);
        $scope.message = 'Error: Invalid user or password.';
      });
    };
  });
}]);

app.controller('register', ["$scope", "$http", "shared", "$location", "session", "$timeout",
function($scope, $http, shared, $location, session, $timeout) {

  $scope.message = '';
  $scope.user = {};

  if(! ($scope.req && $scope.req.email))
    $scope.message = "Bad ID. No account can be created for this URL. If you copied this URL from a link, please double check its accuracy.";

  else {
    $scope.user.username = $scope.req.email;
    $scope.user.email   = $scope.req.email;
    $scope.user.special = $scope.req.special;
    $scope.user.startup = $scope.req.startup;

    $scope.submit = function() {
      $scope.message = 'Registering...';
      if (!$scope.user.password) {
        $scope.message = 'Error: please input a desired password.';
        return;
      }
      // TODO(jordan): registration needs to be re-routed
      $http.post('/register', $scope.user)
      .success(function(data) {
        if(data.error) {
          $scope.message = data.error;
          if(data.error.message.indexOf("User already exists with name") === 0) {
            $scope.message = "Just a moment: redirecting you to log in; you are already registered...";
            $timeout(function() {$location.url('login');}, 2500);
          }
        } else {
          session.setUser(data);
          var u = session.getUser();
          if(u.startup) {
            $location.url('list');
          }
          else {
            $location.url('edit/'+u.email);
          }
        }
      })
      .error(function(error) {
        console.log(error);
        $scope.message = 'Error: bad password or internal error.';
      });
    };
  }
}]);

// NOTE(jordan): camelCase to Human Readable
app.filter('camelToHuman', function () {
  return function(input) {
    // NOTE(jordan): for whatever reason, a handful of people don't have majors (like 2 people), so guard against falsy
    return input && input.charAt(0).toUpperCase() + input.slice(1).replace(/[a-z]([A-Z])/g, function(a) { return a.charAt(0) + ' ' + a.slice(1); });
  }
});
