/* ==========================================
   VARIABLES GLOBALES Y REFERENCIAS
   ========================================== */
const pokedexGrid = document.getElementById('pokedex-grid');
const searchInput = document.getElementById('search');
const notFoundMessage = document.getElementById('not-found-message');
const generationFilter = document.getElementById('generation-filter');
const typeFilter = document.getElementById('type-filter');

//Paginación
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');
const paginationContainer = document.querySelector('.pagination-container');

//Spinner de Carga
const loader = document.getElementById('loading-spinner');

//Modales y Juego
const modal = document.getElementById('pokemon-modal');
const closeBtn = document.querySelector('.close-btn');
const playBtn = document.getElementById('play-btn');
const btnPlayNav = document.getElementById('btn-play-nav');
const gameModal = document.getElementById('game-modal');
const closeGameBtn = document.querySelector('.close-game');
const startBattleBtn = document.getElementById('start-battle-btn');
const battleLog = document.getElementById('battle-log');
const playerCard = document.getElementById('player-card');
const cpuCard = document.getElementById('cpu-card');
const btnScrollTop = document.getElementById('btn-scroll-top'); 

// Configuración de Paginación
const limit = 20; 
let offset = 0;   
let currentGen = 'all';

// Colores
const typeColors = {
    fire: '#FF7F50', grass: '#7BC74D', electric: '#FFD700', water: '#5FA8D3',
    ground: '#D2B48C', rock: '#A9A9A9', fairy: '#FFB6C1', poison: '#A569BD',
    bug: '#87C55F', dragon: '#6A5ACD', psychic: '#FF69B4', flying: '#87CEEB',
    fighting: '#CD5C5C', normal: '#B0C4DE', ice: '#AFEEEE', ghost: '#7B68EE',
    steel: '#B0C4DE', dark: '#708090'
};

const generations = {
    'all': { start: 1, end: 1025 },
    '1': { start: 1, end: 151 },
    '2': { start: 152, end: 251 },
    '3': { start: 252, end: 386 },
    '4': { start: 387, end: 493 },
    '5': { start: 494, end: 649 },
    '6': { start: 650, end: 721 },
    '7': { start: 722, end: 809 },
    '8': { start: 810, end: 905 },
    '9': { start: 906, end: 1025 }
};
/* ==========================================
   NUEVO: LÓGICA DE FILTRO POR TIPO
   ========================================== */
typeFilter.addEventListener('change', async (e) => {
    const selectedType = e.target.value;

    
    generationFilter.value = 'all';
    searchInput.value = '';
    currentGen = 'all'; 

    
    pokedexGrid.innerHTML = '';
    notFoundMessage.style.display = 'none';
    paginationContainer.style.display = 'none'; 
    
    
    if (selectedType === 'all') {
        offset = 0;
        fetchPokemons();
        return;
    }

    
    showLoader();
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${selectedType}`);
        const data = await res.json();
        
        for (const item of data.pokemon) {
            const pokeName = item.pokemon.name;
            await getPokemon(pokeName);
        }

    } catch (error) {
        console.error(error);
        notFoundMessage.style.display = 'block';
        notFoundMessage.innerText = "Error al cargar el tipo.";
    } finally {
        hideLoader();
    }
});

generationFilter.addEventListener('change', () => {
    typeFilter.value = 'all'; 
});
/* ==========================================
   FUNCIONES DE UTILIDAD (LOADER)
   ========================================== */
const showLoader = () => {
    if(loader) loader.style.display = 'flex';
};

const hideLoader = () => {
    if(loader) loader.style.display = 'none';
};

/* ==========================================
   LÓGICA PRINCIPAL (FETCH)
   ========================================== */
const fetchPokemons = async () => {
    pokedexGrid.innerHTML = '';
    notFoundMessage.style.display = 'none';
    showLoader();

    try {
        if (currentGen === 'all') {
            paginationContainer.style.display = 'flex'; 
            const nextLimit = offset + limit;
            
            for (let i = offset + 1; i <= nextLimit; i++) {
                if (i > 1025) break;
                await getPokemon(i);
            }
            updatePaginationInfo();
        } 
        else {
            paginationContainer.style.display = 'none';
            const { start, end } = generations[currentGen];
            
            for (let i = start; i <= end; i++) {
                await getPokemon(i);
            }
        }
    } catch (error) {
        console.error("Error cargando pokemons:", error);
    } finally {
        hideLoader(); 
    }
};

const getPokemon = async (identifier) => {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier}`);
        if (!res.ok) throw new Error('No encontrado');
        const pokemon = await res.json();
        createPokemonCard(pokemon);
    } catch (error) {

    }
};

