import axios from 'axios';

class SearchService {
  async search(query, maxResults = 5) {
    try {
      console.log(`[SearchService] Searching DDG for: "${query}"`);
      const response = await axios.post(
        'https://html.duckduckgo.com/html/',
        new URLSearchParams({ q: query }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 5000
        }
      );

      const html = response.data;
      const results = [];
      
      // Regex to extract title, link, and snippet
      // DDG HTML format: 
      // <div class="result results_links results_links_deep web-result">
      //   <a class="result__snippet" href="URL">Title</a>
      //   <span class="result__snippet">Snippet</span>
      // </div>
      const resultBlocks = html.split('<div class="result results_links results_links_deep web-result');
      
      for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
        const block = resultBlocks[i];
        
        // Extract URL and Title
        const linkMatch = block.match(/<a class="result__url" href="([^"]+)"/);
        const titleMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
        const snippetMatch = block.match(/<a class="result__snippet"[^>]*>[\s\S]*?<\/a>[\s\S]*?<span class="result__snippet">([\s\S]*?)<\/span>/) || block.match(/<div class="result__snippet">([\s\S]*?)<\/div>/);
        
        if (linkMatch && titleMatch) {
          let link = linkMatch[1];
          // DDG redirects: parse original URL if it's a redirect link
          if (link.includes('uddg=')) {
            const urlParam = link.split('uddg=')[1].split('&')[0];
            link = decodeURIComponent(urlParam);
          }
          
          const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
          const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';
          
          results.push({ title, link, snippet });
        }
      }

      console.log(`[SearchService] Found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('[SearchService] Error searching DDG:', error.message);
      return [];
    }
  }

  formatResultsForAI(results, query) {
    let context = `Pertanyaan Pengguna: "${query}"\n\nHasil Pencarian Web:\n\n`;
    results.forEach((res, idx) => {
      context += `[Dokumen ${idx + 1}]\nJudul: ${res.title}\nLink: ${res.link}\nKonten: ${res.snippet}\n\n`;
    });
    return context;
  }
}

export const searchService = new SearchService();
