<template>
  <h1>채팅방 안</h1>
  <input type="text" v-model="message" @keyup.enter="sendMessage">
  <h1>=====</h1>
  <ul>
    <li v-for="(item, idx) in messages" :key="idx">
      {{ item.username }} - {{ item.content }}
    </li>
  </ul>
  <h1>=======</h1>
  <h1>내 닉네임 - {{ nickname }}</h1>
  <h1>======</h1>
  <h2>참가인원</h2>
  <ul>
    <li v-for="(item, idx) in participants" :key="idx">
      {{ item }}
    </li>
  </ul>
</template>

<script>
import SockJS from 'sockjs-client'
import Stomp from 'webstomp-client'
import axios from "axios";

axios.defaults.withCredentials = true;

export default {
  data() {
    return {
      nickname: '',
      message: '',
      messages: [],
      participants: [],
      roomId: this.$route.params.roomId,
      serverURL: "http://localhost:8080",
      ws: null
    }
  },
  created() {
    this.enterRoom();
    setTimeout(() => this.connect(), 100);
  },
  methods: {
    sendMessage() {
      this.ws.send("/pub/chat/message", JSON.stringify({
        roomId: this.roomId,
        content: this.message
      }));
      this.message = '';
    },
    connect() {
      console.log('connect...')
      const sock = new SockJS(this.serverURL + "/ws-stomp");
      this.ws = Stomp.over(sock);

      this.ws.connect({}, () => {
        this.ws.subscribe("/sub/chat/room/" + this.roomId, message => {
          const recv = JSON.parse(message.body);
          this.receiveMessage(recv);
        });
      }, () => {
        axios.get(this.serverURL + "/test")
            .then((res) => {
              console.log(res);
            })
            .catch(err => {
              console.log(err);
            });
      });
    },
    receiveMessage(recv) {
      if (recv.messageType === 'CHAT') {
        this.messages.unshift({
          username: recv.username,
          content: recv.content
        })
      } else if (recv.messageType === 'PARTICIPANT_INFO') {
        this.participants = recv.participantNames;
      }

    },
    async enterRoom() {
      await axios.get(this.serverURL + '/rooms/' + this.roomId)
          .then(() => {
            console.log('enter room..');
          })
          .catch(error => {
            console.log(error)
          });
      this.fetchNickname();
    },
    fetchNickname() {
      console.log('fetch nickname..');
      axios.get(this.serverURL + '/user/nickname')
          .then(response => {
            this.nickname = response.data.data.nickname;
          })
          .catch(error => {
            console.log(error);
          });
    },
  }
}

</script>

