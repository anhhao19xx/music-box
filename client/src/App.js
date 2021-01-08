import { Component } from 'react';
import './App.css';
import MusicIcon from './music.svg';
import PlayIcon from './play.svg';
import PauseIcon from './pause.svg';
import SyncIcon  from './sync.svg';
import DiskIcon from './disk.jpg';
import RabbitLyrics from 'rabbit-lyrics';
import Parse from 'parse';
import axios from 'axios';

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      id: null,
      songs: [],
      source: null,
      isPlaying: false,
      canPlay: false,
      subtitle: '',
      // timeline
      duration: 0,
      current: 0,
      position: -1,
      positionLabel: ''
    };

    this.togglePlay = this.togglePlay.bind(this);
    this.play = this.play.bind(this);

    // audio ref tag
    this.audio = null;
    this.subtitle = null;
    this.timeline = null;

    this.setAudio = node => {
      this.audio = node;
    };

    this.setSubtitle = node => {
      this.subtitle = node;
    };

    this.setTimeline = node => {
      this.timeline = node;
    }

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
        console.log('Song ended');
        this.play((this.state.id + 1) % this.state.songs.length);
      });

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio)
          this.setState({
            current: this.audio.currentTime
          });
      });

      this.timeline.addEventListener('mousemove', e => {
        const percent = e.layerX/this.timeline.offsetWidth;
        let positionLabel = '';

        if (!this.audio || !this.state.duration){
          return;
        }

        positionLabel = percent * this.state.duration;

        this.setState({ position: e.layerX, positionLabel });
      });

      this.timeline.addEventListener('mouseout', e => {
        this.setState({ position: -1 });
      });

      this.timeline.addEventListener('click', e => {
        const percent = e.layerX/this.timeline.offsetWidth;

        if (this.audio && this.state.duration){
          this.audio.currentTime = percent * this.state.duration;
        }
      });
    };

    // init parse
    // Parse.initialize('myappID', 'mymasterKey')
    // Parse.serverURL = "http://localhost:1337/parse/";
  }

  async componentDidMount(){
    // fetch song list
    // const songs = await Parse.Cloud.run("songs");
    const { data: songs } = await axios.get('http://localhost:3000/songs')

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
            <div className="timeline" ref={ this.setTimeline }>
              <div className="current" style={{ width: this.state.current/this.state.duration*100 + '%'}}></div>
              { this.state.position !== -1 ? (
                <div className="tooltip" style={{ left: this.state.position }}>{ this.formatTime(this.state.positionLabel) }</div>
              ) : ''}
            </div>
          </div>
          <div className="info">
            <div className="song">{ this.state.canPlay ? (this.state.songs.filter(s => s.id === this.state.id)[0] || {}).name : 'Loading...' }</div>
            <div className="singer">{ this.state.canPlay ? (this.state.songs.filter(s => s.id === this.state.id)[0] || {}).singer : '' }</div>
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
    console.log(`Play song ${songid}`);
    // find song
    const song = this.state.songs.filter(s => s.id === songid)[0];

    if (!song)
      return;

    // fetch song
    // const data = await Parse.Cloud.run("getsong", {
    //   url: song.url
    // });

    const { data } = await axios.get(`http://localhost:3000/getsong/${encodeURIComponent(song.url)}`);

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

  formatTime(seconds){
    const min = Math.floor(seconds/60);
    seconds = Math.floor(seconds % 60);
    return `${min}:${seconds}`
  }
}

export default App;
