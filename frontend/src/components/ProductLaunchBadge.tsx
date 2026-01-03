/**
 * ProductLaunchBadge Component
 *
 * Clickable badge for product launches that opens a Google search
 * Used in Company Intelligence section
 */

import { createGoogleSearchUrl } from '../utils/urlHelpers';

interface ProductLaunchBadgeProps {
  product: string;
  company?: string;
}

export function ProductLaunchBadge({ product, company }: ProductLaunchBadgeProps) {
  const searchUrl = createGoogleSearchUrl(product, company);

  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
    >
      {product}
    </a>
  );
}
