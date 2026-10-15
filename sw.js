/* Offline PDF · speichert nur App-Dateien, niemals Nutzerdokumente. */
'use strict';
const PREFIX='offline-pdf:'+self.registration.scope;
const CACHE=PREFIX+':v1';
const APP=['./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'].map(path=>new URL(path,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(APP.map(url=>new Request(url,{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith(PREFIX+':')&&name!==CACHE).map(name=>caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match(APP[0])).then(response=>response||Response.error()));
  }else if(APP.includes(url.href)){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.href)).then(response=>response||Response.error()));
  }
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='OFFLINE_STATUS')return;
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    const results=await Promise.all(APP.map(url=>cache.match(url)));
    event.ports[0]?.postMessage({ready:results.every(Boolean)});
  })());
});
