const express = require('express'),
  app = express(),
  handler = require('./handler');

const {
  PORT = 3000, NODE_ENV = 'development', DB_PATH = './db/database.db'
} = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => {
    if (NODE_ENV === 'development') console.error(err.stack);
  });


// ROUTES
app.get('/films/:id/recommendations',
  function(req, res, next) {
    if (isNaN(req.params.id)) {
      var err = new Error('Not Found');
      err.status = 422;
      next(err);
    } else {
      next();
    }
  },
  handler.getFilmRecommendations);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error Handler
// handles missing routes
app.use(function(err, req, res, next) {
  res.status(err.status || 500);

  res.json({
    message: err.message
  });
});


module.exports = app;
