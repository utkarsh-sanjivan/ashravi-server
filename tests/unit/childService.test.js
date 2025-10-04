const childService = require('../../src/services/childService');
const childRepository = require('../../src/repositories/childRepository');
const User = require('../../src/models/User');
const Child = require('../../src/models/Child');

jest.mock('../../src/repositories/childRepository');
jest.mock('../../src/models/User');

describe('Child Service - Unit Tests', () => {
  let mockParent;
  let mockChild;

  beforeEach(() => {
    jest.clearAllMocks();

    mockParent = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Parent User',
      email: 'parent@example.com',
      role: 'user'
    };

    mockChild = {
      _id: '507f1f77bcf86cd799439012',
      id: '507f1f77bcf86cd799439012',
      name: 'John Doe',
      age: 10,
      gender: 'male',
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

  describe('createChild', () => {
    /**
     * Test successful child creation
     */
    it('should create a child successfully when parent exists', async () => {
      const childData = {
        name: 'John Doe',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: '507f1f77bcf86cd799439011'
      };

      User.findById = jest.fn().mockResolvedValue(mockParent);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockParent);
      childRepository.createChild = jest.fn().mockResolvedValue(mockChild);

      const result = await childService.createChild(childData);

      expect(result).toBeDefined();
      expect(result.name).toBe(childData.name);
      expect(result.age).toBe(childData.age);
      expect(User.findById).toHaveBeenCalledWith(childData.parentId);
      expect(childRepository.createChild).toHaveBeenCalledWith(childData);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    /**
     * Test child creation without parent ID
     */
    it('should throw error when parent ID is not provided', async () => {
      const childData = {
        name: 'John Doe',
        age: 10,
        gender: 'male',
        grade: '5TH'
      };

      await expect(childService.createChild(childData))
        .rejects
        .toThrow('Parent ID is required to create a child');
    });

    /**
     * Test child creation with non-existent parent
     */
    it('should throw error when parent does not exist', async () => {
      const childData = {
        name: 'John Doe',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: '507f1f77bcf86cd799439999'
      };

      User.findById = jest.fn().mockResolvedValue(null);

      await expect(childService.createChild(childData))
        .rejects
        .toThrow('Parent with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test child creation failure
     */
    it('should throw error when child creation fails', async () => {
      const childData = {
        name: 'John Doe',
        age: 10,
        gender: 'male',
        grade: '5TH',
        parentId: '507f1f77bcf86cd799439011'
      };

      User.findById = jest.fn().mockResolvedValue(mockParent);
      childRepository.createChild = jest.fn().mockResolvedValue(null);

      await expect(childService.createChild(childData))
        .rejects
        .toThrow('Failed to create child record');
    });
  });

  describe('getChild', () => {
    /**
     * Test getting child by ID successfully
     */
    it('should return child when valid ID is provided', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);

      const result = await childService.getChild('507f1f77bcf86cd799439012');

      expect(result).toBeDefined();
      expect(result.name).toBe(mockChild.name);
      expect(childRepository.getChild).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    /**
     * Test getting child with null ID
     */
    it('should return null when no ID is provided', async () => {
      const result = await childService.getChild(null);

      expect(result).toBeNull();
      expect(childRepository.getChild).not.toHaveBeenCalled();
    });
  });

  describe('getChildWithValidation', () => {
    /**
     * Test getting child with validation
     */
    it('should return child when found', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);

      const result = await childService.getChildWithValidation('507f1f77bcf86cd799439012');

      expect(result).toBeDefined();
      expect(result.name).toBe(mockChild.name);
    });

    /**
     * Test validation failure when child not found
     */
    it('should throw error when child not found', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(null);

      await expect(childService.getChildWithValidation('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Child with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('getChildrenByParent', () => {
    /**
     * Test getting children by parent ID
     */
    it('should return children for valid parent ID', async () => {
      const children = [mockChild];

      User.findById = jest.fn().mockResolvedValue(mockParent);
      childRepository.getChildrenByParent = jest.fn().mockResolvedValue(children);

      const result = await childService.getChildrenByParent('507f1f77bcf86cd799439011', 100, 0);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(childRepository.getChildrenByParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 100, 0);
    });

    /**
     * Test with non-existent parent
     */
    it('should throw error when parent does not exist', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      await expect(childService.getChildrenByParent('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Parent with ID 507f1f77bcf86cd799439999 not found');
    });

    /**
     * Test with null parent ID
     */
    it('should return empty array when no parent ID provided', async () => {
      const result = await childService.getChildrenByParent(null);

      expect(result).toEqual([]);
      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe('updateChild', () => {
    /**
     * Test successful child update
     */
    it('should update child successfully', async () => {
      const updateData = { name: 'Jane Doe', age: 11 };
      const updatedChild = { ...mockChild, ...updateData };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childRepository.updateChild = jest.fn().mockResolvedValue(updatedChild);

      const result = await childService.updateChild('507f1f77bcf86cd799439012', updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.age).toBe(updateData.age);
      expect(childRepository.updateChild).toHaveBeenCalledWith('507f1f77bcf86cd799439012', updateData);
    });

    /**
     * Test update without child ID
     */
    it('should throw error when child ID is not provided', async () => {
      await expect(childService.updateChild(null, { name: 'Jane' }))
        .rejects
        .toThrow('Child ID is required for update');
    });

    /**
     * Test update with invalid age
     */
    it('should throw error when age is invalid', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);

      await expect(childService.updateChild('507f1f77bcf86cd799439012', { age: 25 }))
        .rejects
        .toThrow('Age must be between 0 and 18 years');
    });

    /**
     * Test update with empty name
     */
    it('should throw error when name is empty', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);

      await expect(childService.updateChild('507f1f77bcf86cd799439012', { name: '   ' }))
        .rejects
        .toThrow('Name cannot be empty');
    });

    /**
     * Test update attempt on parent ID
     */
    it('should throw error when trying to update parent ID', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);

      await expect(childService.updateChild('507f1f77bcf86cd799439012', { parentId: '507f1f77bcf86cd799439999' }))
        .rejects
        .toThrow('Parent ID cannot be changed after child creation');
    });

    /**
     * Test update with empty data
     */
    it('should throw error when update data is empty', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);

      await expect(childService.updateChild('507f1f77bcf86cd799439012', {}))
        .rejects
        .toThrow('Update data cannot be empty');
    });
  });

  describe('deleteChild', () => {
    /**
     * Test successful child deletion
     */
    it('should delete child successfully', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childRepository.deleteChild = jest.fn().mockResolvedValue(true);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockParent);

      const result = await childService.deleteChild('507f1f77bcf86cd799439012');

      expect(result).toBe(true);
      expect(childRepository.deleteChild).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    /**
     * Test deletion with null ID
     */
    it('should return false when child ID is null', async () => {
      const result = await childService.deleteChild(null);

      expect(result).toBe(false);
      expect(childRepository.deleteChild).not.toHaveBeenCalled();
    });

    /**
     * Test deletion of non-existent child
     */
    it('should throw error when child does not exist', async () => {
      childRepository.getChild = jest.fn().mockResolvedValue(null);

      await expect(childService.deleteChild('507f1f77bcf86cd799439999'))
        .rejects
        .toThrow('Child with ID 507f1f77bcf86cd799439999 not found');
    });
  });

  describe('addCoursesToChild', () => {
    /**
     * Test adding courses successfully
     */
    it('should add courses to child successfully', async () => {
      const courseIds = ['507f1f77bcf86cd799439021', '507f1f77bcf86cd799439022'];
      const updatedChild = { ...mockChild, courseIds };

      childRepository.getChild = jest.fn().mockResolvedValue(mockChild);
      childRepository.addCoursesToChild = jest.fn().mockResolvedValue(updatedChild);

      const result = await childService.addCoursesToChild('507f1f77bcf86cd799439012', courseIds);

      expect(result).toBeDefined();
      expect(result.courseIds).toEqual(courseIds);
      expect(childRepository.addCoursesToChild).toHaveBeenCalledWith('507f1f77bcf86cd799439012', courseIds);
    });

    /**
     * Test adding courses without child ID
     */
    it('should throw error when child ID is not provided', async () => {
      await expect(childService.addCoursesToChild(null, ['507f1f77bcf86cd799439021']))
        .rejects
        .toThrow('Child ID and course IDs are required');
    });

    /**
     * Test adding courses with empty array
     */
    it('should throw error when course IDs array is empty', async () => {
      await expect(childService.addCoursesToChild('507f1f77bcf86cd799439012', []))
        .rejects
        .toThrow('Child ID and course IDs are required');
    });
  });

  describe('countChildrenByParent', () => {
    /**
     * Test counting children
     */
    it('should return count of children for parent', async () => {
      User.findById = jest.fn().mockResolvedValue(mockParent);
      childRepository.countChildrenByParent = jest.fn().mockResolvedValue(3);

      const result = await childService.countChildrenByParent('507f1f77bcf86cd799439011');

      expect(result).toBe(3);
      expect(childRepository.countChildrenByParent).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * Test count with null parent ID
     */
    it('should return 0 when parent ID is null', async () => {
      const result = await childService.countChildrenByParent(null);

      expect(result).toBe(0);
      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe('getChildSummary', () => {
    /**
     * Test getting child summary
     */
    it('should return child summary with course count', async () => {
      const childWithCourses = { 
        ...mockChild, 
        courseIds: ['507f1f77bcf86cd799439021', '507f1f77bcf86cd799439022'] 
      };

      childRepository.getChild = jest.fn().mockResolvedValue(childWithCourses);

      const result = await childService.getChildSummary('507f1f77bcf86cd799439012');

      expect(result).toBeDefined();
      expect(result.courseCount).toBe(2);
      expect(result.name).toBe(mockChild.name);
      expect(result.age).toBe(mockChild.age);
    });
  });
});
