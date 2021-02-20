require("dotenv").config()
const path = require("path");
const app = require("express")
const axios = require("axios")
const morgan = require('morgan')

const express = app()

function fetchDataFromFatSecret(url, data) {
    return axios({
        method: 'post',
        url,
        data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Authorization": `Bearer ${process.env.BEARER}` }
    })
}

express.use(app.json())
express.use(morgan('combined'))
express.use('/', app.static(path.join(__dirname, 'frontend')))

express.get("/search/:keyword", (req, res) => {
    const keyword = req.params.keyword
    if (!keyword) {
        return res.status(404).send({ error: true })
    }
    const url = "https://platform.fatsecret.com/rest/server.api";
    const data = `search_expression=${keyword}&method=foods.search&format=json&max_results=50`
    fetchDataFromFatSecret(url, data)
        .then((response) => {
            const data = response.data;
            if (data.error) {
                return res.status(404).send(data)
            }
            res.send(data)
        })
        .catch((response) => {
            console.log(response);
            res.status(500).send({ error: true })
        });
})
express.get("/food/:id", (req, res) => {
    const url = "https://platform.fatsecret.com/rest/server.api";
    const data = `food_id=${req.params.id}&method=food.get&format=json`
    fetchDataFromFatSecret(url, data)
        .then(function (response) {
            const data = response.data;
            if (data.error) {
                return res.status(404).send(data)
            }
            const filteredData = data.food.servings.serving.filter(v => v.serving_description === "100 g")
            if (filteredData && filteredData.length && filteredData.length > 0) {
                filteredData[0]['food_name'] = data.food.food_name
                return res.send(filteredData[0])
            }
            res.send(response.data)
        })
        .catch(function (response) {
            //handle error
            console.log(response);
            res.status(500).send({ error: true })
        });
})

const PORT = process.env.PORT || 3030
express.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`))