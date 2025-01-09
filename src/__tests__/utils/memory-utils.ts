export async function cleanupMemory() {
  try {
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.warn('Memory cleanup warning:', error);
  }
}
