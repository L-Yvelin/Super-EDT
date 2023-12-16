class Cours extends HTMLElement {
    constructor(heure, salle, libelle, professeur) {
        super();
        this.attachShadow({ mode: 'open' });

        this.heure = heure;
        this.salle = salle;
        this.libelle = libelle;
        this.professeur = professeur;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <div class="cours${this.heure >= 855 ? ' apres-midi' : ''}">
            <div class="heure">${this.minutesToTime(this.start_time)}</div>
            <div class="salle">${this.salle}</div>
            <div class="libelle">${this.libelle}</div>
            <div class="professeur">${this.professeur || '—'}</div>
        </div>
        `;
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const minutesPart = minutes % 60;
        const formattedTime = `${hours}h${minutesPart.toString().padStart(2, '0')}`;
        return formattedTime;
    }
}


class Jour extends HTMLElement {
    constructor(cours, indexJour) {
        super();
        this.attachShadow({ mode: 'open' });

        this.cours = cours;
        // console.log(this.cours);
        this.indexJour = indexJour;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = '';
        this.cours.forEach(cours => {
            heure = cours[0]
            salle = cours[1]
            libelle = cours[2]
            professeur = cours[3]

            const elementCours = new Cours(heure, salle, libelle, professeur);
            elementCours.render();
            this.shadowRoot.appendChild(elementCours)
        });
    }
}

class Interface extends HTMLElement {
    constructor(jours, indexJour, affichage) {
        super();
        this.attachShadow({ mode: 'open' });

        this.indexList = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];
        console.log(jours);

        this.jours = jours;
        this.indexJour = indexJour;
        this.affichage = affichage;
    }

    // connectedCallback() {
    //     this.render();
    // }

    render() {
        this.shadowRoot.innerHTML = '';
        switch (this.affichage) {
            case 'Jour':
                this.renderJourView();
                break;
            case 'Semaine':
                this.renderSemaineView();
                break;
        }
    }

    renderJourView() {
        const todayIndex = new Date().getDay();

        const elementJour = new Jour([this.jours[0]], this.indexJour);
        const isToday = this.indexJour === todayIndex;
        
        this.shadowRoot.innerHTML += `
            <div class="date">
                <span id="nom-jour${isToday ? ' aujourd\'hui' : ''}">Mardi</span>
                <div id="precedent-suivant">
                    <div class="jour-precedent"><span>◂</span></div>
                    <div class="jour-suivant"><span>▸</span></div>
                </div>
            </div>`;
        elementJour.render();
        this.shadowRoot.appendChild(elementJour);
    }

    renderSemaineView() {

    }
}

customElements.define('element-cours', Cours);
customElements.define('element-jour', Jour);
customElements.define('element-interface', Interface);
