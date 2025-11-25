// NO-OP Firebase module for TestFlight builds
// App treats user as always authenticated without Firebase dependency

// Mock auth object that satisfies Firebase Auth interface
export const auth = {
  currentUser: {
    uid: 'test-user-12345',
    email: 'testuser@mttc.app',
    emailVerified: true,
  },
  onAuthStateChanged: (callback: any) => {
    // Immediately call callback with mock user
    setTimeout(() => callback({
      uid: 'test-user-12345',
      email: 'testuser@mttc.app',
      emailVerified: true,
    }), 0);
    return () => {}; // Return unsubscribe function
  },
} as any;