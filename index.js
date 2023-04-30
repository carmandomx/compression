// Code here.

const http = require("http");
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const url = { //URL Path Object
    host : "localhost",
    port : "5000"
}

const requestListener = function(req,res){  
    if (req.url === '/') {
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
    }else if (req.url === '/upload' && req.method === 'POST'){
        let data = '';
        req.on('data', chunk => { //Reads the data and metadata of the file and sends it to the variable data
            data += chunk;
        });
        req.on('end', () => {
            const fileNameRegex = /filename="(.*)"/;
            const fileNameMatch = data.match(fileNameRegex); //Uses regular expression to find the file's name in the metadata and returns an array
            if (!fileNameMatch) {
                res.writeHead(400);
                res.end('Name of the file not found');
                return;
            }
            const fileName = fileNameMatch[1]; //The name of the file is in the second position of the array
            const fileStartIndex = data.indexOf('\r\n\r\n') + 4;
            const fileData = data.substring(fileStartIndex); //We use the variable fileData to ignore the metadata 
            const compressedData = zlib.gzipSync(fileData); //Compress the data
            const filePath = path.join(__dirname, fileName + '.gz'); 
            fs.writeFile(filePath, compressedData, err => { //Creates writable stream and saves the compressed data in a .gz file
                if (err) {
                    res.writeHead(501);
                    res.end('Server error');
                } else {
                    res.setHeader('Content-disposition', 'attachment; filename=' + fileName + '.gz');
                    res.setHeader('Content-Type', 'application/gzip');
                    fs.createReadStream(filePath).pipe(res);
                    
                }
            });
        });
        
    }else{
        res.statusCode = 501; //Default condition
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not implemented');
        }
      }


const server = http.createServer(requestListener);

server.listen(url.port, url.host,()=>{
    console.log(`Server is running on http://${url.host}:${url.port}`);
})