<template>
  <h1>{{ title }}</h1>
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
      유저아이디: {{ item.id }}, 닉네임: {{ item.nickname }}, 역할: {{ item.role }}
    </li>
  </ul>
  <div>
    <h1>이녀석 역할 바꾸기</h1>
    유저 아이디 입력 <input type="text" v-model="changeUserId">
    바꿀 역할 입력 <input type="text" v-model="changeRole">
    <button @click="changeUserRole"> 클릭</button>
  </div>
  <div>
    <h1>방 제목 바꾸기</h1>
    바꿀 방 제목 입력 <input type="text" v-model="changeRoomTitle">
    <button @click="updateRoomTitle">변경</button>
  </div>
  <div>
    <h1>유튜브 </h1>
    플레이 리스트 추가하기 <input type="text" v-model="videoAdd">
    <button @click="addVideo">추가하기</button>
    <YouTube
        :src="videoLink"
        @ready="onPlayerReady"
        @state-change="onPlayerStateChange"
        @playback-rate-change="onPlayerRateChange"
        ref="youtube"/>
  </div>
</template>

<script>
import SockJS from 'sockjs-client'
import Stomp from 'webstomp-client'
import axios from "axios";
import YouTube from "vue3-youtube";

axios.defaults.withCredentials = true;

export default {
  components: {YouTube},
  data() {
    return {
      title: null,
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
      changeRoomTitle: null,
      videoLink: null,
      videoAdd:null
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
      } else if (recv.messageType === 'PARTICIPANTS') {
        this.participants = recv.participants;
      } else if (recv.messageType === 'ROOM_TITLE') {
        this.title = recv.updatedTitle;
      } else if (recv.messageType === 'PLAY_VIDEO_INFO') {
        this.videoLink = recv.videoUrl;
      }

    },
    async enterRoom() {
      console.log('enterRoom...' + this.roomCode);
      await axios.post(this.serverURL + '/rooms/' + this.roomCode)
          .then((res) => {
            console.log(res);
            this.nickname = res.data.data.user.nickname;
            this.enterSuccess = true;
            this.title = res.data.data.roomTitle;
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
        newNickname: this.updateNicknameInput
      })
          .then(response => {
            this.nickname = response.data.data.nickname;
          });
      this.updateNicknameInput = '';
    },
    changeUserRole() {
      axios.patch(this.serverURL + '/users/role', {
        roomCode: this.roomCode,
        targetUserId: this.changeUserId,
        newUserRole: this.changeRole
      });
      this.changeUserId = '';
      this.changeRole = '';
    },
    updateRoomTitle() {
      axios.patch(this.serverURL + '/rooms/title', {
        roomCode: this.roomCode,
        newTitle: this.changeRoomTitle
      });
      this.changeRoomTitle = '';
    },

    onPlayerReady() {
      this.$refs.youtube.playVideo()
    },
    onPlayerStateChange() {
      // -1 – 시작되지 않음
      // 0 – 종료
      // 1 – 재생 중
      // 2 – 일시중지
      // 3 – 버퍼링
      // 5 – 동영상 신호

      console.log('현재 상태: ' + this.$refs.youtube.getPlayerState());
      console.log('현재 시간: ' + this.$refs.youtube.getCurrentTime());
    },
    onPlayerRateChange() {
      console.log('재생속도: ' + this.$refs.youtube.getPlaybackRate());
    },

    addVideo() {
      axios.post(this.serverURL + '/playlists', {
        roomCode: this.roomCode,
        videoUrl: this.videoAdd
      });
      this.videoAdd = '';
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

