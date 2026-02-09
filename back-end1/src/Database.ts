import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
});
const gameSchema = new mongoose.Schema({
  whitePlayer: { type: String, required: true },
  blackPlayer: { type: String, required: true },
  moves: [String],
  result: { type: String, enum: ['white', 'black', 'draw', 'ongoing'], default: 'ongoing' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
});
export const User = mongoose.model('User', userSchema);
export const GameRecord = mongoose.model('Game', gameSchema);
export const connectMongoose = async () => {
  const mongoDB = process.env.MONGODB_URI;
  if (!mongoDB){
    console.error("❌ MONGODB_URI not found in .env");
    process.exit(1);
  }
  try{
    await mongoose.connect(mongoDB,{
      dbName: "chessdb",
    });
    console.log("✅ Connected to MongoDB Atlas");
  }catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

export const registerUser = async (username: string, password: string, email: string) => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return { success: false, message: 'Username already taken' };
    }
    
    // Check for existing email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return { success: false, message: 'Email already in use' };
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      username,
      password: hashedPassword,
      email: normalizedEmail
    });
    await newUser.save();
    
    return { 
      success: true, 
      message: 'User registered successfully',
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username
      }
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern?.email) {
        return { success: false, message: 'Email already in use' };
      }
      if (error.keyPattern?.username) {
        return { success: false, message: 'Username already taken' };
      }
    }
    return { success: false, message: 'Server error during registration' };
  }
};

export const authenticateUser = async (email: string, password: string) => {
  try {
    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch){
      return { success: false, message: 'Invalid email or password' };
    }
    
    return { 
      success: true, 
      message: 'Authentication successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username
      },
      userData: {
        email: user.email,
        gamesPlayed: user.gamesPlayed,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Server error during authentication' };
  }
};
export const saveGameRecord = async (
  gameData:{
    whitePlayer: string,
    blackPlayer: string,
    moves: string[],
    result: 'white' | 'black' | 'draw' | 'ongoing',
    startTime: Date,
    endTime?: Date
  }
): Promise<{ success: true, gameId: string } | { success: false, message: string }> => {
  try {
    const newGame = new GameRecord(gameData);
    const savedGame = await newGame.save();
    if (gameData.result !== 'ongoing') {
      await updatePlayerStats(gameData.whitePlayer, gameData.blackPlayer, gameData.result);
    }
    return { success: true, gameId: savedGame._id.toString() };
  } catch (error) {
    console.error('Error saving game:', error);
    return { success: false, message: 'Error saving game record' };
  }
};

const updatePlayerStats = async (whitePlayerEmail: string, blackPlayerEmail: string, result: string) => {
  const whiteUpdate: any = { $inc: { gamesPlayed: 1 } };
  if (result === 'white') whiteUpdate.$inc.wins = 1;
  else if (result === 'black') whiteUpdate.$inc.losses = 1;
  else if (result === 'draw') whiteUpdate.$inc.draws = 1;
  const blackUpdate: any = { $inc: { gamesPlayed: 1 } };
  if (result === 'black') blackUpdate.$inc.wins = 1;
  else if (result === 'white') blackUpdate.$inc.losses = 1;
  else if (result === 'draw') blackUpdate.$inc.draws = 1;
  await User.updateOne({ email: whitePlayerEmail }, whiteUpdate);
  await User.updateOne({ email: blackPlayerEmail }, blackUpdate);
};

export const getPlayerGameHistory = async (email: string) => {
  try {
    const games = await GameRecord.find({
      $or: [
        { whitePlayer: email },
        { blackPlayer: email }
      ]
    }).sort({ startTime: -1 }).limit(20);
    
    return { success: true, games };
  } catch (error) {
    console.error('Error fetching game history:', error);
    return { success: false, message: 'Error retrieving game history' };
  }
};

