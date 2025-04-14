import express, { Request, Response } from 'express';
import { registerUser, authenticateUser } from '../Database';
const router = express.Router();
router.route('/register').post(async (req: Request, res: Response): Promise<void> => {
  const { username, password, email } = req.body;
  if (!username || !password){
    res.status(400).json({ success: false, message: 'Username and password are required' });
    return;
  }
  try {
    const result = await registerUser(username, password, email);
    res.json(result);
  } catch (error) {
    console.error('Register route error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.route('/login').post(async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Username and password are required' });
    return;
  }

  try {
    const result = await authenticateUser(username, password);
    res.json(result);
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
export default router;
