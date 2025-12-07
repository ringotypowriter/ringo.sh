// Language colors map - GitHub Linguist standard
const languageColors: Record<string, string> = {
    // Web / Frontend languages 
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    HTML: "#e34c26",
    CSS: "#563d7c",
    SCSS: "#c6538c",

    // General-purpose
    Python: "#3572A5",
    Java: "#b07219",
    "C": "#555555",
    "C++": "#f34b7d",
    "C#": "#178600",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    Scala: "#c22d40",
    Zig: "#ec915c",

    // Functional / other popular languages
    Elixir: "#6e4a7e",
    Erlang: "#B83998",
    Haskell: "#5e5086",
    Clojure: "#db5855",
    Nim: "#ffc200",

    // Scripting / Shell
    Shell: "#89e051",
    PowerShell: "#012456",
    Awk: "#c30e9b",

    // Systems / Apple family related
    "Objective-C": "#438eff",
    "Objective-C++": "#6866fb",

    // Data / config formats that people often want colored
    TOML: "#9c4221",
    TSQL: "#e38c00",
    CSV: "#237346",

    // Extras you might care about
    Batchfile: "#C1F12E",
    CMake: "#DA3434",
    Assembly: "#6E4C13",
    TeX: "#3D6117",
    VHDL: "#adb2cb",
    SystemVerilog: "#DAE1C2",

    // Build / infra
    Dockerfile: "#384d54",

    // Lua family
    Lua: "#000080",
    Terra: "#00004c",
};

// Only register the custom element in the browser to avoid SSR errors.
if (typeof window !== 'undefined' && typeof HTMLElement !== 'undefined') {
    class GithubCardWidget extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            const repo = this.getAttribute('repo');
            if (!repo) return;

            this.renderLoading();
            this.fetchData(repo);
        }

        renderLoading() {
            this.innerHTML = `
          <div style="display:flex;align-items:center;gap:16px;margin:20px 0;padding:16px 20px;border:1px solid #d6d3c8;border-radius:12px;background:#fffffe;opacity:0.6;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:17px;color:#a09d93;">Loading...</div>
              <p style="font-size:14px;color:#a09d93;margin:6px 0 0 0;">Fetching repository data...</p>
            </div>
            <div style="width:78px;height:78px;border-radius:12px;background:#f5f4f0;flex-shrink:0;"></div>
          </div>
        `;
        }

        async fetchData(repo: string) {
            const cacheKey = `gh-card-${repo}`;
            const cached = localStorage.getItem(cacheKey);
            const now = Date.now();

            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                // Cache valid for 1 hour
                if (now - timestamp < 3600 * 1000) {
                    this.renderCard(data);
                    return;
                }
            }

            try {
                const response = await fetch(`https://api.github.com/repos/${repo}`);
                if (!response.ok) throw new Error('Failed to fetch');

                const data = await response.json();
                localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: now }));
                this.renderCard(data);
            } catch (error) {
                this.renderError(repo);
            }
        }

        renderCard(data: any) {
            const langColor = data.language ? (languageColors[data.language] || '#858585') : 'transparent';
            const avatarUrl = data.owner?.avatar_url || '';

            this.innerHTML = `<a href="${data.html_url}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:16px;margin:20px 0;padding:16px 20px;border:1px solid #d6d3c8;border-radius:12px;background:#fffffe;box-shadow:0 8px 24px -12px rgba(67,64,57,0.12);text-decoration:none!important;transition:all 0.2s ease;" onmouseover="this.style.borderColor='#434039';this.style.boxShadow='0 12px 28px -12px rgba(67,64,57,0.2)';this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='#d6d3c8';this.style.boxShadow='0 8px 24px -12px rgba(67,64,57,0.12)';this.style.transform='translateY(0)';">
  <div style="flex:1;min-width:0;">
    <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:5px;font-size:17px;line-height:1.3;">
      <span style="color:#78756a;font-weight:500;">${data.owner.login} /</span>
      <span style="color:#434039;font-weight:700;">${data.name}</span>
    </div>
    <p style="font-size:14px;color:#78756a;line-height:1.5;margin:6px 0 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${data.description || 'No description provided.'}</p>
    ${data.language ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:#a09d93;">
      <span style="width:9px;height:9px;border-radius:50%;background-color:${langColor};"></span>
      <span style="font-weight:600;">${data.language}</span>
    </div>` : ''}
  </div>
  <img src="${avatarUrl}" alt="${data.owner.login}" loading="lazy" style="width:78px;height:78px;border-radius:12px;border:1px solid rgba(67,64,57,0.08);box-shadow:0 6px 16px -6px rgba(67,64,57,0.15);object-fit:cover;flex-shrink:0;" />
</a>`;
        }

        renderError(repo: string) {
            this.innerHTML = `<a href="https://github.com/${repo}" target="_blank" style="display:block;margin:20px 0;padding:14px 16px;border:1px solid #e0c8b8;border-radius:12px;background:#fdfaf6;color:#8b5c3a;text-decoration:none;font-size:13px;">${repo} <span style="opacity:0.6;">(Failed to load)</span></a>`;
        }
    }

    customElements.define('github-card-widget', GithubCardWidget);
}
