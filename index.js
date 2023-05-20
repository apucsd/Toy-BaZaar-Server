const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

///////////////////
// cors problem
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   next();
// });
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pyjfh6u.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    const toyCollection = client.db("toyDB").collection("toys");

    ///////////use index search
    const indexKey = { toyName: 1 };
    const indexOption = { toyName: "toysName" };
    const result = await toyCollection.createIndex(indexKey, indexOption);

    app.get("/toys/search/:text", async (req, res) => {
      console.log(req.params);
      const text = req.params.text;
      const result = await toyCollection
        .find({
          $and: [
            {
              toyName: { $regex: text, $options: "i" },
            },
          ],
        })
        .toArray();
      res.send(result);
    });

    app.delete("/toys/:id", async (req, res) => {
      const id = req.params.id;
      //   console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/toys/:id", async (req, res) => {
      const id = req.params.id;
      //   console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });
    app.put("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateToy = req.body;
      const updateDoc = {
        $set: {
          price: updateToy.price,
          quantity: updateToy.quantity,
          details: updateToy.details,
        },
      };
      const result = await toyCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.post("/toys", async (req, res) => {
      const data = req.body;
      const result = await toyCollection.insertOne(data);
      res.send(result);
    });

    app.get("/toys", async (req, res) => {
      const limit = parseInt(req.query.limit);

      // sent data using limit params
      if (limit) {
        const result = await toyCollection.find().limit(limit).toArray();
        return res.send(result);
      }
      const email = req.query.email;
      // console.log(limit);
      // sent data using email params
      if (email) {
        const filter = { sellerEmail: email };
        const result = await toyCollection.find(filter).toArray();
        return res.send(result);
      }

      // sent data using ass des
      const sortBy = req.query.sortBy;
      if (sortBy == "ascending") {
        const result = await toyCollection.find().sort({ price: 1 }).toArray();
        return res.send(result);
      }
      if (sortBy == "descending") {
        const result = await toyCollection.find().sort({ price: -1 }).toArray();
        return res.send(result);
      }

      // console.log(limit);
      const result = await toyCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
