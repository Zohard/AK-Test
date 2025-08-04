const BaseService = require('./BaseService');
const repositories = require('../data');

class BusinessService extends BaseService {
  constructor() {
    super(repositories.business);
  }

  async getBusinesses(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const result = await this.repository.findWithPagination(page, limit, filters);
      
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('BusinessService.getBusinesses error:', error);
      throw new Error(`Failed to retrieve businesses: ${error.message}`);
    }
  }

  async getBusinessById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid business ID provided');
      }

      const business = await this.repository.findById(parseInt(id));
      
      if (!business) {
        throw new Error(`Business with ID ${id} not found`);
      }

      return {
        success: true,
        data: business,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('BusinessService.getBusinessById error:', error);
      throw error;
    }
  }

  async createBusiness(businessData) {
    try {
      // Validate required fields
      const { type, denomination, origine } = businessData;
      
      if (!type || !denomination) {
        throw new Error('Type and denomination are required fields');
      }

      // Check if business with same denomination already exists
      const existingBusiness = await this.repository.findByDenomination(denomination);
      if (existingBusiness) {
        throw new Error(`Business with denomination "${denomination}" already exists`);
      }

      const business = await this.repository.create(businessData);
      
      return {
        success: true,
        data: business,
        message: 'Business created successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('BusinessService.createBusiness error:', error);
      throw error;
    }
  }

  async updateBusiness(id, businessData) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid business ID provided');
      }

      // Check if business exists
      const existingBusiness = await this.repository.findById(parseInt(id));
      if (!existingBusiness) {
        throw new Error(`Business with ID ${id} not found`);
      }

      // Validate required fields
      const { type, denomination, origine } = businessData;
      
      if (!type || !denomination) {
        throw new Error('Type and denomination are required fields');
      }

      // Check if another business with same denomination exists (excluding current one)
      if (denomination !== existingBusiness.denomination) {
        const duplicateBusiness = await this.repository.findByDenomination(denomination);
        if (duplicateBusiness && duplicateBusiness.id !== parseInt(id)) {
          throw new Error(`Business with denomination "${denomination}" already exists`);
        }
      }

      const business = await this.repository.update(parseInt(id), businessData);
      
      return {
        success: true,
        data: business,
        message: 'Business updated successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('BusinessService.updateBusiness error:', error);
      throw error;
    }
  }

  async deleteBusiness(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid business ID provided');
      }

      // Check if business exists
      const existingBusiness = await this.repository.findById(parseInt(id));
      if (!existingBusiness) {
        throw new Error(`Business with ID ${id} not found`);
      }

      await this.repository.delete(parseInt(id));
      
      return {
        success: true,
        message: 'Business deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('BusinessService.deleteBusiness error:', error);
      throw error;
    }
  }

  async getBusinessTypes() {
    try {
      const types = [
        'Personnalité',
        'Editeur',
        'Studio',
        'Chaîne TV',
        'Association',
        'Magazine',
        'Evénement',
        'Divers'
      ];
      
      return {
        success: true,
        data: types,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('BusinessService.getBusinessTypes error:', error);
      throw error;
    }
  }

  async getBusinessCountries() {
    try {
      const countries = [
        'Japon',
        'Belgique',
        'Chine',
        'Corée',
        'Etats-Unis',
        'France',
        'Grande Bretagne',
        'Italie',
        'Espagne',
        'Allemagne',
        'Hong Kong',
        'Suisse',
        'Benelux',
        'Taiwan',
        'Asie',
        'Europe',
        'Amérique du Nord',
        'Amérique du Sud',
        'Afrique',
        'Océanie',
        'Russie'
      ];
      
      return {
        success: true,
        data: countries,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('BusinessService.getBusinessCountries error:', error);
      throw error;
    }
  }
}

module.exports = BusinessService;