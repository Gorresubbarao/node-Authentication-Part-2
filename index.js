const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// Get Books API
// app.get('/books/', async (request, response) => {
//   const getBooksQuery = `
//   SELECT
//     *
//   FROM
//     book
//   ORDER BY
//     book_id;`
//   const booksArray = await db.all(getBooksQuery)
//   response.send(booksArray)
// })

// User Register API
app.post('/users/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `
    SELECT 
      * 
    FROM 
      user 
    WHERE 
      username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username, name, password, gender, location)
     VALUES
      (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}',
       '${location}'  
      );`
    await db.run(createUserQuery)
    response.send('User created successfully')
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// User Login API
// app.post('/login/', async (request, response) => {
//   const {username, password} = request.body
//   const selectUserQuery = `
//     SELECT
//       *
//     FROM
//       user
//     WHERE
//       username = '${username}';`
//   const dbUser = await db.get(selectUserQuery)

//   if (dbUser === undefined) {
//     response.status(400)
//     response.send('Invalid User')
//   } else {
//     const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
//     if (isPasswordMatched === true) {
//       response.send('Login Success!')
//     } else {
//       response.status(400)
//       response.send('Invalid Password')
//     }
//   }
// })

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

app.get('/books/', (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getBooksQuery = `
            SELECT
              *
            FROM
             book
            ORDER BY
              book_id;`
        const booksArray = await db.all(getBooksQuery)
        response.send(booksArray)
      }
    })
  }
})

// 1. Authentication Mechanisms
// To check whether the user is logged in or not we use different Authentication mechanisms

// Commonly used Authentication mechanisms:

// Token Authentication
// Session Authentication
// 2. Token Authentication mechanism
// We use the Access Token to verify whether the user is logged in or not

// 2.1 Access Token
// Access Token is a set of characters which are used to identify a user

// Example:

// It is used to verify whether a user is Valid/Invalid

// 2.2 How Token Authentication works?
// Server generates token and certifies the client
// Client uses this token on every subsequent request
// Client don’t need to provide entire details every time
// 3. JWT
// JSON Web Token is a standard used to create access tokens for an application
// This access token can also be called as JWT Token

// 3.1 How JWT works?
// Client: Login with username and password
// Server: Returns a JWT Token
// Client: Sends JWT Token while requesting
// Server: Sends Response to the client

// 3.2 JWT Package
// jsonwebtoken package provides jwt.sign and jwt.verify functions

// jwt.sign() function takes payload, secret key, options as arguments and generates JWTToken out of it
// jwt.verify() verifies jwtToken and if it’s valid, returns payload. Else, it throws an error
