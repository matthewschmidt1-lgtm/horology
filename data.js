/* The Shape of Time: plate data.
   Flags on measurements:  'v' = widely documented,  'a' = approximate (shown with ≈),
   'n' = not verified (drawn indicatively, no figure printed). */
window.WATCHES = [
{
  id:'sub5513', brand:'Rolex', model:'Submariner', ref:'5513', year:'1962', span:'c. 1962 – 1989', kind:'Dive watch',
  c:{shape:'round', d:40, t:[14.5,'n'], lug:[20,'v']},
  bezel:{type:'dive', w:3.6, first15:true}, dial:{dark:true, markers:'dive', text:['ROLEX','SUBMARINER']},
  hands:'mercedes', sec:'center', crown:{pos:3, guards:true}, strap:'oyster',
  mv:{cal:'1530, later 1520', type:'auto', vph:18000, wind:'Automatic, full rotor', note:'Cal. 1530 beats at 18,000 A/h; the later cal. 1520 at 19,800 A/h. Drawn here at the earlier rate.'},
  back:{type:'fluted', note:'Screw-down Oyster back with fluted edge.'},
  specs:[['Water resistance','200 m / 660 ft'],['Crystal','Domed acrylic'],['Complication','Time only, no date']],
  notes:['The no-date, non-chronometer Submariner, produced with little change for almost three decades.'],
  q:{t:'To what depth was the 5513 rated?', a:'200 m / 660 ft', w:['100 m / 330 ft','300 m / 1,000 ft','610 m / 2,000 ft']}
},
{
  id:'daytona6263', brand:'Rolex', model:'Cosmograph Daytona', ref:'6263', year:'c. 1970', span:'c. 1970 – 1988', kind:'Chronograph',
  c:{shape:'round', d:37, t:[13,'n'], lug:[19,'v']},
  bezel:{type:'tachy', w:3.1, dark:true}, dial:{dark:false, markers:'baton', subs:[[3,'min30'],[6,'hr12'],[9,'sec']], subDark:true, text:['ROLEX','COSMOGRAPH']},
  hands:'baton', sec:'sub', chrono:true, crown:{pos:3}, pushers:'screw', strap:'oyster',
  mv:{cal:'727 (Valjoux 72 base)', type:'chrono', vph:21600, wind:'Manual', note:'Rolex calibre built on the Valjoux 72, a column-wheel chronograph.'},
  back:{type:'fluted', note:'Screw-down Oyster back with fluted edge.'},
  specs:[['Bezel','Black acrylic insert, tachymeter scale'],['Pushers','Screw-down'],['Registers','30 min at 3 · 12 h at 6 · seconds at 9']],
  notes:['The last manually wound Daytona. The 6263 carries the black acrylic bezel; its twin, the 6265, an engraved steel one.','Screw-down pushers gave the chronograph an Oyster case worthy of the name.'],
  q:{t:'What is distinctive about the 6263’s chronograph pushers?', a:'They screw down against the case', w:['They sit on the left flank','They are hidden under a hinged cover','There is only one pusher']}
},
{
  id:'explorer1016', brand:'Rolex', model:'Explorer', ref:'1016', year:'c. 1963', span:'c. 1963 – 1989', kind:'Field watch',
  c:{shape:'round', d:36, t:[12.5,'n'], lug:[20,'v']},
  bezel:{type:'plain', w:2.4}, dial:{dark:true, markers:'explorer', text:['ROLEX','EXPLORER']},
  hands:'mercedes', sec:'center', crown:{pos:3}, strap:'oyster',
  mv:{cal:'1560, later 1570', type:'auto', vph:18000, wind:'Automatic, full rotor', note:'Cal. 1560 at 18,000 A/h, succeeded by the cal. 1570 at 19,800 A/h. Drawn at the earlier rate.'},
  back:{type:'fluted', note:'Screw-down Oyster back with fluted edge.'},
  specs:[['Crystal','Domed acrylic'],['Bezel','Smooth, polished steel'],['Complication','Time only']],
  notes:['The plainest of the Rolex tool watches: a black dial, a triangle at twelve and three numerals.','It stayed in the catalogue for roughly a quarter of a century.'],
  q:{t:'Which numerals appear on the Explorer dial?', a:'3, 6 and 9', w:['12, 3, 6 and 9','All twelve','None at all']}
},
{
  id:'speedy105003', brand:'Omega', model:'Speedmaster', ref:'105.003', year:'1964', span:'c. 1964 – 1969', kind:'Chronograph',
  c:{shape:'round', d:39.7, t:[14,'a'], lug:[19,'v'], straight:true},
  bezel:{type:'tachy', w:3.3, dark:true}, dial:{dark:true, markers:'baton', subs:[[3,'min30'],[6,'hr12'],[9,'sec']], text:['OMEGA','Speedmaster']},
  hands:'baton', sec:'sub', chrono:true, crown:{pos:3}, pushers:'pump', strap:'flat',
  mv:{cal:'321', type:'chrono', vph:18000, wind:'Manual', size:'27 mm', note:'Column-wheel chronograph derived from the Lemania 2310.'},
  back:{type:'screw', emblem:'Hippocampus emblem', note:'Screw back. The seahorse emblem is indicated, not reproduced.'},
  specs:[['Case','Symmetrical, straight lugs, no crown guards'],['Registers','30 min at 3 · 12 h at 6 · seconds at 9'],['Bezel','Black aluminium insert, tachymeter']],
  notes:['The last straight-lug Speedmaster, before the asymmetrical “Professional” case.','The reference NASA put through its qualification tests in 1964–65, and the one Ed White wore on the first American spacewalk.'],
  q:{t:'What coordinates start, stop and reset in calibre 321?', a:'A column wheel', w:['A cam and lever','A tuning fork','A quartz module']}
},
{
  id:'sm300', brand:'Omega', model:'Seamaster 300', ref:'165.024', year:'mid-1960s', span:'c. 1964 – 1969', kind:'Dive watch',
  c:{shape:'round', d:41.5, da:'a', t:[14,'n'], lug:[20,'a'], lyre:true},
  bezel:{type:'dive', w:4.2, wide:true}, dial:{dark:true, markers:'sm300', text:['OMEGA','Seamaster 300']},
  hands:'sword', sec:'center', crown:{pos:3, guards:true}, strap:'flat',
  mv:{cal:'552', type:'auto', vph:19800, jewels:24, wind:'Automatic, full rotor'},
  back:{type:'screw', emblem:'Hippocampus emblem', note:'Screw back. The seahorse emblem is indicated, not reproduced.'},
  specs:[['Case','Asymmetrical, twisted lugs'],['Bezel','Wide rotating insert, sixty-minute scale'],['Complication','Time only']],
  notes:['Second-generation Seamaster 300 in the larger asymmetrical case shared with the Speedmaster Professional.','Issued to divers of the British Royal Navy in the late 1960s.','Sources give the case as 41 or 42 mm; dial and hand configurations varied through production.'],
  q:{t:'Which navy issued the Seamaster 300 to its divers?', a:'The British Royal Navy', w:['The United States Navy','The Italian Marina Militare','The Imperial Japanese Navy']}
},
{
  id:'constellation', brand:'Omega', model:'Constellation “Pie Pan”', ref:'168.005', year:'c. 1962', span:'Pie-pan dials c. 1952 – late 1960s', kind:'Chronometer',
  c:{shape:'round', d:34.5, da:'a', t:[11.5,'n'], lug:[18,'a']},
  bezel:{type:'plain', w:1.6}, dial:{dark:false, markers:'pie', date:3, text:['OMEGA','Constellation'], star:true},
  hands:'dauphine', sec:'center', crown:{pos:3, small:true}, strap:'leather',
  mv:{cal:'561', type:'auto', vph:19800, jewels:24, wind:'Automatic, full rotor', note:'Chronometer-rated, with date.'},
  back:{type:'screw', obs:true, note:'Medallion of the Geneva Observatory beneath eight stars.'},
  specs:[['Dial','Twelve-sided raised centre, sloping “pie-pan” border'],['Certification','Chronometer'],['Complication','Date at 3']],
  notes:['Named for its dial, which rises in the centre and falls away in twelve facets like an upturned pie tin.','The eight stars on the caseback commemorate Omega’s observatory chronometry records.'],
  q:{t:'What is pictured on the Constellation’s caseback medallion?', a:'An observatory beneath eight stars', w:['A seahorse','A trident and waves','A five-pointed crown']}
},
{
  id:'tanklc', brand:'Cartier', model:'Tank Louis Cartier', ref:'-', year:'1922', span:'1922 onward', kind:'Dress watch',
  c:{shape:'tank', w:23, h:30, da:'a', t:[6.5,'n'], lug:null},
  dial:{dark:false, markers:'roman', text:['CARTIER']},
  hands:'epee', sec:'none', crown:{pos:3, cabochon:true}, strap:'leather',
  mv:{cal:'not specified', type:'manual', vph:18000, wind:'Manual', note:'Early movements were supplied through the European Watch & Clock Co., Cartier’s venture with Edmond Jaeger and LeCoultre. Many calibres followed, so none is named as the Tank’s. The Workbench shows one real example: LeCoultre’s calibre 818 (20.80 mm, 18,000 A/h), which dealers describe in Paris-made Tanks of the late 1960s.'},
  back:{type:'plainrect', note:'Detail not verified; shown plain.'},
  specs:[['Case','Precious metal; brancards with rounded corners'],['Dial','Roman numerals, chemin-de-fer minute track'],['Crown','Set with a sapphire cabochon'],['Hands','Blued steel, sword-shaped']],
  notes:['Louis Cartier’s refinement of the 1917 Tank: softer brancards, the strap flowing straight out of the case.','The plan is traditionally said to follow a First World War tank seen from above, the brancards being the tracks.','Sizes varied across a century of production. The dimensions here are representative, not definitive.'],
  q:{t:'What, by tradition, inspired the Tank’s form?', a:'A First World War tank seen from above', w:['A railway carriage window','A cigarette case','A Roman tablet']}
},
{
  id:'reverso', brand:'Jaeger-LeCoultre', model:'Reverso', ref:'-', year:'1931', span:'1931 onward', kind:'Sports watch',
  c:{shape:'reverso', w:24, h:38, da:'a', t:[8,'n'], lug:null},
  dial:{dark:true, markers:'rectbaton', text:['REVERSO']},
  hands:'baton', sec:'none', crown:{pos:3, small:true}, strap:'leather',
  mv:{cal:'Tavannes, then LeCoultre 410', type:'manual', vph:18000, wind:'Manual', rect:true, note:'The first Reversos used Tavannes movements; LeCoultre’s own shaped calibre followed in 1933. Beat rate assumed for drawing.'},
  back:{type:'plainrect', note:'A blank metal reverse. Turned outward, it shields the crystal.'},
  specs:[['Case','Swivels within its carriage'],['Patent','René-Alfred Chauvot, filed 4 March 1931'],['Decoration','Three gadroons above and below the dial']],
  notes:['Made for polo players in British India who wanted a crystal that would survive a match.'],
  q:{t:'Why does the Reverso’s case flip over?', a:'To protect the crystal during polo matches', w:['To show a second time zone','To wind the mainspring','To reveal a hidden portrait']}
},
{
  id:'monaco', brand:'Heuer', model:'Monaco', ref:'1133B', year:'1969', span:'1969 – mid-1970s', kind:'Chronograph',
  c:{shape:'square', d:39, t:[14.5,'n'], lug:[22,'a']},
  dial:{dark:true, markers:'monaco', date:6, subs:[[3,'min30'],[9,'hr12']], subSquare:true, subLight:true, text:['MONACO','HEUER']},
  hands:'baton', sec:'none', chrono:true, crown:{pos:9}, pushers:'pump', strap:'leather',
  mv:{cal:'11 “Chronomatic”', type:'microchrono', vph:19800, wind:'Automatic, micro-rotor', note:'The “Chronomatic”: a modular automatic chronograph developed by Heuer, Breitling, Büren and Dubois-Dépraz.'},
  back:{type:'plainsq', note:'Detail not verified; shown plain.'},
  specs:[['Case','Square, water-resistant'],['Registers','30 min at 3 · 12 h at 9 · no running seconds'],['Crown','Left flank, at 9']],
  notes:['Among the first automatic chronographs, and the first in a water-resistant square case.','The crown sits on the left to announce that the watch seldom needs winding.','Worn by Steve McQueen in the 1971 film “Le Mans”.'],
  q:{t:'Where does the crown sit on a Calibre 11 Monaco?', a:'On the left flank, at 9', w:['At 3, between the pushers','At 12, under the strap','On the caseback']}
},
{
  id:'carrera', brand:'Heuer', model:'Carrera', ref:'2447', year:'1963', span:'1963 – c. 1970', kind:'Chronograph',
  c:{shape:'round', d:36, t:[13,'n'], lug:[18,'v'], straight:true},
  bezel:{type:'plain', w:1.5}, dial:{dark:false, markers:'baton', flange:'fifths', subs:[[3,'min30'],[6,'hr12'],[9,'sec']], text:['CARRERA','HEUER']},
  hands:'baton', sec:'sub', chrono:true, crown:{pos:3}, pushers:'pump', strap:'leather',
  mv:{cal:'Valjoux 72', type:'chrono', vph:18000, wind:'Manual', size:'13 lignes (≈ 29.5 mm)', note:'Three-register column-wheel chronograph.'},
  back:{type:'screw', note:'Screw back. Engraving omitted.'},
  specs:[['Dial','Scale printed on the inner tension ring'],['Registers','30 min at 3 · 12 h at 6 · seconds at 9'],['Lugs','Long, faceted']],
  notes:['Jack Heuer’s exercise in legibility, named for the Carrera Panamericana road race.','Moving the fifth-of-a-second scale onto the crystal’s tension ring left the dial itself clear.'],
  q:{t:'Which movement powers the Carrera 2447?', a:'Valjoux 72', w:['Venus 178','Calibre 11','Lemania 2310']}
},
{
  id:'navitimer', brand:'Breitling', model:'Navitimer', ref:'806', year:'c. 1954', span:'c. 1954 – 1970s', kind:'Pilot’s chronograph',
  c:{shape:'round', d:40.5, da:'a', t:[13.5,'n'], lug:[22,'v']},
  bezel:{type:'slide', w:1.8}, dial:{dark:true, markers:'arabic', sliderule:true, subs:[[3,'min30'],[6,'hr12'],[9,'sec']], text:['BREITLING','NAVITIMER']},
  hands:'pencil', sec:'sub', chrono:true, crown:{pos:3}, pushers:'pump', strap:'leather',
  mv:{cal:'Venus 178', type:'chrono', vph:18000, wind:'Manual', note:'Column-wheel chronograph. Some of the earliest examples used the Valjoux 72.'},
  back:{type:'snap', note:'Detail not verified; shown plain.'},
  specs:[['Bezel','Beaded, bidirectional; drives the outer slide-rule scale'],['Scale','Logarithmic circular slide rule'],['Registers','30 min at 3 · 12 h at 6 · seconds at 9']],
  notes:['Developed with the Aircraft Owners and Pilots Association; its name joins “navigation” and “timer”.','The slide rule computes fuel burn, ground speed, climb rate and unit conversions.','The scale drawn here is a true logarithmic one, simplified to its principal figures.'],
  q:{t:'What is the Navitimer’s rotating scale?', a:'A circular slide rule for flight calculations', w:['A decompression table','A second time zone','A tide indicator']}
},
{
  id:'a386', brand:'Zenith', model:'El Primero', ref:'A386', year:'1969', span:'1969 – early 1970s', kind:'Chronograph',
  c:{shape:'round', d:38, t:[12.5,'n'], lug:[19,'n']},
  bezel:{type:'plain', w:1.4}, dial:{dark:false, markers:'baton', flange:'tachy', date:4.5, subs:[[3,'min30'],[6,'hr12'],[9,'sec']], subBig:true, subTints:{3:.34,6:.6,9:.12}, text:['ZENITH','El Primero']},
  hands:'baton', sec:'sub', chrono:true, crown:{pos:3}, pushers:'pump', strap:'leather',
  mv:{cal:'3019 PHC', type:'autochrono', vph:36000, jewels:31, wind:'Automatic, full rotor', size:'13 lignes', note:'Integrated automatic chronograph with column wheel, dividing the second into tenths.'},
  back:{type:'screw', note:'Detail not verified; shown plain.'},
  specs:[['Dial','Three overlapping registers: light grey, blue, anthracite'],['Complication','Date between 4 and 5'],['Scale','Tachymeter and decimal on the flange']],
  notes:['Announced in January 1969: an integrated, automatic, high-frequency chronograph.','At ten beats a second the seconds hand moves in tenths. Watch the hand on the register at nine.'],
  q:{t:'How fast does the El Primero beat?', a:'36,000 vibrations per hour', w:['18,000 vibrations per hour','21,600 vibrations per hour','28,800 vibrations per hour']}
},
{
  id:'polerouter', brand:'Universal Genève', model:'Polerouter', ref:'-', year:'1954', span:'1954 – 1969', kind:'Dress / travel watch',
  c:{shape:'round', d:35, da:'a', t:[10,'n'], lug:[18,'n'], lyre:true},
  bezel:{type:'plain', w:1.3}, dial:{dark:true, markers:'polerouter', text:['UNIVERSAL GENÈVE','POLEROUTER']},
  hands:'dauphine', sec:'center', crown:{pos:3, small:true}, strap:'leather',
  mv:{cal:'215 “Microtor”', type:'micro', vph:18000, wind:'Automatic, micro-rotor', note:'The first Polerouters used the bumper cal. 138 SS; the micro-rotor cal. 215 followed in 1955.'},
  back:{type:'screw', note:'Detail not verified; shown plain.'},
  specs:[['Design','Gérald Genta'],['Case','Twisted “lyre” lugs'],['Dial','Raised outer ring carrying the indices; crosshair']],
  notes:['Commissioned to mark SAS’s polar route between Copenhagen and Los Angeles; first called the Polarouter.','An early work by Gérald Genta, then in his early twenties.','The micro-rotor sits within the movement’s thickness, so the watch stays slim.'],
  q:{t:'Which airline’s polar route gave the Polerouter its name?', a:'SAS', w:['Pan Am','BOAC','KLM']}
},
{
  id:'calatrava', brand:'Patek Philippe', model:'Calatrava', ref:'96', year:'1932', span:'1932 – c. 1973', kind:'Dress watch',
  c:{shape:'round', d:31, da:'a', t:[9,'n'], lug:[18,'a']},
  bezel:{type:'plain', w:1.7}, dial:{dark:false, markers:'calatrava', subs:[[6,'sec']], text:['PATEK PHILIPPE','GENÈVE']},
  hands:'dauphine', sec:'sub', crown:{pos:3, small:true}, strap:'leather',
  mv:{cal:'12‴-120', type:'manual', vph:18000, wind:'Manual', size:'12 lignes', note:'Patek’s own calibre from 1934. The first examples used a LeCoultre ébauche.'},
  back:{type:'snap', note:'Plain snap back.'},
  specs:[['Case','Flat bezel, lugs integral with the band'],['Dial','Applied faceted batons, subsidiary seconds'],['Complication','Small seconds at 6']],
  notes:['The reference that set the template for the round dress watch.','Usually read as the Bauhaus rule that form follows function, applied to a wristwatch.'],
  q:{t:'Which design principle is the ref. 96 associated with?', a:'Bauhaus: form follows function', w:['Art Nouveau ornament','Streamline Moderne','Brutalism']}
},
{
  id:'royaloak', brand:'Audemars Piguet', model:'Royal Oak', ref:'5402', year:'1972', span:'1972 – c. 1990', kind:'Luxury sports watch',
  c:{shape:'octagon', d:39, t:[7,'v'], lug:null},
  dial:{dark:true, markers:'baton', tapisserie:true, date:3, text:['AUDEMARS PIGUET','AUTOMATIC']},
  hands:'baton', sec:'none', crown:{pos:3, hex:true}, strap:'integrated',
  mv:{cal:'2121', type:'auto', vph:19800, wind:'Automatic, full rotor', size:'28.4 mm × 3.05 mm', note:'Extra-thin automatic derived from the Jaeger-LeCoultre cal. 920.'},
  back:{type:'bolts', note:'Eight nuts receive the bolts that pass down through bezel, gasket and case.'},
  specs:[['Design','Gérald Genta'],['Bezel','Octagonal, eight hexagonal white-gold bolts'],['Dial','“Petite tapisserie” guilloché'],['Bracelet','Integrated, tapering steel']],
  notes:['A steel watch priced above gold ones, shown at Basel in 1972.','The bezel bolts are functional: they clamp the case together around its gasket.','No seconds hand.'],
  q:{t:'How many hexagonal bolts hold down the Royal Oak’s bezel?', a:'Eight', w:['Six','Ten','Twelve']}
},
{
  id:'62mas', brand:'Seiko', model:'62MAS', ref:'6217-8000 / 8001', year:'1965', span:'1965 – c. 1968', kind:'Dive watch',
  c:{shape:'round', d:37, t:[13.5,'a'], lug:[19,'a']},
  bezel:{type:'dive', w:3.4}, dial:{dark:true, markers:'block', date:3, text:['SEIKO','DIVER’S 150m']},
  hands:'baton', sec:'center', crown:{pos:3, big:true}, strap:'tropic',
  mv:{cal:'6217A', type:'auto', vph:18000, jewels:17, wind:'Automatic, full rotor'},
  back:{type:'screw', emblem:'Dolphin emblem', note:'Screw back. The dolphin emblem is indicated, not reproduced.'},
  specs:[['Water resistance','150 m'],['Complication','Date at 3'],['Bezel','Rotating, sixty-minute scale']],
  notes:['Japan’s first professional dive watch.','The nickname contracts “autoMAtic Selfdater”, from the 62-series movement family.'],
  q:{t:'What distinction does the 62MAS hold?', a:'Japan’s first professional dive watch', w:['The first quartz dive watch','The first titanium watch case','The first watch on the Moon']}
},
{
  id:'6139', brand:'Seiko', model:'5 Sports Speed-Timer', ref:'6139-6002', year:'c. 1970', span:'Cal. 6139 from 1969', kind:'Chronograph',
  c:{shape:'cushion', d:41, da:'a', t:[13.5,'n'], lug:[19,'a']},
  bezel:{type:'tachy', w:2.6, dark:true}, dial:{dark:false, markers:'baton', flange:'minutes', date:3, daydate:true, subs:[[6,'min30']], text:['SEIKO','CHRONOGRAPH']},
  hands:'baton', sec:'none', chrono:true, crown:{pos:3}, pushers:'pump', strap:'oyster',
  mv:{cal:'6139', type:'autochrono', vph:21600, wind:'Automatic, full rotor', note:'Column wheel with vertical clutch. No running-seconds hand.'},
  back:{type:'screw', note:'Screw back. Engraving omitted.'},
  specs:[['Dial','Single 30-minute register at 6'],['Complication','Day and date at 3'],['Inner ring','Rotating, turned by the crown']],
  notes:['One of the 1969 automatic chronographs, and the first to pair a column wheel with a vertical clutch.','Astronaut William Pogue carried a yellow-dialled example aboard Skylab 4 in 1973–74.','With no running seconds, the watch looks still until you start the chronograph.'],
  q:{t:'Who wore a 6139 aboard Skylab 4?', a:'William Pogue', w:['Buzz Aldrin','Wally Schirra','Scott Carpenter']}
},
{
  id:'challenge', brand:'Citizen', model:'Challenge Diver 150 m', ref:'52-0110', year:'1977', span:'1970s – early 1980s', kind:'Dive watch',
  c:{shape:'round', d:40, t:[13,'n'], lug:[20,'v']},
  bezel:{type:'dive', w:3.7}, dial:{dark:true, markers:'dive', date:3, text:['CITIZEN','150m']},
  hands:'sword', sec:'center', crown:{pos:3, big:true}, strap:'tropic',
  mv:{cal:'not verified', type:'auto', vph:21600, wind:'Automatic', note:'The original calibre could not be verified and is omitted. Beat rate assumed for drawing.'},
  back:{type:'screw', note:'Screw back. Engraving omitted.'},
  specs:[['Water resistance','150 m'],['Crown','Large, screw-down'],['Complication','Date at 3']],
  notes:['In 1983 an example was found on Long Reef beach in Australia, encrusted with barnacles and still running.','That watch gave the model its Japanese nickname, “Fujitsubo”: barnacle.','Dial and hand details here are representative; several variants exist.'],
  q:{t:'What made one Challenge Diver famous in 1983?', a:'It washed up covered in barnacles, still running', w:['It reached the bottom of the Mariana Trench','It was worn on the Space Shuttle','It survived an Everest ascent']}
},
{
  id:'ventura', brand:'Hamilton', model:'Ventura', ref:'-', year:'1957', span:'1957 – 1963', kind:'Electric watch',
  c:{shape:'shield', w:32, h:50, da:'a', t:[11,'n'], lug:null},
  dial:{dark:true, markers:'ventura', text:['HAMILTON','ELECTRIC']},
  hands:'dauphine', sec:'center', crown:{pos:3, small:true}, strap:'leather',
  mv:{cal:'500', type:'electric', vph:18000, wind:'Battery-driven balance', note:'A coil carried on the balance wheel is impulsed by fixed magnets. Beat rate assumed for drawing. Succeeded by the cal. 505.'},
  back:{type:'plainshield', note:'Detail not verified; shown plain.'},
  specs:[['Design','Richard Arbib'],['Case','Asymmetrical shield, 14 k gold'],['Power','Battery']],
  notes:['The first battery-powered wristwatch offered to the public, announced in January 1957.','Arbib’s case owes more to tail fins than to watchmaking tradition.','Elvis Presley wore one in “Blue Hawaii”.','Case outline and dial ornament are interpretive; overall size is approximate.'],
  q:{t:'What was new about the Ventura in 1957?', a:'It ran on a battery', w:['It was the first automatic','It had the first sapphire crystal','It used a quartz crystal']}
},
{
  id:'spaceview', brand:'Bulova', model:'Accutron Spaceview', ref:'Cal. 214', year:'1960', span:'1960 – 1970s', kind:'Electronic watch',
  c:{shape:'round', d:34, da:'a', t:[12,'n'], lug:[18,'a']},
  bezel:{type:'plain', w:1.5}, dial:{dark:false, markers:'spaceview', text:['ACCUTRON']},
  hands:'pencil', sec:'center', crown:{pos:0}, strap:'leather',
  mv:{cal:'214', type:'fork', vph:0, wind:'Battery-driven tuning fork, 360 Hz', note:'A transistor circuit keeps the fork vibrating; a pawl on one tine advances a minute index wheel.'},
  back:{type:'accutron', note:'No crown on the flank. A folding handle on the back sets the hands; a hatch covers the battery.'},
  specs:[['Regulator','Tuning fork, 360 Hz'],['Dial','None: the movement is the dial'],['Engineer','Max Hetzel']],
  notes:['The Spaceview began as a dealer’s demonstration piece with the dial left off. Customers asked to buy it.','It hums rather than ticks, and the seconds hand glides.','Bulova guaranteed accuracy to a minute a month.'],
  q:{t:'What regulates the Accutron?', a:'A tuning fork vibrating at 360 Hz', w:['A quartz crystal','A balance wheel at 36,000 A/h','A pendulum']}
}
];
/* The Archive is shown in alphabetical order, by maker and then by model, whatever order the plates are written in above. */
window.WATCHES.sort((a, b) => (a.brand + ' ' + a.model).localeCompare(b.brand + ' ' + b.model));
