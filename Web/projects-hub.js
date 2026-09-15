const FALLBACK_IMAGE = 'image/IMG_2191.jpg';
const state = {
  projects: [],
  activeTag: 'All'
};

const ui = {
  tagFilter: document.getElementById('tag-filter'),
  allGrid: document.getElementById('all-projects-grid'),
  count: document.getElementById('project-count')
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
    day: 'numeric',
    timeZone: 'UTC'
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
    featured: raw.featured === true,
    demoUrl: raw.demoUrl || '',
    cover: raw.cover || null,
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
  const allTags = ['All', ...counts.keys()];

  ui.tagFilter.innerHTML = allTags.map((tag) => {
    const active = state.activeTag === tag;
    const count = tag === 'All' ? allCount : (counts.get(tag) || 0);
    const disabled = tag !== 'All' && count === 0;

    return `
      <button type="button" class="tag-pill${active ? ' is-active' : ''}" data-tag="${escapeHtml(tag)}" aria-pressed="${active}" ${disabled ? 'disabled' : ''}>
        <span>${escapeHtml(tag)}</span>
        <small>${count}</small>
      </button>
    `;
  }).join('');

  ui.tagFilter.querySelectorAll('[data-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTag = button.getAttribute('data-tag');
      state.activeTag = nextTag || 'All';
      ui.tagFilter.querySelectorAll('[data-tag]').forEach((pill) => {
        const selected = pill.dataset.tag === state.activeTag;
        pill.classList.toggle('is-active', selected);
        pill.setAttribute('aria-pressed', String(selected));
      });
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

function renderProjectDetails(project) {
  const sections = [
    ['Problem', project.problem], ['Approach', project.approach],
    ['Results', project.results], ['Why this matters', project.meaning]
  ].filter(([, text]) => text);
  return `
    <details class="project-details">
      <summary>Explore project <span aria-hidden="true">+</span></summary>
      <div class="project-details-content">
        <div class="project-info-grid">
          ${sections.map(([title, text]) => `<div class="detail-block"><h3>${title}</h3><p>${escapeHtml(text)}</p></div>`).join('')}
        </div>
        ${renderMetricGrid(project.metrics)}
        ${renderMethodList(project.methods)}
        ${renderFigures(project.figures, project.title)}
        ${renderGlossary(project.glossary)}
        ${renderDownloads(project.downloads)}
      </div>
    </details>`;
}

function renderProjectCard(project) {
  return `
    <article class="work-card${project.featured ? ' work-card-featured' : ''}" id="${escapeHtml(project.id)}">
      <div class="work-card-overview">
        <div class="work-card-copy">
          <div class="work-card-meta">
            <p class="projects-eyebrow">${project.featured ? 'Latest project / Live demo' : escapeHtml(project.featuredCluster || 'Selected project')}</p>
            <span class="status-chip">${escapeHtml(project.status)}</span>
          </div>
          <h2>${escapeHtml(project.title)}</h2>
          <p class="project-subtitle">${escapeHtml(project.subtitle)}</p>
          <p class="project-one-liner">${escapeHtml(project.oneLiner)}</p>
          <div class="tag-row">${project.tags.map((tag) => `<span class="inline-tag">${escapeHtml(tag)}</span>`).join('')}</div>
          <div class="work-card-bottom">
            <p class="project-date"><time datetime="${escapeHtml(project.date)}">${formatDate(project.date)}</time></p>
            <div class="work-card-actions">
              ${project.demoUrl ? `<a class="project-demo-link" href="${escapeHtml(project.demoUrl)}" target="_blank" rel="noopener noreferrer">View live demo <span aria-hidden="true">↗</span><span class="sr-only">: ${escapeHtml(project.title)} (opens in a new tab)</span></a>` : ''}
              ${project.downloads.map((item) => `<a class="project-report-link" href="${escapeHtml(item.path)}" target="_blank" rel="noopener">${escapeHtml(item.label)} <span aria-hidden="true">↗</span></a>`).join('')}
            </div>
          </div>
        </div>
        ${project.cover ? `<figure class="work-card-cover"><img src="${escapeHtml(project.cover.src)}" alt="${escapeHtml(project.cover.alt)}" width="1600" height="960" fetchpriority="high"><figcaption>${escapeHtml(project.cover.caption)}</figcaption></figure>` : ''}
      </div>
      ${renderProjectDetails(project)}
    </article>`;
}

function renderProjectSections() {
  const filtered = state.projects
    .filter((project) => projectMatchesTag(project, state.activeTag))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(b.date) - new Date(a.date));
  ui.allGrid.innerHTML = filtered.length
    ? filtered.map(renderProjectCard).join('')
    : '<p class="empty-state">No projects match this topic. Try selecting All.</p>';
  ui.count.textContent = `${filtered.length} of ${state.projects.length} projects`;
}

async function loadProjects() {
  try {
    const response = await fetch('projects.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch projects: ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error('Project data must be a list');
    state.projects = payload.map(normalizeProject);
    renderTagFilter();
    renderProjectSections();
  } catch (error) {
    console.error(error);
    ui.count.textContent = 'Projects unavailable';
    ui.allGrid.innerHTML = '<div class="empty-state" role="alert"><p>Unable to load projects. Please try again.</p><button type="button" class="download-btn" id="retry-projects">Try again</button></div>';
    document.getElementById('retry-projects').addEventListener('click', loadProjects);
  }
}

loadProjects();
