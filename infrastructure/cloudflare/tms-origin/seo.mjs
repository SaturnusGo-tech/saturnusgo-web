import { TMS_HOST } from './route-manifest.mjs';

// Only the public product site is indexed. Company workspaces keep their existing access boundary.
export function discoveryResponse(request, managed) {
  const {pathname} = new URL(request.url);
  if (!['/robots.txt','/sitemap.xml'].includes(pathname)) return null;
  if (managed && pathname === '/sitemap.xml') return new Response('Not found',{status:404});
  const body = pathname === '/robots.txt'
    ? managed ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://${TMS_HOST}/sitemap.xml\n`
    : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${['/','/ru/'].map(path => `<url><loc>https://${TMS_HOST}${path}</loc><xhtml:link rel="alternate" hreflang="en" href="https://${TMS_HOST}/"/><xhtml:link rel="alternate" hreflang="ru" href="https://${TMS_HOST}/ru/"/><xhtml:link rel="alternate" hreflang="x-default" href="https://${TMS_HOST}/"/></url>`).join('')}</urlset>`;
  return new Response(request.method === 'HEAD' ? null : body,{headers:{
    'content-type':pathname.endsWith('.xml') ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8',
    'cache-control':'public, max-age=300',
  }});
}
