/* Load the licensed Porsche 911 Sketchfab 3D viewer only after a click. */
(() => {
'use strict';
const root=document.querySelector('[data-sculpture]');if(!root)return;
const button=root.querySelector('[data-model-load]');
const poster=root.querySelector('[data-model-poster]');
const mount=root.querySelector('[data-model-frame]');
const status=root.querySelector('[data-model-status]');
if(!button||!poster||!mount||!status)return;
let activated=false;
button.addEventListener('click',()=>{
 if(activated)return;activated=true;
 const frame=document.createElement('iframe');
 frame.title='Porsche 911 Carrera 4S – interaktives 3D-Modell von Lionsharp Studios';
 frame.setAttribute('allow','autoplay; fullscreen; xr-spatial-tracking');
 frame.setAttribute('allowfullscreen','');
 frame.referrerPolicy='strict-origin-when-cross-origin';
 frame.loading='eager';
 frame.src='https://sketchfab.com/models/d01b254483794de3819786d93e0e1ebf/embed?autostart=1&autospin=0.12&scrollwheel=0&ui_infos=0&ui_hint=0&ui_ar=0&ui_vr=0';
 frame.addEventListener('load',()=>{status.textContent='Mit Maus oder Finger frei drehen.';});
 mount.append(frame);mount.hidden=false;poster.hidden=true;
 status.textContent='Interaktives Modell wird geladen …';
});
})();