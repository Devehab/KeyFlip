// Small English word list used to settle "لا" = "b" or "gh" automatically.
// Only words containing "b" or "gh" matter, because every ambiguous reading
// differs exactly there.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KeyFlip = root.KeyFlip || {};
  root.KeyFlip.dictionary = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GH = `right night light might fight sight tight bright flight high thigh sigh nigh
    though through throughout thought although enough rough tough laugh laughter daughter
    eight eighteen eighty eighth weight height neighbor neighbour neighborhood neighbourhood
    straight caught taught bought brought fought ghost ghetto spaghetti cough dough doughnut
    knight slight weigh sleigh freight fright frighten delight lightning midnight tonight
    sunlight copyright fortnight thorough thoroughly borough plough drought naughty slaughter
    ought sought nought yoghurt afghan afghanistan dinghy bough trough mighty lightweight
    nightmare insight oversight spotlight daylight flashlight headlight highlight alright
    upright outright playwright overnight starlight moonlight highland highway highways
    plight blight tighten lighten brighten haughty distraught onslaught nightly ghastly
    gherkin ghoul sorghum edinburgh pittsburgh ghana ugh foghorn doghouse longhand longhorn
    stronghold breakthrough walkthrough throughput thoughtful thoughtless nightclub nightlife
    lighthouse rightful enlightenment ghostwriter dougherty vaughan hugh hughes wright
    lighter lighting fighting fighter sighting rightly tightly highly enlighten`;

  const B = `be by but been about because before both between back being best better big
    below become became begin began begun behind believe body book business buy build
    building built bad ball bank base based basic bear beat beautiful beauty bed beginning
    benefit beyond bill billion bit black blood blue board boat born boss bottom box boy brain
    break breakfast bridge brief bring broad broken brother brown budget bus busy button baby
    bag band bar battle beach bell bike bird birth birthday blind block blog bone bonus border
    bored boring borrow bottle bowl brand brave bread breath brick bride brilliant browser
    brush bug bulb bunch burn buyer bye able above abroad absolute absolutely abuse
    accessible album alphabet available baseball basketball behavior behaviour belong beside
    besides bet bible bin binary bio biology bitter blame blank bless blew blonde blond bloom
    blow bold bomb bond boot bound boundary bow brake branch broke bubble bucket burst bury
    butter cab cabin cabinet cable capable celebrate celebration climb club combine
    combination comfortable debate debt debug describe disable double doubt dub dumb elbow
    embarrass embarrassed enable establish exhibit exhibition fabric fabulous february
    feedback flexible football forbid forbidden gamble garbage global globe grab habit harbor
    harbour herb horrible hobby hub humble husband incredible inbox job keyboard knob lab
    label labor labour lamb liberal liberty library limb lobby lumber member membership
    mobile mob nobody noble notebook number object objective obvious obviously observe
    obtain orbit probably probable problem public publish publisher rabbit rib robe robot rob
    rubber rubbish ruby rugby sabotage scrub snob sob sober stable stubborn subject submit
    subscribe subscription substance substitute suburb subtle subway suitable symbol table
    tablet terrible thumb tribe tribute trouble tub tube umbrella unable unbelievable verb
    vibe vibrant web website webinar wobble zebra zombie abandon abbreviation ability abort
    absent absorb abstract absurd abundant acceptable adorable affordable ambassador ambition
    ambitious ambulance amber arab arabic arabia bacteria badge badly bake baker bakery
    balance balcony bald ballet balloon ban banana banner bare barely bargain bark barrel
    barrier basement basin basket bat batch bath bathroom battery bay beam bean beard beast
    bedroom bee beef beer beg beginner behave belief belly belt bench bend beneath beneficial
    berry betray beverage bias bicycle bid billboard bind biscuit bishop bite blade blanket
    blast bleed blend blessing blink bliss blossom blouse blunt blur blush boast boil bolt
    booking boom boost booth bother bounce boutique bowling boxing bracelet brass bravo breed
    breeze brew bribe bridal briefly brisk british brochure broker bronze brook broom
    brotherhood bruise brunch brutal buddy buffalo buffer buffet builder bulk bull bullet
    bulletin bully bump bumper bundle burden bureau burger burglar burial bush businessman
    butcher butterfly buzz cabbage carbon caribbean cherub cobweb crab crumb cube curb
    cupboard dashboard database debit dumbbell disturb drab drawback dribble ebb ebook
    edible elaborate eligible fiber fibre flab fumble gabble garb gerbil gibberish goblin
    gobble grumble gullible habitat hamburger hobbit hubby imbalance improbable inevitable
    invisible irresistible jumbo jumble kebab kibbutz lambda liable limbo lobster lullaby
    marble mumble neighborly nimble nobel numb oblige obscure obsess obsessed obstacle
    plumber possible possibly probability problematic proverb publication publicly rebel
    rebuild reliable remember responsible rumble sensible shabby slab snub stab
    stubble superb terribly timber tremble tumble urban vegetable verbal visible vocabulary
    wardrobe whereby absorb ab abs abc abbey abu abdul abdullah ibrahim habib rabat dubai
    lebanon libya cuba nairobi bahrain baghdad bangladesh barcelona belgium berlin boston
    brazil bulgaria beirut bob ben barbara brad brian bella facebook youtube github
    bitbucket dropbox adobe bing ebay airbnb uber bbc bmw obama bach beethoven bootstrap
    blockchain bitcoin backup backend backlog bandwidth benchmark beta bitmap blob boolean
    bot bots branch breakpoint broadcast buffer bundle byte bytes cyber debugger
    hub inbox jumbotron kanban lambda mailbox sandbox submodule subnet sub textbox
    toolbar toolbox web webhook workbench xbox`;

  const words = new Set();
  for (const w of (GH + ' ' + B).split(/\s+/)) {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean) words.add(clean);
  }

  const SUFFIXES = ['ingly', 'ness', 'ment', 'ings', 'ing', 'ers', 'est', 'ies', 'ied', 'ed', 'er', 'es', 'ly', 's', 'd'];

  function isWord(raw) {
    const w = String(raw).toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '').replace(/'s$/, '');
    if (!w) return false;
    if (words.has(w)) return true;
    for (const suf of SUFFIXES) {
      if (w.length > suf.length + 1 && w.endsWith(suf)) {
        const stem = w.slice(0, -suf.length);
        if (words.has(stem) || words.has(stem + 'e')) return true;
        if (suf === 'ies' || suf === 'ied') { if (words.has(stem + 'y')) return true; }
        // doubled consonant: "robbed" -> "rob", "bigger" -> "big"
        if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2] && words.has(stem.slice(0, -1))) return true;
      }
    }
    return false;
  }

  return { isWord, size: words.size };
});
