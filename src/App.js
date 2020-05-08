import React, { useRef , Suspense, useReducer, useEffect } from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/core/styles";
import theme from "./theme";
import { reducer, initialState } from "./reducer"
import audioqueue from "audioqueue";
import Typography from "@material-ui/core/Typography";

import loadingAnimation from '../public/loading.svg';

// Router
import { withRouter } from "react-router";
import { Route, Redirect, useHistory } from "react-router-dom";

// Constants
import {
  ROOT,
  LIBVIEW,
  PODCASTVIEW,
  DISCOVERVIEW,
  SETTINGSVIEW,
} from "./constants";

// App Components
import Footer from "./core/Footer";

// Engine - Player Interactions
import playerFunctions from "./engine/player";

// Podcast Engine
import {
  getPodcastEngine,
  checkIfNewPodcastInURL,
  initializeLibrary,
} from "./engine";

import attachEvents from "./engine/events";

export const AppContext = React.createContext();
export const Consumer = AppContext.Consumer;


// Code Module
const Discover = React.lazy(async () => await import("./podcast/Discovery"));
const Library = React.lazy(async () => await import("./podcast/Library"));
const Settings = React.lazy(async () => await import("./podcast/Settings"));
const MediaControl = React.lazy(async () => await import("./core/MediaControl"));
const PodcastView = React.lazy( async () => await import("./podcast/PodcastView"));

const Loading = (props) => (
  <Typography
    align="center"
    style={{ display: "block", paddintTop: "40%" }}
  >
    <img src={loadingAnimation} width="4rem" />
  </Typography>
);

// Pausing for load or refresh
initialState['status'] = "pause";

const App = () => {

    const player = useRef(null); //new audioqueue([]);
    
    const [state, dispatch] = useReducer(reducer,initialState);
    const mediaFunctions = playerFunctions(player, dispatch, state)
    const history = useHistory();

    const loadPodcast = (podcast, cb) => {
      dispatch({type:'loadPodcast', payload: podcast});
      cb()
    } 


    // Mode
    const {newPodcast, shouldInit } = checkIfNewPodcastInURL();
    if(newPodcast){
      loadPodcast(newPodcast, () => history.push(PODCASTVIEW));
    }
    const engine = getPodcastEngine(shouldInit);
    
    useEffect(() => {
      initializeLibrary(engine, dispatch);
    },[]);

    useEffect(
      () => { 
        if(player.current) {
          console.log('audioReady', player.current)
          attachEvents(player.current, dispatch, state)
          window.player = player.current;
          player.current.currentTime = Number(state.currentTime) || 0;
        }
      },[player.current]);

    useEffect( () => localStorage.setItem('state',JSON.stringify(state)) , [state] );

    const finalTheme = state.theme === theme.os ? theme.dark : theme.light;

    return (
      <ThemeProvider theme={finalTheme}>
        <AppContext.Provider value={{ state, dispatch, engine, player: player.current }} >
          <CssBaseline />
           
           <Route
            exact
            path={[LIBVIEW, ROOT]}
            render={({history}) => { 
              return (
              <Suspense fallback={<Loading />}>
                <Library
                  history={history}
                  addPodcastHandler={() => history.push(DISCOVERVIEW)} //{this.askForPodcast}
                  actionAfterSelectPodcast={() => history.push(PODCASTVIEW)}
                />
              </Suspense>
            )}}
          /> 
          
          <Route
            path={PODCASTVIEW}
            render={({history}) =>
               state.current ? (
                  <Suspense fallback={<Loading />}>
                    <PodcastView history={history} />
                  </Suspense>
              ) : (<Redirect to={LIBVIEW} history />)
            }
          />

          <Route
            exact
            path={DISCOVERVIEW}
            render={({ history }) => (
              <Suspense fallback={<Loading />}>
                <Discover
                  history={history}
                  addPodcastHandler={loadPodcast}
                  actionAfterClick={() => history.push(PODCASTVIEW)}
                />
              </Suspense>
            )}
          />
   
          <Route
            path={SETTINGSVIEW}
            render={() => (
              <Suspense fallback={<Loading />}>
                <Settings
                  podcasts={state.podcasts}
                />
              </Suspense>
            )}
          />
     
          <Suspense fallback={<Loading />}>
            { player.current && <MediaControl
              player={player.current}
              handler={mediaFunctions.playButton}
              forward={mediaFunctions.forward30Seconds}
              rewind={mediaFunctions.rewind10Seconds}
              seek={mediaFunctions.seek}
            /> }
          </Suspense>

          <Footer path={location.pathname} />

          <audio
            autoPlay={state.status !== 'pause'}
            ref={player}
            preload="auto"
            title={ state.title || ""}
            src={state.media}
            // poster={(episode && episode.itunes && episode.itunes.image) || ""}
          />
        </AppContext.Provider>
      </ThemeProvider>
    );
}

export default withRouter(App);

