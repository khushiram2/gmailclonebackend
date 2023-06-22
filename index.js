import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import * as dotenv from "dotenv"
import bodyParser from "body-parser"
const app = express()
app.use(express.json())
app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({extended : true}))
app.use(cors())
dotenv.config()
const port = process.env.port

async function createconnection() {
    try {
        const client = new MongoClient(process.env.url)
        await client.connect()
        console.log("mongodb connected ")
        return client
    } catch (err) {
        console.log("error while connecting db ", err)
    }
}




const client = await createconnection()
//login and register
app.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body.user;
      const findIfUserExist = await client
        .db("gmailclone")
        .collection("users")
        .find({})
        .toArray();
      const emailarray = findIfUserExist.map((e) => e.email);
      if (emailarray.indexOf(email) === -1) {
        const newuser = {
          name: name,
          email: email,
          password: password,
        };
        const setuser = await client
          .db("gmailclone")
          .collection("users")
          .insertOne(newuser);
        res.status(200).send(`User created successfully`);
      } else {
        res.send("User already exists");
      }
    } catch (err) {
      res.status(500).send("An error occurred while registering user");
    }
  });
  
  app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body.lg;
      const user = await client
        .db("gmailclone")
        .collection("users")
        .findOne({ email: email });
      const data = {
        loginstatus: "login successful",
      };
      if (user.email === email && user.password === password){
        res.status(200).send({
          ...data,
          id: user._id,
          name: user.name,
          email: user.email,
        });
      } else {
        res.status(401).send("Invalid email or password");
      }
    } catch (err) {
      res.status(500).send("An error occurred while logging in");
    }
  });
 // star a mail or unstar it 
  app.put("/starred/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const star = req.body.starred;
      const email = await client
        .db("gmailclone")
        .collection("mails")
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: { starred: star } }
        );
      res.send(email);
    } catch (err) {
      res.status(500).send("An error occurred while updating mail");
    }
  });
// getting all inbox messages
  app.post("/inbox", async (req, res) => {
    try {
      const { email } = req.body;
      const inbox = await client
        .db("gmailclone")
        .collection("mails")
        .find({ to: email, recieverbin: false })
        .toArray();
      res.send(inbox);
    } catch (err) {
      res.status(500).send("An error occurred while fetching inbox mails");
    }
  });

//get username
app.get("/username/:userid", async (req,res)=>{
    try{
        const {userid}=req.params
        const user = await client
        .db("gmailclone")
        .collection("users")
        .findOne({ _id: new ObjectId(userid) });
      res.send(user.name);
    }catch(err){
        res.status(500).send("username not found")
    }
})



 // getting single mail 
  app.get("/email/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = await client
        .db("gmailclone")
        .collection("mails")
        .findOne({ _id: new ObjectId(id) });
        if(!email){
            const draftmail=await client
            .db("gmailclone")
            .collection("drafts")
            .findOne({ _id: new ObjectId(id) });
            const nameOfReciever = await client
            .db("gmailclone")
            .collection("users")
            .findOne({email:draftmail.to});
          res.send({email:draftmail,nameOfReciever:nameOfReciever.name});
        }else{
            const nameOfReciever = await client
            .db("gmailclone")
            .collection("users")
            .findOne({email:email.to});
          res.send({email:email,nameOfReciever:nameOfReciever.name});
        }

    } catch (err) {
      res.status(500).send("An error occurred while fetching single email");
    }
  });
  //sending all sent mails to bin
  app.put("/bin/all/:userid", async (req, res) => {
    try {
      const { userid } = req.params;
      const  {select,bin}= req.body.result
      const convertedIds = select.map((id) => new ObjectId(id));

      const email = await client
        .db("gmailclone")
        .collection("mails")
        .updateMany(
          { userid: userid, _id: { $in: convertedIds } },
          { $set: { senderbin: bin, starred: false } }
        );
      res.send(email);
    } catch (err) {
      res.status(500).send("An error occurred while updating mails");
    }
  });
  //sendig all inbox mails to bin
  app.put("/inbox/delete", async (req, res) => {
    try {
      const { email, select, bin } = req.body.result;
      const convertedIds = select.map((id) => new ObjectId(id));
      const demail = await client
        .db("gmailclone")
        .collection("mails")
        .updateMany(
          { to: email, _id: { $in: convertedIds } },
          { $set: { recieverbin: bin, starred: false } }
        );
      res.send(demail);
    } catch (err) {
      res.status(500).send("An error occurred while updating mails");
    }
  });
  //sending a single mail to bin
  app.put("/email/bin/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const{mailType, bin} = req.body;
      let email;
        if(mailType==="recieved"){
             email = await client
            .db("gmailclone")
            .collection("mails")
            .updateOne(
              { _id: new ObjectId(id) },
              { $set: { recieverbin: bin, starred: false } }
            );
        }else{
            email = await client
            .db("gmailclone")
            .collection("mails")
            .updateOne(
              { _id: new ObjectId(id) },
              { $set: { senderbin: bin, starred: false } }
            );
        }
   
      res.send(email);
    } catch (err) {
      res.status(500).send("An error occurred while updating mail");
    }
  });
  //deleting all mails
  app.delete("/permanent/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = await client
        .db("gmailclone")
        .collection("mails")
        .deleteOne({_id: new ObjectId(id) });
      res.send(email);
    } catch (err) {
      res.status(500).send("An error occurred while deleting mail");
    }
  });
  // deleting draft mail
  app.delete("/draft/permanent/delete/:id",async (req,res)=>{
    try{
        const { id } = req.params;
        const email = await client
          .db("gmailclone")
          .collection("drafts")
          .deleteOne({_id: new ObjectId(id) });
        res.send(email);
    }catch(err){
        res.status(500).send("an error occured while deletind draft mail")
    }
  })
  //adding a sent mail
  app.post("/sentmails", async (req, res) => {
    try {
      const { email } = req.body;
      const sentmails = await client
        .db("gmailclone")
        .collection("mails")
        .insertOne(email)
      res.send(sentmails);
    } catch (err) {
      res.status(500).send("An error occurred while fetching sent mails");
    }
  });
  
  
  // get all sent mails
