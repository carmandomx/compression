// Code here.

const http = require("http");
const fs = require('fs');
const formidable = require('formidable');

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
                res.end('Error interno del servidor');
            } else {
                //console.log(files.file.filepath)
                const oldPath = files.file.filepath;
                const newPath = 'archivos/' + files.file.originalFilename
                res.setHeader('Content-Disposition', 'attachment; filename=' + files.file.originalFilename);
                res.setHeader('Content-Type', 'application/octet-stream'); 
                fs.rename(oldPath, newPath, (err) => {
                    if (err) {
                        console.log(err)
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('Error al guardar el archivo');
                    } else {
                        
                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        const fileStream = fs.createReadStream(newPath);
                        fileStream.pipe(res);
                        
   
                    }
                res.end('Archivo enviado exitosamente');
                });
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