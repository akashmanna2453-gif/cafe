const progressBar = document.querySelector('.progress-bar');
const heroTitle = document.querySelector('.hero-title');
const revealItems = document.querySelectorAll('.reveal');
const menuCards = document.querySelectorAll('.menu-card');
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.querySelector('.lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxCaption = document.querySelector('.lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');
const musicToggle = document.querySelector('.music-toggle');
const carouselTrack = document.querySelector('.carousel-track');
const carouselDots = document.querySelectorAll('.dot');
const contactForm = document.querySelector('#contact-form');

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function revealTitle() {
  if (!heroTitle) return;
  const text = heroTitle.textContent.trim();
  heroTitle.innerHTML = text
    .split('')
    .map((char) => `<span>${char === ' ' ? '&nbsp;' : char}</span>`)
    .join('');

  Array.from(heroTitle.querySelectorAll('span')).forEach((span, index) => {
    span.style.animationDelay = `${index * 0.03}s`;
  });
}

function initReveal() {
  if (motionQuery.matches) {
    revealItems.forEach((item) => item.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function updateProgressBar() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
  progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;
}

function updateParallax() {
  const scrollY = window.scrollY;
  document.querySelectorAll('[data-speed]').forEach((element) => {
    const speed = parseFloat(element.dataset.speed || '0.08');
    element.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
  });
}

let ticking = false;
function onScroll() {
  updateProgressBar();
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateParallax();
      ticking = false;
    });
    ticking = true;
  }
}

function attachTilt() {
  menuCards.forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 10;
      const rotateX = ((0.5 - y / rect.height) * 10);
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.3;
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  ripple.classList.add('ripple');
  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 550);
}

function attachButtonRipples() {
  document.querySelectorAll('.btn, .floating-cta, .music-toggle').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (button.classList.contains('music-toggle')) return;
      createRipple(event);
    });
  });
}

function openLightbox(item) {
  const thumb = item.querySelector('.thumb');
  const imageStyle = getComputedStyle(thumb).backgroundImage;
  const title = item.getAttribute('data-title') || 'Scene';
  const description = item.getAttribute('data-description') || '';
  lightboxImage.style.backgroundImage = imageStyle;
  lightboxCaption.textContent = `${title} — ${description}`;
  lightbox.classList.add('visible');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  lightbox.classList.remove('visible');
  lightbox.setAttribute('aria-hidden', 'true');
}

function attachGallery() {
  galleryItems.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
}

let activeSlide = 0;
let carouselInterval;
function updateCarousel(index = activeSlide) {
  activeSlide = index;
  carouselTrack.style.transform = `translateX(-${index * 100}%)`;
  carouselDots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
}

function startCarousel() {
  carouselInterval = window.setInterval(() => {
    const nextIndex = (activeSlide + 1) % carouselDots.length;
    updateCarousel(nextIndex);
  }, 5000);
}

function attachCarousel() {
  carouselDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      updateCarousel(index);
      clearInterval(carouselInterval);
      startCarousel();
    });
  });
  startCarousel();
}

let audioContext;
let ambientNodes = [];

function stopAmbientMusic() {
  if (!audioContext) return;
  ambientNodes.forEach(({ gainNode, oscillator }) => {
    gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 0.4);
    oscillator.stop(audioContext.currentTime + 0.45);
  });
  ambientNodes = [];
}

function startAmbientMusic() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const frequencies = [196, 261.6, 329.6, 392];
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.008;
  masterGain.connect(audioContext.destination);

  frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.0001;
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.start();
    gainNode.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + 0.9 + index * 0.2);
    ambientNodes.push({ gainNode, oscillator });
  });
}

function attachMusicToggle() {
  musicToggle.addEventListener('click', () => {
    if (musicToggle.classList.contains('playing')) {
      stopAmbientMusic();
      musicToggle.classList.remove('playing');
      musicToggle.textContent = '♫';
    } else {
      startAmbientMusic();
      musicToggle.classList.add('playing');
      musicToggle.textContent = '◌';
    }
  });
}

function attachContactForm() {
  if (!contactForm) return;
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.querySelector('#name')?.value.trim() || 'Guest';
    const email = document.querySelector('#email')?.value.trim() || 'No email';
    const notes = document.querySelector('#notes')?.value.trim() || 'No message provided';
    const phone = '919967590265';
    const text = encodeURIComponent(
      `New request from ${name}%0AEmail: ${email}%0AMessage: ${notes}`
    );
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, '_blank');
  });
}

function init() {
  revealTitle();
  initReveal();
  updateProgressBar();
  attachTilt();
  attachButtonRipples();
  attachGallery();
  attachCarousel();
  attachMusicToggle();
  attachContactForm();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateProgressBar);
}

init();
