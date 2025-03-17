const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.isOperational) {
    res.status(err.statusCode).json({ message: err.message });
  } else {
    res.status(500).json({ message: "서버 오류 발생", error: err.message });
  }
};

export default errorHandler;
