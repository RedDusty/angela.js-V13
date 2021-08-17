const { MessageEmbed, CommandInteraction } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const Client = require('../../index').Client;
const ytdl = require('ytdl-core');
const { YTSearcher } = require('ytsearcher');
const fs = require('fs');

const musicQueue = require('../../index').musicQueue;
const { guild } = require('../../index');
const { join } = require('path');

const searcher = new YTSearcher({
  key: process.env.YT_API_KEY,
  revealKey: true
});

/**
 * @param {CommandInteraction} inter
 */
module.exports.run = async (inter) => {
  const channel_id = inter.member.voice.channelId;
  if (!channel_id) {
    return await inter.reply({
      content: 'Зайдите в голосовой канал, чтобы использовать музыкальные команды.',
      ephemeral: true
    });
  } else {
    let connection = null;
    if (inter.options.getSubcommand() === 'play') {
      const value = inter.options.getString('поиск');
      // ONE VIDEO BY NAME
      if (value.substr(0, 8) !== 'https://') {
        const result = await searcher.search(value, { type: 'video' });

        if (!result.currentPage[0].url) {
          inter.reply({ content: 'Ничего не найдено.', ephemeral: true });
        }

        ytdl(result.currentPage[0].url, { filter: 'audioonly' }).pipe(fs.createWriteStream('temp/video.mp4'));

        musicQueue.get('queue').push(result.currentPage[0].url);

        connection = await joinVoiceChannel({
          channelId: channel_id,
          guildId: guild,
          adapterCreator: inter.guild.voiceAdapterCreator
        });

        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause
          }
        });

        const audio = createAudioResource(ytdl(result.currentPage[0].url, { filter: 'audioonly', quality: 'highest' }));

        console.log(audio);

        player.play(audio);

        connection.subscribe(player);

        return await inter.reply({ content: result.currentPage[0].url });
      }
      // ONE VIDEO BY URL
      if (value.substr(0, 17) === 'https://youtu.be/' || value.substr(0, 29) === 'https://www.youtube.com/watch') {
      }

      // PLAYLIST BY URL
      if (value.substr(0, 32) === 'https://www.youtube.com/playlist') {
      }
    }
    if (inter.options.getSubcommand() === 'stop') {
      if (connection) connection.destroy();
    }
  }

  return await inter.reply({ content: 'music', ephemeral: false });
};

module.exports.help = {
  name: 'music',
  permission: []
};
