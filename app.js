let movies = JSON.parse(localStorage.getItem('movies')) || [];
const form = document.getElementById('movieForm');
const movieGrid = document.getElementById('movieGrid');
const searchTitle = document.getElementById('searchTitle');
const filterGenre = document.getElementById('filterGenre');
const sortBySelect = document.getElementById('sortBy');
const randomBtn = document.getElementById('randomBtn');
const randomResult = document.getElementById('randomResult');

const movieCountEl = document.getElementById('movieCount');
const watchedCountEl = document.getElementById('watchedCount');
const averageRatingEl = document.getElementById('averageRating');

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) {
    errorEl.textContent = message;
  }
  if (field) {
    field.classList.toggle('is-invalid-field', message !== '');
  }
}

function validateForm() {
  let valid = true;

  const title = document.getElementById('title').value.trim();
  const letters = title.match(/\p{L}/gu) || [];
  const isDuplicate = movies.some(m => m.title.toLowerCase() === title.toLowerCase());

  if (letters.length < 2) {
    showError('title', 'Title must have at least 2 letters');
    valid = false;
  } else if (isDuplicate) {
    showError('title', 'This movie is already in your list');
    valid = false;
  } else {
    showError('title', '');
  }

  if (document.getElementById('genre').value === '') {
    showError('genre', 'Please choose a genre');
    valid = false;
  } else {
    showError('genre', '');
  }

  const yearValue = document.getElementById('year').value;
  const year = Number(yearValue);
  const currentYear = new Date().getFullYear();
  if (yearValue === '' || !Number.isInteger(year) || year < 1900 || year > currentYear) {
    showError('year', 'Year must be between 1900 and ' + currentYear);
    valid = false;
  } else {
    showError('year', '');
  }

  if (document.getElementById('rating').value === '') {
    showError('rating', 'Please choose a rating');
    valid = false;
  } else {
    showError('rating', '');
  }

  return valid;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveToLocalStorage() {
  localStorage.setItem('movies', JSON.stringify(movies));
}

function getVisibleMovies() {
  const search = searchTitle.value.trim().toLowerCase();
  const genre = filterGenre.value;
  const sortBy = sortBySelect ? sortBySelect.value : '';

  let filtered = movies.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search);
    const matchesGenre = genre === '' || m.genre === genre;
    return matchesSearch && matchesGenre;
  });

  if (sortBy === 'rating-desc') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'rating-asc') {
    filtered.sort((a, b) => a.rating - b.rating);
  } else if (sortBy === 'year-desc') {
    filtered.sort((a, b) => b.year - a.year);
  } else if (sortBy === 'year-asc') {
    filtered.sort((a, b) => a.year - b.year);
  }

  return filtered;
}

function renderMovies() {
  const visible = getVisibleMovies();

  if (visible.length === 0) {
    const message = movies.length === 0 ? 'No movies yet' : 'No movies found';
    movieGrid.innerHTML = `<div class="col-12"><div class="empty-msg">${message}</div></div>`;
    return;
  }

  movieGrid.innerHTML = visible.map(m => `
    <div class="col-12 col-sm-6 col-lg-4">
      <div class="card movie-card ${m.watched ? 'watched' : ''}">
        <div class="card-body">
          <h5 class="movie-title">${escapeHtml(m.title)}</h5>
          <p class="movie-meta">${m.year}</p>
          <span class="movie-genre">${m.genre}</span>
          <div class="movie-rating">${'★'.repeat(m.rating)}${'☆'.repeat(5 - m.rating)}</div>
          <div class="d-flex gap-2">
            <button class="btn-watch ${m.watched ? 'is-watched' : ''}" data-id="${m.id}">
              ${m.watched ? 'Watched ✓' : 'Mark as watched'}
            </button>
            <button class="btn-delete" data-id="${m.id}">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function updateCards() {
  const total = movies.length;
  const watched = movies.filter(m => m.watched).length;
  const average = total
    ? movies.reduce((sum, m) => sum + m.rating, 0) / total
    : 0;

  movieCountEl.textContent = total;
  watchedCountEl.textContent = watched;
  averageRatingEl.textContent = average.toFixed(1);
}

function render() {
  renderMovies();
  updateCards();
  saveToLocalStorage();
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  const movie = {
    id: Date.now(),
    title: document.getElementById('title').value.trim(),
    genre: document.getElementById('genre').value,
    year: Number(document.getElementById('year').value),
    rating: Number(document.getElementById('rating').value),
    watched: false
  };

  movies.push(movie);
  form.reset();
  render();
});

movieGrid.addEventListener('click', function (e) {
  const watchBtn = e.target.closest('.btn-watch');
  const deleteBtn = e.target.closest('.btn-delete');

  if (watchBtn) {
    const id = Number(watchBtn.dataset.id);
    const movie = movies.find(m => m.id === id);
    if (movie) {
      movie.watched = !movie.watched;
      render();
    }
  }

  if (deleteBtn) {
    if (confirm('Are you sure you want to delete this movie?')) {
      const id = Number(deleteBtn.dataset.id);
      movies = movies.filter(m => m.id !== id);
      render();
    }
  }
});

if (randomBtn) {
  randomBtn.addEventListener('click', function () {
    const unwatched = movies.filter(m => !m.watched);
    const pool = unwatched.length > 0 ? unwatched : movies;

    if (pool.length === 0) {
      randomResult.innerHTML = `<div class="alert alert-warning text-center">No movies available! Add some movies first.</div>`;
      return;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];

    randomResult.innerHTML = `
      <div class="alert alert-success text-center mb-0">
        🎉 <strong>Tonight's Pick:</strong> ${escapeHtml(chosen.title)} (${chosen.year}) - Genre: ${chosen.genre} - Rating: ${'★'.repeat(chosen.rating)}
      </div>
    `;
  });
}

searchTitle.addEventListener('input', renderMovies);
filterGenre.addEventListener('change', renderMovies);
if (sortBySelect) {
  sortBySelect.addEventListener('change', renderMovies);
}

render();