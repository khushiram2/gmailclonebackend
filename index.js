import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import * as dotenv from "dotenv"
import bodyParser from "body-parser"
const app= express()
// app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : true}))
app.use(cors())
dotenv.config()
const port = process.env.port

async function createconnection(){
    try{
    const client = new MongoClient(process.env.url)
    await client.connect()
    console.log("mongodb connected ")
    return client
    }catch(err){
        console.log("error while connecting db ",err )
    }
}




const client = await createconnection()
// async function insert(){
//     await client.db("gmailclone").collection("sentmails").updateMany({}, {$set:{ "date": "2023-05-29T05:08:28.115Z"}})
// }
// insert()

app.put("/starred/:id", async (req,res)=>{
    const {id}=req.params
    console.log(req.body)
    const star=req.body.starred
    console.log(star)
    const email= await client
    .db("gmailclone")
    .collection("inbox")
    .updateOne({id:id}, {$set:{starred:star}})
    res.send(email)
})
app.get("/inbox", async (req,res)=>{
    const inbox= await client
    .db("gmailclone")
    .collection("inbox")
    .find({}).toArray()
    res.send(inbox)
})
app.post("/inbox", async (req,res)=>{
    const newmail=req.body
    const recieved= await client
    .db("gmailclone")
    .collection("inbox")
    .insertOne(newmail)
    res.send(recieved)
    })

app.get("/email/:id", async (req,res)=>{
    const {id}=req.params
    const email= await client
    .db("gmailclone")
    .collection("inbox")
    .find({id:id}).toArray()
    res.send(email)
})

app.put("/inbox", async (req,res)=>{
    const arr=req.body.arr
    const bin=req.body.bin
    const email= await client
    .db("gmailclone")
    .collection("inbox")
    .updateMany({id:{$in:arr}}, {$set:{"bin":bin}})
    res.send(email)
})
app.put("/email/bin/:id", async (req,res)=>{
    const {id}=req.params
    const bin=req.body.bin
    const email= await client
    .db("gmailclone")
    .collection("inbox")
    .updateOne({id:id}, {$set:{bin:bin}})
    res.send(email)
})

app.delete("/email/:id", async (req,res)=>{
    const {id}=req.params
    const email= await client
    .db("gmailclone")
    .collection("inbox")
    .deleteOne({id:id})
    res.send(email)
})
//sent mails
app.post("/sentmails", async (req,res)=>{
const newmail=req.body
const sentmail= await client
.db("gmailclone")
.collection("sentmails")
.insertOne(newmail)
res.send(sentmail)
})

app.get("/sentmails", async (req,res)=>{
    const allsentMails= await client
    .db("gmailclone")
    .collection("sentmails")
    .find({}).toArray()
    res.send(allsentMails)
})

app.get("/sentmail/:id", async (req,res)=>{
const {id}= req.params
const sentmail= await client
.db("gmailclone")
.collection("sentmail")
.find({sentmailid:id})
res.send(sentmail)
})

// drafts
    app.post("/drafts", async (req,res)=>{
    const newmail=req.body
    const draft= await client
    .db("gmailclone")
    .collection("drafts")
    .insertOne(newmail)
    res.send(draft)
    })

    app.get("/drafts",async (req,res)=>{
        const alldraftMails= await client
        .db("gmailclone")
        .collection("drafts")
        .find({}).toArray()
        res.send(alldraftMails)
    })

    app.get("/drafts/:id", async (req,res)=>{
        const {id}= req.params
        const draft= await client
        .db("gmailclone")
        .collection("drafts")
        .find({draftid:id})
        res.send(draft)
    })
//starred
app.get("/starredmails", async (req,res)=>{
    const allstarredMails= await client
    .db("gmailclone")
    .collection("inbox")
    .find({starred:"true"}).toArray()
    res.send(allstarredMails)
})

// bin 
app.get("/bin", async (req,res)=>{
    const alldeletedMails= await client
    .db("gmailclone")
    .collection("inbox")
    .find({bin:"true"}).toArray()
    const alldeletedMails2= await client
    .db("gmailclone")
    .collection("sentmails")
    .find({bin:"true"}).toArray()
    res.send([...alldeletedMails,...alldeletedMails2])
})


//all mails
app.get("/allmails", async (req,res)=>{
    const inbox= await client
    .db("gmailclone")
    .collection("inbox")
    .find({}).toArray()
    const sent= await client
    .db("gmailclone")
    .collection("sentmails")
    .find({}).toArray()
    res.send([...inbox,...sent])
})




app.listen(port,()=>console.log("server started on port ",port ))