const FALLBACK_IMAGE = 'image/IMG_2191.jpg';
const TAGS_V1 = [
  'Machine Learning',
  'Data Analytics',
  'Policy Modeling',
  'NLP',
  'Computer Vision',
  'Experiment'
];

const state = {
  projects: [],
  activeTag: 'All'
};

const ui = {
  tagFilter: document.getElementById('tag-filter'),
  featuredSection: document.getElementById('featured-cluster-section'),
  featuredTitle: document.getElementById('featured-cluster-title'),
  featuredSubtitle: document.getElementById('featured-cluster-subtitle'),
  featuredGrid: document.getElementById('featured-cluster-grid'),
  allGrid: document.getElementById('all-projects-grid'),
  reflectionSummary: document.getElementById('reflection-summary'),
  reflectionPoints: document.getElementById('reflection-points')
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(dateString);
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function normalizeProject(raw) {
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const metrics = Array.isArray(raw.metrics) ? raw.metrics : [];
  const methods = Array.isArray(raw.methods) ? raw.methods : [];
  const glossary = Array.isArray(raw.glossary) ? raw.glossary : [];
  const figures = Array.isArray(raw.figures) ? raw.figures : [];
  const downloads = Array.isArray(raw.downloads) ? raw.downloads : [];

  return {
    id: raw.id || 'untitled-project',
    title: raw.title || 'Untitled Project',
    subtitle: raw.subtitle || '',
    date: raw.date || '',
    tags,
    status: raw.status || 'In Progress',
    featuredCluster: raw.featuredCluster || null,
    oneLiner: raw.oneLiner || '',
    problem: raw.problem || '',
    approach: raw.approach || '',
    results: raw.results || '',
    meaning: raw.meaning || '',
    metrics,
    methods,
    glossary,
    figures,
    downloads
  };
}

function getTagCountMap(projects) {
  const countMap = new Map();
  for (const tag of TAGS_V1) {
    countMap.set(tag, 0);
  }
  for (const project of projects) {
    for (const tag of project.tags) {
      countMap.set(tag, (countMap.get(tag) || 0) + 1);
    }
  }
  return countMap;
}

function renderTagFilter() {
  const counts = getTagCountMap(state.projects);
  const allCount = state.projects.length;
  const allTags = ['All', ...TAGS_V1];

  ui.tagFilter.innerHTML = allTags.map((tag) => {
    const active = state.activeTag === tag;
    const count = tag === 'All' ? allCount : (counts.get(tag) || 0);
    const disabled = tag !== 'All' && count === 0;

    return `
      <button class="tag-pill${active ? ' is-active' : ''}" data-tag="${escapeHtml(tag)}" ${disabled ? 'disabled' : ''}>
        <span>${escapeHtml(tag)}</span>
        <small>${count}</small>
      </button>
    `;
  }).join('');

  ui.tagFilter.querySelectorAll('[data-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTag = button.getAttribute('data-tag');
      state.activeTag = nextTag || 'All';
      renderTagFilter();
      renderProjectSections();
    });
  });
}

function projectMatchesTag(project, activeTag) {
  if (activeTag === 'All') {
    return true;
  }
  return project.tags.includes(activeTag);
}

