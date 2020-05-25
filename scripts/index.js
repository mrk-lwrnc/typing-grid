function main() {
    const SCORE_VALUE_SELECTOR = document.querySelector('.score-value');
    const MISSED_VALUE_SELECTOR = document.querySelector('.missed-value');
    const INPUT_SELECTOR = document.querySelector('.input');
    const TILE_SELECTORS = document.querySelectorAll('.tile');
    const INNER_TILE_SELECTOR = document.querySelector('.inner-tile');

    let game_over_handler = new GameOverHandler({
        'parent_container': document.body,
        'tile_selectors': TILE_SELECTORS,
        'input_selector': INPUT_SELECTOR,
        'text_display_container': INNER_TILE_SELECTOR
    });

    let word_display_handler = new WordDisplayHandler({
        'tile_selectors': TILE_SELECTORS,
        'score_value_selector': SCORE_VALUE_SELECTOR,
        'missed_value_selector': MISSED_VALUE_SELECTOR
    });

    startWordDisplayIntervals({
        'word_display_handler': word_display_handler,
        'game_over_handler': game_over_handler
    });
    addKeyDownListener({
        'input_selector': INPUT_SELECTOR,
        'word_display_handler': word_display_handler
    });
}

function startWordDisplayIntervals({word_display_handler, game_over_handler}) {
    let word_display_gap = 4000;
    let word_display_interval = createWordDisplayInterval({
        'word_display_handler': word_display_handler,
        'game_over_handler': game_over_handler,
        'interval': word_display_gap
    });

    const DECREASE_WORD_DISPLAY_GAP_INTERVAL_DURATION = 30000;
    let decrease_word_display_gap_interval = setInterval(() => {
        const IS_GAME_OVER = word_display_handler.isGameOver();
        const WORD_DISPLAY_GAP_LIMIT = 1000;
        const GAP_DECREASE = 500;

        if(word_display_gap <= WORD_DISPLAY_GAP_LIMIT || IS_GAME_OVER) {
            clearInterval(decrease_word_display_gap_interval);

        } else {
            clearInterval(word_display_interval);

            word_display_gap -= GAP_DECREASE;
            word_display_interval = createWordDisplayInterval({
                'word_display_handler': word_display_handler,
                'game_over_handler': game_over_handler,
                'interval': word_display_gap
            });
        }
    }, DECREASE_WORD_DISPLAY_GAP_INTERVAL_DURATION);
}

function createWordDisplayInterval({word_display_handler, game_over_handler, interval}) {
    const FADE_INTERVAL_DURATION = 10000;
    const WORD_DISPLAY_INTERVAL = setInterval(() => {
        if(word_display_handler.isGameOver()) {
            game_over_handler.execute();
            clearInterval(WORD_DISPLAY_INTERVAL);
        } else {
            word_display_handler.tryStartingWordDisplay({
                'fade_interval': FADE_INTERVAL_DURATION
            });
        }
    }, interval);

    return WORD_DISPLAY_INTERVAL;
}

function addKeyDownListener({input_selector, word_display_handler}) {
    const KEYDOWN_EVENT = 'keydown';

    input_selector.addEventListener(KEYDOWN_EVENT, (event) => {
        const HAS_ENTERED = (event.key === 'Enter');
        if(!HAS_ENTERED) { return; }

        const TYPED_WORD = event.target.value;
        word_display_handler.checkDisplayedWordsForMatch({
            'typed_word': TYPED_WORD
        });

        event.target.value = '';
    });
}


class GameOverHandler {
    constructor({parent_container, tile_selectors, input_selector, text_display_container}) {
        this._parent_container = parent_container;
        this._tile_selectors = tile_selectors;
        this._text_display_container = text_display_container;
        this._input_selector = input_selector;
    }

    execute() {
        const TIMEOUT_DURATION = 1000;

        this._updateStyles();
        this._clearInput();
        this._disableInput();
        setTimeout(() => {
            this._clearTiles();
            this._addDisplayText();
        }, TIMEOUT_DURATION);
    }

    _updateStyles() {
        const STYLES = this._getStyles();

        this._parent_container.classList.add(STYLES);
    }

