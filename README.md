### Mini project Node

You must fork over this repo: https://github.com/carmandomx/compression and create a HTTP server with the following requirements:

	(done) Hostname must be localhost 
	(done)Port must be 5000 
	(done) The only endpoint available is going to be [POST] /upload 
	(done) All other paths must return - 501 - Not implemented The endpoint must work in the following way: 
		(done)The request must be a multipart/form-data (done)The request must contain the Accept-Encoding http header indicating the compression format 
		(not done)_Challenge: Encrypt the file <-- Work for this one!!!. 
		(done)Compress the file. 
		(done)Return the compressed file in the response 
		(done)The root path (/) must serve a HTMLfile containing a form capable of uploading the file for compression to the endpoint /upload.
	(done)The compressed file must try to download via the browser. (done)All of this must work locally not over the internet.
	(done) No express allowed.

