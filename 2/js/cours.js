class Cours extends HTMLElement {
    currentDayAbbreviation = indexJour;

    constructor() {
        super();
    }

    connectedCallback() { }

    render(data) {
        this.currentDayAbbreviation = indexJour;
        if (data) {
            this.innerHTML = data
                .map(cours => this.getHeureHTML(cours))
                .join('');
        }
    }

    getHeureHTML(cours) {
        if (cours.day != this.currentDayAbbreviation) return;
        return `
          <div class="cours${cours.start_time >= 855 ? ' apres-midi' : ''}">
              <div class="heure">${minutesToTime(cours.start_time)}</div>
              <div class="salle">${cours.room.name}</div>
              <div class="libelle">${cours.course.module.name}</div>
              <div class="professeur">${cours.tutor || '—'}</div>
          </div>
          `;
    }
}

customElements.define('element-cours', Cours);
