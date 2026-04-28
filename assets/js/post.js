const slug = new URLSearchParams(location.search).get('post');
if (!slug) { location.href = '../blog.html'; }

fetch('../blog/posts.json')
  .then(r => r.json())
  .then(posts => {
    const meta = posts.find(p => p.slug === slug);
    if (!meta) { location.href = '../blog.html'; return; }

    document.title = `${meta.title} – Nutriconscien`;
    document.getElementById('postTitle').textContent = meta.title;
    document.getElementById('postCategory').textContent = meta.category;
    document.getElementById('postDate').textContent = new Date(meta.date)
      .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    if (meta.image) {
      document.getElementById('postCover').style.backgroundImage = `url('${meta.image}')`;
      document.getElementById('postCover').style.display = 'block';
    }

    return fetch(`../blog/posts/${slug}.md`);
  })
  .then(r => r.text())
  .then(md => {
    document.getElementById('postBody').innerHTML = marked.parse(md);
  })
  .catch(() => {
    document.getElementById('postBody').innerHTML = '<p>No se pudo cargar el artículo.</p>';
  });
