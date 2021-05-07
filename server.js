const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const cors = require("cors")

app.use("/files", express.static(path.join(__dirname, "files")));
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/checkfolder/:ip", async (req, res) => {
  let ip = req.params.ip;
  if (ip == null) res.sendStatus(500)

  fs.stat(`files/${ip}`, (err) => {
    if (!err) {
      let arrayProjects = []

      let files = fs.readdirSync("files/" + String(ip))
      files.map(filename => {
        let file = fs.readFileSync(`files/${String(ip)}/${filename}`)
        arrayProjects.push(JSON.parse(file))
      })
      
      res.send(arrayProjects)
    } else if (err.code === "ENOENT") {
      fs.mkdirSync("files/" + ip);

      let firstProject = { title: "Project1", id: "barrrrr", tasks: [{ description: "Пойти на работу", id: "foo11111", isDone: false, miniTasks: [] }] }
      let pathFile = `files/${String(ip)}/${firstProject.title}.json`

      fs.open(pathFile, "w", err => {
        if (err) throw err
        console.log("file has created");
      })

      fs.appendFile(pathFile, JSON.stringify(firstProject), err => {
        if (err) throw err
        console.log("data has been added");
      })

      res.send([firstProject])
    }
  });
});

app.get("/findProject/:ip/:id", async (req, res) => {
  let ip = req.params.ip
  let projectID = req.params.id

  let err = fs.statSync(`files/${ip}`)
  if (err.code === "ENOENT") res.sendStatus(404)
  else {
    let files = fs.readdirSync(`files/${String(ip)}`)
    files.map(filename => {
      let file = fs.readFileSync(`files/${String(ip)}/${filename}`)
      let data = JSON.parse(file)
      if (data.id == projectID) res.send(data)
    })
  }
})

app.post("/saveTitle", async (req, res) => {
  let path = `files/${req.body.ip}/${req.body.previousTitle}.json`
  let file = fs.readFileSync(path, "utf8")
  
  let newData = JSON.parse(file)
  newData.title = req.body.title

  fs.writeFileSync(path, JSON.stringify(newData))
  
  let newPath = `files/${req.body.ip}/${req.body.title}.json`
  fs.renameSync(path, newPath)
  res.sendStatus(200)
})

app.listen(3001, () => console.log("server is started on 3001"));
