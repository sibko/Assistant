var endpoint = "app.api.surehub.io"
var loginURL = "/api/auth/login"
var householdURL = "/api/household"
var getPetURL = "/api/household/$household/pet"
var sessionToken = ""

const email = ""
const password = ""
const device_id = "9123499999"
const https = require('https')
const fs = require('fs')
var confdir = '/home/sibko/Assistant/config.json'
var tokendir = '/home/sibko/surepetToken'
var token = fs.readFileSync(tokendir, 'utf8')
if (token != "") sessionToken = token
var config = fs.readFileSync(confdir, 'utf8')
config = JSON.parse(config)
var household = config.surepet.houseID
var pets = config.surepet.pets

var sendPostRequest = function (url, data) {
    return new Promise(function (resolve, reject) {
        console.log("sending request for", url, data)
        var strData = JSON.stringify(data)
        var options = {
            hostname: endpoint,
            port: 443,
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': strData.length
            }
        }
        if (sessionToken != "") options.headers.Authorization = "Bearer " + sessionToken

        var req = https.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`)
            var resdata = ""
            res.on('data', d => {
                resdata += d
            })
            res.on('end', () => {
                console.log("Response:", resdata)
                var obj = JSON.parse(resdata)
                resolve(obj)
            })
        })

        req.on('error', error => {
            console.error(error)
            reject(error)
        })
        console.log("STRDATA", strData)
        req.write(strData)
        req.end()
    })
}
var sendGetRequest = function (url) {
    return new Promise(function (resolve, reject) {
        console.log("sending request for", url, sessionToken)
        var options = {
            hostname: endpoint,
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                Authorization: "Bearer " + sessionToken.toString()
            }
        }
        console.log("headers", options.headers)
        var req = https.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`)
            if (res.statusCode == 401) {                
                sessionToken = ""
                fs.writeFileSync(tokendir, "")
                login().then(function(res){
                    console.log("well", res)
                    sendGetRequest(url).then(function(){
                        resolve()
                    })
                })
            }
            var resdata = ""
            res.on('data', d => {
                resdata += d
            })
            res.on('end', () => {
                console.log("Response:", resdata)
                var obj = JSON.parse(resdata)
                resolve(obj)
            })
        })

        req.on('error', error => {
            console.error(error)
            reject(error)
        })
        req.end()
    })
}

var login = function () {
    return new Promise(function (resolve, reject) {
        if (sessionToken != "") resolve("already got")
        var data = {
            email_address: email,
            password: password,
            device_id: device_id
        }
        sendPostRequest(loginURL, data).then(function (res) {
            sessionToken = res.data.token            
            fs.writeFileSync(tokendir, res.data.token)
            resolve("got new one")
        }).catch(function () {
            reject()
        })
    })
}
var getHouseholdID = function () {
    return sendGetRequest(householdURL).then(function (res) {
        household = res.data[0].id
    })
}

var getPets = function () {
    var getPetsURL = "/api/household/" + household + "/pet"
    return sendGetRequest(getPetsURL).then(function (res) {
        pets = res.data
    })
}

var getPetLocations = function () {
    pets.forEach(function(pet){        
        var getPetLocationURL = "/api/pet/"+ pet.id + "/position"
        sendGetRequest(getPetLocationURL).then(function (res) {
            var location = "outside"
            if (res.data.where == "1") location = "inside"
            console.log(pet.name + " is " + location)
        })
    })    
}

var getPetLocation = function (name) {
    return new Promise(function(resolve, reject) {
        pets.forEach(function(pet){ 
            if (pet.name == name) {
                var getPetLocationURL = "/api/pet/"+ pet.id + "/position"
                sendGetRequest(getPetLocationURL).then(function (res) {
                    var location = "outside"
                    if (res.data.where == "1") location = "inside"
                    resolve(location)
                })
            }               
        }) 
    })       
}
login().then(getPetLocations)
login().then(getPetLocation("Henry").then(function(location){ console.log("Henry is " + location)}))