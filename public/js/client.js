/**
 * client.js — Routage côté client avec Page.js + interactions UI
 * Utilise classList pour toutes les manipulations CSS (pas de style inline).
 * Utilise des classes ES6 pour organiser les composants UI.
 */

/* =========================================================
   1. CLASSE : INDICATEUR DE CHARGEMENT
   ========================================================= */

/**
 * Gère l'indicateur de chargement de la barre de progression.
 * Utilise classList exclusivement — aucun style inline.
 */
class Loader {
  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'page-loader';
    this.el.setAttribute('aria-hidden', 'true');
    this.el.setAttribute('role', 'status');
    document.body.appendChild(this.el);
  }

  show() {
    document.body.classList.add('is-loading');
    this.el.classList.add('active');
  }

  hide() {
    document.body.classList.remove('is-loading');
    this.el.classList.remove('active');
  }
}

/* =========================================================
   2. CLASSE : ROUTEUR SPA AVEC PAGE.JS
   ========================================================= */

/**
 * Gère la navigation côté client via Page.js.
 * Intercepte les liens et remplace le contenu de #main-content via fetch.
 */
class SpaRouter {
  /**
   * @param {Loader} loader - Instance du loader à afficher pendant la navigation
   */
  constructor(loader) {
    this.loader = loader;
    this.contentArea = document.querySelector('#main-content');
  }

  /**
   * Charge une URL via fetch et injecte le contenu dans #main-content.
   * @param {string} url
   */
  async navigate(url) {
    this.loader.show();
    try {
      const res = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (!res.ok) {
        window.location.href = url;
        return;
      }

      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newMain = doc.querySelector('#main-content');
      const newTitle = doc.querySelector('title');

      if (newMain && this.contentArea) {
        this.contentArea.innerHTML = newMain.innerHTML;
        uiManager.attach();
        window.favorisManager?.reattacher();
        window.etoilesCarteManager?.reattacher();
      }
      if (newTitle) {
        document.title = newTitle.textContent;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      navManager.setActive();

    } catch {
      window.location.href = url;
    } finally {
      this.loader.hide();
    }
  }

  /** Enregistre les routes Page.js et démarre le routeur. */
  init() {
    if (typeof page === 'undefined') return;

    page('/', (ctx) => this.navigate(ctx.path));
    page('/recettes/:id', (ctx) => this.navigate(ctx.path));
    page('/recherche', (ctx) => {
      const url = ctx.path + (ctx.querystring ? '?' + ctx.querystring : '');
      this.navigate(url);
    });

    // Intercepter la barre de recherche navbar
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('form[action="/recherche"]');
      if (!form) return;
      e.preventDefault();
      const q = form.querySelector('input[name="q"]').value.trim();
      page('/recherche?' + new URLSearchParams({ q }));
    });

    page({ hashbang: false });
  }
}

/* =========================================================
   3. CLASSE : GESTIONNAIRE DE FORMULAIRES
   ========================================================= */

/**
 * Gère la validation visuelle des formulaires et la confirmation de suppression.
 * Toutes les manipulations CSS passent par classList.
 */
class FormManager {
  /** Attache tous les listeners dynamiques sur la page courante. */
  attach() {
    this._attachDeleteConfirm();
    this._attachValidation();
    this._attachPasswordToggle();
  }

  /** Confirmation avant suppression d'une recette. */
  _attachDeleteConfirm() {
    const btn = document.getElementById('btn-supprimer');
    if (btn) {
      // Éviter les doublons d'écouteurs
      btn.replaceWith(btn.cloneNode(true));
      const freshBtn = document.getElementById('btn-supprimer');
      freshBtn.addEventListener('click', (e) => {
        const titre = e.currentTarget.dataset.recetteTitre || 'questa ricetta';
        if (window.confirm(`Eliminare « ${titre} »? Questa azione è irreversibile.`)) {
          document.getElementById('form-supprimer')?.submit();
        }
      });
    }
  }

  /** Validation en temps réel + à la soumission pour tous les formulaires novalidate. */
  _attachValidation() {
    document.querySelectorAll('form[novalidate]').forEach(form => {
      form.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('blur', () => this._validateField(field));
        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) this._validateField(field);
        });
      });

      form.addEventListener('submit', (e) => {
        let valid = true;
        form.querySelectorAll('[required]').forEach(field => {
          if (!this._validateField(field)) valid = false;
        });
        if (!valid) {
          e.preventDefault();
          form.querySelector('.is-invalid')?.focus();
        }
      });
    });
  }

  /**
   * Valide un champ et applique les classes Bootstrap is-valid / is-invalid.
   * @param {HTMLElement} field
   * @returns {boolean}
   */
  _validateField(field) {
    const isValid = field.checkValidity();
    field.classList.remove('is-valid', 'is-invalid');
    field.classList.add(isValid ? 'is-valid' : 'is-invalid');

    let feedback = field.nextElementSibling;
    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
      feedback = document.createElement('div');
      feedback.classList.add('invalid-feedback');
      field.insertAdjacentElement('afterend', feedback);
    }
    feedback.textContent = isValid ? '' : (field.validationMessage || 'Questo campo non è valido.');
    return isValid;
  }

  /** Bouton afficher/masquer le mot de passe. */
  _attachPasswordToggle() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
      const wrapper = input.parentElement;
      if (wrapper.querySelector('.btn-toggle-pwd')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add('btn', 'btn-outline-secondary', 'btn-toggle-pwd');
      btn.setAttribute('aria-label', 'Mostra/nascondi password');
      btn.textContent = '👁';

      if (!wrapper.classList.contains('input-group')) {
        wrapper.classList.add('input-group');
      }
      input.insertAdjacentElement('afterend', btn);

      btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.classList.toggle('active', isPassword);
        btn.setAttribute('aria-pressed', String(isPassword));
      });
    });
  }
}

/* =========================================================
   4. CLASSE : GESTIONNAIRE DE NAVIGATION
   ========================================================= */

/**
 * Met à jour le lien actif dans la navbar via classList.
 */
class NavManager {
  setActive() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
      const href = link.getAttribute('href');
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      if (href && (href === currentPath || (href !== '/' && currentPath.startsWith(href)))) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }
}

/* =========================================================
   5. INITIALISATION
   ========================================================= */

const loader     = new Loader();
const uiManager  = new FormManager();
const navManager = new NavManager();
const router     = new SpaRouter(loader);

document.addEventListener('DOMContentLoaded', () => {
  navManager.setActive();
  uiManager.attach();
  router.init();
});
