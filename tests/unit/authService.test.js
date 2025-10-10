const authService = require('../../src/services/authService');
const Parent = require('../../src/models/Parent');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../../src/models/Parent');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Service - Unit Tests', () => {
  let mockParent;

  beforeEach(() => {
    jest.clearAllMocks();

    mockParent = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      city: 'New York',
      economicStatus: 'Middle Income',
      occupation: 'Software Engineer',
      childrenIds: [],
      isActive: true,
      refreshTokens: [],
      password: 'hashedPassword123',
      comparePassword: jest.fn(),
      getPublicProfile: jest.fn(() => ({
        id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer',
        childrenIds: [],
        childrenCount: 0
      })),
      getSignedJwtToken: jest.fn(() => 'mock-jwt-token'),
      generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
      save: jest.fn().mockResolvedValue(true)
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new parent successfully', async () => {
      const parentData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      };

      Parent.findOne = jest.fn().mockResolvedValue(null);
      Parent.create = jest.fn().mockResolvedValue(mockParent);

      const result = await authService.register(parentData);

      expect(Parent.findOne).toHaveBeenCalledWith({ email: parentData.email });
      expect(Parent.create).toHaveBeenCalled();
      expect(result).toHaveProperty('parent');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(mockParent.save).toHaveBeenCalled();
    });

    it('should throw error if parent already exists', async () => {
      const parentData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        city: 'New York',
        economicStatus: 'Middle Income',
        occupation: 'Software Engineer'
      };

      Parent.findOne = jest.fn().mockResolvedValue(mockParent);

      await expect(authService.register(parentData)).rejects.toThrow(
        'Parent already exists with this email address'
      );
    });
  });

  describe('login', () => {
    it('should login parent with valid credentials', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };

      mockParent.comparePassword.mockResolvedValue(true);
      Parent.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockParent)
      });

      const result = await authService.login(credentials);

      expect(Parent.findOne).toHaveBeenCalledWith({ 
        email: credentials.email, 
        isActive: true 
      });
      expect(mockParent.comparePassword).toHaveBeenCalledWith(credentials.password);
      expect(result).toHaveProperty('parent');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error with invalid email', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'password123'
      };

      Parent.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error with invalid password', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      mockParent.comparePassword.mockResolvedValue(false);
      Parent.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockParent)
      });

      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('getProfile', () => {
    it('should get parent profile successfully', async () => {
      Parent.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockParent)
      });

      const result = await authService.getProfile('507f1f77bcf86cd799439011');

      expect(Parent.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });

    it('should throw error when parent not found', async () => {
      Parent.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(authService.getProfile('507f1f77bcf86cd799439999')).rejects.toThrow(
        'Parent not found'
      );
    });
  });

  describe('updateProfile', () => {
    it('should update parent profile successfully', async () => {
      const updateData = {
        name: 'Jane Doe',
        city: 'Los Angeles'
      };

      Parent.findByIdAndUpdate = jest.fn().mockResolvedValue(mockParent);

      const result = await authService.updateProfile('507f1f77bcf86cd799439011', updateData);

      expect(Parent.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should throw error with no valid fields', async () => {
      const updateData = {
        invalidField: 'value'
      };

      await expect(
        authService.updateProfile('507f1f77bcf86cd799439011', updateData)
      ).rejects.toThrow('No valid fields to update');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockParent.comparePassword.mockResolvedValue(true);
      Parent.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockParent)
      });

      const result = await authService.changePassword(
        '507f1f77bcf86cd799439011',
        'oldPassword',
        'newPassword123'
      );

      expect(mockParent.comparePassword).toHaveBeenCalledWith('oldPassword');
      expect(mockParent.save).toHaveBeenCalled();
      expect(result).toHaveProperty('message', 'Password changed successfully');
    });

    it('should throw error with incorrect current password', async () => {
      mockParent.comparePassword.mockResolvedValue(false);
      Parent.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockParent)
      });

      await expect(
        authService.changePassword('507f1f77bcf86cd799439011', 'wrongPassword', 'newPassword123')
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = 'mock-refresh-token';
      
      jwt.verify = jest.fn().mockReturnValue({ id: '507f1f77bcf86cd799439011' });
      mockParent.refreshTokens = [{ token: mockRefreshToken }];
      Parent.findById = jest.fn().mockResolvedValue(mockParent);

      const result = await authService.refresh(mockRefreshToken);

      expect(jwt.verify).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error with invalid refresh token', async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });

      await expect(authService.refresh('invalid-token')).rejects.toThrow();
    });
  });

  describe('verify', () => {
    it('should verify token successfully', async () => {
      jwt.verify = jest.fn().mockReturnValue({ id: '507f1f77bcf86cd799439011' });
      Parent.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockParent)
      });

      const result = await authService.verify('valid-token');

      expect(result).toHaveProperty('valid', true);
      expect(result).toHaveProperty('parent');
    });

    it('should throw error with invalid token', async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await expect(authService.verify('invalid-token')).rejects.toThrow('Invalid token');
    });
  });

  describe('logout', () => {
    it('should logout parent successfully', async () => {
      Parent.findById = jest.fn().mockResolvedValue(mockParent);

      const result = await authService.logout('507f1f77bcf86cd799439011', 'refresh-token');

      expect(Parent.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('message', 'Logout successful');
    });
  });
});
