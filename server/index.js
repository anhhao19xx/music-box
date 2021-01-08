'use strict';

const Hapi = require('@hapi/hapi');
const axios = require('axios');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
  });

  server.route({
    method: 'GET',
    path: '/songs',
    options: {
      cors: true,
    },
    handler: async (request, h) => {
      const { data: raw } = await axios.get('https://chiasenhac.vn/nhac-hot/chinese.html');

      const r_song = /<div class="tool d-table-cell text-right">(.|\r|\n)*?<a.*?href="(.*?)"((.|\r|\n)*?)addPlaylistTable\('(.*?)', '(.*?)', '(.*?)', '(.*?)'\)/gm;

      let id = 0;

      const songs = [];
      do {
        let rel = r_song.exec(raw);
        if (!rel)
          break;

        songs.push({
          id: id++,
          url: rel[2],
          name: rel[5],
          singer: rel[7]
        }); 
      } while(true);

      return songs;
    }
  });

  server.route({
    method: 'GET',
    path: '/getsong/{url}',
    options: {
      cors: true,
    },
    handler: async function (request, h) {
      const { url } = request.params;
      const { data: raw } = await axios.get(url);

      const r_source = /"file": "(.*?)"/gm;
      const source = r_source.exec(raw)[1];

      const r_subtitle = /class="rabbit-lyrics">((.|\r|\n)*?)<\/div>/gm;

      const subtitle = (r_subtitle.exec(raw) || [])[1] || '';
      
      return {
        url,
        source,
        subtitle
      };
    }
  });


  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();