var express = require('express');
var http = require("http");
var path = require('path');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var db = require("./db");
var nodemon = require("nodemon");
var cel = require('connect-ensure-login');
var bodyParser = require("body-parser");
var rand = require("./rand");
//var morgan = require('morgan');
//use passport for auth
passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'https://myvoting-app.herokuapp.com/login/facebook/return'
},
function(accessToken, refreshToken, profile, cb) {
  return cb(null, profile);
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);

});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);

});

// Create a new Express application.
var app = express();
//app.use(morgan('combined'));

app.use(express.static(path.join(__dirname, 'public')));
// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/favicon.ico', function(req, res) {
    res.sendStatus(204);
});
// Define routes.
app.get('/', function(req, res) {

  app.locals.session = req.sessionID;
  res.locals.isLogged = req.isAuthenticated();
  if (res.locals.isLogged){
    res.locals.currentUser = req.user.displayName;
    console.log(res.locals.currentUser);
  }
  db.getConnection(function(err, connection) {
if (err) throw err;
    connection.query("SELECT tabname FROM home", function (err, results){
      if (err) throw err;
      var poll = [];
      for (var i in results){

        for (var j in results[i]){
          poll.push(results[i][j]);

        }
      }
      connection.query("SELECT quest FROM home", function (err, results){
      if (err) throw err;
        var quest = [];
        for (var i in results){
          for (var j in results[i]){
            quest.push(results[i][j]);
          }
        }

        app.locals.poll = poll;
        app.locals.quest = quest;
        connection.release();
        res.render('index');
      });
    });
  });
});



app.get('/login/facebook',
passport.authenticate('facebook'));

app.get('/login/facebook/return',
passport.authenticate('facebook', { failureRedirect: '/failure' }),
cel.ensureLoggedIn(),
function(req, res) {
  res.locals.currentUser = req.user.displayName;
  console.log(res.locals.currentUser);
  res.locals.isLogged = req.isAuthenticated();
  res.redirect('/');
});

app.get('/logout',
function(req, res){
  req.session.destroy(function (err) {
    res.locals.isLogged = req.isAuthenticated();
    res.redirect('/');
  });
});
app.get("/mypolls", function(req, res) {
  console.log(req);
  res.locals.isLogged = req.isAuthenticated();

    res.locals.currentUser = req.user.displayName;
    console.log(res.locals.currentUser);

  console.log("mypolls");

  db.getConnection(function(err, connection) {
    if (err) throw err;
    connection.query("SELECT tabname FROM home WHERE author = ?", [res.locals.currentUser], function (err, results){
      if (err) throw err;
      console.log(results);
      var poll = [];
      for (var i in results){
        for (var j in results[i]){
          poll.push(results[i][j]);
        }
      }

      connection.query("SELECT quest FROM home WHERE author = ?", [res.locals.currentUser], function (err, results){
        if (err) throw err;
        console.log(results);
        var quest = [];
        for (var i in results){

          for (var j in results[i]){
            quest.push(results[i][j]);
          }
        }

        app.locals.poll = poll;
        console.log(app.locals.poll);
        app.locals.quest = quest;
        console.log(app.locals.quest);
        connection.release();
        res.render('mypolls');
      });
    });

  });




});
app.get("/newpoll", function(req, res) {
  console.log(req);
  res.locals.isLogged = req.isAuthenticated();

    res.locals.currentUser = req.user.displayName;
    console.log(res.locals.currentUser);

  res.render("newpoll");


});
app.post("/newpoll", function (req,res){
  console.log(req);
  res.locals.isLogged = req.isAuthenticated();

    res.locals.currentUser = req.user.displayName;
    console.log(res.locals.currentUser);

  console.log(req.body.options);
  var title = req.body.title;
  console.log(title);
  var trim = req.body.options.replace(/ /g,'');
  var options = trim.split(",");
  console.log(options);
  var pollid = rand();
  var create = 'CREATE TABLE ' + pollid + ' (id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, question varchar(255), author varchar(255)';
  var theend = ') DEFAULT CHARACTER SET utf8 ENGINE=InnoDB';
  var opt = "";
  for (var i=0;i<options.length;i++){

    opt += ',' + '`' + options[i] + '`' + ' int(11) DEFAULT 0';
  }
  var merge = create+opt+theend;
  db.getConnection(function(err, connection) {
    if (err) throw err;
    connection.query(merge, function (err, results){
      if (err) throw err;
      console.log(results);
      connection.query("INSERT INTO home (tabname,quest,author) VALUES (?,?,?)", [pollid, title, res.locals.currentUser], function (err, results){
        if (err) throw err;
        console.log(results);
        connection.query("INSERT INTO ?? (??,??) VALUES (?,?)", [pollid, 'question','author', title, res.locals.currentUser], function (err, results){
          if (err) throw err;
          console.log(results);
          connection.release();
        });
      });

    });


    res.redirect(pollid);
  });
});

