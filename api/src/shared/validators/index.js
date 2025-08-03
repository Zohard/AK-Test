const { VALIDATION_RULES, MEDIA_TYPES, PUBLICATION_STATUS } = require('../constants');

class Validator {
  static isRequired(value) {
    return value !== null && value !== undefined && value !== '';
  }

  static isString(value) {
    return typeof value === 'string';
  }

  static isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  static isInteger(value) {
    return Number.isInteger(value);
  }

  static isPositiveInteger(value) {
    return this.isInteger(value) && value > 0;
  }

  static isEmail(email) {
    if (!this.isString(email)) return false;
    return VALIDATION_RULES.EMAIL.PATTERN.test(email);
  }

  static isUsername(username) {
    if (!this.isString(username)) return false;
    return username.length >= VALIDATION_RULES.USERNAME.MIN_LENGTH &&
           username.length <= VALIDATION_RULES.USERNAME.MAX_LENGTH &&
           VALIDATION_RULES.USERNAME.PATTERN.test(username);
  }

  static isPassword(password) {
    if (!this.isString(password)) return false;
    return password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH &&
           password.length <= VALIDATION_RULES.PASSWORD.MAX_LENGTH;
  }

  static isTitle(title) {
    if (!this.isString(title)) return false;
    return title.trim().length >= VALIDATION_RULES.TITLE.MIN_LENGTH &&
           title.length <= VALIDATION_RULES.TITLE.MAX_LENGTH;
  }

  static isReviewTitle(title) {
    if (!this.isString(title)) return false;
    return title.trim().length >= VALIDATION_RULES.REVIEW_TITLE.MIN_LENGTH &&
           title.length <= VALIDATION_RULES.REVIEW_TITLE.MAX_LENGTH;
  }

  static isReviewContent(content) {
    if (!this.isString(content)) return false;
    return content.trim().length >= VALIDATION_RULES.REVIEW_CONTENT.MIN_LENGTH &&
           content.length <= VALIDATION_RULES.REVIEW_CONTENT.MAX_LENGTH;
  }

  static isSynopsis(synopsis) {
    if (!this.isString(synopsis)) return false;
    return synopsis.length <= VALIDATION_RULES.SYNOPSIS.MAX_LENGTH;
  }

  static isYear(year) {
    if (!this.isInteger(year)) return false;
    return year >= VALIDATION_RULES.YEAR.MIN && year <= VALIDATION_RULES.YEAR.MAX;
  }

  static isEpisodes(episodes) {
    if (!this.isInteger(episodes)) return false;
    return episodes >= VALIDATION_RULES.EPISODES.MIN && episodes <= VALIDATION_RULES.EPISODES.MAX;
  }

  static isVolumes(volumes) {
    if (!this.isInteger(volumes)) return false;
    return volumes >= VALIDATION_RULES.VOLUMES.MIN && volumes <= VALIDATION_RULES.VOLUMES.MAX;
  }

  static isRating(rating) {
    if (!this.isNumber(rating)) return false;
    return rating >= 0 && rating <= 10;
  }

  static isMediaType(mediaType) {
    return Object.values(MEDIA_TYPES).includes(mediaType);
  }

  static isPublicationStatus(status) {
    return Object.values(PUBLICATION_STATUS).includes(status);
  }

  static isSortDirection(direction) {
    return ['ASC', 'DESC'].includes(direction?.toUpperCase());
  }

  static isValidId(id) {
    const numId = parseInt(id);
    return this.isPositiveInteger(numId);
  }

  static isValidPage(page) {
    const numPage = parseInt(page);
    return this.isPositiveInteger(numPage);
  }

  static isValidLimit(limit, maxLimit = 100) {
    const numLimit = parseInt(limit);
    return this.isPositiveInteger(numLimit) && numLimit <= maxLimit;
  }

  static validatePagination(page, limit) {
    const errors = [];
    
    if (page !== undefined && !this.isValidPage(page)) {
      errors.push('Page must be a positive integer');
    }
    
    if (limit !== undefined && !this.isValidLimit(limit)) {
      errors.push('Limit must be a positive integer not greater than 100');
    }
    
    return errors;
  }

  static validateSearchTerm(searchTerm, minLength = 2) {
    if (!this.isString(searchTerm)) {
      return ['Search term must be a string'];
    }
    
    if (searchTerm.trim().length < minLength) {
      return [`Search term must be at least ${minLength} characters`];
    }
    
    return [];
  }

