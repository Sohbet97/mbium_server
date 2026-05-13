class Logger {
    ipAddress;
    route;
    method;
    query;
    body;
    status;
    userId;
    

    constructor(route, ipAddress='', method='GET', query = '', body = '', status = undefined, userId = ''){
        this.ipAddress = ipAddress;
        this.route = route;
        this.method = method;
        this.query = query;
        this.body = body;
        this.status = status;
        this.userId = userId;
    }
}

module.exports = Logger