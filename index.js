const fs = require("fs");
const express = require('express')
const cases = require('./consts.js');
var cors = require('cors');

const app = express();
const port = 3003;

app.use(cors());

app.get('/cases/:id', function(req, res){
  const id = req.params.id.split('.')[0];
  console.log(`[EXECUTING] ${cases[id-1]}`);
  const file = `${__dirname}/cases/${id}.mpd`;
  if (fs.existsSync(file))
    res.download(file);  
});

app.listen(port, () => {
  console.log(`Test runner is running on port http://localhost:${port}`);
});