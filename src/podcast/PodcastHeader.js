import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from "@material-ui/core/IconButton";
import Grid from "@material-ui/core/Grid";
import Favorite from "@material-ui/icons/Bookmark";
import BookmarkBorderIcon from "@material-ui/icons/BookmarkBorder";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import { clearText } from "./EpisodeList";
import { Consumer } from "../App.js";

const styles = (theme) => ({
  card: {
    display: "flex",
  },
  details: {
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: "1 0 auto",
  },
  cover: {
    width: 80,
    margin: 10,
    height: 40,
    padding: 40,
  },
  playIcon: {
    height: 38,
    width: 38,
  },
  addToLibrary: {
    float: "right",
  },
  desc: {
    maxHeight: "100px",
    overflow: "hidden",
  },
  title: {
    whiteSpace: "pre-wrap",
  },
});

function PodcastHeader(props) {
  const { classes, inLibrary, savePodcastToLibrary, removePodcast } = props;
  const isInLibrary = inLibrary();
  return (
    <Consumer>
      {({ state }) => (
        <>
          <AppBar position="static">
            <Toolbar variant="dense">
              <Grid container>
                <Grid item xs={6}>
                  <Typography variant="h6">Podcast</Typography>
                </Grid>
                <Grid item xs={6}>
                  {isInLibrary ? (
                    <IconButton
                      className={classes.addToLibrary}
                      color="secondary"
                      size="medium"
                      onClick={removePodcast}
                      aria-label="Remove from Library"
                    >
                      <Favorite />
                    </IconButton>
                  ) : (
                    <Tooltip title="Add to Library" placement="bottom">
                      <IconButton
                        size="medium"
                        color="secondary"
                        onClick={savePodcastToLibrary}
                        className={classes.addToLibrary}
                      >
                        <BookmarkBorderIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Grid>
              </Grid>
            </Toolbar>
          </AppBar>
          <Card className={classes.card}>
            {state.image && (
              <CardMedia
                className={classes.cover}
                image={state.image}
                title={`${state.title} cover`}
              />
            )}
            <div className={classes.details}>
              <CardContent className={classes.content}>
                <Typography className={classes.title} variant="h4" noWrap>
                  {state.title}
                </Typography>
                <Typography className={classes.desc} color="textSecondary">
                  {clearText(state.description)}
                </Typography>
              </CardContent>
            </div>
          </Card>
        </>
      )}
    </Consumer>
  );
}

PodcastHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(PodcastHeader);
