
(done) You must fork over this repo: https://github.com/carmandomx/compression and create a HTTP server with the following requirements:

   (done) Hostname must be localhost
    (done)Port must be 5000
    The only endpoint available is going to be [POST] /upload
    (done) All other paths must return - 501 - Not implemented
    The endpoint must work in the following way:
        The request must be a multipart/form-data
        The request must contain the Accept-Encoding http header indicating the compression format
        Challenge: Encrypt the file <-- Work for this one!!!
        Compress the file
        Return the compressed file in the response
    The root path (/) must serve a HTMLfile containing a form capable of uploading the file for compression to the endpoint /upload
    The compressed file must try to download via the browser.
    All of this must work locally not over the internet
    No express allowed

