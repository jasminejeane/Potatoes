'use strict';

var express = require("express"),
    router = express.Router();


    // GET this router returns all the items
    router.get("/", function(req, res){
    res.json({response: "You sent me a GET request"})
    })






module.exports = router;
