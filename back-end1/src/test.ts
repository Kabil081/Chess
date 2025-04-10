import { connectDB, registerUser } from './Database';
(async () => {
  await connectDB();
  const result = await registerUser('testuser123', 'password123');
  console.log(result);
})();
