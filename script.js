/* ==========================================
   VARIABLES GLOBALES Y REFERENCIAS AL DOM
   ========================================== */
const pokedexGrid = document.getElementById('pokedex-grid');
const searchInput = document.getElementById('search');
const loadMoreBtn = document.getElementById('load-more');
const notFoundMessage = document.getElementById('not-found-message');
const generationFilter = document.getElementById('generation-filter');


const modal = document.getElementById('pokemon-modal');
const closeBtn = document.querySelector('.close-btn');


const playBtn = document.getElementById('play-btn');
const gameModal = document.getElementById('game-modal');
const closeGameBtn = document.querySelector('.close-game');
const startBattleBtn = document.getElementById('start-battle-btn');
const battleLog = document.getElementById('battle-log');
const playerCard = document.getElementById('player-card');
const cpuCard = document.getElementById('cpu-card');


const limit = 50;
let currentOffset = 1;
let currentGen = 'all';
let isSearchActive = false;

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
   LÓGICA DE CARGA DE POKEMON (GRID)
   ========================================== */
const fetchPokemons = async () => {
    const genConfig = generations[currentGen];
    const nextLimit = currentOffset + limit;

    for (let i = currentOffset; i < nextLimit; i++) {
        if (i > genConfig.end) {
            loadMoreBtn.style.display = 'none';
            break;
        }
        await getPokemon(i);
    }

    currentOffset = nextLimit;
    if (currentOffset > genConfig.end) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
};

const getPokemon = async (identifier) => {
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier}`);
        if (!res.ok) throw new Error('No encontrado');
        const pokemon = await res.json();
        createPokemonCard(pokemon);
    } catch (error) {
        if (isSearchActive) notFoundMessage.style.display = 'block';
    }
};

const createPokemonCard = (pokemon) => {
    const card = document.createElement('div');
    card.classList.add('card');

    const name = pokemon.name;
    const id = pokemon.id.toString().padStart(3, '0');
    const type = pokemon.types[0].type.name;
    const color = typeColors[type] || '#F5F5F5';
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
   EVENTOS DE INTERFAZ (Buscador, Filtros)
   ========================================== */
loadMoreBtn.addEventListener('click', fetchPokemons);

generationFilter.addEventListener('change', (e) => {
    currentGen = e.target.value;
    currentOffset = generations[currentGen].start;
    isSearchActive = false;
    
    pokedexGrid.innerHTML = '';
    searchInput.value = '';
    notFoundMessage.style.display = 'none';
    loadMoreBtn.style.display = 'block';

    fetchPokemons();
});

searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const term = searchInput.value.toLowerCase().trim();
        pokedexGrid.innerHTML = '';
        notFoundMessage.style.display = 'none';

        if (term) {
            isSearchActive = true;
            loadMoreBtn.style.display = 'none';
            await getPokemon(term);
        } else {
            isSearchActive = false;
            const genConfig = generations[currentGen];
            currentOffset = genConfig.start;
            loadMoreBtn.style.display = 'block';
            fetchPokemons();
        }
    }
});

/* ==========================================
   LÓGICA DEL MODAL DE DETALLES
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
    
    await fetchWeaknesses(pokemon.types, weaknessContainer);
};

const fetchWeaknesses = async (types, container) => {
    try {
        let doubleDamage = new Set();
        const promises = types.map(t => fetch(t.type.url).then(res => res.json()));
        const results = await Promise.all(promises);
        
        results.forEach(data => {
            data.damage_relations.double_damage_from.forEach(d => doubleDamage.add(d.name));
        });

        container.innerHTML = '';
        if (doubleDamage.size === 0) container.innerHTML = '<span>N/A</span>';
        doubleDamage.forEach(type => {
            const color = typeColors[type] || '#777';
            container.innerHTML += `<span class="type-badge" style="background-color: ${color};">${type}</span>`;
        });
    } catch (e) { container.innerHTML = 'Error'; }
};

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
});
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
    /* ==========================================
    LÓGICA DEL JUEGO DE BATALLA
    ========================================== */
playBtn.addEventListener('click', () => {
    resetGameBoard();
    gameModal.style.display = 'flex';
    setTimeout(() => gameModal.classList.add('active'), 50);
});

closeGameBtn.addEventListener('click', () => {
    gameModal.classList.remove('active');
    setTimeout(() => gameModal.style.display = 'none', 300);
});

startBattleBtn.addEventListener('click', async () => {
    startBattleBtn.disabled = true;
    startBattleBtn.innerText = "Buscando rivales...";
    battleLog.innerHTML = "Conectando con la Arena...";
    
    playerCard.classList.remove('winner', 'loser');
    cpuCard.classList.remove('winner', 'loser');
    document.getElementById('player-stat-val').innerText = "???";
    document.getElementById('cpu-stat-val').innerText = "???";

    const id1 = Math.floor(Math.random() * 649) + 1;
    const id2 = Math.floor(Math.random() * 649) + 1;

    try {
        const [p1, p2] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${id1}`).then(r=>r.json()),
            fetch(`https://pokeapi.co/api/v2/pokemon/${id2}`).then(r=>r.json())
        ]);

        renderFighter(p1, 'player');
        renderFighter(p2, 'cpu');

        battleLog.innerText = "¡Luchadores listos!";
        setTimeout(() => resolveBattle(p1, p2), 1000);

    } catch (e) {
        battleLog.innerText = "Error de conexión.";
        startBattleBtn.disabled = false;
    }
});

const renderFighter = (pk, side) => {
    const img = document.getElementById(`${side}-img`);
    const name = document.querySelector(`#${side}-card .fighter-name`);
    //GIF animado > Static
    const gif = pk.sprites.versions['generation-v']['black-white'].animated.front_default;
    img.src = gif || pk.sprites.front_default;
    name.innerText = pk.name;
};

const resolveBattle = (p1, p2) => {
    const stats = [
        { idx: 0, name: 'HP' }, { idx: 1, name: 'Ataque' },
        { idx: 2, name: 'Defensa' }, { idx: 5, name: 'Velocidad' }
    ];
    const chosen = stats[Math.floor(Math.random() * stats.length)];
    
    const v1 = p1.stats[chosen.idx].base_stat;
    const v2 = p2.stats[chosen.idx].base_stat;

    document.getElementById('player-stat-val').innerText = v1;
    document.getElementById('cpu-stat-val').innerText = v2;
    battleLog.innerHTML = `Comparando: <strong>${chosen.name}</strong>`;

    setTimeout(() => {
        if (v1 > v2) {
            playerCard.classList.add('winner');
            cpuCard.classList.add('loser');
            battleLog.innerHTML += `<br><span style="color:#2ecc71; font-size:1.2rem">¡GANASTE!</span>`;
        } else if (v2 > v1) {
            cpuCard.classList.add('winner');
            playerCard.classList.add('loser');
            battleLog.innerHTML += `<br><span style="color:#FF5252; font-size:1.2rem">RIVAL GANA</span>`;
        } else {
            battleLog.innerHTML += `<br>¡EMPATE!`;
        }
        startBattleBtn.disabled = false;
        startBattleBtn.innerText = "¡Pelear de nuevo!";
    }, 500);
};
    /* ==========================================
    LÓGICA DEL NAVBAR (HEADER)
    ========================================== */

const btnHome = document.getElementById('btn-home');
const btnPlayNav = document.getElementById('btn-play-nav');


btnHome.addEventListener('click', () => {
    window.location.reload();
});


btnPlayNav.addEventListener('click', () => {
    resetGameBoard();
    gameModal.style.display = 'flex';
    setTimeout(() => gameModal.classList.add('active'), 50);
});

fetchPokemons();