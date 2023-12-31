import axios from 'axios';
import Notiflix from 'notiflix';

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const refs = {
  form: document.querySelector('#search-form'),
  input: document.querySelector('input[name="searchQuery"]'),
  submitBtn: document.querySelector('button[type="submit"]'),

  observerTarg: document.querySelector('.js-guard'),

  gallery: document.querySelector('.gallery'),
  photoCards: document.querySelectorAll('.photo-card'),
};

let lightbox = new SimpleLightbox('.gallery a');
let pixabayHits = [];
let total_pages = 0;
const perPage = 40;

let query = '';

let currentPage = 1;
let options = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0,
};

let observer = new IntersectionObserver(onLoad, options);

const BASE_URL = 'https://pixabay.com/api/';
const KEY = '39839865-cab33150dc8a84cb79ec8f421';

async function fetchQuery() {
  const params = new URLSearchParams({
    key: KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    page: currentPage,
    per_page: perPage,
  });
  // return axios.get(`${BASE_URL}?${params}`).then(response => {
  //   return response.data;
  // });
  const response = await axios.get(`${BASE_URL}?${params}`);
  return response.data;
}

refs.form.addEventListener('submit', onSubmit);
refs.form.addEventListener('input', onInput);

function onInput(event) {
  query = String(event.target.value).trim();
}

function onSubmit(e) {
  e.preventDefault();
  currentPage = 1;

  observer.unobserve(refs.observerTarg);

  refs.gallery.innerHTML = '';
  if (query === '') {
    Notiflix.Notify.failure('Enter a query, the field must not be empty.');
    return;
  }
  dataHendler();
}

function dataHendler() {
  fetchQuery()
    .then(data => {
      pixabayHits = data.hits;

      if (pixabayHits.length === 0) {
        Notiflix.Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
      } else {
        Notiflix.Notify.success(
          `Hooray! We found totalHits ${data.totalHits} images.`
        );

        const markUp = createMarkUp(pixabayHits);
        refs.gallery.insertAdjacentHTML('beforeend', markUp);
        lightbox.refresh();
        total_pages = Math.ceil(Number(data.totalHits) / Number(perPage));

        if (currentPage < Math.ceil(total_pages)) {
          observer.observe(refs.observerTarg);
        }
      }
    })
    .catch(error => {
      console.log(error);
    });
}
function createMarkUp(pixabayHits) {
  return pixabayHits
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
      <a class="big-photo" href="${largeImageURL}">
    <div class="photo-card">
      <img class= "item-image" src="${webformatURL}" alt="${tags}" loading="lazy" />
      <div class="info">
        <p class="info-item"><b>Likes</b>${likes} </p>
        <p class="info-item"><b>Views</b> ${views}</p>
        <p class="info-item"><b>Comments</b> ${comments}</p>
        <p class="info-item"><b>Downloads</b> ${downloads}</p>
      </div>
    </div>
    
    </a>
  `;
    })
    .join('');
}

function onLoad(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      currentPage += 1;
      fetchQuery(currentPage)
        .then(data => {
          total_pages = Math.ceil(Number(data.totalHits) / Number(perPage));

          refs.gallery.insertAdjacentHTML('beforeend', createMarkUp(data.hits));
          lightbox.refresh();
          if (currentPage >= Math.ceil(total_pages)) {
            observer.unobserve(refs.observerTarg);
            if (pixabayHits.length !== 0) {
              Notiflix.Notify.info(
                "We're sorry, but you've reached the end of search results."
              );
            }
          }
        })
        .catch(error => console.log(error));
    }
  });
}
