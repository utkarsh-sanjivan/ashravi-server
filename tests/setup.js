// Dynamo-backed tests pending; placeholder setup
global.testUtils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },
  randomEmail: () => `test${Date.now()}@example.com`
};
