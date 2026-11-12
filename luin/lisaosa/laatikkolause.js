/* Laatikkolauseen arpoja (käyttäjän pyyntö 12.11.2026: oikeaoppinen ja kohtalaisen muistettava laatikkolause).
   Lause on suomen virke kiinteällä kaavalla, jolloin sen muistaa mielikuvana eikä merkkijonona:
     laatusana – tekijä – teonsana – luku 2–99 – kohde – paikka
     uninen-merimies-paistaa-17-lettua-saunassa  ("Uninen merimies paistaa 17 lettua saunassa.")
   Oikeaoppisuus:
   - Jokainen paikka arvotaan crypto.getRandomValuesilla tasajakaumasta hylkäysotannalla (ei jakojäännöksen vinoumaa).
   - Vahvuus lasketaan arpojasta eikä lauseesta: hyökkääjän oletetaan tuntevan sanalistat (Kerckhoffs). Liian pitkä
     (yli 52 merkkiä, posti.js) arvotaan kokonaan uudelleen, joten lause on tasan yksi MAARA:sta kelpaavasta, ja MAARA
     lasketaan pituusjakaumista tarkasti (ei arvioida): 12.11.2026 noin 242 biljoonaa eli 2^47,78.
   - Yhdysmerkit erottavat sanat ja paikkoja on aina kuusi, joten eri arvonnat eivät voi tuottaa samaa lausetta; sama
     sana saa olla yhdessä paikassa vain kerran (laatikkolause-testi.js tarkistaa).
   - Riittävyys: lausetta ei voi kokeilla muualla kuin workerin kautta (avainta ei tallenneta tiivisteenä mihinkään
     julkiseen), joten arvaaja maksaa jokaisesta yrityksestä pyynnön. Workerin ilmaistason 100 000 pyyntöä päivässä
     kävisi kaikki lauseet läpi noin 7 miljoonassa vuodessa; maksullisella tasolla läpikäynti maksaisi kymmeniä
     miljoonia euroja. Lisäbittejä tärkeämpi täydennys olisi hakujen (GET) rajoitin workeriin.
   Muistettavuus:
   - Sanat ovat tavallisia ja kuvallisia (eläimiä, ammatteja, esineitä, ruokaa, paikkoja), eikä samassa paikassa ole
     lähisynonyymejä (iso/suuri, uninen/unelias, suolla/suossa), koska muistaja muistaa merkityksen, ei sanaa.
   - Ääkkösiä ei saa olla (posti.js), joten mukana on vain sanoja, joiden oikea kirjoitusasu on ääkkösetön: ei
     *metsassa* eikä *delfiinia*. Taivutusmuodot on tarkistettu Voikolla (luin/kehitys/laatikkolause-sanat.py), koska
     takavokaalisesta näyttävä muoto voi olla väärä (delfiini → delfiiniä). Pois on jätetty myös oikeat sanat, jotka
     näyttävät ääkköset pudottaneilta, koska ääkkösellinen vastine on yleinen sana (käyttäjän rajaus 12.11.2026: ei
     lauseita, joista pitää poistaa ääkköset): etana (etänä), haita (häitä), niittaa (niittää), saaressa (sääressä).
   Kun muutat sanoja, aja laatikkolause-sanat.py (Voikko) ja laatikkolause-testi.js. */
