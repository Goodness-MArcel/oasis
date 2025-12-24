import db from "../../models/index.js";

export async function listMeetings(req, res) {
  try {
    const { start, end } = req.query;
    const where = {};
    const Op = db.Sequelize.Op;

    if (start && end) {
      where.start = { [Op.between]: [new Date(start), new Date(end)] };
    }

    const meetings = await db.Meeting.findAll({
      where,
      order: [["start", "ASC"]],
    });

    const events = meetings.map((m) => ({
      id: m.id,
      title: m.title,
      start: m.start,
      end: m.end,
      allDay: m.allDay,
    }));

    return res.json(events);
  } catch (err) {
    console.error("Error listing meetings:", err);
    return res.status(500).json({ error: "Failed to load meetings" });
  }
}

export async function createMeeting(req, res) {
  try {
    const { title, start, end, allDay } = req.body;

    if (!title || !start) {
      return res.status(400).json({ error: "Title and start are required" });
    }

    const meeting = await db.Meeting.create({
      title: title.trim(),
      start: new Date(start),
      end: end ? new Date(end) : null,
      allDay: Boolean(allDay),
    });

    return res.status(201).json({
      id: meeting.id,
      title: meeting.title,
      start: meeting.start,
      end: meeting.end,
      allDay: meeting.allDay,
    });
  } catch (err) {
    console.error("Error creating meeting:", err);
    return res.status(500).json({ error: "Failed to create meeting" });
  }
}

export async function updateMeeting(req, res) {
  try {
    const id = req.params.id;
    const meeting = await db.Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const { title, start, end, allDay } = req.body;

    if (title !== undefined) meeting.title = title.trim();
    if (start !== undefined) meeting.start = new Date(start);
    if (end !== undefined) meeting.end = end ? new Date(end) : null;
    if (allDay !== undefined) meeting.allDay = Boolean(allDay);

    await meeting.save();

    return res.json({
      id: meeting.id,
      title: meeting.title,
      start: meeting.start,
      end: meeting.end,
      allDay: meeting.allDay,
    });
  } catch (err) {
    console.error("Error updating meeting:", err);
    return res.status(500).json({ error: "Failed to update meeting" });
  }
}

export async function deleteMeeting(req, res) {
  try {
    const id = req.params.id;
    const meeting = await db.Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    await meeting.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error("Error deleting meeting:", err);
    return res.status(500).json({ error: "Failed to delete meeting" });
  }
}
