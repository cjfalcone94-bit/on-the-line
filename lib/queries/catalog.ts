import { queryOptions } from '@tanstack/react-query';
import { templates } from '@/lib/catalog/templates';

export const catalogQuery = queryOptions({
  queryKey: ['catalog', 'templates'],
  queryFn: async () => templates,
});
