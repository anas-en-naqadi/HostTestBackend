// server.ts
import { loadEnv } from './config/env';
import app from './app';

// Load environment variables
loadEnv();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
  console.log(`🔐 JWT Refresh Secret: ${process.env.JWT_REFRESH_SECRET ? 'Configured' : 'Not configured'}`);
});
