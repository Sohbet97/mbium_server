const cookie = require('cookie');
module.exports = (req, res, next)=>{
    if(req?.headers?.cookie){
        req.cookies = cookie.parse(req.headers.cookie);
    }else{
        req.cookies = {};
    }
    next();
}