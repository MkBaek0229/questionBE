import csrf from "csurf";

const csrfMiddleware = csrf({ cookie: true });

export default csrfMiddleware;
