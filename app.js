
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , strategy = require('passport-local-mongoose')
  , Editor = require('./models/Editor.js');

var app = express();

//HTTP authentication scheme
var httpAuth = express.basicAuth(function(user, pass) {
     return user === 'admin' && pass === 'hippo grasses upon the hill';
  });

app.configure(function(){
  app.set('port', process.env.PORT || 3333);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'i don\'t like hippos' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

passport.use(Editor.createStrategy());

passport.serializeUser(Editor.serializeUser());
passport.deserializeUser(Editor.deserializeUser());

// connect to db
// for local to work, mongod (mongodaemon) must be running on port 27017
var uristring =
  process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL  ||
  'mongodb://localhost/talentPool';

mongoose.connect(uristring, function(err, res) {
  if(err) console.log(err);
  //routes.importTalent();
});

app.get('/', routes.index);
app.post('/login', passport.authenticate('local'), routes.login);
app.get('/checkLogin', routes.checkLogin);
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/#/login?loggedout=true');
});

app.get('/sendmail', httpAuth, function(req, res) {
  require('./routes/mailer.js')();
  res.send("mail attempted. check logs.");
});

app.get('/partials/:partial', function(req, res) {
  res.render('partials/' + req.params.partial);
});

app.get('/data', routes.loadTalent);
app.get('/data/size', routes.dbSize);
app.get('/data/filter', routes.filterTalent);

app.get('/register', user.getSet);
app.post('/register', user.postSet);

app.post('/users/update', user.update);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
