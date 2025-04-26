import { Router } from 'express';
import { LoginController, RegisterController, LogoutController, RefreshTokenController, EmailVerificationController, PasswordResetController } from '../controllers/auth';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', RegisterController.register);
router.post('/login', LoginController.login);
router.post('/verify-email', EmailVerificationController.verifyEmail);
router.post('/resend-verification', EmailVerificationController.resendVerificationEmail);
router.post('/refresh-token', RefreshTokenController.refreshToken);
 router.post('/forgot-password', PasswordResetController.requestPasswordReset);
 router.post('/reset-password', PasswordResetController.resetPassword);

// Protected routes
router.post('/logout', authenticate, LogoutController.logout);
router.get('/test-auth', authenticate, (req, res) => {
    res.json({
      message: 'Authentication successful!',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  });
export default router;
