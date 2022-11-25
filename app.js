var createError = require('http-errors');
var express = require('express');
var path = require('path');
const hbs=require('express-handlebars');
var logger = require('morgan');
var bodyParser = require('body-parser')
const session=require('express-session')
var db = require('./config/connection')

var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials',
helpers: {
  inc: function (value, options) {
    return parseInt(value) + 1;
  }
}
}))

let Hbs = hbs.create({})

Hbs.handlebars.registerHelper('if_eq', function(a,b,opts) {
  if(a == b)
    return opts.fn(this)
  else
    return opts.inverse(this);
})

app.use(session({
  secret: "thisismyscreetkey",
  cookie: {
    sameSite: "strict",
    maxAge: 999999999999
  }
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', usersRouter);
app.use('/admin', adminRouter);

//User public files
app.use(express.static(path.join(__dirname, 'public/user')));
app.use(express.static(path.join(__dirname, 'public/user/css')));
app.use(express.static(path.join(__dirname, 'public/user/js')));
app.use(express.static(path.join(__dirname, 'public/user/image')));


//Admin public files
app.use(express.static(path.join(__dirname, 'public/admin')));
app.use(express.static(path.join(__dirname, 'public/admin/assets')));
app.use(express.static(path.join(__dirname, 'public/admin/assets/css')));
app.use(express.static(path.join(__dirname, 'public/admin/assets')));
app.use(express.static(path.join(__dirname, 'public/admin/assets')));
app.use(express.static(path.join(__dirname, 'public/admin/assets')));
// app.use(express.static(path.join(__dirname, 'public/image')));




//DB connections💽
db.connect((err)=>{
  if(err) console.log('connection error' + err)
  else console.log("database connected")
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
