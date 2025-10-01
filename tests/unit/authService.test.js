const authService = require('../../src/services/authService');
const User = require('../../src/models/User');

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = testUtils.generateUserData();

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.role).toBe('user');
      expect(result.token).toBeTruthy();
    });

    it('should throw error if user already exists', async () => {
      const userData = testUtils.generateUserData();

      // Create user first
      await User.create(userData);

      // Try to register same user again
      await expect(authService.register(userData)).rejects.toThrow('User already exists');
    });

    it('should throw error with invalid email', async () => {
      const userData = testUtils.generateUserData({ email: 'invalid-email' });

      await expect(authService.register(userData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);

      const result = await authService.login({
        email: userData.email,
        password: userData.password
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeTruthy();
    });

    it('should throw error with invalid credentials', async () => {
      const userData = testUtils.generateUserData();
      await User.create(userData);

      await expect(authService.login({
        email: userData.email,
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for non-existent user', async () => {
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);

      const profile = await authService.getProfile(user._id);

      expect(profile).toHaveProperty('_id');
      expect(profile.email).toBe(userData.email);
      expect(profile.name).toBe(userData.name);
      expect(profile).not.toHaveProperty('password');
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(authService.getProfile(fakeId)).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);

      const updateData = { name: 'Updated Name' };
      const result = await authService.updateProfile(user._id, updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.email).toBe(userData.email);
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(authService.updateProfile(fakeId, { name: 'New Name' }))
        .rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);

      const newPassword = 'NewPassword123!';
      const result = await authService.changePassword(
        user._id, 
        userData.password, 
        newPassword
      );

      expect(result.message).toBe('Password changed successfully');

      // Verify new password works
      const loginResult = await authService.login({
        email: userData.email,
        password: newPassword
      });
      expect(loginResult.token).toBeTruthy();
    });

    it('should throw error with incorrect current password', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);

      await expect(authService.changePassword(
        user._id, 
        'wrongpassword', 
        'NewPassword123!'
      )).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const userData = testUtils.generateUserData();
      const user = await User.create(userData);
      const token = authService.generateToken(user);

      const verifiedUser = await authService.verifyToken(token);

      expect(verifiedUser._id.toString()).toBe(user._id.toString());
      expect(verifiedUser.email).toBe(user.email);
    });

    it('should throw error for invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';

      await expect(authService.verifyToken(invalidToken))
        .rejects.toThrow('Invalid token');
    });
  });
});
