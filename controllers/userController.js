const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjusted path

async function getUser(req, res) {
  const { username, email } = req.body;

  try {
    const result = await sequelize.query(
      'SELECT * FROM users WHERE User_Username = :username OR Email = :email', 
      {
        replacements: { username, email },
        type: QueryTypes.SELECT
      }
    );
    res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  getUser,
};
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjusted path

async function getUser(req, res) {
  const { username, email } = req.body;

  try {
    const result = await sequelize.query(
      'SELECT * FROM users WHERE User_Username = :username OR Email = :email', 
      {
        replacements: { username, email },
        type: QueryTypes.SELECT
      }
    );
    res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  getUser,
};
