import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  decimal,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';

/**
 * Environmental Monitoring table - Environmental compliance tracking
 * Tracks air emissions, water quality monitoring, waste management,
 * greenhouse gas reporting, and continuous emission monitoring systems.
 */
export const environmentalMonitoring = pgTable(
  'environmental_monitoring',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),

    // Monitoring identification
    monitoringPointId: varchar('monitoring_point_id', {
      length: 100,
    }).notNull(),
    monitoringType: varchar('monitoring_type', { length: 50 }).notNull(), // air|water|waste|ghg|continuous_emission|ldar

    monitoringCategory: varchar('monitoring_category', { length: 50 }), // emissions|quality|discharge|leak_detection

    // Location and facility
    location: varchar('location', { length: 255 }),
    facilityId: varchar('facility_id', { length: 100 }),
    equipmentId: varchar('equipment_id', { length: 100 }),

    // Monitoring parameters
    parameter: varchar('parameter', { length: 100 }).notNull(), // VOC|NOx|SO2|pH|TSS|BOD|COD|methane|etc
    unitOfMeasure: varchar('unit_of_measure', { length: 20 }).notNull(), // ppm|mg/L|tons|scf|bbl|etc

    // Monitoring data
    monitoringDate: timestamp('monitoring_date').notNull(),
    measuredValue: decimal('measured_value', { precision: 15, scale: 6 }),
    detectionLimit: decimal('detection_limit', { precision: 15, scale: 6 }),
    exceedanceThreshold: decimal('exceedance_threshold', {
      precision: 15,
      scale: 6,
    }),

    // Regulatory compliance
    regulatoryStandard: varchar('regulatory_standard', { length: 100 }), // EPA NSPS|NESHAP|CAA|etc
    complianceLimit: decimal('compliance_limit', { precision: 15, scale: 6 }),
    isCompliant: boolean('is_compliant'),

    // Monitoring method and equipment
    monitoringMethod: varchar('monitoring_method', { length: 100 }), // continuous|grab_sample|calculated|estimated
    equipmentType: varchar('equipment_type', { length: 100 }), // analyzer|sensor|flow_meter|etc
    equipmentSerialNumber: varchar('equipment_serial_number', { length: 100 }),
    calibrationDate: date('calibration_date'),
    nextCalibrationDate: date('next_calibration_date'),

    // Quality assurance
    qaQcPerformed: boolean('qa_qc_performed').default(false),
    qaQcMethod: varchar('qa_qc_method', { length: 100 }),
    dataQualityIndicator: varchar('data_quality_indicator', { length: 10 }), // A|B|C|D

    // Environmental conditions
    weatherConditions: jsonb('weather_conditions'), // temperature, humidity, wind, etc
    operationalConditions: jsonb('operational_conditions'), // flow rates, pressures, temperatures

    // Reporting and notifications
    reportRequired: boolean('report_required').default(false),
    reportingPeriod: varchar('reporting_period', { length: 20 }), // hourly|daily|monthly|quarterly|annual
    dueDate: date('due_date'),
    reportedDate: date('reported_date'),
    reportNumber: varchar('report_number', { length: 100 }),

    // Actions and follow-up
    correctiveActions: jsonb('corrective_actions'), // Actions taken for exceedances
    followUpRequired: boolean('follow_up_required').default(false),
    followUpDate: date('follow_up_date'),

    // Audit and tracking
    monitoredByUserId: uuid('monitored_by_user_id').notNull(),
    reviewedByUserId: uuid('reviewed_by_user_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('environmental_monitoring_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('environmental_monitoring_well_id_idx').on(table.wellId),
    monitoringTypeIdx: index('environmental_monitoring_monitoring_type_idx').on(
      table.monitoringType,
    ),
    monitoringCategoryIdx: index(
      'environmental_monitoring_monitoring_category_idx',
    ).on(table.monitoringCategory),
    parameterIdx: index('environmental_monitoring_parameter_idx').on(
      table.parameter,
    ),
    monitoringDateIdx: index('environmental_monitoring_monitoring_date_idx').on(
      table.monitoringDate,
    ),
    monitoringPointIdIdx: index(
      'environmental_monitoring_monitoring_point_id_idx',
    ).on(table.monitoringPointId),
    dueDateIdx: index('environmental_monitoring_due_date_idx').on(
      table.dueDate,
    ),
    isCompliantIdx: index('environmental_monitoring_is_compliant_idx').on(
      table.isCompliant,
    ),
  }),
);

