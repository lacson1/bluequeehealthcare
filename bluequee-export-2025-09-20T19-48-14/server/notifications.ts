import admin from 'firebase-admin';

// Initialize Firebase Admin (you'll need to provide your service account key)
let firebaseApp: admin.app.App | null = null;

export function initializeFirebase() {
  if (!firebaseApp && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  }
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  userRole?: string;
  patientId?: number;
}

export async function sendNotificationToRole(role: string, notification: NotificationData) {
  if (!firebaseApp) {
    console.warn('Firebase not initialized, skipping notification');
    return;
  }

  try {
    // Send to topic based on user role
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      topic: `role_${role}`,
    };

    const response = await admin.messaging().send(message);
    console.log(`Notification sent to ${role}:`, response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function sendUrgentNotification(notification: NotificationData) {
  if (!firebaseApp) {
    console.warn('Firebase not initialized, skipping urgent notification');
    return;
  }

  try {
    // Send to all medical staff for urgent situations
    const roles = ['doctor', 'nurse', 'admin'];
    const promises = roles.map(role => sendNotificationToRole(role, notification));
    await Promise.all(promises);
    console.log('Urgent notification sent to all medical staff');
  } catch (error) {
    console.error('Error sending urgent notification:', error);
  }
}

// Real-time notification types based on actual database events
export const NotificationTypes = {
  // These will be triggered by actual database events and real patient data
  LAB_RESULT_ABNORMAL: (patientName: string, testName: string) => ({
    title: 'Abnormal Lab Result',
    body: `${patientName} has abnormal ${testName} results requiring immediate attention`,
    data: { type: 'lab_abnormal', priority: 'high' }
  }),

  LAB_RESULT_READY: (patientName: string, testName: string) => ({
    title: 'Lab Results Ready',
    body: `${testName} results are ready for ${patientName}`,
    data: { type: 'lab_ready', priority: 'normal' }
  }),

  PRESCRIPTION_EXPIRING: (patientName: string, medicationName: string) => ({
    title: 'Prescription Expiring Soon',
    body: `${patientName}'s prescription for ${medicationName} expires soon`,
    data: { type: 'prescription_expiring', priority: 'normal' }
  }),

  APPOINTMENT_TODAY: (patientName: string, time: string) => ({
    title: 'Appointment Today',
    body: `${patientName} has an appointment at ${time}`,
    data: { type: 'appointment_today', priority: 'high' }
  }),

  RECENT_VISIT: (patientName: string, purpose: string) => ({
    title: 'Recent Patient Visit',
    body: `${patientName} visited for ${purpose}`,
    data: { type: 'recent_visit', priority: 'normal' }
  })
};