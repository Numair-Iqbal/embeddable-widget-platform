const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ownersRepository = require('../repositories/owners.repository');

const SALT_ROUNDS = 10;

// Register a new owner: validate, hash password, save to database
async function register(email, password) {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingOwner = await ownersRepository.findByEmail(normalizedEmail);
  if (existingOwner) {
    const error = new Error('An owner with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const newOwner = await ownersRepository.create(normalizedEmail, passwordHash);

  return newOwner;
}

// Login: verify credentials, issue a JWT token
async function login(email, password) {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const owner = await ownersRepository.findByEmail(normalizedEmail);

  if (!owner) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, owner.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { ownerId: owner.id, email: owner.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return { token, owner: { id: owner.id, email: owner.email } };
}

module.exports = { register, login };