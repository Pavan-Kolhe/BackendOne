//require("dotenv").config({path : "./env"})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  // allows to use process.env
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("ERROR :", error);
      throw error;
    });

    const port = process.env.PORT || 8000;

    app.listen(port, () => {
      console.log(`server is running at port 
            : ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed!!!", err);
  });

/*
import express from "express";
const app = express();
//iffi --> directly execute kardo
;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on("error",(error)=>{
            console.error("ERROR :", error);
            throw error;  
        })

        app.listen(process.env.PORT ,()=>{
            console.log(`App is listening on port  
                ${process.env.PORT}`);
        })


    } catch (error) {
        console.error("ERROR :",error);
        throw error  
    }
})()
*/
