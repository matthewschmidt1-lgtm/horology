/* The Scrolling History of Horology: content.
   Kept apart from the page code so the text can be corrected without touching it.
   `c` on a beat lists source numbers from SOURCES below. Beats without one repeat
   what the general literature says and were not individually checked. */
window.HX = {
  sources: [
    ['The Walters Art Museum, “Spherical Table Watch (Melanchthon’s Watch)”, acc. 58.17', 'https://art.thewalters.org/detail/58.17'],
    ['The Seiko Museum Ginza, “The lever escapement that led to modern developments”', 'https://museum.seiko.co.jp/en/knowledge/MechanicalTimepieces06/'],
    ['Royal Collection Trust, “George III and Queen Charlotte” (Mudge’s lever watch of 1770)', 'https://www.rct.uk/collection/publications/george-iii-and-queen-charlotte-0'],
    ['Swatch Group, “Breguet: Bicentennial of the first wristwatch” (2012)', 'https://www.swatchgroup.com/en/services/archive/2012/breguet-bicentennial-first-wristwatch'],
    ['Watchonista, “Louis Moinet, or the first chronograph’s history revisited”', 'https://www.watchonista.com/articles/louis-moinet-or-first-chronographs-history-revisited'],
    ['Sotheby’s, “The Essential Guide to the Cartier Santos”', 'https://www.sothebys.com/en/articles/the-essential-guide-to-the-cartier-santos'],
    ['Wikipedia, “John Harwood (watchmaker)”', 'https://en.wikipedia.org/wiki/John_Harwood_(watchmaker)'],
    ['A Collected Man, “The Story of the ‘Dirty Dozen’”', 'https://www.acollectedman.com/blogs/journal/dirty-dozen-first-wristwatches-specially-commissioned-for-british-army'],
    ['Fratello, “The very first modern dive watch was a Blancpain Fifty Fathoms”', 'https://www.fratellowatches.com/the-very-first-modern-dive-watch-was-a-blancpain-fifty-fathoms'],
    ['Epson, “Seiko Quartz Astron 35SQ” (milestone products)', 'https://corporate-origin.epson.biz/en/about/history/milestone-products/1969-12-35sq.html'],
    ['Federation of the Swiss Watch Industry, “The Swiss watch industry today”', 'https://www.fhs.swiss/watchindustrytoday.html'],
    ['Strategy Analytics via Business Wire, “Apple Watch Outsells the Entire Swiss Watch Industry in 2019”', 'https://www.businesswire.com/news/home/20200205005756/en/Strategy-Analytics-Apple-Watch-Outsells-Entire-Swiss'],
    ['Crown & Caliber, “What is a Co-Axial Escapement?”', 'https://www.crownandcaliber.com/p/what-is-a-co-axial-escapement'],
    ['SJX Watches, “Citizen Remakes Lost-at-Sea Diver’s Watch” (2022)', 'https://watchesbysjx.com/2022/03/citizen-promaster-diver-200m-fujitsubo-nb6021.html']
  ],

  // The opening sequence: one object, drawn at one scale, across five centuries.
  evolution: [
    { y: 'c. 1550', fig: 'drum', h: 'A jewel that ticks', t: 'Worn on a chain at the neck or belt. One hand, because it could not be trusted with minutes.', m: [['Size', 'about 50 mm'], ['Regulated by', 'a bare balance, no spring'], ['Wrong by', 'tens of minutes a day']] },
    { y: 'c. 1760', fig: 'verge', h: 'Into the pocket', t: 'Two hands now, under a white enamel dial. Wound each day with a key.', m: [['Size', 'about 46 mm'], ['Regulated by', 'balance and spiral spring'], ['Wrong by', 'minutes a day']] },
    { y: 'c. 1915', fig: 'trench', h: 'Onto the wrist, by necessity', t: 'A small pocket movement with wire loops soldered on for a strap. Numerals that glow.', m: [['Size', 'about 33 mm'], ['Regulated by', 'lever escapement'], ['Wrong by', 'under a minute a day']] },
    { y: '1922', fig: 'w:tanklc', h: 'Onto the wrist, by design', t: 'Case and strap drawn as one line. The watch has stopped apologising for where it is worn.', m: [['Size', 'about 23 mm wide'], ['Regulated by', 'lever escapement'], ['Made for', 'being looked at']] },
    { y: '1962', fig: 'w:sub5513', h: 'A tool', t: 'Sealed against 200 metres of water, wound by the wearer’s own movement, read in the dark.', m: [['Size', '40 mm'], ['Wound by', 'a rotor'], ['Wrong by', 'seconds a day']] },
    { y: '1969', fig: 'astron', h: 'Quartz', t: 'A crystal vibrating thousands of times a second replaces the balance. The seconds hand jumps once, exactly, each second.', m: [['Size', 'about 36 mm'], ['Regulated by', 'quartz crystal'], ['Wrong by', 'five seconds a month']] },
    { y: 'Today', fig: 'back', h: 'Mechanical again, by choice', t: 'Outperformed for half a century and more wanted than ever. The movement is now what you are meant to look at.', m: [['Size', 'about 40 mm'], ['Regulated by', 'the same lever and balance'], ['Bought for', 'what it is']] }
  ],

  eras: [
    {
      id: 'e1', from: 1500, to: 1699, range: '1500s – 1600s', short: '1500s',
      title: 'Time leaves the tower',
      dek: 'For two centuries a watch was jewellery that happened to tick. Then one spring, finer than a hair, made it an instrument.',
      figs: [
        { k: 'drum', cap: 'Drum watch, mid-1500s. Gilt case, a single hand, and raised studs at each hour for feeling the time in the dark.' },
        { k: 'verge', cap: 'Pocket watch, late 1600s onward. Once the balance spring arrived, a minute hand was worth having.' }
      ],
      beats: [
        { y: '1400s', h: 'A spring instead of a weight', t: 'Clocks had been driven by falling weights, which kept them on walls and in towers. A coiled spring stores the same energy in a drum the size of a coin. Once a clock had a spring, it could travel.' },
        { y: 'c. 1510', h: 'Nuremberg', t: 'Tradition gives the first watches to Peter Henlein, a locksmith of Nuremberg, who was making small spring-driven timepieces by about 1510. Whether he was first cannot be proved, and the famous “Nuremberg egg” is a label from a later century.' },
        { y: '1530', h: 'The oldest date on a watch', t: 'A gilt sphere now in the Walters Art Museum is engraved with the name of the reformer Philip Melanchthon and the year 1530. The museum calls it the earliest dated watch known. It carries no maker’s mark.', c: [1] },
        { kind: 'inv', h: 'How it kept time, roughly', rows: [['Verge', 'An escapement inherited from tower clocks. It worked, crudely.'], ['Fusee', 'A cone and cord that evened out the pull of the spring as it ran down.'], ['One hand', 'A watch could wander by tens of minutes in a day. Minutes were not worth showing.']] },
        { y: '1541', kind: 'world', h: 'Geneva', t: 'Calvin’s reforms discouraged the wearing of jewellery. Geneva’s goldsmiths, the story goes, turned to an ornament that was still allowed. By 1601 the city’s watchmakers had a guild of their own.' },
        { y: '1675', f: 1, h: 'The balance spring', t: 'Christiaan Huygens published a spiral spring to govern the balance wheel. Robert Hooke said the idea was his, and the quarrel has never been settled. The result is not in doubt: errors fell from many minutes a day to a few, and watches gained a minute hand.' },
        { y: 'Later 1600s', f: 1, kind: 'world', h: 'The waistcoat', t: 'Around the same time the waistcoat came into fashion at the English court. Watches moved off chains and belts and into a pocket, and their cases grew flatter and smoother to suit it.' },
        { kind: 'makers', f: 1, h: 'Who made them', t: 'Not companies yet. Individual masters and their guilds, in Nuremberg and Augsburg, then Blois, Geneva and London.' }
      ]
    },
    {
      id: 'e2', from: 1700, to: 1799, range: '1700s', short: '1700s',
      title: 'Ornament and ingenuity',
      dek: 'Enamellers, engravers and chasers made the watch a work of art. Behind the decoration, a handful of men solved its hardest problems.',
      figs: [{ k: 'verge', cap: 'Verge pocket watch, mid-1700s. Enamel dial, Roman hours, Arabic minutes, and a square in the dial for the winding key.' }],
      beats: [
        { y: '1685', kind: 'world', h: 'Refugees with skills', t: 'When France revoked the Edict of Nantes, Protestant craftsmen left in their thousands. Many settled in Geneva and London, which became the two capitals of watchmaking for the next century.' },
        { y: '1704', h: 'Jewels', t: 'In London, Nicolas Fatio de Duillier and the Debaufre brothers patented a way to pierce rubies for use as bearings. Hard, smooth and almost frictionless: watches still count their jewels.' },
        { y: '1759', h: 'A watch that found longitude', t: 'John Harrison, a Yorkshire carpenter, finished his fourth marine timekeeper. It was not a clock but a large watch. On a voyage to Jamaica it lost about five seconds, and a ship’s captain could at last know how far east or west he was.' },
        { kind: 'inv', h: 'Invented, then ignored', c: [2, 3], rows: [['c. 1754', 'Thomas Mudge invents the detached lever escapement.'], ['c. 1770', 'He first fits it to a watch, made for Queen Charlotte.'], ['1800s', 'It becomes the standard escapement. It still is.']], note: 'The gap between an invention and its adoption is the real rhythm of this history. Watch for it again.' },
        { y: 'c. 1770', h: 'Thinner', t: 'Jean-Antoine Lépine rebuilt the movement around separate bridges in place of two full plates. Watches could finally be slim. The layout he drew is the ancestor of every movement in this archive.' },
        { y: '1775', h: 'Breguet', t: 'Abraham-Louis Breguet opened his workshop in Paris. Over fifty years he added shock protection, the overcoil balance spring, a self-winding watch and, in 1801, the tourbillon. Marie Antoinette and Napoleon were both customers.' },
        { kind: 'world', h: 'What it looked like', t: 'Painted enamel scenes, gold worked in relief, and pair cases: a plain inner case inside a decorated outer one. A fine watch was among the costliest things a person could own, and it looked it.' },
        { kind: 'makers', h: 'Houses that survive', t: 'Blancpain (1735), Vacheron Constantin (1755), Breguet (1775). Founding dates as the houses give them.' }
      ]
    },
    {
      id: 'e3', from: 1800, to: 1899, range: '1800s', short: '1800s',
      title: 'Precision by the thousand',
      dek: 'Railways needed everyone to agree on the time. Factories learned to make accuracy cheap. The watch stopped being a treasure and became equipment.',
      figs: [{ k: 'railroad', cap: 'Railroad-grade pocket watch, 1890s. Bold Arabic numerals, an open face, and winding by the crown at twelve.' }],
      beats: [
        { y: '1810', h: 'A watch for a queen’s wrist', t: 'Breguet’s ledgers record an order from Caroline Murat, Queen of Naples, for a repeating watch on a wristlet of hair and gold thread. Delivered in 1812 and since lost, it is the earliest wristwatch on record. For a century afterwards, a wristwatch was a lady’s bracelet.', c: [4] },
        { y: '1816', h: 'Timing the stars', t: 'Louis Moinet built a pocket instrument that measured sixtieths of a second, for astronomy. It resurfaced only in the 2010s and displaced Nicolas Rieussec’s device of 1821 as the first chronograph. Rieussec keeps the word, though: his machine marked elapsed time in ink, so it wrote time.', c: [5] },
        { y: '1842', h: 'No more keys', t: 'Adrien Philippe devised a way to wind and set a watch by its crown. He went into partnership with Antoine Norbert de Patek, and from 1851 the firm was Patek Philippe.' },
        { y: '1850s', h: 'The American system', t: 'At Waltham, Massachusetts, Aaron Dennison set out to make watches the way muskets were made: by machine, with interchangeable parts. At the Philadelphia exhibition of 1876 the Swiss saw what the factories could do, and went home to rebuild their own industry.' },
        { y: '1867', h: 'A watch for a worker', t: 'Georges Frédéric Roskopf designed a watch with far fewer parts, to be sold for about a labourer’s weekly wage. The trade sneered. It sold in millions.' },
        { y: '1883 – 1891', kind: 'world', h: 'Railway time', t: 'American railroads imposed standard time zones in 1883. In 1891 two trains collided at Kipton, Ohio, after an engineer’s watch stopped for four minutes. The railroads answered with strict standards for the watches their men carried: the first mass specification for accuracy.' },
        { kind: 'makers', h: 'Founded this century', t: 'Longines (1832), Patek Philippe (1839), A. Lange & Söhne (1845), Omega (1848), Waltham (1850), Heuer (1860), Zenith (1865), IWC (1868), Audemars Piguet (1875), Seiko (1881).' }
      ]
    },
    {
      id: 'e4', from: 1900, to: 1939, range: '1900 – 1930s', short: '1900',
      title: 'The watch moves to the wrist',
      dek: 'In 1900 a man with a watch on his wrist was thought eccentric. By 1930 he was simply dressed.',
      figs: [
        { k: 'trench', cap: 'Trench watch, c. 1915. Wire lugs, luminous numerals, small seconds.' },
        { k: 'w:tanklc' }, { k: 'w:reverso' }, { k: 'w:calatrava' }
      ],
      beats: [
        { y: '1904', h: 'A pilot’s problem', t: 'The aviator Alberto Santos-Dumont told his friend Louis Cartier that he could not let go of the controls to pull out a pocket watch. Cartier made him one for the wrist. It went on sale to the public in 1911.', c: [6] },
        { y: '1914 – 1918', h: 'The trenches', t: 'An officer timing a barrage could not fumble in a pocket. Small pocket movements were given wire lugs and a strap, numerals painted with radium, sometimes a metal grille over the glass. Millions of men came home wearing one. The wristwatch was no longer a woman’s ornament.' },
        { y: '1917', f: 1, h: 'The Tank', t: 'Louis Cartier drew a watch whose sides ran on to become the lugs, so that strap and case made one line. For the first time a wristwatch looked designed for the wrist and not adapted to it.' },
        { y: '1926', f: 1, h: 'Sealed', t: 'The Rolex Oyster screwed shut at the bezel, the back and the crown. The next year Mercedes Gleitze wore one on a Channel swim, and Rolex bought the front page of the Daily Mail to say so.' },
        { kind: 'inv', f: 1, h: 'Winding itself', c: [7], rows: [['1923', 'John Harwood, an English watchmaker, patents a self-winding wristwatch.'], ['By 1926', 'It is in production in Switzerland. The firm does not survive the Depression.'], ['1931', 'Rolex introduces a rotor that turns a full circle: the form used ever since.']] },
        { y: '1931', f: 2, h: 'The Reverso', t: 'Polo players in British India wanted a watch whose glass would survive a match. The answer was a case that slides in its frame and turns over, showing the game a blank steel back.' },
        { y: '1932', f: 3, h: 'The Calatrava', t: 'Patek Philippe’s reference 96: a round case, a flat bezel, lugs that grow out of the case in one curve, and nothing else. It set the pattern for the dress watch for the rest of the century.' },
        { kind: 'world', f: 3, h: 'Art Deco', t: 'Rectangles, stepped cases, sector dials: the watch took its lines from architecture and the motor car. By about 1930 wristwatches were outselling pocket watches.' }
      ],
      compare: [
        { title: 'From pocket to wrist', text: 'The first wristwatches for men were pocket watches made smaller. Compare the numerals, the hands and the seconds dial: only the lugs and strap are new.', items: [['railroad', 'Pocket watch, 1890s', 'About 50 mm'], ['trench', 'Trench watch, c. 1915', 'About 33 mm']] },
        { title: 'Finding a shape', text: 'Fifteen years took the wristwatch from an improvised round pocket movement to forms made for the wrist, and back to round again, this time on purpose.', items: [['trench', 'c. 1915', 'Adapted'], ['w:tanklc', '1917 – 1922', 'Designed'], ['w:calatrava', '1932', 'Resolved']] }
      ]
    },
    {
      id: 'e5', from: 1940, to: 1969, range: '1940s – 1960s', short: '1940',
      title: 'The golden age',
      dek: 'War wrote the specification. Peace found the uses: under the sea, in the cockpit, on the racetrack, on the Moon.',
      figs: [{ k: 'w:explorer1016' }, { k: 'w:sub5513' }, { k: 'w:navitimer' }, { k: 'w:speedy105003' }, { k: 'w:a386' }],
      beats: [
        { y: '1945', h: 'Written down', t: 'The British Ministry of Defence ordered a wristwatch to a written standard: black dial, Arabic numerals, luminous hands, small seconds, proof against water and shock. Twelve firms delivered, and collectors call the result the Dirty Dozen. Legibility had become a specification, and civilian watches kept it.', c: [8] },
        { y: '1953', f: 1, h: 'Under water', t: 'Blancpain’s Fifty Fathoms, made with French navy divers, and the Rolex Submariner arrived within months of each other. Both carried a rotating bezel for counting minutes of air. Blancpain reached the shops first, and the argument over priority continues.', c: [9] },
        { y: '1952 – 1954', f: 2, h: 'In the cockpit', t: 'Breitling wrapped a circular slide rule around a chronograph. A pilot could work out fuel burn, ground speed and rate of climb on his wrist. The Navitimer became the watch of the Aircraft Owners and Pilots Association.' },
        { y: '1957', f: 3, h: 'On the track', t: 'Omega moved the tachymeter scale off the dial and onto the bezel, where a racing driver could read it. NASA tested the Speedmaster against its rivals until the others failed, and in 1965 cleared it for every crewed mission. In 1969 it went to the Moon.' },
        { kind: 'inv', f: 4, h: 'New ways to drive a watch', rows: [['1957', 'Hamilton’s Ventura: a battery replaces the mainspring.'], ['1960', 'Bulova’s Accutron: a humming tuning fork replaces the balance.'], ['1969', 'Three rival teams each produce an automatic chronograph in the same year.']], links: [['ventura', 'Ventura'], ['spaceview', 'Accutron'], ['monaco', 'Monaco'], ['6139', 'Seiko 6139']] },
        { kind: 'world', f: 4, h: 'The good years', t: 'Switzerland made around half the world’s watches. A good mechanical watch was something a person bought once and wore for life. Nobody in the valleys was worried about electronics.' },
        { kind: 'makers', f: 4, h: 'The names on the dials', t: 'Rolex, Omega, Blancpain, Breitling, Heuer, Universal Genève, Longines, Zenith, Seiko, Hamilton, Bulova.' }
      ],
      compare: [
        { title: 'What the army asked for', text: 'Thirty years apart, the same rules: dark dial, plain numerals, hands that glow. Military specifications fixed what a readable watch looks like.', items: [['trench', 'Trench watch, c. 1915', 'Improvised'], ['w:explorer1016', 'Rolex Explorer, 1963', 'Codified']] },
        { title: 'What the sea added', text: 'Same maker, same decade, same black dial. Diving added a rotating bezel to count the minutes, shoulders to guard the crown, and a thicker case to hold back the pressure.', items: [['w:explorer1016', 'Explorer', '36 mm'], ['w:sub5513', 'Submariner', '40 mm, 200 m']] },
        { title: 'Three chronographs, three jobs', text: 'A stopwatch is only half the instrument. The scale around it says what it is for: a slide rule for flying, fine fifths of a second for the pits, a tachymeter for speed.', items: [['w:navitimer', 'Navitimer', 'Aviation'], ['w:carrera', 'Carrera', 'Motorsport'], ['w:speedy105003', 'Speedmaster', 'Racing, then space']] }
      ]
    },
    {
      id: 'e6', from: 1970, to: 1989, range: '1970s – 1980s', short: '1970',
      title: 'The quartz revolution',
      dek: 'On Christmas Day 1969 a watch went on sale in Tokyo that was a hundred times more accurate than anything with a balance wheel. Within twenty years, two-thirds of Swiss watchmaking jobs were gone.',
      figs: [
        { k: 'astron', cap: 'Quartz analogue watch, c. 1970. An illustrative drawing, not the Astron’s exact case. Watch the seconds hand: one clean jump a second.' },
        { k: 'led', cap: 'LED digital watch, c. 1972. An illustrative drawing of the type. It is showing your time.' },
        { k: 'w:royaloak' }, { k: 'w:a386' }
      ],
      beats: [
        { y: '25 December 1969', h: 'Astron', t: 'Seiko’s Quartz Astron cost 450,000 yen, about the price of a small car, and kept time to five seconds a month.', c: [10] },
        { y: '1972', f: 1, h: 'Numbers that glow', t: 'The Hamilton Pulsar had no hands and no moving parts. Press a button and red digits lit. In gold it cost more than a Rolex. Within a few years a digital watch cost a few dollars.' },
        { kind: 'inv', f: 1, h: 'What quartz did to the shape of a watch', rows: [['Thinner', 'No tall balance, no rotor: the movement is a flat disc.'], ['Not round', 'A digital display has no hands to sweep, so the case can be any shape.'], ['Sealed', 'Nothing to wind, and nothing to service for years.']] },
        { y: '1970 – 1988', f: 1, kind: 'world', h: 'The crisis', t: 'Swiss watchmaking employed about 90,000 people in 1970 and little more than 30,000 by the late 1980s. Of some 1,600 companies, about 600 were left. Quartz was not the only cause, but it was the one nobody could argue with.', c: [11] },
        { y: '1972', f: 2, h: 'Steel at the price of gold', t: 'If accuracy was now free, a mechanical watch had to be about something else. Audemars Piguet asked Gérald Genta for a steel sports watch and priced it above gold ones. The Royal Oak invented a category and saved a company.' },
        { y: '1975', f: 3, h: 'Hidden in the attic', t: 'Zenith’s American owners ordered mechanical production stopped and the tooling scrapped. A foreman, Charles Vermot, carried the presses and plans for the El Primero up to an attic and hid them. A decade later they were needed again.' },
        { y: '1983', f: 3, h: 'Plastic', t: 'The Swatch had 51 parts, where a conventional watch had ninety or more, and was assembled by robots and sold as fashion. It gave the Swiss the volume to survive. The profits later paid for the revival of the old mechanical names.' },
        { kind: 'makers', f: 3, h: 'The names that mattered', t: 'Seiko, Citizen, Casio, Hamilton, Texas Instruments, Audemars Piguet, Patek Philippe, Swatch.' }
      ],
      compare: [
        { title: 'Two answers to 1972', text: 'One watch said the future was electronic and needed no hands. The other said a mechanical watch could be a luxury because it was unnecessary. Both were right.', items: [['led', 'LED digital, 1972', 'Accuracy for everyone'], ['w:royaloak', 'Royal Oak, 1972', 'Craft as the point']] }
      ]
    },
    {
      id: 'e7', from: 1990, to: new Date().getFullYear(), range: '1990s – today', short: '1990',
      title: 'The mechanical renaissance',
      dek: 'Nobody needs a mechanical watch any more. That turned out to be the making of it.',
      figs: [
        { k: 'back', cap: 'Contemporary mechanical watch with a glass back. A generic schematic, not a particular calibre.' },
        { k: 'w:speedy105003' },
        { k: 'smart', cap: 'Smartwatch, 2015 onward. An illustrative outline.' }
      ],
      beats: [
        { y: '1980s', h: 'Never a quartz', t: 'Jean-Claude Biver relaunched the dormant name of Blancpain on a single promise: there had never been a quartz Blancpain, and there never would be.' },
        { y: '1994', h: 'Glashütte returns', t: 'After German reunification Walter Lange refounded the family firm that the East German state had taken in 1948. The first new A. Lange & Söhne watches were shown in 1994.' },
        { h: 'The glass back', t: 'Once the movement was the reason to buy, makers put a window in the case. Finishing that had been hidden for two centuries, bevelled and striped and polished by hand, went on show.' },
        { kind: 'inv', h: 'Invented, then adopted, again', c: [13], rows: [['c. 1974', 'George Daniels devises the co-axial escapement, which needs less oil than the lever.'], ['1980', 'He patents it. No manufacturer wants it.'], ['1999', 'Omega puts it into series production.']] },
        { y: '2010s', f: 1, h: 'Looking back', t: 'Makers began to remake their own past. Omega put calibre 321 back into production in 2019. Zenith reissued the A386. Citizen rebuilt the diver that had washed up on an Australian beach. The originals of all three are in this archive.', c: [14], links: [['speedy105003', 'Speedmaster 105.003'], ['a386', 'El Primero A386'], ['challenge', 'Citizen Challenge Diver']] },
        { y: '2015 – 2019', f: 2, kind: 'world', h: 'The computer on the wrist', t: 'The Apple Watch arrived in 2015. In 2019 an estimated 30.7 million were shipped, against 21.1 million watches from the whole of Switzerland.', c: [12] },
        { kind: 'makers', f: 0, h: 'Who makes them now', t: 'The old houses, most of them inside a few large groups, and a growing number of independent watchmakers working alone or in small workshops.' }
      ]
    }
  ],

  // Archive plates that also have a Workbench model.
  bench: { speedy105003: 'speedmaster-105003', sub5513: 'submariner-5513', calatrava: 'calatrava-96', a386: 'el-primero-a386' }
};
