const parentService = require('../../src/services/parentService');
const parentRepository = require('../../src/repositories/parentRepository');
const childRepository = require('../../src/repositories/childRepository');
const Parent = require('../../src/models/Parent');

jest.mock('../../src/repositories/parentRepository');
jest.mock('../../src/repositories/childRepository');

describe('Parent Service - Unit Tests', () => {
  let mockParent;
  let mockChild;

  beforeEach(() => {
    jest.clearAllMocks();

    mockParent = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      name: 'John Smith',
      phoneNumber: '+1-555-123-4567',
      emailAddress: 'john.smith@example.com',
      city: 'New York',
      economicStatus: 'Middle Class',
      occupation: 'Software Engineer',
      childrenIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockChild = {
      _id: '507f1f77bcf86cd799439012',
      id: '507f1f77bcf86cd799439012',
      name: 'Jane Smith',
      age: 10,
      gender: 'female',
      grade: '5TH',
      parentId: '507f1f77bcf86cd799439011',
      courseIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createParent', () => {
    /**
     * Test successful parent creation
     */
    it('should create a parent successfully', async () => {
      const parentData = {
        name: 'John Smith',
        phoneNumber: '+1-555-123-4567',
        emailAddress: 'john.smith@example.com',
        city: 'New York',
        economicStatus: 'Middle Class',
        occupation: 'Software Engineer'
      };

      parentRepository.createParent = jest.fn().mockResolvedValue(mockParent);

      const result = await parentService.createParent(parentData);

      expect(result).toBeDefined();
      expect(result.name).toBe(parentData.name);
      expect(result.emailAddress).toBe(parentData.emailAddress);
      expect(parentRepository.createParent).toHaveBeenCalledWith(parentData);
    });

    /**
     * Test parent creation with duplicate email
     */
    it('should throw error when email already exists', async () => {
      const parentData = {
        name: 'John Smith',
        phoneNumber: '+1-555-123-4567',
        emailAddress: 'john.smith@example.com',
        city: 'New York',
        economicStatus: 'Middle Class',
        occupation: 'Software Engineer'
      };

      const error = new Error('Parent with this email address already exists');
      error.code = 'DUPLICATE_EMAIL';
      parentRepository.createParent = jest.fn().mockRejectedValue(error);

      await expect(parentService.createParent(parentData))
        .rejects
        .toThrow('Parent with this email address already exists');
    });

    /**
     * Test parent creation failure
     */
    it('should throw error when parent creation fails', async () => {
      const parentData = {
        name: 'John Smith',
        phoneNumber: '+1-555-123-4567',
        emailAddress: 'john.smith@example.com',
        city: 'New York',
        economicStatus: 'Middle Class',
        occupation: 'Software Engineer'
      };

      parentRepository.createParent = jest.fn().mockResolvedValue(null);

      await expect(parentService.createParent(parentData))
        .rejects
        .toThrow('Failed to create parent record');
    });
  });

  describe('getParent', () => {
    /**
     * Test getting parent by ID successfully
     */
    it('should return parent when valid ID is provided', async () => {
      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);

      const result = await parentService.getParent('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.name).toBe(mockParent.name);
      expect(parentRepository.getParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * Test getting parent with null ID
     */
    it('should return null when no ID is provided', async () => {
      const result = await parentService.getParent(null);

      expect(result).toBeNull();
      expect(parentRepository.getParent).not.toHaveBeenCalled();
    });
  });

  describe('getParentWithValidation', () => {
    /**
     * Test getting parent with validation
     */
    it('should return parent when found', async () => {
      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);

      const result = await parentService.getParentWithValidation('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.name).toBe(mockParent.name);
    });

    /**
     * Test validation failure when parent not found
     */
    it('should throw error when parent not found', async () => {
      parentRepository.getParent = jest.fn().mockResolvedValue(null);

      await expect(parentService.getParentWithValidation('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Parent with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('getParentByEmail', () => {
    /**
     * Test getting parent by email
     */
    it('should return parent when valid email is provided', async () => {
      parentRepository.getParentByEmail = jest.fn().mockResolvedValue(mockParent);

      const result = await parentService.getParentByEmail('john.smith@example.com');

      expect(result).toBeDefined();
      expect(result.emailAddress).toBe(mockParent.emailAddress);
      expect(parentRepository.getParentByEmail).toHaveBeenCalledWith('john.smith@example.com');
    });

    /**
     * Test with null email
     */
    it('should return null when no email is provided', async () => {
      const result = await parentService.getParentByEmail(null);

      expect(result).toBeNull();
      expect(parentRepository.getParentByEmail).not.toHaveBeenCalled();
    });
  });

  describe('getParentsByCity', () => {
    /**
     * Test getting parents by city
     */
    it('should return parents for valid city', async () => {
      const parents = [mockParent];

      parentRepository.getParentsByCity = jest.fn().mockResolvedValue(parents);

      const result = await parentService.getParentsByCity('New York', 100, 0);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(parentRepository.getParentsByCity).toHaveBeenCalledWith('New York', 100, 0);
    });

    /**
     * Test with null city
     */
    it('should return empty array when no city provided', async () => {
      const result = await parentService.getParentsByCity(null);

      expect(result).toEqual([]);
      expect(parentRepository.getParentsByCity).not.toHaveBeenCalled();
    });
  });

  describe('updateParent', () => {
    /**
     * Test successful parent update
     */
    it('should update parent successfully', async () => {
      const updateData = { name: 'Jane Smith', city: 'Los Angeles' };
      const updatedParent = { ...mockParent, ...updateData };

      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);
      parentRepository.updateParent = jest.fn().mockResolvedValue(updatedParent);

      const result = await parentService.updateParent('507f1f77bcf86cd799439011', updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.city).toBe(updateData.city);
      expect(parentRepository.updateParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateData);
    });

    /**
     * Test update without parent ID
     */
    it('should throw error when parent ID is not provided', async () => {
      await expect(parentService.updateParent(null, { name: 'Jane' }))
        .rejects
        .toThrow('Parent ID is required for update');
    });

    /**
     * Test update with duplicate email
     */
    it('should throw error when email already exists', async () => {
      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);
      
      const error = new Error('Parent with this email address already exists');
      error.code = 'DUPLICATE_EMAIL';
      parentRepository.updateParent = jest.fn().mockRejectedValue(error);

      await expect(parentService.updateParent('507f1f77bcf86cd799439011', { 
        emailAddress: 'existing@example.com' 
      }))
        .rejects
        .toThrow('Parent with this email address already exists');
    });
  });

  describe('deleteParent', () => {
    /**
     * Test successful parent deletion without children
     */
    it('should delete parent successfully when no children', async () => {
      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);
      parentRepository.deleteParent = jest.fn().mockResolvedValue(true);

      const result = await parentService.deleteParent('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
      expect(parentRepository.deleteParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * Test deletion with children without cascade
     */
    it('should throw error when parent has children and cascade is false', async () => {
      const parentWithChildren = { 
        ...mockParent, 
        childrenIds: ['507f1f77bcf86cd799439012'] 
      };
      
      parentRepository.getParent = jest.fn().mockResolvedValue(parentWithChildren);

      await expect(parentService.deleteParent('507f1f77bcf86cd799439011', false))
        .rejects
        .toThrow('Parent has 1 children. Enable cascade delete to remove all.');
    });

    /**
     * Test cascade deletion
     */
    it('should delete parent and children with cascade', async () => {
      const parentWithChildren = { 
        ...mockParent, 
        childrenIds: ['507f1f77bcf86cd799439012'] 
      };
      
      parentRepository.getParent = jest.fn().mockResolvedValue(parentWithChildren);
      childRepository.deleteChild = jest.fn().mockResolvedValue(true);
      parentRepository.deleteParent = jest.fn().mockResolvedValue(true);

      const result = await parentService.deleteParent('507f1f77bcf86cd799439011', true);

      expect(result).toBe(true);
      expect(childRepository.deleteChild).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(parentRepository.deleteParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * Test deletion with null ID
     */
    it('should return false when parent ID is null', async () => {
      const result = await parentService.deleteParent(null);

      expect(result).toBe(false);
      expect(parentRepository.deleteParent).not.toHaveBeenCalled();
    });
  });

  describe('addChildToParent', () => {
    /**
     * Test adding child successfully
     */
    it('should add child to parent successfully', async () => {
      const updatedParent = { 
        ...mockParent, 
        childrenIds: ['507f1f77bcf86cd799439012'] 
      };

      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      parentRepository.addChildToParent = jest.fn().mockResolvedValue(updatedParent);

      const result = await parentService.addChildToParent('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');

      expect(result).toBeDefined();
      expect(result.childrenIds).toContain('507f1f77bcf86cd799439012');
      expect(parentRepository.addChildToParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
    });

    /**
     * Test adding non-existent child
     */
    it('should throw error when child does not exist', async () => {
      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);
      childRepository.getChild = jest.fn().mockResolvedValue(null);

      await expect(parentService.addChildToParent('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Child with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('removeChildFromParent', () => {
    /**
     * Test removing child successfully
     */
    it('should remove child from parent successfully', async () => {
      const updatedParent = { ...mockParent, childrenIds: [] };

      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);
      parentRepository.removeChildFromParent = jest.fn().mockResolvedValue(updatedParent);

      const result = await parentService.removeChildFromParent('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');

      expect(result).toBeDefined();
      expect(result.childrenIds).toHaveLength(0);
      expect(parentRepository.removeChildFromParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');
    });
  });

  describe('countParents', () => {
    /**
     * Test counting parents
     */
    it('should return count of parents', async () => {
      parentRepository.countParents = jest.fn().mockResolvedValue(5);

      const result = await parentService.countParents();

      expect(result).toBe(5);
      expect(parentRepository.countParents).toHaveBeenCalled();
    });
  });

  describe('getAllChildren', () => {
    /**
     * Test getting all children
     */
    it('should return all children across parents', async () => {
      const children = [mockChild];

      parentRepository.getAllChildren = jest.fn().mockResolvedValue(children);

      const result = await parentService.getAllChildren();

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(parentRepository.getAllChildren).toHaveBeenCalled();
    });
  });

  describe('getChildrenForParent', () => {
    /**
     * Test getting children for specific parent
     */
    it('should return children for parent', async () => {
      const children = [mockChild];

      parentRepository.getParent = jest.fn().mockResolvedValue(mockParent);
      parentRepository.getChildrenForParent = jest.fn().mockResolvedValue(children);

      const result = await parentService.getChildrenForParent('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(parentRepository.getChildrenForParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * Test with null parent ID
     */
    it('should return empty array when no parent ID provided', async () => {
      const result = await parentService.getChildrenForParent(null);

      expect(result).toEqual([]);
      expect(parentRepository.getChildrenForParent).not.toHaveBeenCalled();
    });
  });
});
