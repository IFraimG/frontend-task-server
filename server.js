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

app.post("/editDescription", async (req, res) => {
  let path = `files/${req.body.ip}/${req.body.title}.json`
  let json = fs.readFileSync(path, "utf-8")
  let file = JSON.parse(json)
  file.tasks.map(task => {
    if (task.id == req.body.taskID) task.description = req.body.value
  })
  fs.writeFileSync(path, JSON.stringify(file))
  res.send(file)
})

app.post("/setTaskDone", async (req, res) => {
  let path = `files/${req.body.ip}/${req.body.title}.json`
  let json = fs.readFileSync(path, "utf-8")
  let file = JSON.parse(json)

  file.tasks.map(task => {
    if (task.id == req.body.id) task.isDone = req.body.isDone
  })

  fs.writeFileSync(path, JSON.stringify(file))
  res.sendStatus(200)
})


function generateID(tasksList) {
  let words = "abcdefghijklmnopqrstuvwxyz";
  
  while (true) {
    let id = ""
    for (let i = 0; i <= 14; i++) {
      id += words.charAt(Math.floor(Math.random() * words.length))
    }
    let isTask = false
    tasksList.map(item => {
      if (item.id == id) isTask = true
    })

    if (!isTask) return id
  }
}

app.post("/appendTask", async (req, res) => {
  let path = `files/${req.body.ip}/${req.body.title}.json`
  let json = fs.readFileSync(path, "utf-8")
  
  let file = JSON.parse(json)
  let id = generateID(file.tasks)

  let task = { description: req.body.description, isDone: false, id, miniTasks: [] }
  file.tasks.push(task)

  fs.writeFileSync(path, JSON.stringify(file))
  res.send(task)
})

app.delete("/deleteTask/:ip/:title/:taskID", async (req, res) => {
  let path = `files/${req.params.ip}/${req.params.title}.json`
  let json = fs.readFileSync(path, "utf-8")
  let file = JSON.parse(json)
  file.tasks.map((task, index) => {
    if (task.id == req.params.taskID) file.tasks.splice(index, 1)
  })

  fs.writeFileSync(path, JSON.stringify(file))
  res.sendStatus(200)
})

app.post("/saveMiniTask", async (req, res) => {
  let path = `files/${req.body.ip}/${req.body.title}.json`
  let json = fs.readFileSync(path, "utf-8")
  let file = JSON.parse(json)
  let id = generateID(file.tasks)

  let newTask = { description: req.body.taskText, isDone: false, id, miniTasks: [] }
  file.tasks.map((task, index) => {
    if (task.id == req.body.parentID) file.tasks[index].miniTasks.push(newTask)
  })

  fs.writeFileSync(path, JSON.stringify(file))
  res.send(newTask)
})

app.listen(3001, () => console.log("server is started on 3001"));
