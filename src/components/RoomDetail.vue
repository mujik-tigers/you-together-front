<template>
  <h1>채팅방 안</h1>
  <input type="text" v-model="message" @keyup.enter="sendMessage">
  <h1>=====</h1>
  <ul>
    <li v-for="(item, idx) in messages" :key="idx">
      {{ item.nickname }} - {{ item.content }}
    </li>
  </ul>
  <h1>=======</h1>
  <h1>내 닉네임 - {{ nickname }}</h1>
  <input type="text" v-model="updateNicknameInput">
  <button @click="updateNickname">닉네임 변경하기</button>
  <h1>======</h1>
  <h2>참가인원</h2>
  <ul>
    <li v-for="(item, idx) in participants" :key="idx">
      유저아이디: {{ item.userId }}, 닉네임: {{ item.nickname }}, 역할: {{ item.role }}
    </li>
  </ul>
  <div>
    <h1>이녀석 역할 바꾸기</h1>
    유저 아이디 입력 <input type="text" v-model="changeUserId">
    바꿀 역할 입력 <input type="text" v-model="changeRole">
    <button @click="downGradeUser"> 클릭 </button>
  </div>
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
      updateNicknameInput: '',
      message: '',
      messages: [],
      participants: [],
      roomCode: this.$route.params.roomCode,
      serverURL: "http://localhost:8080",
      // serverURL: "https://you-together.site",
      ws: null,
      enterSuccess: false,
      changeUserId: null,
      changeRole: null,
    }
  },
  created() {
    this.enterRoom();
    setTimeout(() => this.connect(), 300);
  },
  methods: {
    sendMessage() {
      this.ws.send("/pub/messages", JSON.stringify({
        roomCode: this.roomCode,
        content: this.message
      }));
      this.message = '';
    },
    connect() {
      console.log('connect...' + this.enterSuccess);
      const sock = new SockJS(this.serverURL + "/stomp");
      this.ws = Stomp.over(sock);
      this.ws.reconnect_delay = 5000;

      if (!this.enterSuccess) {
        return;
      }

      this.ws.connect({}, () => {
        this.ws.subscribe("/sub/messages/rooms/" + this.roomCode, message => {
          const recv = JSON.parse(message.body);
          this.receiveMessage(recv);
        });
      });
    },
    receiveMessage(recv) {
      if (recv.messageType === 'CHAT') {
        this.messages.unshift({
          nickname: recv.nickname,
          content: recv.content
        })
      } else if (recv.messageType === 'PARTICIPANTS_INFO') {
        this.participants = recv.participants;
      }

    },
    async enterRoom() {
      console.log('enterRoom...' + this.roomCode);
      await axios.post(this.serverURL + '/rooms/' + this.roomCode)
          .then((res) => {
            console.log(res);
            this.nickname = res.data.data.nickname;
            this.enterSuccess = true;
          })
          .catch((err) => {
            console.log(err);
            this.enterSuccess = false;
            this.$router.push('/rooms');
          });
    },
    leave(event) {
      event.preventDefault();
      event.returnValue = '';
    },
    updateNickname() {
      console.log(this.updateNicknameInput);
      axios.patch(this.serverURL + '/users', {
        roomCode: this.roomCode,
        updateNickname: this.updateNicknameInput
      })
          .then(response => {
            this.nickname = response.data.data.nickname;
          });
      this.updateNicknameInput = '';
    },
    downGradeUser() {
      axios.patch(this.serverURL + '/users/change-role', {
        roomCode: this.roomCode,
        changedUserId: this.changeUserId,
        changeUserRole: this.changeRole
      });
      this.changeUserId = '';
      this.changeRole = '';
    },
  },
  beforeRouteLeave(to, from, next) {
    if (this.ws !== null) {
      this.ws.disconnect();
    }
    next();
  },
  // mounted() {
  //   window.addEventListener('beforeunload', this.leave)
  // },
  // beforeUnmount() {
  //   window.removeEventListener('beforeunload', this.leave)
  // }
}
</script>

