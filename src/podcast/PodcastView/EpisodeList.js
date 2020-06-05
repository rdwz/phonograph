import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import DialogContent from "@material-ui/core/DialogContent";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Chip, IconButton } from "@material-ui/core";
import createDOMPurify from "dompurify";
import { Consumer } from "../../App.js";
import PS from "podcastsuite";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import { completeEpisodeHistory as markAsFinished } from "../../reducer";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import DoneIcon from '@material-ui/icons/Done';

const DOMPurify = createDOMPurify(window);
const { sanitize } = DOMPurify;
const db = PS.createDatabase("history", "podcasts");

export const clearText = (html) => {
  let tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText;
};

export const styles = (theme) => ({

  inProgress: {
    color: theme.palette.primary.main,
  }
});

dayjs.extend(relativeTime);
const today = dayjs();
const episodeDate = (date) => today.from(date, true);

const saveOffline = async (mediaURL) => {
  // const audio = document.createElement('audio');
  // audio.src = mediaURL;
  // window.audio = audio;
  // console.log(audio.data);

  // const rawPodcast = await fetch('/rss-full/'+(mediaURL));
  // const podcastBlob = await rawPodcast.blob();
  // const response = new Response(podcastBlob)

  const cache = await caches.open("offline-podcasts");
  await cache.put(mediaURL, response);
  cache.add(mediaURL);
};

const IsAvaliable = (url) => {
  const [hasIt, setHasIt] = useState(false);

  const availableOffline = async (media) => {
    const has = await caches.has(media);
    setHasIt(has);
  };

  useEffect(() => {
    availableOffline(url.url);
  }, []);

  return hasIt ? "Saved" : "";
};

const EpisodeListDescription = (props) => {
  const episode = props.episode;
  const refresh = props.refresh;
  const classes = props.classes;
  const { currentTime, duration, completed } = props.history || {};
  const total = currentTime && duration ? Math.round((currentTime * 100) / duration) : null;
  // if (total) {
  //   return <div onClick={() => completeEpisode(guid)}>{total}%</div>;
  // }
  return (
    <ListItemText
      {...props}
      primary={
        <>
          {episode.season && (
            <Typography color={"secondary"}>Season {episode.season}</Typography>
          )}
          <Typography component="div" variant="subtitle1" noWrap>
            {clearText(episode.title)}{" "}
            <IsAvaliable url={episode.enclosures[0].url} />
          </Typography>
          <Typography variant="overline" component="div">
            {episodeDate(episode.created)}
            {!isNaN(refresh) && (completed || total ) && (
              <Chip
                style={{ marginLeft: "10px" }}
                variant="outlined"
                size="small"
                label={total ? `Progress: ${total}%` : "Completed"}
                // color="primary"
                className={classes.inProgress}
                deleteIcon={<DoneIcon />}
              />
            )}
            {
              episode.episodeType &&
              episode.episodeType !== "full" && (
                <Chip
                  style={{ marginLeft: "10px" }}
                  variant="outlined"
                  size="small"
                  label={episode.episodeType}
                  color="secondary"
                />
              )}
          </Typography>
        </>
      }
    />
  );
};

const Description = (props) => {
  const { title, description } = props.open || {};
  return (
    props.open && (
      <Dialog
        onClose={props.handleClose}
        aria-labelledby="simple-dialog-title"
        open={!!props.open}
      >
        <DialogTitle id="simple-dialog-title">
          <span dangerouslySetInnerHTML={{ __html: sanitize(title) }} />
        </DialogTitle>
        <DialogContent style={{ paddingBottom: "1rem" }}>
          <div dangerouslySetInnerHTML={{ __html: sanitize(description) }} />
        </DialogContent>
      </Dialog>
    )
  );
};

