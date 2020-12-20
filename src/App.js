import { Component } from 'react';
import './App.css';
import MusicIcon from './music.svg';
import PlayIcon from './play.svg';
import PauseIcon from './pause.svg';
import SyncIcon  from './sync.svg';
import DiskIcon from './disk.jpg';
import RabbitLyrics from 'rabbit-lyrics';
import Parse from 'parse';

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      id: null,
      songs: [],
      source: null,
      isPlaying: false,
      duration: 0,
      current: 0,
      canPlay: false,
      subtitle: ''
    };

    this.togglePlay = this.togglePlay.bind(this);
    this.play = this.play.bind(this);

    // audio ref tag
    this.audio = null;
    this.subtitle = null;

    this.setAudio = node => {
      this.audio = node;
    };

    this.setSubtitle = node => {
      this.subtitle = node;
    };

    // ref event
    this.updateAudioEvent = () => {
      this.audio.addEventListener('canplaythrough', () => {
        this.setState({
          canPlay: true,
          duration: this.audio.duration
        });
        
        if (this.state.isPlaying)
          this.audio.play();

      }, false);

      this.audio.addEventListener('ended', () => {
        this.play((this.id + 1) % this.state.songs.length);
      });

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio)
          this.setState({
            current: this.audio.currentTime
          });
      });
    };

    // init parse
    Parse.initialize("zfl6LEImkcfigB4k03nglOykQKQhYrDGQ5RKq0kR", "YKm75a35cnMDJnPe4T7iMyMrdee2TgKt74DwAbvf");
    Parse.serverURL = "https://parseapi.back4app.com/";
  }

  async componentDidMount(){
    // fetch song list
    const songs = await Parse.Cloud.run("songs");

    this.setState({ songs });

    // play song 
    this.updateAudioEvent();
    this.play(Math.floor(Math.random() * songs.length));
  }

  componentWillUnmount(){

  }

  componentDidUpdate(prevProps, prevState){
    if (prevState.subtitle !== this.state.subtitle && this.subtitle && this.audio){
      const newelm = document.createElement('div');
      this.subtitle.innerHTML = '';
      this.subtitle.appendChild(newelm);

      newelm.innerHTML = this.state.subtitle;

      new RabbitLyrics({
        element: newelm,
        mediaElement: this.audio
      });
    }
  }

  render(){
    return (
      <div className="App">
        <div className="player">
          <audio 
            id="audio" 
            src={ this.state.source } 
            controls 
            ref={ this.setAudio }/>

          <div className="subtitle-wrapper">
            <div className="subtitle" ref={ this.setSubtitle }></div>
            { this.state.subtitle.trim() === '' ? (
              <div className="disk" isplaying={ this.state.isPlaying ? 'true' : 'false' }>
                <img src={ DiskIcon } alt="disk"/>
              </div>
              ) : ''
            }
            
          </div>
          <div className="timeline-wrapper">
            <div className="timeline">
              <div className="current" style={{ width: this.state.current/this.state.duration*100 + '%'}}></div>
            </div>
          </div>
          <div className="info">
            <div className="song">{ (this.state.songs.filter(s => s.id === this.state.id)[0] || {}).name }</div>
            <div className="singer">{ (this.state.songs.filter(s => s.id === this.state.id)[0] || {}).singer }</div>
          </div>
          <div className="control">
            <button className="play" onClick={() => this.togglePlay()} disabled={ !this.state.canPlay }>
              <img src={this.state.canPlay ? (this.state.isPlaying ? PauseIcon : PlayIcon) : SyncIcon } alt="play icon"/>
            </button>
          </div>
        </div>
        <div className="playlist">
          { this.state.songs.map(song => 
            <button className="song" key={song.id} iscurrent={ song.id === this.state.id ? 'true' : 'false' } onClick={ () => this.play(song.id) }>
              <div className="name">
                { song.name }
              </div>
              <div className="icon">
                <img src={MusicIcon} alt="music play"/>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  async play(songid){
    // find song
    const song = this.state.songs.filter(s => s.id === songid)[0];

    if (!song)
      return;

    // fetch song
    const data = await Parse.Cloud.run("getsong", {
      url: song.url
    });

    this.setState(Object.assign({ 
      id: songid,
      canPlay: false,
      duration: 0,
      current: 0,
      source: '',
      subtitle: ''
    }, data));
  }

  togglePlay(){
    this.setState((state) => {
      const isPlaying = !state.isPlaying;

      if (this.audio && isPlaying){
        this.audio.play();
      }
      
      if (this.audio && !isPlaying){
        this.audio.pause();
      }

      return {
        isPlaying: !state.isPlaying
      }
    });
  }
}

export default App;
