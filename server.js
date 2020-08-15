const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://prat:" +
    process.env.PW +
    "@cluster0.awlka.mongodb.net/test?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

let exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: String
});

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [exerciseSchema]
});
let Session = mongoose.model("Session", exerciseSchema);
let User = mongoose.model("User", userSchema);

app.post("/api/exercise/new-user", (req, res) => {
  const { username } = req.body;
  let newUser = new User({
    username
  });
  newUser.save((err, user) => {
    if (!err) {
      res.json({
        username: newUser.username,
        _id: newUser.id
      });
    }
  });
});

app.get("/api/exercise/users", (req, res) => {
  User.find({}, (err, user) => {
    if (!err) {
      res.json(user);
    }
  });
});

app.post("/api/exercise/add", (req, res) => {
  const { userId, description, duration, date } = req.body;
  let session = new Session({
    description,
    duration,
    date
  });
  if (session.date === "") {
    session.date = new Date().toISOString().substring(0, 10);
  }
  User.findByIdAndUpdate(
    userId,
    { $push: { log: session } },
    { new: true },
    (err, x) => {
      let obj = {};
      obj["_id"] = x.id;
      obj["username"] = x.username;
      obj["date"] = new Date(session.date).toDateString();
      obj["description"] = session.description;
      obj["duration"] = session.duration;
      res.json(obj);
    }
  );
});

app.get("/api/exercise/log", (req, res) => {
  User.findById(req.query.userId, (err, result) => {
    if (!err) {
      /* Count Limit */
      if (req.query.limit) {
        result.log = result.log.slice(0, req.query.limit);
      }

      /*Date Filter */
      if (req.query.from || req.query.to) {
        let fromDate = new Date(0);
        let toDate = new Date();

        if (req.query.from) {
          fromDate = new Date(req.query.from);
        }

        if (req.query.to) {
          toDate = new Date(req.query.to);
        }

        result.log = result.log.filter(exerciseItem => {
          let exerciseItemDate = new Date(exerciseItem.date);

          return (
            exerciseItemDate.getTime() >= fromDate.getTime() &&
            exerciseItemDate.getTime() <= toDate.getTime()
          );
        });
      }

      result["count"] = result.log.length;
      res.json(result);
    }
  });
});
