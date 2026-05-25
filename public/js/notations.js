/**
 * notations.js — Notations par étoiles (page détail + cartes recettes).
 * Communique avec /api/notations via fetch.
 */

/** Affiche ★ pleines et ☆ contour pour une ligne d'étoiles. */
function afficherEtoilesBoutons(boutons, valeur) {
  boutons.forEach(btn => {
    const v = Number(btn.dataset.valeur);
    const pleine = v <= valeur && valeur > 0;
    btn.textContent = pleine ? '★' : '☆';
    btn.classList.toggle('etoile-active', pleine);
    btn.classList.toggle('etoile-vide', !pleine);
    btn.setAttribute('aria-pressed', pleine ? 'true' : 'false');
  });
}

class NotationsManager {
  constructor() {
    this.widget = document.getElementById('widget-notation');
    if (!this.widget) return;

    this.recetteId = this.widget.dataset.recetteId;
    this.etoiles   = this.widget.querySelectorAll('.etoile-btn');
    this.form      = document.getElementById('form-notation');
    this.suggestion = document.getElementById('notation-suggestion');
    this.msg       = document.getElementById('notation-message');
    this.resume    = document.getElementById('notation-resume');
    this.listeAvis = document.getElementById('liste-avis');
    this.noteSelectionnee = 0;

    this._attacher();
    this._charger();
  }

  _attacher() {
    this.etoiles.forEach(btn => {
      btn.addEventListener('click', () => this._selectionner(Number(btn.dataset.valeur)));
      btn.addEventListener('mouseenter', () => afficherEtoilesBoutons(this.etoiles, Number(btn.dataset.valeur)));
      btn.addEventListener('mouseleave', () => afficherEtoilesBoutons(this.etoiles, this.noteSelectionnee));
    });

    if (this.form) {
      this.form.addEventListener('submit', (e) => this._soumettre(e));
    }
  }

  _selectionner(valeur) {
    this.noteSelectionnee = valeur;
    afficherEtoilesBoutons(this.etoiles, valeur);
  }

  async _charger() {
    try {
      const res  = await fetch(`/api/notations/${this.recetteId}`);
      if (!res.ok) return;
      const data = await res.json();
      this._majResume(data.moyenne, data.nombre);
      this._majAvis(data.avis);

      if (data.maNotation) {
        this._selectionner(data.maNotation.etoiles);
        if (this.suggestion && data.maNotation.suggestion) {
          this.suggestion.value = data.maNotation.suggestion;
        }
      }
    } catch { /* silencieux */ }
  }

