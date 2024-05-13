<template>
  <div style="display: flex; flex-direction: column; align-items: center">
    <div class="information">
      <div style="display: flex; align-items: center">
        <img
          style="width: 10px; padding: 10px"
          v-if="passwordExist"
          :src="require('../assets/lock.svg')"
          alt="locked" />
        <img style="width: 13px; padding: 10px" v-else :src="require('../assets/unlock.svg')" alt="unlocked" />
        <span class="roomTitle">{{ title }}</span>
        <div style="margin-left: 10px">
          <input type="text" placeholder="제목은 1자 이상 30자 이하로 입력해 주세요" v-model="changeRoomTitle" />
          <button @click="updateRoomTitle">변경</button>
        </div>
      </div>
      <div style="display: flex; align-items: center">
        <img style="width: 12px; padding: 8px" :src="require('../assets/user.png')" alt="nickname" />
        <span class="nickname">{{ nickname }}</span>
        <div style="margin-left: 10px">
          <input type="text" placeholder="닉네임은 1자 이상 20자 이하로 입력해 주세요" v-model="updateNicknameInput" />
          <button @click="updateNickname">변경</button>
        </div>
      </div>
    </div>
    <div class="frame">
      <div>
        <YouTube
          v-show="currentVideoId"
          @ready="onPlayerReady"
          @state-change="onPlayerStateChange"
          @playback-rate-change="onPlayerRateChange"
          ref="youtube" />
        <div class="participants">
          <ul>
            <li v-for="(item, idx) in participants" :key="idx">
              <form @submit.prevent="changeUserRole($event, item.userId)">
                아이디: {{ item.userId }}, 닉네임: {{ item.nickname }}, 역할: {{ item.role }}
                <select name="role">
                  <option selected disabled value="">선택해주세요</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="GUEST">Guest</option>
                  <option value="EDITOR">Editor</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HOST">Host</option>
                </select>
                <button type="submit">변경</button>
              </form>
            </li>
          </ul>
        </div>
      </div>
      <div>
        <div class="playlist">
          <button @click="addVideo">재생 목록에 영상 추가하기</button>
          <ul>
            <li class="video" v-for="item in playlist" :key="item.index">
              <img style="width: 112px; height: 65px" :src="item.thumbnail" />
              <div style="display: flex; flex-direction: column; justify-content: space-evenly">
                <span style="font-size: 12px; font-weight: 500"> {{ item.index }} == {{ item.videoNumber }} - {{ item.videoTitle }} </span>
                <span style="font-size: 11px; font-weight: 400">{{ item.channelTitle }}</span>
                <button @click="deleteVideo(item.videoNumber)">삭제</button>
              </div>
            </li>
          </ul>
        </div>
        <div class="chat">
          <ul class="messages">
            <li v-for="(item, idx) in messages" :key="idx">{{ this.getNickname(item.userId) }} : {{ item.content }}</li>
          </ul>
          <input type="text" v-model="message" @keypress.enter="sendMessage" />
        </div>
      </div>
    </div>
  </div>
  <div>
    <button @click="pauseVideo">일시정지</button>
    <button @click="startVideo">재생</button>
    배속 입력: <input type="text" v-model="currentRate" />
    <button @click="changeRate">전송</button>
    이동:
    <input type="text" v-model="changeTime" />
    <button @click="changeCurrentTime">변경</button>
    <button @click="playNextVideo">다음 영상 재생</button>
  </div>
</template>

<script>
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import axios from "axios";
import YouTube from "vue3-youtube";

axios.defaults.withCredentials = true;

