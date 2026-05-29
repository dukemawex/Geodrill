import { z } from 'zod';

export const BoundingBoxSchema = z.object({
  min_lon: z.number().min(-180).max(180),
  min_lat: z.number().min(-90).max(90),
  max_lon: z.number().min(-180).max(180),
  max_lat: z.number().min(-90).max(90),
  crs: z.literal('EPSG:4326').default('EPSG:4326'),
}).refine((bbox) => bbox.max_lon > bbox.min_lon, {
  message: 'max_lon must be greater than min_lon',
  path: ['max_lon'],
}).refine((bbox) => bbox.max_lat > bbox.min_lat, {
  message: 'max_lat must be greater than min_lat',
  path: ['max_lat'],
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