function renderMetricGrid(metrics) {
  if (!metrics.length) {
    return '';
  }
  return `
    <div class="detail-block">
      <h3>Key Metrics</h3>
      <div class="metric-grid">
        ${metrics.map((item) => `
          <article class="metric-chip">
            <span class="metric-label">${escapeHtml(item.label || '')}</span>
            <strong class="metric-value">${escapeHtml(item.value || '')}</strong>
            <p class="metric-note">${escapeHtml(item.note || '')}</p>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMethodList(methods) {
  if (!methods.length) {
    return '';
  }
  return `
    <div class="detail-block">
      <h3>Methods</h3>
      <div class="method-list">
        ${methods.map((method) => `
          <article class="method-item">
            <h4>${escapeHtml(method.name || '')}</h4>
            <p>${escapeHtml(method.explain || '')}</p>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function renderGlossary(glossary) {
  if (!glossary.length) {
    return '';
  }
  return `
    <div class="detail-block">
      <h3>Glossary</h3>
      <div class="glossary-list">
        ${glossary.map((item) => `
          <div class="glossary-row">
            <strong>${escapeHtml(item.term || '')}</strong>
            <p>${escapeHtml(item.explain || '')}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderFigures(figures, title) {
  if (!figures.length) {
    return '';
  }
  return `
    <div class="detail-block">
      <h3>Figures</h3>
      <div class="figure-grid">
        ${figures.map((fig) => `
          <figure class="figure-card">
            <img src="${escapeHtml(fig.src || FALLBACK_IMAGE)}" alt="${escapeHtml(fig.caption || title)}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
            <figcaption>
              <p>${escapeHtml(fig.caption || '')}</p>
              <span>${escapeHtml(fig.source || '')}</span>
            </figcaption>
          </figure>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDownloads(downloads) {
  if (!downloads.length) {
    return '';
  }
  return `
    <div class="detail-block">
      <h3>Source Material</h3>
      <div class="download-row">
        ${downloads.map((item) => `
          <a class="download-btn" href="${escapeHtml(item.path || '#')}" target="_blank" rel="noopener">
            ${escapeHtml(item.label || 'Open File')}
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function renderFeaturedCards(projects) {
  if (!projects.length) {
    return '<article class="empty-state">No featured projects match the selected tag yet.</article>';
  }

  return projects.map((project) => `
    <article class="project-showcase reveal-on-scroll" id="${escapeHtml(project.id)}">
      <header class="project-header">
        <div>
          <p class="project-date">${formatDate(project.date)}</p>
          <h3>${escapeHtml(project.title)}</h3>
          <p class="project-subtitle">${escapeHtml(project.subtitle)}</p>
          <p class="project-one-liner">${escapeHtml(project.oneLiner)}</p>
        </div>
        <div class="project-status">
          <span class="status-chip">${escapeHtml(project.status)}</span>
          <div class="tag-row">
            ${project.tags.map((tag) => `<span class="inline-tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      </header>

      <section class="project-info-grid">
        <article class="detail-block">
          <h3>Problem</h3>
          <p>${escapeHtml(project.problem)}</p>
        </article>
        <article class="detail-block">
          <h3>Approach</h3>
          <p>${escapeHtml(project.approach)}</p>
        </article>
        <article class="detail-block">
          <h3>Results</h3>
          <p>${escapeHtml(project.results)}</p>
        </article>
        <article class="detail-block">
          <h3>Why This Matters</h3>
          <p>${escapeHtml(project.meaning)}</p>
        </article>
      </section>

      ${renderMetricGrid(project.metrics)}
      ${renderMethodList(project.methods)}
      ${renderFigures(project.figures, project.title)}
      ${renderGlossary(project.glossary)}
      ${renderDownloads(project.downloads)}
    </article>
  `).join('');
}

function renderRegistryCards(projects) {
  if (!projects.length) {
    return '<article class="empty-state">No projects match this tag. Try selecting All.</article>';
  }

  return projects.map((project) => `
    <article class="project-registry-card reveal-on-scroll">
      <div class="registry-head">
        <h3>${escapeHtml(project.title)}</h3>
        <span class="status-chip">${escapeHtml(project.status)}</span>
      </div>
      <p class="project-date">${formatDate(project.date)}</p>
      <p class="registry-one-liner">${escapeHtml(project.oneLiner)}</p>
      <p class="registry-subtitle">${escapeHtml(project.subtitle)}</p>
      <div class="tag-row">
        ${project.tags.map((tag) => `<span class="inline-tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      ${project.featuredCluster ? `<p class="cluster-note">Featured in ${escapeHtml(project.featuredCluster)}</p>` : ''}
      <div class="registry-links">
        ${project.downloads.map((item) => `<a href="${escapeHtml(item.path || '#')}" target="_blank" rel="noopener">${escapeHtml(item.label || 'Open File')}</a>`).join('')}
      </div>
    </article>
  `).join('');
}

function renderReflection(allProjects, featuredProjects) {
  const total = allProjects.length;
  const featuredCount = featuredProjects.length;
  const uniqueMethods = new Set(featuredProjects.flatMap((project) => project.methods.map((method) => method.name))).size;
  const uniqueTags = new Set(allProjects.flatMap((project) => project.tags)).size;

  ui.reflectionSummary.textContent =
    `This hub currently tracks ${total} project entries with ${uniqueTags} reusable tags. ` +
    `${featuredCount} projects are currently highlighted in Machine Learning Labs, covering ${uniqueMethods} method families.`;

  ui.reflectionPoints.innerHTML = `
    <article class="reflection-card">
      <h3>Reusable Pattern</h3>
      <p>Each project follows the same narrative skeleton: problem, approach, results, and meaning. This keeps future additions readable even when the topic changes.</p>
    </article>
    <article class="reflection-card">
      <h3>Technical Maturity</h3>
      <p>The current featured cluster shows progression from unsupervised clustering to ensemble learning and interpretable policy modeling.</p>
    </article>
    <article class="reflection-card">
      <h3>Next Extension</h3>
      <p>To add a new non-ML project, append one object in projects.json with tags, figures, and downloads. No structural HTML edits are required.</p>
    </article>
  `;
}

function setupRevealObserver() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) {
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  elements.forEach((element) => {
    if (!element.classList.contains('is-visible')) {
      observer.observe(element);
    }
  });
}

function renderProjectSections() {
  const filtered = state.projects.filter((project) => projectMatchesTag(project, state.activeTag));

  const clusterName = 'Machine Learning Labs';
  const featured = filtered.filter((project) => project.featuredCluster === clusterName);

  ui.featuredTitle.textContent = `Featured Cluster: ${clusterName}`;
  ui.featuredSubtitle.textContent = 'Deep-dive storytelling modules for current focus projects. This section can switch to another cluster later.';
  ui.featuredGrid.innerHTML = renderFeaturedCards(featured);

  const sortedAll = [...filtered].sort((a, b) => {
    const left = new Date(a.date).getTime();
    const right = new Date(b.date).getTime();
    return right - left;
  });

  ui.allGrid.innerHTML = renderRegistryCards(sortedAll);
  renderReflection(state.projects, state.projects.filter((project) => project.featuredCluster === clusterName));

  setupRevealObserver();
}

async function loadProjects() {
  try {
    const response = await fetch('projects.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    const payload = await response.json();
    const list = Array.isArray(payload) ? payload : [];
    state.projects = list.map(normalizeProject);

    renderTagFilter();
    renderProjectSections();
  } catch (error) {
    console.error(error);
    ui.featuredGrid.innerHTML = '<article class="empty-state">Unable to load project data.</article>';
    ui.allGrid.innerHTML = '<article class="empty-state">Unable to load project data.</article>';
    ui.reflectionSummary.textContent = 'Reflection is unavailable because project data failed to load.';
  }
}

loadProjects();
setupRevealObserver();
