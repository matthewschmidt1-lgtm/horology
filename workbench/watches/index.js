// Registry of Workbench watches. Add a record file beside this one and list it here.
// They are shown in alphabetical order, by maker and then by model. The page opens on `first`.
import speedmaster from './speedmaster-105003.js';
import submariner from './submariner-5513.js';
import calatrava from './calatrava-96.js';
import elPrimero from './el-primero-a386.js';
import spaceview from './accutron-spaceview.js';
import royalOak from './royal-oak-5402.js';
import monaco from './monaco-1133b.js';
import tank from './tank-louis-cartier.js';
import daytona from './daytona-6263.js';
import seiko62mas from './seiko-62mas.js';
import carrera from './carrera-2447.js';
import explorer from './explorer-1016.js';
import navitimer from './navitimer-806.js';
import patek3974 from './patek-3974.js';
import gyro3 from './jlc-gyrotourbillon-3.js';
import langeGC from './lange-grand-complication.js';

const all = [speedmaster, submariner, calatrava, elPrimero, spaceview, royalOak, monaco, tank, daytona, seiko62mas, carrera, explorer, navitimer, patek3974, gyro3, langeGC];
export const watches = all.slice().sort((a, b) => (a.brand + ' ' + a.model).localeCompare(b.brand + ' ' + b.model));
export const first = speedmaster; // the Speedmaster, whose movement is laid out from the fullest source, stays the watch the Workbench opens on
