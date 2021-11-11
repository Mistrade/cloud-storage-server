import express from 'express'
import mongoose from 'mongoose'
import { authRouter } from './routes/auth.routes'
import config from 'config'

const app = express()
const PORT = config.get('ServerPort')
const mongoUrl: string = config.get('databaseConnectionLink')

app.use(express.json())
app.use('/api/auth', authRouter)

const startServer = async () => {
    try {
        await mongoose.connect(mongoUrl)

        app.listen(PORT, () => {
            console.log('Сервер запущен на ' + PORT + ' порте.')
        })
    } catch (e) {
        console.group()
        console.log('Во время запуска сервера произошла ошибка')
        console.log(e)
        console.groupEnd()
    }
}

startServer().then()