import express from 'express'
import mongoose from 'mongoose'
import { authRouter } from './routes/auth.routes'
import config from 'config'
import cors from 'cors'
import { graphqlHTTP } from 'express-graphql'
import GraphSchema from './graph'

const app = express()
const PORT = config.get( 'ServerPort' )
const mongoUrl: string = config.get( 'databaseConnectionLink' )

const origin = ['http://localhost:3000']

app.use( cors( {
  credentials: true,
  origin
} ) )


app.use( '/graphql', ( req, res ) => ( graphqlHTTP( {
  schema: GraphSchema,
  graphiql: true,
  context: {
    req, res
  }
} ) )( req, res ) )

app.use( express.json() )
app.use( '/api/auth', authRouter )

const startServer = async () => {
  try {
    await mongoose.connect( mongoUrl )

    app.listen( PORT, () => {
      console.log( 'Сервер запущен на ' + PORT + ' порте.' )
    } )
  } catch (e) {
    console.group()
    console.log( 'Во время запуска сервера произошла ошибка' )
    console.log( e )
    console.groupEnd()
  }
}

startServer().then()