export default {
  components: { YouTube },
  data() {
    return {
      title: null,
      nickname: "",
      updateNicknameInput: "",
      message: "",
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
      currentVideoId: null,
      playlist: [],
      videoAdd: null,
      passwordExist: false,
      currentTime: 0,
      currentRate: 1.0,
      changeTime: 0,
      iframeReadyFlag: false,
      nicknameMapper: new Map(),
    };
  },
  created() {
    this.enterRoom();
  },
  methods: {
    getNickname(userId) {
      console.log(userId);
      console.log(this.nicknameMapper.get(userId));
      return this.nicknameMapper.get(userId) || '💁🏻';
    },
    sendMessage() {
      if (this.message === "") {
        return;
      }

      this.ws.send(
        "/pub/messages/chat",
        JSON.stringify({
          roomCode: this.roomCode,
          content: this.message,
        })
      );
      this.message = "";
    },
    connect() {
      console.log("connect..." + this.enterSuccess);
      const sock = new SockJS(this.serverURL + "/stomp");
      this.ws = Stomp.over(sock);
      this.ws.reconnect_delay = 5000;

      if (!this.enterSuccess) {
        return;
      }

      this.ws.connect({}, () => {
        this.ws.subscribe("/sub/messages/rooms/" + this.roomCode, (message) => {
          const recv = JSON.parse(message.body);
          this.receiveMessage(recv);
        });
      });
    },
    receiveMessage(recv) {
      if (recv.messageType === "CHAT") {
        this.messages.push({
          userId: recv.userId,
          content: recv.content,
        });
        setTimeout(() => {
          let chattings = document.querySelector(".chat > ul");
          if (chattings != null) {
            chattings.scrollTop = chattings.scrollHeight;
          }
        }, 10);
      } else if (recv.messageType === "PARTICIPANTS") {
        this.participants = recv.participants;
        this.participants.forEach(participant => {
          this.nicknameMapper.set(participant.userId, participant.nickname);
          console.log(participant.userId);
          console.log('hey' + this.nicknameMapper.get(participant.userId));
        });

        this.nicknameMapper.set('', '');
      } else if (recv.messageType === "ROOM_TITLE") {
        this.title = recv.updatedTitle;
      } else if (recv.messageType === "PLAYLIST") {
        this.playlist = recv.playlist;
      } else if (recv.messageType === "VIDEO_SYNC_INFO") {
        if (recv.playerState === "END") {
          this.currentVideoId = null;
        }
        if (recv.playerState === "PLAY" && this.currentVideoId !== recv.videoId && this.iframeReadyFlag) {
          console.log("hey");
          this.currentVideoId = recv.videoId;
          this.$refs.youtube.loadVideoById(this.currentVideoId, recv.playerCurrentTime);
        }
      } else if (recv.messageType === "ALARM") {
        this.messages.push({
          content: recv.content,
        });
      }
    },
    async enterRoom() {
      console.log("enterRoom..." + this.roomCode);
      await axios
        .post(this.serverURL + "/rooms/" + this.roomCode)
        .then((res) => {
          this.nickname = res.data.data.user.nickname;
          this.enterSuccess = true;
          this.title = res.data.data.roomTitle;
          this.passwordExist = res.data.data.passwordExist;
          this.messages = res.data.data.chatHistories;
          this.connect();
        })
        .catch((err) => {
          console.log(err);
          this.enterSuccess = false;
          this.$router.push("/rooms");
        });
    },
    leave(event) {
      event.preventDefault();
      event.returnValue = "";
    },
    updateNickname() {
      console.log(this.updateNicknameInput);
      axios
        .patch(this.serverURL + "/users", {
          roomCode: this.roomCode,
          newNickname: this.updateNicknameInput,
        })
        .then((response) => {
          this.nickname = response.data.data.nickname;
        });
      this.updateNicknameInput = "";
    },
    changeUserRole(event, userId) {
      console.log(event);
      axios.patch(this.serverURL + "/users/role", {
        roomCode: this.roomCode,
        targetUserId: userId,
        newUserRole: event.target.role.value,
      });
      this.changeUserId = "";
      this.changeRole = "";
    },
    updateRoomTitle() {
      axios.patch(this.serverURL + "/rooms/title", {
        roomCode: this.roomCode,
        newTitle: this.changeRoomTitle,
      });
      this.changeRoomTitle = "";
    },

    onPlayerReady() {
      this.iframeReadyFlag = true;
      console.log("iframe Player Ready!!");
    },
    onPlayerStateChange() {
      // -1 – 시작되지 않음
      // 0 – 종료
      // 1 – 재생 중
      // 2 – 일시중지
      // 3 – 버퍼링
      // 5 – 동영상 신호

      console.log("현재 상태: " + this.$refs.youtube.getPlayerState());
      console.log("현재 시간: " + this.$refs.youtube.getCurrentTime());
    },
    onPlayerRateChange() {
      console.log("재생속도: " + this.$refs.youtube.getPlaybackRate());
    },

    addVideo() {
      axios.post(this.serverURL + "/playlists", {
        roomCode: this.roomCode,
        videoId: "TXI1npEFNss",
        videoTitle: "What a beautiful song by Sia ❤️ #snowman" + Math.floor(Math.random() * 101),
        channelTitle: "Raymond Salgado",
        thumbnail: "https://i.ytimg.com/vi/TXI1npEFNss/hqdefault.jpg",
        duration: "PT1M21S",
        videoUrl: this.videoAdd,
      });
      this.videoAdd = "";
    },

    deleteVideo(videoNumber) {
      axios.delete(this.serverURL + "/playlists/" + videoNumber);
    },

    pauseVideo() {
      this.ws.send(
        "/pub/messages/video",
        JSON.stringify({
          messageType: "VIDEO_SYNC_INFO",
          roomCode: this.roomCode,
          playerState: "PAUSE",
          playerCurrentTime: this.currentTime,
          playerRate: this.currentRate,
        })
      );
    },

    changeRate() {
      this.ws.send(
        "/pub/messages/video",
        JSON.stringify({
          messageType: "VIDEO_SYNC_INFO",
          roomCode: this.roomCode,
          playerState: "RATE",
          playerCurrentTime: this.currentTime,
          playerRate: this.currentRate,
        })
      );
    },

    startVideo() {
      this.ws.send(
        "/pub/messages/video",
        JSON.stringify({
          messageType: "VIDEO_SYNC_INFO",
          roomCode: this.roomCode,
          playerState: "PLAY",
          playerCurrentTime: this.currentTime,
          playerRate: this.currentRate,
        })
      );
    },

    changeCurrentTime() {
      this.ws.send(
        "/pub/messages/video",
        JSON.stringify({
          messageType: "VIDEO_SYNC_INFO",
          roomCode: this.roomCode,
          playerState: "SKIP",
          playerCurrentTime: this.changeTime,
          playerRate: this.currentRate,
        })
      );
      this.changeTime = 0;
    },

    playNextVideo() {
      axios.post(this.serverURL + "/playlists/next", {
        videoNumber: this.playlist[0].videoNumber
      });
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
};
</script>

<style scoped>
.information {
  width: 1000px;

  margin: auto 0;

  display: flex;
  justify-content: space-between;
  align-items: center;
}

.roomTitle {
  font-family: Pretendard;
  font-size: 17px;
  font-weight: 500;
}

.nickname {
  font-family: Pretendard;
  font-size: 13px;
  font-weight: 500;
}

.frame {
  width: 1000px;
  display: flex;

  justify-content: space-between;
}

.playlist {
  width: 300px;
  height: 200px;

  margin: 10px;

  border: solid 1px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.playlist > ul {
  width: inherit;
  height: 160px;

  padding: 0;
  margin: 10px 0px 10px 0px;

  overflow-x: hidden;
  overflow-y: auto;
}

.playlist > ul > li {
  width: 270px;
  min-height: 12px;

  list-style-type: none;

  padding: 5px 10px 5px 10px;

  color: #0f0f0f;

  font-family: Pretendard;
  font-size: 12px;
  font-weight: 400;

  text-align: left;
}

.video {
  display: flex;

  padding: 5px;
}

.chat {
  width: 300px;
  height: 300px;

  margin: auto;

  border: solid 1px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.chat > ul {
  width: inherit;
  height: 240px;

  padding: 0;
  margin: 10px 0px 10px 0px;

  overflow-x: hidden;
  overflow-y: auto;
}

.chat > ul > li {
  width: 270px;
  min-height: 12px;

  list-style-type: none;

  padding: 5px 10px 5px 10px;

  color: #0f0f0f;

  font-family: Pretendard;
  font-size: 12px;
  font-weight: 400;

  text-align: left;
}

.chat > input {
  width: 260px;
  height: 20px;

  padding: 8px 14px 8px 14px;

  border: none;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.05);

  font-family: Pretendard;
  font-size: 12px;
  font-weight: 400;

  transition: 0.4s all ease-in-out;
}

.chat > input:focus {
  outline: none;
  background-color: rgba(0, 0, 0, 0.03);
}

.participants > ul > li {
  width: 500px;
  min-height: 12px;

  list-style-type: none;

  padding: 5px 10px 5px 10px;

  color: #0f0f0f;

  font-family: Pretendard;
  font-size: 12px;
  font-weight: 400;

  text-align: left;
}
</style>
