const sqlite = require('sqlite'),
  sqlite3 = require('sqlite3').verbose(),
  request = require('request');

// SQLITE CONNECTION
let db = new sqlite3.Database('./db/database.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the sqlite database.');
});

// ROUTE HANDLER

function getFilmRecommendations(req, res) {
  let queryDB = new Promise(function(resolve, reject) {

      let offset = parseInt(req.query.offset, 10);
      if (offset < 1) {
        offset = 0;
      }

      let limit = parseInt(req.query.limit, 10);
      if (isNaN(limit)) {
        limit = 10;
      } else if (limit > 50) {
        limit = 50;
      } else if (limit < 1) {
        limit = 1;
      }


      let sql = `SELECT films.id, films.title, films.release_date,
                genres.name from films LEFT JOIN genres on
                (films.genre_id = genres.id)
                WHERE films.genre_id = (SELECT genre_id from films
                WHERE films.id = `;

      db.all(sql + req.params.id + ")", [], (err, rows) => {
        if (err) {
          throw err;
        }
        let movieIDs = [];
        for (let i = 0; i < rows.length; i++) {
          movieIDs.push(rows[i].id);
        }
        resolve(movieIDs);
      }); // end db query
    })

    .then(function(ids) {
      let url = "https://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=" + ids;
      request(url,
        function(error, response, body) {

          if (error) {
            console.error(error);
          }

          if (!error && response.statusCode === 200) {
            let body = JSON.parse(body);
            let reviews = [];
            for (let i = 0; i < body.length; i++) {
              reviews.push(body[i].reviews);
            }
            let groupRating = [],
              reviewAvg = {};
            for (let i = 0; i < reviews.length;) {
              let rating = 0;
              for (let j = 0; j < reviews[i].length; j++) {
                rating += reviews[i][j].rating;
              }
              groupRating.push((rating / reviews[i].length).toFixed(2));
              reviewAvg[ids[i]] = reviews[i].length;
              i++;
            }

            let avgArray = [],
              joinAvg = {};

            groupRating.forEach(function(avg) {
              avgArray.push(avg);
            });

            for (let i = 0; i < ids.length; i++) {
              joinAvg[ids[i]] = avgArray[i];
            }

            let keys = [],
              avg = [],
              numReviews = [];
            for (let key in joinAvg) {
              if (joinAvg[key] >= 4 && reviewAvg[key] >= 5) {
                keys.push(key);
                avg.push(joinAvg[key]);
                numReviews.push(reviewAvg[key]);
              }
            }
            console.log(keys, avg, numReviews);
          } // end res 200 if
        });

      let movieKeys = ['7406', '8298', '8451'],
        avg = ['4.6', '4.57', '4.33'],
        reviews = [5, 7, 6];
      return ([movieKeys, avg, reviews]);
    }).then(function([keys, avg, reviews]) {

      let newKeys = keys.join(", ");

      let sql = `SELECT films.id, films.title, films.release_date,
                genres.name from films LEFT JOIN genres on
                (films.genre_id = genres.id)
                WHERE films.id IN ( `;

      db.all(sql + newKeys + ")", [], (err, rows) => {
        let newRows = [];
        for (let i = 0; i < rows.length; i++) {

          newRows.push({
            "id": rows[i].id,
            "title": rows[i].title,
            "releaseDate": rows[i].release_date,
            "genre": rows[i].name,
            "averageRating": avg[i],
            "reviews": reviews[i]
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
    })
    .catch(function(e) {
      console.error("There was an error", e);
    });
};

module.exports.getFilmRecommendations = getFilmRecommendations;
