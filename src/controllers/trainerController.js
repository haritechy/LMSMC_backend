const trainerService = require("../services/trainerService");


exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await trainerService.getAllTrainers();
    res.status(200).json(trainers);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getTrainerById = async (req, res) => {
  try {
    const trainer = await trainerService.getTrainerById(req.params.id);
    res.status(200).json(trainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.createTrainer = async (req, res) => {
  try {
    const trainer = await trainerService.createTrainer(req.body);
    res.status(201).json(trainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateTrainer = async (req, res) => {
  try {
    const trainer = await trainerService.updateTrainer(req.params.id, req.body);
    res.status(200).json(trainer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteTrainer = async (req, res) => {
  try {
    await trainerService.deleteTrainer(req.params.id);
    res.status(200).json({ message: "Trainer deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
