import { z } from 'zod';

// Course schema
export const CourseSchema = z.object({
  id: z.string(),
  name: z.string(),
  credits: z.number().optional(),
  semester: z.string(),
  year: z.string(),
  mandatory: z.boolean(),
  prerequisites: z.array(z.string()).optional(),
  description: z.string(),
  corequisites: z.array(z.string()).optional(),
  requiredKnowledge: z.array(z.string()).optional(),
  notes: z.string().optional(),
  alternativePrerequisites: z.string().optional(),
});

// Requirement group schema
export const RequirementGroupSchema = z.object({
  title: z.string(),
  n: z.number().optional(), // minimum required for "nOf" type
  courses: z.array(z.string()), // course IDs
});

// Requirement schema
export const RequirementSchema = z.object({
  title: z.string(),
  type: z.enum(['allOf', 'nOf', 'group']),
  groups: z.array(RequirementGroupSchema),
});

// Metadata schema
export const MetadataSchema = z.object({
  lastUpdated: z.string().optional(),
  department: z.string().optional(),
  totalCourses: z.number().optional(),
  notes: z.array(z.string()).optional(),
});

// Catalog schema
export const CatalogSchema = z.object({
  courses: z.array(CourseSchema),
  requirements: z.array(RequirementSchema).optional(),
  metadata: MetadataSchema.optional(),
});

// Type exports
export type Course = z.infer<typeof CourseSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type RequirementGroup = z.infer<typeof RequirementGroupSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;