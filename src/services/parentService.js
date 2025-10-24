const Parent = require('../models/Parent');
const Child = require('../models/Child');
const Course = require('../models/Course');
const logger = require('../utils/logger');

const loadWishlistCourses = async (wishlistCourseIds = []) => {
  if (!Array.isArray(wishlistCourseIds) || wishlistCourseIds.length === 0) {
    return [];
  }

  const ids = wishlistCourseIds.map(id => id.toString());

  const courses = await Course.find({
    _id: { $in: ids },
    isPublished: true
  })
    .select('title slug thumbnail coverImage category subCategory level price rating metadata publishedAt')
    .lean();

  const courseMap = new Map();
  courses.forEach(course => {
    courseMap.set(course._id.toString(), course);
  });

  return ids
    .map(id => courseMap.get(id))
    .filter(Boolean)
    .map(course => ({
      id: course._id.toString(),
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
      coverImage: course.coverImage,
      category: course.category,
      subCategory: course.subCategory,
      level: course.level,
      price: course.price,
      rating: course.rating,
      metadata: course.metadata,
      publishedAt: course.publishedAt
    }));
};

/*
 * Get parent by ID
 * 
 * @params {parentId}: string - Parent ID
 * @returns Parent document
 */
const getParentById = async (parentId) => {
  try {
    const parent = await Parent.findById(parentId)
      .populate({
        path: 'children',
        select: 'name age gender grade'
      });

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    return parent;
  } catch (error) {
    logger.error('Get parent by ID failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Get parent by email
 * 
 * @params {email}: string - Parent email
 * @returns Parent document or null
 */
const getParentByEmail = async (email) => {
  try {
    const parent = await Parent.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    return parent;
  } catch (error) {
    logger.error('Get parent by email failed', {
      email,
      error: error.message
    });
    throw error;
  }
};

/*
 * Get parents by city with pagination
 * 
 * @params {city}: string - City name
 * @params {limit}: number - Results limit
 * @params {skip}: number - Results to skip
 * @returns Array of parents
 */
const getParentsByCity = async (city, limit = 100, skip = 0) => {
  try {
    const parents = await Parent.find({ 
      city: new RegExp(`^${city}$`, 'i'),
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password -refreshTokens');

    return parents.map(parent => parent.getPublicProfile());
  } catch (error) {
    logger.error('Get parents by city failed', {
      city,
      error: error.message
    });
    throw error;
  }
};

/*
 * Get children for parent
 * 
 * @params {parentId}: string - Parent ID
 * @returns Array of children
 */
const getChildrenForParent = async (parentId) => {
  try {
    const parent = await Parent.findById(parentId).populate('children');

    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    return parent.children || [];
  } catch (error) {
    logger.error('Get children for parent failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Get wishlist courses for parent
 *
 * @params {parentId}: string - Parent ID
 * @returns Array of course summaries
 */
const getWishlistForParent = async (parentId) => {
  try {
    const parent = await Parent.findById(parentId);

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const wishlist = await loadWishlistCourses(parent.wishlistCourseIds);

    logger.info('Retrieved parent wishlist', {
      parentId,
      wishlistCount: wishlist.length
    });

    return wishlist;
  } catch (error) {
    logger.error('Get wishlist for parent failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Add course to parent wishlist
 *
 * @params {parentId}: string - Parent ID
 * @params {courseId}: string - Course ID
 * @returns Array of course summaries
 */
const addCourseToWishlist = async (parentId, courseId) => {
  try {
    const parent = await Parent.findById(parentId);

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    if (!Array.isArray(parent.wishlistCourseIds)) {
      parent.wishlistCourseIds = [];
    }

    if (parent.wishlistCourseIds.some(id => id.equals(courseId))) {
      return await loadWishlistCourses(parent.wishlistCourseIds);
    }

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true
    }).select('_id');

    if (!course) {
      const error = new Error('Course not found or not available');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    parent.wishlistCourseIds.push(course._id);
    await parent.save();

    logger.info('Course added to parent wishlist', {
      parentId,
      courseId,
      action: 'add_wishlist_course'
    });

    return await loadWishlistCourses(parent.wishlistCourseIds);
  } catch (error) {
    logger.error('Add course to wishlist failed', {
      parentId,
      courseId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Remove course from parent wishlist
 *
 * @params {parentId}: string - Parent ID
 * @params {courseId}: string - Course ID
 * @returns Array of course summaries
 */
const removeCourseFromWishlist = async (parentId, courseId) => {
  try {
    const parent = await Parent.findById(parentId);

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    if (!Array.isArray(parent.wishlistCourseIds) || parent.wishlistCourseIds.length === 0) {
      return [];
    }

    const updatedWishlist = parent.wishlistCourseIds.filter(id => !id.equals(courseId));

    if (updatedWishlist.length === parent.wishlistCourseIds.length) {
      return await loadWishlistCourses(parent.wishlistCourseIds);
    }

    parent.wishlistCourseIds = updatedWishlist;
    parent.markModified('wishlistCourseIds');
    await parent.save();

    logger.info('Course removed from parent wishlist', {
      parentId,
      courseId,
      action: 'remove_wishlist_course'
    });

    return await loadWishlistCourses(parent.wishlistCourseIds);
  } catch (error) {
    logger.error('Remove course from wishlist failed', {
      parentId,
      courseId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Add child to parent
 * 
 * @params {parentId}: string - Parent ID
 * @params {childId}: string - Child ID
 * @returns Updated parent
 */
const addChildToParent = async (parentId, childId) => {
  try {
    const parent = await Parent.findById(parentId);
    
    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const child = await Child.findById(childId);
    
    if (!child) {
      const error = new Error('Child not found');
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    if (!parent.childrenIds.includes(childId)) {
      parent.childrenIds.push(childId);
      await parent.save();
    }

    logger.info('Child added to parent', {
      parentId,
      childId,
      action: 'add_child'
    });

    return parent.getPublicProfile();
  } catch (error) {
    logger.error('Add child to parent failed', {
      parentId,
      childId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Remove child from parent
 * 
 * @params {parentId}: string - Parent ID
 * @params {childId}: string - Child ID
 * @returns Updated parent
 */
const removeChildFromParent = async (parentId, childId) => {
  try {
    const parent = await Parent.findById(parentId);
    
    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    parent.childrenIds = parent.childrenIds.filter(id => !id.equals(childId));
    await parent.save();

    logger.info('Child removed from parent', {
      parentId,
      childId,
      action: 'remove_child'
    });

    return parent.getPublicProfile();
  } catch (error) {
    logger.error('Remove child from parent failed', {
      parentId,
      childId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Delete parent with cascade option
 * 
 * @params {parentId}: string - Parent ID
 * @params {cascadeDelete}: boolean - Whether to delete children
 * @returns Success boolean
 */
const deleteParent = async (parentId, cascadeDelete = false) => {
  try {
    const parent = await Parent.findById(parentId);
    
    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    if (parent.childrenIds.length > 0 && !cascadeDelete) {
      const error = new Error(
        `Parent has ${parent.childrenIds.length} children. Enable cascade delete to remove all.`
      );
      error.statusCode = 400;
      error.code = 'PARENT_HAS_CHILDREN';
      throw error;
    }

    if (cascadeDelete && parent.childrenIds.length > 0) {
      logger.info('Cascade deleting children', {
        parentId,
        childCount: parent.childrenIds.length
      });

      for (const childId of parent.childrenIds) {
        try {
          await Child.findByIdAndDelete(childId);
        } catch (err) {
          logger.warn('Failed to delete child', {
            childId,
            error: err.message
          });
        }
      }
    }

    await Parent.findByIdAndDelete(parentId);

    logger.info('Parent deleted', {
      parentId,
      cascadeDelete,
      action: 'delete_parent'
    });

    return true;
  } catch (error) {
    logger.error('Delete parent failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

/*
 * Count total parents
 * 
 * @returns Total parent count
 */
const countParents = async () => {
  try {
    return await Parent.countDocuments({ isActive: true });
  } catch (error) {
    logger.error('Count parents failed', {
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  getParentById,
  getParentByEmail,
  getParentsByCity,
  getChildrenForParent,
  getWishlistForParent,
  addChildToParent,
  addCourseToWishlist,
  removeChildFromParent,
  removeCourseFromWishlist,
  deleteParent,
  countParents
};
