import multer from "multer";                //Multer processes file uploads from the client, stores them on your server, and makes file info available in your route handlers. 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, file.fieldname + "-" + uniqueSuffix);       these things are tdone to have a unique fiel name
    //but we have done here simple thing -
    cb(null, file.originalname);
  },
});

export const upload = multer({ 
    storage,
});