    _clearTiles() {
        const TILES = this._tile_selectors;

        TILES.forEach(tile => {
            tile.innerHTML = '';
        });
    }

    _clearInput() {
        this._input_selector.value = '';
    }

    _disableInput() {
        this._input_selector.disabled = true;
    }

    _addDisplayText() {
        const TEXT_CONTAINER = this._text_display_container;
        const DISPLAY_TEXT = 'GAME OVER!';

        TEXT_CONTAINER.innerHTML = DISPLAY_TEXT;
        this._fadeInDisplayText();
    }

    _fadeInDisplayText() {
        const TEXT_CONTAINER = this._text_display_container;
        const FADE_IN_ANIMATION = 'fade-in';
        const TIMEOUT_DURATION = 1000;

        TEXT_CONTAINER.classList.add(FADE_IN_ANIMATION);
        setTimeout(() => {
            TEXT_CONTAINER.classList.remove(FADE_IN_ANIMATION);
        }, TIMEOUT_DURATION);
    }

    _getStyles() {
        return 'game-over';
    }
}

class WordDisplayHandler {
    constructor({tile_selectors, score_value_selector, missed_value_selector}) {
        this._tile_selectors = tile_selectors;
        this._score_value_selector = score_value_selector;
        this._missed_value_selector = missed_value_selector;

        this._available_tile_indexes = this._getTileIndexes();
        this._available_words = this._getWords();
        this._displayed_words = [];
        this._missed_words = 0;
        this._typed_words = 0;
    }

    tryStartingWordDisplay({fade_interval}) {
        if(this.isGameOver()) { return; }
        if(!this._hasAvailableTileIndexes()) { return; }
        if(!this._hasAvailableWords()) {
            this._available_words = this._getWords();
        }

        let word_display = this._addWordDisplay();
        let timeout = this._removeWordDisplayAfterInterval({
            'word_display': word_display,
            'interval': fade_interval
        });

        word_display['display_timeout'] = timeout;
    }

    checkDisplayedWordsForMatch({typed_word}) {
        let matched_word_displays = this._getMatchedWordDisplays({
            'word': typed_word
        });

        const HAS_MATCHED_WORD_DISPLAYS = matched_word_displays.length > 0;
        if(!HAS_MATCHED_WORD_DISPLAYS) {
            return;
        }

        const SINGLE_MATCHED_WORD_DISPLAY = matched_word_displays[0]
        this._removeTypedWordDisplay({
            'word_display': SINGLE_MATCHED_WORD_DISPLAY
        });
    }

    isGameOver() {
        const MAXED_MISSED_WORDS = 10;

        return this._missed_words >= MAXED_MISSED_WORDS;
    }

    getMissedWords() {
        return this._missed_words;
    }

    getTypedWords() {
        return this._typed_words;
    }

    _removeWordDisplayAfterInterval({word_display, interval}) {
        const ANIMATIONS = this._getAnimations();
        const REMOVE_DISPLAY_ANIMATION = ANIMATIONS.remove_display;

        return setTimeout(() => {
            this._removeWordDisplay({
                'word_display': word_display,
                'animation': REMOVE_DISPLAY_ANIMATION
            });
            this._increaseMissedWords();
            this._updateMissedValueToSelector();
        }, interval);
    }

    _removeTypedWordDisplay({word_display}) {
        const ANIMATIONS = this._getAnimations();
        const VICTORY_DISPLAY_ANIMATION = ANIMATIONS.victory_display;
        const DISPLAY_TIMEOUT = word_display.display_timeout;
        const SCORE = this._getScore({'tile_index': word_display.tile_index});

        clearTimeout(DISPLAY_TIMEOUT);
        this._removeWordDisplay({
            'word_display': word_display,
            'animation': VICTORY_DISPLAY_ANIMATION
        });
        this._increaseTypedWords({'score_value': SCORE});
        this._updateScoreValueToSelector();
    }

