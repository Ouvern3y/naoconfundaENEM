/**
 * NÃO CONFUNDA — ENEM 2026
 * Scripts de Interatividade e CRO Mobile-First
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. DATA DINÂMICA DE HOJE (Escassez Top Bar)
     ========================================================================== */
  const dynamicDateEl = document.getElementById('dynamic-date');
  if (dynamicDateEl) {
    const today = new Date();
    const options = { day: '2-digit', month: 'long' };
    const dateFormatted = today.toLocaleDateString('pt-BR', options).toUpperCase();
    dynamicDateEl.textContent = dateFormatted;
  }

  /* ==========================================================================
     1. CARROSSEL DE PÁGINAS DO MATERIAL (Swipe Horizontal & Controles)
     ========================================================================== */
  const carouselTrack = document.getElementById('pdfCarouselTrack');
  const prevBtn = document.getElementById('carouselPrevBtn');
  const nextBtn = document.getElementById('carouselNextBtn');
  const dots = document.querySelectorAll('.carousel-dot');
  const slides = document.querySelectorAll('.carousel-slide');

  let activeIndex = 0;
  let goToSlide = () => {};
  let isDraggingTrack = false;
  let isTouchScrolling = false;

  if (carouselTrack && slides.length > 0) {
    const updateControls = (idx) => {
      activeIndex = Math.max(0, Math.min(idx, slides.length - 1));
      
      // Atualiza estado dos dots
      dots.forEach((dot, i) => {
        if (i === activeIndex) {
          dot.classList.add('active');
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.classList.remove('active');
          dot.removeAttribute('aria-current');
        }
      });

      // Atualiza botões
      if (prevBtn) prevBtn.disabled = activeIndex === 0;
      if (nextBtn) nextBtn.disabled = activeIndex === slides.length - 1;
    };

    goToSlide = (idx) => {
      const targetSlide = slides[idx];
      if (targetSlide) {
        // Centraliza o slide no viewport do track
        const trackCenter = carouselTrack.offsetWidth / 2;
        const slideCenter = targetSlide.offsetLeft + (targetSlide.offsetWidth / 2);
        carouselTrack.scrollTo({
          left: slideCenter - trackCenter,
          behavior: 'smooth'
        });
      }
      updateControls(idx);
    };

    // Botões de Anterior / Próximo
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(activeIndex + 1);
      });
    }

    // Clique direto nos dots de navegação
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(idx);
      });
    });

    // Detecção contínua ao rolar
    let scrollTimeout;
    carouselTrack.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const trackCenter = carouselTrack.scrollLeft + (carouselTrack.offsetWidth / 2);
        let closestIndex = 0;
        let minDistance = Infinity;

        slides.forEach((slide, idx) => {
          const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2);
          const distance = Math.abs(slideCenter - trackCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = idx;
          }
        });

        updateControls(closestIndex);
      }, 60);
    }, { passive: true });

    // Rastreamento para diferenciar clique de arraste no Desktop
    let trackStartX = 0;
    let trackStartY = 0;
    let initialScrollLeft = 0;
    let isMouseDown = false;

    carouselTrack.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      isDraggingTrack = false;
      trackStartX = e.pageX;
      trackStartY = e.pageY;
      initialScrollLeft = carouselTrack.scrollLeft;
      carouselTrack.style.scrollBehavior = 'auto';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const xDiff = e.pageX - trackStartX;
      const yDiff = e.pageY - trackStartY;
      if (Math.abs(xDiff) > 6 || Math.abs(yDiff) > 6) {
        isDraggingTrack = true;
        carouselTrack.style.cursor = 'grabbing';
      }
      carouselTrack.scrollLeft = initialScrollLeft - (xDiff * 1.4);
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        carouselTrack.style.scrollBehavior = 'smooth';
        carouselTrack.style.cursor = '';
        if (isDraggingTrack) {
          setTimeout(() => { isDraggingTrack = false; }, 80);
        }
      }
    });

    // Rastreamento de toque mobile no track
    let touchStartX = 0;
    let touchStartY = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
      isTouchScrolling = false;
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    carouselTrack.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > 8 || dy > 8) {
          isTouchScrolling = true;
        }
      }
    }, { passive: true });

    carouselTrack.addEventListener('touchend', () => {
      if (isTouchScrolling) {
        setTimeout(() => { isTouchScrolling = false; }, 100);
      }
    }, { passive: true });

    // Inicialização
    updateControls(0);
  }

  /* ==========================================================================
     4. LIGHTBOX MODAL (Zoom das Páginas do Carrossel)
     ========================================================================== */
  const lightboxModal = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');

  if (lightboxModal && slides.length > 0) {
    let currentLightboxIdx = 0;
    let justOpenedTime = 0;

    const updateLightbox = (idx) => {
      currentLightboxIdx = Math.max(0, Math.min(idx, slides.length - 1));
      const activeSlide = slides[currentLightboxIdx];
      if (!activeSlide) return;

      const src = activeSlide.getAttribute('data-src') || activeSlide.querySelector('img')?.src;
      const title = activeSlide.getAttribute('data-title');

      if (lightboxImg && src) {
        lightboxImg.style.opacity = '0.35';
        lightboxImg.src = src;
        lightboxImg.onload = () => { lightboxImg.style.opacity = '1'; };
      }

      if (lightboxCounter) {
        lightboxCounter.textContent = title || `Página ${currentLightboxIdx + 1} de ${slides.length}`;
      }

      if (lightboxPrevBtn) lightboxPrevBtn.disabled = currentLightboxIdx === 0;
      if (lightboxNextBtn) lightboxNextBtn.disabled = currentLightboxIdx === slides.length - 1;
    };

    const openLightbox = (idx) => {
      justOpenedTime = Date.now();
      updateLightbox(idx);
      lightboxModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      // Protege contra ghost-clicks que poderiam fechar instantaneamente
      if (Date.now() - justOpenedTime < 250) return;
      lightboxModal.classList.remove('active');
      document.body.style.overflow = '';
      if (typeof goToSlide === 'function') {
        goToSlide(currentLightboxIdx);
      }
    };

    // Abre lightbox ao clicar em qualquer lugar do card do slide (imagem, selo ou moldura)
    slides.forEach((slide, idx) => {
      const card = slide.querySelector('.slide-card') || slide;
      card.style.cursor = 'zoom-in';
      
      card.addEventListener('click', (e) => {
        if (isDraggingTrack || isTouchScrolling) return;
        e.preventDefault();
        openLightbox(idx);
      });
    });

    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
      });
    }

    if (lightboxBackdrop) {
      lightboxBackdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
      });
    }

    const lightboxImageWrap = document.getElementById('lightboxImageWrap');
    if (lightboxImageWrap) {
      lightboxImageWrap.addEventListener('click', (e) => {
        if (e.target === lightboxImageWrap) {
          closeLightbox();
        }
      });
    }

    if (lightboxPrevBtn) {
      lightboxPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateLightbox(currentLightboxIdx - 1);
      });
    }

    if (lightboxNextBtn) {
      lightboxNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateLightbox(currentLightboxIdx + 1);
      });
    }

    // Teclado: ESC para fechar, setas para navegar
    window.addEventListener('keydown', (e) => {
      if (!lightboxModal.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') updateLightbox(currentLightboxIdx - 1);
      if (e.key === 'ArrowRight') updateLightbox(currentLightboxIdx + 1);
    });

    // Swipe horizontal no Lightbox (mobile)
    let lbTouchStartX = 0;
    let lbTouchStartY = 0;
    lightboxModal.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        lbTouchStartX = e.changedTouches[0].screenX;
        lbTouchStartY = e.changedTouches[0].screenY;
      }
    }, { passive: true });

    lightboxModal.addEventListener('touchend', (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const diffX = e.changedTouches[0].screenX - lbTouchStartX;
      const diffY = e.changedTouches[0].screenY - lbTouchStartY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          updateLightbox(currentLightboxIdx + 1);
        } else {
          updateLightbox(currentLightboxIdx - 1);
        }
      }
    }, { passive: true });

    // Permite testar/abrir diretamente via URL #ver-de-perto
    if (window.location.hash === '#ver-de-perto' || window.location.hash === '#zoom') {
      setTimeout(() => { openLightbox(0); }, 200);
    }
  }

  /* ==========================================================================
     5. TOGGLE DE LIKES ESTILO FACEBOOK (Prova Social Interativa)
     ========================================================================== */
  const likeBtns = document.querySelectorAll('.fb-like-btn');
  likeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const countSpan = btn.querySelector('.like-count');
      let currentCount = parseInt(btn.getAttribute('data-count'), 10) || 0;
      const isLiked = btn.classList.contains('liked');

      if (isLiked) {
        btn.classList.remove('liked');
        currentCount -= 1;
      } else {
        btn.classList.add('liked');
        currentCount += 1;
      }

      btn.setAttribute('data-count', currentCount);
      if (countSpan) {
        countSpan.textContent = currentCount;
      }
    });
  });



  /* ==========================================================================
     6. GATILHO DE ESCASSEZ - VAGAS RESTANTES (Com detecção de visualização)
     ========================================================================== */
  const vagasBar = document.getElementById('vagasBar');
  const vagasCount = document.getElementById('vagasCount');

  if (vagasBar && vagasCount) {
    let triggered = false;

    const startDecrementCountdown = () => {
      if (triggered) return;
      triggered = true;

      // Espera 3 segundos após o usuário visualizar a seção
      setTimeout(() => {
        const currentVal = parseInt(vagasCount.textContent.trim(), 10) || 7;
        const newVal = Math.max(1, currentVal - 1);

        // Aplica animação de troca e número decrementado (ex: 7 para 6)
        vagasCount.classList.add('vagas-drop');
        vagasCount.textContent = newVal;

        // Feedback sutil no card para chamar atenção da mudança
        vagasBar.style.transform = 'scale(1.02)';
        vagasBar.style.borderColor = '#F43F5E';
        vagasBar.style.boxShadow = '0 0 12px rgba(244, 63, 94, 0.22)';

        setTimeout(() => {
          vagasBar.style.transform = '';
          vagasBar.style.borderColor = '';
          vagasBar.style.boxShadow = '';
        }, 600);
      }, 3000);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startDecrementCountdown();
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      observer.observe(vagasBar);
    } else {
      setTimeout(startDecrementCountdown, 3000);
    }
  }

  /* ==========================================================================
     7. SMOOTH SCROLL PARA ANCHORS (Centraliza na área de escassez/oferta)
     ========================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      e.preventDefault();

      // Quando o botão levar para a oferta/checkout, centraliza na barra de escassez
      if (targetId === '#oferta' || targetId === '#vagasBar') {
        const vagasTarget = document.getElementById('vagasBar') || document.querySelector('#oferta');
        if (vagasTarget) {
          vagasTarget.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          return;
        }
      }

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

});
