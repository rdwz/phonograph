import Parser,{load} from '../parser'; 
import {CASTVIEW,STORAGEID} from '../../constants';
import {defaultCasts} from '../../podcast/podcast';
import fetchJ from 'smallfetch';
import randomColor from 'randomcolor';
import DB from './db';

const DEFAULTCAST = { domain: "www.npr.org/rss/podcast.php?id=510289" , protocol:'https:'};

let PROXY = {'https:':'/rss-pg/','http:':'/rss-less-pg/'};
let CACHED = {'https:':'/cacheds/','http:':'/cached/'};
let API = "/podcasts/";
let DEBUG = false;

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    DEBUG = true;
    PROXY = {'https:':'https://cors-anywhere.herokuapp.com/','http:':'https://cors-anywhere.herokuapp.com/'};
    CACHED = {'https:':'https://cors-anywhere.herokuapp.com/','http:':'https://cors-anywhere.herokuapp.com/'};
    API = `https://cors-anywhere.herokuapp.com/https://feedwrangler.net/api/v2/podcasts/`;
}

export const clearDomain = 
  (domain) => domain.replace(/(^\w+:|^)\/\//, '');


// Add & Remove Podcast
export const addPodcastToLibrary = function (podcast) {
  DB.set(podcast.domain,{
    ...podcast,
    lastUpdated:(Date.now())
  })
  .then(()=>{
    let podcasts = this.state.podcasts;
    podcasts[podcast.domain] = podcast;
    this.setState({podcasts});
  });
}

export const removePodcastFromLibrary = function(cast){
  DB.del(cast)
  .then(() =>{
    let podcastsState = this.state.podcasts;
    let podcasts = podcastsState.filter(podcast => podcast.domain !== cast);
    this.setState({podcasts})
  });
}

export const loadEpisodes = function(RSS) {
  RSS.forEach(item => this.episodes.set(item.guid, item));
}

export const fillPodcastContent = function(cast) {
    let podcast = (typeof cast === 'string') ? convertURLToPodcast(cast) : cast;
    let CORS_PROXY = PROXY[podcast.protocol];

    return new Promise((accept) => {
      DB.get(podcast.domain)
      .then(cast => {
        if(cast){ console.log('From Memory');
          this.setState({
            items: cast.items.slice(0,20),
            title: cast.title,
            description: cast.description,
            image: cast.image,
            link: cast.url,
            ...podcast
          },() => {
            // (( Date.now() - cast.lastUpdated ) < 600000 ) && // 6 Mins
            loadEpisodes.call(this,cast.items.slice(0,20));
            accept({...cast,...podcast});
            Parser(CORS_PROXY + podcast.domain)
            .then((RSS) => { 
              if (cast.items[0].title !== RSS.items[0].title){
                DB.set(podcast.domain,{
                  ...RSS, 
                  ...podcast,
                  lastUpdated:(Date.now())
                })
                .then((x) => { 
                  console.log("Updated Values")
                  // getTable().toArray()
                  // .then(podcasts=>this.setState({podcasts}));
                });
              }
            });
          })
        }else{ console.log('From Web');
          Parser(CORS_PROXY + podcast.domain)
          .then((RSS) => {
            console.log(RSS);
            DB.set(podcast.domain,{
              ...RSS,
              ...podcast,
              lastUpdated:(Date.now())
            })
            .then(()=>{
              let items = [...RSS.items].slice(0,20);
              let cast = {...RSS};
              cast['items'] = items;
              cast['domain'] = podcast.domain; 
              let podcasts = [cast,...this.state.podcasts];

              this.setState({
                title: RSS.title,
                image: RSS.image,
                link: RSS.url,
                description: RSS.description,
                domain: podcast.domain,
                items,
                podcasts,
              },() => { 
                loadEpisodes.call(this,items)
                accept({...RSS,...podcast});
              });

            });
          });
        }
       })
    })
    .catch(x=>console.log('Error with fillPodcastContent',x))
}

export const buildLibrary = function() {
  DB.toArray()
  .then( podcasts => { 
    if(podcasts.length){
      this.setState({ podcasts }) 
    }else{
      /// something
    } 
  });  
}

export const convertURLToPodcast = (url) =>{ // Todo: try https, then http otherwise fail.
  if (!url) return null;
  let fixURL = url.search("http") < 0 ? `https://${url}`: url;
  try{
    let podcast = new URL(fixURL);
    let domain =  clearDomain(podcast.href);
    let protocol = podcast.protocol
    return { domain , protocol };
  }catch(error){
    return null;
  }
}

export const driveThruDNS = (url) =>{
  let r = convertURLToPodcast(url);
  return DEBUG ? url : `${PROXY[r.protocol]}${r.domain}`;
}

// export const cachedContent = (url) =>{
//   let r = convertURLToPodcast(url);
//   return DEBUG ? url : `${CACHED[r.protocol]}${r.domain}`;
// }

// export const cacheImage= (url) =>{
//   let r = convertURLToPodcast(url);
//   return DEBUG ? url : `${PROXY[r.protocol]}${r.domain}`;
// }

// export const getPodcasts = function(podcasts){
//   return new Promise((acc,rej) => {
//     Promise.all(podcasts.map(cast =>{
//       let podcast = convertURLToPodcast(cast);
//       let CORS_PROXY = PROXY[podcast.protocol];
//       let found = sessionStorage.getItem(podcast.domain);
//       if(found){
//         return Promise.resolve(JSON.parse(found));
//       }else{
//         return new Promise((resolve,reject)=>{
//           load(CORS_PROXY + podcast.domain)
//           .then(RSS =>{
//               delete RSS['items'];
//               RSS.domain = podcast.domain;
//               resolve(RSS)
//           });
//         })
//       }
//     }))
//     .then(RSS => {
//       let clean = RSS.filter(rss=>rss['error']?false:true); 
//       clean.forEach((rss)=>{console.log('Saving',rss.domain);
//         sessionStorage.setItem(rss.domain,JSON.stringify(rss))
//       })
//       acc(clean);
//     })
//   })
// }

export const checkIfNewPodcastInURL = function() {
    if(!window && !window.location ) return DEFAULTCAST;
    let urlPodcast = new window.URL(window.location.href);
    let podcast = urlPodcast.searchParams.get("podcast");

    return convertURLToPodcast(podcast);
}

export const removeCurrentPodcast = function(){
  this.setState({ 
    items: null,
    title: '',
    image: null,
    link: null,
    description: '',
    podcast: null
  });
  this.episodes.clear();
}

export const addNewPodcast = function(newPodcast,callback){
  removeCurrentPodcast.call(this);
  fillPodcastContent.call(this, newPodcast)
  .then(podcast => { 
    callback && callback();
  });
  
}

export const getPopularPodcasts = function(){
  return new Promise( function(acc,rej){
    fetchJ(`${API}/popular`)
    .then(data=>acc(data.podcasts))
    .catch(err=>rej(err));
  })
}

export class PodcastSearcher {
  constructor(){
    let currentRequest = null;
  }
  search(term){
    this.currentRequest && this.currentRequest.abort();
    this.currentRequest = new AbortController();
    let {signal} = this.currentRequest;
    return new Promise((accept,reject) => 
                        fetch(`${API}/search?search_term=${term}`,{signal})
                        .then(result => result.ok && result.json().then(accept).catch(reject) || reject(result))
                        .catch(reject))
  }
}

const SFP = new PodcastSearcher();
export const searchForPodcasts = function(search){
  return new Promise( function(acc,rej){
    SFP.search(search)
    .then(data=>acc(data.podcasts))
    .catch(rej);
  });
}

export const getPodcastColor = 
(cast) => ({ backgroundColor:randomColor({seed:cast.title,luminosity:'dark',hue:'blue'}) } );
//Events

// Ask for podcast URL.
export const askForPodcast = function(callback){
  let input = prompt('URL or Name of Podcast');
      if(!input) return;
      input = input.trim();
  try{
    (new URL(input)) && addNewPodcast.call(this,convertURLToPodcast(input),callback);
  }catch(err){ // Maybe search the string?
    console.log('error',err);
  }  
}
// Load current Selectedt Podcast into View
export const loadPodcastToView = function(ev) {
    let podcast = ev && ev.currentTarget && ev.currentTarget.getAttribute('domain');
    console.log(podcast);
    return new Promise(acc => {
      DB.get(podcast)
      .then(cast =>{
        if(cast){
          let {title,image,description} = cast;
          this.setState({
            title,
            image,
            description,
            podcast
          })
        }
        fillPodcastContent.call(this,podcast);
        acc(cast)
      })
    })
    
}