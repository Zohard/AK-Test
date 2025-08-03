class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async findAll(filters = {}, options = {}) {
    try {
      return await this.repository.findAll(filters, options);
    } catch (error) {
      throw new Error(`Failed to fetch records: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      const record = await this.repository.findById(id);
      if (!record) {
        throw new Error('Record not found');
      }

      return record;
    } catch (error) {
      throw new Error(`Failed to fetch record: ${error.message}`);
    }
  }

  async create(data) {
    try {
      this.validateCreateData(data);
      return await this.repository.create(data);
    } catch (error) {
      throw new Error(`Failed to create record: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      // Check if record exists
      await this.findById(id);
      
      this.validateUpdateData(data);
      return await this.repository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update record: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      if (!id) {
        throw new Error('ID is required');
      }

      // Check if record exists
      await this.findById(id);
      
      return await this.repository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  }

  async count(conditions = {}) {
    try {
      return await this.repository.count(conditions);
    } catch (error) {
      throw new Error(`Failed to count records: ${error.message}`);
    }
  }

  // Override these methods in child classes for specific validation
  validateCreateData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data provided');
    }
  }

  validateUpdateData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data provided');
    }
  }

  // Utility methods
  sanitizeSearchTerm(term) {
    if (!term || typeof term !== 'string') {
      return '';
    }
    return term.trim().replace(/[%_]/g, '\\$&');
  }

  validatePagination(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    if (pageNum < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (limitNum < 1 || limitNum > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    return { page: pageNum, limit: limitNum };
  }
}

module.exports = BaseService;