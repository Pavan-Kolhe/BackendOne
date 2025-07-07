import multer from "multer";

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