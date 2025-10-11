import { Router } from "express";

const router = Router();

// OpenAPI 3.0 Specification
const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Bluequee Clinic Management API",
    version: "1.0.0",
    description: "Public REST API for Bluequee clinic management system. Provides access to patient data, appointments, lab results, prescriptions, and more.",
    contact: {
      name: "API Support",
      email: "api@bluequee.com"
    }
  },
  servers: [
    {
      url: "/api/v1",
      description: "Public API v1"
    },
    {
      url: "/api/mobile",
      description: "Mobile Optimized API"
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key for authentication. Contact your administrator to generate an API key."
      }
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" }
        }
      },
      Patient: {
        type: "object",
        properties: {
          id: { type: "integer" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          dateOfBirth: { type: "string", format: "date" },
          gender: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          address: { type: "string" },
          allergies: { type: "string" },
          medicalHistory: { type: "string" },
          organizationId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      Appointment: {
        type: "object",
        properties: {
          id: { type: "integer" },
          patientId: { type: "integer" },
          patientName: { type: "string" },
          doctorId: { type: "integer" },
          doctorName: { type: "string" },
          appointmentDate: { type: "string", format: "date" },
          appointmentTime: { type: "string" },
          status: { type: "string", enum: ["scheduled", "confirmed", "completed", "cancelled"] },
          notes: { type: "string" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      Prescription: {
        type: "object",
        properties: {
          id: { type: "integer" },
          patientId: { type: "integer" },
          patientName: { type: "string" },
          doctorId: { type: "integer" },
          doctorName: { type: "string" },
          medicationName: { type: "string" },
          dosage: { type: "string" },
          frequency: { type: "string" },
          duration: { type: "string" },
          status: { type: "string" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      VitalSigns: {
        type: "object",
        properties: {
          id: { type: "integer" },
          patientId: { type: "integer" },
          patientName: { type: "string" },
          temperature: { type: "number" },
          bloodPressure: { type: "string" },
          heartRate: { type: "integer" },
          respiratoryRate: { type: "integer" },
          oxygenSaturation: { type: "number" },
          weight: { type: "number" },
          height: { type: "number" },
          recordedAt: { type: "string", format: "date-time" },
          recordedBy: { type: "integer" }
        }
      }
    }
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        description: "Check API status and authentication",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    timestamp: { type: "string" },
                    organization: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/patients": {
      get: {
        summary: "List patients",
        description: "Get a list of patients in your organization",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
            description: "Number of records to return"
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
            description: "Number of records to skip"
          }
        ],
        responses: {
          "200": {
            description: "List of patients",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Patient" }
                    },
                    meta: {
                      type: "object",
                      properties: {
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                        count: { type: "integer" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { description: "Unauthorized - Invalid API key" },
          "403": { description: "Forbidden - Insufficient permissions" }
        }
      }
    },
    "/patients/{id}": {
      get: {
        summary: "Get patient by ID",
        description: "Get detailed information about a specific patient",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": {
            description: "Patient details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Patient" }
                  }
                }
              }
            }
          },
          "404": { description: "Patient not found" }
        }
      }
    },
    "/appointments": {
      get: {
        summary: "List appointments",
        description: "Get a list of appointments with optional filtering",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 }
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 }
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["scheduled", "confirmed", "completed", "cancelled"] }
          },
          {
            name: "from",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter appointments from this date"
          },
          {
            name: "to",
            in: "query",
            schema: { type: "string", format: "date" },
            description: "Filter appointments until this date"
          }
        ],
        responses: {
          "200": {
            description: "List of appointments",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Appointment" }
                    },
                    meta: { type: "object" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/prescriptions": {
      get: {
        summary: "List prescriptions",
        description: "Get a list of prescriptions with optional filtering",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 }
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 }
          },
          {
            name: "patientId",
            in: "query",
            schema: { type: "integer" }
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "List of prescriptions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Prescription" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/vital-signs": {
      get: {
        summary: "List vital signs",
        description: "Get a list of vital signs records",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 }
          },
          {
            name: "patientId",
            in: "query",
            schema: { type: "integer" }
          },
          {
            name: "from",
            in: "query",
            schema: { type: "string", format: "date-time" }
          },
          {
            name: "to",
            in: "query",
            schema: { type: "string", format: "date-time" }
          }
        ],
        responses: {
          "200": {
            description: "List of vital signs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/VitalSigns" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/dashboard/stats": {
      get: {
        summary: "Dashboard statistics (Mobile)",
        description: "Get quick statistics for mobile dashboard",
        responses: {
          "200": {
            description: "Dashboard stats",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    patients: { type: "integer" },
                    appointments: { type: "integer" },
                    labs: { type: "integer" },
                    prescriptions: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/appointments/today": {
      get: {
        summary: "Today's appointments (Mobile)",
        description: "Get today's appointments with minimal payload",
        responses: {
          "200": {
            description: "Today's appointments",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      patient: { type: "string" },
                      time: { type: "string" },
                      status: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Serve OpenAPI spec as JSON
router.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// Serve Swagger UI HTML
router.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bluequee API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    }
  </script>
</body>
</html>
  `;
  res.send(html);
});

export default router;
