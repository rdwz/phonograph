import React from 'react';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import Avatar from 'material-ui/Avatar';
import {grey400, darkBlack, lightBlack, blue300} from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import PlayButton from 'material-ui/svg-icons/av/play-arrow';
import PauseButton from 'material-ui/svg-icons/av/pause';
import IconButton from 'material-ui/IconButton';

const iconButtonElement = (
  <IconButton
    touch={true}
    tooltip="more"
    tooltipPosition="bottom-left"
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

const rightIconMenu = (
  <IconMenu iconButtonElement={iconButtonElement}>
    <MenuItem>Queue</MenuItem>
    <MenuItem>Mark As Listened</MenuItem>
    <MenuItem>Delete</MenuItem>
  </IconMenu>
);

const clickHanlder = (play,pause,status) => {
  console.log(play,pause,status);
  if(!status) return play;
  return status === 'pause' ? play : pause;
};

const EpisodeList = (props) => (
  <MuiThemeProvider>
      <List>
        {props.episodes && props.episodes.map(episode =>
        <div>
        <ListItem key={episode.guid} onClick={ props.handler } data-guid={episode.guid}
          leftAvatar={<Avatar color={darkBlack}  
                      backgroundColor={lightBlack} 
                      icon={ (props.playing === episode.guid && props.status != 'pause') ? <PauseButton /> : <PlayButton />} />}
                      primaryText={episode.title}
          rightIconButton={rightIconMenu}
          secondaryText={
            <p>{episode.content}</p>
          }
          secondaryTextLines={2}
        /><Divider />
        </div>)
        }
      </List>
  </MuiThemeProvider>)


export default EpisodeList;