var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require("express-session");

var db = require("./config/connection");
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');
var hbs = require("express-handlebars");
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials",
  })
);

db.connect((err) => {
  if (err) console.log("connection error" + err);
  else console.log("database connected");
});

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/user/')));
app.use(express.static(path.join(__dirname, 'public/admin/')));

app.use(
  session({
    secret: "key",  
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
  })
);

app.use((req, res, next) => {
  if (!req.user) {
    res.header("cache-control", "private,no-cache,no-store,must revalidate");
    res.header("Express", "-2");
  }
  next();
});
app.use((req, res, next) => {
  if (!req.admin) {
    res.header("cache-control", "private,no-cache,no-store,must revalidate");
    res.header("Express", "-2");
  }
  next();
});

app.use('/admin', adminRouter);
app.use('/', usersRouter);

app.get('/admin/*',(req, res)=>{
  res.render('admin/404')
})

app.get("*", (req, res) => {
  res.render("user/404",{userHead:true});
});

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
