const BaseController = require('./BaseController');
const services = require('../service');

class BusinessController extends BaseController {
  constructor() {
    super(services.business);
  }

  // GET /api/admin/business
  getBusinesses = this.asyncHandler(async (req, res) => {
    try {
      const pagination = this.getPagination(req);
      const filters = this.getFilters(req, ['search', 'type', 'origine']);
      const sorting = this.getSorting(req, ['denomination', 'type', 'origine', 'date']);

      const result = await this.service.getBusinesses(
        { ...filters, ...sorting },
        pagination
      );

      return this.success(res, result, 'Businesses retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/admin/business/:id
  getBusinessById = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const business = await this.service.getBusinessById(parseInt(id));
      
      return this.success(res, business, 'Business retrieved successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // POST /api/admin/business
  createBusiness = this.asyncHandler(async (req, res) => {
    try {
      const businessData = req.body;
      const business = await this.service.createBusiness(businessData);
      
      return this.created(res, business, 'Business created successfully');
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('already exists')) {
        return this.badRequest(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // PUT /api/admin/business/:id
  updateBusiness = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const businessData = req.body;
      const business = await this.service.updateBusiness(parseInt(id), businessData);
      
      return this.success(res, business, 'Business updated successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      if (error.message.includes('required') || error.message.includes('already exists')) {
        return this.badRequest(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // DELETE /api/admin/business/:id
  deleteBusiness = this.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteBusiness(parseInt(id));
      
      return this.success(res, result, 'Business deleted successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return this.notFound(res, error.message);
      }
      return this.error(res, error.message);
    }
  });

  // GET /api/admin/business/types
  getBusinessTypes = this.asyncHandler(async (req, res) => {
    try {
      const types = await this.service.getBusinessTypes();
      return this.success(res, types, 'Business types retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });

  // GET /api/admin/business/countries
  getBusinessCountries = this.asyncHandler(async (req, res) => {
    try {
      const countries = await this.service.getBusinessCountries();
      return this.success(res, countries, 'Business countries retrieved successfully');
    } catch (error) {
      return this.error(res, error.message);
    }
  });
}

module.exports = BusinessController;