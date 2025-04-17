import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.URL_DB;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
}

export default async function ConnectToDB(){
    try {
        await mongoose.connect(url, options)
        console.log('connected to DB')
    } catch (error) {
        console.log(error)
    }
}