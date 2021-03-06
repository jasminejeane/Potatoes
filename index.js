const express = require('express'),
  app = express(),
  sqlite = require('sqlite'),
  sqlite3 = require('sqlite3').verbose(),
  request = require('request');

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
  getFilmRecommendations);

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

// SQLITE CONNECTION
var db = new sqlite3.Database('./db/database.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the sqlite database.');
});

// ROUTE HANDLER

function getFilmRecommendations(req, res) {

  var queryDB = new Promise(function(resolve, reject) {
      let sql = `SELECT films.id, films.title, films.release_date,
                genres.name from films LEFT JOIN genres on
                (films.genre_id = genres.id)
                WHERE films.genre_id = (SELECT genre_id from films
                WHERE films.id = `;

      db.all(sql + req.params.id + ")", [], (err, rows) => {

        if (err) {
          throw err;
        }
        var ids = [];
        for (var i = 0; i < rows.length; i++) {
          ids.push(rows[i].id);
        }
        resolve(ids);
      }); // end db query
    })

    .then(function(ids) {

      var url = "https://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=" + ids;

      request(url,
        function(error, response, body) {

          if (error) {
            console.error(error);
          }

          if (!error && response.statusCode === 200) {

            var body = JSON.parse(body);
            var reviews = [];
            for (var i = 0; i < body.length; i++) {
              reviews.push(body[i].reviews);
            }

            var groupRating = [],
              reviewAvg = {};
            for (var i = 0; i < reviews.length;) {
              var rating = 0;
              for (var j = 0; j < reviews[i].length; j++) {

                rating += reviews[i][j].rating;
              }
              groupRating.push((rating / reviews[i].length).toFixed(2));
              reviewAvg[ids[i]] = reviews[i].length;
              i++;
            }

            var avgArr = [],
              joinAvg = {};

            groupRating.forEach(function(avg) {
              avgArr.push(avg);
            });

            for (var i = 0; i < ids.length; i++) {
              joinAvg[ids[i]] = avgArr[i];
            }

            var keys = [],
              avg = [],
              numReviews = [];
            for (var key in joinAvg) {
              if (joinAvg[key] >= 4 && reviewAvg[key] >= 5) {
                keys.push(key);
                avg.push(joinAvg[key]);
                numReviews.push(reviewAvg[key]);
              }
            }

            var newKeys = keys.join(", ");

            let sql = `SELECT films.id, films.title, films.release_date,
                      genres.name from films LEFT JOIN genres on
                      (films.genre_id = genres.id)
                      WHERE films.id IN ( `;

            db.all(sql + newKeys + ")", [], (err, rows) => {
              var newRows = [];
              for (var i = 0; i < rows.length; i++) {

                newRows.push({
                  "id": rows[i].id,
                  "title": rows[i].title,
                  "releaseDate": rows[i].release_date,
                  "genre": rows[i].name,
                  "averageRating": avg[i],
                  "reviews": numReviews[i]
                });
              }
              res.json({
                recommendations: newRows,

                meta: {
                  limit: 10,
                  offset: 1
                }
              }); // end json response
            }); // end db query
          } // end res 200 if
        });
    })
    .catch(function(e) {
      console.error("There was an error", e);
    });
};

module.exports = app;