  static validateTagIds(tagIds) {
    if (!Array.isArray(tagIds)) {
      return ['Tag IDs must be an array'];
    }
    
    if (tagIds.length === 0) {
      return ['At least one tag ID is required'];
    }
    
    const invalidIds = tagIds.filter(id => !this.isValidId(id));
    if (invalidIds.length > 0) {
      return ['All tag IDs must be positive integers'];
    }
    
    return [];
  }

  static validateAnimeData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.titre !== undefined) {
      if (!isUpdate && !this.isRequired(data.titre)) {
        errors.push('Title is required');
      } else if (data.titre !== undefined && !this.isTitle(data.titre)) {
        errors.push('Title must be a valid string (1-255 characters)');
      }
    }
    
    if (data.annee !== undefined && !this.isYear(data.annee)) {
      errors.push('Year must be a valid year');
    }
    
    if (data.nb_ep !== undefined && !this.isEpisodes(data.nb_ep)) {
      errors.push('Number of episodes must be between 1 and 10000');
    }
    
    if (data.synopsis !== undefined && !this.isSynopsis(data.synopsis)) {
      errors.push('Synopsis is too long (max 5000 characters)');
    }
    
    return errors;
  }

  static validateMangaData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate || data.titre !== undefined) {
      if (!isUpdate && !this.isRequired(data.titre)) {
        errors.push('Title is required');
      } else if (data.titre !== undefined && !this.isTitle(data.titre)) {
        errors.push('Title must be a valid string (1-255 characters)');
      }
    }
    
    if (!isUpdate || data.auteur !== undefined) {
      if (!isUpdate && !this.isRequired(data.auteur)) {
        errors.push('Author is required');
      } else if (data.auteur !== undefined && !this.isTitle(data.auteur)) {
        errors.push('Author must be a valid string (1-255 characters)');
      }
    }
    
    if (data.annee !== undefined && !this.isYear(data.annee)) {
      errors.push('Year must be a valid year');
    }
    
    if (data.nb_volumes !== undefined && !this.isVolumes(data.nb_volumes)) {
      errors.push('Number of volumes must be between 1 and 1000');
    }
    
    if (data.synopsis !== undefined && !this.isSynopsis(data.synopsis)) {
      errors.push('Synopsis is too long (max 5000 characters)');
    }
    
    if (data.statut_publication !== undefined && !this.isPublicationStatus(data.statut_publication)) {
      errors.push('Invalid publication status');
    }
    
    return errors;
  }

  static validateReviewData(data, isUpdate = false) {
    const errors = [];
    
    if (!isUpdate) {
      if (!this.isRequired(data.media_id) || !this.isValidId(data.media_id)) {
        errors.push('Valid media ID is required');
      }
      
      if (!this.isRequired(data.media_type) || !this.isMediaType(data.media_type)) {
        errors.push('Valid media type is required (anime or manga)');
      }
    }
    
    if (!isUpdate || data.rating !== undefined) {
      if (!isUpdate && (!this.isRequired(data.rating) || !this.isRating(data.rating))) {
        errors.push('Valid rating is required (0-10)');
      } else if (data.rating !== undefined && !this.isRating(data.rating)) {
        errors.push('Rating must be between 0 and 10');
      }
    }
    
    if (!isUpdate || data.title !== undefined) {
      if (!isUpdate && !this.isReviewTitle(data.title)) {
        errors.push('Review title is required (3-255 characters)');
      } else if (data.title !== undefined && !this.isReviewTitle(data.title)) {
        errors.push('Review title must be between 3 and 255 characters');
      }
    }
    
    if (!isUpdate || data.content !== undefined) {
      if (!isUpdate && !this.isReviewContent(data.content)) {
        errors.push('Review content is required (10-5000 characters)');
      } else if (data.content !== undefined && !this.isReviewContent(data.content)) {
        errors.push('Review content must be between 10 and 5000 characters');
      }
    }
    
    return errors;
  }

  static validateUserRegistration(data) {
    const errors = [];
    
    if (!this.isRequired(data.username) || !this.isUsername(data.username)) {
      errors.push('Username is required (3-50 characters, alphanumeric, underscore, hyphen only)');
    }
    
    if (!this.isRequired(data.email) || !this.isEmail(data.email)) {
      errors.push('Valid email address is required');
    }
    
    if (!this.isRequired(data.password) || !this.isPassword(data.password)) {
      errors.push('Password is required (6-128 characters)');
    }
    
    if (data.realName !== undefined && data.realName !== null && data.realName.length > 100) {
      errors.push('Real name is too long (max 100 characters)');
    }
    
    return errors;
  }
}

module.exports = Validator;