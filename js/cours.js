class Cours extends HTMLElement {
    heuresValides = [480, 570, 665, 750, 855, 945, 1040];
    abbreviations = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];

    constructor() {
        super();
    }

    connectedCallback() { }

    renderDay(data, currentDayAbbreviation) {
        this.innerHTML = `
        <div id="jour-top-menu">
            <div id="mode-switcher" class="to-week"></div>
            <div class="date">
                <span id="nom-jour" class="${new Date().getDay() == abbreviations.indexOf(currentDayAbbreviation) ? 'aujourdhui' : ''}">${getFrenchDay(currentDayAbbreviation)}</span>
                <div id="precedent-suivant">
                    <div class="jour-precedent"><span>◂</span></div>
                    <div class="jour-suivant"><span>▸</span></div>
                </div>
            </div>
        <div>
        `;
        this.innerHTML += this.getDayCourses(data, currentDayAbbreviation);
        this.innerHTML += `
            <span id="overflow-cours" onclick="scrollElementCoursBottom()" visible="false">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-short" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4"/>
                </svg>
            </span>
        `;
    }

    renderSemaine(data) {
        this.innerHTML = `
        <div id="jour-top-menu">
            <div id="mode-switcher" class="to-day"></div>
            <div class="date">
                <span> Semaine ${currentSemaine}</span>
                <div id="precedent-suivant">
                    <div class="jour-precedent"><span>◂</span></div>
                    <div class="jour-suivant"><span>▸</span></div>
                </div>
            </div>
        <div>
        `;
        this.innerHTML += this.getSemaineCourses(data);
    }

    getDayCourses(data, dayAbbreviation, minimal = false) {
        // Filter and order the courses based on valid hours
        const filteredAndOrderedCourses = data
            .filter(cours => cours.day === dayAbbreviation && this.heuresValides.includes(cours.start_time))
            .sort((a, b) => a.start_time - b.start_time);

        // Create an associative array with valid hours as keys
        const coursesByHour = {};
        this.heuresValides.forEach(hour => {
            coursesByHour[hour] = filteredAndOrderedCourses.filter(cours => cours.start_time === hour);
        });

        // Accumulate HTML strings in a separate variable
        let htmlContent = minimal ? `<div class='jour'>` : '';

        Object.keys(coursesByHour).forEach(hour => {
            const coursesAtHour = coursesByHour[hour];

            if (hour == this.heuresValides[3]) {
                htmlContent += `
                <div class='repas'>
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" version="1.1" id="Capa_1" width="800px" height="800px" viewBox="0 0 163.476 163.476" xml:space="preserve">
                        <g>
                            <path d="M88.291,9.223v41.432c0,13.239-9.229,24.009-20.58,24.009h-1.273v76.341c0,6.886-5.582,12.471-12.467,12.471   c-6.887,0-12.469-5.581-12.469-12.471V74.664h-1.277c-11.347,0-20.576-10.77-20.576-24.009V9.223c0-4.588,3.716-8.309,8.304-8.309   c4.592,0,8.311,3.721,8.311,8.309v41.432c0,4.443,2.382,7.39,3.961,7.39h5.431V9.229c0-4.588,3.721-8.309,8.308-8.309   c4.583,0,8.305,3.721,8.305,8.309v48.816h5.43c1.573,0,3.961-2.947,3.961-7.39V9.223c0-4.588,3.721-8.309,8.311-8.309   C84.56,0.914,88.291,4.635,88.291,9.223z M143.517,16.906C142.662,7.447,134.805,0,125.117,0c-10.255,0-18.561,8.309-18.561,18.564   l0,0c-0.044,0.43-0.126,0.851-0.126,1.294v131.126c0,6.889,5.575,12.472,12.465,12.472c6.889,0,12.471-5.583,12.471-12.472V109.43   c6.884,0,12.46-5.576,12.46-12.455V19.549C143.81,18.648,143.7,17.763,143.517,16.906z"/>
                        </g>
                    </svg>
                </div>
                `;
            } else if (coursesAtHour.length > 0) {
                // Generate HTML for courses at the current hour
                htmlContent += coursesAtHour
                    .map(cours => this.getHeureHTML(cours, minimal))
                    .join('');
            } else {
                // Add a placeholder or specific message when no courses at the current hour
                htmlContent += `<div class='pas-cours cours'><text>Pas cours</text></div>`;
            }
        });

        // Check if there is no data at all
        if (Object.keys(coursesByHour).length === 0) {
            this.innerHTML = `<div id='grasse-matinee'>Grasse matinée !</div>`;
        }

        return htmlContent + '</div>';
    }

    getSemaineCourses(data) {
        let semaineHTML = `
            <div class='semaine'>
        `;

        // <div id='bande-heures'>
        //     <wbr>
        //         ${this.heuresValides.map(heure =>
        //     `
        //             <div class="${heure != 750 ? 'heure-cours-bande' : 'heure-midi-bande'}">
        //                 <div class='heure-debut-bande'>${minutesToTime(heure)}</div>
        //                 <div class='heure-fin-bande'>${minutesToTime(heure + 85)}</div>
        //             </div>
        //             `
        // ).join('')}
        //     </div>

        // Loop through each day of the week and call getDayCourses for each day
        this.abbreviations.slice(1, -1).forEach(dayAbbreviation => {
            semaineHTML += `${this.getDayCourses(data, dayAbbreviation, true)}`;
        });
        semaineHTML += `</div>`;
        return semaineHTML;
    }

    getHeureHTML(cours, minimal = false) {
        return `
          <div class="cours${cours.start_time >= 855 ? ' apres-midi' : ''}${cours.course.room_type === 'CTRL' ? ' DS' : ''}" style="--color-bg:${cours.course.module.display.color_bg || ''};">
            ${!minimal ? `
              <div class="heure_fin">
                <span>${minutesToTime(cours.start_time + 85)}</span>
                ${cours.start_time == 570 || cours.start_time == 945 ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cup-hot" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M.5 6a.5.5 0 0 0-.488.608l1.652 7.434A2.5 2.5 0 0 0 4.104 16h5.792a2.5 2.5 0 0 0 2.44-1.958l.131-.59a3 3 0 0 0 1.3-5.854l.221-.99A.5.5 0 0 0 13.5 6zM13 12.5a2.01 2.01 0 0 1-.316-.025l.867-3.898A2.001 2.001 0 0 1 13 12.5M2.64 13.825 1.123 7h11.754l-1.517 6.825A1.5 1.5 0 0 1 9.896 15H4.104a1.5 1.5 0 0 1-1.464-1.175Z"/>
                        <path d="m4.4.8-.003.004-.014.019a4.167 4.167 0 0 0-.204.31 2.327 2.327 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.31 3.31 0 0 1-.202.388 5.444 5.444 0 0 1-.253.382l-.018.025-.005.008-.002.002A.5.5 0 0 1 3.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 3.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 3 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 4.4.8m3 0-.003.004-.014.019a4.167 4.167 0 0 0-.204.31 2.327 2.327 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.31 3.31 0 0 1-.202.388 5.444 5.444 0 0 1-.253.382l-.018.025-.005.008-.002.002A.5.5 0 0 1 6.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 6.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 6 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 7.4.8m3 0-.003.004-.014.019a4.077 4.077 0 0 0-.204.31 2.337 2.337 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.198 3.198 0 0 1-.202.388 5.385 5.385 0 0 1-.252.382l-.019.025-.005.008-.002.002A.5.5 0 0 1 9.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 9.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 9 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 10.4.8"/>
                    </svg>
                ` : ''}
                </div>
              
              <div class="heure">${minutesToTime(cours.start_time)}</div>` : ''
            }
              <div class="salle">${cours.room.name}</div>
              <div class="libelle">${minimal ? cours.course.module.abbrev : cours.course.module.name}</div>
              <div class="professeur">${minimal ? cours.tutor || '—' : findNameByUsername(cours.tutor) || cours.tutor || '—' }</div>
          </div>
          `;
    }
}

customElements.define('element-cours', Cours);
