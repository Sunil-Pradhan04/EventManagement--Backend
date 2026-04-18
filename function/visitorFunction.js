import { Visitor } from "../model/visitorSchema.js";
import { sendPortfolioWelcomeMail } from "../middleware/emailSetup.js";

export const addVisitor = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and Email are required." });
    }

    // Basic email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    // Check if visitor already exists (optional, but good to prevent spam in DB)
    let visitor = await Visitor.findOne({ email });
    if (!visitor) {
      visitor = new Visitor({ name, email });
      await visitor.save();
    }

    // Send the welcome email with the portfolio link
    await sendPortfolioWelcomeMail(email, name);

    return res.status(200).json({ message: "Access granted and welcome email sent." });
  } catch (error) {
    console.error("Error adding visitor:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
