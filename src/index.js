import axios from 'axios';
import Notiflix from 'notiflix';

const refs = {
  form: document.querySelector('#search-form'),
  input: document.querySelector('input[name="searchQuery"]'),
  submitBtn: document.querySelector('button[type="submit"]'),
  observerTarg: document.querySelector('.js-guard'),
  gallery: document.querySelector('.gallery'),
  photoCards: document.querySelectorAll('.photo-card'),
  galleryImages: document.querySelectorAll('img'),
  photoInfo: document.querySelectorAll('.info'),
  infoItem: document.querySelector('.info-item'),
};

const perPage = 40;
let query = '';
let currentPage = 1;
let options = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0,
};
let isLoading = false;

refs.form.addEventListener('submit', onSubmit);
refs.form.addEventListener('input', onInput);

function onInput(event) {
  query = String(event.target.value).trim();
}

function onSubmit(e) {
  e.preventDefault();
  if (isLoading) {
    return;
  }
  if (query !== '') {
    isLoading = true;
    fetchQuery()
      .then(data => {
        isLoading = false;
        if (data.hits.length === 0) {
          Notiflix.Notify.failure(
            'Sorry, there are no images matching your search query. Please try again.'
          );
        } else {
          Notiflix.Notify.success(
            `Hooray! We found totalHits ${data.totalHits} images.`
          );

          refs.gallery.innerHTML = '';
          const markUp = createMarkUp(data.hits);
          console.log(data);
          refs.gallery.insertAdjacentHTML('beforeend', markUp);
          observer.observe(refs.observerTarg);
        }
      })
      .catch(error => {
        isLoading = false;
        console.log(error);
      });
  } else {
    Notiflix.Notify.info('Enter a query, the field must not be empty.');
  }
}

function createMarkUp() {
  return hits
    .map(hit => {
      const {
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      } = hit;
      return `
    <div class="photo-card">
      <img src="${webformatURL}" alt="${tags}" loading="lazy" />
      <div class="info">
        <p class="info-item"><b>Likes</b>: ${likes}</p>
        <p class="info-item"><b>Views</b>: ${views}</p>
        <p class="info-item"><b>Comments</b>: ${comments}</p>
        <p class="info-item"><b>Downloads</b>: ${downloads}</p>
      </div>
    </div>
  `;
    })
    .join('');
}

const BASE_URL = 'https://pixabay.com/api/';
const KEY = '39839865-cab33150dc8a84cb79ec8f421';

function fetchQuery() {
  const params = new URLSearchParams({
    key: KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    page: currentPage,
    per_page: perPage,
  });
 return axios.get(`${BASE_URL}?${params}`).then(response => {
    return response.data;
  });
}

let observer = new IntersectionObserver(onLoad, options);
function onLoad(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      currentPage += 1;
      fetchQuery(currentPage)
        .then(data => {
          let total_pages = Math.ceil(Number(data.totalHits) / Number(perPage));
          refs.gallery.insertAdjacentHTML('beforeend', createMarkUp(data.hits));
          if (currentPage > Math.ceil(total_pages)) {
            observer.unobserve(refs.observerTarg);
            Notiflix.Notify.info(
              "We're sorry, but you've reached the end of search results."
            );
          }
        })
        .catch(error => console.log(error));
    }
  });
}

refs.galleryImages.forEach(img => {
  img.style.width = '200px';
});

refs.gallery.style.display = 'flex';
refs.gallery.style.flexWrap = 'wrap';
refs.gallery.style.gap = '20px';

refs.photoCards.forEach(card => {
  card.style.width = 'calc(25% - 10px)';
});
