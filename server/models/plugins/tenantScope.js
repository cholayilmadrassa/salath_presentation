import mongoose from 'mongoose';

/**
 * Mongoose plugin to add tenantId to schemas and provide scoping methods.
 */
export default function tenantScopePlugin(schema, options = {}) {
  if (!schema.path('tenantId')) {
    schema.add({
      tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: options.required !== false,
        index: true,
      },
    });
  }

  // Helper method on query to scope by tenant
  schema.query.forTenant = function (tenantId) {
    return this.where({ tenantId });
  };
}
