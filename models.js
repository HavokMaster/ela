const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  subject: String,
  semester: Number,
  notesUrl: String
});

const questionPaperSchema = new mongoose.Schema({
  subject: String,
  semester: Number,
  year: Number,
  questionPaperUrl: String
});

const questionBankSchema = new mongoose.Schema({
  subject: String,
  semester: Number,
  questionBankUrl: String
})

const mockTestSchema = new mongoose.Schema({
  subject: String,
  semester: Number,
  mockTestUrl: String
})

const Note = mongoose.model('Note', noteSchema);
const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);
const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
const MockTest = mongoose.model('MockTest', mockTestSchema);

module.exports = {
  Note,
  QuestionPaper,
  QuestionBank,
  MockTest
};
