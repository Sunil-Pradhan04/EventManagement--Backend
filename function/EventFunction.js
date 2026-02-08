import { sendEventAnnouncementMail, sendNewEventMail } from "../middleware/emailSetup.js";
import { Event, EventAnoussment, EnrollmentModel } from "../model/HubSchema.js";
import { Admin, User } from "../model/userSchema1.js";
// import { generateMail } from "../services/ai.service.js";
import { aiChat, generateMail } from "../services/ai.service.js";
import { storeTextInVectorDB } from "../services/storage.js";

export const createEvent = async (req, res) => {
  const {
    Ename,
    coordinators,
    rules,
    contactNumber,
    tags,
    isIndoor,
    eventType,
    eventDate,
    eventTime,
    venue,
    sendNotification, // Checkbox flag
  } = req.body;

  const exist = await Event.findOne({ Ename });
  if (exist) {
    return res.status(401).json({ message: "This Event alredy Exists" });
  }
  if (
    !Ename ||
    !coordinators ||
    coordinators.length === 0 ||
    !rules ||
    !contactNumber
  ) {
    return res
      .status(400)
      .json({ message: "Please fill all required (*) fields." });
  }
  const eAdmin = req.session.userId;
  try {
    const newEvent = new Event({
      EventAdmin: [eAdmin],
      Ename,
      coordinators,
      rules,
      contactNumber,
      tags: tags || [],
      isIndoor: isIndoor ?? false,
      eventType: eventType || "Individual",
      eventDate: eventDate || null,
      eventTime: eventTime || null,
      venue: venue || "",
    });

    const userId = req.session.userId;
    const existUser = await Admin.findOne({ email: userId });
    existUser.events = [Ename, ...existUser.events];
    existUser.expireAt = undefined;
    await existUser.save();
    await newEvent.save();

    // Store event description in vector DB
    await storeTextInVectorDB(rules, Ename);

    // Send Mass Notification if requested
    if (sendNotification) {
      const allUsers = await User.find({}, "email");
      const allAdmins = await Admin.find({}, "email");
      const recipients = [...allUsers, ...allAdmins]
        .map(u => u.email)
        .filter(email => email); // Filter out any empty emails

      const uniqueRecipients = [...new Set(recipients)]; // Remove duplicates

      console.log(`Sending new event mail to ${uniqueRecipients.length} users...`);

      const eventLink = `http://localhost:5173/EventPage/${newEvent._id}`;

      // In production, use a queue. Here we just map promises (careful with large lists)
      uniqueRecipients.forEach(email => {
        sendNewEventMail(email, Ename, eventLink).catch(err => console.error("Failed mail to", email));
      });
    }

    res.status(201).json({
      message: "✅ Event created successfully",
      event: newEvent,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "❌ Server Error",
      error: err.message,
    });
  }
};