    _addWordDisplay() {
        const ANIMATIONS = this._getAnimations();
        const ADD_DISPLAY_ANIMATION = ANIMATIONS.add_display;
        let generated_word_display = this._generateWordDisplay();

        const TILE_SELECTOR = generated_word_display.tile_selector;
        const WORD = generated_word_display.word;

        this._animate({
            'tile_selector': TILE_SELECTOR,
            'animation': ADD_DISPLAY_ANIMATION
        });
        this._addWordToTile({
            'tile_selector': TILE_SELECTOR,
            'word': WORD
        });
        this._trackWordDisplay({
            'word_display': generated_word_display
        });

        return generated_word_display;
    }

    _removeWordDisplay({word_display, animation}) {
        const TILE_SELECTOR = word_display.tile_selector;
        const TILE_INDEX = word_display.tile_index;
        const ANIMATION_TIMEOUT_CALLBACK = () => {
            this._removeWordToTile({'tile_selector': TILE_SELECTOR});
            this._recycleTileIndex({'tile_index': TILE_INDEX});
            this._untrackWordDisplay({
                'word_display': word_display
            });
        };

        this._animate({
            'tile_selector': TILE_SELECTOR,
            'animation': animation,
            'timeout_callback': ANIMATION_TIMEOUT_CALLBACK
        });
    }

    _updateScoreValueToSelector() {
        this._score_value_selector.innerHTML = this._typed_words;
    }

    _updateMissedValueToSelector() {
        this._missed_value_selector.innerHTML = this._missed_words;

        if(this.isGameOver()) {
            this._clearAllWordDisplayTimeouts();
        }
    }

    _generateWordDisplay() {
        const TILE_INDEX = this._popRandomValue({container: this._available_tile_indexes});
        const WORD = this._popRandomValue({container: this._available_words});
        const TILE_SELECTOR = this._tile_selectors[TILE_INDEX];

        return {
            'tile_selector': TILE_SELECTOR,
            'tile_index': TILE_INDEX,
            'word': WORD
        };
    }

    _animate({tile_selector, animation, timeout_callback}) {
        const HAS_TIMEOUT_CALLBACK = (timeout_callback !== undefined);
        const TIMEOUT_INTERVAL = 1000;

        tile_selector.classList.add(animation);
        setTimeout(() => {
            tile_selector.classList.remove(animation);

            if(HAS_TIMEOUT_CALLBACK) {
                timeout_callback();
            }
        }, TIMEOUT_INTERVAL);
    }

    _addWordToTile({tile_selector, word}) {
        tile_selector.innerHTML = word;
    }

    _removeWordToTile({tile_selector}) {
        tile_selector.innerHTML = '';
    }

    _recycleTileIndex({tile_index}) {
        this._available_tile_indexes.push(tile_index);
    }

    _popRandomValue({container}) {
        const RANDOM_INDEX = this._generateRandomIndex({'array': container});
        const POP_COUNT = 1;
        const SPLICED_VALUES = container.splice(RANDOM_INDEX, POP_COUNT);
        const POPPED_RANDOM_VALUE = SPLICED_VALUES[0];

        return POPPED_RANDOM_VALUE;
    }

    _generateRandomIndex({array}) {
        return Math.floor(Math.random() * array.length);
    }

    _trackWordDisplay({word_display}) {
        this._displayed_words.push(word_display);
    }

    _untrackWordDisplay({word_display}) {
        const WORD_DISPLAY_INDEX = this._getWordDisplayIndex({
            'word': word_display.word,
            'tile_index': word_display.tile_index
        });
        const NO_WORD_DISPLAY_INDEX = (WORD_DISPLAY_INDEX === undefined);
        const UNTRACK_COUNT = 1;

        if(NO_WORD_DISPLAY_INDEX) {
            return;
        }

        this._displayed_words.splice(WORD_DISPLAY_INDEX, UNTRACK_COUNT);
    }

    _clearAllWordDisplayTimeouts() {
        this._displayed_words.forEach(word_display => {
            clearTimeout(word_display.display_timeout);
        });
    }

