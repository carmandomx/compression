// Code here.

const http = require("http");
const fs = require('fs');
const formidable = require('formidable');
const zlib = require('zlib');

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
        const form = formidable({ multiples:false });
        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end('Internal Server Error');
            } else {
                const oldPath = files.file.filepath;
                console.log(req.method)
                res.setHeader('Content-Disposition', 'attachment; filename=' + files.file.originalFilename);
                res.setHeader('Content-Type', 'application/octet-stream');
                
                const acceptEncoding = req.headers['accept-encoding'];
                if (acceptEncoding && acceptEncoding.includes('gzip')) {
                    // Si el cliente admite Gzip, comprimimos la respuesta
                    const gzip = zlib.createGzip();
                    const input = fs.createReadStream(oldPath);
                    const output = fs.createWriteStream(`./files/${files.file.originalFilename}.gz`)
                    input.pipe(gzip).pipe(output);
                    output.on("close",()=>{
                        res.setHeader('Content-Type', 'application/gzip');
                        res.setHeader('Content-Disposition', `attachment; filename=./files/${files.file.originalFilename}.gz`);
                        const compressedFileStream = fs.createReadStream('./files/'+files.file.originalFilename + '.gz');
                        compressedFileStream.pipe(res);
                    });
                   

                
                    
                } else {
                    // Si el cliente no admite Gzip, enviamos la respuesta sin comprimir
                    fs.createReadStream(oldPath).pipe(res);
  }
            }
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