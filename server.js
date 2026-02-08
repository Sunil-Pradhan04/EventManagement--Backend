import app from "./app.js";

const PORT = process.env.port || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