    _getWordDisplayIndex({word, tile_index}) {
        let word_display_index;

        this._displayed_words.filter((word_display, index) => {
            const MATCHED_WORD = (word_display.word === word);
            const MATCHED_TILE_INDEX = (word_display.tile_index === tile_index);

            if(MATCHED_WORD && MATCHED_TILE_INDEX) {
                word_display_index = index;
            }
        });

        return word_display_index;
    }

    _getMatchedWordDisplays({word}) {
        return this._displayed_words.filter(word_display => word_display.word === word);
    }

    _getScore({tile_index}) {
        const TILE = this._tile_selectors[tile_index];
        const SCORES = {
            'outer-tile': 1,
            'middle-tile': 3,
            'inner-tile': 5
        };
        let score = 0;

        for (const SCORE_KEY in SCORES) {
            if (!SCORES.hasOwnProperty(SCORE_KEY)) { continue; }
            if(!TILE.classList.contains(SCORE_KEY)) { continue; }
            score += SCORES[SCORE_KEY];
        }

        return score;
    }

    _increaseMissedWords() {
        this._missed_words += 1;
    }

    _increaseTypedWords({'score_value': SCORE}) {
        this._typed_words += SCORE;
    }

    _hasAvailableTileIndexes() {
        const IS_AVAILABLE_TILE_INDEXES_EMPTY = this._isContainerEmpty({
            'container': this._available_tile_indexes
        });

        return !IS_AVAILABLE_TILE_INDEXES_EMPTY;
    }

    _hasAvailableWords() {
        const IS_AVAILABLE_WORDS_EMPTY = this._isContainerEmpty({
            'container': this._available_words
        });

        return !IS_AVAILABLE_WORDS_EMPTY;
    }

    _isContainerEmpty({container}) {
        const SIZE_OF_CONTAINER = container.length;
        const EMPTY_SIZE = 0;

        return SIZE_OF_CONTAINER === EMPTY_SIZE;
    }

    _getAnimations() {
        return {
            'add_display': 'fade-in',
            'remove_display': 'fade-out',
            'victory_display': 'success-out'
        };
    }

    _getTileIndexes() {
        const SIZE_OF_TILE_SELECTORS = this._tile_selectors.length;

        return [...Array(SIZE_OF_TILE_SELECTORS).keys()];
    }