  async _soumettre(e) {
    e.preventDefault();
    if (!this.noteSelectionnee) {
      this._afficherMessage('Seleziona almeno una stella.', 'danger');
      return;
    }

    const btn = this.form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`/api/notations/${this.recetteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etoiles: this.noteSelectionnee,
          suggestion: this.suggestion?.value?.trim() || null,
        }),
      });

      if (res.redirected || res.status === 401 || res.status === 403) {
        window.location.href = '/connexion';
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.ok) {
        this._afficherMessage(data.message || 'Errore durante l\'invio.', 'danger');
        return;
      }

      this._majResume(data.moyenne, data.nombre);
      this._afficherMessage('Grazie! La tua valutazione è stata registrata.', 'success');
      await this._rechargerAvis();
    } catch {
      this._afficherMessage('Errore di connessione.', 'danger');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async _rechargerAvis() {
    try {
      const res  = await fetch(`/api/notations/${this.recetteId}`);
      const data = await res.json();
      this._majAvis(data.avis);
    } catch { /* silencieux */ }
  }

  _majResume(moyenne, nombre) {
    if (!this.resume) return;
    const moy = Number(moyenne) || 0;
    const nb  = Number(nombre) || 0;
    if (nb === 0) {
      this.resume.innerHTML = '<span class="text-muted">Nessuna valutazione per il momento</span>';
      return;
    }
    const pleines = Math.round(moy);
    let etoilesHtml = '';
    for (let i = 1; i <= 5; i++) {
      const sym = i <= pleines ? '★' : '☆';
      const cls = i <= pleines ? 'etoile-pleine' : 'etoile-vide';
      etoilesHtml += `<span class="etoile ${cls}" aria-hidden="true">${sym}</span>`;
    }
    this.resume.innerHTML = `${etoilesHtml}<span class="etoiles-meta"><strong>${moy}</strong>/5 <span class="text-muted">(${nb} valutazion${nb !== 1 ? 'i' : 'e'})</span></span>`;
  }

  _majAvis(avis) {
    if (!this.listeAvis) return;
    if (!avis || avis.length === 0) {
      this.listeAvis.innerHTML = '<p class="text-muted small mb-0">Nessun commento per il momento.</p>';
      return;
    }

    this.listeAvis.innerHTML = avis.map(a => {
      let etoiles = '';
      for (let i = 1; i <= 5; i++) {
        etoiles += i <= a.etoiles ? '★' : '☆';
      }
      const date = new Date(a.cree_le).toLocaleDateString('it-IT');
      const texte = a.suggestion
        ? `<p class="mb-0 mt-1">${this._echapper(a.suggestion)}</p>`
        : '';
      return `
        <li class="avis-item">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <strong>${this._echapper(a.auteur)}</strong>
            <span class="avis-etoiles" aria-label="${a.etoiles} stelle">${etoiles}</span>
          </div>
          <time class="text-muted small" datetime="${a.cree_le}">${date}</time>
          ${texte}
        </li>`;
    }).join('');
  }

  _afficherMessage(texte, type) {
    if (!this.msg) return;
    this.msg.textContent = texte;
    this.msg.className = `alert alert-${type} py-2 small`;
    this.msg.classList.remove('d-none');
    setTimeout(() => this.msg.classList.add('d-none'), 4000);
  }

  _echapper(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

/**
 * Étoiles interactives en bas de chaque carte recette.
 */
class EtoilesCarteManager {
  constructor() {
    this._enCours = new Set();
    if (!this._delegationOk) {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.etoiles-carte .etoile-btn');
        if (!btn || btn.disabled) return;
        const carte = btn.closest('.etoiles-carte');
        if (!carte) return;
        e.preventDefault();
        e.stopPropagation();
        this._noter(carte, Number(btn.dataset.valeur));
      });

      document.addEventListener('mouseover', (e) => {
        const btn = e.target.closest('.etoiles-carte .etoile-btn');
        if (!btn) return;
        const carte = btn.closest('.etoiles-carte');
        afficherEtoilesBoutons(carte.querySelectorAll('.etoile-btn'), Number(btn.dataset.valeur));
      });

      this._delegationOk = true;
    }
    this.initCartes();
  }

  reattacher() {
    this.initCartes();
  }

  initCartes() {
    document.querySelectorAll('.etoiles-carte').forEach(carte => {
      if (!carte.querySelector('.etoile-btn')) return;
      if (!carte.dataset.hoverOk) {
        carte.addEventListener('mouseleave', () => {
          const note = Number(carte.dataset.maNote) || 0;
          afficherEtoilesBoutons(carte.querySelectorAll('.etoile-btn'), note);
        });
        carte.dataset.hoverOk = '1';
      }
      const id = carte.dataset.recetteId;
      if (id) this._chargerCarte(carte, id);
    });
  }

  async _chargerCarte(carte, id) {
    try {
      const res  = await fetch(`/api/notations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const note = data.maNotation ? data.maNotation.etoiles : 0;
      carte.dataset.maNote = String(note);
      const boutons = carte.querySelectorAll('.etoile-btn');
      afficherEtoilesBoutons(boutons, note);
      this._majResumeCarte(carte, data.moyenne, data.nombre);
    } catch { /* silencieux */ }
  }

  async _noter(carte, valeur) {
    const id = carte.dataset.recetteId;
    if (!id || this._enCours.has(id)) return;

    this._enCours.add(id);
    const boutons = carte.querySelectorAll('.etoile-btn');
    const ancienne = Number(carte.dataset.maNote) || 0;

    carte.dataset.maNote = String(valeur);
    afficherEtoilesBoutons(boutons, valeur);
    boutons.forEach(b => { b.disabled = true; });

    try {
      const res = await fetch(`/api/notations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etoiles: valeur, suggestion: null }),
      });

      if (res.redirected || res.status === 401 || res.status === 403) {
        window.location.href = '/connexion';
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.ok) {
        carte.dataset.maNote = String(ancienne);
        afficherEtoilesBoutons(boutons, ancienne);
        return;
      }

      carte.dataset.maNote = String(valeur);
      afficherEtoilesBoutons(boutons, valeur);
      this._majResumeCarte(carte, data.moyenne, data.nombre);
      carte.classList.add('etoiles-carte-ok');
      setTimeout(() => carte.classList.remove('etoiles-carte-ok'), 600);
    } catch {
      carte.dataset.maNote = String(ancienne);
      afficherEtoilesBoutons(boutons, ancienne);
    } finally {
      boutons.forEach(b => { b.disabled = false; });
      this._enCours.delete(id);
    }
  }

  _majResumeCarte(carte, moyenne, nombre) {
    const el = carte.querySelector('.etoiles-carte-resume');
    if (!el) return;
    const moy = Number(moyenne) || 0;
    const nb  = Number(nombre) || 0;
    if (nb === 0) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `<span class="etoiles-meta"><strong>${moy}</strong>/5 <span class="text-muted">(${nb})</span></span>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.notationsManager = new NotationsManager();
  window.etoilesCarteManager = new EtoilesCarteManager();
});
