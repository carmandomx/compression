// Code here.

const http = require("http");
const fs = require('fs');

const url = { //URL Path Object
    host : "localhost",
    port : "5000"
}

const requestListener = function(req,res){  
    switch (req.url) {
        case '/':
            fs.readFile('./index.html', (err, data) => {  //Reading the HTML file for uploading files
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Internal server error');
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/html');
                    res.end(data);
                }
              }); 
            break;         
        case '/upload':
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Sumbit your files here');
          break;
        default:
          res.statusCode = 501; //Default condition
          res.setHeader('Content-Type', 'text/plain');
          res.end('Not implemented');
          break;
      }
}

const server = http.createServer(requestListener);

server.listen(url.port, url.host,()=>{
    console.log(`Server is running on http://${url.host}:${url.port}`);
})