    _getWords() {
        return [
            'argument',
            'alcohol',
            'actor',
            'affair',
            'attention',
            'appointment',
            'artisan',
            'atmosphere',
            'analyst',
            'assignment',
            'agreement',
            'army',
            'accident',
            'advice',
            'ambition',
            'analysis',
            'assistant',
            'administration',
            'advertising',
            'addition',
            'art',
            'application',
            'ad',
            'apple',
            'area',
            'agency',
            'assumption',
            'ability',
            'attitude',
            'anxiety',
            'assistance',
            'apartment',
            'aspect',
            'appearance',
            'association',
            'article',
            'arrival',
            'activity',
            'airport',
            'audience',
            'awareness',
            'build',
            'bound',
            'back',
            'born',
            'bounce',
            'book',
            'be',
            'belong',
            'beg',
            'become',
            'beat',
            'bid',
            'bow',
            'balance',
            'bury',
            'bend',
            'burst',
            'boast',
            'boost',
            'bite',
            'block',
            'bear',
            'brush',
            'bind',
            'breathe',
            'boil',
            'bring',
            'bang',
            'buy',
            'benefit',
            'bother',
            'believe',
            'begin',
            'blow',
            'breed',
            'break',
            'bet',
            'base',
            'ban',
            'borrow',
            'behave',
            'burn',
            'blame',
            'conscious',
            'coordinated',
            'courageous',
            'craven',
            'cool',
            'careless',
            'colossal',
            'cheerful',
            'calm',
            'caring',
            'clear',
            'clumsy',
            'cold',
            'common',
            'cultural',
            'comfortable',
            'capricious',
            'chief',
            'comprehensive',
            'chubby',
            'crooked',
            'capable',
            'crowded',
            'cruel',
            'curly',
            'closed',
            'chivalrous',
            'coherent',
            'critical',
            'changeable',
            'cloudy',
            'creepy',
            'complex',
            'chemical',
            'clammy',
            'cagey',
            'cute',
            'calculating',
            'consistent',
            'certain',
            'cooperative',
            'confused',
            'cuddly',
            'cloistered',
            'clever',
            'cultured',
            'curious',
            'chunky',
            'childlike',
            'chilly',
            'dozen',
            'drama',
            'desire',
            'directory',
            'disagree',
            'drag',
            'disestablishmentarianism',
            'disclose',
            'discriminate',
            'debut',
            'divide',
            'delay',
            'danger',
            'deteriorate',
            'distinct',
            'differ',
            'drift',
            'dip',
            'diplomatic',
            'dealer',
            'decorative',
            'drop',
            'dorm',
            'deport',
            'date',
            'division',
            'dump',
            'day',
            'dilute',
            'deprivation',
            'decoration',
            'dead',
            'democratic',
            'discreet',
            'disco',
            'default',
            'denial',
            'diplomat',
            'deliver',
            'detail',
            'dramatic',
            'delivery',
            'deadly',
            'dough',
            'drum',
            'drown',
            'decrease',
            'drain',
            'discovery',
            'drug',
            'dialogue',
            'enlarge',
            'effective',
            'embox',
            'exploit',
            'evaluate',
            'energy',
            'emotion',
            'earwax',
            'elaborate',
            'expansion',
            'entertain',
            'excavate',
            'elegant',
            'exclude',
            'extension',
            'eyebrow',
            'executrix',
            'executive',
            'extreme',
            'evoke',
            'eliminate',
            'explicit',
            'equip',
            'experienced',
            'effect',
            'exchange',
            'engine',
            'eject',
            'elbow',
            'excitement',
            'estate',
            'expectation',
            'expand',
            'ear',
            'error',
            'exact',
            'eaux',
            'engagement',
            'environment',
            'economics',
            'evening',
            'exception',
            'explosion',
            'episode',
            'ego',
            'employee',
            'eternal',
            'environmental',
            'explode',
            'earthquake',
            'favorable',
            'finish',
            'firm',
            'fate',
            'flourish',
            'feature',
            'frank',
            'functional',
            'fashionable',
            'flag',
            'farewell',
            'fastidious',
            'flow',
            'flatware',
            'fiction',
            'familiar',
            'feminist',
            'false',
            'flour',
            'formulate',
            'finance',
            'fuel',
            'feign',
            'flock',
            'facade',
            'final',
            'flush',
            'frog',
            'fork',
            'file',
            'flat',
            'funny',
            'family',
            'fight',
            'fall',
            'formation',
            'feast',
            'favor',
            'floor',
            'failure',
            'forget',
            'freighter',
            'fluctuation',
            'force',
            'fist',
            'folklore',
            'fortune',
            'falsify',
            'flu',
            'fairy',
            'general',
            'grandmother',
            'generation',
            'girlfriend',
            'glacier',
            'gradient',
            'greeting',
            'gregarious',
            'grateful',
            'glimpse',
            'grandfather',
            'graphic',
            'gesture',
            'genuine',
            'gravity',
            'genetic',
            'gallery',
            'guarantee',
            'garbage',
            'grounds',
            'governor',
            'guideline',
            'graduate',
            'glasses',
            'grimace',
            'ghostwriter',
            'guerrilla',
            'goalkeeper',
            'generate',
            'gradual',
            'government',
            'hostility',
            'helicopter',
            'hilarious',
            'hunting',
            'hostage',
            'humanity',
            'harmony',
            'habitat',
            'highlight',
            'hallway',
            'holiday',
            'haircut',
            'husband',
            'harmful',
            'highway',
            'healthy',
            'hypothesize',
            'hospitality',
            'helpless',
            'housewife',
            'horoscope',
            'housing',
            'harvest',
            'hospital',
            'history',
            'hierarchy',
            'hypnothize',
            'handicap',
            'hypothesis',
            'hostile',
            'hardship',
            'headline',
            'hardware',
            'houseplant',
            'horizon',
            'hesitate',
            'horseshoe',
            'hemisphere',
            'headquarters',
            'intervention',
            'inspiration',
            'intelligence',
            'increase',
            'investigation',
            'impound',
            'infection',
            'investment',
            'instrument',
            'incongruous',
            'interactive',
            'infinite',
            'integrated',
            'invisible',
            'incident',
            'inspire',
            'ideology',
            'indulge',
            'illness',
            'inflate',
            'isolation',
            'inflation',
            'illustrate',
            'identification',
            'inspector',
            'injection',
            'intention',
            'innovation',
            'information',
            'illusion',
            'initiative',
            'incapable',
            'introduce',
            'important',
            'implication',
            'insurance',
            'instruction',
            'interest',
            'impress',
            'indication',
            'initial',
            'intensify',
            'imperial',
            'introduction',
            'integration',
            'interface',
            'inhabitant',
            'invasion',
            'imagine',
            'influence',
            'judicial',
            'justify',
            'jurisdiction',
            'junior',
            'jealous',
            'joystick',
            'jungle',
            'jacket',
            'journal',
            'judgment',
            'justice',
            'jockey',
            'know',
            'knit',
            'kidnap',
            'king',
            'knee',
            'kick',
            'killer',
            'knife',
            'keep',
            'kneel',
            'key',
            'kidney',
            'kill',
            'kinship',
            'knowledge',
            'knot',
            'kid',
            'kitchen',
            'kit',
            'knock',
            'kettle',
            'limited',
            'looting',
            'lifestyle',
            'lighter',
            'licence',
            'linger',
            'legend',
            'lesson',
            'literacy',
            'loyalty',
            'litigation',
            'letter',
            'laborer',
            'listen',
            'legislature',
            'lawyer',
            'language',
            'ladder',
            'lineage',
            'liberty',
            'linear',
            'lonely',
            'leaflet',
            'locate',
            'lecture',
            'license',
            'layout',
            'lounge',
            'latest',
            'launch',
            'laundry',
            'liberal',
            'literature',
            'legislation',
            'liability',
            'leader',
            'landowner',
            'likely',
            'landscape',
            'leadership',
            'location',
            'laboratory',
            'length',
            'labour',
            'leftovers',
            'muscle',
            'mystery',
            'memorial',
            'method',
            'measure',
            'multimedia',
            'miracle',
            'monopoly',
            'mechanical',
            'moment',
            'material',
            'morning',
            'monkey',
            'mosquito',
            'manager',
            'migration',
            'mistreat',
            'medieval',
            'meaning',
            'majority',
            'manage',
            'motivation',
            'mutter',
            'modernize',
            'misplace',
            'management',
            'marathon',
            'marriage',
            'monster',
            'momentum',
            'mixture',
            'minimum',
            'mainstream',
            'matter',
            'memorandum',
            'murder',
            'museum',
            'midnight',
            'mechanism',
            'mutation',
            'message',
            'misery',
            'mosque',
            'minister',
            'miserable',
            'mother',
            'mention',
            'manufacture',
            'marine',
            'mature',
            'necklace',
            'nonsense',
            'national',
            'nomination',
            'neighbour',
            'negative',
            'nonremittal',
            'neighborhood',
            'nationalist',
            'notorious',
            'negotiation',
            'nominate',
            'notebook',
            'negligence',
            'nationalism',
            'nightmare',
            'offender',
            'ordinary',
            'overlook',
            'obstacle',
            'obligation',
            'opposition',
            'overcharge',
            'operation',
            'operational',
            'offspring',
            'organisation',
            'orthodox',
            'overwhelm',
            'orchestra',
            'overview',
            'ostracize',
            'official',
            'opposite',
            'objective',
            'occupation',
            'original',
            'orientation',
            'observation',
            'organize',
            'omission',
            'occasion',
            'observer',
            'offensive',
            'opponent',
            'participate',
            'photography',
            'position',
            'professional',
            'physical',
            'principle',
            'promotion',
            'perception',
            'producer',
            'performer',
            'progressive',
            'pleasure',
            'photograph',
            'pavement',
            'prejudice',
            'philosophy',
            'privilege',
            'production',
            'proclaim',
            'personality',
            'performance',
            'publisher',
            'plaintiff',
            'presidential',
            'possible',
            'provision',
            'pedestrian',
            'prestige',
            'particle',
            'paragraph',
            'publication',
            'progress',
            'prediction',
            'presentation',
            'prisoner',
            'provincial',
            'paralyzed',
            'perceive',
            'premature',
            'parallel',
            'pressure',
            'proportion',
            'practice',
            'perforate',
            'practical',
            'particular',
            'pleasant',
            'potential',
            'proposal',
            'parameter',
            'quarrel',
            'quote',
            'queue',
            'quotation',
            'quest',
            'question',
            'quality',
            'qualify',
            'qualification',
            'queen',
            'quiet',
            'quantity',
            'quarter',
            'quota',
            'quit',
            'quaint',
            'qualified',
            'restrain',
            'rehabilitation',
            'register',
            'recession',
            'resource',
            'refrigerator',
            'reasonable',
            'reflection',
            'reception',
            'relationship',
            'relative',
            'reservoir',
            'rotation',
            'romantic',
            'requirement',
            'retailer',
            'reproduce',
            'resident',
            'response',
            'reproduction',
            'reconcile',
            'recommendation',
            'repetition',
            'reference',
            'restaurant',
            'recommend',
            'resolution',
            'rhetoric',
            'regulation',
            'rational',
            'researcher',
            'reliable',
            'registration',
            'remember',
            'reckless',
            'represent',
            'representative',
            'railroad',
            'reinforce',
            'rehearsal',
            'relation',
            'research',
            'restless',
            'referral',
            'relaxation',
            'responsible',
            'reliance',
            'reluctance',
            'residence',
            'relevance',
            'syndrome',
            'sickness',
            'secretion',
            'sentence',
            'superintendent',
            'surprise',
            'salesperson',
            'separation',
            'slippery',
            'stubborn',
            'seasonal',
            'substitute',
            'systematic',
            'struggle',
            'situation',
            'sanctuary',
            'secretary',
            'selection',
            'software',
            'stimulation',
            'survivor',
            'stunning',
            'sculpture',
            'supplementary',
            'strength',
            'sentiment',
            'shoulder',
            'sacrifice',
            'suitcase',
            'satisfaction',
            'shareholder',
            'salvation',
            'simplicity',
            'strategic',
            'specimen',
            'skeleton',
            'solution',
            'suppress',
            'satellite',
            'statement',
            'standard',
            'sandwich',
            'speculate',
            'separate',
            'scenario',
            'socialist',
            'sympathetic',
            'suffering',
            'sensitivity',
            'spectrum',
            'transport',
            'tropical',
            'temperature',
            'telephone',
            'traction',
            'threshold',
            'talented',
            'temptation',
            'tournament',
            'transform',
            'technology',
            'transition',
            'twilight',
            'thoughtful',
            'timetable',
            'tolerate',
            'terminal',
            'television',
            'translate',
            'transmission',
            'talkative',
            'technique',
            'treasurer',
            'tolerant',
            'temporary',
            'tendency',
            'treatment',
            'threaten',
            'triangle',
            'teenager',
            'transfer',
            'theorist',
            'training',
            'therapist',
            'transaction',
            'transparent',
            'tradition',
            'unlawful',
            'undermine',
            'uncertainty',
            'understanding',
            'understand',
            'unfortunate',
            'unlikely',
            'undertake',
            'unanimous',
            'unpleasant',
            'underline',
            'umbrella',
            'vegetarian',
            'vigorous',
            'vertical',
            'vegetation',
            'violation',
            'variation',
            'volunteer',
            'vegetable',
            'variable',
            'withdrawal',
            'willpower',
            'wilderness',
            'wisecrack',
            'withdraw',
            'wardrobe',
            'waterfall',
            'weakness',
            'workshop',
            'xebec',
            'xenia',
            'xenic',
            'xenon',
            'xeric',
            'xerox',
            'xerus',
            'xylan',
            'xylophone',
            'year',
            'yard',
            'yearn',
            'young',
            'youth',
            'zone',
            'zero'
        ];
    }
}

main();