(function (g) {
  'use strict';
  var SANAT = {
    // a: laatusana perusmuodossa (kuka), 259 sanaa
    a: (
      'aatelinen ahkera ahne aito akateeminen ankara antelias arka arktinen armollinen armoton arvoituksellinen arvokas ' +
      'aurinkoinen avulias dramaattinen eksoottinen eksynyt elegantti eloisa energinen filosofinen flunssainen ' +
      'haaveileva haiseva hajamielinen halpa hankala harmaapartainen hassu hauska hehkuva heikko hento hermostunut ' +
      'herttainen hidas hienostunut hikinen hiljainen hopeinen hulvaton huolellinen huoleton hurja hurmaava ihana ' +
      'ikuinen iloinen innokas iso itkuinen itsevarma jalo janoinen joustava juhlava juokseva kalju kallis kalpea ' +
      'kaoottinen karhea karvainen kateellinen katkera kaukainen kaunis kelluva keltainen kesy kevyt kiehtova kihara ' +
      'kiireinen kiitollinen kiljuva kiltti kimalteleva kirjava kirkas kitsas kivinen kodikas kohtelias komea kosminen ' +
      'kostea kruunattu kuiva kulmikas kultainen kuminen kuninkaallinen kunnianhimoinen kunnollinen kuolematon ' +
      'kuorsaava kuparinen kurja kuuliainen kuuluisa kuumeinen lahjakas laiha lapsellinen lasinen laulava levoton ' +
      'lihaksikas liila likainen liukas luminen lyhyt maaginen mahtava mausteinen mehukas melankolinen moderni muhkea ' +
      'muinainen muodikas muovinen musikaalinen musta mustasukkainen mystinen naamioitunut nahkainen nauravainen nirso ' +
      'noiduttu nokkela nolo nopea nostalginen notkea nuhruinen nukkuva nuori oikukas oiva onnekas onnellinen oppinut ' +
      'oranssi outo ovela paikallinen paperinen parrakas pehmoinen pelottava pieni pilkullinen pinkki pisamainen ' +
      'pronssinen puhdas puhelias puinen pullea punainen punatukkainen purppurainen raidallinen raikas raivokas ' +
      'rakastunut rapea raskas rauhallinen rautainen rehellinen reilu reipas rento rikas ritarillinen rohkea ' +
      'romanttinen runollinen ruskea ruudullinen ruusuinen ryppyinen salainen samettinen sankarillinen sateinen savinen ' +
      'seurallinen siisti silkkinen sininen siro sivistynyt sopuisa sotkuinen sulava suloinen suolainen surullinen ' +
      'syksyinen tahmea taitava taiteellinen takkuinen talvinen tanakka tanssiva tatuoitu terve tiukka toiveikas ' +
      'tottelematon trooppinen tuhma tulinen tumma tunteellinen tuntematon tuoksuva turhamainen turkoosi tuulinen tyly ' +
      'uhmakas ujo uljas ulkomainen uninen unohtumaton upea urheilullinen uskollinen utelias uunituore vaalea ' +
      'vaatimaton vahva valkoinen valpas valtava vanha vanhanaikainen vapiseva varovainen viaton vihainen viisas vilkas ' +
      'villainen villi vino violetti ylimielinen '
    ).trim().split(/\s+/),
    // s: tekijä perusmuodossa, 346 sanaa
    s: (
      'aasi ahma ahven akrobaatti albatrossi alligaattori alpakka ampiainen androidi ankerias ankka apina arkeologi ' +
      'arkkitehti asianajaja astronautti astronomi avaruusolio baarimikko basisti biologi boa delfiini diplomaatti ' +
      'dosentti emu eno erakko faarao fasaani filosofi flamingo fyysikko gekko geologi gepardi gorilla haaveilija hai ' +
      'haikara haltija hamsteri hanhi harakka harpisti hauki haukka herttua herttuatar hevonen hiiri hiisi hirvi ' +
      'historioitsija hovimestari hovineiti huijari huilisti hummeri huuhkaja hyeena hylje hyttynen iguaani ihmissusi ' +
      'ilves isosisko jaguaari joulupukki joutsen juoksija kakadu kaksonen kalastaja kalkkuna kalmari kameleontti ' +
      'kameli kampela kana kanarialintu kani kapellimestari kapteeni karhu karppi katkarapu kauppias keiju keisari ' +
      'keisarinna kemisti kenguru kenraali kentauri kettu kiiski kiivi kilpikonna kimalainen kirahvi kirjailija kirppu ' +
      'kirurgi kirvesmies kissa kitaristi kiuru klovni koala kobra koira kojootti kokki kolibri kondiittori kondori ' +
      'konna korppi koskelo kotilo kotka kottarainen kreivi krokotiili kuikka kukko kulkuri kultakala kummi kummitus ' +
      'kuningas kuningatar kuntoilija kuorsaaja kuovi kuriiri kurki kuski kutoja kyborgi kyklooppi kyy kyyhky laama ' +
      'laiskiainen lammas laulaja leijona leipuri leopardi lepakko linnanherra lisko lohi lokki luistelija lukiolainen ' +
      'lumikko lumilautailija lumiukko luotsi maahinen maalari maisteri majakanvartija majava marsu matemaatikko mato ' +
      'meduusa mekaanikko merenneito merihevonen merimies merirosvo merisiili metso metsuri miekkakala ministeri minkki ' +
      'muikku mummo munkki mursu mustekala muumio muurahainen muurari muusikko naakka naapuri narri nero noita norsu ' +
      'notaari nunna nuohooja ohjaaja ompelija opas opettaja opiskelija oppilas orava osteri paarma paimen painija ' +
      'pallokala palomies palvelija panda pankkiiri papukaija paroni parturi peikko peippo pelikaani perhonen pesukarhu ' +
      'peukaloinen peura pianisti piisami pikkuveli pingviini poika poliisi poni pormestari poro possu postimies ' +
      'presidentti prinsessa prinssi professori psykologi pukki punatulkku purjehtija putkimies puuma puutarhuri pyy ' +
      'rapu rastas rausku rehtori riekko riikinkukko ritari robotti rosvo rotta rumpali runoilija sakaali saksofonisti ' +
      'salamanteri salapoliisi sammakko sardiini sarvikuono satakieli saukko seepra seikkailija sellisti serkku sfinksi ' +
      'sihteeri siili silakka simpanssi sirkka skeittaaja skorpioni sonni sotilas soutaja strutsi sudenkorento ' +
      'sukeltaja sulttaani surffaaja susi suutari taapero taikuri taimen taiteilija tanssija tarjoilija taskuvaras ' +
      'teeri teini teologi termiitti tiainen tiikeri tiira tikka tilhi tohtori toimittaja tonnikala tonttu torakka ' +
      'toukka trubaduuri trumpetisti tsaari tuhatjalkainen tukaani tulkki tuomari turisti turska tutkija uimari ' +
      'undulaatti unikeko urkuri vaari vaeltaja vakooja valas valokuvaaja vampyyri varis varpunen vartija vasikka vauva ' +
      'velho vesilisko villisika virtahepo viulisti vuohi yksisarvinen '
    ).trim().split(/\s+/),
    // v: teonsana, yksikön 3. persoona, 233 sanaa
    v: (
      'adoptoi ahmii ajaa allekirjoittaa annostelee antaa arvostelee asentaa avaa bongaa dippaa esittelee etsii filmaa ' +
      'friteeraa grillaa haastattelee haistelee hakee halaa halkoo hamstraa haravoi harjaa hauduttaa hautaa heiluttaa ' +
      'heittelee hemmottelee hieroo hioo hoivaa huutokauppaa hypnotisoi ihailee ihmettelee ilahduttaa imee imuroi ' +
      'istuttaa jahtaa jakaa jauhaa johtaa juo juoksuttaa juottaa kaappaa kaataa kadehtii kaipaa kaivaa kaivertaa ' +
      'kalastaa kampaa kantaa kastelee kasvattaa kaulii kehuu keinuttaa keksii kietoo kiillottaa kirjoittaa kitkee ' +
      'kiusoittelee kloonaa kokkaa kokoaa kolaa kopioi koristaa korjaa kosii kouluttaa kuivattaa kuljettaa kuorii ' +
      'kuorruttaa kutittaa kutoo kutsuu kuulustelee kuumentaa kuuntelee kuvailee kuvittaa lahjoittaa laiduntaa lainaa ' +
      'lajittelee lakaisee lapioi laskee laulaa lausuu leikkaa leimaa leipoo liimaa lohduttaa luettelee lukee lukitsee ' +
      'luonnostelee lusikoi maalaa mainostaa maistaa marinoi maustaa merkitsee miksaa mittaa muistelee muokkaa murskaa ' +
      'mussuttaa muuraa myy nakertaa nappaa nauhoittaa naulaa naurattaa neuloo nielee nikkaroi nitoo noituu nostaa ' +
      'numeroi nuolee odottaa ohjaa ompelee onnittelee opettaa ostaa paahtaa paikkaa paimentaa paistaa pakastaa pakkaa ' +
      'palkitsee palvoo pelastaa pelottaa pesee piilottaa pilkkoo pinoaa poimii poraa postittaa pudottaa puhaltaa ' +
      'punnitsee punoo puree purkaa purkittaa pursottaa pyyhkii raahaa raastaa rakastaa rakentaa rapsuttaa ripustaa ' +
      'rummuttaa ruokkii rutistaa ruuvaa sahaa savustaa sekoittaa siivoaa silittelee sitoo skannaa soittaa solmii ' +
      'sovittaa suihkuttaa sulattaa suodattaa suojelee suolaa suutelee taikoo taittelee taluttaa tanssittaa tapetoi ' +
      'taputtaa tarjoilee tarkastaa tavaa teippaa tervehtii testaa tilaa tiskaa toimittaa trimmaa tuijottaa tulostaa ' +
      'tuo tutkii tuulettaa tuuppaa ulkoiluttaa unohtaa vaanii vaihtaa vaivaa valaisee valjastaa valloittaa valokuvaa ' +
      'varaa varastaa vartioi vatkaa vie viikkaa vilkuilee virkkaa vuokraa vuolee '
    ).trim().split(/\s+/),
    // o: kohde yksikön partitiivissa (lukusanan jälkeen), 477 sanaa
    o: (
      'aarretta aasia ahventa akvaariota albumia allasta alpakkaa ammetta ampiaista ananasta ankkaa apinaa appelsiinia ' +
      'aprikoosia arkkua arpaa artisokkaa auringonkukkaa aurinkokelloa autoa avainta avokadoa banaania banjoa baskeria ' +
      'broileria bumerangia bussia etanaa fagottia fossiilia gongia gorillaa haapaa haarukkaa haikaraa hammasharjaa ' +
      'hampurilaista hanhea hanskaa harakkaa haravaa harjaa harmonikkaa harppua hattua haukea helikopteria herukkaa ' +
      'hevosta hilloa hiomapaperia huilua huivia hummeria hunajaa huuhkajaa ikkunaa ilmapalloa imuria jakoavainta ' +
      'jalavaa jogurttia jojoa joulutorttua jousta joutsenta junaa juustoa kaakaota kaalia kaapelia kahvia kaislaa ' +
      'kaiutinta kaivinkonetta kakkua kaktusta kalaa kalapuikkoa kaleidoskooppia kalkkunaa kalmaria kalossia ' +
      'kameleonttia kameraa kampaa kampelaa kanaa kanankoipea kanelia kanervaa kangasta kanisteria kannua kanoottia ' +
      'kantarellia kantoa kanuunaa kardemummaa karhua karkkia karpaloa karviaista kastanjaa kastelukannua katajaa ' +
      'katkarapua kattilaa kaukoputkea kaulakorua kebabia kehtoa keinua keittoa kelkkaa kelloa kengurua keppihevosta ' +
      'kermaa ketsuppia kettua kiekkoa kieloa kiikaria kimalaista kinkkua kirahvia kirjaa kirjekuorta kirppua kirsikkaa ' +
      'kirsikkapuuta kissaa kitaraa kiuasta klarinettia knallia koalaa koiraa koivua kolikkoa komeettaa kompassia ' +
      'kookosta korallia korppia korppua korttia korvapuustia kotiloa kotkaa kotlettia kristallia krokotiilia kruunua ' +
      'kuhaa kukkaa kukkakaalia kulhoa kumia kumiankkaa kuokkaa kuplaa kuplamuovia kuponkia kuppia kuppikakkua kurkea ' +
      'kurkkua kurpitsaa kuuloketta kuusta kuuta laamaa laatikkoa lahjaa laiskiaista laivaa lakanaa lakkaa lakritsia ' +
      'lammasta lamppua lankaa lanttua lapiota lasia laukkua lautaa lautasta lauttaa lehmusta leijaa leijonaa ' +
      'leimasinta lentokonetta lepakkoa letkua lettua lihapiirakkaa lihapullaa liitua liljaa limsaa lintua lippalakkia ' +
      'lippua lohta lompakkoa luistinta lukkoa lumihiutaletta lumipalloa lumiukkoa lusikkaa luumua luutaa maalipurkkia ' +
      'maapalloa magneettia mailaa maissia maitoa majavaa majoneesia makaronia makkaraa maljakkoa mandariinia ' +
      'mandoliinia mangoa mansikkaa marenkia marionettia matoa meduusaa mehua mekkoa melonia meteoriittia metronomia ' +
      'miekkaa mikrofonia mikroskooppia mitalia moottoria moottorisahaa mopoa moppia mosaiikkia muikkua munaa munakasta ' +
      'munakoisoa munkkia mursua mustekalaa mustikkaa muurahaista naamiota nakkia nallea nappia narua nauhaa naulaa ' +
      'naurista nektariinia neulaa nitojaa noppaa nosturia nukkea nuolta nuppineulaa nuudelia oksaa oliivia olkea ' +
      'omenaa omenapuuta oravaa orkideaa osteria ovea paitaa pajua pakettia palettia palikkaa palkintoa palloa palmua ' +
      'pandaa pannua pannukakkua papaijaa paprikaa papua papukaijaa paristoa parsaa parsakaalia partaa pastaa pasuunaa ' +
      'patjaa patonkia patsasta pehmolelua peittoa pekonia pelilautaa perhosta persikkaa perunaa peruukkia pesukarhua ' +
      'peuraa pianoa pihlajaa piirakkaa pikaria piparkakkua pipoa pippuria pistorasiaa planeettaa ponia popcornia ' +
      'porakonetta porkkanaa poroa possua postikorttia potkulautaa puhelinta puikkoa pukkia pulkkaa pullaa pulloa ' +
      'pumppua punajuurta puolukkaa purjoa purkkaa purkkia puskutraktoria putkea puukkoa puuroa puuta radiota rahkaa ' +
      'rakettia rannekorua raparperia rapua rasiaa ratasta rekkaa reppua riipusta rintaneulaa ritsaa robottia rubiinia ' +
      'rullalautaa rumpua rusettia rusinaa ruukkua ruusua ruuvia saapasta sadetinta safiiria sahaa saippuaa saksofonia ' +
      'salaattia salamaa salmiakkia sammakkoa sammalta sandaalia saniaista sankoa sarjakuvaa sarvea sateenkaarta ' +
      'sateenpisaraa sateenvarjoa satelliittia saukkoa sauvaa seepraa selloa siirappia silakkaa simaa simpukkaa ' +
      'sinappia sinivuokkoa sipulia sirkkaa sitruunaa smaragdia sohvaa soihtua solkea solmiota sombreroa sonnia ' +
      'sormusta spagettia sukkaa suklaata suksea sushia sutta suurennuslasia taatelia takkia talikkoa tamburiinia ' +
      'tammea tammenterhoa taskulamppua tattia taulua televisiota terraariota tiaraa tietokonetta tiimalasia timanttia ' +
      'toffeeta tomaattia tonnikalaa torvea tossua traktoria triangelia trumpettia tulitikkua tulppaania tuolia tuubaa ' +
      'ufoa ukulelea vaahteraa vadelmaa valasta valkosipulia valtikkaa vaniljaa vanukasta vasaraa vasikkaa vaunua ' +
      'verhoa vetoketjua veturia vihkoa vihtaa viikatetta viikunaa viilaa viivainta virkkuukoukkua viulua vohvelia ' +
      'voikukkaa vuohta '
    ).trim().split(/\s+/),
    // p: paikka inessiivissä tai adessiivissa, 292 sanaa
    p: (
      'aavikolla aidalla aitassa aitauksessa akvaariossa altaassa ambulanssissa ammeessa apteekissa arkistossa arkussa ' +
      'asuntovaunussa aukiolla aulassa auringossa autossa avaruudessa avoautossa baarissa bussissa diskossa ' +
      'festivaalilla galaksissa galleriassa haavissa hanskassa harjanteella hatussa heinikossa helikopterissa ' +
      'hinaajalla holvissa hotellissa huipulla huoltoasemalla huutokaupassa huvimajassa huvipuistossa iglussa ' +
      'ikkunalaudalla ilmapallossa jahdilla joella junassa kaapissa kadulla kahvilassa kaislikossa kaivossa ' +
      'kalasatamassa kalliolla kamarissa kammiossa kanalassa kanjonissa kannolla kanootissa karkkikaupassa ' +
      'karnevaalissa kartanossa karusellissa kasarmilla kasinolla kasvihuoneessa kasvimaalla katolla kattilassa ' +
      'kaukalossa kauppahallissa kaupungissa keilahallissa keinutuolilla keitaassa kelkalla kellarissa kioskilla ' +
      'kirjakaupassa kirjastossa kirjekuoressa kirkossa kirpputorilla kiukaalla kivikossa kodassa koirankopissa ' +
      'koivikossa kokeessa kokouksessa kolossa komerossa kompostissa konehuoneessa konsertissa korissa korvessa ' +
      'koskella kotona koulussa kryptassa kuistilla kukkakaupassa kukkulalla kummitusjunassa kuntosalilla kuopassa ' +
      'kupissa kuunvalossa kuusikossa kuussa kylpyhuoneessa laaksossa laatikossa laavulla laboratoriossa ladossa ' +
      'ladulla laguunissa lahdella laitumella laiturilla laivalla lammikossa lapasessa lattialla laukussa lautalla ' +
      'lavalla lehdossa leikkipuistossa leipomossa lelukaupassa lentoasemalla lentokoneessa limusiinissa linnassa ' +
      'lompakossa luennolla luistinradalla lukiossa lumessa lumikinoksessa lumilinnassa luodolla luolassa luostarissa ' +
      'maalla majakassa makuuhuoneessa matkalaukussa matolla metroasemalla metrossa mopoautossa mopolla mudassa ' +
      'mummolassa museossa naapurissa navetassa neuvolassa nojatuolilla nummella nuotiolla nurmikolla observatoriossa ' +
      'ojassa oksalla olohuoneessa omenatarhassa oopperassa oppitunnilla ottelussa ovella pajassa paketissa ' +
      'pakettiautossa pakkasessa palatsissa paloautossa panimossa pankissa paraatissa parkkihallissa parkkipaikalla ' +
      'parturissa parvekkeella parvella pellolla pihalla pipossa planeetalla planetaariossa pohjoisnavalla ' +
      'poliisiautossa porealtaassa portaikossa portilla postissa potkukelkalla potkulaudalla proomulla pukuhuoneessa ' +
      'pullossa purkissa purolla pururadalla pussissa putouksella puumajassa puussa puutarhassa raatihuoneella ' +
      'raekuurossa raketissa rannalla rannikolla rasiassa ratikassa rautakaupassa ravintolassa raviradalla rekalla ' +
      'repussa riippumatossa riutalla rullalaudalla ruokalassa ruusupensaassa saappaassa saavissa sahalla sairaalassa ' +
      'salissa salmessa sangossa satamassa sateessa satelliitissa saunassa savannilla seminaarissa sillalla sirkuksessa ' +
      'sohvalla stadionilla studiossa suihkussa sukassa sumussa suolla takapihalla takassa taksissa tallissa ' +
      'tanssilavalla taskussa tavaratalossa teatterissa tehtaalla telakalla teltassa terassilla terraariossa ' +
      'toimistossa torilla tornissa torpassa traktorilla tuiskussa tulivuorella tundralla tunnelissa tunturilla ' +
      'turnauksessa tuulessa tuvassa uimahallissa ukkosessa ulapalla ullakolla uunissa vaatehuoneessa vankilassa ' +
      'varastossa varjossa vaunussa venevajassa vesitornissa viidakossa vuorella vuoristoradalla yliopistossa '
    ).trim().split(/\s+/)
  };
  var LUKU_MIN = 2, LUKU_MAX = 99;     // 1 vaatisi perusmuodon (1 lettu); lukusanan jälkeen kohde on partitiivissa
  var MIN = 24, MAX = 52;             // posti.js: uuden laatikkolauseen pituus
  var JARJ = ['a', 's', 'v', 'n', 'o', 'p'];
  var luvut = [];
  for (var i = LUKU_MIN; i <= LUKU_MAX; i++) luvut.push(String(i));
  SANAT.n = luvut;

  // Tasajakauma 0..n-1: 32-bittisestä luvusta hylätään yläpään vajaa jakso.
  function kokonais(n) {
    var raja = Math.floor(4294967296 / n) * n, x = new Uint32Array(1);
    do g.crypto.getRandomValues(x); while (x[0] >= raja);
    return x[0] % n;
  }
  // Kelpaavien lauseiden tarkka määrä: sanojen pituusjakaumien konvoluutio ja viisi yhdysmerkkiä.
  var MAARA = (function () {
    var d = {}; d[JARJ.length - 1] = 1;
    JARJ.forEach(function (k) {
      var h = {}, u = {};
      SANAT[k].forEach(function (w) { h[w.length] = (h[w.length] || 0) + 1; });
      Object.keys(d).forEach(function (a) {
        Object.keys(h).forEach(function (b) { var p = +a + +b; u[p] = (u[p] || 0) + d[a] * h[b]; });
      });
      d = u;
    });
    var m = 0;
    Object.keys(d).forEach(function (p) { if (+p >= MIN && +p <= MAX) m += d[p]; });
    return m;
  })();

  function arvo() {
    for (;;) {
      var sanat = JARJ.map(function (k) { var l = SANAT[k]; return l[kokonais(l.length)]; });
      var lause = sanat.join('-');
      if (lause.length < MIN || lause.length > MAX) continue;
      var virke = sanat.join(' ');
      return { lause: lause, sanat: sanat, virke: virke.charAt(0).toUpperCase() + virke.slice(1) + '.' };
    }
  }

  g.LuinLause = { arvo: arvo, MAARA: MAARA, BITIT: Math.log(MAARA) / Math.LN2, SANAT: SANAT, kokonais: kokonais };
})(typeof window !== 'undefined' ? window : globalThis);