const EpisodeList = (props) => {
  const [episodeHistory, setEpisodeHistory] = useState({});
  const [open, setOpen] = React.useState(null);
  const [amount, setAmount] = React.useState(1);
  const [fresh, reFresh] = React.useState(Date.now());
  const { classes, episodes, podcast, playNext, playLast } = props;
  const episodeList = episodes.slice(0, 20 * amount);
  const [drawer, openDrawer] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  // console.log('heree',podcast);

  useEffect(() => {
    window && window.scrollTo && window.scrollTo(0, 0);
  }, []);

  const handleClose = (value) => {
    setOpen(null);
    // setSelectedValue(value);
  };

  const completeEpisode = async (episode) => {
    reFresh(Date.now());
    await markAsFinished(props.current, episode);
  };

  const whenToStart = (history = {}) => {
    return history.currentTime || null;
  };

  const getHistory = async (feed) => {
    const history = await db.get(feed);
    setEpisodeHistory(history || {});
  };

  const ShowProgress = ({ guid, episodeData }) => {
    const { currentTime, duration, completed } = episodeData;
    if (completed)
      return (
        <IconButton>
          <CheckCircleIcon style={{ color: "lightgreen" }} />
        </IconButton>
      );

    const total =
      currentTime && duration
        ? Math.round((currentTime * 100) / duration)
        : null;
    if (total) {
      return <div onClick={() => completeEpisode(guid)}>{total}%</div>;
    }
    return (
      <IconButton onClick={() => completeEpisode(guid)}>
        <CheckCircleOutlineIcon />
      </IconButton>
    );
  };

  const EpisodeDrawer = ({ open, onClose, onOpen, actions }) => (
    <SwipeableDrawer
      anchor={"bottom"}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
    >
      <EpisodeActions actions={actions} />
    </SwipeableDrawer>
  );

  const EpisodeActions = ({ actions = [] }) => (
    <List component="nav">
      {actions.map((action, key) => (
        <ListItem key={key} button onClick={action.callback}>
          <ListItemText primary={action.label} />
        </ListItem>
      ))}
    </List>
  );

  useEffect(() => {
    // console.log("getting new history");
    getHistory(props.current);
  }, [fresh, props.shouldRefresh]);
  return (
    <>
      <Description handleClose={handleClose} open={open} />
      <Consumer>
        {(state) => (
          <div className={classes.root}>
            <EpisodeDrawer
              onClose={() => {
                openDrawer(false);
                setCurrentEpisode(null);
              }}
              onOpen={() => openDrawer(true)}
              open={drawer}
              actions={[
                {
                  label: "Queue Next",
                  callback: () => {
                    openDrawer(false);
                    playNext(currentEpisode);
                  },
                },
                {
                  label: "Queue Last",
                  callback: () => {
                    openDrawer(false);
                    playLast(currentEpisode);
                  },
                },
                {
                  label: "Mark as Played",
                  callback: () => {
                    openDrawer(false);
                    completeEpisode(currentEpisode);
                  },
                },
                // {
                //   label: "Mark everything before as Played",
                //   callback: (guid) => openDrawer(false),
                // },
              ]}
            />
            {episodeList ? (
              <>
                <List>
                  {episodeList.map((episode, id) => {
                    const episodeData = episodeHistory[episode.guid] || {};
                    return (
                      <div key={episode.guid}>
                        <ListItem
                          className={
                            state.playing === episode.guid
                              ? classes.selected
                              : null
                          }
                          // button
                        >
                          <ListItemIcon>
                            <IconButton
                              onClick={props.handler(
                                episode.guid,
                                whenToStart(episodeData),
                                podcast
                              )}
                            >
                              {props.playing === episode.guid &&
                              props.status !== "pause" ? (
                                <PauseIcon className={classes.playIcon} />
                              ) : (
                                <PlayArrowIcon className={classes.playIcon} />
                              )}
                            </IconButton>
                          </ListItemIcon>
                          <EpisodeListDescription
                            classes={classes}
                            refresh={fresh}
                            onClick={() => {
                              // console.log(episode);
                              // saveOffline(episode.enclosures[0].url)
                              setOpen({
                                description: episode.description,
                                title: episode.title,
                              });
                            }}
                            history={episodeData}
                            episode={episode}
                          />
                          <ListItemIcon>
                            <IconButton
                              onClick={() => {
                                openDrawer(true);
                                setCurrentEpisode(episode.guid);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>

                            {/* <ShowProgress
                              guid={episode.guid}
                              episodeData={episodeData}
                            /> */}
                          </ListItemIcon>
                        </ListItem>
                        <Divider />
                      </div>
                    );
                  })}
                </List>

                {episodes.length > episodeList.length && (
                  <List align="center">
                    <Button
                      onClick={() => setAmount(amount + 1)}
                      variant="outlined"
                      style={{ width: "80%" }}
                      size="large"
                      color="primary"
                    >
                      {" "}
                      Load More Episodes{" "}
                    </Button>
                  </List>
                )}
              </>
            ) : (
              <div className={classes.progressContainer}>
                <CircularProgress className={classes.progress} />
              </div>
            )}
          </div>
        )}
      </Consumer>
    </>
  );
};

EpisodeList.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(EpisodeList);
