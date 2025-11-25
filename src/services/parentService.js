const parentRepository = require('../repositories/parentRepository');
const childRepository = require('../repositories/childRepository');
const courseRepository = require('../repositories/courseRepository');
const logger = require('../utils/logger');

const loadWishlistCourses = async (wishlistCourseIds = []) => {
  if (!Array.isArray(wishlistCourseIds) || wishlistCourseIds.length === 0) {
    return [];
  }

  const ids = wishlistCourseIds.map((id) => id.toString());
  const courses = await courseRepository.getCoursesByIds(ids, true);

  const courseMap = new Map();
  (courses || []).forEach((course) => {
    courseMap.set(course.id, course);
  });

  return ids
    .map((id) => courseMap.get(id))
    .filter(Boolean)
    .map((course) => ({
      id: course.id,
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

const getParentById = async (parentId) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent || parent.isActive === false) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const children = await Promise.all(
      (parent.childrenIds || []).map((id) => childRepository.getChild(id))
    );

    return {
      ...parent,
      children: children.filter(Boolean).map((c) => ({
        id: c.id,
        name: c.name,
        age: c.age,
        gender: c.gender,
        grade: c.grade
      }))
    };
  } catch (error) {
    logger.error('Get parent by ID failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

const getParentByEmail = async (email) => {
  try {
    return await parentRepository.getParentByEmail(email);
  } catch (error) {
    logger.error('Get parent by email failed', {
      email,
      error: error.message
    });
    throw error;
  }
};

const getParentsByCity = async (city, limit = 100, skip = 0) => {
  try {
    const parents = await parentRepository.getParentsByCity(city, limit, skip);
    return parents
      .filter((parent) => parent.isActive !== false)
      .map((parent) => parent.getPublicProfile());
  } catch (error) {
    logger.error('Get parents by city failed', {
      city,
      error: error.message
    });
    throw error;
  }
};

const getChildrenForParent = async (parentId) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const children = await Promise.all(
      (parent.childrenIds || []).map((id) => childRepository.getChild(id))
    );

    return children.filter(Boolean);
  } catch (error) {
    logger.error('Get children for parent failed', {
      parentId,
      error: error.message
    });
    throw error;
  }
};

const getWishlistForParent = async (parentId) => {
  try {
    const parent = await parentRepository.getParent(parentId);

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

const addCourseToWishlist = async (parentId, courseId) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    parent.wishlistCourseIds = parent.wishlistCourseIds || [];

    if (parent.wishlistCourseIds.some((id) => id === courseId)) {
      return await loadWishlistCourses(parent.wishlistCourseIds);
    }

    const course = await courseRepository.getCourse(courseId);

    if (!course || !course.isPublished) {
      const error = new Error('Course not found or not available');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    parent.wishlistCourseIds.push(course.id);
    await parentRepository.updateParent(parent.id, { wishlistCourseIds: parent.wishlistCourseIds });

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

const removeCourseFromWishlist = async (parentId, courseId) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent || !parent.isActive) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    if (!Array.isArray(parent.wishlistCourseIds) || parent.wishlistCourseIds.length === 0) {
      return [];
    }

    const updatedWishlist = parent.wishlistCourseIds.filter((id) => id !== courseId);

    if (updatedWishlist.length === parent.wishlistCourseIds.length) {
      return await loadWishlistCourses(parent.wishlistCourseIds);
    }

    await parentRepository.updateParent(parent.id, { wishlistCourseIds: updatedWishlist });

    logger.info('Course removed from parent wishlist', {
      parentId,
      courseId,
      action: 'remove_wishlist_course'
    });

    return await loadWishlistCourses(updatedWishlist);
  } catch (error) {
    logger.error('Remove course from wishlist failed', {
      parentId,
      courseId,
      error: error.message
    });
    throw error;
  }
};

const addChildToParent = async (parentId, childId) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const child = await childRepository.getChild(childId);

    if (!child) {
      const error = new Error('Child not found');
      error.statusCode = 404;
      error.code = 'CHILD_NOT_FOUND';
      throw error;
    }

    parent.childrenIds = parent.childrenIds || [];
    if (!parent.childrenIds.includes(childId)) {
      parent.childrenIds.push(childId);
      await parentRepository.updateParent(parent.id, { childrenIds: parent.childrenIds });
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

const removeChildFromParent = async (parentId, childId) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const updated = (parent.childrenIds || []).filter((id) => id !== childId);
    await parentRepository.updateParent(parent.id, { childrenIds: updated });

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

const deleteParent = async (parentId, cascadeDelete = false) => {
  try {
    const parent = await parentRepository.getParent(parentId);

    if (!parent) {
      const error = new Error('Parent not found');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    if ((parent.childrenIds || []).length > 0 && !cascadeDelete) {
      const error = new Error(
        `Parent has ${parent.childrenIds.length} children. Enable cascade delete to remove all.`
      );
      error.statusCode = 400;
      error.code = 'PARENT_HAS_CHILDREN';
      throw error;
    }

    if (cascadeDelete && (parent.childrenIds || []).length > 0) {
      logger.info('Cascade deleting children', {
        parentId,
        childCount: parent.childrenIds.length
      });

      for (const childId of parent.childrenIds) {
        try {
          await childRepository.deleteChild(childId);
        } catch (err) {
          logger.warn('Failed to delete child', {
            childId,
            error: err.message
          });
        }
      }
    }

    await parentRepository.deleteParent(parentId);

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

const countParents = async () => {
  try {
    return await parentRepository.countParents();
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
