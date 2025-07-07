// bar bar ek hi wrapper type duction hai muze do me execute karunga

const asyncHandler =(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((error)=>next(error))
    }
}

export {asyncHandler}

// const asyncHandler = () =>{}
// const asyncHandler = (func) =>{}
// const asyncHandler = (func) => async()=>{}

//asyn await mathod
// const asyncHandler =(fn)=> (req,res,next)=>{  
//     try {
//         await fn(req,res,next);
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message : error.message;
//         })
//     }
// }