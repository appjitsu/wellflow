# Vendor Management API Documentation

## Overview

The Vendor Management API provides comprehensive functionality for managing vendors in the WellFlow oil & gas operations platform. This API follows RESTful principles and implements Clean Architecture with Domain-Driven Design patterns.

## Base URL

```
https://api.wellflow.com/v1
```

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Create Vendor

Creates a new vendor in the system.

**Endpoint:** `POST /vendors`

**Required Roles:** `admin`, `procurement_manager`

**Request Body:**

```json
{
  "vendorName": "ACME Corporation",
  "vendorCode": "ACME-001",
  "vendorType": "service_provider",
  "billingAddress": {
    "street": "123 Main St",
    "city": "Houston",
    "state": "TX",
    "zipCode": "77001",
    "country": "USA"
  },
  "paymentTerms": "Net 30",
  "taxId": "12-3456789",
  "serviceAddress": {
    "street": "456 Service Rd",
    "city": "Houston",
    "state": "TX",
    "zipCode": "77002",
    "country": "USA"
  },
  "website": "https://acme.com",
  "notes": "Primary drilling contractor"
}
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Vendor created successfully"
}
```

**Status Codes:**

- `201` - Created successfully
- `400` - Invalid input data
- `401` - Unauthorized
- `403` - Insufficient permissions
- `409` - Vendor code already exists

### Get Vendors

Retrieves vendors for the organization with optional filtering and pagination.

**Endpoint:** `GET /vendors`

**Required Roles:** `admin`, `procurement_manager`, `operator`

**Query Parameters:**

- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20, max: 100)
- `status` (array, optional) - Filter by status: `pending`, `approved`, `rejected`, `suspended`, `inactive`
- `vendorType` (array, optional) - Filter by type: `service_provider`, `drilling_contractor`, `equipment_supplier`, `consultant`, `transportation`
- `isPrequalified` (boolean, optional) - Filter by qualification status
- `performanceRating` (array, optional) - Filter by rating: `excellent`, `good`, `average`, `poor`, `not_rated`
- `searchTerm` (string, optional) - Search in vendor name or code
- `sortBy` (string, optional) - Sort field
- `sortOrder` (string, optional) - Sort order: `ASC`, `DESC`

**Response:**

```json
{
  "vendors": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "organizationId": "org-123",
      "vendorName": "ACME Corporation",
      "vendorCode": "ACME-001",
      "vendorType": "service_provider",
      "status": "approved",
      "taxId": "12-3456789",
      "billingAddress": {
        "street": "123 Main St",
        "city": "Houston",
        "state": "TX",
        "zipCode": "77001",
        "country": "USA"
      },
      "paymentTerms": "Net 30",
      "isPrequalified": true,
      "prequalificationDate": "2023-01-15T10:30:00Z",
      "overallRating": "excellent",
      "safetyRating": "excellent",
      "qualityRating": "good",
      "timelinessRating": "excellent",
      "costEffectivenessRating": "good",
      "totalJobsCompleted": 25,
      "averageJobValue": 150000,
      "incidentCount": 0,
      "website": "https://acme.com",
      "isActive": true,
      "createdAt": "2023-01-01T10:00:00Z",
      "updatedAt": "2023-06-15T14:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false
}
```

### Get Vendor by ID

Retrieves a specific vendor by its ID.

**Endpoint:** `GET /vendors/{id}`

**Required Roles:** `admin`, `procurement_manager`, `operator`

**Path Parameters:**

