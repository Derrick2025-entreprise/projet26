/**
 * meteo.js — Widget heure, date et météo pour Rome (Italie)
 * Utilise l'API Open-Meteo (gratuite, sans clé API).
 * Toutes les manipulations DOM via classList — aucun style inline.
 */

/* =========================================================
   CODES MÉTÉO → ICÔNE + DESCRIPTION
   Source : https://open-meteo.com/en/docs#weathervariables
   ========================================================= */
const CODES_METEO = {
  0:  { icone: '☀️',  label: 'Cielo sereno' },
  1:  { icone: '🌤️', label: 'Poco nuvoloso' },
  2:  { icone: '⛅',  label: 'Parzialmente nuvoloso' },
  3:  { icone: '☁️',  label: 'Coperto' },
  45: { icone: '🌫️', label: 'Nebbia' },
  48: { icone: '🌫️', label: 'Nebbia gelata' },
  51: { icone: '🌦️', label: 'Pioggerella leggera' },
  53: { icone: '🌦️', label: 'Pioggerella moderata' },
  55: { icone: '🌧️', label: 'Pioggerella intensa' },
  61: { icone: '🌧️', label: 'Pioggia leggera' },
  63: { icone: '🌧️', label: 'Pioggia moderata' },
  65: { icone: '🌧️', label: 'Pioggia forte' },
  71: { icone: '🌨️', label: 'Neve leggera' },
  73: { icone: '🌨️', label: 'Neve moderata' },
  75: { icone: '❄️',  label: 'Neve intensa' },
  80: { icone: '🌦️', label: 'Rovesci leggeri' },
  81: { icone: '🌧️', label: 'Rovesci moderati' },
  82: { icone: '⛈️',  label: 'Rovesci violenti' },
  95: { icone: '⛈️',  label: 'Temporale' },
  96: { icone: '⛈️',  label: 'Temporale con grandine' },
  99: { icone: '⛈️',  label: 'Temporale violento' },
};

/**
 * Classe gérant le widget heure/date/météo de Rome.
 * Affiche l'heure en temps réel et récupère la météo via Open-Meteo.
 */
class WidgetItalie {
  /**
   * @param {string} elementId - ID de l'élément DOM cible
   */
  constructor(elementId) {
    this.el = document.getElementById(elementId);
    if (!this.el) return;

    this._intervalHorloge = null;
    this._init();
  }

  _init() {
    this._demarrerHorloge();
    this._chargerMeteo();
  }

  /** Met à jour l'heure et la date toutes les secondes (fuseau Europe/Rome). */
  _demarrerHorloge() {
    const majHeure = () => {
      const maintenant = new Date();
      const heure = maintenant.toLocaleTimeString('it-IT', {
        timeZone: 'Europe/Rome',
        hour: '2-digit',
        minute: '2-digit',
      });
      const date = maintenant.toLocaleDateString('it-IT', {
        timeZone: 'Europe/Rome',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      const elHeure = this.el.querySelector('.widget-heure');
      const elDate  = this.el.querySelector('.widget-date');
      if (elHeure) elHeure.textContent = heure;
      if (elDate)  elDate.textContent  = date;
    };

    majHeure();
    this._intervalHorloge = setInterval(majHeure, 1000);
  }

  /**
   * Récupère la météo actuelle de Rome via Open-Meteo.
   * Coordonnées Rome : lat=41.9028, lon=12.4964
   */
  async _chargerMeteo() {
    const elMeteo = this.el.querySelector('.widget-meteo');
    if (!elMeteo) return;

    try {
      const url = 'https://api.open-meteo.com/v1/forecast'
        + '?latitude=41.9028&longitude=12.4964'
        + '&current=temperature_2m,weathercode'
        + '&timezone=Europe%2FRome';

      const res  = await fetch(url);
      if (!res.ok) throw new Error('Réponse API invalide');

      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weathercode;
      const info = CODES_METEO[code] ?? { icone: '🌡️', label: 'Météo' };

      elMeteo.textContent = `${info.icone} ${temp}°C`;
      elMeteo.setAttribute('title', `Roma — ${info.label}`);
      elMeteo.classList.remove('widget-chargement');
      elMeteo.classList.add('widget-ok');

    } catch {
      const elMeteo2 = this.el.querySelector('.widget-meteo');
      if (elMeteo2) {
        elMeteo2.textContent = '🌡️ —';
        elMeteo2.setAttribute('title', 'Meteo non disponibile');
        elMeteo2.classList.remove('widget-chargement');
        elMeteo2.classList.add('widget-erreur');
      }
    }
  }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  new WidgetItalie('widget-italie');
});
