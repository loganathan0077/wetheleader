import React, { useEffect } from 'react';
import { PageSeoConfig, applyPageSeo } from '../utils/seo';

export const SEOHead: React.FC<PageSeoConfig> = (props) => {
  useEffect(() => {
    applyPageSeo(props);
  }, [
    props.title,
    props.description,
    props.canonicalUrl,
    props.ogImage,
    props.ogType,
    props.noindex,
    JSON.stringify(props.keywords),
    JSON.stringify(props.breadcrumbs)
  ]);

  return null;
};