- `id` (UUID) - Vendor ID

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "org-123",
  "vendorName": "ACME Corporation",
  "vendorCode": "ACME-001",
  "vendorType": "service_provider",
  "status": "approved",
  "billingAddress": {
    "street": "123 Main St",
    "city": "Houston",
    "state": "TX",
    "zipCode": "77001",
    "country": "USA"
  },
  "insurance": {
    "generalLiability": {
      "carrier": "State Farm",
      "policyNumber": "GL-123456",
      "coverageAmount": 1000000,
      "expirationDate": "2024-12-31"
    }
  },
  "certifications": [
    {
      "name": "ISO 9001",
      "issuingBody": "ISO",
      "certificationNumber": "ISO-9001-2023",
      "issueDate": "2023-01-01",
      "expirationDate": "2026-01-01"
    }
  ],
  "isPrequalified": true,
  "overallRating": "excellent",
  "createdAt": "2023-01-01T10:00:00Z",
  "updatedAt": "2023-06-15T14:30:00Z"
}
```

**Status Codes:**

- `200` - Success
- `404` - Vendor not found
- `401` - Unauthorized

### Update Vendor Status

Updates a vendor's status (approve, reject, suspend, etc.).

**Endpoint:** `PATCH /vendors/{id}/status`

**Required Roles:** `admin`, `procurement_manager`

**Path Parameters:**

- `id` (UUID) - Vendor ID

**Request Body:**

```json
{
  "status": "approved",
  "reason": "Meets all requirements and has valid insurance"
}
```

**Response:**

```json
{
  "message": "Vendor status updated successfully"
}
```

**Status Codes:**

- `200` - Updated successfully
- `400` - Invalid status or transition
- `404` - Vendor not found
- `401` - Unauthorized
- `403` - Insufficient permissions

### Update Vendor Insurance

Updates a vendor's insurance information.

**Endpoint:** `PUT /vendors/{id}/insurance`

**Required Roles:** `admin`, `procurement_manager`

**Request Body:**

```json
{
  "generalLiability": {
    "carrier": "State Farm",
    "policyNumber": "GL-123456",
    "coverageAmount": 1000000,
    "expirationDate": "2024-12-31"
  },
  "workersCompensation": {
    "carrier": "Workers Comp Inc",
    "policyNumber": "WC-789012",
    "coverageAmount": 500000,
    "expirationDate": "2024-12-31"
  },
  "autoLiability": {
    "carrier": "Auto Insurance Co",
    "policyNumber": "AL-345678",
    "coverageAmount": 1000000,
    "expirationDate": "2024-12-31"
  }
}
```

### Add Vendor Certification

Adds a new certification to a vendor.

**Endpoint:** `POST /vendors/{id}/certifications`

**Required Roles:** `admin`, `procurement_manager`

**Request Body:**

```json
{
  "name": "ISO 9001",
  "issuingBody": "International Organization for Standardization",
  "certificationNumber": "ISO-9001-2023-001",
  "issueDate": "2023-01-01",
  "expirationDate": "2026-01-01",
  "documentPath": "/documents/certifications/iso-9001-acme.pdf"
}
```

### Update Vendor Performance

Updates a vendor's performance ratings.

**Endpoint:** `PATCH /vendors/{id}/performance`

**Required Roles:** `admin`, `procurement_manager`

**Request Body:**

```json
{
  "overallRating": "excellent",
  "safetyRating": "excellent",
  "qualityRating": "good",
  "timelinessRating": "excellent",
  "costEffectivenessRating": "good",
  "evaluationNotes": "Consistently delivers high-quality work on time with excellent safety record."
}
```

### Get Vendor Statistics

Retrieves vendor statistics for dashboard display.

**Endpoint:** `GET /vendors/statistics`

**Required Roles:** `admin`, `procurement_manager`

**Response:**

```json
{
  "totalVendors": 150,
  "activeVendors": 120,
  "pendingApproval": 15,
  "suspendedVendors": 5,
  "qualifiedVendors": 100,
  "recentlyAdded": 8,
  "vendorsByType": {
    "service_provider": 60,
    "drilling_contractor": 25,
    "equipment_supplier": 40,
    "consultant": 15,
    "transportation": 10
  },
  "vendorsByRating": {
    "excellent": 45,
    "good": 55,
    "average": 20,
    "poor": 5,
    "not_rated": 25
  },
  "expiringInsurance": 12,
  "expiringCertifications": 8,
  "averagePerformanceRating": 4.2
}
```

### Get Vendors with Expiring Qualifications

Retrieves vendors with expiring insurance or certifications.

**Endpoint:** `GET /vendors/expiring-qualifications`

**Required Roles:** `admin`, `procurement_manager`

**Query Parameters:**

- `days` (number, optional) - Days until expiration (default: 30)

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "vendorName": "ACME Corporation",
    "vendorCode": "ACME-001",
    "expiringItems": [
      {
        "type": "insurance",
        "name": "General Liability",
        "expirationDate": "2024-01-15",
        "daysUntilExpiration": 25
      },
      {
        "type": "certification",
        "name": "ISO 9001",
        "expirationDate": "2024-01-20",
        "daysUntilExpiration": 30
      }
    ]
  }
]
```

## Data Models

### Vendor Types

- `service_provider` - General service providers
- `drilling_contractor` - Drilling and completion contractors
- `equipment_supplier` - Equipment and material suppliers
- `consultant` - Technical and management consultants
- `transportation` - Transportation and logistics providers

### Vendor Status

- `pending` - Awaiting approval
- `approved` - Approved and active
- `rejected` - Application rejected
- `suspended` - Temporarily suspended
- `inactive` - Deactivated

### Performance Ratings

- `excellent` (5) - Exceptional performance
- `good` (4) - Above average performance
- `average` (3) - Meets expectations
- `poor` (2) - Below expectations
- `not_rated` (1) - No rating assigned

## Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "vendorCode",
      "message": "Vendor code must be between 3 and 20 characters"
    }
  ]
}
```

## Rate Limiting

API requests are limited to:

- 1000 requests per hour per user
- 100 requests per minute per user

## Caching

The following endpoints implement caching:

- `GET /vendors` - 5 minutes
- `GET /vendors/statistics` - 15 minutes
- `GET /vendors/{id}` - 10 minutes

## Webhooks

Vendor events can trigger webhooks:

- `vendor.created`
- `vendor.status_changed`
- `vendor.qualification_updated`
- `vendor.performance_updated`

Configure webhooks in the organization settings.
