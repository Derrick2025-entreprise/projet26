/**
 * favoris.js — Gestion des favoris et autocomplete de recherche.
 * Utilise fetch + classList. Aucun style inline.
 * Classes ES6 : FavorisManager, Autocomplete.
 */

/* =========================================================
   CLASSE : GESTIONNAIRE DE FAVORIS
   Communique avec /api/favoris via fetch (DELETE/POST).
   ========================================================= */

/**
 * Gère les boutons favoris sur toutes les pages.
 * Délégation d'événements : un seul listener, compatible navigation SPA.
 */
class FavorisManager {
  constructor() {
    this._enCours = new Set();
    this._init();
  }

  _init() {
    if (this._delegationOk) return;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-favori');
      if (!btn || btn.disabled) return;
      e.preventDefault();
      e.stopPropagation();
      this._basculer(btn);
    });
    this._delegationOk = true;
    this.chargerTous();
  }

  /** Réinitialise après injection SPA (#main-content). */
  reattacher() {
    this.chargerTous();
  }

  /** Charge le statut favori pour tous les boutons visibles. */
  chargerTous() {
    document.querySelectorAll('.btn-favori').forEach(btn => {
      const id = btn.dataset.recetteId;
      if (id) this._chargerStatut(btn, id);
    });
  }

  async _chargerStatut(btn, id) {
    if (this._enCours.has(`statut-${id}`)) return;
    try {
      const res  = await fetch(`/api/favoris/${id}/statut`);
      if (!res.ok) return;
      const data = await res.json();
      if (!this._enCours.has(`toggle-${id}`)) {
        this._majBouton(btn, data.favori);
      }
    } catch { /* silencieux si non connecté */ }
  }

  async _basculer(btn) {
    const id = btn.dataset.recetteId;
    if (!id || this._enCours.has(`toggle-${id}`)) return;

    const etaitActif = btn.classList.contains('btn-favori-actif');
    const nouvelEtat = !etaitActif;

    this._enCours.add(`toggle-${id}`);
    this._majBouton(btn, nouvelEtat);

    btn.classList.add('btn-favori-chargement');
    btn.disabled = true;

    const methode = etaitActif ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/favoris/${id}`, { method: methode });
      if (res.redirected || res.status === 401 || res.status === 403) {
        window.location.href = '/connexion';
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      this._majBouton(btn, data.favori);

      btn.classList.add('btn-favori-pulse');
      setTimeout(() => btn.classList.remove('btn-favori-pulse'), 400);

      if (!data.favori) {
        const carte = btn.closest('li.col');
        if (carte && window.location.pathname === '/favoris') {
          carte.classList.add('carte-suppression');
          setTimeout(() => carte.remove(), 300);
        }
      }
    } catch {
      this._majBouton(btn, etaitActif);
    } finally {
      btn.disabled = false;
      btn.classList.remove('btn-favori-chargement');
      this._enCours.delete(`toggle-${id}`);
    }
  }

  _majBouton(btn, estFavori) {
    btn.textContent = estFavori ? '❤️' : '🤍';
    btn.setAttribute('aria-pressed', String(estFavori));
    btn.setAttribute('aria-label', estFavori ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti');
    btn.classList.toggle('btn-favori-actif', estFavori);
  }
}

/* =========================================================
   CLASSE : AUTOCOMPLETE DE RECHERCHE
   ========================================================= */

class Autocomplete {
  constructor(inputId, listeId) {
    this.input  = document.getElementById(inputId);
    this.liste  = document.getElementById(listeId);
    if (!this.input || !this.liste) return;

    this._timer = null;
    this._actif = -1;
    this._attacher();
  }

  _attacher() {
    this.input.addEventListener('input',   () => this._onInput());
    this.input.addEventListener('keydown', (e) => this._onKeydown(e));
    this.input.addEventListener('blur',    () => setTimeout(() => this._fermer(), 200));
    document.addEventListener('click', (e) => {
      if (!this.input.contains(e.target) && !this.liste.contains(e.target)) {
        this._fermer();
      }
    });
  }

  _onInput() {
    clearTimeout(this._timer);
    const q = this.input.value.trim();
    if (q.length < 2) { this._fermer(); return; }
    this._timer = setTimeout(() => this._chercher(q), 250);
  }

  async _chercher(q) {
    try {
      const res  = await fetch(`/api/recherche?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      this._afficher(data, q);
    } catch { this._fermer(); }
  }

  _afficher(resultats, q) {
    this.liste.innerHTML = '';
    this._actif = -1;

    if (resultats.length === 0) {
      this._fermer();
      return;
    }

    resultats.forEach((r, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('id', `autocomplete-item-${i}`);
      li.classList.add('autocomplete-item');
      li.dataset.href = `/recettes/${r.id}`;

      const titre = r.titre.replace(
        new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
        '<mark>$1</mark>'
      );

      li.innerHTML = `
        <span class="autocomplete-img">
          ${r.image_url
            ? `<img src="${r.image_url}" alt="" aria-hidden="true">`
            : '<span aria-hidden="true">🍴</span>'}
        </span>
        <span class="autocomplete-texte">
          <span class="autocomplete-titre">${titre}</span>
          <span class="autocomplete-auteur">par ${r.auteur}</span>
        </span>`;

      li.addEventListener('mousedown', () => {
        window.location.href = `/recettes/${r.id}`;
      });

      this.liste.appendChild(li);
    });

    const liTous = document.createElement('li');
    liTous.classList.add('autocomplete-item', 'autocomplete-tous');
    liTous.setAttribute('role', 'option');
    liTous.textContent = `🔍 Vedi tutti i risultati per « ${q} »`;
    liTous.addEventListener('mousedown', () => {
      window.location.href = `/recherche?q=${encodeURIComponent(q)}`;
    });
    this.liste.appendChild(liTous);

    this.liste.classList.add('autocomplete-ouverte');
    this.input.setAttribute('aria-expanded', 'true');
  }

  _onKeydown(e) {
    const items = this.liste.querySelectorAll('.autocomplete-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._actif = Math.min(this._actif + 1, items.length - 1);
      this._majActif(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._actif = Math.max(this._actif - 1, -1);
      this._majActif(items);
    } else if (e.key === 'Enter' && this._actif >= 0) {
      e.preventDefault();
      const href = items[this._actif].dataset.href;
      if (href) window.location.href = href;
      else items[this._actif].dispatchEvent(new Event('mousedown'));
    } else if (e.key === 'Escape') {
      this._fermer();
    }
  }

  _majActif(items) {
    items.forEach((item, i) => {
      item.classList.toggle('autocomplete-item-actif', i === this._actif);
    });
    if (this._actif >= 0) {
      this.input.setAttribute('aria-activedescendant', `autocomplete-item-${this._actif}`);
    }
  }

  _fermer() {
    this.liste.innerHTML = '';
    this.liste.classList.remove('autocomplete-ouverte');
    this.input.setAttribute('aria-expanded', 'false');
    this._actif = -1;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.favorisManager = new FavorisManager();
  window.autocompleteNav = new Autocomplete('nav-search', 'autocomplete-liste');
});
