const ApiError = require("../exceptions/api-error");

module.exports = (err, req, res, next)=>{
    console.error(err);
    if(err instanceof ApiError){
        res.status(err.status).json({message:err.message, errors:err.errors});
    }else{
        res.status(500).json({message:'Unhandled error!'});
    }
    next()
}