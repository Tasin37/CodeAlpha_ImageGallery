const galleryGrid = document.getElementById('galleryGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const closeLightbox = document.getElementById('closeLightbox');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const uploadForm = document.getElementById('uploadForm');
const imageTitle = document.getElementById('imageTitle');
const imageFile = document.getElementById('imageFile');

const cards = Array.from(document.querySelectorAll('.gallery-card'));
let activeIndex = 0;
let visibleCards = cards;
let currentDisplayCount = 9;
const initialDisplayCount = 9;
const revealStep = 6;
let currentFilter = 'all';
const storageKey = 'galleryUploadedImages';

function getLocalUploads() {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalUploads(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function addCardListeners(card) {
  card.addEventListener('click', () => {
    const previewIndex = visibleCards.indexOf(card);
    openLightbox(previewIndex >= 0 ? previewIndex : 0);
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const previewIndex = visibleCards.indexOf(card);
      openLightbox(previewIndex >= 0 ? previewIndex : 0);
    }
  });
}

function addDeleteButton(card) {
  if (card.querySelector('.card-delete')) return;
  const btn = document.createElement('button');
  btn.className = 'card-delete';
  btn.type = 'button';
  btn.title = 'Delete image';
  btn.innerHTML = '🗑';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteCard(card);
  });
  card.appendChild(btn);
}

function deleteCard(card) {
  const img = card.querySelector('img');
  const title = card.querySelector('h2')?.textContent || '';
  const category = (card.dataset.category || '').toLowerCase();

  // remove from DOM and internal list
  if (card.parentNode) card.parentNode.removeChild(card);
  const idx = cards.indexOf(card);
  if (idx !== -1) cards.splice(idx, 1);

  // remove from storage if uploaded
  if (category === 'uploaded') {
    const src = img?.src || '';
    const stored = getLocalUploads().filter(item => item.src !== src && item.title !== title);
    saveLocalUploads(stored);
  }

  // refresh visible list and gallery
  visibleCards = cards.filter(c => currentFilter === 'all' || c.dataset.category === currentFilter);
  currentDisplayCount = Math.min(currentDisplayCount, visibleCards.length);
  renderGallery();
}

function createUploadedCard({ src, title, category }) {
  const card = document.createElement('article');
  card.className = 'gallery-card';
  card.dataset.category = category.toLowerCase();
  card.tabIndex = 0;
  card.innerHTML = `
    <img src="${src}" alt="${title}" />
    <div class="card-overlay">
      <h2>${title}</h2>
      <span>${category}</span>
    </div>
  `;

  galleryGrid.insertBefore(card, galleryGrid.firstChild);
  cards.unshift(card);
  addCardListeners(card);
  addDeleteButton(card);
  return card;
}

function loadLocalUploads() {
  const uploads = getLocalUploads();
  uploads.forEach((item) => createUploadedCard(item));
}

function renderGallery() {
  cards.forEach((card) => {
    card.style.display = visibleCards.includes(card) && visibleCards.indexOf(card) < currentDisplayCount ? 'block' : 'none';
  });

  const remaining = visibleCards.length - currentDisplayCount;
  if (remaining > 0) {
    loadMoreBtn.style.display = 'inline-flex';
    loadMoreBtn.textContent = 'Next';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

function updateFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  visibleCards = cards.filter((card) => filter === 'all' || card.dataset.category === filter);
  currentDisplayCount = initialDisplayCount;
  renderGallery();
}

uploadForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = imageTitle.value.trim() || 'Uploaded Image';
  const file = imageFile.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result;
    const newUpload = { src, title, category: 'Uploaded' };
    const stored = getLocalUploads();
    stored.push(newUpload);
    try {
      saveLocalUploads(stored);
    } catch (error) {
      console.error('Could not save uploaded image to localStorage:', error);
    }

    createUploadedCard(newUpload);
    if (currentFilter === 'all' || currentFilter === 'uploaded') {
      currentDisplayCount = Math.min(currentDisplayCount + 1, visibleCards.length + 1);
    }
    updateFilter(currentFilter);
    uploadForm.reset();
  };
  reader.readAsDataURL(file);
});

function openLightbox(index) {
  const card = visibleCards[index];
  if (!card) return;
  activeIndex = index;
  const img = card.querySelector('img');
  lightboxImage.src = img.src;
  lightboxImage.alt = img.alt;
  lightboxCaption.textContent = card.querySelector('h2').textContent + ' — ' + card.dataset.category;
  lightbox.classList.remove('hidden');
}

function closeLightboxView() {
  lightbox.classList.add('hidden');
  lightboxImage.src = '';
}

function navigateLightbox(direction) {
  if (!visibleCards.length) return;
  activeIndex = (activeIndex + direction + visibleCards.length) % visibleCards.length;
  openLightbox(activeIndex);
}

loadLocalUploads();

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    updateFilter(button.dataset.filter);
  });
});

cards.forEach((card, index) => {
  addDeleteButton(card);
  card.addEventListener('click', () => {
    const previewIndex = visibleCards.indexOf(card);
    openLightbox(previewIndex >= 0 ? previewIndex : index);
  });
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const previewIndex = visibleCards.indexOf(card);
      openLightbox(previewIndex >= 0 ? previewIndex : index);
    }
  });
});

closeLightbox.addEventListener('click', closeLightboxView);
prevBtn.addEventListener('click', () => navigateLightbox(-1));
nextBtn.addEventListener('click', () => navigateLightbox(1));
loadMoreBtn.addEventListener('click', () => {
  currentDisplayCount = Math.min(currentDisplayCount + revealStep, visibleCards.length);
  renderGallery();
});

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) {
    closeLightboxView();
  }
});

window.addEventListener('keydown', (event) => {
  if (lightbox.classList.contains('hidden')) return;
  if (event.key === 'Escape') closeLightboxView();
  if (event.key === 'ArrowLeft') navigateLightbox(-1);
  if (event.key === 'ArrowRight') navigateLightbox(1);
});

updateFilter('all');