const createPokemonCard = (pokemon) => {
    const card = document.createElement('div');
    card.classList.add('card');

    const name = pokemon.name;
    const id = pokemon.id.toString().padStart(3, '0');
    const type = pokemon.types[0].type.name;
    const color = typeColors[type] || '#555';
    const image = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;

    card.innerHTML = `
        <div class="card-circle" style="background: ${color}20;">
            <img class="card-img" src="${image}" alt="${name}">
        </div>
        <span class="card-id">#${id}</span>
        <h3 class="card-name">${name}</h3>
        <span class="card-type" style="background-color: ${color};">${type}</span>
    `;

    card.addEventListener('click', () => openDetailsModal(pokemon));
    pokedexGrid.appendChild(card);
};

/* ==========================================
   PAGINACIÓN
   ========================================== */
const updatePaginationInfo = () => {
    const currentPage = Math.floor(offset / limit) + 1;
    if(pageInfo) pageInfo.innerText = `Página ${currentPage}`;

    if(btnPrev) {
        btnPrev.disabled = (offset === 0);
        btnPrev.style.opacity = (offset === 0) ? 0.5 : 1;
    }
};

if(btnNext) {
    btnNext.addEventListener('click', () => {
        offset += limit;
        fetchPokemons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if(btnPrev) {
    btnPrev.addEventListener('click', () => {
        if (offset >= limit) {
            offset -= limit;
            fetchPokemons();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

/* ==========================================
   FILTROS Y BÚSQUEDA
   ========================================== */
generationFilter.addEventListener('change', (e) => {
    currentGen = e.target.value;
    offset = 0; 
    searchInput.value = '';
    fetchPokemons();
});

searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        searchInput.blur(); 
        const term = searchInput.value.toLowerCase().trim();
        
        pokedexGrid.innerHTML = '';
        notFoundMessage.style.display = 'none';

        if (term) {
            paginationContainer.style.display = 'none';
            showLoader();
            try {
                
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${term}`);
                if(!res.ok) throw new Error('No existe');
                const pokemon = await res.json();
                createPokemonCard(pokemon);
            } catch (err) {
                notFoundMessage.style.display = 'block';
            } finally {
                hideLoader();
            }
        } else {
            
            fetchPokemons();
        }
    }
});

/* ==========================================
   MODALES (DETALLES Y JUEGO)
   ========================================== */
const openDetailsModal = async (pokemon) => {
    
    document.querySelector('.modal-id').innerText = `#${pokemon.id.toString().padStart(3, '0')}`;
    document.querySelector('.modal-name').innerText = pokemon.name;
    document.getElementById('modal-img').src = pokemon.sprites.other['official-artwork'].front_default;
    document.getElementById('modal-height').innerText = pokemon.height / 10;
    document.getElementById('modal-weight').innerText = pokemon.weight / 10;

    
    const typesContainer = document.querySelector('.modal-types');
    typesContainer.innerHTML = '';
    pokemon.types.forEach(t => {
        const color = typeColors[t.type.name];
        typesContainer.innerHTML += `<span class="type-badge" style="background-color: ${color};">${t.type.name}</span>`;
    });

    const statsContainer = document.getElementById('modal-stats');
    statsContainer.innerHTML = '';
    pokemon.stats.forEach(s => {
        const statName = s.stat.name.replace('special-', 'sp. ');
        const val = s.base_stat;
        const width = Math.min((val / 255) * 100, 100);
        const color = typeColors[pokemon.types[0].type.name];
        
        statsContainer.innerHTML += `
            <div class="stat-row">
                <span class="stat-name">${statName}</span>
                <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${width}%; background:${color}"></div></div>
                <span class="stat-num">${val}</span>
            </div>`;
    });

    
    const weaknessContainer = document.getElementById('modal-weaknesses');
    weaknessContainer.innerHTML = 'Calculando...';
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 50);
    
    
    try {
        let doubleDamage = new Set();
        const promises = pokemon.types.map(t => fetch(t.type.url).then(r => r.json()));
        const results = await Promise.all(promises);
        results.forEach(d => d.damage_relations.double_damage_from.forEach(w => doubleDamage.add(w.name)));
        
        weaknessContainer.innerHTML = '';
        if(doubleDamage.size === 0) weaknessContainer.innerHTML = '<span>N/A</span>';
        doubleDamage.forEach(t => {
            const c = typeColors[t] || '#777';
            weaknessContainer.innerHTML += `<span class="type-badge" style="background-color: ${c};">${t}</span>`;
        });
    } catch(e) { weaknessContainer.innerHTML = 'Error'; }
};

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
});

// --- JUEGO DE BATALLA ---
const resetGameBoard = () => {
    const defaultImg = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
    document.getElementById('player-img').src = defaultImg;
    document.getElementById('cpu-img').src = defaultImg;
    document.querySelector('#player-card .fighter-name').innerText = "Tú";
    document.querySelector('#cpu-card .fighter-name').innerText = "Rival";
    document.getElementById('player-stat-val').innerText = "???";
    document.getElementById('cpu-stat-val').innerText = "???";
    battleLog.innerText = "Presiona para iniciar";
    startBattleBtn.disabled = false;
    startBattleBtn.innerText = "¡LUCHAR!";
    playerCard.classList.remove('winner', 'loser');
    cpuCard.classList.remove('winner', 'loser');
};

const openGame = () => {
    resetGameBoard();
    gameModal.style.display = 'flex';
    setTimeout(() => gameModal.classList.add('active'), 50);
};

if(playBtn) playBtn.addEventListener('click', openGame);
if(btnPlayNav) btnPlayNav.addEventListener('click', openGame);

closeGameBtn.addEventListener('click', () => {
    gameModal.classList.remove('active');
    setTimeout(() => gameModal.style.display = 'none', 300);
});

startBattleBtn.addEventListener('click', async () => {
    startBattleBtn.disabled = true;
    startBattleBtn.innerText = "Buscando...";
    battleLog.innerText = "Conectando...";
    
    
    playerCard.classList.remove('winner', 'loser');
    cpuCard.classList.remove('winner', 'loser');

    const id1 = Math.floor(Math.random() * 649) + 1;
    const id2 = Math.floor(Math.random() * 649) + 1;

    try {
        const [p1, p2] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${id1}`).then(r=>r.json()),
            fetch(`https://pokeapi.co/api/v2/pokemon/${id2}`).then(r=>r.json())
        ]);

       
        const setImg = (pk, side) => {
            const img = document.getElementById(`${side}-img`);
            const name = document.querySelector(`#${side}-card .fighter-name`);
            const gif = pk.sprites.versions['generation-v']['black-white'].animated.front_default;
            img.src = gif || pk.sprites.front_default;
            name.innerText = pk.name;
        };
        setImg(p1, 'player');
        setImg(p2, 'cpu');

        battleLog.innerText = "¡Listos!";
        
        
        setTimeout(() => {
            const stats = [{i:0,n:'HP'},{i:1,n:'Ataque'},{i:2,n:'Defensa'},{i:5,n:'Velocidad'}];
            const chosen = stats[Math.floor(Math.random()*stats.length)];
            const v1 = p1.stats[chosen.i].base_stat;
            const v2 = p2.stats[chosen.i].base_stat;

            document.getElementById('player-stat-val').innerText = v1;
            document.getElementById('cpu-stat-val').innerText = v2;
            battleLog.innerHTML = `Comparando: <strong>${chosen.n}</strong>`;

            setTimeout(() => {
                if(v1 > v2) {
                    playerCard.classList.add('winner'); cpuCard.classList.add('loser');
                    battleLog.innerHTML += `<br><span style="color:#2ecc71">¡GANASTE!</span>`;
                } else if (v2 > v1) {
                    cpuCard.classList.add('winner'); playerCard.classList.add('loser');
                    battleLog.innerHTML += `<br><span style="color:#FF5252">RIVAL GANA</span>`;
                } else {
                    battleLog.innerHTML += `<br>¡EMPATE!`;
                }
                startBattleBtn.disabled = false;
                startBattleBtn.innerText = "¡Otra vez!";
            }, 600);
        }, 800);

    } catch(e) {
        battleLog.innerText = "Error conexión";
        startBattleBtn.disabled = false;
    }
});

/* ==========================================
   SCROLL TO TOP
   ========================================== */
if(btnScrollTop) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) btnScrollTop.classList.add('visible');
        else btnScrollTop.classList.remove('visible');
    });

    btnScrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


fetchPokemons();