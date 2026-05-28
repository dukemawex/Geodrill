import { z } from 'zod';

export const BoundingBoxSchema = z.object({
  min_lon: z.number().min(-180).max(180),
  min_lat: z.number().min(-90).max(90),
  max_lon: z.number().min(-180).max(180),
  max_lat: z.number().min(-90).max(90),
  crs: z.literal('EPSG:4326').default('EPSG:4326'),
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
