// src/cron/verificationCron.ts

import cron from 'node-cron';
import prisma from '../config/prisma';

/**
 * Process unverified users and delete those who haven't verified within 24 hours
 */
async function processUnverifiedUsers(): Promise<void> {
  try {
    console.log('Running verification check for unverified users...');
    
    // Calculate the cutoff time (24 hours ago)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);
    
    // Find and delete unverified users created more than 24 hours ago
    const deletedUsers = await prisma.users.deleteMany({
      where: {
        email_verified: false,
        created_at: {
          lt: cutoffTime
        }
      }
    });
    
    console.log(`Deleted ${deletedUsers.count} unverified users that exceeded the 24-hour limit`);
    console.log('Verification cleanup process completed');
  } catch (error) {
    console.error('Error in verification cron job:', error);
    
  }
}

/**
 * Initialize the cron job
 * Runs every 4 hours by default
 */
export function initVerificationCron(): void {
  // Use environment variable for schedule if available, otherwise default to every 4 hours
  const schedule = process.env.VERIFICATION_CRON_SCHEDULE || '0 2 * * *';
  
  cron.schedule(schedule, async () => {
    try {
      await processUnverifiedUsers();
    } catch (error) {
      console.error('Unhandled error in verification cron:', error);
    }
  });
  
  console.log(`User verification cron job initialized with schedule: ${schedule}`);
}