app.get("/sentmails/:userid", async (req, res) => {
    try{
    const { userid } = req.params
    const allsentMails = await client
        .db("gmailclone")
        .collection("mails")
        .find({ userid: userid,senderbin:false}).toArray()
    res.send(allsentMails)
    }catch (err){
            res.send("some error occured ")
    }
})


/////////////////////////////////////////////////////////////////////////

  //getting all draft mails
  app.get("/drafts/:userid", async (req, res) => {
    try {
      const { userid } = req.params;
      const alldraftMails = await client
        .db("gmailclone")
        .collection("drafts")
        .find({ userid: userid })
        .toArray();
      res.send(alldraftMails);
    } catch (err) {
      res.status(500).send("An error occurred while fetching drafts");
    }
  });

  // post a draft message
  app.post("/drafts/post", async (req, res) => {
    try {
      const newmail = req.body;
      const draft = await client
        .db("gmailclone")
        .collection("drafts")
        .insertOne(newmail);
      res.send(draft);
    } catch (err) {
      res.status(500).send("An error occurred while creating draft");
    }
  });
  // getting a single draft
  app.get("/drafts/:userid/:id", async (req, res) => {
    try {
      const { id, userid } = req.params;
      const draft = await client
        .db("gmailclone")
        .collection("drafts")
        .find({ userid: userid, id: new ObjectId(id) })
        .toArray();
      res.send(draft);
    } catch (err) {
      res.status(500).send("An error occurred while fetching single draft mail");
    }
  });
  // getting all starred mails
  app.post("/starredmails/:userid", async (req, res) => {
    try {
      const { email } = req.body;
      const { userid } = req.params;
      const allstarredMails = await client
        .db("gmailclone")
        .collection("mails")
        .find({ to: email, starred: true })
        .toArray();
      const allstarredMails2 = await client
        .db("gmailclone")
        .collection("mails")
        .find({ userid: userid, starred: true })
        .toArray();
      res.send([...allstarredMails, ...allstarredMails2]);
    } catch (err) {
      res.status(500).send("An error occurred while fetching starred mails");
    }
  });
  // getting all bin mails
  app.post("/bin/:userid", async (req, res) => {
    try {
      const { email } = req.body;
      const { userid } = req.params;
      const alldeletedMails = await client
        .db("gmailclone")
        .collection("mails")
        .find({ to: email, recieverbin: true })
        .toArray();
      const alldeletedMails2 = await client
        .db("gmailclone")
        .collection("mails")
        .find({ userid: userid, senderbin: true })
        .toArray();
      res.send([...alldeletedMails, ...alldeletedMails2]);
    } catch (err) {
      res.status(500).send("An error occurred while fetching deleted mails");
    }
  });
  //getting all mails
  app.post("/allmails/get/:userid", async (req, res) => {
    try {
      const { userid } = req.params;
      const { email } = req.body;
      const inbox = await client
        .db("gmailclone")
        .collection("mails")
        .find({ to: email, recieverbin: false })
        .toArray();
      const sent = await client
        .db("gmailclone")
        .collection("mails")
        .find({ userid: userid, senderbin: false })
        .toArray();
      res.send([...inbox, ...sent]);
    } catch (err) {
      res.status(500).send("An error occurred while fetching all mails");
    }
  });
  













app.listen(port, () => console.log("server started on port ", port))