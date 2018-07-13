import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
// import InfoIcon from '@material-ui/icons/Info';
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import Add from '@material-ui/icons/Add';
import {getPodcastColor,cachedContent} from '../engine/podcast';
import {viewCurrenPodcast} from '../engine/routes';

export const styles = theme => ({
  podcastMedia:{
    paddingTop: '100%',
    position:'relative',
    cursor: 'pointer'
  },
  podcastData:{
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color:'000',
    position:'absolute',
    bottom:0,
    width:'100%'
  },
  cardContent: {
      position:'absolute'
      ,width:0
  },
  relativeContainer:{
    position:"relative"
  },
  addIcon:{
    width:'3em',
    height:'3em'
  },
  card:{
    height:'100%',
    width:'100%'
  }
});
const addMore = 'addmore';

const getMyColor = (cast) =>(cast.domain === addMore) ? {backgroundColor:'white'}: getPodcastColor(cast);

function PodCastGrid(props) {
  const { classes } = props;
  let casts = (props.podcasts && [...props.podcasts]) || [];
  
casts.push({domain: addMore, title:'Add more', onClick:()=>{ props.addPodcastHandler(viewCurrenPodcast)} });

  return (
    <Grid container spacing={0} direction={'row'}>
      { casts && casts.map(cast =>
        <Grid item xs={3} sm={2} md={1} key={cast.domain} >
          <Card classes={{root:classes.card}} style={getMyColor(cast)}>
            { cast.domain === addMore
            ? <IconButton onClick={cast.onClick} classes={{root:classes.card}}>
                <Add classes={{root:classes.addIcon}} />
              </IconButton>
            : <div className={classes.relativeContainer}>
                <CardContent className={classes.cardContent}>
                  {cast.title}
                </CardContent>
                <CardMedia 
                  onClick={props.selectPodcast} 
                  domain={cast.domain} title={cast.title} 
                  className={classes.podcastMedia} 
                  image={cast.image}
                />
              </div>}
          </Card>
        </Grid> 
       )}
    </Grid>
  );
}

PodCastGrid.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PodCastGrid);