/**
 * Waste Management table - Waste disposal and tracking
 * Tracks produced water disposal, drilling waste, hazardous waste,
 * waste minimization programs, and disposal facility compliance.
 */
export const wasteManagement = pgTable(
  'waste_management',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),

    // Waste identification
    wasteManifestId: varchar('waste_manifest_id', { length: 100 }).notNull(),

    wasteType: varchar('waste_type', { length: 50 }).notNull(), // produced_water|drilling_waste|hazardous|non_hazardous|special_waste
    wasteCategory: varchar('waste_category', { length: 50 }), // liquid|solid|sludge|slurry

    // Waste characteristics
    description: text('description').notNull(),
    hazardous: boolean('hazardous').default(false),
    hazardClass: varchar('hazard_class', { length: 100 }), // ignitable|corrosive|reactive|toxic

    // Quantity and volume
    volume: decimal('volume', { precision: 12, scale: 2 }),
    volumeUnit: varchar('volume_unit', { length: 20 }).notNull(), // barrels|gallons|cubic_yards|tons
    density: decimal('density', { precision: 8, scale: 4 }), // g/cm³ or lb/gal

    // Generation and handling
    generationDate: timestamp('generation_date').notNull(),
    generatedBy: varchar('generated_by', { length: 100 }), // well|facility|process
    handlingMethod: varchar('handling_method', { length: 50 }), // storage|treatment|transport|disposal

    // Treatment and disposal
    treatmentMethod: varchar('treatment_method', { length: 100 }), // evaporation|filtration|chemical|thermal|etc
    treatmentFacility: varchar('treatment_facility', { length: 255 }),
    disposalMethod: varchar('disposal_method', { length: 50 }), // injection|landfill|recycling|evaporation|etc
    disposalFacility: varchar('disposal_facility', { length: 255 }),
    disposalFacilityPermit: varchar('disposal_facility_permit', {
      length: 100,
    }),

    // Transportation
    transporterName: varchar('transporter_name', { length: 255 }),
    transporterPermit: varchar('transporter_permit', { length: 100 }),
    transportDate: timestamp('transport_date'),
    transportVehicle: varchar('transport_vehicle', { length: 100 }),

    // Regulatory compliance
    regulatoryPermit: varchar('regulatory_permit', { length: 100 }),
    manifestingRequired: boolean('manifesting_required').default(false),
    manifestNumber: varchar('manifest_number', { length: 100 }),
    regulatoryAgency: varchar('regulatory_agency', { length: 100 }), // EPA|TCEQ|etc

    // Cost tracking
    treatmentCost: decimal('treatment_cost', { precision: 10, scale: 2 }),
    transportationCost: decimal('transportation_cost', {
      precision: 10,
      scale: 2,
    }),
    disposalCost: decimal('disposal_cost', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),

    // Environmental impact
    environmentalImpact: jsonb('environmental_impact'), // Water quality, soil, air impacts
    recyclingPercentage: decimal('recycling_percentage', {
      precision: 5,
      scale: 2,
    }), // Percentage recycled/reused

    // Status and tracking
    status: varchar('status', { length: 20 }).notNull().default('generated'), // generated|stored|treated|transported|disposed|completed
    completionDate: timestamp('completion_date'),

    // Documentation
    documents: jsonb('documents'), // Array of document IDs (manifests, permits, etc)

    // Audit and tracking
    managedByUserId: uuid('managed_by_user_id').notNull(),
    approvedByUserId: uuid('approved_by_user_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('waste_management_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('waste_management_well_id_idx').on(table.wellId),
    wasteTypeIdx: index('waste_management_waste_type_idx').on(table.wasteType),
    wasteCategoryIdx: index('waste_management_waste_category_idx').on(
      table.wasteCategory,
    ),
    wasteManifestIdIdx: index('waste_management_waste_manifest_id_idx').on(
      table.wasteManifestId,
    ),
    statusIdx: index('waste_management_status_idx').on(table.status),
    generationDateIdx: index('waste_management_generation_date_idx').on(
      table.generationDate,
    ),
    regulatoryAgencyIdx: index('waste_management_regulatory_agency_idx').on(
      table.regulatoryAgency,
    ),
    hazardousIdx: index('waste_management_hazardous_idx').on(table.hazardous),
  }),
);
