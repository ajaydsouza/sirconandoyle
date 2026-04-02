<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
>
<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

<xsl:template match="/">
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>XML Sitemap — Sir Arthur Conan Doyle</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: "Inter", system-ui, sans-serif;
      color: #1c1917;
      background-color: #d4c5a9;
      background-image:
        repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px),
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px);
      background-size: 50px 50px;
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    header {
      background-color: #1c1917;
      color: #faf8f3;
      padding: 2rem;
      border-bottom: 4px solid #92400e;
      margin-bottom: 2rem;
    }

    header h1 {
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    header p {
      font-size: 0.875rem;
      color: #a8a29e;
      line-height: 1.6;
    }

    header a {
      color: #b45309;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    header a:hover { color: #d97706; }

    .count {
      font-size: 0.875rem;
      color: #44403c;
      margin-bottom: 1rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #faf8f3;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    th {
      background: #44403c;
      color: #faf8f3;
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    td {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      border-bottom: 1px solid #e7e5e4;
      word-break: break-all;
    }

    tr:nth-child(even) { background: #f4f0e6; }
    tr:hover { background: #e7e5e4; }

    td a {
      color: #92400e;
      text-decoration: none;
    }

    td a:hover {
      color: #b45309;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .lastmod {
      white-space: nowrap;
      color: #78716c;
      font-size: 0.8125rem;
    }

    footer {
      text-align: center;
      padding: 2rem 1rem;
      font-size: 0.75rem;
      color: #78716c;
    }

    footer a {
      color: #92400e;
      text-decoration: none;
    }

    @media (max-width: 640px) {
      header h1 { font-size: 1.25rem; }
      td, th { padding: 0.4rem 0.5rem; font-size: 0.75rem; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>Sir Arthur Conan Doyle &#8212; XML Sitemap</h1>
      <xsl:choose>
        <xsl:when test="sitemap:urlset">
          <p>This XML sitemap is used by search engines to discover pages on this website. It was generated automatically and is not intended for human visitors. You may find the <a href="/">home page</a> more useful.</p>
        </xsl:when>
        <xsl:otherwise>
          <p>This is a sitemap index listing all individual sitemaps for this website. Each entry links to a sitemap file containing page URLs.</p>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </header>

  <div class="container">
    <xsl:choose>
      <!-- URL sitemap -->
      <xsl:when test="sitemap:urlset/sitemap:url">
        <p class="count">
          <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs in this sitemap.
        </p>
        <table>
          <thead>
            <tr>
              <th style="width: 70%">URL</th>
              <th style="width: 30%">Last Modified</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="sitemap:urlset/sitemap:url">
              <tr>
                <td>
                  <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                </td>
                <td class="lastmod">
                  <xsl:if test="sitemap:lastmod">
                    <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/>
                  </xsl:if>
                </td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </xsl:when>

      <!-- Sitemap index -->
      <xsl:when test="sitemap:sitemapindex/sitemap:sitemap">
        <p class="count">
          <xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/> sitemap(s) in this index.
        </p>
        <table>
          <thead>
            <tr>
              <th>Sitemap</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
              <tr>
                <td>
                  <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                </td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </xsl:when>
    </xsl:choose>
  </div>

  <footer>
    <div class="container">
      Generated by <a href="https://docs.astro.build/en/guides/integrations-guide/sitemap/">@astrojs/sitemap</a>
    </div>
  </footer>
</body>
</html>
</xsl:template>

</xsl:stylesheet>
