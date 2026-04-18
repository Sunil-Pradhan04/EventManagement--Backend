import { Feedback } from "../model/feedbackSchema.js";

export const addFeedback = async (req, res) => {
  console.log("Runned..")
  try {
    const { name, rating, comments } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "A valid rating out of 5 is required." });
    }

    const newFeedback = new Feedback({
      name,
      rating,
      comments: comments || "",
    });

    await newFeedback.save();

    return res.status(201).json({ message: "Thank you! Your feedback has been submitted successfully." });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return res.status(500).json({ message: "Server error handling feedback", error: error.message });
  }
};
