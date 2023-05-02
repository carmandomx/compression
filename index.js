const http = require("http");
const fs = require("fs");
const zlib = require("zlib");

const hostname = "localhost";
const port = 5000;

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    //Response to the home page
    fs.readFile("./index.html", (err, data) => {
      //Load the html page
      if (err) {
        //If any error happens with the loading of the html page
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.end("Internal server error");
      } else {
        //If there are no errors with the page
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.end(data);
      }
    });
  } else if (req.url === "/upload" && req.method === "POST") {
    //Response to the /upload endpoint with a POST request
    const chunks = []; //Create a variable that will store the chunks of information in an array

    req.on("data", (chunk) => {
      //On data, push the chunk to the chunks array
      chunks.push(chunk);
    });

    req.on("end", () => {
      //When all the data is pushed to the chunks array
      const data = Buffer.concat(chunks); //Concat all the chunks in a data variable
      const fileNameRegex = /filename="(.*)"/; //Then create a variable that will store a Regular expresion, in this case the expresion is "filename=*anything*"
      const fileNameMatch = data.toString().match(fileNameRegex); //This other variable will store in an array the coincidences with the RegEx, for example, filename="example.txt"
      if (!fileNameMatch) {
        //If it couldn't find any coincidences with the regular expresion it will throw an error 400, and a message of "Name of the file not found"
        res.writeHead(400);
        res.end("Name of the file not found");
        return;
      }
      const fileName = fileNameMatch[1]; //The match() method on a string with a regular expression that has capturing groups, it returns an array.
      //The first element of the array (at index 0) contains the entire matched string, while the subsequent elements (at index 1 and onwards) contain the results of the capturing groups, in the order they appear in the regular expression.
      //For example fileNameMatch[0] will be filename="example.txt" and fileNameMatch[1] will be "example.txt"

      /*The indexOf() method is called on the buffer data to find the index of the first occurrence of the sequence "\r\n\r\n" (two consecutive CRLF line breaks). In the context of a multipart/form-data request, this sequence is used to separate the headers (metadata) of each part from its actual data.
      In this specific case, the sequence marks the end of the metadata for the file part and the beginning of the actual file data.
      The + 4 is added to the result of data.indexOf("\r\n\r\n") to move the starting index beyond the "\r\n\r\n" sequence (which has a length of 4 characters) and point directly to the start of the actual file data. */
      const fileStartIndex = data.indexOf("\r\n\r\n") + 4;
      const fileData = data.slice(fileStartIndex); //This line creates a new buffer containing only the file data by slicing the original data buffer from the fileStartIndex.
      const compressedData = zlib.gzipSync(fileData); //This line compresses the file data using the gzipSync() function from the zlib module. The function takes the input data and returns a compressed buffer.
      res.setHeader(
        //This line sets the 'Content-Disposition' header of the response to trigger a download with the compressed file's name.
        "Content-disposition",
        `attachment; filename=${fileName}.gz`
      );
      res.setHeader("Content-Type", "application/gzip"); //Sets the 'Content-Type' header of the response to indicate that the content being sent is a gzip file.
      res.end(compressedData); //This sends the compressed data as the response and signals the end of the response.
    });
  } else {
    //If you request an endpoint different to http://localhost:5000/ or http://localhost:5000/upload a status code of 501 and a message of "Not implemented" is displayed
    res.statusCode = 501;
    res.setHeader("Content-Type", "text/plain");
    res.end("Not implemented");
  }
});

server.listen(port, hostname, () => {
  //Method is used to start the HTTP server and make it listen for incoming requests on a specified hostname and port.
  console.log(`Server is running on http://${hostname}:${port}`); //Log in the console the hostname and the port that the server is running on.
});
