import { z } from 'zod';

/** Zod schema for FieldSync — controls which metadata fields are sent to Plex */
export const FieldSyncSchema = z.object({
  title:      z.boolean().default(true),
  summary:    z.boolean().default(true),
  date:       z.boolean().default(true),
  studio:     z.boolean().default(true),
  tags:       z.boolean().default(true),
  performers: z.boolean().default(true),
  poster:     z.boolean().default(true),
  background: z.boolean().default(true),
});

export const StashConfigSchema = z.object({
  id:        z.string().min(1, 'id is required'),
  name:      z.string().min(1, 'name is required'),
  endpoint:  z.string().url('endpoint must be a valid URL'),
  apiKey:    z.string().default(''),
  enabled:   z.boolean().default(true),
  priority:  z.number().int().default(0),
  fieldSync: FieldSyncSchema.default({}),
});

export const AppConfigSchema = z.object({
  stashes: z.array(StashConfigSchema).default([]),
});

export const CreateStashSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(
      /^[a-zA-Z0-9.]+$/,
      'id 只能包含英數字母與點號（a-zA-Z0-9.），不允許 dash(-) 或底線(_)',
    ),
  name:      z.string().min(1),
  endpoint:  z.string().url(),
  apiKey:    z.string().default(''),
  enabled:   z.boolean().default(true),
  priority:  z.number().int().default(0),
  fieldSync: FieldSyncSchema.default({}),
});

export const UpdateStashSchema = z.object({
  name:      z.string().min(1).optional(),
  endpoint:  z.string().url().optional(),
  apiKey:    z.string().optional(),
  enabled:   z.boolean().optional(),
  priority:  z.number().int().optional(),
  fieldSync: FieldSyncSchema.optional(),
});

export type StashConfigInput  = z.infer<typeof CreateStashSchema>;
export type StashConfigUpdate = z.infer<typeof UpdateStashSchema>;
export type FieldSyncInput    = z.infer<typeof FieldSyncSchema>;
