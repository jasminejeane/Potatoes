'use strict';

var express = require("express"),
    router = express.Router();


    // GET this router returns all the items
    router.get("/", function(req, res){
    res.json({response: "You sent me a GET request"})
    })


    // GET /questions/:id
    // Route for specific questions
    router.get("/:qID", function(req, res, next){
    	res.json(req.question);
    });


    // ROUTE HANDLER
    function getFilmRecommendations(req, res) {



          let sql = `SELECT * from films
          LEFT JOIN genres on (films.genre_id = genres.id)
          WHERE films.genre_id = (SELECT genre_id from films
            WHERE films.id = 10306)`;


             db.all(sql,[],(err, rows ) => {
                 // process rows here
                 if (err) {
            throw err;
          }
          // console.log(JSON.stringify(rows, null, 2));

                 console.log(rows);
             });

      res.status(200).json({

        recommendations: "You sent me a GET request - 200"
      })

module.exports = router;
