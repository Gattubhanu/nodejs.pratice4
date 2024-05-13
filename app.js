const express = require('express')
const app = express()
const path = require('path')
const dbpath = path.join(__dirname, 'covid19IndiaPortal.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
app.use(express.json())
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
let db = null
const initializedbserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running at http:/localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error is ${e.message}`)
    procress.exit(1)
  }
}
initializedbserver()
app.post('/user/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hackedpassword = await bcrypt.hash(password, 10)
  const query = `select * from user where username='${username}'`
  const dbuser = await db.get(query)
  if (dbuser === undefined) {
    const query2 = `insert into user(username,name,password,gender,location)values('${username}','${name}','${hackedpassword}','${gender}','${location}')`
    await db.run(query2)
    response.send('successfully Registered')
  } else {
    response.status(400)
    response.send('user already regristed')
  }
})
const authenticationheader = (request, response, next) => {
  let jwttoken
  const authheader = request.headers['Authorization']
  if (authheader !== undefined) {
    jwttoken = authheader.split(' ')[1]
  }
  if (jwttoken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwttoken, 'bhanu', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

app.post('/login/', authenticationheader, async (request, response) => {
  const {username, password} = request.body
  const query = `select * from user where username='${username}'`
  const dbuser = await db.get(query)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const ispasswordmatched = await bcrypt.compare(password, dbuser.password)
    if (ispasswordmatched === true) {
      const payload = {username: username}
      const jwttoken = jwt.sign(payload, 'bhanu')
      response.send({jwttoken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
const convertstateobjecttoresponseobject = async dbobject => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
  }
}
app.get('/states/', authenticationheader, async (request, response) => {
  const query = `select * from state`
  const query2 = await db.all(query)
  response.send(query2)
})