export const getEvent = async (req, res) => {
  try {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit) || 10;
    let lite = req.query.lite === "true";
    let search = req.query.search || "";
    let filter = req.query.filter || "all";

    let skip = (page - 1) * limit;

    let queryObj = {};
    if (search) {
      queryObj.Ename = { $regex: search, $options: "i" };
    }

    if (filter === "active") {
      queryObj.visibility = true;
      queryObj.status = "upcoming";
    } else if (filter === "inactive") {
      queryObj.visibility = false;
    } else if (filter === "finished") {
      queryObj.status = "finished";
    } else if (filter === "indoor") {
      queryObj.isIndoor = true;
    } else if (filter === "outdoor") {
      queryObj.isIndoor = false;
    }

    let query = Event.find(queryObj).sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (lite) {
      query = query.select("_id Ename tags createdAt visibility eventDate venue coordinators status winners");
    }

    const events = await query;

    const total = await Event.countDocuments();

    res.status(200).json({
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const toggleEventVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    const eAdmin = req.session.userId;
    if (!event.EventAdmin.includes(eAdmin)) {
      return res.status(401).json({ message: "Unauthorised Access" });
    }
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // If event is finished and we are making it visible again, reset status
    if (!event.visibility && event.status === "finished") {
      event.status = "upcoming";
      event.winners = [];
    }
    event.visibility = !event.visibility;
    await event.save();

    res.status(200).json({
      message: `✅ Event visibility updated successfully`,
      event, // return the full event object
    });
  } catch (err) {
    res.status(500).json({
      message: "❌ Server Error",
      error: err.message,
    });
  }
};

export const addEventAnoussment = async (req, res) => {
  try {
    const { Aheader, Adescription, Ename, sendNotification } = req.body;
    if (!Aheader || !Adescription) {
      return res
        .status(400)
        .json({ message: "Please fill all required (*) fields." });
    }

    const newAnoussment = new EventAnoussment({
      Ename,
      Aheader,
      Adescription,
    });

    await newAnoussment.save();

    // Send Notification to Participants if requested
    if (sendNotification) {
      const enrollments = await EnrollmentModel.find({ EventName: Ename });
      if (enrollments.length > 0) {
        console.log(`Sending announcement mail to ${enrollments.length} participants...`);
        enrollments.forEach(enrollment => {
          sendEventAnnouncementMail(
            enrollment.UserEmail,
            enrollment.userName,
            Ename,
            `<p><b>${Aheader}</b></p><p>${Adescription}</p>`
          ).catch(err => console.error("Failed mail to", enrollment.UserEmail));
        });
      }
    }

    res.status(201).json({
      message: "✅ Announcement created successfully",
      Anoussment: newAnoussment,
    });
  } catch (err) {
    console.error("Error in AddAnnouncement:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const getEventAnoussments = async (req, res) => {
  try {
    const { Ename } = req.params;
    console.log(Ename);
    const anoussments = await EventAnoussment.find({ Ename }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      anoussments,
    });
  } catch (err) {
    console.error("Error in getEventAnoussments:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const deleteEventAnoussment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAnnouncement = await EventAnoussment.findByIdAndDelete(id);
    if (!deletedAnnouncement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.status(200).json({
      message: "✅ Announcement deleted successfully",
      id: id,
    });
  } catch (err) {
    console.error("Error in deleteEventAnoussment:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};


export const Enrollment = async (req, res) => {
  try {
    const { EventName, userName, UserEmail } = req.body;

    const existUser = await EnrollmentModel.findOne({ UserEmail, EventName });

    if (existUser) {
      return res.status(400).json({ message: "You are already enrolled." });
    }

    if (!EventName || !UserEmail) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const newEnrollment = new EnrollmentModel({
      EventName,
      userName,
      UserEmail,
    });

    let user = await Admin.findOne({ email: UserEmail });

    if (!user) {
      user = await User.findOne({ email: UserEmail });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.RegistrEvents = user.RegistrEvents
      ? [EventName, ...user.RegistrEvents]
      : [EventName];
    user.expireAt = undefined;

    await user.save();
    await newEnrollment.save();

    res.status(201).json({
      message: "✅ Enrollment successful",
      Enrollment: newEnrollment,
    });

  } catch (err) {
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};



export const CreateMail = async (req, res) => {

  try {
    const { topic } = req.body;
    console.log("Topic received:", topic);
    const generatedMail = await generateMail(topic);
    return res.status(200).json({ mail: generatedMail })
  }
  catch (err) {
    console.log("Error in sendEmail:", err);
  }
}

export const sendEmail = async (req, res) => {
  console.log("Sending email to all participants");
  try {
    const { eventName, mailContent } = req.body;

    if (!mailContent) {
      return res.status(400).json({ message: "No mail content provided" });
    }

    const enrollments = await EnrollmentModel.find({ EventName: eventName });

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ message: "No participants found for this event" });
    }

    console.log(`Found ${enrollments.length} participants for event: ${eventName}`);

    // Loop through enrollments and send email
    // In a production environment, use a queue (like BullMQ) or batching to avoid timeout
    const emailPromises = enrollments.map((enrollment) =>
      sendEventAnnouncementMail(
        enrollment.UserEmail,
        enrollment.userName,
        eventName,
        mailContent
      )
    );

    await Promise.all(emailPromises);

    return res.status(200).json({ message: `Emails sent successfully to ${enrollments.length} participants` });
  } catch (err) {
    console.error("Error in sendEmail:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
export const chatWithAi = async (req, res) => {
  const { message, Ename, language } = req.body;
  const userId = req.session.userId;
  try {
    const aiResponse = await aiChat(message, Ename, userId, language);
    return res.status(200).json({ response: aiResponse });
  }
  catch (err) {
    return res.status(500).json({ message: "Error in AI chat", error: err.message });
  }
};

export const getEventEnrollments = async (req, res) => {
  try {
    const { eventName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const enrollments = await EnrollmentModel.find({ EventName: eventName })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EnrollmentModel.countDocuments({ EventName: eventName });

    res.status(200).json({
      enrollments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching enrollments:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const finishEvent = async (req, res) => {
  try {
    const { eventId, winners } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = "finished";
    event.winners = winners;
    event.visibility = false;
    await event.save();

    await User.updateMany(
      { RegistrEvents: event.Ename },
      { $pull: { RegistrEvents: event.Ename } }
    );

    await Admin.updateMany(
      { RegistrEvents: event.Ename },
      { $pull: { RegistrEvents: event.Ename } }
    );

    await EnrollmentModel.deleteMany({ EventName: event.Ename });

    res.status(200).json({
      message: "✅ Event finished successfully. Participants cleared.",
      event,
    });
  } catch (err) {
    console.error("Error finishing event:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Remove from User and Admin RegistrEvents
    await User.updateMany(
      { RegistrEvents: event.Ename },
      { $pull: { RegistrEvents: event.Ename } }
    );

    await Admin.updateMany(
      { RegistrEvents: event.Ename },
      { $pull: { RegistrEvents: event.Ename } }
    );

    // Remove from Coordinator's event list
    await Admin.updateMany(
      { events: event.Ename },
      { $pull: { events: event.Ename } }
    );

    // Delete related data
    await EnrollmentModel.deleteMany({ EventName: event.Ename });
    await EventAnoussment.deleteMany({ Ename: event.Ename });

    // Delete the event itself
    await Event.findByIdAndDelete(id);

    res.status(200).json({ message: "✅ Event and all related data deleted successfully" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { venue, eventDate, eventTime, contactNumber } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Only update allowed fields
    if (venue) event.venue = venue;
    if (eventDate) event.eventDate = eventDate;
    if (eventTime) event.eventTime = eventTime;
    if (contactNumber) event.contactNumber = contactNumber;

    await event.save();

    res.status(200).json({ message: "✅ Event updated successfully", event });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
