export const Auth = (req, res, next) => {
  try{
    if(!req.session.userId){
      return res.status(401).json({ message: "Unauthorised Access" });
    }
  }
  catch(err){
    return res.status(401).json({ message: "Somthing wants wrong", error: err.message });
  }
  next();
}

export const AdminAuth = (req, res, next) => {
  try{
    if(!req.session.userId || req.session.role !== "admin"){
      return res.status(401).json({ message: "Unauthorised Access" });
    }
  }
  catch{
    return res.status(401).json({ message: "Somthing wants wrong" });
  }
  next();
}