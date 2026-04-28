fetch('blog/posts.json')
  .then(r => r.json())
  .then(posts => {
    const grid = document.getElementById('blogGrid');
    if (!posts.length) {
      grid.innerHTML = '<p class="blog-empty">Próximamente nuevos artículos.</p>';
      return;
    }
    grid.innerHTML = posts.map(post => `
      <a class="blog-card" href="blog/post.html?post=${post.slug}">
        <div class="blog-card__cover" style="${post.image ? `background-image:url('${post.image}')` : ''}">
          <span class="blog-card__category">${post.category}</span>
        </div>
        <div class="blog-card__body">
          <p class="blog-card__date">${formatDate(post.date)}</p>
          <h2 class="blog-card__title">${post.title}</h2>
          <p class="blog-card__excerpt">${post.excerpt}</p>
          <span class="blog-card__read">Leer artículo →</span>
        </div>
      </a>
    `).join('');
  })
  .catch(() => {
    document.getElementById('blogGrid').innerHTML = '<p class="blog-empty">No se pudieron cargar los posts.</p>';
  });

function formatDate(str) {
  return new Date(str).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