app.post("/delete", function(req, res) {
  console.log(req);
  var strip = req.headers.referer.substr(req.headers.referer.lastIndexOf('/') + 1);
  console.log(strip);
  res.locals.isLogged = req.isAuthenticated();

    res.locals.currentUser = req.user.displayName;
    console.log(res.locals.currentUser);

  db.getConnection(function(err, connection) {
    if (err) throw err;
    connection.query("DROP TABLE ??", [strip], function (err, results){
      if (err) throw err;
      console.log(results);
      connection.query("DELETE FROM home WHERE tabname = ?", [strip], function (err, results){
        if (err) throw err;
        console.log(results);

      });
    });

connection.release();
    res.redirect("mypolls");
  });
});
app.post("/:id", function(req, res) {
  console.log(req);
  res.locals.isLogged = req.isAuthenticated();
  if (res.locals.isLogged){
    res.locals.currentUser = req.user.displayName;
    console.log(res.locals.currentUser);
  }
  var pollid = req.params.id;
  var key = Object.keys(req.body)[0];
  console.log(key);
  var val = req.body[key];
  console.log(val);
  var param = [pollid, val, val];
  db.getConnection(function(err, connection) {
    if (err) throw err;
    connection.query("UPDATE ?? SET ?? = ?? + 1", param, function (err, results){
      if (err) throw err;
      console.log(results);
      connection.release();
      res.redirect(pollid);
    });
  });
});

app.get("/:id", function(req, res) {
console.log(req);
  var id = req.params.id;
  console.log(id);
  console.log(req.body);
  res.locals.isLogged = req.isAuthenticated();

  if (res.locals.isLogged){
    res.locals.currentUser = req.user.displayName;
    console.log(res.locals.currentUser);
  }

  db.getConnection(function(err, connection) {
    if (err) throw err;


    connection.query("SELECT column_name FROM information_schema.columns WHERE table_name=?", [id], function (err, results){
      var arrKeys = [];
      var sortingArr = [];
      if (err) throw err;

      for (var i in results){
        for (var j in results[i]){
          arrKeys.push(results[i][j]);
          sortingArr.push(results[i][j]);
        }
      }
      arrKeys.splice(0, 3);
      res.locals.arrKeys = arrKeys;

      connection.query("SELECT * FROM ??",[id] , function (err, results){
        if (err) throw err;
        var arrOfObjects = results;
        res.locals.array = [];
        res.locals.nullarr = [];
        for (var i in results[0]){
          if (results[0][i]!== 0){
            res.locals.array.push(results[0][i]);
          }
          else{
            res.locals.nullarr.push(results[0][i]);
          }
        }
        var sortedArr = [];
        arrOfObjects.forEach(function(obj) {
          sortingArr.forEach(function(k) {
            sortedArr.push(obj[k]);
          });
        });
        console.log(sortedArr);
        sortedArr.splice(0,3);
        res.locals.arrVals = sortedArr;
        connection.query("SELECT question FROM ??", [id], function (err, result){
          if (err) throw err;
          for (var i in result){
            for (var j in result[i]){
              res.locals.que = result[i][j];
            }
          }
          connection.query("SELECT author FROM home WHERE tabname=?",[id] , function (err, results){
            if (err) throw err;
            var author = results[0].author;
            res.locals.author = author;
console.log(author);
          connection.release();
          res.render("poll");
});
        });
      });


  });

});
});


app.use(function (req, res, next) {
  res.status(404);
  res.send('404: Page not found!');
});
app.use(function(err, req, res, next) {
  console.error(err);
  res.status(500).send({status:500, message: 'internal error', type:'internal'});

});

app.listen(process.env.PORT || 5000);
console.log("Server running at http://localhost:5000/");
